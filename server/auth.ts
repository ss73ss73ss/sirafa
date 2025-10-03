import { Express, Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User as SelectUser, loginSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import * as security from "./security";
import { isSuperAdmin, canRestrictUser, canDeleteUser } from "./security";
import bcrypt from "bcrypt";
import { tempLogin, tempGetUserById, tempGetUserByEmail } from "./temp-auth";
import * as geoip from "geoip-lite";
import axios from "axios";
import { getClientPublicIP, getDisplayIP } from "./utils/ip";
import { getJwtSecret } from "./utils/jwt";
import { eq } from "drizzle-orm";

// JWT Secret Key - centralized management
const JWT_SECRET = getJwtSecret();
const JWT_EXPIRY = "7d"; // 7 days


// Interface for JWT payload
interface JWTPayload {
  userId: number;
  email: string;
  type: string;
}

// Interface for authenticated request
export interface AuthRequest extends Request {
  user: {
    id: number;
    email: string;
    type: string;
    fullName?: string;
    phone?: string;
    active: boolean;
    adminLevel?: number;
    extTransferEnabled?: boolean;
    extAllowedCountries?: string[];
    extAllowedCurrencies?: string[];
    // الصلاحيات التفصيلية
    canManageUsers?: boolean;
    canManageMarket?: boolean;
    canManageChat?: boolean;
    canManageInternalTransfers?: boolean;
    canManageExternalTransfers?: boolean;
    canManageNewAccounts?: boolean;
    canManageSecurity?: boolean;
    canManageSupport?: boolean;
    canManageReports?: boolean;
    canManageSettings?: boolean;
  };
}

// Auth middleware to verify JWT
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  // إضافة تشخيص مفصل للمصادقة
  console.log(`🔐 طلب مصادقة: ${req.method} ${req.path}`);
  console.log(`📋 Authorization Header: ${authHeader ? 'موجود' : 'غير موجود'}`);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`❌ فشل في المصادقة: ${!authHeader ? 'لا يوجد authorization header' : 'لا يبدأ بـ Bearer'}`);
    return res.status(401).json({ message: "توكن غير صالح أو منتهي الصلاحية" });
  }
  
  const token = authHeader.split(' ')[1];
  console.log(`🔑 استخراج التوكن: ${token ? 'نجح' : 'فشل'} - طول التوكن: ${token ? token.length : 0}`);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Set user info in request
    (req as any).user = {
      id: decoded.userId,
      email: decoded.email,
      type: decoded.type
    };
    
    // تحقق من أن المستخدم لا يزال نشطاً (غير معطل)
    try {
      let user;
      try {
        user = await storage.getUser(decoded.userId);
      } catch (dbError) {
        // استخدام النظام المؤقت عند فشل قاعدة البيانات
        console.log('⚠️ فشل الاتصال بقاعدة البيانات في middleware، استخدام النظام المؤقت');
        user = tempGetUserById(decoded.userId);
        if (user) {
          // تحديث معلومات المستخدم من النظام المؤقت
          (req as any).user = {
            id: user.id,
            email: user.email,
            type: user.role,
            fullName: user.name,
            phone: null,
            active: true,
            adminLevel: user.role === 'admin' ? 1 : 0,
            extTransferEnabled: true,
            extAllowedCountries: [],
            extAllowedCurrencies: [],
            canManageUsers: user.role === 'admin',
            canManageMarket: user.role === 'admin',
            canManageChat: user.role === 'admin',
            canManageInternalTransfers: user.role === 'admin',
            canManageExternalTransfers: user.role === 'admin',
            canManageNewAccounts: user.role === 'admin',
            canManageSecurity: user.role === 'admin',
            canManageSupport: user.role === 'admin',
            canManageReports: user.role === 'admin',
            canManageSettings: user.role === 'admin'
          };
          return next();
        }
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // 🛡️ SUPER ADMIN PROTECTION: السوبر أدمن يتجاوز جميع القيود بما في ذلك التحقق من النشاط
      if (security.isSuperAdmin(user.email, user.id)) {
        console.log(`🛡️ Super Admin Access: ${user.email} (ID: ${user.id}) - تجاوز جميع قيود المصادقة بما في ذلك حالة النشاط`);
        // إنشاء معلومات المستخدم مع الصلاحيات الكاملة للسوبر أدمن
        (req as any).user = {
          id: user.id,
          email: user.email,
          type: user.type || 'admin',
          fullName: user.fullName,
          phone: user.phone,
          active: true, // السوبر أدمن يعتبر نشطاً دائماً
          adminLevel: 999, // مستوى إداري أقصى
          extTransferEnabled: true,
          extAllowedCountries: ['all'], // جميع الدول
          extAllowedCurrencies: ['all'], // جميع العملات
          canManageUsers: true,
          canManageMarket: true,
          canManageChat: true,
          canManageInternalTransfers: true,
          canManageExternalTransfers: true,
          canManageNewAccounts: true,
          canManageSecurity: true,
          canManageSupport: true,
          canManageReports: true,
          canManageSettings: true
        };
        return next();
      }
      
      // استخدام المقارنة المناسبة للقيم البولية من PostgreSQL
      // PostgreSQL يخزن البوليان كـ 't' أو 'f'، لذا نستخدم شرط أكثر صرامة
      const isActiveUser = typeof user.active === 'boolean' ? 
        user.active === true : 
        String(user.active) === 't' || String(user.active) === 'true';
      
      if (!isActiveUser) {
        console.log(`منع مستخدم معطل من الوصول: ${decoded.userId}, ${user.fullName}, حالة النشاط: ${user.active}`);
        return res.status(403).json({ 
          message: "هذا الحساب معطل. يرجى التواصل مع الإدارة لإعادة تفعيله." 
        });
      }
      
      // تحديث معلومات المستخدم في الطلب لتشمل جميع البيانات اللازمة
      (req as any).user = {
        id: decoded.userId,
        email: decoded.email,
        type: user.type, // استخدام type من قاعدة البيانات وليس من التوكن
        fullName: user.fullName,
        phone: user.phone,
        active: true,
        adminLevel: user.adminLevel,
        extTransferEnabled: user.extTransferEnabled,
        extAllowedCountries: user.extAllowedCountries,
        extAllowedCurrencies: user.extAllowedCurrencies,
        // الصلاحيات التفصيلية
        canManageUsers: user.canManageUsers,
        canManageMarket: user.canManageMarket,
        canManageChat: user.canManageChat,
        canManageInternalTransfers: user.canManageInternalTransfers,
        canManageExternalTransfers: user.canManageExternalTransfers,
        canManageNewAccounts: user.canManageNewAccounts,
        canManageSecurity: user.canManageSecurity,
        canManageSupport: user.canManageSupport,
        canManageReports: user.canManageReports,
        canManageSettings: user.canManageSettings
      };
      
      next();
    } catch (userError) {
      console.error("خطأ أثناء التحقق من حالة نشاط المستخدم:", userError);
      return res.status(500).json({ message: "حدث خطأ أثناء التحقق من حالة الحساب" });
    }
  } catch (error) {
    return res.status(401).json({ message: "توكن غير صالح أو منتهي الصلاحية" });
  }
}

