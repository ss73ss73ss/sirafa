import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import axios from 'axios';
import { getClientPublicIP, getDisplayIP, getGeoLocation } from './utils/ip';

// 🔒 MOVED TO auth.ts: JWT_SECRET إدارة مركزية في auth.ts لضمان الأمان
// تمت إزالة JWT_SECRET من هذا الملف لتجنب التضارب والمخاطر الأمنية

// Security log entry interface
interface SecurityLog {
  id: string;
  timestamp: string;
  ip: string;
  country: string;
  city: string;
  fingerprint: string;
  userAgent: string;
  platform: string;
  language: string;
  screen: string;
  timezone: string;
  username?: string;
  attempts: number;
  reportType: 'failed_login' | 'suspicious_activity' | 'manual_report' | 'admin_action';
  imageFileName?: string;
  blocked: boolean;
}

// Blocked fingerprints set
const blockedFingerprints = new Set<string>();
const attemptCounters = new Map<string, number>();

// Initialize security directories
async function initSecurityDirectories() {
  const dirs = ['logs', 'reports'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(path.join(process.cwd(), dir), { recursive: true });
    } catch (error) {
      console.error(`Failed to create ${dir} directory:`, error);
    }
  }
}

// Load blocked fingerprints from file
async function loadBlockedFingerprints() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'logs', 'blocked_fingerprints.json'), 'utf-8');
    const blocked = JSON.parse(data);
    blocked.forEach((fp: string) => blockedFingerprints.add(fp));
    console.log(`Loaded ${blocked.length} blocked fingerprints`);
  } catch (error) {
    console.log('No blocked fingerprints file found, starting fresh');
  }
}

// Save blocked fingerprints to file
async function saveBlockedFingerprints() {
  try {
    const blocked = Array.from(blockedFingerprints);
    await fs.writeFile(
      path.join(process.cwd(), 'logs', 'blocked_fingerprints.json'),
      JSON.stringify(blocked, null, 2)
    );
  } catch (error) {
    console.error('Failed to save blocked fingerprints:', error);
  }
}

