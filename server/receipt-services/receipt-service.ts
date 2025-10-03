import { db } from '../db';
import { receipts, receiptAuditLog, transactions, receiptSettings } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { CryptoService, CanonicalTransaction } from './crypto-service';
import { PDFGenerator, ReceiptData } from './pdf-generator';
import { HtmlPdfGenerator } from './html-pdf-generator';
import { HtmlImageGenerator } from './html-image-generator';
import moment from 'moment-timezone';
import path from 'path';
import fs from 'fs/promises';

export interface TransactionData {
  id: string;
  type: string;
  userId: number;
  amount: string;
  currency: string;
  commission?: string;
  counterparty?: string;
  ref?: string;
  referenceNumber?: string;
  note?: string;
  executedAt: Date;
  status: string;
}

export class ReceiptService {
  private static readonly STORAGE_BASE_PATH = './public/receipts';
  private static readonly VERIFICATION_BASE_URL = process.env.VERIFICATION_BASE_URL || 'https://localhost:3000';

  /**
   * إنشاء إيصال لمعاملة
   */
  static async generateReceipt(
    transactionData: TransactionData,
    locale: 'ar' | 'en' = 'ar'
  ): Promise<string> {
    try {
      // تحويل بيانات المعاملة إلى تنسيق قانوني
      const canonicalTransaction = await this.createCanonicalTransaction(transactionData);
      
      // حساب الهاش
      const canonicalJson = CryptoService.createCanonicalJson(canonicalTransaction);
      const hash = CryptoService.calculateHash(canonicalJson);
      
      // إنشاء JWS
      const payload = {
        txn_id: transactionData.id,
        hash,
        canonical: canonicalTransaction,
        timestamp: new Date().toISOString()
      };
      const jwsToken = await CryptoService.createJWS(payload);
      
      // إنشاء رقم الإيصال
      const receiptNumber = this.generateReceiptNumber(transactionData.id, 1);
      
      // إعداد بيانات الإيصال
      const receiptData: ReceiptData = {
        receiptNumber,
        transaction: canonicalTransaction,
        companyInfo: await this.getCompanyInfo(),
        senderInfo: await this.getSenderInfo(transactionData.userId),
        beneficiaryInfo: await this.getBeneficiaryInfo(transactionData),
        verificationInfo: {
          hash,
          jwsToken,
          verificationUrl: `${this.VERIFICATION_BASE_URL}/r/${transactionData.id}?t=${jwsToken}`
        },
        locale
      };
      
      // إنشاء صورة الإيصال باستخدام المولد الحراري الجديد
      const { ThermalReceiptGenerator } = await import('./thermal-receipt-generator');
      const imageBuffer = await ThermalReceiptGenerator.generateThermalReceipt(receiptData);
      
      // حفظ الملف كصورة
      const storagePath = await this.saveReceiptFile(transactionData.id, imageBuffer, locale, 'png');
      
      // حفظ سجل الإيصال في قاعدة البيانات
      const [receipt] = await db.insert(receipts).values({
        txnId: transactionData.id,
        version: 1,
        locale,
        storagePath,
        sha256Base64url: hash,
        jwsToken,
        pdfSigned: false,
        revoked: false,
        createdBy: 'system',
        publicCopy: true
      }).returning({ id: receipts.id });

      // تسجيل العملية في سجل التدقيق
      await this.logAuditAction(receipt.id, 'generate', 'system', {
        txnId: transactionData.id,
        locale,
        receiptNumber
      });

      return receipt.id;
    } catch (error) {
      console.error('خطأ في إنشاء الإيصال:', error);
      throw new Error('فشل في إنشاء الإيصال');
    }
  }