const scryptAsync = promisify(scrypt);

// توليد رقم حساب فريد (سنستخدمه كرقم هاتف لتجنب تغيير هيكل قاعدة البيانات)
export async function generateAccountNumber(countryId: number): Promise<string> {
  const { storage } = await import('./storage');
  
  // تحديد البادئة حسب دولة المستخدم
  const prefix = countryId === 1 ? '33003' : '44003'; // ليبيا = 33003، خارج ليبيا = 44003
  
  // الحصول على آخر رقم حساب من قاعدة البيانات للبادئة المحددة
  const lastAccountNumber = await storage.getLastAccountNumber(prefix);
  
  if (!lastAccountNumber) {
    // إذا لم يوجد أي حساب لهذه البادئة، ابدأ من البداية
    return `${prefix}001`;
  }
  
  // استخراج الرقم وزيادته بواحد
  const lastNumber = parseInt(lastAccountNumber);
  const nextNumber = lastNumber + 1;
  
  return nextNumber.toString();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // إذا كان كلمة المرور مُشفرة بـ bcrypt
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    return await bcrypt.compare(supplied, stored);
  }
  
  // للنظام القديم مع scrypt
  const [hashed, salt] = stored.split(".");
  if (!salt || !hashed) {
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate JWT token
function generateToken(user: SelectUser) {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    type: user.type
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// ===========================================
// 🛡️ SUPER ADMIN PROTECTION SYSTEM - PERMISSIONS
// ===========================================
// دالة للتحقق من الصلاحيات التفصيلية
// السوبر أدمن له صلاحيات مطلقة ولا يمكن تقييدها نهائياً
export function hasPermission(user: any, permission: string): boolean {
  // 🛡️ SUPER ADMIN PROTECTION: صلاحيات مطلقة مع التحقق المضاعف الآمن
  if (user.email && user.id && security.isSuperAdmin(user.email, user.id)) {
    console.log(`🛡️ Super Admin Permission Granted: ${user.email} (ID: ${user.id}) for ${permission} - Dual Verification Passed`);
    return true;
  }
  
  // المدير العام لديه جميع الصلاحيات
  if (user.adminLevel === 2) {
    return true;
  }
  
  // للمدراء المحدودين، تحقق من الصلاحية المحددة
  if (user.type === 'admin') {
    switch (permission) {
      case 'users': return user.canManageUsers === true;
      case 'market': return user.canManageMarket === true;
      case 'chat': return user.canManageChat === true;
      case 'internal_transfers': return user.canManageInternalTransfers === true;
      case 'external_transfers': return user.canManageExternalTransfers === true;
      case 'new_accounts': return user.canManageNewAccounts === true;
      case 'security': return user.canManageSecurity === true;
      case 'support': return user.canManageSupport === true;
      case 'reports': return user.canManageReports === true;
      case 'settings': return user.canManageSettings === true;
      default: return false;
    }
  }
  
  return false;
}

// ===========================================
// 🛡️ SUPER ADMIN PROTECTION SYSTEM - MIDDLEWARE
// ===========================================
// Middleware للتحقق من صلاحية محددة
// السوبر أدمن يتجاوز جميع قيود الصلاحيات
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: "غير مصرح به" });
    }
    
    // 🛡️ SUPER ADMIN PROTECTION: تجاوز جميع قيود الصلاحيات
    if (isSuperAdmin(user.email, user.id)) {
      console.log(`🛡️ Super Admin Permission Override: ${user.email} bypasses ${permission} check`);
      return next();
    }
    
    if (!hasPermission(user, permission)) {
      return res.status(403).json({ 
        message: "ليس لديك صلاحية للوصول إلى هذا المورد",
        required_permission: permission
      });
    }
    
    next();
  };
}