// Internal log function for SecurityLog entries
async function writeSecurityLog(logEntry: SecurityLog) {
  try {
    // 🎯 حفظ في قاعدة البيانات
    await storage.addSecurityLog({
      email: logEntry.username || null,
      username: logEntry.username || null,
      eventType: logEntry.reportType === 'failed_login' ? 'FAILED_LOGIN' : 'SUSPICIOUS_ACTIVITY',
      fingerprint: logEntry.fingerprint,
      ipAddress: logEntry.ip,
      userAgent: logEntry.userAgent,
      country: logEntry.country,
      city: logEntry.city,
      platform: logEntry.platform,
      language: logEntry.language,
      screen: logEntry.screen,
      timezone: logEntry.timezone,
      attempts: logEntry.attempts || 1,
      imageFilename: logEntry.imageFileName || null,
      blocked: logEntry.blocked || false,
      reportType: logEntry.reportType || 'failed_login',
      metadata: {},
    });

    // Security event logged successfully
    
    // 💾 أيضاً حفظ نسخة احتياطية في الملفات (اختياري)
    const logFile = path.join(process.cwd(), 'logs', 'security_logs.json');
    
    // Read existing logs
    let logs: SecurityLog[] = [];
    try {
      const data = await fs.readFile(logFile, 'utf-8');
      logs = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
      logs = [];
    }
    
    // Add new log entry
    logs.push(logEntry);
    
    // Write back to file
    await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    
    // Also keep the old text log for backup
    const textLogFile = path.join(process.cwd(), 'logs', 'login_logs.txt');
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(textLogFile, logLine);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Add new interface for security event logging  
interface SecurityEvent {
  type: 'FAILED_LOGIN' | 'SUCCESSFUL_LOGIN' | 'BLOCKED_LOGIN_ATTEMPT' | 'SUSPICIOUS_ACTIVITY';
  fingerprint?: string;
  ipAddress: string;
  userAgent: string;
  username?: string;
  userId?: number;
  location?: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp?: string;
}

// Enhanced security event logging function (exported)
export async function logSecurityEvent(event: SecurityEvent, securityImage?: string) {
  try {
    const geo = await getGeoLocation(event.ipAddress);
    
    // Increment attempt counter for failed logins
    let attempts = 1;
    if (event.fingerprint) {
      if (event.type === 'FAILED_LOGIN') {
        attempts = (attemptCounters.get(event.fingerprint) || 0) + 1;
        attemptCounters.set(event.fingerprint, attempts);
        
        // Block after 3 failed attempts
        if (attempts >= 3) {
          blockedFingerprints.add(event.fingerprint);
          await saveBlockedFingerprints();
          // Blocked fingerprint due to failed login attempts
        }
      } else if (event.type === 'SUCCESSFUL_LOGIN') {
        // Reset counter on successful login
        attemptCounters.delete(event.fingerprint);
      }
    }
    
    // Handle security image for failed login attempts
    let imageFileName: string | null = null;
    if (event.type === 'FAILED_LOGIN') {
      const fingerprint = event.fingerprint || 'unknown';
      
      // First priority: Use real camera image if provided
      if (securityImage) {
        // Processing real camera image for security event
        imageFileName = await saveSecurityImage(securityImage, fingerprint);
        if (imageFileName) {
          // Real security image saved successfully
        } else {
          // Failed to save real image - generating fallback
          imageFileName = await generateTestSecurityImage(fingerprint);
        }
      } else {
        // Fallback: Generate test security image only if no real image
        // No real image - generating fallback security image
        imageFileName = await generateTestSecurityImage(fingerprint);
        if (imageFileName) {
          // Auto-generated security image saved
        }
      }
    }

    const logEntry: SecurityLog = {
      id: randomUUID(),
      timestamp: event.timestamp || new Date().toISOString(),
      ip: event.ipAddress,
      country: geo.country,
      city: geo.city,
      fingerprint: event.fingerprint || 'unknown',
      userAgent: event.userAgent,
      platform: 'Web',
      language: event.location?.language || 'ar',
      screen: event.location?.screen || 'unknown',
      timezone: event.location?.timezone || 'unknown',
      username: event.username,
      attempts: attempts,
      reportType: event.type === 'FAILED_LOGIN' ? 'failed_login' : 'suspicious_activity',
      imageFileName: imageFileName || undefined,
      blocked: event.fingerprint ? blockedFingerprints.has(event.fingerprint) : false
    };
    
    // Write to log file using internal function
    await writeSecurityLog(logEntry);
    // Security event logged successfully
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}


// Save security image
async function saveSecurityImage(imageData: string, fingerprint: string): Promise<string | null> {
  try {
    // Remove data:image/jpeg;base64, prefix
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `security_${fingerprint.substring(0, 8)}_${timestamp}.jpg`;
    const filepath = path.join(process.cwd(), 'reports', filename);
    
    // Optimize and save image
    await sharp(buffer)
      .jpeg({ quality: 80 })
      .resize(640, 480, { fit: 'cover' })
      .toFile(filepath);
    
    // Security image saved successfully
    return filename;
  } catch (error) {
    console.error('Failed to save security image:', error);
    return null;
  }
}

// ===========================================
// 🛡️ SUPER ADMIN PROTECTION SYSTEM - ENHANCED SECURITY
// ===========================================
// نظام الحماية المتقدم للمدير المسؤول مع الحماية من انتحال الهوية
// يستخدم التحقق المضاعف: EMAIL + USER_ID للحماية القصوى

// البيانات الأساسية للسوبر أدمن - محمية ولا يمكن تغييرها
export const SUPER_ADMIN_EMAIL = 'ss73ss73ss73@gmail.com';
export const SUPER_ADMIN_USER_ID = 4; // User ID ثابت للحماية المضاعفة

/**
 * التحقق الصارم من كون المستخدم هو السوبر أدمن - حماية مضاعفة إجبارية
 * يتطلب email AND user ID معاً - لا يُقبل التحقق من email فقط لمنع انتحال الهوية
 */
export function isSuperAdmin(email: string, userId: number): boolean {
  if (!email || !userId) return false;
  
  // التحقق المضاعف الصارم: email AND user ID - كلاهما مطلوب تماماً
  const emailMatch = email === SUPER_ADMIN_EMAIL;
  const idMatch = userId === SUPER_ADMIN_USER_ID;
  
  // يجب أن يتطابق كلاهما تماماً للحماية القصوى - لا توجد استثناءات
  return emailMatch && idMatch;
}

/**
 * التحقق من كون email محجوز للسوبر أدمن (للمنع من استخدامه في التسجيل)
 */
export function isSuperAdminEmail(email: string): boolean {
  return email === SUPER_ADMIN_EMAIL;
}

/**
 * التحقق من كون المستخدم محمي من التعديل أو الحذف
 */
export function isSuperAdminByUser(user: { email: string; id: number }): boolean {
  return isSuperAdmin(user.email, user.id);
}

/**
 * التحقق من كون email محجوز للسوبر أدمن (لمنع السرقة)
 */
export function isReservedSuperAdminEmail(email: string): boolean {
  return email === SUPER_ADMIN_EMAIL;
}

// التحقق من صلاحية الوصول للميزات الإدارية
// السوبر أدمن يتجاوز جميع القيود - مع التحقق الآمن
function isAuthorized(email: string, userId?: number): boolean {
  // للتوافق مع الكود القديم - نستخدم التحقق المضاعف إذا تم توفير userId
  if (userId) {
    return isSuperAdmin(email, userId);
  }
  // أو للتحقق السريع من email فقط (غير مُوصى به للأمان الكامل)
  return isSuperAdminEmail(email);
}

// التحقق من صلاحية حذف البيانات الأمنية
// السوبر أدمن له صلاحيات حذف مطلقة - مع التحقق المضاعف الآمن
function isAuthorizedToDelete(email: string, userId?: number): boolean {
  // للتوافق مع الكود القديم - نستخدم التحقق المضاعف إذا تم توفير userId
  if (userId) {
    return isSuperAdmin(email, userId);
  }
  // أو للتحقق السريع من email فقط (غير مُوصى به للأمان الكامل)
  return isSuperAdminEmail(email);
}

/**
 * التحقق من إمكانية تقييد مستخدم (تعطيل/تفعيل/إلخ) - مع الحماية المضاعفة
 */
export function canRestrictUser(targetUser: { email: string; id: number }, adminUser: { email: string; id: number }): boolean {
  // السوبر أدمن لا يمكن تقييده أبداً - التحقق المضاعف
  if (isSuperAdminByUser(targetUser)) {
    console.log(`🚨 SUPER ADMIN PROTECTION: منع تقييد السوبر أدمن ${targetUser.email} (ID: ${targetUser.id})`);
    return false;
  }
  
  // السوبر أدمن يستطيع تقييد أي شخص آخر
  if (isSuperAdminByUser(adminUser)) {
    return true;
  }
  
  // المديرون العاديون يستطيعون التقييد (حسب منطق النظام الأساسي)
  return true;
}

/**
 * التحقق من إمكانية حذف مستخدم - مع الحماية المضاعفة
 */
export function canDeleteUser(targetUser: { email: string; id: number }, adminUser: { email: string; id: number }): boolean {
  // السوبر أدمن لا يمكن حذفه أبداً - التحقق المضاعف
  if (isSuperAdminByUser(targetUser)) {
    console.log(`🚨 SUPER ADMIN PROTECTION: منع حذف السوبر أدمن ${targetUser.email} (ID: ${targetUser.id})`);
    return false;
  }
  
  // السوبر أدمن يستطيع حذف أي شخص آخر
  if (isSuperAdminByUser(adminUser)) {
    return true;
  }
  
  // المديرون العاديون يستطيعون الحذف (حسب منطق النظام الأساسي)
  return true;
}

/**
 * التحقق من إمكانية تغيير email المستخدم - مع حماية السوبر أدمن
 */
export function canChangeUserEmail(targetUser: { email: string; id: number }, newEmail: string, adminUser: { email: string; id: number }): boolean {
  // منع تغيير email السوبر أدمن نهائياً
  if (isSuperAdminByUser(targetUser)) {
    console.log(`🚨 SUPER ADMIN PROTECTION: منع تغيير email السوبر أدمن ${targetUser.email}`);
    return false;
  }
  
  // منع أي شخص من استخدام email السوبر أدمن
  if (isReservedSuperAdminEmail(newEmail)) {
    console.log(`🚨 SUPER ADMIN PROTECTION: منع استخدام email محجوز للسوبر أدمن: ${newEmail}`);
    return false;
  }
  
  return true;
}

// Security middleware to protect admin routes
// 🛡️ SUPER ADMIN PROTECTION: السوبر أدمن يتجاوز جميع القيود
export function securityMiddleware(req: Request, res: Response, next: any) {
  const user = (req as any).user;
  
  // السوبر أدمن يتجاوز جميع قيود الأمان - صلاحيات مطلقة
  if (user && isSuperAdmin(user.email)) {
    console.log(`🛡️ Super Admin Access: ${user.email} - تجاوز جميع قيود الأمان`);
    return next();
  }
  
  if (!user || !isAuthorized(user.email)) {
    return res.status(403).json({ 
      message: 'غير مصرح لك بالوصول إلى هذا المورد',
      error: 'UNAUTHORIZED_ACCESS'
    });
  }
  
  next();
}

// JWT middleware functions - reuse existing constants

// Simple JWT-only middleware for security images (admin only)
// This avoids database lookups to prevent async timing issues
export function securityImageMiddleware(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Security Image: No authorization header
    return res.status(401).json({ message: "غير مصرح به" });
  }
  
  const token = authHeader.split(' ')[1];
  // Security Image: Checking token authorization
  
  try {
    // 🔒 استخدام JWT_SECRET من auth.ts لضمان الاتساق والأمان
    const JWT_SECRET_FROM_ENV = process.env.JWT_SECRET;
    if (!JWT_SECRET_FROM_ENV) {
      console.error("🚨 CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required!");
      return res.status(500).json({ message: "خطأ في إعدادات الأمان" });
    }
    const decoded = jwt.verify(token, JWT_SECRET_FROM_ENV) as any;
    
    // Security Image: User token decoded
    
    // 🛡️ SUPER ADMIN PROTECTION: التحقق من السوبر أدمن
    if (!isSuperAdmin(decoded.email)) {
      // Security Image: User is not authorized admin
      return res.status(403).json({ message: 'غير مصرح لك بالوصول للصور الأمنية' });
    }
    
    // Set user info and continue
    (req as any).user = {
      id: decoded.userId,
      email: decoded.email,
      type: decoded.type
    };
    // Security Image: Access granted to admin
    next();
  } catch (error) {
    // Security Image: Token error
    return res.status(401).json({ message: "توكن غير صالح أو منتهي الصلاحية" });
  }
}

// Check if fingerprint is blocked
export async function checkBlockedFingerprint(req: Request, res: Response) {
  try {
    const { fingerprint } = req.body;
    
    if (!fingerprint) {
      return res.status(400).json({ message: 'بصمة الجهاز مطلوبة' });
    }
    
    const blocked = blockedFingerprints.has(fingerprint);
    res.json({ blocked, fingerprint });
  } catch (error) {
    console.error('Error checking blocked fingerprint:', error);
    res.status(500).json({ message: 'خطأ في النظام' });
  }
}

// Generate test security image for API calls (when no real image is provided)
export async function generateTestSecurityImage(fingerprint: string): Promise<string | null> {
  try {
    const timestamp = new Date().toLocaleString('ar-EG');
    const filename = `security_${fingerprint.substring(0, 8)}_${new Date().toISOString().replace(/[:.]/g, '-')}.svg`;
    const filepath = path.join(process.cwd(), 'reports', filename);

    // Create SVG security alert image
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="640" height="480" fill="#1a1a2e"/>
  
  <!-- Border -->
  <rect x="20" y="20" width="600" height="440" fill="none" stroke="#ff4444" stroke-width="4"/>
  
  <!-- Header -->
  <text x="320" y="80" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="28" font-weight="bold">SECURITY ALERT</text>
  <text x="320" y="110" text-anchor="middle" fill="#ff4444" font-family="Arial, sans-serif" font-size="20" font-weight="bold">تنبيه أمني</text>
  
  <!-- Warning Icon -->
  <polygon points="320,130 300,170 340,170" fill="#ff4444"/>
  <text x="320" y="157" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="20" font-weight="bold">!</text>
  
  <!-- Main Content -->
  <text x="320" y="200" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="18">Suspicious Login Attempt Detected</text>
  <text x="320" y="225" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="16">تم اكتشاف محاولة دخول مشبوهة</text>
  
  <!-- Details -->
  <text x="320" y="270" text-anchor="middle" fill="#cccccc" font-family="Arial, sans-serif" font-size="14">Timestamp: ${timestamp}</text>
  <text x="320" y="295" text-anchor="middle" fill="#cccccc" font-family="Arial, sans-serif" font-size="14">Device Fingerprint: ${fingerprint.substring(0, 24)}...</text>
  <text x="320" y="320" text-anchor="middle" fill="#cccccc" font-family="Arial, sans-serif" font-size="14">Status: UNAUTHORIZED ACCESS</text>
  
  <!-- Footer Warning -->
  <rect x="50" y="360" width="540" height="60" fill="#ff4444" fill-opacity="0.2" stroke="#ff4444" stroke-width="2"/>
  <text x="320" y="385" text-anchor="middle" fill="#ff4444" font-family="Arial, sans-serif" font-size="16" font-weight="bold">⚠️ SECURITY VIOLATION ⚠️</text>
  <text x="320" y="405" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="12">This incident has been logged and reported to system administrators</text>
</svg>`;

    // Write SVG file directly
    await fs.writeFile(filepath, svgContent, 'utf-8');
    
    console.log(`🎨 Security alert image generated: ${filename}`);
    return filename;
  } catch (error) {
    console.error('Failed to generate security alert image:', error);
    return null;
  }
}



// Report suspicious activity
export async function reportSuspiciousActivity(req: Request, res: Response) {
  try {
    const ipResult = getClientPublicIP(req);
    const geo = await getGeoLocation(ipResult.ip);
    
    console.log(`📍 IP المُستخرج: ${ipResult.ip} من ${ipResult.source} (عام: ${ipResult.isPublic}, موثوق: ${ipResult.trusted})`);
    if (ipResult.serverDetectedIp !== ipResult.ip) {
      console.log(`🖥️ Server IP: ${ipResult.serverDetectedIp}, 📱 Client IP: ${ipResult.clientReportedIp}`);
    }
    if (ipResult.fallbackReason) {
      console.log(`⚠️ Fallback reason: ${ipResult.fallbackReason}`);
    }
    
    const {
      fingerprint,
      userAgent,
      platform,
      language,
      screen,
      timezone,
      username,
      attempts,
      securityImage
    } = req.body;
    
    // Only increment attempt counter if not already blocked
    // If device was previously unblocked, don't re-block it automatically
    let currentAttempts = attemptCounters.get(fingerprint) || 0;
    
    // Check if device is currently blocked
    if (!blockedFingerprints.has(fingerprint)) {
      currentAttempts = currentAttempts + 1;
      attemptCounters.set(fingerprint, currentAttempts);
      
      // Block fingerprint if too many attempts AND not previously unblocked by admin
      if (currentAttempts >= 3) {
        blockedFingerprints.add(fingerprint);
        await saveBlockedFingerprints();
        console.log(`🚫 Blocked fingerprint due to suspicious activity: ${fingerprint}`);
      }
    } else {
      console.log(`🚫 Attempt from already blocked fingerprint: ${fingerprint}`);
    }
    
    // Save security image if provided, otherwise generate test image
    let imageFileName: string | null = null;
    if (securityImage) {
      console.log('📷 معالجة صورة حقيقية من الكاميرا...');
      imageFileName = await saveSecurityImage(securityImage, fingerprint);
      if (imageFileName) {
        console.log(`✅ تم حفظ الصورة الحقيقية: ${imageFileName}`);
      } else {
        console.log('❌ فشل حفظ الصورة الحقيقية - إنشاء صورة بديلة...');
        imageFileName = await generateTestSecurityImage(fingerprint);
      }
    } else {
      // Generate test security image for all cases (including unknown fingerprints)
      console.log('🎨 إنشاء صورة أمنية بديلة...');
      imageFileName = await generateTestSecurityImage(fingerprint);
    }
    
    // Create security log entry
    const logEntry: SecurityLog = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ip: ipResult.ip,
      country: geo.country,
      city: geo.city,
      fingerprint,
      userAgent: userAgent || 'Unknown',
      platform: platform || 'Unknown',
      language: language || 'Unknown',
      screen: screen || 'Unknown',
      timezone: timezone || 'Unknown',
      username,
      attempts: currentAttempts,
      reportType: 'suspicious_activity',
      imageFileName: imageFileName || undefined,
      blocked: blockedFingerprints.has(fingerprint)
    };
    
    await writeSecurityLog(logEntry);
    
    console.log(`🚨 Security report logged: ${fingerprint} (${currentAttempts} attempts)`);
    
    res.json({ 
      success: true, 
      message: 'تم تسجيل النشاط المشبوه',
      blocked: blockedFingerprints.has(fingerprint)
    });
  } catch (error) {
    console.error('Error reporting suspicious activity:', error);
    res.status(500).json({ message: 'خطأ في تسجيل النشاط المشبوه' });
  }
}

// Get security logs (admin only)
export async function getSecurityLogs(req: Request, res: Response) {
  try {
    console.log('🔍 جلب السجلات الأمنية من قاعدة البيانات...');
    
    // 🎯 جلب السجلات من قاعدة البيانات
    const databaseLogs = await storage.getSecurityLogs({ limit: 1000, offset: 0 });
    
    // تحويل البيانات لتتوافق مع تنسيق الواجهة الأمامية
    const logs = databaseLogs.map(log => ({
      id: log.id,
      username: log.email || log.username,
      email: log.email,
      fingerprint: log.fingerprint,
      ip: log.ipAddress,
      userAgent: log.userAgent,
      country: log.country,
      city: log.city,
      platform: log.platform,
      language: log.language,
      screen: log.screen,
      timezone: log.timezone,
      attempts: log.attempts,
      imageFileName: log.imageFilename,
      blocked: log.blocked || blockedFingerprints.has(log.fingerprint),
      reportType: log.reportType,
      timestamp: log.createdAt,
      eventType: log.eventType,
      metadata: log.metadata || {}
    }));
    
    console.log(`📊 تم جلب ${logs.length} سجل أمني من قاعدة البيانات`);
    
    // ✅ استخدام قاعدة البيانات فقط كمصدر موثوق للسجلات
    // تم إزالة جلب السجلات من الملفات النصية لتجنب تضارب الحذف
    const sortedLogs = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json({ logs: sortedLogs, total: sortedLogs.length });
  } catch (error) {
    console.error('Error getting security logs:', error);
    res.status(500).json({ message: 'خطأ في استرجاع السجلات' });
  }
}

// Block fingerprint manually (admin only)
export async function blockFingerprint(req: Request, res: Response) {
  try {
    const { fingerprint, reason } = req.body;
    
    if (!fingerprint) {
      return res.status(400).json({ message: 'بصمة الجهاز مطلوبة' });
    }
    
    blockedFingerprints.add(fingerprint);
    await saveBlockedFingerprints();
    
    // Log the manual block
    const logEntry: SecurityLog = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ip: getClientPublicIP(req).ip || 'admin',
      country: 'Admin Action',
      city: 'Manual Block',
      fingerprint,
      userAgent: req.get('User-Agent') || 'Admin',
      platform: 'Admin Panel',
      language: 'ar',
      screen: 'N/A',
      timezone: 'N/A',
      attempts: 0,
      reportType: 'manual_report',
      blocked: true
    };
    
    await writeSecurityLog(logEntry);
    
    console.log(`🔨 Manually blocked fingerprint: ${fingerprint} - Reason: ${reason || 'Manual block'}`);
    
    res.json({ 
      success: true, 
      message: 'تم حظر بصمة الجهاز بنجاح',
      fingerprint
    });
  } catch (error) {
    console.error('Error blocking fingerprint:', error);
    res.status(500).json({ message: 'خطأ في حظر بصمة الجهاز' });
  }
}

// Unblock fingerprint (admin only)
export async function unblockFingerprint(req: Request, res: Response) {
  try {
    const { fingerprint } = req.body;
    
    if (!fingerprint) {
      return res.status(400).json({ message: 'بصمة الجهاز مطلوبة' });
    }
    
    blockedFingerprints.delete(fingerprint);
    attemptCounters.delete(fingerprint);
    await saveBlockedFingerprints();
    
    // Log the unblock action
    const logEntry: SecurityLog = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ip: getClientPublicIP(req).ip || 'admin',
      country: 'Admin Action',
      city: 'Manual Unblock',
      fingerprint,
      userAgent: req.get('User-Agent') || 'Admin',
      platform: 'Admin Panel',
      language: 'ar',
      screen: 'N/A',
      timezone: 'N/A',
      attempts: 0,
      reportType: 'manual_report',
      blocked: false
    };
    
    await writeSecurityLog(logEntry);
    
    console.log(`✅ Unblocked fingerprint: ${fingerprint}`);
    
    res.json({ 
      success: true, 
      message: 'تم إلغاء حظر بصمة الجهاز بنجاح',
      fingerprint
    });
  } catch (error) {
    console.error('Error unblocking fingerprint:', error);
    res.status(500).json({ message: 'خطأ في إلغاء حظر بصمة الجهاز' });
  }
}

// Delete security log entry (super admin only)
export async function deleteSecurityLog(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Check if user is authorized to delete security data
    if (!user || !isAuthorizedToDelete(user.email)) {
      return res.status(403).json({ 
        message: 'غير مصرح لك بحذف السجلات الأمنية - هذه العملية محصورة للمدير الأعلى فقط',
        error: 'UNAUTHORIZED_DELETE_ACCESS'
      });
    }

    const { logId } = req.params;
    
    if (!logId || typeof logId !== 'string' || logId.trim() === '') {
      return res.status(400).json({ message: 'معرف السجل مطلوب ويجب أن يكون نصًا صحيحًا' });
    }

    // Delete from database using the new storage method
    console.log(`🗑️ محاولة حذف السجل الأمني ID: ${logId}...`);
    const deleted = await storage.deleteSecurityLog(logId);
    
    if (!deleted) {
      console.log(`❌ لم يتم العثور على السجل الأمني ID: ${logId}`);
      return res.status(404).json({ message: 'لم يتم العثور على السجل المحدد' });
    }
    
    // Log the deletion action for audit purposes (non-blocking)
    try {
      const deletionLogEntry = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'DELETE_SECURITY_LOG',
        deletedLogId: logId,
        performedBy: user.email,
        ip: getClientPublicIP(req).ip,
        userAgent: req.get('User-Agent') || 'Admin'
      };
      
      // Write audit log to a separate audit file
      const auditLogFile = path.join(process.cwd(), 'logs', 'audit_log.json');
      let auditLogs: any[] = [];
      try {
        const auditData = await fs.readFile(auditLogFile, 'utf-8');
        auditLogs = JSON.parse(auditData);
      } catch (error) {
        auditLogs = [];
      }
      auditLogs.push(deletionLogEntry);
      await fs.writeFile(auditLogFile, JSON.stringify(auditLogs, null, 2));
    } catch (auditError) {
      console.error('Failed to write audit log (non-blocking):', auditError);
    }
    
    console.log(`✅ تم حذف السجل الأمني ID: ${logId} بواسطة ${user.email}`);
    
    res.json({ 
      success: true, 
      message: 'تم حذف السجل الأمني بنجاح',
      id: logId
    });
  } catch (error) {
    console.error('Error deleting security log:', error);
    res.status(500).json({ message: 'خطأ في حذف السجل الأمني' });
  }
}

// Clear all security logs (super admin only)
export async function clearAllSecurityLogs(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Check if user is authorized to delete security data
    if (!user || !isAuthorizedToDelete(user.email)) {
      return res.status(403).json({ 
        message: 'غير مصرح لك بمسح جميع السجلات الأمنية - هذه العملية محصورة للمدير الأعلى فقط',
        error: 'UNAUTHORIZED_DELETE_ACCESS'
      });
    }

    const logsFilePath = path.join(process.cwd(), 'logs', 'security_logs.json');
    const textLogFile = path.join(process.cwd(), 'logs', 'login_logs.txt');
    
    // Get current log count from both files
    let currentLogs: SecurityLog[] = [];
    let textLogCount = 0;
    
    // Count from JSON file
    try {
      const data = await fs.readFile(logsFilePath, 'utf-8');
      currentLogs = JSON.parse(data);
    } catch (error) {
      currentLogs = [];
    }
    
    // Count from text file (the actual source used by getSecurityLogs)
    try {
      const textData = await fs.readFile(textLogFile, 'utf-8');
      textLogCount = textData.trim().split('\n').filter(line => line.length > 0).length;
    } catch (error) {
      textLogCount = 0;
    }
    
    const deletedCount = Math.max(currentLogs.length, textLogCount);
    
    // Check if user wants complete wipe (query parameter)
    const completeWipe = req.query.complete === 'true';
    
    if (completeWipe) {
      // Complete wipe - clear both JSON and text log files without logging
      await fs.writeFile(logsFilePath, JSON.stringify([], null, 2));
      await fs.writeFile(textLogFile, '');
      console.log(`🧹 COMPLETE WIPE: All security logs cleared by ${user.email}: ${deletedCount} logs deleted`);
      
      res.json({ 
        success: true, 
        message: `تم مسح جميع السجلات الأمنية بالكامل (${deletedCount} سجل)`,
        deletedCount,
        type: 'complete_wipe'
      });
    } else {
      // Standard clear - clear both JSON and text log files
      await fs.writeFile(logsFilePath, JSON.stringify([], null, 2));
      await fs.writeFile(textLogFile, '');
      
      // Log the mass deletion action to audit log
      const clearAuditEntry = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'CLEAR_ALL_SECURITY_LOGS',
        deletedCount: deletedCount,
        performedBy: user.email,
        ip: getClientPublicIP(req).ip || 'admin',
        userAgent: req.get('User-Agent') || 'Admin'
      };
      
      // Write to audit log instead of main security log
      const auditLogFile = path.join(process.cwd(), 'logs', 'audit_log.json');
      let auditLogs: any[] = [];
      try {
        const auditData = await fs.readFile(auditLogFile, 'utf-8');
        auditLogs = JSON.parse(auditData);
      } catch (error) {
        auditLogs = [];
      }
      auditLogs.push(clearAuditEntry);
      await fs.writeFile(auditLogFile, JSON.stringify(auditLogs, null, 2));
    
      console.log(`🧹 All security logs cleared by ${user.email}: ${deletedCount} logs deleted`);
      
      res.json({ 
        success: true, 
        message: `تم مسح جميع السجلات الأمنية بنجاح (${deletedCount} سجل)`,
        deletedCount
      });
    }
  } catch (error) {
    console.error('Error clearing all security logs:', error);
    res.status(500).json({ message: 'خطأ في مسح السجلات الأمنية' });
  }
}

// Get security image
export async function getSecurityImage(req: Request, res: Response) {
  try {
    const { filename } = req.params;
    
    // Security validation - allow both JPG and SVG files
    if (!filename || !filename.match(/^security_[a-zA-Z0-9_-]+\.(jpg|svg)$/)) {
      return res.status(400).json({ message: 'اسم ملف غير صحيح' });
    }
    
    const imagePath = path.join(process.cwd(), 'reports', filename);
    
    try {
      await fs.access(imagePath);
      
      // Set proper content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.svg') {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else {
        res.setHeader('Content-Type', 'image/jpeg');
      }
      
      res.setHeader('Cache-Control', 'private, no-cache, no-store');
      res.sendFile(path.resolve(imagePath));
      
      console.log(`📸 Served security image: ${filename}`);
    } catch (fileError) {
      console.log(`❌ Security image not found: ${filename}`);
      res.status(404).json({ message: 'الصورة الأمنية غير موجودة' });
    }
  } catch (error) {
    console.error('Error getting security image:', error);
    res.status(500).json({ message: 'خطأ في استرجاع الصورة الأمنية' });
  }
}

// Initialize security system
export async function initSecurity() {
  await initSecurityDirectories();
  await loadBlockedFingerprints();
  console.log('🛡️ Security system initialized');
}

// Check if fingerprint is blocked
export async function isBlocked(fingerprint: string): Promise<boolean> {
  return blockedFingerprints.has(fingerprint);
}

// Simple blocked check for auth system
export function checkIfBlocked(fingerprint: string): boolean {
  return blockedFingerprints.has(fingerprint);
}

// Enhanced login with security checks
export async function secureLogin(req: Request, res: Response, loginAttempt: any) {
  try {
    const ipResult = getClientPublicIP(req);
    const geo = await getGeoLocation(ipResult.ip);
    
    console.log(`📍 IP المُستخرج (secureLogin): ${ipResult.ip} من ${ipResult.source} (عام: ${ipResult.isPublic}, موثوق: ${ipResult.trusted})`);
    if (ipResult.serverDetectedIp !== ipResult.ip) {
      console.log(`🖥️ Server IP: ${ipResult.serverDetectedIp}, 📱 Client IP: ${ipResult.clientReportedIp}`);
    }
    if (ipResult.fallbackReason) {
      console.log(`⚠️ Fallback reason: ${ipResult.fallbackReason}`);
    }
    const { fingerprint } = req.body;
    
    // Check if fingerprint is blocked
    if (blockedFingerprints.has(fingerprint)) {
      const logEntry: SecurityLog = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        ip: ipResult.ip,
        country: geo.country,
        city: geo.city,
        fingerprint,
        userAgent: req.get('User-Agent') || 'Unknown',
        platform: req.body.platform || 'Unknown',
        language: req.body.language || 'Unknown',
        screen: req.body.screen || 'Unknown',
        timezone: req.body.timezone || 'Unknown',
        username: req.body.username,
        attempts: 0,
        reportType: 'failed_login',
        blocked: true
      };
      
      await writeSecurityLog(logEntry);
      
      return res.status(423).json({ 
        message: 'تم حظر هذا الجهاز من الوصول للنظام',
        error: 'DEVICE_BLOCKED',
        fingerprint
      });
    }
    
    // If login fails, handle security measures
    if (!loginAttempt.success) {
      const currentAttempts = (attemptCounters.get(fingerprint) || 0) + 1;
      attemptCounters.set(fingerprint, currentAttempts);
      
      const logEntry: SecurityLog = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        ip: ipResult.ip,
        country: geo.country,
        city: geo.city,
        fingerprint,
        userAgent: req.get('User-Agent') || 'Unknown',
        platform: req.body.platform || 'Unknown',
        language: req.body.language || 'Unknown',
        screen: req.body.screen || 'Unknown',
        timezone: req.body.timezone || 'Unknown',
        username: req.body.username,
        attempts: currentAttempts,
        reportType: 'failed_login',
        blocked: false
      };
      
      await writeSecurityLog(logEntry);
      
      if (currentAttempts >= 3) {
        return res.status(429).json({
          message: 'تم تجاوز الحد المسموح من المحاولات',
          error: 'TOO_MANY_ATTEMPTS',
          attempts: currentAttempts,
          requiresSecurityCapture: true,
          fingerprint
        });
      }
    } else {
      // Reset attempts on successful login
      attemptCounters.delete(fingerprint);
    }
    
    return loginAttempt;
  } catch (error) {
    console.error('Error in secure login:', error);
    throw error;
  }
}

// ===== وظيفة التصوير الصامت بعد 3 محاولات فاشلة =====
export async function handleSilentCapture(data: {
  imageData: string;
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
  location?: any;
  failedAttempts: number;
  reportType: string;
  filename: string;
}): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    console.log('📸 معالجة التصوير الصامت - البدء');
    console.log(`🔍 البصمة: ${data.fingerprint.substring(0, 10)}...`);
    console.log(`📊 عدد المحاولات الفاشلة: ${data.failedAttempts}`);
    
    // حفظ الصورة أولاً
    let imageFilename: string | null = null;
    
    if (data.imageData) {
      try {
        // إزالة بادئة البيانات
        const base64Data = data.imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // حفظ الصورة مع معرف فريد
        const filepath = path.join(process.cwd(), 'reports', data.filename);
        
        // تحسين وحفظ الصورة
        await sharp(buffer)
          .jpeg({ quality: 85 })
          .resize(800, 600, { fit: 'cover' })
          .toFile(filepath);
        
        imageFilename = data.filename;
        console.log(`💾 تم حفظ الصورة: ${imageFilename}`);
      } catch (imageError) {
        console.error('❌ خطأ في حفظ الصورة:', imageError);
        // المتابعة حتى لو فشل حفظ الصورة
      }
    }
    
    // الحصول على الموقع الجغرافي
    const geo = await getGeoLocation(data.ipAddress || '127.0.0.1');
    
    // إنشاء سجل أمني مفصل للتصوير الصامت
    const logId = randomUUID();
    const securityLogEntry: SecurityLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      ip: data.ipAddress || 'unknown',
      country: geo.country,
      city: geo.city,
      fingerprint: data.fingerprint,
      userAgent: data.userAgent || 'unknown',
      platform: data.location?.platform || 'unknown',
      language: data.location?.language || 'unknown',
      screen: data.location?.screen || 'unknown',
      timezone: data.location?.timezone || 'unknown',
      username: 'محاولة غير مصرح بها',
      attempts: data.failedAttempts,
      reportType: 'failed_login', // تصنيف كمحاولة تسجيل دخول فاشلة
      imageFileName: imageFilename || undefined,
      blocked: false // لم يتم الحظر بعد، فقط التصوير
    };
    
    // كتابة السجل الأمني
    await writeSecurityLog(securityLogEntry);
    
    // تسجيل التفاصيل
    console.log('✅ تم إنشاء سجل أمني للتصوير الصامت:');
    console.log(`   📋 معرف السجل: ${logId}`);
    console.log(`   🌍 الموقع: ${geo.city}, ${geo.country}`);
    console.log(`   📸 اسم الصورة: ${imageFilename || 'لا توجد'}`);
    console.log(`   🕐 الوقت: ${new Date().toLocaleString('ar-EG')}`);
    
    return {
      success: true,
      logId: logId
    };
    
  } catch (error) {
    console.error('❌ خطأ في معالجة التصوير الصامت:', error);
    return {
      success: false,
      error: (error as Error).message || 'خطأ غير معروف'
    };
  }
}