  /**
   * التحقق من صحة إيصال
   */
  static async verifyReceipt(
    receiptId: string, 
    token?: string
  ): Promise<{ valid: boolean; reasons: string[]; summary?: any }> {
    try {
      const [receipt] = await db
        .select()
        .from(receipts)
        .where(eq(receipts.id, receiptId))
        .limit(1);

      if (!receipt) {
        return { valid: false, reasons: ['الإيصال غير موجود'] };
      }

      const reasons: string[] = [];

      // فحص حالة الإبطال
      if (receipt.revoked) {
        reasons.push('الإيصال ملغي');
      }

      // التحقق من JWS إذا تم توفيره
      if (token) {
        const verificationResult = await CryptoService.verifyJWS(token);
        if (!verificationResult.valid) {
          reasons.push(`توقيع غير صحيح: ${verificationResult.error}`);
        } else {
          // التحقق من تطابق الهاش
          const payloadHash = verificationResult.payload?.hash;
          if (payloadHash !== receipt.sha256Base64url) {
            reasons.push('عدم تطابق الهاش');
          }
        }
      }

      // تحديث آخر تحقق ناجح
      if (reasons.length === 0) {
        await db
          .update(receipts)
          .set({ verifiedAt: new Date() })
          .where(eq(receipts.id, receiptId));

        // تسجيل التحقق في سجل التدقيق
        await this.logAuditAction(receiptId, 'verify', 'public');
      }

      return {
        valid: reasons.length === 0,
        reasons,
        summary: {
          receiptId,
          txnId: receipt.txnId,
          version: receipt.version,
          locale: receipt.locale,
          createdAt: receipt.createdAt,
          verifiedAt: receipt.verifiedAt
        }
      };
    } catch (error) {
      console.error('خطأ في التحقق من الإيصال:', error);
      return { valid: false, reasons: ['خطأ في النظام'] };
    }
  }

  /**
   * إبطال إيصال
   */
  static async revokeReceipt(
    receiptId: string, 
    reason: string, 
    userId: string
  ): Promise<boolean> {
    try {
      const [updated] = await db
        .update(receipts)
        .set({ revoked: true })
        .where(eq(receipts.id, receiptId))
        .returning({ id: receipts.id });

      if (updated) {
        await this.logAuditAction(receiptId, 'revoke', userId, { reason });
        return true;
      }

      return false;
    } catch (error) {
      console.error('خطأ في إبطال الإيصال:', error);
      return false;
    }
  }

  /**
   * إعادة إصدار إيصال بإصدار جديد
   */
  static async regenerateReceipt(
    txnId: string,
    locale: 'ar' | 'en' = 'ar',
    reason: string,
    userId: string
  ): Promise<string | null> {
    try {
      // الحصول على الإصدار الحالي
      const [currentReceipt] = await db
        .select({ version: receipts.version })
        .from(receipts)
        .where(eq(receipts.txnId, txnId))
        .orderBy(desc(receipts.version))
        .limit(1);

      const newVersion = currentReceipt ? currentReceipt.version + 1 : 1;

      // إبطال الإصدارات السابقة
      await db
        .update(receipts)
        .set({ revoked: true })
        .where(eq(receipts.txnId, txnId));

      // الحصول على بيانات المعاملة
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, parseInt(txnId)))
        .limit(1);

      if (!transaction) {
        throw new Error('المعاملة غير موجودة');
      }

      // إنشاء إيصال جديد
      const transactionData: TransactionData = {
        id: txnId,
        type: transaction.type,
        userId: transaction.userId,
        amount: transaction.amount,
        currency: transaction.currency,
        commission: '0',
        counterparty: '',
        ref: '',
        referenceNumber: transaction.referenceNumber || `REF-${txnId}`,
        note: transaction.description || '',
        executedAt: transaction.date || new Date(),
        status: 'completed'
      };

      const receiptId = await this.generateReceipt(transactionData, locale);

      // تحديث رقم الإصدار
      await db
        .update(receipts)
        .set({ version: newVersion })
        .where(eq(receipts.id, receiptId));

      // تسجيل إعادة الإصدار
      await this.logAuditAction(receiptId, 'regenerate', userId, { 
        reason, 
        oldVersion: currentReceipt?.version || 0,
        newVersion 
      });

