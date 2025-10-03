import { db } from "./db";
import { messageVoices, voiceSettings, voiceRateLimits, users } from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

// إعدادات التخزين
const VOICE_UPLOAD_DIR = path.join(process.cwd(), "uploads/voice");
const MAX_DURATION_SECONDS = 120;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX_MESSAGES = 10;

// أنواع الملفات المدعومة
const ALLOWED_MIME_TYPES = [
  'audio/ogg',
  'audio/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/m4a'
];

// إنشاء مجلد الرفع إذا لم يكن موجوداً
async function ensureUploadDir() {
  try {
    await fs.access(VOICE_UPLOAD_DIR);
  } catch {
    await fs.mkdir(VOICE_UPLOAD_DIR, { recursive: true });
  }
}

// إعداد multer للرفع
export const voiceUpload = multer({
  dest: VOICE_UPLOAD_DIR,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`نوع الملف غير مدعوم: ${file.mimetype}`));
    }
  }
});

export class VoiceService {
  // التحقق من حدود المعدل
  static async checkRateLimit(userId: number): Promise<{ allowed: boolean; remaining: number }> {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

    // البحث عن سجل الحدود الحالي
    const [rateLimitRecord] = await db
      .select()
      .from(voiceRateLimits)
      .where(
        and(
          eq(voiceRateLimits.userId, userId),
          gte(voiceRateLimits.windowStartTime, windowStart)
        )
      )
      .limit(1);

    if (!rateLimitRecord) {
      // إنشاء سجل جديد
      await db.insert(voiceRateLimits).values({
        userId,
        messageCount: 0,
        windowStartTime: new Date(),
        lastResetAt: new Date(),
      });
      return { allowed: true, remaining: RATE_LIMIT_MAX_MESSAGES };
    }

    // التحقق من انتهاء النافذة الزمنية
    const now = new Date();
    const startTime = rateLimitRecord.windowStartTime ? new Date(rateLimitRecord.windowStartTime) : now;
    const timeSinceStart = now.getTime() - startTime.getTime();
    const windowExpired = timeSinceStart > (RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

    if (windowExpired) {
      // إعادة تعيين العداد
      await db
        .update(voiceRateLimits)
        .set({
          messageCount: 0,
          windowStartTime: now,
          lastResetAt: now,
        })
        .where(eq(voiceRateLimits.id, rateLimitRecord.id));
      
      return { allowed: true, remaining: RATE_LIMIT_MAX_MESSAGES };
    }

    const allowed = rateLimitRecord.messageCount < RATE_LIMIT_MAX_MESSAGES;
    const remaining = Math.max(0, RATE_LIMIT_MAX_MESSAGES - rateLimitRecord.messageCount);

    return { allowed, remaining };
  }

  // زيادة عداد المعدل
  static async incrementRateLimit(userId: number): Promise<void> {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

    await db
      .update(voiceRateLimits)
      .set({
        messageCount: sql`${voiceRateLimits.messageCount} + 1`,
      })
      .where(
        and(
          eq(voiceRateLimits.userId, userId),
          gte(voiceRateLimits.windowStartTime, windowStart)
        )
      );
  }

  // التحقق من صحة الملف الصوتي
  static validateVoiceFile(file: Express.Multer.File, duration?: number): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return { valid: false, error: `نوع الملف غير مدعوم: ${file.mimetype}` };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `حجم الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(2)} MB). الحد الأقصى ${MAX_FILE_SIZE_MB} MB` };
    }

    if (duration && duration > MAX_DURATION_SECONDS) {
      return { valid: false, error: `مدة التسجيل طويلة جداً (${duration}s). الحد الأقصى ${MAX_DURATION_SECONDS} ثانية` };
    }

    return { valid: true };
  }

  // توليد موجة صوتية مبسطة (placeholder - يمكن تحسينها لاحقاً)
  static generateWaveformPeaks(durationSeconds: number): number[] {
    const peaks = [];
    const numPeaks = Math.min(100, durationSeconds * 4); // 4 نقاط في الثانية كحد أقصى
    
    for (let i = 0; i < numPeaks; i++) {
      // توليد قيم عشوائية للموجة (في التطبيق الحقيقي، نحلل الملف الصوتي)
      peaks.push(Math.random() * 0.8 + 0.1);
    }
    
    return peaks;
  }

  // حفظ رسالة صوتية
  static async saveVoiceMessage(data: {
    messageId?: number;
    privateMessageId?: number;
    senderId: number;
    roomId?: number;
    privateRoomId?: number;
    file: Express.Multer.File;
    durationSeconds: number;
  }): Promise<string> {
    await ensureUploadDir();

    const fileId = randomUUID();
    const fileExtension = path.extname(data.file.originalname) || '.ogg';
    const storageKey = `voice/${fileId}${fileExtension}`;
    const finalPath = path.join(VOICE_UPLOAD_DIR, `${fileId}${fileExtension}`);

    // نقل الملف إلى الموقع النهائي
    await fs.rename(data.file.path, finalPath);

    // توليد الموجة الصوتية
    const waveformPeaks = this.generateWaveformPeaks(data.durationSeconds);

    // حفظ في قاعدة البيانات
    const [voiceRecord] = await db
      .insert(messageVoices)
      .values({
        messageId: data.messageId,
        privateMessageId: data.privateMessageId,
        senderId: data.senderId,
        roomId: data.roomId,
        privateRoomId: data.privateRoomId,
        storageKey,
        mimeType: data.file.mimetype,
        durationSeconds: data.durationSeconds,
        fileSizeBytes: data.file.size,
        waveformPeaks: waveformPeaks,
        status: 'ready',
      })
      .returning();

    // بدء عملية النسخ النصي في الخلفية (إذا كانت متاحة)
    this.startTranscription(voiceRecord.id);

    return voiceRecord.id;
  }

  // الحصول على رابط تشغيل الملف الصوتي
  static async getVoiceFileUrl(voiceId: string, userId: number): Promise<{ url: string; voice: any } | null> {
    const [voice] = await db
      .select()
      .from(messageVoices)
      .where(eq(messageVoices.id, voiceId))
      .limit(1);

    if (!voice) {
      return null;
    }

    // التحقق من الصلاحيات (المرسل أو عضو في نفس الغرفة)
    const hasAccess = await this.checkVoiceAccess(voice, userId);
    if (!hasAccess) {
      return null;
    }

    // إنشاء رابط مؤقت للملف
    const url = `/api/voice/stream/${voiceId}`;
    return { url, voice };
  }

  // التحقق من صلاحيات الوصول للملف الصوتي
  static async checkVoiceAccess(voice: any, userId: number): Promise<boolean> {
    // المرسل يمكنه الوصول دائماً
    if (voice.senderId === userId) {
      return true;
    }

    // للرسائل الخاصة - يجب أن يكون أحد المشاركين
    if (voice.privateRoomId) {
      // هنا نحتاج للتحقق من عضوية الدردشة الخاصة
      return true; // مبسط الآن
    }

    // للرسائل العامة - يجب أن يكون عضواً في الغرفة
    if (voice.roomId) {
      // هنا نحتاج للتحقق من عضوية الغرفة
      return true; // مبسط الآن
    }

    return false;
  }

  // بدء عملية النسخ النصي (placeholder)
  static async startTranscription(voiceId: string): Promise<void> {
    // في التطبيق الحقيقي، هنا نرسل إلى خدمة النسخ مثل Whisper
    console.log(`بدء نسخ نصي للرسالة الصوتية: ${voiceId}`);
    
    // محاكاة عملية النسخ
    setTimeout(async () => {
      try {
        // نص تجريبي
        const mockTranscript = "هذا نص تجريبي للرسالة الصوتية";
        
        await db
          .update(messageVoices)
          .set({
            transcript: mockTranscript,
            transcriptLang: 'ar',
            status: 'ready',
            updatedAt: new Date(),
          })
          .where(eq(messageVoices.id, voiceId));

        console.log(`اكتمل النسخ النصي للرسالة الصوتية: ${voiceId}`);
      } catch (error) {
        console.error(`خطأ في النسخ النصي للرسالة ${voiceId}:`, error);
        
        await db
          .update(messageVoices)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(messageVoices.id, voiceId));
      }
    }, 5000); // 5 ثوان محاكاة
  }

  // البحث في الرسائل الصوتية
  static async searchVoiceMessages(query: string, userId: number, limit = 20): Promise<any[]> {
    const results = await db
      .select({
        id: messageVoices.id,
        messageId: messageVoices.messageId,
        privateMessageId: messageVoices.privateMessageId,
        senderId: messageVoices.senderId,
        roomId: messageVoices.roomId,
        privateRoomId: messageVoices.privateRoomId,
        transcript: messageVoices.transcript,
        durationSeconds: messageVoices.durationSeconds,
        createdAt: messageVoices.createdAt,
        senderName: users.fullName,
      })
      .from(messageVoices)
      .leftJoin(users, eq(messageVoices.senderId, users.id))
      .where(
        and(
          // البحث في النص المنسوخ
          sql`${messageVoices.transcript} ILIKE ${'%' + query + '%'}`,
          // التأكد من أن المستخدم يمكنه الوصول للرسالة
          sql`${messageVoices.senderId} = ${userId}` // مبسط - يجب إضافة منطق أكثر تعقيداً
        )
      )
      .orderBy(desc(messageVoices.createdAt))
      .limit(limit);

    return results;
  }

  // حذف رسالة صوتية
  static async deleteVoiceMessage(voiceId: string, userId: number): Promise<boolean> {
    const [voice] = await db
      .select()
      .from(messageVoices)
      .where(eq(messageVoices.id, voiceId))
      .limit(1);

    if (!voice) {
      return false;
    }

    // التحقق من الصلاحيات (المرسل فقط أو الأدمن)
    if (voice.senderId !== userId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.type !== 'admin') {
        return false;
      }
    }

    try {
      // حذف الملف من القرص
      const filePath = path.join(VOICE_UPLOAD_DIR, path.basename(voice.storageKey));
      await fs.unlink(filePath).catch(() => {}); // تجاهل الخطأ إذا كان الملف غير موجود

      // حذف السجل من قاعدة البيانات
      await db
        .delete(messageVoices)
        .where(eq(messageVoices.id, voiceId));

      return true;
    } catch (error) {
      console.error(`خطأ في حذف الرسالة الصوتية ${voiceId}:`, error);
      return false;
    }
  }

  // إحصائيات الاستخدام
  static async getUsageStats(userId: number): Promise<{
    totalMessages: number;
    totalDuration: number;
    totalSize: number;
    messagesThisWeek: number;
  }> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [result] = await db
      .select({
        totalMessages: sql<number>`count(*)::int`,
        totalDuration: sql<number>`coalesce(sum(${messageVoices.durationSeconds}), 0)::int`,
        totalSize: sql<number>`coalesce(sum(${messageVoices.fileSizeBytes}), 0)::int`,
        messagesThisWeek: sql<number>`count(case when ${messageVoices.createdAt} >= ${weekAgo} then 1 end)::int`,
      })
      .from(messageVoices)
      .where(eq(messageVoices.senderId, userId));

    return result || {
      totalMessages: 0,
      totalDuration: 0,
      totalSize: 0,
      messagesThisWeek: 0,
    };
  }
}