export function setupAuth(app: Express) {
  app.post("/api/register", async (req, res, next) => {
    try {
      // تحقق من البيانات باستخدام Zod schema
      const { fullName, officeName, officeAddress, email, phone, password, countryId, cityId, countryName, cityName, referralCode } = req.body;
      
      if (!fullName || !officeName || !email || !password || !countryId || !cityId || !countryName || !cityName) {
        return res.status(400).json({ message: "يرجى إدخال جميع الحقول المطلوبة" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "البريد الإلكتروني مسجل بالفعل" });
      }

      // Create the user with hashed password and sequential account number
      const accountNumber = await generateAccountNumber(countryId);
      console.log(`تم توليد رقم حساب جديد: ${accountNumber}`);
      
      // التحقق من رمز الإحالة إذا تم تقديمه
      let referrerId = null;
      if (referralCode && referralCode.trim()) {
        try {
          const referralSystem = await import('./referral-system');
          const validation = await referralSystem.validateReferralCode(referralCode.trim());
          if (validation.valid && validation.referrerId) {
            referrerId = validation.referrerId;
            console.log(`✅ رمز إحالة صالح: ${referralCode.trim()} من المستخدم ${referrerId}`);
          } else {
            console.log(`❌ رمز إحالة غير صالح: ${referralCode.trim()}`);
          }
        } catch (error) {
          console.error('خطأ في التحقق من رمز الإحالة:', error);
        }
      }
      
      // إنشاء رمز إحالة فريد للمستخدم الجديد
      const referralSystem = await import('./referral-system');
      let newUserReferralCode;
      let isUnique = false;
      let attempts = 0;
      
      // توليد رمز فريد (محاولة حتى 10 مرات)
      while (!isUnique && attempts < 10) {
        newUserReferralCode = referralSystem.generateReferralCode();
        
        // التحقق من عدم وجود رمز مشابه
        const validation = await referralSystem.validateReferralCode(newUserReferralCode);
        if (!validation.valid) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({ message: 'فشل في توليد رمز إحالة فريد' });
      }
      
      const user = await storage.createUser({
        fullName,
        officeName,
        officeAddress,
        email,
        phone,
        accountNumber: accountNumber, // استخدام حقل رقم الحساب المخصص
        password: await hashPassword(password),
        countryId,
        cityId,
        countryName,
        cityName,
        referralCode: newUserReferralCode, // إضافة رمز الإحالة للمستخدم الجديد
        referredBy: referrerId, // إضافة معرف المُحيل
      });
      
      // معالجة مكافأة الإحالة إذا كان هناك مُحيل
      if (referrerId) {
        try {
          const referralSystem = await import('./referral-system');
          await referralSystem.processNewUserReferral(user.id, referrerId);
          console.log(`🎁 تم منح مكافأة الإحالة للمستخدم ${referrerId} عن إحالة المستخدم ${user.id}`);
        } catch (error) {
          console.error('خطأ في معالجة مكافأة الإحالة:', error);
          // لا نوقف عملية التسجيل حتى لو فشلت معالجة المكافأة
        }
      }
        
      // Generate JWT token
      const token = generateToken(user);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        message: "تم إنشاء الحساب بنجاح",
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      // طباعة جميع البيانات الواردة للتشخيص
      console.log('📊 البيانات الواردة من العميل:');
      console.log('📦 جميع بيانات الطلب:', JSON.stringify(req.body, null, 2));
      
      // Extract device information for security tracking
      const { email, password, fingerprint, location, ipAddress, userAgent, securityImage, ...deviceInfo } = req.body;
      
      console.log('📧 البريد الإلكتروني:', email);
      console.log('🔑 البصمة:', fingerprint);
      console.log('🔒 كلمة المرور موجودة:', !!password);
      console.log('📷 الصورة الأمنية موجودة:', !!securityImage);
      if (securityImage) {
        console.log('📏 حجم الصورة الحقيقية:', Math.round(securityImage.length / 1024) + 'KB');
        console.log('🎯 أول 50 حرف من الصورة:', securityImage.substring(0, 50) + '...');
      } else {
        console.log('❌ الصورة الأمنية غير موجودة في الطلب - الواجهة الأمامية لا ترسل صورة');
      }
      console.log('🌐 عنوان IP:', ipAddress);
      console.log('🖥️ معرف المتصفح:', userAgent);
      
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      // Check if device is blocked
      if (fingerprint) {
        const blocked = security.checkIfBlocked(fingerprint);
        if (blocked) {
          console.warn(`🚨 Blocked login attempt from fingerprint: ${fingerprint}`);
          await security.logSecurityEvent({
            type: 'BLOCKED_LOGIN_ATTEMPT',
            fingerprint,
            ipAddress: getClientPublicIP(req).ip,
            userAgent: userAgent || req.headers['user-agent'] || '',
            username: email,
            location: location || null,
            severity: 'HIGH'
          });
          return res.status(403).json({ message: "هذا الجهاز محظور من الدخول للنظام" });
        }
      }
      
      // Find user by email - استخدام النظام المؤقت عند فشل قاعدة البيانات
      let user;
      try {
        user = await storage.getUserByEmail(email);
      } catch (dbError) {
        console.log('⚠️ فشل الاتصال بقاعدة البيانات، استخدام النظام المؤقت');
        const tempResult = await tempLogin(email, password);
        if (tempResult) {
          console.log('✅ نجح تسجيل الدخول باستخدام النظام المؤقت');
          const token = jwt.sign(
            { userId: tempResult.user.id, email: tempResult.user.email, type: tempResult.user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
          );
          return res.json({
            message: "تم تسجيل الدخول بنجاح (نظام مؤقت)",
            token,
            user: tempResult.user
          });
        } else {
          return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }
      }
      
      if (!user) {
        console.log(`🚨 محاولة دخول فاشلة - مستخدم غير موجود: ${email}, البصمة: ${fingerprint}`);
        
        // Log failed login attempt for non-existent users (even without fingerprint)
        console.log(`📝 تسجيل محاولة دخول فاشلة لمستخدم غير موجود...`);
        await security.logSecurityEvent({
          type: 'FAILED_LOGIN',
          fingerprint: fingerprint || 'unknown',
          ipAddress: getClientPublicIP(req).ip,
          userAgent: userAgent || req.headers['user-agent'] || 'Unknown',
          username: email,
          location: location || null,
          severity: 'MEDIUM'
        }, securityImage);

        console.log(`✅ تم تسجيل محاولة الدخول الفاشلة للمستخدم غير الموجود في نظام الأمان`);
        // تم إزالة الاستدعاء المزدوج لـ reportSuspiciousActivity لتجنب التسجيل المكرر
        return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }
      
      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        console.log(`🚨 فشل تسجيل الدخول للمستخدم: ${email}, البصمة: ${fingerprint}`);
        
        // Log failed login attempt with security image if available
        if (fingerprint) {
          console.log(`📝 تسجيل محاولة دخول فاشلة في نظام الأمان...`);
          await security.logSecurityEvent({
            type: 'FAILED_LOGIN',
            fingerprint,
            ipAddress: getClientPublicIP(req).ip,
            userAgent: userAgent || req.headers['user-agent'] || 'Unknown',
            username: email,
            location: location || null,
            severity: 'MEDIUM'
          }, securityImage);

          console.log(`✅ تم تسجيل محاولة الدخول الفاشلة بكلمة مرور خاطئة في نظام الأمان`);
          // تم إزالة الاستدعاء المزدوج لـ reportSuspiciousActivity لتجنب التسجيل المكرر
        }
        return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }

      // التحقق من المصادقة الثنائية
      const { user2FAToken } = req.body;
      
      try {
        // الحصول على إعدادات المصادقة الثنائية للمستخدم
        const { db } = await import('./db');
        const { user2FA } = await import('../shared/schema');
        
        const [user2faRecord] = await db.select()
          .from(user2FA)
          .where(eq(user2FA.userId, user.id));
        
        // إذا كانت المصادقة الثنائية مفعلة
        if (user2faRecord?.isEnabled) {
          if (!user2FAToken) {
            // إرجاع رد يطلب إدخال رمز المصادقة الثنائية
            return res.status(202).json({ 
              message: "يرجى إدخال رمز المصادقة الثنائية",
              requires2FA: true,
              // إرسال token مؤقت للمرحلة الثانية
              tempToken: jwt.sign(
                { userId: user.id, email: user.email, type: user.type, temp2FA: true },
                JWT_SECRET,
                { expiresIn: '1h' } // صالح لـ ساعة كاملة لضمان عدم انتهاء الصلاحية
              )
            });
          }
          
          // التحقق من رمز المصادقة الثنائية
          const speakeasy = await import('speakeasy');
          let verified = false;
          
          // التحقق من رمز TOTP
          if (user2FAToken.length === 6 && /^\d{6}$/.test(user2FAToken)) {
            verified = speakeasy.totp.verify({
              secret: user2faRecord.secret,
              encoding: 'base32',
              token: user2FAToken,
              window: 2
            });
          }
          
          // التحقق من رمز النسخ الاحتياطي
          if (!verified && user2faRecord.backupCodes && user2faRecord.backupCodes.includes(user2FAToken.toUpperCase())) {
            verified = true;
            // إزالة رمز النسخ الاحتياطي المستخدم
            const updatedBackupCodes = user2faRecord.backupCodes.filter(code => code !== user2FAToken.toUpperCase());
            await db.update(user2FA)
              .set({ 
                backupCodes: updatedBackupCodes,
                lastUsedAt: new Date()
              })
              .where(eq(user2FA.userId, user.id));
          } else if (verified) {
            // تحديث آخر استخدام
            await db.update(user2FA)
              .set({ lastUsedAt: new Date() })
              .where(eq(user2FA.userId, user.id));
          }
          
          if (!verified) {
            console.log(`🚨 فشل المصادقة الثنائية للمستخدم: ${email}, الرمز: ${user2FAToken}`);
            // تسجيل محاولة فاشلة للمصادقة الثنائية
            if (fingerprint) {
              await security.logSecurityEvent({
                type: 'FAILED_2FA',
                fingerprint,
                ipAddress: getClientPublicIP(req).ip,
                userAgent: userAgent || req.headers['user-agent'] || 'Unknown',
                username: email,
                userId: user.id,
                location: location || null,
                severity: 'HIGH'
              }, securityImage);
            }
            return res.status(401).json({ message: "رمز المصادقة الثنائية غير صحيح" });
          }
          
          console.log(`✅ نجحت المصادقة الثنائية للمستخدم: ${email}`);
        }
      } catch (error) {
        console.error('خطأ في التحقق من المصادقة الثنائية:', error);
        // في حالة الخطأ، نكمل تسجيل الدخول العادي
      }
      
      // تحقق من أن الحساب مفعل - تعامل محسن مع القيم البولية من PostgreSQL
      // التحقق بشكل دقيق من قيم البوليان (PostgreSQL يمكن أن يعيد true, false, 't', 'f')
      const isActiveUser = typeof user.active === 'boolean' ? 
        user.active === true : 
        String(user.active) === 't' || String(user.active) === 'true';
      
      if (!isActiveUser) {
        console.log(`منع دخول مستخدم معطل: ${user.fullName} (${user.id}), حالة النشاط: [${user.active}]`);
        return res.status(403).json({ message: "هذا الحساب معطل. يرجى التواصل مع الإدارة." });
      }
      
      // Log successful login
      if (fingerprint) {
        await security.logSecurityEvent({
          type: 'SUCCESSFUL_LOGIN',
          fingerprint,
          ipAddress: getClientPublicIP(req).ip,
          userAgent: userAgent || req.headers['user-agent'] || '',
          username: email,
          userId: user.id,
          location: location || null,
          severity: 'LOW'
        });
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({
        message: "تم تسجيل الدخول بنجاح",
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (_req, res) => {
    // No server-side logout needed with JWT
    // Client should dispose of the token
    res.status(200).json({ message: "تم تسجيل الخروج بنجاح" });
  });

  app.get("/api/user", authMiddleware, async (req, res) => {
    // Get full user details from database using id from token
    const userId = (req as any).user.id;
    const fullUserData = await storage.getUser(userId);
    
    if (!fullUserData) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }
    
    // Remove password before sending and convert snake_case to camelCase
    const { password, ...userWithoutPassword } = fullUserData;
    
    // Calculate permission flags based on user type and external transfer settings
    const hasAgentAccess = userWithoutPassword.type === "agent" || userWithoutPassword.type === "office";
    const hasExternalTransferAccess = hasAgentAccess && userWithoutPassword.extTransferEnabled === true;
    
    // Ensure accountNumber is available for frontend
    const userData = {
      ...userWithoutPassword,
      accountNumber: userWithoutPassword.accountNumber || `20000000${userId.toString().padStart(2, '0')}`,
      hasAgentAccess,
      hasExternalTransferAccess,
      adminLevel: userWithoutPassword.adminLevel || 0
    };
    
    console.log(`🔍 بيانات المستخدم ${fullUserData.fullName} (ID: ${userId}):`, {
      type: userWithoutPassword.type,
      extTransferEnabled: userWithoutPassword.extTransferEnabled,
      hasAgentAccess,
      hasExternalTransferAccess
    });
    
    res.json(userData);
  });
}