      return receiptId;
    } catch (error) {
      console.error('خطأ في إعادة إصدار الإيصال:', error);
      return null;
    }
  }

  /**
   * الحصول على قائمة الإيصالات لمعاملة
   */
  static async getReceiptsByTransaction(txnId: string): Promise<any[]> {
    try {
      return await db
        .select({
          id: receipts.id,
          version: receipts.version,
          locale: receipts.locale,
          revoked: receipts.revoked,
          createdAt: receipts.createdAt,
          verifiedAt: receipts.verifiedAt,
          filePath: receipts.storagePath, // إضافة مسار الملف
          sha256Hash: receipts.sha256Base64url,
          jwsToken: receipts.jwsToken
        })
        .from(receipts)
        .where(eq(receipts.txnId, txnId))
        .orderBy(desc(receipts.version));
    } catch (error) {
      console.error('خطأ في جلب الإيصالات:', error);
      return [];
    }
  }

  /**
   * إنشاء رابط تحميل آمن للإيصال
   */
  static async getDownloadUrl(receiptId: string, userId?: string): Promise<string | null> {
    try {
      const [receipt] = await db
        .select()
        .from(receipts)
        .where(eq(receipts.id, receiptId))
        .limit(1);

      if (!receipt || receipt.revoked) {
        return null;
      }

      // تسجيل التحميل
      await this.logAuditAction(receiptId, 'download', userId || 'anonymous');

      // في الواقع، يجب إنشاء رابط موقع مؤقت
      // للآن سنعيد المسار المباشر
      return `/api/receipts/${receiptId}/file`;
    } catch (error) {
      console.error('خطأ في إنشاء رابط التحميل:', error);
      return null;
    }
  }

  /**
   * تحويل بيانات المعاملة إلى تنسيق قانوني
   */
  private static async createCanonicalTransaction(data: TransactionData): Promise<CanonicalTransaction> {
    const canonicalTxn = {
      txn_id: data.id,
      txn_type: data.type,
      executed_at: moment(data.executedAt).utc().toISOString(),
      timezone: 'Africa/Tripoli',
      amount_src: {
        ccy: data.currency,
        value: parseFloat(data.amount).toFixed(2)
      },
      fees: data.commission ? [{
        name: 'commission',
        ccy: data.currency,
        value: parseFloat(data.commission).toFixed(2)
      }] : [],
      taxes: [],
      net_to_beneficiary: {
        ccy: data.currency,
        value: (parseFloat(data.amount) - parseFloat(data.commission || '0')).toFixed(2)
      },
      sender_ref: this.maskAccountNumber(data.userId.toString()),
      beneficiary_ref: data.counterparty || 'N/A',
      office_ref: 'Main-Office',
      version: 1
    } as CanonicalTransaction;

    // إضافة الرقم المرجعي إذا كان متوفراً
    if (data.referenceNumber) {
      (canonicalTxn as any).referenceNumber = data.referenceNumber;
    }

    return canonicalTxn;
  }

  /**
   * إنشاء رقم إيصال
   */
  private static generateReceiptNumber(txnId: string, version: number): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const shortTxn = txnId.substring(0, 8);
    
    return `R-${year}${month}${day}-${shortTxn}-v${version}`;
  }

  /**
   * الحصول على معلومات الشركة
   */
  private static async getCompanyInfo() {
    // في الواقع، يجب جلب هذه المعلومات من الإعدادات
    return {
      name: 'مكتب الصرافة الليبي',
      nameEn: 'Libyan Exchange Office',
      address: 'طرابلس، ليبيا',
      addressEn: 'Tripoli, Libya',
      phone: '+218-21-1234567',
      email: 'info@exchange.ly',
      registrationNumber: 'REG-2024-001',
      taxNumber: 'TAX-123456789'
    };
  }

  /**
   * الحصول على معلومات المرسل
   */
  private static async getSenderInfo(userId: number) {
    // تبسيط - في الواقع يجب جلب البيانات من جدول المستخدمين
    return {
      name: 'المستخدم رقم ' + userId,
      accountNumber: userId.toString(),
      city: 'طرابلس'
    };
  }

  /**
   * الحصول على معلومات المستفيد
   */
  private static async getBeneficiaryInfo(data: TransactionData) {
    return {
      name: data.counterparty || 'غير محدد',
      accountNumber: data.ref || 'N/A',
      city: 'غير محدد',
      country: 'ليبيا'
    };
  }

  /**
   * حفظ ملف الإيصال
   */
  private static async saveReceiptFile(
    txnId: string, 
    fileBuffer: Uint8Array | Buffer, 
    locale: string,
    extension: string = 'pdf'
  ): Promise<string> {
    const dir = path.join(this.STORAGE_BASE_PATH, txnId);
    await fs.mkdir(dir, { recursive: true });
    
    const filename = `receipt_${locale}_${Date.now()}.${extension}`;
    const filePath = path.join(dir, filename);
    
    await fs.writeFile(filePath, fileBuffer);
    
    return path.relative(this.STORAGE_BASE_PATH, filePath);
  }

  /**
   * تسجيل عملية في سجل التدقيق
   */
  static async logAuditAction(
    receiptId: string,
    action: string,
    userId?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await db.insert(receiptAuditLog).values({
        receiptId,
        action,
        userId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent
      });
    } catch (error) {
      console.error('خطأ في تسجيل سجل التدقيق:', error);
    }
  }



  /**
   * إخفاء رقم الحساب
   */
  private static maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    const visiblePart = accountNumber.slice(-4);
    const maskedPart = '*'.repeat(accountNumber.length - 4);
    return `user:${maskedPart}${visiblePart}`;
  }

  /**
   * إخفاء اسم المستخدم
   */
  private static maskName(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      if (parts[0].length <= 2) return parts[0];
      return parts[0].charAt(0) + '*'.repeat(parts[0].length - 1);
    }
    return parts[0] + ' ' + parts[1].charAt(0) + '.';
  }

  /**
   * الحصول على قائمة بجميع الإيصالات (للمدير)
   */
  static async getAllReceipts(limit = 50, offset = 0): Promise<any[]> {
    try {
      return await db
        .select({
          id: receipts.id,
          txnId: receipts.txnId,
          version: receipts.version,
          locale: receipts.locale,
          revoked: receipts.revoked,
          createdAt: receipts.createdAt,
          hash: receipts.sha256Base64url
        })
        .from(receipts)
        .orderBy(desc(receipts.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error('خطأ في الحصول على الإيصالات:', error);
      return [];
    }
  }

  /**
   * الحصول على إحصائيات نظام الإيصالات
   */
  static async getReceiptStats(): Promise<{ total: number; revoked: number; active: number; recent24h: number }> {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(receipts);
      
      const [revokedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(receipts)
        .where(eq(receipts.revoked, true));

      const [recent24hResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(receipts)
        .where(sql`${receipts.createdAt} >= ${yesterday}`);

      const total = totalResult?.count || 0;
      const revoked = revokedResult?.count || 0;
      const recent24h = recent24hResult?.count || 0;
      const active = total - revoked;

      return {
        total,
        revoked,
        active,
        recent24h
      };
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الإيصالات:', error);
      return { total: 0, revoked: 0, active: 0, recent24h: 0 };
    }
  }

  /**
   * تحديث إعداد نظام الإيصالات
   */
  static async updateReceiptSetting(key: string, value: string, updatedBy: string): Promise<boolean> {
    try {
      // إدراج أو تحديث الإعداد
      await db
        .insert(receiptSettings)
        .values({
          key,
          value,
          updatedBy,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: receiptSettings.key,
          set: {
            value,
            updatedBy,
            updatedAt: new Date()
          }
        });

      return true;
    } catch (error) {
      console.error('خطأ في تحديث إعداد الإيصال:', error);
      return false;
    }
  }

  /**
   * الحصول على إعداد نظام الإيصالات
   */
  static async getReceiptSetting(key: string): Promise<string | null> {
    try {
      const [setting] = await db
        .select({ value: receiptSettings.value })
        .from(receiptSettings)
        .where(eq(receiptSettings.key, key))
        .limit(1);

      return setting?.value || null;
    } catch (error) {
      console.error('خطأ في جلب إعداد الإيصال:', error);
      return null;
    }
  }


}