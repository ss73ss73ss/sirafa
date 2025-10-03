import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { initializeRealtimeEvents, getRealtimeEvents } from "./realtime-events.js";
import { storage, DatabaseStorage } from "./storage";
import { db, pool } from "./db";
import { setupAuth, authMiddleware, requirePermission, hasPermission, AuthRequest } from "./auth";
import { setupVerificationUploadRoute } from "./verification-upload-route";
import { setupUnreadMessagesRoutes } from "./unread-messages";
import { ensureAuth } from "./unread-messages";
import { ObjectStorageService } from "./objectStorage";
import * as pushNotifications from "./push-notifications";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { upload, handleUploadErrors } from "./file-upload";
import { VoiceService, voiceUpload } from "./voice-service";
import * as security from "./security";
import { getClientPublicIP, getDisplayIP, getGeoLocation } from "./utils/ip";

import jwt from "jsonwebtoken";
import { getJwtSecret } from "./utils/jwt";
import path from "path";
import { eq, and, or, not, sql, like, desc, asc, inArray, isNull, isNotNull, between, gte, lte } from "drizzle-orm";
import { 
  // Basic types
  User, InsertUser, insertUserSchema,
  Transaction, InsertTransaction, insertTransactionSchema,
  Balance, InsertBalance, insertBalanceSchema,
  Transfer, InsertTransfer, insertTransferSchema,
  
  // Market types
  MarketOffer, MarketOfferEnhanced, InsertMarketOffer, insertMarketOfferSchema,
  MarketTransaction, InsertMarketTransaction, insertMarketTransactionSchema,
  MarketMessage,
  
  // Other types
  UpgradeRequest, InsertUpgradeRequest, insertUpgradeRequestSchema,
  CityTransfer, InsertCityTransfer, insertCityTransferSchema,
  InternationalTransfer, InsertInternationalTransfer, insertInternationalTransferSchema,
  AgentTransfer, InsertAgentTransfer, insertAgentTransferSchema,
  VerificationRequest, InsertVerificationRequest, insertVerificationRequestSchema,
  TransactionLog, InsertTransactionLog, insertTransactionLogSchema,
  ExchangeRate, InsertExchangeRate, insertExchangeRateSchema,
  ExportJob, InsertExportJob, insertExportJobSchema,
  MessageVoice, InsertMessageVoice,
  
  // Validation schemas
  transferSchema, upgradeRequestSchema, marketOfferSchema,
  updateUserProfileSchema, changePasswordSchema, 
  insertUserSettingsSchema, passwordResetRequestSchema, passwordResetConfirmSchema,
  // 2FA schemas
  insertUser2FASchema, enable2FASchema, verify2FASchema, disable2FASchema,
  User2FA, InsertUser2FA, Enable2FA, Verify2FA, Disable2FA,
  
  // Database tables
  users, upgradeRequests, transfers, cityTransfers, internationalTransfers, 
  internationalTransfersNew, marketTransactions, marketOffers, balances,
  chatRooms, chatMessages, chatMessageReads, privateChats, privateMessages, 
  userNotifications, transactions, groupChats, groupMembers, groupMessages,
  agentTransfers, agentOffices, officeCommissions, cityTransferCommissions,
  countries as countriesTable, systemCommissionSettings, systemCommissionRates,
  commissionLogs, verificationRequests, internalTransferLogs, 
  transactionLogs, exchangeRates, exportJobs, messageVoices, voiceSettings, 
  voiceRateLimits, userSettings, passwordResetRequests, commissionPoolTransactions,
  insertCityTransferCommissionSchema, hiddenTransfers, user2FA,
  // Rewards system
  rewards, userRewards, badgeTypes, userBadges, pointsHistory, userPoints, rewardSettings,
  // Referral system
  systemSettings, referralRewards, referralBalances, insertReferralRewardSchema, insertSystemSettingsSchema,
  // Access restrictions system
  pageRestrictions, auditLogs, insertPageRestrictionSchema, insertAuditLogSchema,
  PageRestriction, InsertPageRestriction, AuditLog, InsertAuditLog,
  // Dev Studio tables
  devPages, devBlocks, devComponents, devThemes, devFeatureFlags, devAuditLogs
} from "@shared/schema";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import { ReferenceGenerator } from './utils/reference-generator';
import { registerAdminTransactionRoutes } from './admin-transaction-routes';
import { rewardsService } from './rewards-service';
import * as referralSystem from './referral-system';

// ✅ Middleware للتحقق من القيود
const checkPageRestrictions = (pageKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log(`🔍 [تحقق قيود الجديد] فحص قيود صفحة: ${pageKey} للمستخدم ID: ${req.user.id}`);
      
      // Super Admin يتجاوز جميع القيود
      if (security.isSuperAdmin(req.user.email, req.user.id)) {
        console.log(`🔑 Super Admin تجاوز قيود صفحة ${pageKey}`);
        return next();
      }

      // أولاً: البحث عن قيد شامل نشط
      console.log(`📊 بحث عن قيود شاملة لصفحة ${pageKey}...`);
      const globalRestriction = await db.select().from(pageRestrictions)
        .where(and(
          isNull(pageRestrictions.userId), // قيود شاملة فقط
          eq(pageRestrictions.scope, 'global'), // تحديد واضح للنطاق
          or(
            eq(pageRestrictions.pageKey, pageKey),
            eq(pageRestrictions.pageKey, 'all')
          ),
          eq(pageRestrictions.isActive, true),
          or(
            isNull(pageRestrictions.expiresAt),
            gte(pageRestrictions.expiresAt, new Date())
          )
        ))
        .limit(1);

      if (globalRestriction.length > 0) {
        console.log(`🔍 [قيد شامل NEW] وُجد قيد شامل نشط: ${globalRestriction[0].reason}`);
        
        // ثانياً: البحث عن استثناء لهذا المستخدم
        console.log(`🔍 [استثناء NEW] بحث عن استثناء للمستخدم ${req.user.id}...`);
        const userException = await db.select().from(pageRestrictions)
          .where(and(
            eq(pageRestrictions.userId, req.user.id),
            or(
              eq(pageRestrictions.pageKey, pageKey),
              eq(pageRestrictions.pageKey, 'all')
            ),
            eq(pageRestrictions.scope, 'exception'),
            // ❌ إزالة شرط isActive = false (كان يسبب المشكلة)
            or(
              isNull(pageRestrictions.expiresAt),
              gte(pageRestrictions.expiresAt, new Date())
            )
          ))
          .orderBy(pageRestrictions.createdAt) // أحدث استثناء أولاً
          .limit(1);

        if (userException.length > 0) {
          console.log(`✅ [استثناء NEW] وُجد استثناء للمستخدم: ${userException[0].reason}`);
          return next(); // السماح بالوصول - المستخدم مستثنى
        }

        console.log(`🚫 [رفض NEW] لا يوجد استثناء - سيتم منع الوصول`);
        return res.status(403).json({ 
          message: `الوصول مقيد: ${globalRestriction[0].reason || 'غير مسموح بالوصول'}`,
          restrictionReason: globalRestriction[0].reason,
          isBlocked: true
        });
      }

      // ثالثاً: البحث عن قيود خاصة بالمستخدم
      console.log(`📊 بحث عن قيود خاصة بالمستخدم ${req.user.id}...`);
      const userRestriction = await db.select().from(pageRestrictions)
        .where(and(
          eq(pageRestrictions.userId, req.user.id),
          or(
            eq(pageRestrictions.pageKey, pageKey),
            eq(pageRestrictions.pageKey, 'all')
          ),
          eq(pageRestrictions.isActive, true),
          or(
            isNull(pageRestrictions.expiresAt),
            gte(pageRestrictions.expiresAt, new Date())
          )
        ))
        .limit(1);

      if (userRestriction.length > 0) {
        console.log(`🚫 [قيد خاص] وُجد قيد خاص بالمستخدم: ${userRestriction[0].reason}`);
        return res.status(403).json({ 
          message: `الوصول مقيد: ${userRestriction[0].reason || 'غير مسموح بالوصول'}`,
          restrictionReason: userRestriction[0].reason,
          isBlocked: true
        });
      }
      
      console.log(`✅ [تحقق قيود] لا توجد قيود لصفحة ${pageKey}`);
      next();
    } catch (error) {
      console.error(`❌ [تحقق قيود] خطأ في التحقق من قيد ${pageKey}:`, error);
      return res.status(500).json({ message: "خطأ في التحقق من القيود" });
    }
  };
};

// Extend Socket.IO Socket interface to include custom properties
declare module "socket.io" {
  interface Socket {
    userId?: number;
    userEmail?: string;
    userName?: string | null;
  }
}

// Import AuthRequest from auth module instead of defining it locally

// Helper function to safely convert string amounts to numbers
function safeParseAmount(amount: string | number | undefined): number {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Helper function to trigger referral rewards allocation
async function triggerReferralReward(txId: number) {
  try {
    await referralSystem.allocateReferralReward(txId);
  } catch (error) {
    console.error('خطأ في توزيع مكافأة الإحالة:', error);
    // لا نريد أن يفشل النظام بسبب خطأ في الإحالة
  }
}

// خريطة ترجمة أنواع المعاملات
const typeMapping: Record<string, string> = {
  internal_transfer_in: "تحويل داخلي وارد",
  internal_transfer_out: "تحويل داخلي صادر",
  office_remit: "حوالة مكتبية",
  market_trade_buy: "شراء عملة",
  market_trade_sell: "بيع عملة",
  exchange: "صرافة",
  commission_withdrawal: "سحب عمولة",
  external_payment: "دفع خارجي",
  fee: "عمولة"
};

// خريطة ترجمة الحالات
const statusLabelMap: Record<string, string> = {
  completed: "مكتمل",
  pending: "قيد الانتظار",
  failed: "فاشل"
};

// دالة مساعدة لتنسيق التاريخ
function formatDateSafely(date: Date | null): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('ar-LY');
  } catch (error) {
    return '';
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy configuration is handled in index.ts
  
  // PWA static files are now served by Vite from client/public/

  // إعداد المسارات
  setupVerificationUploadRoute(app); // إعداد مسار تحميل ملفات التحقق
  setupAuth(app); // إعداد مسارات المصادقة
  setupUnreadMessagesRoutes(app); // إعداد مسارات تتبع الرسائل غير المقروءة
  
  // إعداد نظام الأمان
  await security.initSecurity();
  
  // إعداد نظام الإشعارات المحمولة
  await pushNotifications.initializePushSubscriptions();
  
  // تتبع جميع طلبات POST
  app.use((req, res, next) => {
    if (req.method === 'POST') {
      console.log(`🌐 POST Request to: ${req.path}`);
      if (req.path.includes('international')) {
        console.log(`🌍 طلب تحويل دولي إلى: ${req.path}`);
      }
    }
    next();
  });
  
  // إنشاء خادم HTTP
  const httpServer = createServer(app);
  
  // إعداد خادم Socket.IO للدردشة الفورية مع middleware للمصادقة
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/socket.io'
  });

  // إضافة middleware للمصادقة في Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('❌ WebSocket: لا يوجد token في الاتصال');
        return next(new Error('غير مصرح به - لا يوجد token'));
      }

      const JWT_SECRET = getJwtSecret();
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      
      // التحقق من وجود المستخدم في قاعدة البيانات
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        console.log(`❌ WebSocket: المستخدم ${decoded.userId} غير موجود`);
        return next(new Error('مستخدم غير موجود'));
      }

      // ربط معلومات المستخدم بـ socket
      socket.userId = user.id;
      socket.userEmail = user.email;
      socket.userName = user.fullName;
      
      console.log(`✅ WebSocket: تم مصادقة المستخدم ${user.fullName} (${user.id})`);
      next();
    } catch (error) {
      console.log(`❌ WebSocket: خطأ في المصادقة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      return next(new Error('token غير صالح'));
    }
  });

  // تمرير Socket.IO إلى جميع الطلبات
  app.set('io', io);
  
  // تهيئة خدمة الأحداث اللحظية
  const realtimeEvents = initializeRealtimeEvents(io);
  app.set('realtimeEvents', realtimeEvents);
  
  // معالجة اتصالات WebSocket (المصادقة تمت بالفعل)
  io.on('connection', async (socket) => {
    console.log(`🟢 مستخدم مصادق متصل: ${socket.userName} (${socket.userId}) - Socket: ${socket.id}`);
    
    // 🏠 انضمام تلقائي للغرف المطلوبة للأحداث اللحظية
    const userId = socket.userId;
    const roomsToJoin = [
      `user-${userId}`,                    // الأحداث الشخصية
      `balance-${userId}-LYD`,             // أحداث رصيد الدينار الليبي
      `balance-${userId}-USD`,             // أحداث رصيد الدولار
      `balance-${userId}-EUR`,             // أحداث رصيد اليورو
      `balance-${userId}-TRY`,             // أحداث رصيد الليرة التركية
      `balance-${userId}-AED`,             // أحداث رصيد الدرهم الإماراتي
      `balance-${userId}-EGP`,             // أحداث رصيد الجنيه المصري
      `balance-${userId}-TND`,             // أحداث رصيد الدينار التونسي
      `balance-${userId}-GBP`,             // أحداث رصيد الجنيه الإسترليني
      'market-general',                    // أحداث السوق العامة
      'market-USD-LYD',                    // أحداث سوق الدولار/دينار ليبي
      'market-LYD-USD',                    // أحداث سوق دينار ليبي/دولار
      'market-EUR-LYD',                    // أحداث سوق اليورو/دينار ليبي
      'market-LYD-EUR'                     // أحداث سوق دينار ليبي/يورو
    ];
    
    // الانضمام لجميع الغرف
    roomsToJoin.forEach(room => {
      socket.join(room);
    });
    
    console.log(`🏠 انضم المستخدم ${socket.id} إلى ${roomsToJoin.length} غرفة للأحداث اللحظية`);
    console.log(`📋 الغرف: ${roomsToJoin.join(', ')}`);
    
    // البحث عن الغرفة العامة للدردشة
    const publicRoom = await storage.getPublicChatRoom();
    if (publicRoom) {
      // جلب آخر الرسائل مع الإعجابات
      const messages = await storage.getChatMessages(publicRoom.id, 50);
      
      // إرسال الرسائل السابقة للمستخدم المتصل
      socket.emit('chatHistory', messages.reverse());
      
      // الانضمام للغرفة
      socket.join(`room-${publicRoom.id}`);
      console.log(`📥 انضم المستخدم ${socket.id} إلى room-${publicRoom.id} للدردشة`);
    }
    
    // معالجة حدث "يكتب الآن..."
    socket.on('typing', async (data: { roomType: string; roomId: number; userId: number; userName: string }) => {
      // التحقق من حالة الكتم للمجموعات فقط
      if (data.roomType === 'group') {
        const isMuted = await storage.isUserMuted(data.roomId, data.userId);
        if (isMuted) {
          console.log(`🔇 المستخدم ${data.userId} مكتوم في المجموعة ${data.roomId} - منع مؤشر الكتابة`);
          return; // لا تظهر مؤشر الكتابة للمستخدمين المكتومين
        }
      }
      
      // إرسال حدث الكتابة للمستخدمين الآخرين في نفس الغرفة
      const roomIdentifier = `${data.roomType}-${data.roomId}`;
      console.log(`👆 المستخدم ${data.userName} يكتب الآن في الغرفة ${roomIdentifier}`);
      
      // إرسال لجميع المستخدمين في الغرفة باستثناء المرسل
      console.log(`📡 إرسال حدث userTyping للغرفة ${roomIdentifier}`);
      
      // إضافة تشخيص للأعضاء المتصلين
      const sockets = await io.in(roomIdentifier).fetchSockets();
      console.log(`🔍 عدد الأعضاء المتصلين في ${roomIdentifier}: ${sockets.length}`);
      sockets.forEach(s => {
        const socketWithUser = s as any;
        console.log(`👤 عضو متصل: ${socketWithUser.userId} - Socket: ${s.id}`);
      });
      
      socket.to(roomIdentifier).emit('userTyping', { 
        userId: data.userId,
        userName: data.userName,
        roomType: data.roomType,
        roomId: data.roomId
      });
      console.log(`✅ تم إرسال حدث userTyping`);
    });
    
    // معالجة حدث "توقف عن الكتابة"
    socket.on('stopTyping', (data: { roomType: string; roomId: number; userId: number; userName: string }) => {
      // إرسال حدث التوقف عن الكتابة للمستخدمين الآخرين في نفس الغرفة
      const roomIdentifier = `${data.roomType}-${data.roomId}`;
      console.log(`✋ المستخدم ${data.userName} توقف عن الكتابة في الغرفة ${roomIdentifier}`);
      
      // إرسال لجميع المستخدمين في الغرفة باستثناء المرسل
      console.log(`📡 إرسال حدث userStoppedTyping للغرفة ${roomIdentifier}`);
      socket.to(roomIdentifier).emit('userStoppedTyping', { 
        userId: data.userId,
        userName: data.userName,
        roomType: data.roomType,
        roomId: data.roomId
      });
    });
    
    // الانضمام إلى مجموعة محادثة
    socket.on('joinGroupChat', async (groupId, callback) => {
      try {
        const normalizedGroupId = Number(groupId);
        const roomName = `group-${normalizedGroupId}`;
        
        console.log(`📥 انضم المستخدم ${socket.id} إلى ${roomName}`);
        
        // الانضمام إلى غرفة المجموعة
        await socket.join(roomName);
        
        // التحقق من عدد الأعضاء في الغرفة
        const roomSockets = await io.in(roomName).fetchSockets();
        console.log(`🔍 عدد الأعضاء في ${roomName}: ${roomSockets.length}`);
        roomSockets.forEach(s => {
          console.log(`👤 عضو في الغرفة: ${s.data?.userId || 'غير معروف'} - Socket: ${s.id}`);
        });
        
        // تأكيد الانضمام للعميل
        if (callback) {
          callback({ success: true, roomSize: roomSockets.length, groupId: normalizedGroupId });
        }
        
        // جلب آخر الرسائل في المجموعة
        const messages = await storage.getGroupMessages(normalizedGroupId, 50);
        
        // إرسال تاريخ الرسائل للمستخدم
        socket.emit('groupChatHistory', { groupId: normalizedGroupId, messages: messages.reverse() });

        // إرسال تأكيد الانضمام للعميل مع بيانات كاملة
        socket.emit('groupJoined', {
          success: true,
          roomSize: roomSockets.length,
          groupId: normalizedGroupId
        });

        // إرسال حدث انضمام عضو جديد للآخرين
        const user = await storage.getUser(socket.userId);
        if (user) {
          socket.to(roomName).emit('memberJoinedGroup', {
            groupId: normalizedGroupId,
            userId: socket.userId,
            fullName: user.fullName
          });
        }
        
      } catch (error) {
        console.error('خطأ في الانضمام لمجموعة المحادثة:', error);
        if (callback) {
          callback({ success: false, error: error.message });
        }
      }
    });

    // مغادرة مجموعة محادثة
    socket.on('leaveGroupChat', async (groupId) => {
      try {
        const normalizedGroupId = Number(groupId);
        const roomName = `group-${normalizedGroupId}`;
        const socketWithUser = socket as any;
        const userId = socketWithUser.userId;
        
        console.log(`📤 غادر المستخدم ${socket.id} (${userId}) الغرفة ${roomName}`);
        
        // إرسال حدث مغادرة العضو للآخرين قبل المغادرة
        socket.to(roomName).emit('memberLeftGroup', {
          groupId: normalizedGroupId,
          userId: userId
        });
        
        await socket.leave(roomName);
        
        // إرسال قائمة محدثة من الأعضاء المتصلين فوراً
        setTimeout(async () => {
          try {
            const roomSockets = await io.in(roomName).fetchSockets();
            const uniqueUsers = new Map(); // لتجنب المستخدمين المكررين
            
            for (const sock of roomSockets) {
              const sockWithUser = sock as any;
              const sockUserId = sockWithUser.userId || sock.data?.userId;
              
              if (sockUserId && !uniqueUsers.has(sockUserId)) {
                try {
                  const user = await storage.getUser(sockUserId);
                  if (user) {
                    uniqueUsers.set(sockUserId, {
                      userId: user.id,
                      fullName: user.fullName
                    });
                  }
                } catch (error) {
                  console.error(`خطأ في جلب معلومات المستخدم ${sockUserId}:`, error);
                }
              }
            }
            
            const onlineMembers = Array.from(uniqueUsers.values());
            
            // إرسال القائمة المحدثة لجميع الأعضاء في الغرفة
            io.to(roomName).emit('onlineMembersUpdate', {
              groupId: normalizedGroupId,
              members: onlineMembers
            });
            
            console.log(`📋 تحديث فوري لقائمة الأعضاء المتصلين في ${roomName}: ${onlineMembers.length} أعضاء`);
          } catch (error) {
            console.error(`خطأ في تحديث قائمة الأعضاء المتصلين للغرفة ${roomName}:`, error);
          }
        }, 50);
        
      } catch (error) {
        console.error('خطأ في مغادرة مجموعة المحادثة:', error);
      }
    });

    // الحصول على قائمة الأعضاء المتصلين
    socket.on('getOnlineMembers', async (data: { groupId: number }) => {
      try {
        const { groupId } = data;
        const roomName = `group-${groupId}`;
        
        console.log(`📋 طلب قائمة الأعضاء المتصلين للمجموعة ${groupId}`);
        
        // جلب جميع الـ sockets المتصلين في الغرفة
        const roomSockets = await io.in(roomName).fetchSockets();
        
        // تحويل معرفات المستخدمين إلى معلومات كاملة (مع منع التكرار)
        const uniqueUsers = new Map(); // لتجنب المستخدمين المكررين
        
        for (const sock of roomSockets) {
          // محاولة الحصول على userId من مصادر مختلفة
          const socketWithUser = sock as any;
          const userId = socketWithUser.userId || sock.data?.userId || sock.handshake?.auth?.userId;
          console.log(`🔍 Socket ${sock.id}: userId=${userId}, data=${JSON.stringify(sock.data)}`);
          
          if (userId && !uniqueUsers.has(userId)) {
            try {
              const user = await storage.getUser(userId);
              if (user) {
                uniqueUsers.set(userId, {
                  userId: user.id,
                  fullName: user.fullName
                });
                console.log(`✅ أضيف عضو متصل: ${user.fullName} (${user.id})`);
              }
            } catch (error) {
              console.error(`خطأ في جلب معلومات المستخدم ${userId}:`, error);
            }
          } else if (userId && uniqueUsers.has(userId)) {
            console.log(`🔄 تخطي مستخدم مكرر: ${userId}`);
          } else {
            console.log(`⚠️ Socket ${sock.id}: لا يوجد معرف مستخدم`);
          }
        }
        
        const onlineMembers = Array.from(uniqueUsers.values());
        
        console.log(`📋 الأعضاء المتصلين في المجموعة ${groupId}:`, onlineMembers);
        
        // إرسال قائمة الأعضاء المتصلين
        socket.emit('onlineMembers', {
          groupId,
          members: onlineMembers
        });
        
      } catch (error) {
        console.error('خطأ في جلب الأعضاء المتصلين:', error);
      }
    });
    
    // استقبال رسائل جديدة (آمن - يستخدم socket.userId المصادق)
    socket.on('sendMessage', async (data: { content: string; roomId?: number; roomType?: string; fileUrl?: string | null; fileType?: string | null }) => {
      try {
        const userId = socket.userId; // استخدام معرف المستخدم المصادق من socket
        const { content, roomId, roomType, fileUrl, fileType } = data;
        
        if (!userId) {
          socket.emit('error', { message: 'غير مصرح به - مستخدم غير مصادق' });
          return;
        }
        
        // التحقق من وجود المستخدم
        const user = await storage.getUser(userId);
        if (!user) {
          socket.emit('error', { message: 'مستخدم غير موجود' });
          return;
        }
        
        // إذا لم يتم تحديد الغرفة، استخدم الغرفة العامة
        const targetRoomId = roomId || (publicRoom ? publicRoom.id : 0);
        if (!targetRoomId) {
          socket.emit('error', { message: 'غرفة غير موجودة' });
          return;
        }
        
        console.log(`استقبال رسالة جديدة مع ملف: ${fileUrl || 'لا يوجد مرفق'}`);
        
        // حفظ الرسالة في قاعدة البيانات مع معلومات الملف إن وجدت
        const message = await storage.createChatMessage({
          roomId: targetRoomId,
          senderId: userId,
          content,
          fileUrl: fileUrl || null,
          fileType: fileType || null
        });
        
        // إرسال الرسالة لجميع المستخدمين في الغرفة مع معلومات الإعجابات
        io.to(`room-${targetRoomId}`).emit('newMessage', {
          ...message,
          senderName: user.fullName,
          likesCount: 0,
          likedByMe: false
        });
        
        // إرسال إشعار push للمستخدمين الآخرين في الغرفة
        try {
          // جلب جميع الأعضاء في الغرفة
          const roomMembers = await storage.getRoomMembers(targetRoomId);
          for (const member of roomMembers) {
            if (member.id !== userId) { // عدم إرسال إشعار للمرسل نفسه
              await pushNotifications.sendPushNotificationToUser(member.id, {
                title: `رسالة جديدة من ${user.fullName}`,
                body: content.length > 50 ? content.substring(0, 50) + '...' : content,
                data: { 
                  type: 'chat_message',
                  roomId: targetRoomId,
                  senderId: userId,
                  senderName: user.fullName
                },
                url: '/chat',
                tag: `room-${targetRoomId}`
              });
            }
          }
        } catch (pushError) {
          console.error('خطأ في إرسال إشعارات push للرسالة العامة:', pushError);
        }
        
        console.log(`رسالة جديدة من ${user.fullName}: ${content}`);
      } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        socket.emit('error', { message: 'حدث خطأ أثناء إرسال الرسالة' });
      }
    });

    // معالج إعجابات الرسائل الفورية
    socket.on('toggleMessageLike', async (data: { messageId: number }) => {
      try {
        const { messageId } = data;
        const userId = socket.userId; // استخدام معرف المستخدم المصادق من socket
        
        if (!userId) {
          socket.emit('error', { message: 'غير مصرح به - مستخدم غير مصادق' });
          return;
        }
        
        // التحقق من وجود المستخدم
        const user = await storage.getUser(userId);
        if (!user) {
          socket.emit('error', { message: 'مستخدم غير موجود' });
          return;
        }
        
        // تبديل الإعجاب
        const result = await storage.toggleMessageLike(messageId, userId);
        
        // إرسال تحديث الإعجاب لجميع المستخدمين في الغرفة
        io.to(`room-1`).emit('messageLikeUpdate', {
          messageId,
          liked: result.liked,
          count: result.count,
          userId,
          userName: user.fullName
        });
        
        console.log(`${result.liked ? 'إعجاب' : 'إلغاء إعجاب'} من ${user.fullName} للرسالة ${messageId}`);
      } catch (error) {
        console.error('خطأ في معالجة إعجاب الرسالة:', error);
        socket.emit('error', { message: 'حدث خطأ أثناء معالجة الإعجاب' });
      }
    });
    
    // الانضمام إلى محادثة خاصة (آمن - يستخدم socket.userId المصادق)
    socket.on('joinPrivateChat', async (data: { otherUserId: number }) => {
      try {
        const userId = socket.userId; // استخدام معرف المستخدم المصادق من socket
        const { otherUserId } = data;
        
        if (!userId) {
          socket.emit('error', { message: 'غير مصرح به - مستخدم غير مصادق' });
          return;
        }
        
        // التحقق من وجود المستخدمين
        const user = await storage.getUser(userId);
        const otherUser = await storage.getUser(otherUserId);
        
        if (!user || !otherUser) {
          socket.emit('error', { message: 'أحد المستخدمين غير موجود' });
          return;
        }
        
        // البحث عن المحادثة الخاصة أو إنشاء واحدة جديدة
        let privateChat = await storage.getPrivateChat(userId, otherUserId);
        
        if (!privateChat) {
          privateChat = await storage.createPrivateChat(userId, otherUserId);
        }
        
        // جلب الرسائل السابقة
        const messages = await storage.getPrivateMessages(privateChat.id, 50);
        
        // الانضمام إلى غرفة المحادثة الخاصة
        socket.join(`private-${privateChat.id}`);
        
        // تعليم الرسائل كمقروءة
        await storage.markMessagesAsRead(privateChat.id, userId);
        
        // إرسال المحادثة والرسائل السابقة للمستخدم
        socket.emit('privateChat', {
          chat: privateChat,
          otherUser: {
            id: otherUser.id,
            fullName: otherUser.fullName
          },
          messages: messages.reverse()
        });
        
        console.log(`المستخدم ${userId} انضم إلى محادثة خاصة مع ${otherUserId}`);
      } catch (error) {
        console.error('خطأ في الانضمام إلى محادثة خاصة:', error);
        socket.emit('error', { message: 'حدث خطأ أثناء الانضمام إلى المحادثة الخاصة' });
      }
    });
    
    // إرسال رسالة خاصة
    socket.on('sendPrivateMessage', async (data: { chatId: number; senderId: number; content: string; fileUrl?: string | null; fileType?: string | null }) => {
      try {
        const { chatId, senderId, content, fileUrl, fileType } = data;
        
        // التحقق من وجود المستخدم المرسل
        const sender = await storage.getUser(senderId);
        if (!sender) {
          socket.emit('error', { message: 'المستخدم المرسل غير موجود' });
          return;
        }
        
        console.log(`استقبال رسالة خاصة جديدة مع ملف: ${fileUrl || 'لا يوجد مرفق'}`);
        
        // حفظ الرسالة في قاعدة البيانات
        const message = await storage.createPrivateMessage({
          chatId,
          senderId,
          content,
          fileUrl: fileUrl || null,
          fileType: fileType || null,
          isRead: false
        });
        
        // الحصول على معلومات المحادثة
        const chat = await db.query.privateChats.findFirst({
          where: eq(privateChats.id, chatId)
        });
        
        if (!chat) {
          socket.emit('error', { message: 'المحادثة غير موجودة' });
          return;
        }
        
        // تحديد المستخدم المستقبل
        const receiverId = chat.user1Id === senderId ? chat.user2Id : chat.user1Id;
        
        // تأكد من أن المستقبل منضم إلى غرفة المحادثة
        // نفحص جميع الاتصالات ونضيف كل متصل إلى غرفة المحادثة
        const connectedSockets = await io.fetchSockets();
        for (const connectedSocket of connectedSockets) {
          const socketData = connectedSocket.data;
          // إذا كان المستخدم هو المستقبل، ضمه إلى غرفة المحادثة
          if (socketData && socketData.userId === receiverId) {
            connectedSocket.join(`private-${chatId}`);
            console.log(`إضافة المستخدم ${receiverId} إلى الغرفة private-${chatId} تلقائياً`);
          }
        }
        
        // إرسال الرسالة لجميع المستخدمين في غرفة المحادثة الخاصة
        io.to(`private-${chatId}`).emit('newPrivateMessage', {
          ...message,
          senderName: sender.fullName
        });
        
        // إنشاء إشعار للمستقبل
        await storage.createUserNotification({
          userId: receiverId,
          title: "رسالة خاصة جديدة",
          body: `لديك رسالة جديدة من ${sender.fullName}`,
          type: "info",
          isRead: false
        });

        // إرسال إشعار push للمستقبل
        try {
          await pushNotifications.sendPushNotificationToUser(receiverId, {
            title: `رسالة خاصة من ${sender.fullName}`,
            body: content.length > 50 ? content.substring(0, 50) + '...' : content,
            data: { 
              type: 'private_message',
              chatId: chatId,
              senderId: senderId,
              senderName: sender.fullName
            },
            url: `/private-chat/${chatId}`,
            tag: `private-${chatId}`
          });
        } catch (pushError) {
          console.error('خطأ في إرسال إشعار push للرسالة الخاصة:', pushError);
        }
        
        console.log('تم إرسال رسالة خاصة جديدة', message);
      } catch (error) {
        console.error('خطأ في إرسال رسالة خاصة:', error);
        socket.emit('error', { message: 'حدث خطأ أثناء إرسال الرسالة الخاصة' });
      }
    });
    
    // إعادة توجيه رسالة خاصة إلى محادثات متعددة
    socket.on('forwardPrivateMessage', async (data: { 
      originalMessageId: number; 
      targetChatIds: number[] 
    }) => {
      try {
        const { originalMessageId, targetChatIds } = data;
        const forwarderId = socket.userId; // استخدام معرف المستخدم المصادق من socket
        
        if (!forwarderId) {
          socket.emit('error', { message: 'غير مصرح به - مستخدم غير مصادق' });
          return;
        }
        
        // جلب الرسالة الأصلية
        const originalMessage = await db.query.privateMessages.findFirst({
          where: eq(privateMessages.id, originalMessageId)
        });
        
        if (!originalMessage) {
          socket.emit('error', { message: 'الرسالة الأصلية غير موجودة' });
          return;
        }
        
        // التحقق من أن المستخدم عضو في المحادثة الأصلية (التحقق الأمني الحرج)
        const originalChat = await db.query.privateChats.findFirst({
          where: eq(privateChats.id, originalMessage.chatId)
        });
        
        if (!originalChat) {
          socket.emit('error', { message: 'المحادثة الأصلية غير موجودة' });
          return;
        }
        
        // التحقق من أن المستخدم جزء من المحادثة الأصلية
        if (originalChat.user1Id !== forwarderId && originalChat.user2Id !== forwarderId) {
          console.log(`❌ محاولة إعادة توجيه غير مصرح بها: المستخدم ${forwarderId} ليس عضو في المحادثة ${originalMessage.chatId}`);
          socket.emit('error', { message: 'غير مصرح لك بإعادة توجيه هذه الرسالة' });
          return;
        }
        
        // جلب معلومات المرسل الأصلي
        const originalSender = await storage.getUser(originalMessage.senderId);
        if (!originalSender) {
          socket.emit('error', { message: 'المرسل الأصلي غير موجود' });
          return;
        }
        
        // جلب معلومات المستخدم الذي يقوم بإعادة التوجيه (من socket المصادق)
        const forwarder = await storage.getUser(forwarderId);
        if (!forwarder) {
          socket.emit('error', { message: 'مستخدم غير صالح' });
          return;
        }
        
        // إعادة التوجيه إلى المحادثات المحددة
        for (const targetChatId of targetChatIds) {
          try {
            // التحقق من أن المستخدم لديه صلاحية في المحادثة المستهدفة
            const targetChat = await db.query.privateChats.findFirst({
              where: eq(privateChats.id, targetChatId)
            });
            
            if (!targetChat) {
              console.error(`المحادثة ${targetChatId} غير موجودة`);
              continue;
            }
            
            // التحقق من أن المستخدم جزء من المحادثة
            if (targetChat.user1Id !== forwarderId && targetChat.user2Id !== forwarderId) {
              console.error(`المستخدم ${forwarderId} ليس جزءاً من المحادثة ${targetChatId}`);
              continue;
            }
            
            // إنشاء رسالة جديدة معاد توجيهها مع معلومات آمنة من الخادم
            const [forwardedMessage] = await db.insert(privateMessages).values({
              chatId: targetChatId,
              senderId: forwarderId,
              content: originalMessage.content,
              fileUrl: originalMessage.fileUrl,
              fileType: originalMessage.fileType,
              isRead: false,
              isForwarded: true, // تعيين من الخادم فقط
              originalSenderId: originalMessage.senderId, // معرف المرسل الأصلي آمن
              forwardedFromSender: originalSender.fullName, // اسم المرسل الأصلي من قاعدة البيانات
            }).returning();
            
            // تحديد المستخدم المستقبل
            const receiverId = targetChat.user1Id === forwarderId ? targetChat.user2Id : targetChat.user1Id;
            
            // تأكد من أن المستقبل منضم إلى غرفة المحادثة
            const connectedSockets = await io.fetchSockets();
            for (const connectedSocket of connectedSockets) {
              const socketData = connectedSocket.data;
              if (socketData && socketData.userId === receiverId) {
                connectedSocket.join(`private-${targetChatId}`);
                console.log(`إضافة المستخدم ${receiverId} إلى الغرفة private-${targetChatId} تلقائياً`);
              }
            }
            
            // إرسال الرسالة المعاد توجيهها مع معلومات إضافية
            io.to(`private-${targetChatId}`).emit('newPrivateMessage', {
              ...forwardedMessage,
              senderName: forwarder.fullName,
              isForwarded: true,
              forwardedFromSender: originalSender.fullName
            });
            
            // إنشاء إشعار للمستقبل
            await storage.createUserNotification({
              userId: receiverId,
              title: "رسالة معاد توجيهها",
              body: `${forwarder.fullName} أعاد توجيه رسالة من ${originalSender.fullName}`,
              type: "info",
              isRead: false
            });
            
            console.log(`تم إعادة توجيه الرسالة ${originalMessageId} إلى المحادثة ${targetChatId}`);
            
          } catch (forwardError) {
            console.error(`خطأ في إعادة التوجيه للمحادثة ${targetChatId}:`, forwardError);
          }
        }
        
        // إرسال تأكيد نجح إعادة التوجيه
        socket.emit('forwardSuccess', { 
          message: `تم إعادة توجيه الرسالة إلى ${targetChatIds.length} محادثة بنجاح` 
        });
        
        console.log(`تمت إعادة توجيه الرسالة ${originalMessageId} من المستخدم ${forwarderId} إلى ${targetChatIds.length} محادثة`);
        
      } catch (error) {
        console.error('خطأ في إعادة التوجيه:', error);
        socket.emit('error', { message: 'حدث خطأ أثناء إعادة توجيه الرسالة' });
      }
    });
    
    // جلب قائمة الدردشات الخاصة للمستخدم (آمن - يستخدم socket.userId المصادق)
    socket.on('getPrivateChats', async () => {
      try {
        const userId = socket.userId; // استخدام معرف المستخدم المصادق من socket
        
        if (!userId) {
          socket.emit('error', { message: 'غير مصرح به - مستخدم غير مصادق' });
          return;
        }
        
        // جلب المحادثات الخاصة
        const chats = await storage.getUserPrivateChats(userId);
        
        // جلب عدد الرسائل غير المقروءة
        const unreadCounts = await storage.getUnreadMessagesCount(userId);
        
        // دمج المعلومات
        const enhancedChats = chats.map(chat => {
          const unreadInfo = unreadCounts.find(u => u.chatId === chat.id);
          return {
            ...chat,
            unreadCount: unreadInfo ? parseInt(unreadInfo.count as any) : 0
          };
        });
        
        // إرسال المحادثات للمستخدم
        socket.emit('privateChats', enhancedChats);
        
        console.log(`تم إرسال قائمة المحادثات الخاصة للمستخدم ${userId}`);
      } catch (error) {
        console.error('خطأ في جلب قائمة المحادثات الخاصة:', error);
        socket.emit('error', { message: 'حدث خطأ أثناء جلب قائمة المحادثات الخاصة' });
      }
    });
    
    // تعليم الرسائل كمقروءة
    socket.on('markMessagesAsRead', async (data: { chatId: number }) => {
      try {
        const { chatId } = data;
        const userId = socket.userId; // استخدام معرف المستخدم المصادق من socket
        
        if (!userId) {
          socket.emit('error', { message: 'غير مصرح به - مستخدم غير مصادق' });
          return;
        }
        
        // تعليم الرسائل كمقروءة
        await storage.markMessagesAsRead(chatId, userId);
        
        console.log(`تم تعليم الرسائل كمقروءة للمستخدم ${userId} في المحادثة ${chatId}`);
      } catch (error) {
        console.error('خطأ في تعليم الرسائل كمقروءة:', error);
        socket.emit('error', { message: 'حدث خطأ أثناء تعليم الرسائل كمقروءة' });
      }
    });
    
    // معالجة قطع الاتصال
    socket.on('disconnect', (reason) => {
      console.log(`🔴 انقطع اتصال المستخدم ${socket.id}. السبب: ${reason}`);
    });
    
    // إرسال رسالة في مجموعة محادثة
    socket.on('sendGroupMessage', async (data: { content: string; groupId: number }) => {
      console.log(`📤 رسالة مرسلة من المستخدم ${socket.id}:`, data);
      
      try {
        const { content, groupId } = data;
        const userId = socket.userId; // استخدام معرف المستخدم المصادق من socket
        
        if (!userId) {
          socket.emit('error', { message: 'غير مصرح به - مستخدم غير مصادق' });
          return;
        }
        
        // التحقق من وجود المستخدم
        const user = await storage.getUser(userId);
        if (!user) {
          console.log(`❌ خطأ: المستخدم ${userId} غير موجود`);
          socket.emit('error', { message: 'مستخدم غير موجود' });
          return;
        }
        
        // 🚫 التحقق من حالة الحظر أولاً
        const isBanned = await storage.isUserBanned(groupId, userId);
        if (isBanned) {
          console.log(`🚫 المستخدم ${userId} محظور في المجموعة ${groupId} - رفض الرسالة`);
          socket.emit('messageSendFailed', { 
            error: 'تم حظرك من هذه المجموعة ولا يمكنك إرسال رسائل أو المشاركة فيها',
            groupId,
            isBanned: true
          });
          return;
        }

        // 🔇 التحقق من حالة الكتم قبل السماح بالإرسال
        const isMuted = await storage.isUserMuted(groupId, userId);
        if (isMuted) {
          console.log(`🔇 المستخدم ${userId} مكتوم في المجموعة ${groupId} - رفض الرسالة`);
          socket.emit('messageSendFailed', { 
            error: 'أنت مكتوم في هذه المجموعة ولا يمكنك إرسال رسائل حالياً',
            groupId,
            isMuted: true
          });
          return;
        }
        
        // التحقق من وجود المجموعة
        const group = await storage.getGroupChat(groupId);
        if (!group) {
          console.log(`❌ خطأ: المجموعة ${groupId} غير موجودة`);
          socket.emit('error', { message: 'مجموعة غير موجودة' });
          return;
        }
        
        // التحقق من أن المستخدم عضو في المجموعة الخاصة
        if (group.isPrivate) {
          // يبدو أن الأعضاء يتم استرجاعهم بحقول مختلفة (مثل user_id) من قاعدة البيانات
          // لكن النوع النصي يتوقع userId (بحالة الجمل)
          const members = await storage.getGroupMembers(groupId);
          console.log("جاري التحقق من العضوية للمستخدم:", userId);
          // استخدام الترميز النقطي المتوافق مع كلا الاسمين
          const isMember = members.some(m => (m as any).user_id === userId || m.userId === userId);
          
          if (!isMember) {
            socket.emit('error', { message: 'غير مصرح لك بإرسال رسائل في هذه المجموعة' });
            return;
          }
        }
        
        // حفظ الرسالة في قاعدة البيانات
        const message = await storage.createGroupMessage({
          groupId,
          senderId: userId,
          content
        });
        
        // إرسال الرسالة لجميع المستخدمين في المجموعة
        io.to(`group-${groupId}`).emit('newGroupMessage', {
          ...message,
          senderName: user.fullName
        });
        
        // إرسال إشعار push لأعضاء المجموعة
        try {
          const groupMembers = await storage.getGroupMembers(groupId);
          for (const member of groupMembers) {
            const memberId = (member as any).user_id || member.userId;
            if (memberId !== userId) { // عدم إرسال إشعار للمرسل نفسه
              await pushNotifications.sendPushNotificationToUser(memberId, {
                title: `${group.name}: رسالة جديدة من ${user.fullName}`,
                body: content.length > 50 ? content.substring(0, 50) + '...' : content,
                data: { 
                  type: 'group_message',
                  groupId: groupId,
                  senderId: userId,
                  senderName: user.fullName,
                  groupName: group.name
                },
                url: `/group-chat/${groupId}`,
                tag: `group-${groupId}`
              });
            }
          }
        } catch (pushError) {
          console.error('خطأ في إرسال إشعارات push لرسالة المجموعة:', pushError);
        }
        
        console.log(`رسالة مجموعة جديدة في المجموعة ${groupId} من ${user.fullName}: ${content}`);
      } catch (error) {
        console.error('خطأ في إرسال رسالة مجموعة:', error);
        socket.emit('error', { message: 'حدث خطأ أثناء إرسال الرسالة' });
      }
    });
    
    // معالجة قطع الاتصال تمت إضافتها مسبقاً
  });

  // Get user transactions
  app.get("/api/transactions", authMiddleware, checkPageRestrictions('transactions'), async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });

  // Create a new transaction
  app.post("/api/transactions", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      
      const data = {
        ...req.body,
        userId
      };

      const result = insertTransactionSchema.safeParse(data);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const transaction = await storage.createTransaction(data as InsertTransaction);
      res.status(201).json({
        message: "تمت إضافة المعاملة بنجاح",
        transaction
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  // Get user balances
  app.get("/api/balance", authMiddleware, checkPageRestrictions('balance'), async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      console.log('طلب رصيد للمستخدم:', userId);
      
      const balances = await storage.getUserBalances(userId);
      console.log('أرصدة من قاعدة البيانات:', balances);
      
      // Format the response as a key-value object for easier client-side consumption
      const formattedBalances = balances.reduce((acc, balance) => {
        acc[balance.currency] = balance.amount;
        return acc;
      }, {} as Record<string, string | number>);
      
      console.log('الأرصدة المنسقة:', formattedBalances);
      
      res.json({ balances: formattedBalances });
    } catch (error) {
      console.error('خطأ في جلب الرصيد:', error);
      next(error);
    }
  });

  // Update a balance
  app.post("/api/balance", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      
      const data = {
        ...req.body,
        userId
      };

      const result = insertBalanceSchema.safeParse(data);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const balance = await storage.createOrUpdateBalance(data as InsertBalance);
      res.status(200).json({
        message: "تم تحديث الرصيد بنجاح",
        balance
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  // Transfer money to another user
  app.post("/api/transfer", authMiddleware, async (req, res, next) => {
    try {
      const senderId = (req as AuthRequest).user.id;
      
      // Validate request data
      const result = transferSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const { receiver, amount, note } = req.body;
      const amountNum = Number(amount);
      const currency = req.body.currency || "LYD"; // Default to LYD if not specified
      
      // تحقق من أن حساب المرسل مفعل
      const senderUser = await storage.getUser(senderId);
      if (!senderUser) {
        return res.status(404).json({ 
          message: "لم يتم العثور على حسابك" 
        });
      }
      
      // استخدام جملة شرطية أكثر صرامة ووضوحاً للتحقق من حالة النشاط
      console.log(`التحقق من حالة المستخدم المرسل: ${senderUser.fullName} (${senderId}). حالة النشاط: [${senderUser.active}], نوعها: [${typeof senderUser.active}]`);
      
      // تعامل محسن مع قيم PostgreSQL البولية
      // PostgreSQL قد يعيد القيم البولية بأشكال مختلفة: true, false, 't', 'f'
      const isActiveUser = typeof senderUser.active === 'boolean' ? 
          senderUser.active === true : 
          String(senderUser.active) === 't' || String(senderUser.active) === 'true';
      
      if (!isActiveUser) {
        console.log(`منع مستخدم معطل ${senderUser.fullName} (${senderId}) من إجراء التحويل.`);
        return res.status(403).json({ 
          message: "حسابك معطل. لا يمكنك إجراء التحويلات. يرجى التواصل مع الإدارة." 
        });
      }
      
      // Find receiver user by phone or ID
      const receiverUser = await storage.getUserByPhoneOrId(receiver);
      if (!receiverUser) {
        return res.status(404).json({ 
          message: "المستلم غير موجود، يرجى التأكد من رقم الحساب أو رقم الهاتف" 
        });
      }
      
      // تحقق من أن حساب المستلم مفعل - استخدام طريقة أكثر دقة للتحقق
      console.log(`التحقق من حالة نشاط المستلم ${receiverUser.fullName} (${receiverUser.id}). حالة النشاط: [${receiverUser.active}], نوعها: [${typeof receiverUser.active}]`);
      
      // تعامل محسن مع قيم PostgreSQL البولية
      // PostgreSQL قد يعيد القيم البولية بأشكال مختلفة: true, false, 't', 'f'
      const isReceiverActive = typeof receiverUser.active === 'boolean' ? 
          receiverUser.active === true : 
          String(receiverUser.active) === 't' || String(receiverUser.active) === 'true';
      
      if (!isReceiverActive) {
        console.log(`منع التحويل إلى مستخدم معطل ${receiverUser.fullName} (${receiverUser.id})`);
        return res.status(403).json({ 
          message: "حساب المستلم معطل. لا يمكن إجراء التحويل له حالياً." 
        });
      }
      
      if (receiverUser.id === senderId) {
        return res.status(400).json({ 
          message: "لا يمكن التحويل إلى نفس الحساب" 
        });
      }
      
      // Calculate commission (1%)
      const commissionRate = 0.01;
      const commission = amountNum * commissionRate;
      const totalAmount = amountNum + commission;
      
      // Verify sender has sufficient balance
      const senderBalance = await storage.getUserBalance(senderId, currency);
      if (!senderBalance || safeParseAmount(senderBalance.amount) < totalAmount) {
        return res.status(400).json({ 
          message: "الرصيد غير كافٍ لإتمام التحويل مع العمولة" 
        });
      }
      
      // Process the transfer
      const transfer = await storage.transferMoney(
        senderId,
        receiverUser.id,
        amountNum,
        commission,
        currency,
        note
      );

      // تسجيل التحويل في سجل التحويلات الداخلية للمدير
      try {
        const transferLogData = {
          transferId: transfer.id,
          senderName: senderUser.fullName,
          senderAccountNumber: senderUser.accountNumber || `#${senderUser.id}`,
          receiverName: receiverUser.fullName,
          receiverAccountNumber: receiverUser.accountNumber || `#${receiverUser.id}`,
          amount: amountNum.toString(),
          commission: commission.toString(),
          currency: currency,
          note: note || null,
          status: 'completed',
          ipAddress: getClientPublicIP(req).ip,
          userAgent: req.get('User-Agent') || 'unknown'
        };

        await db.insert(internalTransferLogs).values(transferLogData);
        console.log('📊 تم تسجيل التحويل في سجل المدير:', transfer.id);
      } catch (logError) {
        console.error('خطأ في تسجيل التحويل في سجل المدير:', logError);
        // لا نوقف العملية إذا فشل التسجيل
      }
      
      // إرسال إشعار للمرسل
      try {
        console.log('إنشاء إشعار للمرسل...');
        const senderNotification = await storage.createUserNotification({
          userId: senderId,
          title: "تم إرسال تحويل بنجاح",
          body: `تم تحويل ${amountNum} ${currency} إلى ${receiverUser.fullName} بنجاح. العمولة: ${commission} ${currency}`,
          type: "success",
          isRead: false
        });
        console.log('تم إنشاء إشعار للمرسل:', senderNotification);
      } catch (err) {
        console.error('خطأ في إنشاء إشعار للمرسل:', err);
      }
      
      // إرسال إشعار للمستلم
      try {
        console.log('إنشاء إشعار للمستلم...');
        const receiverUser2 = await storage.getUser(receiverUser.id);
        const senderUser = await storage.getUser(senderId);
        const receiverNotification = await storage.createUserNotification({
          userId: receiverUser.id,
          title: "استلام تحويل جديد",
          body: `تم استلام تحويل بقيمة ${amountNum} ${currency} من ${senderUser?.fullName || "مستخدم آخر"}`,
          type: "success",
          isRead: false
        });
        console.log('تم إنشاء إشعار للمستلم:', receiverNotification);
      } catch (err) {
        console.error('خطأ في إنشاء إشعار للمستلم:', err);
      }
      
      res.status(200).json({
        message: "تم التحويل بنجاح",
        transfer: {
          id: transfer.id,
          amount: transfer.amount,
          commission: transfer.commission,
          currency: transfer.currency,
          receiverName: receiverUser.fullName,
          date: transfer.createdAt
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  // البحث عن المستخدمين للتحويل الداخلي - بحماية محسنة
  app.get("/api/users/search", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type, id: currentUserId } = req.user;
      const query = (req.query.q || req.query.query) as string;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }

      // إذا كان المستخدم مديراً، يمكنه رؤية جميع المعلومات
      if (type === "admin") {
        const searchResults = await db
          .select({
            id: users.id,
            fullName: users.fullName,
            phone: users.phone,
            accountNumber: users.accountNumber,
            type: users.type
          })
          .from(users)
          .where(
            or(
              like(users.fullName, `%${query}%`),
              like(users.phone, `%${query}%`),
              like(users.accountNumber, `%${query}%`)
            )
          )
          .limit(10);

        return res.json(searchResults);
      }

      // للمستخدمين العاديين والوكلاء - بحث محدود وآمن
      const searchResults = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          accountNumber: users.accountNumber,
          type: users.type
        })
        .from(users)
        .where(
          and(
            // البحث بالاسم الكامل أو رقم الحساب فقط (وليس الهاتف)
            or(
              like(users.fullName, `%${query}%`),
              like(users.accountNumber, `%${query}%`)
            ),
            // فقط المستخدمين النشطين
            eq(users.active, true)
          )
        )
        .limit(5); // عدد أقل من النتائج للمستخدمين العاديين
      
      // فلترة النتائج لاستبعاد المستخدم الحالي من جانب التطبيق
      const filteredSearchResults = searchResults.filter(user => user.id !== currentUserId);

      // إخفاء أرقام الهواتف من المستخدمين العاديين
      const filteredResults = filteredSearchResults.map(user => ({
        id: user.id,
        fullName: user.fullName,
        accountNumber: user.accountNumber,
        type: user.type
        // لا نُرجع phone للمستخدمين العاديين
      }));

      res.json(filteredResults);
    } catch (error) {
      console.error("خطأ في البحث عن المستخدمين:", error);
      res.status(500).json({ message: "حدث خطأ في البحث" });
    }
  });

  // التحويل الداخلي بين المستخدمين
  app.post("/api/internal-transfer", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const senderId = req.user.id;
      const { recipientId, currency, amount, note } = req.body;

      // التحقق من البيانات المدخلة
      if (!recipientId || !currency || !amount || amount <= 0) {
        return res.status(400).json({ 
          message: "يرجى إدخال جميع البيانات المطلوبة بشكل صحيح" 
        });
      }

      // التحقق من أن المستخدم لا يحول لنفسه
      if (senderId === recipientId) {
        return res.status(400).json({ 
          message: "لا يمكن التحويل إلى نفس الحساب" 
        });
      }

      // التحقق من وجود المستلم
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        return res.status(404).json({ 
          message: "المستلم غير موجود" 
        });
      }

      // التحقق من تفعيل حساب المستلم
      if (!recipient.active) {
        return res.status(400).json({
          message: `الحساب ${recipient.accountNumber} غير مفعل للتحويلات الداخلية. يرجى التواصل مع الإدارة.`
        });
      }

      // جلب نسبة العمولة المحددة من المدير أو استخدام النسبة الافتراضية
      let commissionRate = 0.01; // النسبة الافتراضية 1%
      let rateType = 'default';
      
      try {
        const systemCommissionRate = await storage.getSystemCommissionRate('internal', currency);
        if (systemCommissionRate && systemCommissionRate.isActive) {
          // أولاً: التحقق من وجود عمولة ثابتة
          if (systemCommissionRate.fixedAmount && parseFloat(systemCommissionRate.fixedAmount) > 0) {
            commissionRate = parseFloat(systemCommissionRate.fixedAmount);
            rateType = 'fixed';
            console.log(`استخدام العمولة الثابتة المحددة من المدير: ${commissionRate} ${currency}`);
          }
          // ثانياً: إذا كان هناك نسبة في الألف، استخدمها
          else if (systemCommissionRate.perMilleRate && parseFloat(systemCommissionRate.perMilleRate) > 0) {
            commissionRate = parseFloat(systemCommissionRate.perMilleRate);
            rateType = 'per_mille';
            console.log(`استخدام نسبة العمولة المحددة من المدير: ${(commissionRate * 1000).toFixed(1)}‰ للعملة ${currency}`);
          } 
          // ثالثاً: وإلا استخدم النسبة المئوية العادية
          else {
            commissionRate = parseFloat(systemCommissionRate.commissionRate);
            rateType = 'percentage';
            console.log(`استخدام نسبة العمولة المحددة من المدير: ${(commissionRate * 100).toFixed(2)}% للعملة ${currency}`);
          }
        } else {
          console.log(`استخدام النسبة الافتراضية: ${(commissionRate * 100).toFixed(2)}% للعملة ${currency}`);
        }
      } catch (error) {
        console.error("خطأ في جلب نسبة العمولة من النظام، استخدام النسبة الافتراضية:", error);
      }
      
      // حساب العمولة حسب النوع
      let commission = 0;
      if (rateType === 'fixed') {
        commission = commissionRate; // العمولة الثابتة
      } else if (rateType === 'per_mille') {
        commission = amount * commissionRate; // النسبة في الألف
      } else {
        commission = amount * commissionRate; // النسبة المئوية
      }
      const totalAmount = amount + commission; // المبلغ الإجمالي مع العمولة

      // التحقق من الرصيد (يجب أن يكون كافي للمبلغ + العمولة)
      const senderBalance = await storage.getUserBalance(senderId, currency);
      if (!senderBalance || parseFloat(senderBalance.amount) < totalAmount) {
        return res.status(400).json({ 
          message: `الرصيد غير كافٍ لإتمام التحويل. المطلوب: ${totalAmount} (${amount} + ${commission} عمولة)` 
        });
      }

      // تنفيذ التحويل مع إضافة الرقم المرجعي
      const transfer = await storage.createInternalTransfer({
        senderId,
        receiverId: recipientId,
        currency,
        amount: amount.toString(),
        commission: commission.toString(),
        referenceNumber: ReferenceGenerator.generateInternalTransferReference(Date.now(), 'INT'),
        note: note || null
      });

      // تحديث الأرصدة - خصم المبلغ والعمولة من المرسل
      await storage.updateUserBalance(senderId, currency, -totalAmount);
      await storage.updateUserBalance(recipientId, currency, amount);

      // العمولة معلقة - ستضاف فقط عند تأكيد الاستلام (التحويل الداخلي فوري)
      if (commission > 0) {
        // للتحويلات الداخلية: العمولة تُضاف فوراً لأن الاستلام فوري
        const { allocateFixedReferralReward } = await import('./referral-system');
        const operationType = currency === 'LYD' ? 'transfer_lyd' : 'transfer_usd';
        
        const referralResult = await allocateFixedReferralReward(
          transfer.id,
          operationType,
          commission,
          currency,
          senderId
        );

        // إضافة صافي العمولة بعد خصم مكافأة الإحالة
        const netCommission = referralResult.netSystemCommission;
        if (netCommission > 0) {
          await storage.addCommissionPoolTransaction({
            sourceType: 'user',
            sourceId: senderId,
            sourceName: req.user.fullName || 'مستخدم',
            currencyCode: currency,
            amount: netCommission.toString(),
            transactionType: 'credit',
            relatedTransactionId: transfer.id,
            description: referralResult.hasReferral 
              ? `عمولة تحويل داخلي (بعد خصم مكافأة إحالة ${referralResult.rewardAmount}) من ${req.user.fullName || 'مستخدم'} إلى ${recipient.fullName}`
              : `عمولة تحويل داخلي من ${req.user.fullName || 'مستخدم'} إلى ${recipient.fullName}`
          });
        }
        
        console.log(`تم إضافة صافي عمولة ${netCommission} ${currency} إلى حساب التجميع (أصلية: ${commission}, مكافأة إحالة: ${referralResult.rewardAmount})`);
      }

      // توليد أرقام مرجعية موحدة باستخدام معرف التحويل الصحيح
      const baseRef = transfer.referenceNumber || ReferenceGenerator.generateInternalTransferReference(transfer.id, 'INT');
      const senderReferenceNumber = baseRef + '-OUT';
      const receiverReferenceNumber = baseRef + '-IN';

      // إنشاء معاملة للمرسل (تشمل المبلغ + العمولة)
      const senderTransaction = await storage.createTransaction({
        userId: senderId,
        type: 'internal_transfer_out',
        amount: (-totalAmount).toString(),
        currency,
        description: `تحويل داخلي إلى ${recipient.fullName} (${amount} + ${commission.toFixed(2)} عمولة)${note ? ` - ${note}` : ''}`,
        referenceNumber: senderReferenceNumber
      });

      // إنشاء معاملة للمستلم
      const receiverTransaction = await storage.createTransaction({
        userId: recipientId,
        type: 'internal_transfer_in',
        amount: amount.toString(),
        currency,
        description: `تحويل داخلي من ${req.user.fullName || req.user.email}${note ? ` - ${note}` : ''}`,
        referenceNumber: receiverReferenceNumber
      });

      // إرسال إشعار للمرسل
      await storage.createUserNotification({
        userId: senderId,
        title: "تم إرسال التحويل بنجاح",
        body: `تم تحويل ${amount} ${currency} إلى ${recipient.fullName} بنجاح`,
        type: "success",
        isRead: false
      });

      // إرسال إشعار للمستلم
      await storage.createUserNotification({
        userId: recipientId,
        title: "استلام تحويل داخلي",
        body: `تم استلام ${amount} ${currency} من ${req.user.fullName || req.user.email}${note ? ` - الملاحظة: ${note}` : ''}`,
        type: "success",
        isRead: false
      });

      // منح نقاط للمرسل بعد نجاح التحويل
      try {
        const settings = await rewardsService.getSettings();
        await rewardsService.awardPoints({
          userId: senderId,
          points: settings.transferPoints,
          action: 'internal_transfer',
          description: `Internal transfer: ${amount} ${currency}`,
          descriptionAr: `تحويل داخلي: ${amount} ${currency}`,
          referenceId: transfer.id.toString(),
          referenceType: 'internal_transfer',
        });
        console.log(`✅ تم منح ${settings.transferPoints} نقطة للمرسل ${senderId} للتحويل الداخلي`);
      } catch (error) {
        console.error('خطأ في منح النقاط للتحويل الداخلي:', error);
      }

      // منح مكافأة إحالة ثابتة للمُحيل (النظام الجديد)
      try {
        const operationType = currency === 'LYD' ? 'transfer_lyd' : 'transfer_usd';
        await referralSystem.allocateFixedReferralReward(
          transfer.id,
          operationType,
          commission,
          currency,
          senderId
        );
        console.log(`✅ تم تطبيق نظام المكافآت الثابتة للتحويل ${transfer.id}`);
      } catch (error) {
        console.error('خطأ في منح مكافأة الإحالة:', error);
      }

      res.json({
        message: "تم التحويل بنجاح",
        id: transfer.id,
        transactionId: senderTransaction.id,
        amount,
        currency,
        fee: commission,
        netAmount: amount,
        ref: `INT-${Date.now()}-${transfer.id}`,
        recipient: {
          id: recipient.id,
          fullName: recipient.fullName,
          accountNumber: recipient.accountNumber
        },
        sender: {
          id: senderId,
          fullName: req.user.fullName,
          accountNumber: req.user.accountNumber
        },
        note: note || null,
        createdAt: new Date().toISOString()
      });

    } catch (error) {
      console.error("خطأ في التحويل الداخلي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تنفيذ التحويل" });
    }
  });

  // Get user transfers (both sent and received)
  app.get("/api/transfers", authMiddleware, async (req: AuthRequest, res: Response, next) => {
    try {
      const userId = req.user.id;
      
      // استخدام استعلام SQL مباشر لتجنب مشكلة desc
      const transfersResult = await db.execute(sql`
        SELECT t.*, 
               sender.full_name as sender_name,
               sender.account_number as sender_account_number,
               receiver.full_name as receiver_name,
               receiver.account_number as receiver_account_number,
               CASE WHEN t.sender_id = ${userId} THEN true ELSE false END as is_sender,
               CASE WHEN t.receiver_id = ${userId} THEN true ELSE false END as is_receiver
        FROM transfers t
        LEFT JOIN users sender ON t.sender_id = sender.id
        LEFT JOIN users receiver ON t.receiver_id = receiver.id
        WHERE t.sender_id = ${userId} OR t.receiver_id = ${userId}
        ORDER BY t.created_at DESC
      `);
      
      res.json(transfersResult.rows);
    } catch (error) {
      console.error("خطأ في جلب الحوالات:", error);
      res.status(500).json({ message: "حدث خطأ في جلب الحوالات" });
    }
  });

  // API لجلب تفاصيل التحويل لإنشاء الإيصال
  app.get("/api/transfers/:transactionId/details", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId } = req.params;
      const userId = req.user.id;

      // جلب تفاصيل المعاملة مع معلومات الأطراف
      const result = await db.execute(sql`
        SELECT 
          t.id as transaction_id,
          t.txn_type,
          t.amount,
          t.currency,
          t.commission,
          t.status,
          t.created_at,
          t.note,
          tr.id as transfer_id,
          tr.created_at as transfer_date,
          sender.id as sender_id,
          sender.full_name as sender_name,
          sender.account_number as sender_account,
          receiver.id as receiver_id,
          receiver.full_name as receiver_name,
          receiver.account_number as receiver_account
        FROM transactions t
        LEFT JOIN transfers tr ON t.related_transfer_id = tr.id
        LEFT JOIN users sender ON tr.sender_id = sender.id
        LEFT JOIN users receiver ON tr.receiver_id = receiver.id
        WHERE t.id = ${transactionId}
          AND (tr.sender_id = ${userId} OR tr.receiver_id = ${userId})
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "المعاملة غير موجودة أو ليس لديك صلاحية للوصول إليها" });
      }

      const transaction = result.rows[0];

      // تنسيق البيانات للإيصال
      const receiptData = {
        id: transaction.transfer_id,
        transferId: transaction.transfer_id,
        transactionId: transaction.transaction_id,
        fromUser: {
          id: transaction.sender_id as number,
          fullName: (transaction.sender_name as string) || 'غير معروف',
          accountNumber: (transaction.sender_account as string) || 'غير معروف'
        },
        toUser: {
          id: transaction.receiver_id as number,
          fullName: (transaction.receiver_name as string) || 'غير معروف',
          accountNumber: (transaction.receiver_account as string) || 'غير معروف'
        },
        currency: transaction.currency,
        amount: parseFloat(transaction.amount),
        fee: parseFloat(transaction.commission || '0'),
        netAmount: parseFloat(transaction.amount),
        status: transaction.status === 'completed' ? 'مكتمل' : transaction.status,
        ref: `INT-${transaction.transfer_id}`,
        createdAt: transaction.transfer_date || transaction.created_at,
        note: transaction.note,
        hash: `hash_${transaction.transaction_id}_${Date.now()}`
      };

      res.json(receiptData);

    } catch (error) {
      console.error('خطأ في جلب تفاصيل التحويل:', error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب تفاصيل التحويل" });
    }
  });



  

  // Submit an upgrade request
  app.post("/api/upgrade-request", authMiddleware, async (req: AuthRequest, res: Response, next) => {
    try {
      const userId = req.user.id;
      
      // Check if user already has a pending request
      const pendingRequest = await storage.getPendingUpgradeRequest(userId);
      if (pendingRequest) {
        return res.status(400).json({ 
          message: "لديك طلب ترقية للتحويل بين المدن قيد المراجعة بالفعل"
        });
      }
      
      // Check if user is already an office
      const user = await storage.getUser(userId);
      if (user?.type === 'office') {
        return res.status(400).json({ 
          message: "حسابك مرقى بالفعل للتحويل بين المدن"
        });
      }
      
      // التحقق من توثيق الحساب قبل السماح بالترقية
      if (!user?.verified) {
        return res.status(400).json({ 
          message: "يجب توثيق الحساب أولاً قبل طلب ترقية التحويل بين المدن. يرجى إرسال المستندات المطلوبة للتوثيق."
        });
      }
      
      // Validate request data
      const result = upgradeRequestSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Create the upgrade request
      const requestData: InsertUpgradeRequest = {
        userId,
        requestType: "agent_upgrade", // نوع الطلب للتحويل بين المدن
        fullName: req.body.fullName,
        phone: req.body.phone,
        city: req.body.city,
        message: req.body.message || ""
      };
      
      const request = await storage.createUpgradeRequest(requestData);
      
      res.status(201).json({
        message: "تم إرسال طلب ترقية التحويل بين المدن بنجاح، سيتم مراجعته قريباً",
        request
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  // Get user's upgrade requests
  app.get("/api/upgrade-requests", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const requests = await storage.getUserUpgradeRequests(userId);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });
  
  
  // Admin only: Update request status (approve/reject)
  app.post("/api/admin/upgrade-requests/:id", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const user = await storage.getUser(userId);
      
      // Only admin can update request status
      if (user?.type !== 'admin') {
        return res.status(403).json({ 
          message: "غير مصرح لك بهذه العملية"
        });
      }
      
      const requestId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({ 
          message: "حالة الطلب يجب أن تكون approved أو rejected"
        });
      }
      
      const updatedRequest = await storage.updateRequestStatus(requestId, status, notes);
      
      res.json({
        message: status === 'approved' 
          ? "تمت الموافقة على الطلب بنجاح"
          : "تم رفض الطلب",
        request: updatedRequest
      });
    } catch (error) {
      next(error);
    }
  });

  // إنشاء إشعار اختباري
  app.post("/api/test/create-notification", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      
      console.log("إنشاء إشعار اختباري للمستخدم:", userId);
      
      // استخدام طريقة Query المباشرة 
      const result = await db.$client.query(`
        INSERT INTO user_notifications (user_id, title, body, type, is_read)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, 'إشعار اختباري', 'هذا إشعار اختباري للتحقق من عمل نظام الإشعارات', 'info', false]);
      
      console.log("تم إنشاء الإشعار الاختباري:", result.rows[0]);
      
      res.json({
        message: "تم إنشاء إشعار اختباري بنجاح",
        notification: result.rows[0]
      });
    } catch (error) {
      console.error("خطأ في إنشاء الإشعار الاختباري:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء إنشاء الإشعار التجريبي", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Test endpoint to add balance for testing purposes
  app.post("/api/test/add-balance", async (req, res, next) => {
    try {
      const { userId, currency, amount } = req.body;
      
      if (!userId || !currency || !amount) {
        return res.status(400).json({ message: "يجب توفير userId وcurrency وamount" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // Add or update balance
      const balance = await storage.createOrUpdateBalance({
        userId,
        currency,
        amount: amount.toString()
      });
      
      res.json({
        message: `تم إضافة ${amount} ${currency} إلى حساب المستخدم بنجاح`,
        balance
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Market API routes
  // Create a new market offer
  app.post("/api/market", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      
      // تحقق من أن حساب المستخدم مفعل
      const user = await storage.getUser(userId);
      if (!user || user.active === false) {
        return res.status(403).json({ 
          message: "حسابك معطل. لا يمكنك إنشاء عروض في السوق. يرجى التواصل مع الإدارة." 
        });
      }
      
      // Validate request data
      const result = marketOfferSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const { side, baseCurrency, quoteCurrency, minAmount, maxAmount, price, expirationMinutes } = req.body;
      
      // العمولة ستُحسب عند كل صفقة مباشرة
      
      // For selling offers, verify the user has enough balance AND commission
      if (side === "sell") {
        const userBalance = await storage.getUserBalance(userId, baseCurrency);
        if (!userBalance || safeParseAmount(userBalance.amount) < safeParseAmount(maxAmount)) {
          return res.status(400).json({ 
            message: `رصيدك من ${baseCurrency} غير كافٍ لإنشاء هذا العرض`
          });
        }
        
        // تعليق المبلغ فقط (العمولة ستُحسب عند التنفيذ)
        const newAmount = safeParseAmount(userBalance.amount) - safeParseAmount(maxAmount);
        console.log(`🔒 تعليق المبلغ: ${safeParseAmount(userBalance.amount)} - ${safeParseAmount(maxAmount)} = ${newAmount}`);
        await storage.setUserBalance(userId, baseCurrency, newAmount.toString());
      }
      
      // حساب تاريخ انتهاء الصلاحية
      let expiresAt: Date | null = null;
      if (expirationMinutes && expirationMinutes > 0) {
        expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
      }
      
      // Create the market offer with correct schema mapping
      const offer = await storage.createMarketOffer({
        userId,
        side: side, // use the actual side value
        baseCurrency: baseCurrency,
        quoteCurrency: quoteCurrency,
        price: price.toString(),
        minAmount: minAmount.toString(),
        maxAmount: maxAmount.toString(),
        remainingAmount: maxAmount.toString(), // Initially remaining = full amount
        status: "open",
        expiresAt: expiresAt
      });
      
      // العمولة ستُحسب وتُخصم عند كل صفقة مباشرة
      
      // إنشاء معاملة محاسبية لتسجيل خصم العملة المباعة (عروض البيع فقط)
      if (side === "sell") {
        await storage.createTransaction({
          userId,
          type: "exchange",
          amount: (-Number(maxAmount)).toString(), // خصم العملة المباعة
          currency: baseCurrency,
          description: `تعليق ${maxAmount} ${baseCurrency} لعرض بيع بسعر ${price} ${quoteCurrency} - الرقم المرجعي: ${offer.id}`,
          referenceNumber: `OFFER-${offer.id}`
        });
        console.log(`📝 تم تسجيل خصم العملة المباعة: -${maxAmount} ${baseCurrency}`);
      }
      
      // منح نقاط لإنشاء العرض
      try {
        const settings = await rewardsService.getSettings();
        await rewardsService.awardPoints({
          userId: userId,
          points: settings.transferPoints || 5, // استخدام transferPoints أو قيمة افتراضية
          action: 'create_offer',
          description: `Create market offer: ${side} ${maxAmount} ${baseCurrency}`,
          descriptionAr: `إنشاء عرض: ${side === 'sell' ? 'بيع' : 'شراء'} ${maxAmount} ${baseCurrency}`,
          referenceId: offer.id.toString(),
          referenceType: 'market_offer',
        });
        console.log(`✅ تم منح ${settings.transferPoints || 5} نقطة للمستخدم ${userId} لإنشاء العرض`);
      } catch (error) {
        console.error('خطأ في منح النقاط لإنشاء العرض:', error);
      }

      // 🚀 بث الأحداث اللحظية لإنشاء العرض
      try {
        const realtimeEvents = req.app.get('realtimeEvents');
        if (realtimeEvents) {
          // بث حدث إنشاء العرض
          realtimeEvents.emitMarketOrderCreated({
            id: offer.id,
            userId: userId,
            side: side,
            baseCurrency: baseCurrency,
            quoteCurrency: quoteCurrency,
            amount: maxAmount,
            price: price,
            total: Number(maxAmount) * Number(price)
          });
          
          // تحديث دفتر الأوامر
          realtimeEvents.emitOrderbookUpdate(baseCurrency, quoteCurrency);
          
          // تحديث رصيد المستخدم إذا كان عرض بيع (لأن المبلغ تم تعليقه)
          if (side === "sell") {
            const userBalance = await storage.getUserBalance(userId, baseCurrency);
            if (userBalance) {
              realtimeEvents.emitBalanceUpdate(userId, baseCurrency, userBalance.amount);
            }
          }
          
          console.log(`🚀 تم بث الأحداث اللحظية لإنشاء العرض ${offer.id}`);
        }
      } catch (eventError) {
        console.error('خطأ في بث الأحداث اللحظية لإنشاء العرض:', eventError);
      }

      res.status(201).json({
        message: "تم إنشاء العرض بنجاح",
        offer
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  // Get market offers (all active offers by default)
  app.get("/api/market", authMiddleware, checkPageRestrictions('market'), async (req, res, next) => {
    try {
      // تنظيف العروض المنتهية الصلاحية أولاً
      const expiredCount = await storage.expireMarketOffers();
      if (expiredCount > 0) {
        console.log(`🕒 تم إلغاء ${expiredCount} عرض منتهي الصلاحية`);
      }
      
      const { status, type, from, to } = req.query;
      
      // Apply filters from query parameters
      const filters: any = {
        status: status || "open",
      };
      
      if (type) {
        filters.offerType = type;
      }
      
      if (from) {
        filters.fromCurrency = from;
      }
      
      if (to) {
        filters.toCurrency = to;
      }
      
      const offers = await storage.getMarketOffers(filters);
      
      // Get user info for each offer and add legacy field mappings
      const enhancedOffers = await Promise.all(
        offers.map(async (offer) => {
          const user = await storage.getUser(offer.userId);
          return {
            ...offer,
            userName: user ? user.fullName : "Unknown",
            userFullName: user ? user.fullName : "Unknown",
            userType: user ? user.type : "unknown",
            // Legacy field mappings for frontend compatibility
            offerType: offer.side,
            fromCurrency: offer.baseCurrency,
            toCurrency: offer.quoteCurrency,
            rate: parseFloat(offer.price),
            amount: offer.maxAmount,
            available: offer.remainingAmount,
          };
        })
      );
      
      res.json(enhancedOffers);
    } catch (error) {
      next(error);
    }
  });
  
  // Get user's market offers
  app.get("/api/market/my-offers", authMiddleware, checkPageRestrictions('market'), async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const offers = await storage.getUserMarketOffers(userId);
      
      // Add legacy field mappings for frontend compatibility
      const enhancedOffers = offers.map(offer => ({
        ...offer,
        offerType: offer.side,
        fromCurrency: offer.baseCurrency,
        toCurrency: offer.quoteCurrency,
        rate: parseFloat(offer.price),
        amount: offer.maxAmount,
        available: offer.remainingAmount,
      }));
      
      res.json(enhancedOffers);
    } catch (error) {
      next(error);
    }
  });
  
  // Cancel a market offer
  app.delete("/api/market/:id/cancel", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const offerId = parseInt(req.params.id);
      
      console.log(`🔄 طلب إلغاء العرض ${offerId} من المستخدم ${userId}`);
      
      // Check if offer exists and belongs to the user
      const offer = await storage.getMarketOfferById(offerId);
      if (!offer) {
        return res.status(404).json({ message: "العرض غير موجود" });
      }
      
      if (offer.userId !== userId) {
        return res.status(403).json({ message: "لا يمكنك إلغاء عروض مستخدمين آخرين" });
      }
      
      if (offer.status !== "open" && offer.status !== "active") {
        return res.status(400).json({ message: "لا يمكن إلغاء عرض منتهي أو ملغي" });
      }
      
      // If it's a sell offer, return the remaining amount to the user's balance
      if (offer.side === "sell" && Number(offer.remainingAmount) > 0) {
        const userBalance = await storage.getUserBalance(userId, offer.baseCurrency);
        const newAmount = userBalance 
          ? safeParseAmount(userBalance.amount) + safeParseAmount(offer.remainingAmount)
          : safeParseAmount(offer.remainingAmount);
        
        console.log(`إعادة المبلغ المحجوز عند إلغاء العرض: ${userBalance ? safeParseAmount(userBalance.amount) : 0} + ${safeParseAmount(offer.remainingAmount)} = ${newAmount}`);
        await storage.setUserBalance(userId, offer.baseCurrency, newAmount.toString());
        
        // إنشاء معاملة محاسبية لتسجيل إعادة العملة المباعة
        await storage.createTransaction({
          userId,
          type: "exchange",
          amount: Number(offer.remainingAmount).toString(), // إعادة العملة المباعة
          currency: offer.baseCurrency,
          description: `إعادة ${offer.remainingAmount} ${offer.baseCurrency} من إلغاء عرض البيع - الرقم المرجعي: ${offer.id}`,
          referenceNumber: `CANCEL-${offer.id}`
        });
        console.log(`📝 تم تسجيل إعادة العملة المباعة في المعاملات: +${offer.remainingAmount} ${offer.baseCurrency}`);
      }
      
      // Update offer status to cancelled
      const updatedOffer = await storage.updateMarketOfferStatus(offerId, "cancelled");
      
      // 🚀 بث الأحداث اللحظية لإلغاء العرض
      try {
        const realtimeEvents = req.app.get('realtimeEvents');
        if (realtimeEvents) {
          // بث حدث إلغاء العرض
          realtimeEvents.emitMarketOrderCanceled({
            id: offerId,
            userId: userId,
            baseCurrency: offer.baseCurrency,
            quoteCurrency: offer.quoteCurrency
          });
          
          // تحديث دفتر الأوامر
          realtimeEvents.emitOrderbookUpdate(offer.baseCurrency, offer.quoteCurrency);
          
          // تحديث رصيد المستخدم إذا كان عرض بيع وتم استرداد مبلغ
          if (offer.side === "sell" && Number(offer.remainingAmount) > 0) {
            const userBalance = await storage.getUserBalance(userId, offer.baseCurrency);
            if (userBalance) {
              realtimeEvents.emitBalanceUpdate(userId, offer.baseCurrency, userBalance.amount);
            }
          }
          
          console.log(`🚀 تم بث الأحداث اللحظية لإلغاء العرض ${offerId}`);
        }
      } catch (eventError) {
        console.error('خطأ في بث الأحداث اللحظية لإلغاء العرض:', eventError);
      }
      
      res.json({
        message: "تم إلغاء العرض بنجاح",
        offer: updatedOffer
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Execute a market offer (buy from an existing offer)
  app.post("/api/market/:id/execute", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const offerId = parseInt(req.params.id);
      const { amount } = req.body;
      
      
      // التحقق من أن حساب المستخدم مفعل
      const user = await storage.getUser(userId);
      if (!user || user.active === false) {
        return res.status(403).json({ 
          message: "حسابك معطل. لا يمكنك تنفيذ عروض السوق. يرجى التواصل مع الإدارة." 
        });
      }
      
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ message: "يجب تحديد كمية صحيحة" });
      }
      
      // Check if offer exists and is active
      const offer = await storage.getMarketOfferById(offerId);
      if (!offer) {
        return res.status(404).json({ message: "العرض غير موجود" });
      }
      
      if (offer.status !== "open" && offer.status !== "active") {
        return res.status(400).json({ message: "العرض غير متاح حالياً" });
      }
      
      if (Number(offer.remainingAmount) < Number(amount)) {
        return res.status(400).json({ message: "الكمية المتاحة غير كافية" });
      }
      
      // User can't execute their own offers
      if (offer.userId === userId) {
        return res.status(400).json({ message: "لا يمكنك تنفيذ عروضك الخاصة" });
      }
      
      // ملاحظة: لا نحتاج لجلب إعدادات العمولة عند التنفيذ
      // العمولة تم خصمها بالفعل عند نشر العرض
      console.log(`ℹ️ تنفيذ العرض - العمولة مدفوعة مسبقاً عند النشر`);
      
      // Process the exchange based on offer type
      // تحويل من الـ schema الجديد للقديم للتوافق
      const fromCurrency = offer.baseCurrency;
      const toCurrency = offer.quoteCurrency; 
      const rate = offer.price;
      const available = offer.remainingAmount;
      const offerType = offer.side;
      
      if (offerType === "sell") {
        // For sell offers:
        // 1. Seller is offering fromCurrency, buyer needs to pay in toCurrency
        // 2. The exchange rate is: 1 fromCurrency = rate toCurrency
        
        // Calculate how much the buyer needs to pay (without commission)
        const paymentAmount = Number(amount) * Number(rate);
        
        // Check if buyer has enough balance (buyer pays only the amount, no commission)
        const buyerBalance = await storage.getUserBalance(userId, toCurrency);
        if (!buyerBalance || safeParseAmount(buyerBalance.amount) < paymentAmount) {
          return res.status(400).json({ 
            message: `رصيدك من ${toCurrency} غير كافٍ لإتمام العملية`
          });
        }
        
        // لا يوجد خصم عمولة إضافية عند التنفيذ - العمولة مدفوعة مسبقاً عند النشر
        const commission = 0; // العمولة تم خصمها عند النشر
        const sellerReceives = paymentAmount; // البائع يستلم المبلغ كاملاً
        
        console.log(`💰 تفاصيل العملية: المشتري يدفع ${paymentAmount}, البائع يستلم ${sellerReceives} (بدون خصم عمولة إضافية)`);
        
        // Deduct from buyer's balance (only payment amount, no commission)
        const newBuyerBalance = safeParseAmount(buyerBalance.amount) - paymentAmount;
        console.log(`💸 خصم من المشتري: ${safeParseAmount(buyerBalance.amount)} - ${paymentAmount} = ${newBuyerBalance}`);
        await storage.setUserBalance(userId, toCurrency, newBuyerBalance.toString());
        
        // Add the purchased currency to buyer's balance
        const buyerTargetBalance = await storage.getUserBalance(userId, fromCurrency);
        const newBuyerAmount = buyerTargetBalance
          ? safeParseAmount(buyerTargetBalance.amount) + safeParseAmount(amount)
          : safeParseAmount(amount);
        
        console.log(`💎 إضافة العملة المشتراة للمشتري: ${buyerTargetBalance ? safeParseAmount(buyerTargetBalance.amount) : 0} + ${safeParseAmount(amount)} = ${newBuyerAmount}`);
        
        await storage.setUserBalance(userId, fromCurrency, newBuyerAmount.toString());
        
        // Add payment to seller's balance (after deducting commission)
        const sellerBalance = await storage.getUserBalance(offer.userId, toCurrency);
        const newSellerAmount = sellerBalance
          ? safeParseAmount(sellerBalance.amount) + sellerReceives
          : sellerReceives;
        
        console.log(`💰 إضافة الدفع للبائع (بعد العمولة): ${sellerBalance ? safeParseAmount(sellerBalance.amount) : 0} + ${sellerReceives} = ${newSellerAmount}`);
        
        await storage.setUserBalance(offer.userId, toCurrency, newSellerAmount.toString());
        
        // حساب وخصم عمولة النظام مرة واحدة فقط من العرض الكامل
        // التحقق من أن العمولة لم تُخصم مسبقاً
        if (!offer.commissionDeducted) {
          try {
            // حساب العمولة على أساس المبلغ الأصلي الكامل للعرض
            const originalAmount = parseFloat(offer.maxAmount);
            const originalValue = originalAmount * parseFloat(offer.price); // قيمة العرض الكامل بالعملة المقابلة
            
            // جلب إعدادات عمولة النظام للعملة المباعة (baseCurrency)
            const systemCommissionRate = await storage.getSystemCommissionRate('market', offer.baseCurrency);
            let commissionAmount = 0;
            
            if (systemCommissionRate) {
              if (systemCommissionRate.commissionRate && parseFloat(systemCommissionRate.commissionRate) > 0) {
                commissionAmount = originalValue * parseFloat(systemCommissionRate.commissionRate);
              } else if (systemCommissionRate.fixedAmount && parseFloat(systemCommissionRate.fixedAmount) > 0) {
                commissionAmount = parseFloat(systemCommissionRate.fixedAmount);
              }
            }
            
            console.log(`📊 حساب عمولة العرض (مرة واحدة فقط): قيمة العرض الكامل=${originalValue}, عمولة=${commissionAmount.toFixed(6)} ${offer.baseCurrency}`);
            
            if (commissionAmount > 0) {
              // خصم العمولة من البائع
              const sellerCommissionBalance = await storage.getUserBalance(offer.userId, offer.baseCurrency);
              if (sellerCommissionBalance && safeParseAmount(sellerCommissionBalance.amount) >= commissionAmount) {
                const newSellerCommissionBalance = safeParseAmount(sellerCommissionBalance.amount) - commissionAmount;
                await storage.setUserBalance(offer.userId, offer.baseCurrency, newSellerCommissionBalance.toString());
                
                // تطبيق نظام مكافآت الإحالة مثل التحويلات الدولية
                console.log(`🚀 بدء تطبيق نظام مكافآت السوق للمستخدم ${offer.userId} بعمولة ${commissionAmount.toFixed(6)} ${offer.baseCurrency}`);
                
                try {
                  const { allocateFixedReferralReward } = await import('./referral-system');
                  
                  // تطبيق نظام المكافآت أولاً لحساب صافي العمولة
                  const referralResult = await allocateFixedReferralReward(
                    offerId, // استخدام معرف العرض كمعرف المعاملة
                    'market_sell',
                    commissionAmount,
                    offer.baseCurrency,
                    offer.userId // المستخدم المُحال هو البائع
                  );
                  
                  console.log(`📊 نتيجة نظام مكافآت السوق: hasReferral=${referralResult.hasReferral}, rewardAmount=${referralResult.rewardAmount}, netSystemCommission=${referralResult.netSystemCommission}`);
                  
                  // إضافة صافي العمولة فقط (بعد خصم مكافأة الإحالة) إلى مجمع العمولات
                  const netCommission = referralResult.netSystemCommission;
                  if (netCommission > 0) {
                    await storage.addCommissionPoolTransaction({
                      sourceType: 'user',
                      sourceId: offer.userId,
                      sourceName: `عمولة بيع: ${offer.baseCurrency}→${offer.quoteCurrency}`,
                      currencyCode: offer.baseCurrency,
                      amount: netCommission.toFixed(6),
                      transactionType: 'credit',
                      description: `عمولة عرض سوق (صافي بعد المكافآت) - البائع: ${offer.userId}, المبلغ الأصلي: ${originalAmount}`,
                      relatedTransactionId: offerId
                    });
                    
                    console.log(`💰 إضافة صافي عمولة ${netCommission.toFixed(6)} ${offer.baseCurrency} إلى مجمع العمولات (بعد خصم مكافأة إحالة ${(commissionAmount - netCommission).toFixed(6)})`);
                  }
                } catch (referralError) {
                  console.error('❌ خطأ في تطبيق نظام مكافآت السوق:', referralError);
                  
                  // في حالة فشل نظام المكافآت، إضافة العمولة كاملة كما هو متوقع
                  await storage.addCommissionPoolTransaction({
                    sourceType: 'user',
                    sourceId: offer.userId,
                    sourceName: `عمولة بيع: ${offer.baseCurrency}→${offer.quoteCurrency}`,
                    currencyCode: offer.baseCurrency,
                    amount: commissionAmount.toFixed(6),
                    transactionType: 'credit',
                    description: `عمولة عرض سوق كامل - البائع: ${offer.userId}, المبلغ الأصلي: ${originalAmount}`
                  });
                }
                
                console.log(`🏦 تم خصم وتحويل العمولة: ${commissionAmount.toFixed(6)} ${offer.baseCurrency} (مرة واحدة فقط)`);
                
                // إضافة سجل العمولة
                await db.insert(commissionLogs).values({
                  userId: offer.userId,
                  userName: user?.fullName || `المستخدم ${offer.userId}`,
                  offerType: 'sell',
                  commissionAmount: commissionAmount.toFixed(6),
                  commissionCurrency: offer.baseCurrency,
                  sourceId: offerId,
                  sourceType: 'market_offer',
                  action: 'transferred',
                  description: `عمولة عرض سوق كامل: ${offer.baseCurrency}→${offer.quoteCurrency}, المبلغ الأصلي: ${originalAmount}`,
                });
                
                // تحديث العرض لتسجيل أن العمولة تم خصمها
                await db.update(marketOffers)
                  .set({ commissionDeducted: true })
                  .where(eq(marketOffers.id, offerId));
                
                console.log(`✅ تم تحديث العرض ${offerId} - العمولة خُصمت مرة واحدة فقط`);
              }
            }
          } catch (error) {
            console.error("خطأ في حساب عمولة الصفقة:", error);
          }
        } else {
          console.log(`📌 العرض ${offerId}: العمولة خُصمت مسبقاً، لن تُخصم مرة أخرى`);
        }
        
        // Update offer available amount
        const newAvailable = Number(available) - Number(amount);
        // إذا لم يبق شيء في العرض، نلغيه، وإلا نبقيه مفتوحاً
        const newStatus = newAvailable <= 0 ? "cancelled" : "open";
        
        const updatedOffer = await storage.updateMarketOfferStatus(
          offerId, 
          newStatus, 
          newAvailable
        );
        
        // تسجيل عملية السوق في جدول market_transactions
        const marketTransaction = await storage.createMarketTransaction({
          buyerId: userId,
          offerId: offerId,
          amount: amount.toString(),
          totalCost: paymentAmount.toString(),
          commission: "0", // لا توجد عمولة إضافية - العمولة دُفعت عند النشر
        });
        
        // Create transaction records - للمشتري (خصم العملة المدفوعة)
        await storage.createTransaction({
          userId,
          type: "exchange",
          amount: (-paymentAmount).toString(), // خصم المبلغ المدفوع
          currency: toCurrency,
          description: `شراء ${amount} ${fromCurrency} بسعر ${rate} ${toCurrency}`
        });
        
        // للمشتري (إضافة العملة المستلمة)
        await storage.createTransaction({
          userId,
          type: "exchange",
          amount: amount.toString(), // إضافة العملة المشتراة
          currency: fromCurrency,
          description: `استلام ${amount} ${fromCurrency} من عملية الشراء`
        });
        
        // للبائع (خصم العملة المباعة) - تم بالفعل عند إنشاء العرض
        // للبائع (إضافة العملة المستلمة)
        await storage.createTransaction({
          userId: offer.userId,
          type: "exchange",
          amount: sellerReceives.toString(),
          currency: toCurrency,
          description: `استلام ${sellerReceives} ${toCurrency} من بيع ${amount} ${fromCurrency} (العمولة مخصومة مسبقاً)`
        });
        
        // إنشاء إيصال سوق العملات
        try {
          const { MarketReceiptGenerator } = await import('./receipt-services/market-receipt-generator');
          
          // إعداد بيانات الإيصال
          const marketTransactionData = {
            id: marketTransaction.id,
            buyer_id: userId,
            seller_id: offer.userId,
            amount: amount.toString(),
            total_cost: paymentAmount.toString(),
            commission: commission.toString(),
            rate: rate,
            from_currency: fromCurrency,
            to_currency: toCurrency,
            created_at: new Date().toISOString()
          };
          
          const receiptData = await MarketReceiptGenerator.prepareMarketReceiptData(marketTransactionData);
          const receiptBuffer = await MarketReceiptGenerator.generateMarketReceipt(receiptData);
          
          // حفظ الإيصال
          const receiptPath = `./public/receipts/market_${marketTransaction.id}_${Date.now()}.png`;
          await import('fs/promises').then(fs => fs.writeFile(receiptPath, receiptBuffer));
          
          console.log(`📄 تم إنشاء إيصال سوق العملات: ${receiptPath}`);
        } catch (error) {
          console.error("خطأ في إنشاء إيصال سوق العملات:", error);
        }

        // منح نقاط لكل من المشتري والبائع
        try {
          const settings = await rewardsService.getSettings();
          
          // منح نقاط للمشتري
          await rewardsService.awardPoints({
            userId: userId,
            points: settings.transferPoints || 3, // استخدام transferPoints أو قيمة افتراضية
            action: 'market_trade',
            description: `Market trade: bought ${amount} ${fromCurrency}`,
            descriptionAr: `تداول السوق: شراء ${amount} ${fromCurrency}`,
            referenceId: marketTransaction.id.toString(),
            referenceType: 'market_transaction',
          });
          
          // منح نقاط للبائع
          await rewardsService.awardPoints({
            userId: offer.userId,
            points: settings.transferPoints || 3, // استخدام transferPoints أو قيمة افتراضية
            action: 'market_trade',
            description: `Market trade: sold ${amount} ${fromCurrency}`,
            descriptionAr: `تداول السوق: بيع ${amount} ${fromCurrency}`,
            referenceId: marketTransaction.id.toString(),
            referenceType: 'market_transaction',
          });
          
          console.log(`✅ تم منح ${settings.transferPoints || 3} نقطة لكل من المشتري ${userId} والبائع ${offer.userId} للتداول`);
        } catch (error) {
          console.error('خطأ في منح النقاط للتداول:', error);
        }

        // ملاحظة: تم نقل منطق مكافأة الإحالة لمكان آخر في الكود ليتم خصمها من العمولة الفعلية

        // 🚀 بث الأحداث اللحظية
        try {
          const realtimeEvents = req.app.get('realtimeEvents');
          if (realtimeEvents) {
            // تحديث أرصدة المشتري
            realtimeEvents.emitBalanceUpdate(userId, toCurrency, newBuyerBalance.toString());
            realtimeEvents.emitBalanceUpdate(userId, fromCurrency, newBuyerAmount.toString());
            
            // تحديث أرصدة البائع
            realtimeEvents.emitBalanceUpdate(offer.userId, toCurrency, newSellerAmount.toString());
            
            // بث حدث تنفيذ الصفقة
            realtimeEvents.emitMarketTradeExecuted({
              id: marketTransaction.id,
              buyerId: userId,
              sellerId: offer.userId,
              baseCurrency: fromCurrency,
              quoteCurrency: toCurrency,
              amount: amount,
              price: rate,
              total: paymentAmount
            });
            
            // إلغاء العرض إذا انتهى أو تحديث دفتر الأوامر
            if (newStatus === "cancelled") {
              realtimeEvents.emitMarketOrderCanceled({
                id: offerId,
                userId: offer.userId,
                baseCurrency: fromCurrency,
                quoteCurrency: toCurrency
              });
            } else {
              realtimeEvents.emitOrderbookUpdate(fromCurrency, toCurrency);
            }
            
            console.log(`🚀 تم بث الأحداث اللحظية لتنفيذ العرض ${offerId}`);
          }
        } catch (eventError) {
          console.error('خطأ في بث الأحداث اللحظية:', eventError);
        }

        res.json({
          message: "تم تنفيذ العملية بنجاح",
          exchange: {
            paid: paymentAmount,
            received: amount,
            commission,
            rate: rate,
            sellerReceived: sellerReceives,
            marketTransactionId: marketTransaction.id
          }
        });
      } else {
        // For buy offers, implement similarly but with reversed logic
        // Not implemented in this version for brevity
        return res.status(501).json({ message: "تنفيذ عروض الشراء غير متاح حالياً" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // جلب إيصال سوق العملات
  app.get("/api/market/receipt/:transactionId", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const transactionId = parseInt(req.params.transactionId);
      
      // بحث في معاملات السوق بناءً على الرقم المرجعي من جدول transactions
      const transactionRecord = await db.select()
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .limit(1);
        
      if (transactionRecord.length === 0) {
        return res.status(404).json({ message: "المعاملة غير موجودة" });
      }
      
      const refNumber = transactionRecord[0].referenceNumber;
      if (!refNumber) {
        return res.status(404).json({ message: "الرقم المرجعي غير موجود" });
      }
      
      // إنشاء إيصال مبسط لمعاملات السوق
      // نستخدم بيانات المعاملة من جدول transactions مباشرة
      const transaction = transactionRecord[0];
      
      // استخراج المعلومات من الوصف
      const amount = Math.abs(parseFloat(transaction.amount || '0'));
      const currency = transaction.currency || 'LYD';
      const description = transaction.description || '';
      
      // تحديد معلومات السوق من الوصف
      let fromCurrency = 'USD';
      let toCurrency = 'LYD';
      let exchangeRate = '1';
      let soldAmount = amount.toString();
      let purchaseValue = amount.toString();
      
      // تحليل الوصف لاستخراج التفاصيل
      if (description.includes('بيع')) {
        const rateMatch = description.match(/بسعر\s+(\d+(?:\.\d+)?)/);
        if (rateMatch) exchangeRate = rateMatch[1];
        
        const amountMatch = description.match(/(\d+(?:\.\d+)?)\s*USD/);
        if (amountMatch) {
          soldAmount = amountMatch[1];
          purchaseValue = (parseFloat(amountMatch[1]) * parseFloat(exchangeRate)).toString();
        }
      } else if (description.includes('شراء')) {
        const rateMatch = description.match(/بسعر\s+(\d+(?:\.\d+)?)/);
        if (rateMatch) exchangeRate = rateMatch[1];
        
        const amountMatch = description.match(/(\d+(?:\.\d+)?)\s*USD/);
        if (amountMatch) {
          soldAmount = amountMatch[1];
          purchaseValue = (parseFloat(amountMatch[1]) * parseFloat(exchangeRate)).toString();
        }
      }
      
      // إنشاء إيصال مبسط للسوق
      const receiptData = {
        receiptNumber: `MARKET-${transactionId}`,
        transactionId: transactionId.toString(),
        date: new Date(transaction.date).toLocaleDateString('ar-EG'),
        time: new Date(transaction.date).toLocaleTimeString('ar-EG'),
        sellerAccount: '4', // حساب البائع
        buyerAccount: userId.toString(), // حساب المشتري
        systemAccount: '1000', // حساب النظام
        soldAmount: soldAmount,
        purchaseValue: purchaseValue,
        exchangeRate: exchangeRate,
        fromCurrency,
        toCurrency,
        commission: '0',
        commissionCurrency: currency,
        verificationHash: `MARKET-HASH-${transactionId}-${Date.now()}`
      };
      
      const { MarketReceiptGenerator } = await import('./receipt-services/market-receipt-generator');
      const receiptBuffer = await MarketReceiptGenerator.generateMarketReceipt(receiptData);
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="market_receipt_${transactionId}.png"`
      });
      
      res.send(receiptBuffer);
    } catch (error) {
      next(error);
    }
  });

  // جلب سجل معاملات السوق للمستخدم
  app.get("/api/market/transactions", authMiddleware, async (req: AuthRequest, res: Response, next) => {
    try {
      const userId = req.user.id;
      const transactions = await storage.getUserMarketTransactions(userId);
      
      // إضافة معلومات العروض وتفاصيل أكثر للمعاملات
      const enhancedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          const offer = await storage.getMarketOfferById(transaction.offerId);
          
          return {
            ...transaction,
            offerDetails: offer ? {
              fromCurrency: offer.baseCurrency,
              toCurrency: offer.quoteCurrency,
              rate: offer.price,
              sellerId: offer.userId,
            } : null,
            date: transaction.createdAt,
          };
        })
      );
      
      res.json(enhancedTransactions);
    } catch (error) {
      next(error);
    }
  });

  // API لحساب السعر الفعلي مع العمولة لعرض السوق
  app.get("/api/market/effective-rate/:offerId", authMiddleware, async (req, res, next) => {
    try {
      const offerId = parseInt(req.params.offerId);
      const { amount } = req.query;
      
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ message: "يجب تحديد كمية صحيحة" });
      }
      
      const offer = await storage.getMarketOfferById(offerId);
      if (!offer) {
        return res.status(404).json({ message: "العرض غير موجود" });
      }
      
      // جلب نسبة العمولة من إعدادات النظام
      let commissionRate = 0.01; // افتراضي 1%
      let commissionAmount = 0;
      let isFixedCommission = false;
      
      try {
        // جلب إعدادات العمولة من جدول systemCommissionRates للسوق
        const storage = req.app.locals.storage as DatabaseStorage;
        const marketCommissionRate = await storage.getSystemCommissionRate('market', req.body.tradeCurrency || 'USD');
        
        if (marketCommissionRate) {
          if (marketCommissionRate.fixedAmount && parseFloat(marketCommissionRate.fixedAmount) > 0) {
            commissionAmount = parseFloat(marketCommissionRate.fixedAmount);
            isFixedCommission = true;
            console.log(`💰 استخدام عمولة ثابتة للسوق: ${commissionAmount} ${req.body.tradeCurrency || 'USD'}`);
          } else if (marketCommissionRate.commissionRate) {
            commissionRate = parseFloat(marketCommissionRate.commissionRate);
            console.log(`📊 استخدام نسبة عمولة السوق: ${commissionRate * 100}%`);
          } else if (marketCommissionRate.perMilleRate) {
            commissionRate = parseFloat(marketCommissionRate.perMilleRate) / 1000;
            console.log(`📊 استخدام نسبة في الألف للسوق: ${parseFloat(marketCommissionRate.perMilleRate)}‰`);
          }
        } else {
          // في حالة عدم وجود إعدادات محددة للسوق، جلب من systemCommissionSettings كما هو
          const commissionSettings = await db.select()
            .from(systemCommissionSettings)
            .orderBy(desc(systemCommissionSettings.updatedAt))
            .limit(1);
            
          if (commissionSettings.length > 0) {
            const setting = commissionSettings[0];
            const settingValue = parseFloat(setting.value);
            
            if (setting.type === 'fixed') {
              commissionAmount = settingValue;
              isFixedCommission = true;
            } else {
              commissionRate = settingValue / 100;
            }
          }
          console.log(`⚠️ لم توجد إعدادات عمولة خاصة بالسوق، استخدام الإعدادات العامة`);
        }
      } catch (error) {
        console.error("خطأ في جلب إعدادات العمولة:", error);
      }
      
      if (offer.offerType === "sell") {
        const paymentAmount = Number(amount) * Number(offer.rate);
        const commission = isFixedCommission ? commissionAmount : paymentAmount * commissionRate;
        const sellerReceives = paymentAmount - commission;
        const effectiveRate = sellerReceives / Number(amount);
        
        res.json({
          originalRate: Number(offer.rate),
          effectiveRate: effectiveRate,
          commission: commission,
          commissionType: isFixedCommission ? 'fixed' : 'percentage',
          paymentAmount: paymentAmount,
          sellerReceives: sellerReceives
        });
      } else {
        // For buy offers - not implemented yet
        res.json({
          originalRate: Number(offer.rate),
          effectiveRate: Number(offer.rate),
          commission: 0,
          commissionType: 'none'
        });
      }
    } catch (error) {
      next(error);
    }
  });

  // ===== API routes for upgrade requests =====
  
  // تقديم طلب ترقية
  app.post("/api/upgrade-requests", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // التحقق إذا كان المستخدم مرقى للتحويل بين المدن بالفعل
      if (user.type === 'agent') {
        return res.status(400).json({ message: "حسابك مرقى بالفعل للتحويل بين المدن" });
      }
      
      // التحقق من توثيق الحساب قبل السماح بالترقية
      if (!user.verified) {
        return res.status(400).json({ 
          message: "يجب توثيق الحساب أولاً قبل طلب ترقية التحويل بين المدن. يرجى إرسال المستندات المطلوبة للتوثيق."
        });
      }
      
      // التحقق إذا كان لدى المستخدم طلب قيد الانتظار
      const pendingRequest = await storage.getPendingUpgradeRequest(userId);
      if (pendingRequest) {
        return res.status(400).json({ message: "لديك طلب ترقية للتحويل بين المدن قيد الانتظار بالفعل" });
      }
      
      // التحقق من صحة البيانات
      const result = upgradeRequestSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // إنشاء طلب الترقية باستخدام القيم التي مررنا صحتها من المخطط
      const requestData = {
        userId,
        requestType: "agent_upgrade", // نوع الطلب للتحويل بين المدن
        fullName: req.body.fullName,
        phone: req.body.phone,
        city: req.body.city,
        message: req.body.message || '',
      };
      
      const request = await storage.createUpgradeRequest(requestData);
      
      res.status(201).json({
        message: "تم تقديم طلب ترقية التحويل بين المدن بنجاح",
        request
      });
      
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  // الحصول على طلبات ترقية المستخدم
  app.get("/api/user/upgrade-requests", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const requests = await storage.getUserUpgradeRequests(userId);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });
  
  // الحصول على جميع طلبات الترقية (للمشرفين فقط)
  app.get("/api/admin/upgrade-requests", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const user = await storage.getUser(userId);
      
      // التحقق إذا كان المستخدم مشرف
      if (user?.type !== 'admin') {
        return res.status(403).json({ message: "ليس لديك صلاحية للوصول إلى هذا المورد" });
      }
      
      const status = req.query.status as string | undefined;
      // تصفية فقط طلبات ترقية الوكلاء، وليس التحويل الخارجي
      const requests = await storage.getUpgradeRequestsWithDetails("agent_upgrade", status as any);
      
      // البيانات تأتي مع معلومات المستخدم مُضمنة من getUpgradeRequestsWithDetails
      const enhancedRequests = requests;
      
      res.json(enhancedRequests);
    } catch (error) {
      next(error);
    }
  });
  
  // الموافقة على طلب ترقية أو رفضه (للمشرفين فقط)
  app.patch("/api/admin/upgrade-requests/:id", authMiddleware, async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const user = await storage.getUser(userId);
      
      // التحقق إذا كان المستخدم مشرف
      if (user?.type !== 'admin') {
        return res.status(403).json({ message: "ليس لديك صلاحية للوصول إلى هذا المورد" });
      }
      
      const requestId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({ message: "الحالة غير صالحة" });
      }
      
      const updatedRequest = await storage.updateRequestStatus(requestId, status, notes);
      
      res.json({
        message: status === 'approved' ? "تمت الموافقة على طلب الترقية" : "تم رفض طلب الترقية",
        request: updatedRequest
      });
    } catch (error) {
      next(error);
    }
  });

  // API لتوثيق الحساب - الحصول على حالة التوثيق
  app.get("/api/user/verification", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      
      // البحث عن طلب التوثيق في قاعدة البيانات
      const verificationRequest = await storage.getUserVerificationRequest(userId);
      
      if (verificationRequest) {
        // إذا وجد طلب توثيق، نرجع بياناته
        res.json({
          status: verificationRequest.status,
          userId,
          lastUpdate: verificationRequest.createdAt,
          notes: verificationRequest.notes || null
        });
      } else {
        // إذا لم يوجد طلب توثيق، نرجع حالة "not_started"
        res.json({ 
          status: 'not_started',
          userId,
          lastUpdate: new Date().toISOString(),
          notes: null
        });
      }
    } catch (error) {
      console.error("خطأ في استرجاع حالة التوثيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء استرجاع حالة التوثيق" });
    }
  });
  
  // API لبدء عملية توثيق الحساب
  app.post("/api/user/verification", authMiddleware, async (req, res) => {
    const userId = (req as AuthRequest).user.id;
    const action = req.body.action;
    
    if (action === "start") {
      try {
        // إذا كان هناك بيانات إضافية، نعرضها في السجلات
        console.log("بيانات توثيق الحساب:", {
          userId,
          ...req.body
        });
        
        // إنشاء طلب التوثيق في قاعدة البيانات
        const verificationRequest = await storage.createVerificationRequest({
          userId,
          status: 'pending',
          notes: `
- الاسم الكامل: ${req.body.fullName || 'غير محدد'}
- رقم الهاتف: ${req.body.phoneNumber || 'غير محدد'}
- المدينة: ${req.body.city || 'غير محدد'}
- العنوان: ${req.body.address || 'غير محدد'}
- نوع الهوية: ${req.body.idType || 'غير محدد'}
- ملاحظات إضافية: ${req.body.notes || 'لا توجد'}
          `.trim(),
          idPhotoUrl: req.body.idPhotoUrl || null,
          proofOfAddressUrl: req.body.proofOfAddressUrl || null
        });
        
        // إرجاع استجابة النجاح
        res.json({ 
          status: 'pending',
          userId,
          lastUpdate: new Date().toISOString(),
          message: 'تم استلام طلب التوثيق وهو قيد المراجعة الآن، سيتم إشعارك عند اكتمال المراجعة'
        });
      } catch (error) {
        console.error("خطأ في إنشاء طلب التوثيق:", error);
        res.status(500).json({ message: "حدث خطأ أثناء إنشاء طلب التوثيق" });
      }
    } else {
      return res.status(400).json({ message: "الإجراء غير صالح" });
    }
  });

  // API للحوالات بين المدن (بين مكاتب الصرافة)
  app.post("/api/city-transfers/send", authMiddleware, async (req, res) => {
    const userId = (req as AuthRequest).user.id;
    
    try {
      // التحقق من أن المستخدم عميل (مكتب صرافة)
      const user = await storage.getUser(userId);
      if (!user || (user.type !== "agent" && user.type !== "admin" && !user.extTransferEnabled)) {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط لمكاتب الصرافة" });
      }
      
      const { receiverOfficeId, amount, currency = "LYD" } = req.body;
      
      // التحقق من المستلم
      const receiverOffice = await storage.getUser(receiverOfficeId);
      if (!receiverOffice || receiverOffice.type !== "agent") {
        return res.status(400).json({ message: "مكتب الصرافة المستلم غير موجود" });
      }
      
      // حساب العمولة للمكتب المستلم باستخدام إعدادات العمولة الإدارية
      let receiverCommissionAmount = 0;
      
      // أولاً البحث عن شريحة العمولة المطبقة للمكتب المستلم (نظام الشرائح الأساسي)
      const applicableTier = await storage.findApplicableCityCommission(
        receiverOfficeId,
        Number(amount),
        currency,
        user.city,
        receiverOffice.city
      );
      
      if (applicableTier) {
        // استخدام قيمة العمولة من الشريحة المطبقة
        receiverCommissionAmount = Number(applicableTier.commission);
        console.log(`إرسال: تطبيق عمولة شريحة ${applicableTier.commission} ${currency} للمكتب ${receiverOffice.fullName}`);
      } else {
        // البحث عن إعدادات العمولة الإدارية للمكتب المستلم كبديل ثانوي
        const receiverCommissionSettings = await storage.getAgentCommissionByCurrency(receiverOfficeId, currency);
        
        if (receiverCommissionSettings) {
          // استخدام إعدادات العمولة الإدارية - استخدام الحقول الصحيحة type و value
          let rate = 0;
          if (receiverCommissionSettings.type === 'percentage') {
            rate = Number(receiverCommissionSettings.value) / 100;
          } else if (receiverCommissionSettings.type === 'fixed') {
            receiverCommissionAmount = Number(receiverCommissionSettings.value);
          }
          
          if (receiverCommissionSettings.type === 'percentage') {
            receiverCommissionAmount = Number(amount) * rate;
          }
          
          console.log(`إرسال: تطبيق إعدادات عمولة المكتب الإدارية ${receiverCommissionSettings.type === 'percentage' ? (rate * 100 + '%') : 'ثابت'} = ${receiverCommissionAmount} ${currency} للمكتب ${receiverOffice.fullName}`);
        } else {
          // إذا لم توجد شريحة مناسبة ولا إعدادات إدارية، استخدام العمولة الافتراضية 1.5%
          const defaultCommissionRate = 0.015; // 1.5%
          receiverCommissionAmount = Number(amount) * defaultCommissionRate;
          console.log(`إرسال: استخدام العمولة الافتراضية 1.5% = ${receiverCommissionAmount} ${currency} (لا توجد شرائح ولا إعدادات)`);
        }
      }
      
      // التحقق من العمولة المخصصة للمدراء
      const senderUser = await storage.getUser(userId);
      let systemCommission = 0;
      
      if (req.body.customCommission !== undefined && req.body.customCommission !== "" && (senderUser?.type === 'admin' || senderUser?.type === 'agent')) {
        // المدير أو الوكيل يمكنهما تحديد عمولة مخصصة
        systemCommission = safeParseAmount(req.body.customCommission);
        if (systemCommission < 0) {
          return res.status(400).json({ message: "العمولة لا يمكن أن تكون سالبة" });
        }
      } else {
        // جلب نسبة عمولة النظام من إعدادات النظام
        const systemCommissionRateData = await storage.getSystemCommissionRate('city', currency);
        
        if (systemCommissionRateData && systemCommissionRateData.fixedAmount) {
          // عمولة ثابتة
          systemCommission = Number(systemCommissionRateData.fixedAmount);
          console.log(`📊 تطبيق عمولة النظام الثابتة: ${systemCommission} ${currency}`);
        } else {
          // عمولة نسبية - استخدام commissionRate أو النسبة في الألف
          let rate = 0.01; // 1% افتراضية
          if (systemCommissionRateData?.commissionRate) {
            rate = Number(systemCommissionRateData.commissionRate);
          } else if (systemCommissionRateData?.perMilleRate) {
            rate = Number(systemCommissionRateData.perMilleRate) / 1000;
          }
          systemCommission = Number(amount) * rate;
          console.log(`📊 تطبيق عمولة النظام النسبية: ${rate * 100}% = ${systemCommission} ${currency}`);
        }
      }
      
      const commissionForReceiver = receiverCommissionAmount;
      const commissionForSystem = systemCommission;
      const totalAmount = Number(amount) + commissionForReceiver + systemCommission;
      
      // التحقق من الرصيد
      const balance = await storage.getUserBalance(userId, currency);
      if (!balance || safeParseAmount(balance.amount) < totalAmount) {
        return res.status(400).json({ message: "الرصيد غير كافٍ لإجراء هذه العملية" });
      }
      
      // إنشاء كود للحوالة (6 أرقام) باستخدام الدالة المساعدة
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // في التطبيق النهائي، يجب التحقق من أن الرمز غير مستخدم من قبل
      // يمكن إضافة التحقق بالشكل التالي:
      /*
      let isCodeUnique = false;
      let code;
      
      while (!isCodeUnique) {
        code = generateTransferCode();
        const existingTransfer = await storage.getCityTransferByCode(code);
        if (!existingTransfer) {
          isCodeUnique = true;
        }
      }
      */
      
      // خصم المبلغ من رصيد المرسل
      const currentBalance = safeParseAmount(balance.amount);
      const newBalance = currentBalance - totalAmount;
      
      console.log(`تحديث الرصيد للحوالة المدينية: الرصيد الحالي ${currentBalance} - المجموع ${totalAmount} = ${newBalance}`);
      
      await storage.setUserBalance(userId, currency, newBalance.toString());
      
      // إنشاء سجل معاملة للخصم
      await storage.createTransaction({
        userId,
        type: "withdraw",
        amount: totalAmount.toString(),
        currency,
        description: `حوالة مدينية إلى ${receiverOffice.fullName} برمز: ${code}`
      });
      
      // إنشاء الحوالة في قاعدة البيانات
      const cityTransferData = {
        senderId: userId,
        receiverOfficeId: receiverOffice.id,
        amount: amount.toString(),
        commissionForReceiver: commissionForReceiver.toString(),
        commissionForSystem: commissionForSystem.toString(),
        currency,
        code,
        status: "pending"
      };
      
      try {
        // إنشاء سجل الحوالة في قاعدة البيانات
        const newTransfer = await storage.createCityTransfer(cityTransferData);
        console.log("تم إنشاء حوالة جديدة:", newTransfer);

        // عمولة النظام معلقة - ستضاف فقط عند الاستلام
        console.log(`💰 عمولة نظام معلقة: ${systemCommission} ${currency} (ستضاف عند الاستلام)`);
      } catch (dbError) {
        console.error("خطأ في حفظ الحوالة:", dbError);
        // في حال حدوث خطأ، نعيد المبلغ المخصوم إلى حساب المرسل
        console.log(`إعادة المبلغ في حال الخطأ: ${Number(balance.amount)}`);
        await storage.setUserBalance(userId, currency, (Number(balance.amount)).toString());
        
        return res.status(500).json({ 
          message: "حدث خطأ أثناء إنشاء الحوالة، تم إعادة المبلغ إلى رصيدك" 
        });
      }
      
      // منح نقاط للتحويل بين المدن
      try {
        const settings = await rewardsService.getSettings();
        await rewardsService.awardPoints({
          userId: userId,
          points: settings.transferPoints || 5, // استخدام transferPoints أو قيمة افتراضية
          action: 'city_transfer',
          description: `City transfer: ${amount} ${currency} to ${receiverOffice.fullName}`,
          descriptionAr: `حوالة بين المدن: ${amount} ${currency} إلى ${receiverOffice.fullName}`,
          referenceId: code,
          referenceType: 'city_transfer',
        });
        console.log(`✅ تم منح ${settings.transferPoints || 5} نقطة للمستخدم ${userId} للحوالة بين المدن`);
      } catch (error) {
        console.error('خطأ في منح النقاط للحوالة بين المدن:', error);
      }

      res.json({
        message: "تم إنشاء الحوالة بنجاح",
        transferCode: code,
        receiverOffice: receiverOffice.fullName,
        amount,
        commissionForReceiver,
        commissionForSystem,
        totalAmount,
        currency
      });
      
    } catch (error) {
      console.error("خطأ في إنشاء الحوالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء الحوالة" });
    }
  });
  
  // API لاستلام الحوالة بالكود
  app.post("/api/city-transfers/receive", authMiddleware, async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    
    try {
      // التحقق من أن المستخدم عميل (مكتب صرافة)
      const user = await storage.getUser(userId);
      if (!user || (user.type !== "agent" && user.type !== "admin" && !user.extTransferEnabled)) {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط لمكاتب الصرافة" });
      }
      
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "يرجى إدخال رمز الحوالة" });
      }
      
      // البحث عن الحوالة بالرمز
      const transfer = await storage.getCityTransferByCode(code);
      
      if (!transfer) {
        return res.status(404).json({ message: "لم يتم العثور على حوالة بهذا الرمز" });
      }
      
      // التحقق من أن الحوالة موجهة إلى هذا المكتب
      if (transfer.receiverOfficeId !== userId) {
        return res.status(403).json({ message: "هذه الحوالة غير موجهة إلى مكتبك" });
      }
      
      // التحقق من حالة الحوالة
      if (transfer.status !== "pending") {
        return res.status(400).json({ message: "تم استلام هذه الحوالة مسبقًا" });
      }
      
      // استخدام معاملة قاعدة بيانات لضمان اتساق البيانات (في التطبيق النهائي)
      const amount = Number(transfer.amount);
      const commissionForReceiver = Number(transfer.commissionForReceiver);
      const totalToReceive = amount + commissionForReceiver;
      
      // إضافة المبلغ الأساسي فقط إلى رصيد المكتب المستلم (بدون عمولة النظام)
      // العمولة تذهب لحساب العمولات فقط وليس لرصيد المكتب
      const balance = await storage.getUserBalance(userId, transfer.currency) || { amount: "0" };
      const currentBalance = safeParseAmount(balance.amount);
      const newAmount = currentBalance + amount; // المبلغ الأساسي فقط بدون العمولة
      
      console.log(`استلام الحوالة: الرصيد الحالي ${currentBalance} + المبلغ المستلم ${amount} = ${newAmount} (العمولة ${commissionForReceiver} تذهب لحساب العمولات)`);
      
      await storage.setUserBalance(userId, transfer.currency, newAmount.toString());
      
      // إضافة عمولة المكتب المستلم إلى حساب العمولات (هذا صحيح - يتم عند الاستلام)
      if (commissionForReceiver > 0) {
        await storage.addAgentCommission(
          userId,
          commissionForReceiver,
          transfer.currency,
          `عمولة استلام حوالة بين المدن - ${transfer.code}`
        );
        console.log(`💰 تمت إضافة عمولة المكتب المستلم ${commissionForReceiver} ${transfer.currency} لحساب عمولة المكتب`);
      }
      
      // إنشاء سجل معاملة للإضافة (المبلغ الأساسي فقط)
      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        currency: transfer.currency,
        description: `استلام حوالة مدينية برمز: ${code} (العمولة ${commissionForReceiver} تمت إضافتها لحساب العمولات)`
      });
      
      // تحديث حالة الحوالة إلى "completed"
      await storage.updateCityTransferStatus(transfer.id, "completed");
      
      return res.json({
        message: "تم استلام الحوالة بنجاح",
        amount,
        commission: commissionForReceiver,
        total: amount, // المبلغ الأساسي المُضاف للرصيد
        currency: transfer.currency
      });
      
    } catch (error) {
      console.error("خطأ في استلام الحوالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء استلام الحوالة" });
    }
  });
  
  // API للحصول على سجل الحوالات المدينية
  app.get("/api/city-transfers", authMiddleware, async (req, res) => {
    const userId = (req as AuthRequest).user.id;
    
    try {
      // التحقق من أن المستخدم عميل (مكتب صرافة)
      const user = await storage.getUser(userId);
      if (!user || (user.type !== "agent" && user.type !== "admin" && !user.extTransferEnabled)) {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط لمكاتب الصرافة" });
      }
      
      // جلب سجل الحوالات المدينية للمستخدم
      // سواء كان هو المرسل أو المستلم
      const transfers = await storage.getCityTransfers(userId);
      
      // تنسيق البيانات للعرض في واجهة المستخدم
      const formattedTransfers = await Promise.all(
        transfers.map(async (transfer) => {
          // الحصول على معلومات المكتب المستلم
          const receiverOffice = await storage.getUser(transfer.receiverOfficeId);
          
          return {
            id: transfer.id,
            code: transfer.code,
            amount: Number(transfer.amount),
            currency: transfer.currency,
            receiverOfficeName: receiverOffice?.fullName || "مكتب صرافة",
            status: transfer.status,
            createdAt: transfer.createdAt.toISOString(),
            completedAt: transfer.completedAt ? transfer.completedAt.toISOString() : null
          };
        })
      );
      
      res.json(formattedTransfers);
      
    } catch (error) {
      console.error("خطأ في جلب سجل الحوالات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب سجل الحوالات" });
    }
  });
  
  // واجهة برمجة تطبيق بديلة ومبسطة لاستلام حوالة بالكود
  app.post("/api/agent/receive-city-transfer", authMiddleware, async (req, res) => {
    const { id: receiverId, type } = (req as AuthRequest).user;
    const { code } = req.body;
    
    console.log(`🔍 محاولة استلام حوالة: المستخدم ${receiverId}, النوع: "${type}", الكود: ${code}`);
    
    try {
      // التحقق من أن المستخدم وكيل (مكتب صرافة) من قاعدة البيانات مباشرة
      const currentUser = await storage.getUser(receiverId);
      console.log(`📊 نوع المستخدم من قاعدة البيانات: "${currentUser?.type}"`);
      
      if (!currentUser || currentUser.type !== "agent") {
        return res.status(403).json({ message: "الصلاحية مخصصة للمكاتب فقط - يرجى تسجيل الخروج والدخول مرة أخرى" });
      }
      
      if (!code) {
        return res.status(400).json({ message: "يرجى إدخال رمز الحوالة" });
      }
      
      // البحث عن الحوالة بالكود المدخل
      const transfer = await storage.getCityTransferByCode(code);
      
      // التحقق من وجود الحوالة وصلاحيتها
      if (!transfer) {
        return res.status(404).json({ message: "لم يتم العثور على حوالة بهذا الكود" });
      }
      
      // التحقق من أن الحوالة موجهة إلى هذا المكتب
      if (transfer.receiverOfficeId !== receiverId) {
        return res.status(403).json({ message: "هذه الحوالة غير موجهة إلى مكتبك" });
      }
      
      if (transfer.status !== 'pending') {
        return res.status(400).json({ message: "الحوالة تم استلامها مسبقاً أو تم إلغاؤها" });
      }
      
      // إضافة المبلغ + العمولة إلى رصيد المكتب المستلم
      const amount = Number(transfer.amount);
      const commissionForReceiver = Number(transfer.commissionForReceiver);
      const totalToReceive = amount + commissionForReceiver;
      
      const balance = await storage.getUserBalance(receiverId, transfer.currency) || { amount: "0" };
      const newAmount = Number(balance.amount) + totalToReceive;
      
      console.log(`إضافة المبلغ للمستلم: ${Number(balance.amount)} + ${totalToReceive} = ${newAmount}`);
      await storage.setUserBalance(receiverId, transfer.currency, newAmount.toString());
      
      // إضافة عمولة النظام المعلقة مع خصم مكافأة الإحالة
      const systemCommission = Number(transfer.commissionForSystem);
      if (systemCommission > 0) {
        // فحص مكافأة الإحالة وخصمها من عمولة النظام
        const { allocateFixedReferralReward } = await import('./referral-system');
        const operationType = transfer.currency === 'LYD' ? 'transfer_lyd' : 'transfer_usd';
        console.log(`🎁 فحص مكافأة الإحالة للمرسل ${transfer.senderId} في حوالة المدن`);
        
        const referralResult = await allocateFixedReferralReward(
          transfer.id,
          operationType,
          systemCommission,
          transfer.currency,
          transfer.senderId
        );

        // إضافة صافي عمولة النظام (بعد خصم مكافأة الإحالة) إلى حساب العمولات
        const netSystemCommission = referralResult.netSystemCommission;
        if (netSystemCommission > 0) {
          await storage.addCommissionPoolTransaction({
            sourceType: 'user',
            sourceId: transfer.senderId,
            sourceName: `استلام حوالة مدينية`,
            currencyCode: transfer.currency,
            amount: netSystemCommission.toString(),
            transactionType: 'credit',
            relatedTransactionId: transfer.id,
            description: referralResult.hasReferral 
              ? `عمولة النظام (بعد خصم مكافأة إحالة ${referralResult.rewardAmount}) - حوالة مدينية: ${transfer.code}`
              : `عمولة النظام - استلام حوالة مدينية برمز: ${transfer.code}`,
          });
          console.log(`💰 تمت إضافة صافي عمولة النظام ${netSystemCommission} ${transfer.currency} (أصلية: ${systemCommission}, مكافأة إحالة: ${referralResult.rewardAmount})`);
        }
      }
      
      // إنشاء سجل معاملة للإضافة
      await storage.createTransaction({
        userId: receiverId,
        type: "deposit",
        amount: totalToReceive.toString(),
        currency: transfer.currency,
        description: `استلام حوالة مدينية برمز: ${code}`
      });
      
      // تحديث حالة الحوالة إلى "completed"
      await storage.updateCityTransferStatus(transfer.id, "completed");
      
      // إرسال رد النجاح مع تفاصيل الحوالة
      return res.json({
        message: "✅ تم استلام الحوالة بنجاح",
        amount,
        commission: commissionForReceiver,
        total: totalToReceive,
        currency: transfer.currency
      });
      
    } catch (error) {
      console.error("خطأ في استلام الحوالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء محاولة استلام الحوالة" });
    }
  });
  
  // ===== واجهات برمجة التطبيق للتحويل بين المكاتب =====
  
  // إنشاء تحويل بين المكاتب جديد
  app.post("/api/inter-office-transfers", authMiddleware, async (req: AuthRequest, res: Response) => {
    console.log("🌟🌟🌟 POST /api/inter-office-transfers - طلب وصل للخادم!");
    console.log("📋 Headers:", req.headers);
    console.log("🔐 User from authMiddleware:", req.user);
    console.log("🚨 THIS IS THE CORRECT ENDPOINT FOR EXTERNAL TRANSFERS!");
    console.log("📝 Raw request body:", JSON.stringify(req.body, null, 2));
    try {
      console.log("🚀 Inter-office transfer request started!");
      console.log("📝 Request body:", req.body);
      console.log("👤 Current user ID:", req.user.id);
      
      const { receiverName, receiverPhone, amount, receivingOffice, destinationCountry, notes, currency } = req.body;
      
      console.log("Parsed fields:", {
        receiverName,
        receiverPhone,
        amount,
        receivingOffice,
        destinationCountry,
        notes,
        currency
      });
      
      // استخدام العملة المُرسَلة أو الافتراضي LYD
      const transferCurrency = currency || "LYD";
      const transferAmount = parseFloat(amount);
      
      if (!receiverName || !receiverPhone || !amount || !receivingOffice || !destinationCountry) {
        console.log("Missing required fields validation failed");
        return res.status(400).json({ message: "يرجى إدخال جميع الحقول المطلوبة" });
      }
      
      if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ message: "مبلغ التحويل غير صحيح" });
      }
      
      // 🇱🇾 التحقق من قيود التحويل بين المكاتب الليبية (منع الليبي من التحويل لليبي)
      // تحديد الليبية من جنسية المستخدم وليس من مكاتبه
      try {
        const libyanCheckResult = await db.execute(sql`
          SELECT (u.country_id = 1 OR u.country_name = 'ليبيا') AS is_libyan
          FROM users u
          WHERE u.id = ${req.user.id}
        `);
        
        const isCurrentUserLibyan = libyanCheckResult.rows[0]?.is_libyan || false;
        
        // منع التحويل بين المكاتب الليبية مع بعضها البعض
        if (isCurrentUserLibyan && destinationCountry === 'LY') {
          console.log(`🚫 BLOCKED: Libyan user ${req.user.id} attempted LY→LY transfer - policy violation`);
          return res.status(403).json({ 
            message: "التحويل بين المكاتب الليبية غير مسموح. استخدم التحويل المحلي للتحويل داخل ليبيا.", 
            code: "LIBYA_TO_LIBYA_BLOCKED",
            policy: "لا يمكن للمكاتب الليبية استخدام نظام التحويل الدولي للتحويل إلى مكاتب ليبية أخرى"
          });
        }
        
        console.log(`🌍 Transfer validation: User has LY office=${isCurrentUserLibyan}, Destination=${destinationCountry}, Allowed=${!(isCurrentUserLibyan && destinationCountry === 'LY')}`);
      } catch (error) {
        console.error('🚨 Could not verify user country for transfer policy, denying transfer for safety:', error);
        // إعتماد سياسة أمنية صارمة: منع التحويل عند عدم التأكد
        return res.status(403).json({ 
          message: "لا يمكن التحقق من صلاحيات التحويل حالياً. يرجى المحاولة لاحقاً.", 
          code: "COUNTRY_VERIFICATION_FAILED",
          policy: "تم رفض التحويل للأمان عند عدم التمكن من التحقق من بلد المستخدم"
        });
      }
      
      // التحقق من صلاحيات التحويل الخارجي
      const isExternalTransfer = destinationCountry !== 'LY';
      console.log(`🔍🔍🔍 التحقق من نوع التحويل - هذا مهم جداً!`, {
        destinationCountry: destinationCountry,
        isExternal: isExternalTransfer,
        condition: `destinationCountry (${destinationCountry}) !== 'LY' = ${isExternalTransfer}`,
        typeOfDestination: typeof destinationCountry,
        stringComparison: `"${destinationCountry}" !== "LY" = ${destinationCountry !== 'LY'}`
      });
      
      if (isExternalTransfer) {
        console.log("🌍 External transfer detected, checking permissions...");
        
        let limits = null;
        
        // للوكلاء والمدراء: الوصول مباشر بدون قيود
        if (req.user.type === 'agent' || req.user.type === 'admin') {
          console.log('✅ وكيل أو مدير - مسموح بالتحويل الخارجي بدون قيود');
        } else {
          limits = await storage.getUserExternalTransferLimits(req.user.id);
          
          if (!limits || !limits.extTransferEnabled) {
            return res.status(403).json({ 
              message: "التحويل الخارجي غير مفعل لحسابك. يرجى تقديم طلب ترقية من لوحة الطلبات.",
              code: "EXTERNAL_TRANSFER_DISABLED"
            });
          }
          
          // التحقق من العملة المسموحة (للمستخدمين العاديين فقط)
          if (limits.extAllowedCurrencies && !limits.extAllowedCurrencies.includes(transferCurrency)) {
            return res.status(403).json({
              message: `العملة ${transferCurrency} غير مسموحة للتحويل الخارجي`,
              allowedCurrencies: limits.extAllowedCurrencies
            });
          }
          
          // التحقق من الدولة المسموحة (للمستخدمين العاديين فقط)
          if (limits.extAllowedCountries && !limits.extAllowedCountries.includes(destinationCountry)) {
            return res.status(403).json({
              message: `التحويل إلى هذه الدولة غير مسموح`,
              allowedCountries: limits.extAllowedCountries
            });
          }
        }
        
        console.log("External transfer permissions verified successfully");
        
        // التحقق من الحدود اليومية والشهرية (للمستخدمين العاديين فقط)
        if (req.user.type !== 'agent' && req.user.type !== 'admin' && limits) {
          console.log("🔍 بدء التحقق من السقف اليومي...");
          
          // التحقق من الحد اليومي
          const dailyUsed = await storage.getUserDailyTransferAmount(req.user.id, transferCurrency);
          const dailyLimit = parseFloat(limits.extDailyLimit || "0");
          console.log(`🔍 تحقق من السقف اليومي:`, {
            transferAmount,
            dailyUsed,
            dailyLimit,
            totalAfterTransfer: dailyUsed + transferAmount,
            wouldExceed: dailyUsed + transferAmount > dailyLimit
          });
          
          if (dailyUsed + transferAmount > dailyLimit) {
            return res.status(403).json({
            message: `تجاوز الحد اليومي المسموح. 
            
📊 التفاصيل:
• السقف اليومي المسموح: ${dailyLimit} ${transferCurrency}
• المبلغ المُستخدم اليوم: ${dailyUsed.toFixed(2)} ${transferCurrency}
• التحويل الحالي: ${transferAmount} ${transferCurrency}
• المجموع النهائي: ${(dailyUsed + transferAmount).toFixed(2)} ${transferCurrency}

💡 ملاحظة: السقف اليومي هو مجموع كل التحويلات اليومية وليس لكل تحويل منفرد.`,
            dailyLimit,
            dailyUsed,
            currentTransfer: transferAmount,
            totalWouldBe: dailyUsed + transferAmount
          });
          }
          
          // التحقق من الحد الشهري
          const monthlyUsed = await storage.getUserMonthlyTransferAmount(req.user.id, transferCurrency);
          const monthlyLimit = parseFloat(limits.extMonthlyLimit || "0");
          console.log(`🔍 تحقق من السقف الشهري:`, {
            transferAmount,
            monthlyUsed,
            monthlyLimit,
            totalAfterTransfer: monthlyUsed + transferAmount,
            wouldExceed: monthlyUsed + transferAmount > monthlyLimit
          });
          
          if (monthlyUsed + transferAmount > monthlyLimit) {
            return res.status(403).json({
              message: `تجاوز الحد الشهري المسموح. 
              
📊 التفاصيل:
• السقف الشهري المسموح: ${monthlyLimit} ${transferCurrency}
• المبلغ المُستخدم هذا الشهر: ${monthlyUsed.toFixed(2)} ${transferCurrency}
• التحويل الحالي: ${transferAmount} ${transferCurrency}
• المجموع النهائي: ${(monthlyUsed + transferAmount).toFixed(2)} ${transferCurrency}

💡 ملاحظة: السقف الشهري هو مجموع كل التحويلات الشهرية وليس لكل تحويل منفرد.`,
              monthlyLimit,
              monthlyUsed,
              currentTransfer: transferAmount,
              totalWouldBe: monthlyUsed + transferAmount
            });
          }
        } else {
          console.log('✅ وكيل أو مدير - تخطي حدود التحويل اليومية والشهرية');
        }
        
        console.log("External transfer permissions verified successfully");
      }

      // التحقق من عدم التحويل لنفس المستخدم/مكتبه
      if (receivingOffice) {
        const officeId = parseInt(receivingOffice);
        console.log(`==================== SELF-TRANSFER CHECK ====================`);
        console.log(`Checking office transfer: office ID ${officeId}, sender user ID ${req.user.id}`);
        const office = await storage.getAgentOfficeById(officeId);
        console.log("Office details found:", JSON.stringify(office, null, 2));
        
        if (office) {
          console.log(`Comparing: office.agentId (${office.agentId}) === req.user.id (${req.user.id})`);
          if (office.agentId === req.user.id) {
            console.log("BLOCKED: User trying to transfer to their own office");
            console.log(`==================== TRANSFER BLOCKED ====================`);
            return res.status(400).json({ message: "لا يمكن التحويل لمكتبك الخاص" });
          } else {
            console.log("ALLOWED: Different agent office, transfer can proceed");
          }
        } else {
          console.log("WARNING: Office not found!");
        }
        console.log(`==================== END SELF-TRANSFER CHECK ====================`);
      }

      // التحقق من الرصيد في العملة المحددة
      const balance = await storage.getUserBalance(req.user.id, transferCurrency);
      const currentBalance = parseFloat(balance?.amount || "0");
      
      // الحصول على agent ID من office ID أولاً
      const targetOffice = await storage.getAgentOfficeById(parseInt(receivingOffice));
      if (!targetOffice) {
        return res.status(400).json({ message: "المكتب المستلم غير موجود" });
      }

      // حسابات النظام الجديد
      const amountOriginal = transferAmount;
      
      // جلب نسبة عمولة النظام من الإعدادات
      let systemCommissionRate = 0.01; // افتراضي 1%
      let rateType = 'default';
      try {
        const systemRateResult = await db.$client.query(`
          SELECT commission_rate as "commissionRate", per_mille_rate as "perMilleRate", fixed_amount as "fixedAmount"
          FROM system_commission_rates 
          WHERE transfer_type = $1 AND currency = $2 AND is_active = true
          ORDER BY created_at DESC
          LIMIT 1
        `, ['international', transferCurrency]);
        
        if (systemRateResult.rows[0]) {
          const dbRow = systemRateResult.rows[0];
          // إذا كان هناك مبلغ ثابت، استخدمه
          if (dbRow.fixedAmount && parseFloat(dbRow.fixedAmount) > 0) {
            systemCommissionRate = parseFloat(dbRow.fixedAmount);
            rateType = 'fixed';
            console.log(`📊 استخدام مبلغ عمولة النظام الثابت: ${parseFloat(dbRow.fixedAmount).toFixed(2)} ${transferCurrency}`);
          } else if (dbRow.perMilleRate && parseFloat(dbRow.perMilleRate) > 0) {
            systemCommissionRate = parseFloat(dbRow.perMilleRate) / 1000; // تحويل النسبة في الألف إلى عدد عشري
            rateType = 'per_mille';
            console.log(`📊 استخدام نسبة عمولة النظام المحددة: ${parseFloat(dbRow.perMilleRate).toFixed(1)}‰ للعملة ${transferCurrency}`);
            console.log(`📊 النسبة المحسوبة: ${systemCommissionRate} (${parseFloat(dbRow.perMilleRate)}/1000)`);
          } else {
            // وإلا استخدم النسبة المئوية العادية
            systemCommissionRate = parseFloat(dbRow.commissionRate);
            rateType = 'percentage';
            console.log(`📊 استخدام نسبة عمولة النظام المحددة: ${(systemCommissionRate * 100).toFixed(2)}% للعملة ${transferCurrency}`);
          }
        } else {
          console.log(`📊 استخدام نسبة عمولة النظام الافتراضية: ${(systemCommissionRate * 100).toFixed(2)}% للعملة ${transferCurrency}`);
        }
      } catch (error) {
        console.error("خطأ في جلب نسبة عمولة النظام، استخدام النسبة الافتراضية:", error);
      }
      
      let commissionSystem;
      if (rateType === 'fixed') {
        commissionSystem = systemCommissionRate; // المبلغ الثابت
      } else {
        commissionSystem = transferAmount * systemCommissionRate; // النسبة المئوية أو في الألف
      }
      
      console.log(`💰 حساب عمولة النظام:`, {
        transferAmount,
        systemCommissionRate,
        rateType,
        commissionSystem,
        calculation: rateType === 'fixed' 
          ? `مبلغ ثابت: ${systemCommissionRate} ${transferCurrency}`
          : `${transferAmount} × ${systemCommissionRate} = ${commissionSystem}`
      });
      
      // جلب عمولة المكتب المستلم باستخدام نظام الشرائح للتحويل الدولي
      let commissionRecipient = transferAmount * 0.015; // افتراضي 1.5%
      let applicableTier = null; // تعريف المتغير محلياً
      
      try {
        // البحث عن شريحة العمولة المطبقة للتحويل الدولي
        applicableTier = await storage.findApplicableCityCommission(
          parseInt(receivingOffice),
          transferAmount,
          transferCurrency
        );
        
        if (applicableTier) {
          console.log(`🎯 تم العثور على شريحة عمولة مطبقة:`, applicableTier);
          
          if (applicableTier.commission) {
            // عمولة ثابتة
            commissionRecipient = parseFloat(applicableTier.commission);
          } else if (applicableTier.perMilleRate) {
            // نسبة في الألف
            commissionRecipient = transferAmount * (parseFloat(applicableTier.perMilleRate) / 1000);
          }
          
          console.log(`📊 حساب عمولة المكتب من الشريحة:`, {
            tierCommission: applicableTier.commission,
            tierPerMilleRate: applicableTier.perMilleRate,
            calculatedCommission: commissionRecipient,
            amount: transferAmount
          });
        } else {
          console.log(`⚠️ لم توجد شريحة عمولة مطبقة، البحث عن إعدادات عمولة الوكيل...`);
          
          // البحث عن إعدادات العمولة الإدارية للوكيل المالك للمكتب
          const receiverCommissionSettings = await storage.getAgentCommissionByCurrency(targetOffice.agentId, transferCurrency);
          
          console.log(`🔍 البحث عن إعدادات العمولة للوكيل ${targetOffice.agentId} بالعملة ${transferCurrency}:`, receiverCommissionSettings);
        
          if (receiverCommissionSettings) {
            // استخدام إعدادات العمولة الإدارية
            if (receiverCommissionSettings.type === 'percentage') {
              commissionRecipient = transferAmount * (parseFloat(receiverCommissionSettings.value) / 100);
              console.log(`✅ تطبيق عمولة نسبية للوكيل: ${receiverCommissionSettings.value}% من ${transferAmount} = ${commissionRecipient} ${transferCurrency}`);
            } else if (receiverCommissionSettings.type === 'fixed') {
              commissionRecipient = parseFloat(receiverCommissionSettings.value);
              console.log(`✅ تطبيق عمولة ثابتة للوكيل: ${commissionRecipient} ${transferCurrency}`);
            } else {
              commissionRecipient = transferAmount * 0.015; // 1.5% افتراضي
              console.log(`⚠️ نوع عمولة غير مدعوم، استخدام الافتراضي النسبي: ${commissionRecipient} ${transferCurrency} (1.5% من ${transferAmount})`);
            }
          } else {
            // إذا لم توجد إعدادات إدارية، استخدام العمولة الافتراضية 1.5%
            commissionRecipient = transferAmount * 0.015;
            console.log(`⚠️ لم توجد إعدادات عمولة للوكيل ${targetOffice.agentId}، استخدام الافتراضي النسبي: ${commissionRecipient} ${transferCurrency} (1.5% من ${transferAmount})`);
          }
        }
      } catch (error) {
        console.error("خطأ في جلب شريحة العمولة، استخدام النسبة الافتراضية:", error);
      }
      
      // تحديد مصدر العمولة للسجلات
      let commissionSource = 'افتراضي';
      if (applicableTier) {
        commissionSource = 'شريحة عمولة';
      } else {
        const receiverCommissionSettings = await storage.getAgentCommissionByCurrency(targetOffice.agentId, transferCurrency);
        if (receiverCommissionSettings) {
          commissionSource = receiverCommissionSettings.type === 'percentage' ? 'عمولة وكيل نسبية' : 'عمولة وكيل ثابتة';
        }
      }

      console.log(`🏛️ عمولة المكتب المستلم:`, {
        agentId: targetOffice.agentId,
        currency: transferCurrency,
        officeName: targetOffice.officeName,
        calculatedCommission: commissionRecipient,
        amount: transferAmount,
        percentage: ((commissionRecipient / transferAmount) * 100).toFixed(2) + '%',
        source: commissionSource
      });
      
      const amountPending = amountOriginal + commissionRecipient; // المبلغ الذي سيحصل عليه المستلم (أصلي + عمولة المكتب)
      
      // المطلوب خصمه من المرسل (المبلغ الأصلي + عمولة النظام + عمولة المكتب)
      const totalRequired = amountOriginal + commissionSystem + commissionRecipient;
      
      if (currentBalance < totalRequired) {
        return res.status(400).json({ message: "الرصيد غير كافي" });
      }

      // إنشاء كود الاستلام الوحيد
      const receiverCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 أرقام

      // إنشاء التحويل بالنظام الجديد
      const newTransfer = await storage.createAgentTransfer({
        senderId: req.user.id,
        agentId: req.user.id,
        destinationAgentId: targetOffice.agentId,
        recipientName: receiverName,
        recipientPhone: receiverPhone,
        amount: amountOriginal.toString(),
        commission: commissionSystem.toString(),
        currency: transferCurrency,
        transferCode: receiverCode, // استخدام كود الاستلام كمرجع وحيد
        receiverCode,
        note: notes || "",
        status: "pending",
        type: "international",
        country: destinationCountry,
        city: "",
        // حقول النظام الجديد
        amountOriginal: amountOriginal.toString(),
        commissionSystem: commissionSystem.toString(),
        commissionRecipient: commissionRecipient.toString(),
        amountPending: amountPending.toString(),
      });

      // خصم المبلغ الأصلي + جميع العمولات من رصيد المرسل ووضعه في حالة "معلق"
      console.log(`🏦 خصم من رصيد المرسل:`, {
        userId: req.user.id,
        currency: transferCurrency,
        balanceBefore: currentBalance,
        originalAmount: amountOriginal,
        systemCommission: commissionSystem,
        systemCommissionType: rateType,
        systemCommissionRate: rateType === 'per_mille' ? `${(systemCommissionRate * 1000).toFixed(1)}‰` : `${(systemCommissionRate * 100).toFixed(2)}%`,
        officeCommission: commissionRecipient,
        totalDeducted: totalRequired,
        balanceAfter: currentBalance - totalRequired
      });
      await storage.setUserBalance(req.user.id, transferCurrency, (currentBalance - totalRequired).toString());

      // إضافة معاملة للمرسل (خصم فوري)
      await storage.createTransaction({
        userId: req.user.id,
        type: 'inter_office_transfer_pending',
        amount: totalRequired.toString(),
        currency: transferCurrency,
        description: `تحويل بين المكاتب معلق إلى ${receiverName} - رمز الاستلام: ${receiverCode}`
      });

      // ملاحظة: العمولة لا تُضاف للنظام هنا، بل تُضاف فقط عند الاستلام
      console.log(`💰 تم تعليق عمولة النظام (ستُضاف عند الاستلام):`, {
        amount: commissionSystem,
        currency: transferCurrency,
        receiverCode,
        status: 'معلقة حتى الاستلام'
      });

      console.log("Inter-office transfer created successfully:", newTransfer);

      // منح نقاط للمرسل بعد نجاح التحويل بين المكاتب
      try {
        const settings = await rewardsService.getSettings();
        await rewardsService.awardPoints({
          userId: req.user.id,
          points: settings.transferPoints,
          action: 'inter_office_transfer',
          description: `Inter-office transfer: ${transferAmount} ${transferCurrency}`,
          descriptionAr: `تحويل بين المكاتب: ${transferAmount} ${transferCurrency}`,
          referenceId: newTransfer.id.toString(),
          referenceType: 'inter_office_transfer',
        });
        console.log(`✅ تم منح ${settings.transferPoints} نقطة للمرسل ${req.user.id} للتحويل بين المكاتب`);
      } catch (error) {
        console.error('خطأ في منح النقاط للتحويل بين المكاتب:', error);
      }

      // منح مكافأة إحالة ثابتة للمُحيل (النظام الجديد)
      try {
        const operationType = transferCurrency === 'LYD' ? 'transfer_lyd' : 'transfer_usd';
        await referralSystem.allocateFixedReferralReward(
          newTransfer.id,
          operationType,
          commissionSystem,
          transferCurrency,
          req.user.id
        );
        console.log(`✅ تم تطبيق نظام المكافآت الثابتة للتحويل بين المكاتب ${newTransfer.id}`);
      } catch (error) {
        console.error('خطأ في منح مكافأة الإحالة للتحويل بين المكاتب:', error);
      }

      res.status(201).json({
        ...newTransfer,
        receiverCode: newTransfer.receiverCode,
        amountOriginal,
        commissionSystem,
        commissionRecipient,
        amountPending,
        totalRequired,
        message: "تم إنشاء التحويل بين المكاتب بنجاح"
      });
    } catch (error) {
      console.error("خطأ في إنشاء التحويل الدولي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء التحويل" });
    }
  });

  // إلغاء الحوالة الدولية (للمرسل فقط)
  app.post('/api/inter-office-transfers/:transferId/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
    const transferId = parseInt(req.params.transferId);
    const userId = req.user.id;

    try {
      console.log(`🚫 طلب إلغاء التحويل الدولي ${transferId} من المستخدم ${userId}`);
      
      const result = await storage.cancelInternationalTransfer(transferId);
      
      if (result.success) {
        console.log('✅ تم إلغاء التحويل الدولي بنجاح');
        res.json({
          success: true,
          message: "تم إلغاء التحويل بنجاح واستعادة المبلغ",
          transfer: result.transfer
        });
      } else {
        console.log('❌ فشل في إلغاء التحويل:', result.message);
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('💥 خطأ في إلغاء التحويل الدولي:', error);
      res.status(500).json({
        success: false,
        message: "حدث خطأ في إلغاء التحويل"
      });
    }
  });

  // جلب جميع التحويلات بين المكاتب للوكيل
  app.get("/api/inter-office-transfers", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.user;
      
      // التحقق من أن المستخدم وكيل أو مدير أو له صلاحية التحويل الخارجي
      if (type !== "agent" && type !== "admin" && !req.user.extTransferEnabled) {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط لمكاتب الصرافة والإدارة" });
      }
      
      console.log("جلب التحويلات للوكيل:", req.user.id);
      
      const transfers = await storage.getAgentTransfers(req.user.id);
      
      console.log("تم جلب التحويلات بنجاح:", transfers.length);
      
      res.json(transfers);
    } catch (error) {
      console.error("خطأ في جلب التحويلات بين المكاتب:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب التحويلات" });
    }
  });

  // استلام التحويل بين المكاتب
  // جلب تفاصيل حوالة بين المكاتب - للعرض في الواجهة الأمامية
  app.get("/api/inter-office-transfers/:transferCode/details", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { transferCode } = req.params;
      
      if (!transferCode) {
        return res.status(400).json({ message: "رمز التحويل مطلوب" });
      }

      console.log(`🔍 البحث عن تفاصيل الحوالة برمز: ${transferCode}`);
      
      // البحث المباشر في جدول التحويلات
      const result = await pool.query(`
        SELECT 
          at.*,
          sender.full_name as sender_name,
          destination_agent.full_name as destination_agent_name
        FROM agent_transfers at
        LEFT JOIN users sender ON at.sender_id = sender.id
        LEFT JOIN users destination_agent ON at.destination_agent_id = destination_agent.id
        WHERE at.transfer_code = $1
      `, [transferCode]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "لم يتم العثور على الحوالة" });
      }

      const transfer = result.rows[0];

      // التحقق من صلاحية الوصول: فقط المستلم أو المدير
      const currentUserId = req.user.id;
      const currentUserType = req.user.type;
      const destinationAgentId = transfer.destination_agent_id;

      if (currentUserType !== "admin" && currentUserId !== destinationAgentId) {
        console.log(`❌ محاولة وصول غير مصرح بها: المستخدم ${currentUserId} يحاول الوصول لحوالة المستلم ${destinationAgentId}`);
        return res.status(403).json({ 
          message: "هذه الحوالة مخصصة لمستلم آخر" 
        });
      }

      console.log(`✅ وصول مصرح به: المستخدم ${currentUserId} (${currentUserType}) يصل للحوالة`);

      // تحويل البيانات من snake_case إلى camelCase للواجهة الأمامية  
      const amountOriginal = parseFloat(transfer.amount_original || transfer.amount);
      const systemCommission = parseFloat(transfer.commission_system || transfer.commission || '0');
      const recipientCommission = parseFloat(transfer.commission_recipient || '0');
      
      const transferDetails = {
        id: transfer.id,
        transferCode: transfer.transfer_code,
        receiverCode: transfer.receiver_code,
        amountOriginal: amountOriginal,
        systemCommission: systemCommission,
        recipientCommission: recipientCommission,
        recipientCredit: amountOriginal + recipientCommission, // المبلغ الأصلي + عمولة المكتب
        totalDeduction: amountOriginal + systemCommission + recipientCommission, // الإجمالي المخصوم من المرسل
        currency: transfer.currency,
        recipientName: transfer.recipient_name || 'مستلم الحوالة',
        recipientPhone: transfer.recipient_phone || 'غير محدد',
        country: transfer.country || 'غير محدد',
        city: transfer.city || 'غير محدد',
        note: transfer.note || '',
        createdAt: transfer.created_at,
        senderName: transfer.sender_name || 'مرسل الحوالة',
        destinationAgentName: transfer.destination_agent_name || 'وكيل الوجهة',
        status: transfer.status
      };

      console.log(`✅ تم جلب تفاصيل الحوالة:`, transferDetails);

      return res.json(transferDetails);
      
    } catch (error) {
      console.error("❌ خطأ في جلب تفاصيل الحوالة:", error);
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/inter-office-transfers/receive", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.user;
      
      // التحقق من أن المستخدم وكيل أو مدير أو له صلاحية التحويل الخارجي
      if (type !== "agent" && type !== "admin" && !req.user.extTransferEnabled) {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط لمكاتب الصرافة والإدارة" });
      }
      
      const { transferCode } = req.body;
      
      if (!transferCode) {
        return res.status(400).json({ message: "يرجى إدخال رمز الاستلام" });
      }
      
      console.log(`🔍 استلام حوالة برمز: ${transferCode}`);
      
      // البحث عن الحوالة بالرمز
      const result = await pool.query(`
        SELECT at.*, sender.full_name as sender_name, dest_agent.full_name as dest_agent_name
        FROM agent_transfers at
        LEFT JOIN users sender ON at.sender_id = sender.id
        LEFT JOIN users dest_agent ON at.destination_agent_id = dest_agent.id
        WHERE at.transfer_code = $1 
          AND at.status = 'pending'
        LIMIT 1
      `, [transferCode]);
      
      const transfer = result.rows[0];
      
      if (!transfer) {
        return res.status(404).json({ 
          message: "حوالة غير موجودة أو مكتملة بالفعل" 
        });
      }

      // التحقق من صلاحية المستخدم لاستلام الحوالة
      if (transfer.destination_agent_id !== req.user.id) {
        return res.status(403).json({ 
          message: `هذه الحوالة مخصصة لمكتب ${transfer.dest_agent_name} وليس لمكتبك` 
        });
      }
      
      // استلام الحوالة - المبلغ الأصلي + عمولة المكتب
      const originalAmount = parseFloat(transfer.amount_original || transfer.amount);
      const officeCommission = parseFloat(transfer.commission_recipient || "0");
      const amountToReceive = originalAmount + officeCommission;
      
      console.log(`💰 استلام الحوالة - رمز: ${transfer.transfer_code}`);
      console.log(`💴 المبلغ الأصلي: ${originalAmount}`);
      console.log(`💸 عمولة المكتب: ${officeCommission}`);
      console.log(`💰 المبلغ المستلم: ${amountToReceive}`);
      
      // العمليات الحرجة فقط (تحديث الرصيد وحالة التحويل)
      try {
        // إضافة المبلغ لرصيد المستلم
        const currentBalance = await storage.getUserBalance(req.user.id, transfer.currency);
        const currentBalanceNum = parseFloat(currentBalance?.amount || "0");
        const newBalance = currentBalanceNum + amountToReceive;
        
        console.log(`🏦 تحديث الرصيد: ${currentBalanceNum} + ${amountToReceive} = ${newBalance}`);
        await storage.setUserBalance(req.user.id, transfer.currency, newBalance.toString());
        
        // تحديث حالة التحويل
        await pool.query(`
          UPDATE agent_transfers 
          SET status = 'completed', completed_at = NOW() 
          WHERE id = $1
        `, [transfer.id]);
        
        console.log(`✅ تم تحديث الرصيد وحالة الحوالة بنجاح - رمز: ${transfer.transfer_code}`);
      } catch (criticalError) {
        console.error(`❌ خطأ حرج في استلام الحوالة ${transfer.transfer_code}:`, criticalError);
        return res.status(500).json({ message: "حدث خطأ أثناء محاولة استلام الحوالة" });
      }

      // إرسال الاستجابة الناجحة مباشرة
      const response = {
        message: "تم استلام الحوالة بنجاح",
        amount: amountToReceive,
        currency: transfer.currency,
        receiverCode: transfer.transfer_code
      };

      console.log(`✅ إرسال استجابة النجاح - رمز: ${transfer.transfer_code}, المبلغ: ${amountToReceive} ${transfer.currency}`);
      res.json(response);

      // العمليات الثانوية في الخلفية (لا تؤثر على الاستجابة)
      setImmediate(async () => {
        try {
          // إنشاء سجل معاملة للمستلم
          await storage.createTransaction({
            userId: req.user.id,
            type: "inter_office_receive",
            amount: amountToReceive.toString(),
            currency: transfer.currency,
            description: `استلام حوالة بين المكاتب - رمز: ${transfer.transfer_code}`
          });

          // إنشاء سجل معاملة للمرسل لتوضيح أن المعاملة المعلقة اكتملت
          await storage.createTransaction({
            userId: transfer.sender_id,
            type: "inter_office_transfer_completed",
            amount: "0", // لا يؤثر على الرصيد (تم الخصم مسبقاً)
            currency: transfer.currency,
            description: `تم تأكيد استلام الحوالة - رمز: ${transfer.transfer_code}`
          });
          
          console.log(`📝 تم إنشاء سجلات المعاملات للحوالة ${transfer.transfer_code}`);
        } catch (transactionError) {
          console.error(`⚠️ خطأ في إنشاء سجلات المعاملات للحوالة ${transfer.transfer_code}:`, transactionError);
        }
      });

      // معالجة العمولات والمكافآت في خلفية منفصلة (لا تؤثر على الاستجابة)
      setImmediate(async () => {
        try {
          // إضافة العمولة إلى حساب تجميع النظام (مع خصم مكافأة الإحالة إن وجدت)
          const systemCommission = parseFloat(transfer.commission_system || transfer.commission || "0");
          if (systemCommission > 0) {
            // فحص مكافأة الإحالة وخصمها من عمولة النظام
            const { allocateFixedReferralReward } = await import('./referral-system');
            const operationType = transfer.currency === 'LYD' ? 'transfer_lyd' : 'transfer_usd';
            console.log(`🎁 فحص مكافأة الإحالة للمرسل ${transfer.sender_id} في التحويل بين المكاتب`);
            
            const referralResult = await allocateFixedReferralReward(
              transfer.id,
              operationType,
              systemCommission,
              transfer.currency,
              transfer.sender_id // المستخدم المُحال هو المرسل
            );

            // إضافة صافي عمولة النظام (بعد خصم مكافأة الإحالة) إلى حساب العمولات
            const netSystemCommission = referralResult.netSystemCommission;
            if (netSystemCommission > 0) {
              console.log(`💰 إضافة صافي عمولة النظام ${netSystemCommission} ${transfer.currency} (أصلية: ${systemCommission}, مكافأة إحالة: ${referralResult.rewardAmount})`);
              await storage.addToCommissionPool(
                netSystemCommission,
                transfer.currency,
                referralResult.hasReferral 
                  ? `حوالة بين المكاتب (بعد خصم مكافأة إحالة ${referralResult.rewardAmount}) - ${transfer.transfer_code}`
                  : `حوالة بين المكاتب - ${transfer.transfer_code}`
              );
            }
          }

          console.log(`🎯 تم الانتهاء من معالجة العمولات والمكافآت للحوالة ${transfer.transfer_code}`);
        } catch (commissionError) {
          console.error(`⚠️ خطأ في معالجة العمولات للحوالة ${transfer.transfer_code}:`, commissionError);
          // الخطأ في العمولات لا يؤثر على نجاح استلام الحوالة
        }
      });
      
      // لا نحتاج return هنا لأننا أرسلنا الاستجابة بالفعل
      
    } catch (error) {
      console.error("خطأ في استلام التحويل بين المكاتب:", error);
      res.status(500).json({ message: "حدث خطأ أثناء محاولة استلام الحوالة" });
    }
  });

  // إخفاء متعدد للتحويلات بين المكاتب (بدلاً من الحذف الفعلي)
  app.delete("/api/inter-office-transfers/bulk", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      console.log("🎯 وصل طلب إخفاء متعدد - البيانات المستلمة:", req.body);
      
      const { transferIds } = req.body;
      const userId = req.user.id;
      
      console.log(`👤 المستخدم: ${userId}, التحويلات المطلوب إخفاؤها: [${transferIds?.join(', ')}]`);

      if (!transferIds || !Array.isArray(transferIds) || transferIds.length === 0) {
        console.log("❌ خطأ: لا توجد تحويلات محددة");
        return res.status(400).json({ message: "يرجى تحديد التحويلات المراد إخفاؤها" });
      }

      // التحقق من أن جميع التحويلات تخص المستخدم الحالي
      console.log("🔍 التحقق من صحة التحويلات للمستخدم:", userId);
      
      const result = await pool.query(`
        SELECT id, sender_id, destination_agent_id, status
        FROM agent_transfers 
        WHERE id = ANY($1) 
          AND (sender_id = $2 OR destination_agent_id = $2)
      `, [transferIds, userId]);

      console.log("📋 التحويلات الموجودة والصالحة:", result.rows);

      const validTransferIds = result.rows.map((row: any) => row.id);

      if (validTransferIds.length === 0) {
        console.log("❌ لا توجد تحويلات صالحة للإخفاء");
        return res.status(403).json({ message: "لا يمكنك إخفاء هذه التحويلات" });
      }
      
      console.log(`✅ عدد التحويلات الصالحة للإخفاء: ${validTransferIds.length}`);

      let totalHidden = 0;
      
      // إخفاء كل تحويل على حدة
      for (const transferId of validTransferIds) {
        try {
          console.log(`🙈 محاولة إخفاء التحويل رقم ${transferId} للمستخدم ${userId}`);
          
          // إدراج سجل في جدول السجلات المخفية
          const hideResult = await pool.query(`
            INSERT INTO hidden_transfers (user_id, transfer_id) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id, transfer_id) DO NOTHING
            RETURNING id
          `, [userId, transferId]);

          if (hideResult.rows.length > 0) {
            totalHidden++;
            console.log(`✅ تم إخفاء التحويل ${transferId} للمستخدم ${userId}`);
          } else {
            console.log(`ℹ️ التحويل ${transferId} مخفي مسبقاً للمستخدم ${userId}`);
            totalHidden++; // نعتبره مخفي بنجاح حتى لو كان مخفي مسبقاً
          }

        } catch (error) {
          console.error(`خطأ في إخفاء التحويل ${transferId}:`, error);
        }
      }

      console.log(`🙈 تم إخفاء ${totalHidden} تحويل من عرض المستخدم ${userId}`);

      return res.json({ 
        message: "تم إخفاء التحويلات بنجاح",
        deletedCount: totalHidden,
        skippedCount: transferIds.length - totalHidden
      });

    } catch (error) {
      console.error("خطأ في إخفاء التحويلات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء محاولة إخفاء التحويلات" });
    }
  });

  // Legacy handler for international transfers (keeping for compatibility)
  const legacyInternationalTransferHandler = async (req: any, res: any) => {
    const { id: senderId, type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم من نوع مكتب صرافة
      if (type !== "agent") {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط لمكاتب الصرافة" });
      }
      
      const {
        receiverOfficeId,
        receivingCountry,
        amount,
        currency,
        note
      } = req.body;
      
      // التحقق من البيانات المدخلة
      if (!receiverOfficeId || !receivingCountry || !amount || !currency) {
        return res.status(400).json({ message: "يرجى إدخال جميع البيانات المطلوبة" });
      }
      
      // التحقق من وجود المكتب المستلم
      const receiverOffice = await storage.getUser(Number(receiverOfficeId));
      if (!receiverOffice || receiverOffice.type !== "agent") {
        return res.status(404).json({ message: "المكتب المستلم غير موجود" });
      }
      
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: "يرجى إدخال مبلغ صحيح وموجب" });
      }
      
      // الحصول على الدولة المرسلة (يتم تحديدها من المكتب المرسل)
      const sender = await storage.getUser(senderId);
      const sendingCountry = sender?.countryName || "غير محدد"; // استخدام اسم الدولة أو "غير محدد" كبديل
      
      // الحصول على نسبة عمولة النظام من إعدادات النظام
      const systemCommissionSetting = await storage.getAdminSetting("inter_office_transfer_commission");
      const systemCommissionRate = systemCommissionSetting
        ? parseFloat(systemCommissionSetting.value)
        : 0.01; // استخدام 1% كعمولة افتراضية
      
      // الحصول على نسبة عمولة المكتب المستلم من جدول عمولات المكاتب حسب الدول
      const receiverCommission = await storage.getOfficeCommissionByCountry(
        Number(receiverOfficeId),
        receivingCountry
      );
      
      const receiverCommissionRate = receiverCommission
        ? parseFloat(receiverCommission.commissionRate.toString())
        : 0.005; // استخدام 0.5% كعمولة افتراضية
      
      // التحقق من العمولة المخصصة للمدراء
      let commissionForSystem = 0;
      if (req.body.customCommission !== undefined && req.body.customCommission !== "" && sender?.type === 'admin') {
        // المدير يمكنه تحديد عمولة مخصصة
        commissionForSystem = safeParseAmount(req.body.customCommission);
        if (commissionForSystem < 0) {
          return res.status(400).json({ message: "العمولة لا يمكن أن تكون سالبة" });
        }
      } else {
        // حساب العمولة الافتراضية
        commissionForSystem = numAmount * systemCommissionRate;
      }

      // حساب العمولات
      const commissionForReceiver = numAmount * receiverCommissionRate;
      const totalAmount = numAmount + commissionForSystem;
      
      // التحقق من رصيد المرسل
      const senderBalance = await storage.getUserBalance(senderId, currency);
      if (!senderBalance || safeParseAmount(senderBalance.amount) < totalAmount) {
        return res.status(400).json({ message: "رصيدك غير كافٍ لإجراء هذه العملية" });
      }
      
      // إنشاء كود تحقق مكون من 6 أرقام
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // إنشاء الحوالة الدولية
      const transfer = await storage.createInternationalTransfer({
        senderId,
        receiverOfficeId: Number(receiverOfficeId),
        sendingCountry,
        receivingCountry,
        amount: numAmount.toString(),
        currency,
        commissionForReceiver: commissionForReceiver.toString(),
        commissionForSystem: commissionForSystem.toString(),
        code,
        note,
      });
      
      // تحديث رصيد المرسل
      const newSenderAmount = safeParseAmount(senderBalance.amount) - totalAmount;
      console.log(`خصم مبلغ الحوالة الدولية من المرسل: ${safeParseAmount(senderBalance.amount)} - ${totalAmount} = ${newSenderAmount}`);
      await storage.setUserBalance(senderId, currency, newSenderAmount.toString());
      
      // إنشاء سجل للمعاملة
      await storage.createTransaction({
        userId: senderId,
        type: "withdraw",
        amount: totalAmount.toString(),
        currency,
        description: `إرسال حوالة دولية إلى ${receivingCountry}`
      });

      // ملاحظة: عمولة النظام معلقة ولن تدخل في حساب العمولات حتى يتم استلام الحوالة
      // العمولة ستتم إضافتها عند استلام الحوالة في endpoint منفصل
      
      res.status(201).json({
        message: "تم إنشاء الحوالة الدولية بنجاح",
        transferCode: code,
        details: {
          id: transfer.id,
          receiverOffice: receiverOffice.fullName,
          amount: numAmount,
          receivingCountry,
          commissionForReceiver,
          commissionForSystem,
          totalAmount,
          currency
        }
      });
      
    } catch (error) {
      console.error("خطأ في إنشاء الحوالة الدولية:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء الحوالة الدولية" });
    }
  };
  

  


  // API لجلب قائمة مكاتب الصرافة للحوالات بين المدن (داخل ليبيا فقط)
  app.get("/api/agents", authMiddleware, async (req, res) => {
    const userId = (req as AuthRequest).user.id;
    
    try {
      // التحقق من أن المستخدم مصرح له
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه البيانات" });
      }
      
      // جلب المكاتب المحلية (ليبيا فقط) من جدول agent_offices
      const localOffices = await db.select({
        id: agentOffices.agentId,
        fullName: users.fullName,
        city: agentOffices.city,
        commissionRate: users.commissionRate,
        officeCode: agentOffices.officeCode,
        officeName: agentOffices.officeName
      })
      .from(agentOffices)
      .innerJoin(users, eq(agentOffices.agentId, users.id))
      .where(and(
        eq(agentOffices.countryCode, "LY"), // ليبيا فقط
        eq(agentOffices.isActive, true),
        eq(users.type, "agent")
      ));
      
      // استبعاد المستخدم الحالي من القائمة
      const filteredAgents = localOffices.filter(agent => agent.id !== userId);
      res.json(filteredAgents);
      
    } catch (error) {
      console.error("خطأ في جلب قائمة المكاتب المحلية:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب قائمة المكاتب المحلية" });
    }
  });

  // ===== واجهات برمجة التطبيق لإدارة عمولات المكاتب حسب المدن =====
  
  // الحصول على قائمة العمولات الخاصة بمكتب صرافة معين
  app.get("/api/office-commissions", authMiddleware, async (req, res) => {
    const { id, type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم وكيل (مكتب صرافة)
      if (type !== "agent") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه الموارد" });
      }
      
      // جلب العمولات المخصصة للمدن المختلفة
      const result = await db.execute(sql`
        SELECT id, office_id as "officeId", city, commission_rate as "commissionRate"
        FROM office_commissions 
        WHERE office_id = ${id}
        ORDER BY city
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error("خطأ في استعلام عمولات المكتب:", error);
      res.status(500).json({ message: "حدث خطأ في استرجاع عمولات المكتب" });
    }
  });
  
  // API إضافية (طريقة بديلة): تعيين عمولة لمدينة
  app.post('/api/agent/set-commission', authMiddleware, async (req, res) => {
    const { id: officeId, type } = (req as AuthRequest).user;
    const { city, commission_rate } = req.body;
    
    try {
      // التحقق من أن المستخدم وكيل (مكتب صرافة)
      if (type !== "agent") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذا الإجراء" });
      }
      
      // التحقق من البيانات المدخلة
      if (!city || commission_rate === undefined) {
        return res.status(400).json({ message: "الرجاء تحديد المدينة ونسبة العمولة" });
      }
      
      // استخدام الواجهة التي أنشأناها سابقًا
      await storage.createOrUpdateOfficeCommission({
        officeId,
        city,
        commissionRate: commission_rate.toString()
      });
      
      res.json({ message: "✅ تم حفظ نسبة العمولة للمدينة بنجاح" });
    } catch (error) {
      console.error("خطأ في تحديث عمولة المكتب:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث عمولة المكتب" });
    }
  });
  
  // API إضافية: جلب عمولات المكتب بتنسيق مبسط
  app.get('/api/agent/my-commissions', authMiddleware, async (req, res) => {
    const { id: officeId, type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم وكيل (مكتب صرافة)
      if (type !== "agent") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه الموارد" });
      }
      
      // استخدام الوظيفة الموجودة لجلب العمولات
      const commissions = await storage.getOfficeCommissions(officeId);
      
      // تحويل البيانات إلى التنسيق المطلوب
      const formattedCommissions = commissions.map(comm => ({
        city: comm.city,
        commission_rate: comm.commissionRate
      }));
      
      res.json({ commissions: formattedCommissions });
    } catch (error) {
      console.error("خطأ في استعلام عمولات المكتب:", error);
      res.status(500).json({ message: "حدث خطأ في استرجاع عمولات المكتب" });
    }
  });
  
  // إضافة أو تحديث عمولة لمدينة معينة
  app.post("/api/office-commissions", authMiddleware, async (req, res) => {
    const { id, type } = (req as AuthRequest).user;
    const { city, commissionRate } = req.body;
    
    try {
      // التحقق من أن المستخدم وكيل (مكتب صرافة)
      if (type !== "agent") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه الموارد" });
      }
      
      // التحقق من البيانات المدخلة
      if (!city || commissionRate === undefined) {
        return res.status(400).json({ message: "الرجاء تحديد المدينة ونسبة العمولة" });
      }
      
      // التحقق من أن العمولة رقم موجب
      const rate = Number(commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 10) {
        return res.status(400).json({ message: "يجب أن تكون نسبة العمولة رقماً موجباً بين 0 و 10" });
      }
      
      // استخدام SQL مباشر للبساطة
      const checkExisting = await db.execute(sql`
        SELECT id FROM office_commissions 
        WHERE office_id = ${id} AND city = ${city}
      `);
      
      let result;
      if (checkExisting.rows.length > 0) {
        // تحديث الموجود
        result = await db.execute(sql`
          UPDATE office_commissions 
          SET commission_rate = ${rate.toString()}
          WHERE office_id = ${id} AND city = ${city}
          RETURNING *
        `);
      } else {
        // إنشاء جديد
        result = await db.execute(sql`
          INSERT INTO office_commissions (office_id, city, commission_rate)
          VALUES (${id}, ${city}, ${rate.toString()})
          RETURNING *
        `);
      }
      
      res.status(201).json({
        message: "تم تحديث عمولة المكتب بنجاح",
        commission: result.rows[0]
      });
    } catch (error) {
      console.error("خطأ في إضافة/تحديث عمولة المكتب:", error);
      res.status(500).json({ message: "حدث خطأ في إضافة/تحديث عمولة المكتب" });
    }
  });
  
  // حذف عمولة لمدينة معينة
  app.delete("/api/office-commissions/:id", authMiddleware, async (req, res) => {
    const { id, type } = (req as AuthRequest).user;
    const commissionId = parseInt(req.params.id);
    
    try {
      // التحقق من أن المستخدم وكيل (مكتب صرافة)
      if (type !== "agent") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه الموارد" });
      }
      
      // التحقق من أن العمولة تنتمي إلى المكتب وحذفها
      const result = await db.execute(sql`
        DELETE FROM office_commissions 
        WHERE id = ${commissionId} AND office_id = ${id}
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        return res.status(403).json({ message: "لا يمكنك حذف عمولة لا تنتمي إلى مكتبك أو غير موجودة" });
      }
      
      res.status(200).json({ message: "تم حذف العمولة بنجاح" });
    } catch (error) {
      console.error("خطأ في حذف عمولة المكتب:", error);
      res.status(500).json({ message: "حدث خطأ في حذف عمولة المكتب" });
    }
  });
  
  // ===== واجهات برمجة التطبيق لعمولات المكاتب الدولية =====
  
  // إضافة أو تحديث عمولة دولية
  app.post("/api/office-country-commissions", authMiddleware, async (req, res) => {
    const { id, type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مكتب صرافة أو مدير أو لديه صلاحية التحويل
      if (type !== "agent" && type !== "admin" && !req.user.extTransferEnabled) {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط لمكاتب الصرافة" });
      }
      
      const { country, commissionRate } = req.body;
      
      if (!country || !commissionRate) {
        return res.status(400).json({ message: "يرجى إدخال الدولة ونسبة العمولة" });
      }
      
      // إضافة أو تحديث العمولة
      const commission = await storage.createOrUpdateOfficeCountryCommission({
        officeId: id,
        country,
        commissionRate
      });
      
      res.status(201).json({
        message: "تم حفظ عمولة الدولة بنجاح",
        commission
      });
      
    } catch (error) {
      console.error("خطأ في إضافة/تحديث عمولة الدولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حفظ عمولة الدولة" });
    }
  });
  
  // الحصول على عمولات المكتب حسب الدول
  app.get("/api/office-country-commissions", authMiddleware, async (req, res) => {
    const { id, type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مكتب صرافة أو مدير أو لديه صلاحية التحويل
      if (type !== "agent" && type !== "admin" && !req.user.extTransferEnabled) {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط لمكاتب الصرافة" });
      }
      
      // جلب عمولات المكتب حسب الدول
      const commissions = await storage.getOfficeCountryCommissions(id);
      
      res.json(commissions);
      
    } catch (error) {
      console.error("خطأ في جلب عمولات المكتب الدولية:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب عمولات المكتب الدولية" });
    }
  });
  
  // حذف عمولة مكتب حسب الدولة
  app.delete("/api/office-country-commissions/:id", authMiddleware, async (req, res) => {
    const { id, type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مكتب صرافة أو مدير أو لديه صلاحية التحويل
      if (type !== "agent" && type !== "admin" && !req.user.extTransferEnabled) {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط لمكاتب الصرافة" });
      }
      
      const commissionId = parseInt(req.params.id);
      
      if (isNaN(commissionId)) {
        return res.status(400).json({ message: "معرّف العمولة غير صالح" });
      }
      
      // جلب جميع عمولات المكتب الدولية
      const commissions = await storage.getOfficeCountryCommissions(id);
      
      // التحقق من أن العمولة تنتمي إلى المكتب
      const hasPermission = commissions.some(c => c.id === commissionId);
      
      if (!hasPermission) {
        return res.status(403).json({ message: "لا يمكنك حذف عمولة لا تنتمي إلى مكتبك" });
      }
      
      // حذف العمولة
      await storage.deleteOfficeCountryCommission(commissionId);
      
      res.status(200).json({ message: "تم حذف عمولة الدولة بنجاح" });
      
    } catch (error) {
      console.error("خطأ في حذف عمولة الدولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف عمولة الدولة" });
    }
  });
  
  // الحصول على عمولة دولة محددة
  app.get("/api/office-country-commissions/:country", authMiddleware, async (req, res) => {
    const { id, type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مكتب صرافة أو مدير أو لديه صلاحية التحويل
      if (type !== "agent" && type !== "admin" && !req.user.extTransferEnabled) {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط لمكاتب الصرافة" });
      }
      
      const country = req.params.country;
      
      if (!country) {
        return res.status(400).json({ message: "يرجى تحديد الدولة" });
      }
      
      // جلب عمولة الدولة المحددة
      const commission = await storage.getOfficeCommissionByCountry(id, country);
      
      if (!commission) {
        return res.status(404).json({ message: "لم يتم العثور على عمولة لهذه الدولة" });
      }
      
      res.json(commission);
      
    } catch (error) {
      console.error("خطأ في جلب عمولة الدولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب عمولة الدولة" });
    }
  });

  // ===== واجهات برمجة التطبيق لإعدادات النظام =====
  
  // الحصول على إعدادات النظام (للمشرفين فقط)
  app.get("/api/admin-settings", authMiddleware, async (req, res) => {
    const { type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مشرف
      if (type !== "admin") {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط للمشرفين" });
      }
      
      const settings = await storage.getAdminSettings();
      res.json(settings);
      
    } catch (error) {
      console.error("خطأ في جلب إعدادات النظام:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب إعدادات النظام" });
    }
  });
  
  // إضافة أو تحديث إعداد النظام
  app.post("/api/admin-settings", authMiddleware, async (req, res) => {
    const { type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مشرف
      if (type !== "admin") {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط للمشرفين" });
      }
      
      const { key, value, description } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ message: "يرجى إدخال جميع البيانات المطلوبة" });
      }
      
      const setting = await storage.createOrUpdateAdminSetting({
        key,
        value,
        description
      });
      
      res.status(201).json({
        message: "تم حفظ الإعداد بنجاح",
        setting
      });
      
    } catch (error) {
      console.error("خطأ في حفظ إعداد النظام:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حفظ إعداد النظام" });
    }
  });
  
  // حذف إعداد النظام
  app.delete("/api/admin-settings/:key", authMiddleware, async (req, res) => {
    const { type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مشرف
      if (type !== "admin") {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط للمشرفين" });
      }
      
      const key = req.params.key;
      
      if (!key) {
        return res.status(400).json({ message: "يرجى تحديد مفتاح الإعداد" });
      }
      
      await storage.deleteAdminSetting(key);
      
      res.json({ message: "تم حذف الإعداد بنجاح" });
      
    } catch (error) {
      console.error("خطأ في حذف إعداد النظام:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف إعداد النظام" });
    }
  });
  
  // ===== واجهات برمجة التطبيق للوحة تحكم الإدارة =====
  
  // تسجيل routes نظام المعاملات الموحد للأدمن
  registerAdminTransactionRoutes(app, authMiddleware, storage);

  // جلب سجلات التحويلات الداخلية للمدير
  app.get("/api/admin/internal-transfer-logs", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const user = await storage.getUser(userId);
      
      // التحقق من أن المستخدم مدير
      if (user?.type !== 'admin') {
        return res.status(403).json({ 
          message: "غير مصرح لك بعرض سجلات التحويلات الداخلية"
        });
      }

      // معاملات البحث والترشيح
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const search = req.query.search as string;
      const currency = req.query.currency as string;
      const status = req.query.status as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      // بناء شروط البحث
      const conditions = [];
      
      if (search) {
        conditions.push(
          or(
            like(internalTransferLogs.senderName, `%${search}%`),
            like(internalTransferLogs.receiverName, `%${search}%`),
            like(internalTransferLogs.senderAccountNumber, `%${search}%`),
            like(internalTransferLogs.receiverAccountNumber, `%${search}%`)
          )
        );
      }
      
      if (currency) {
        conditions.push(eq(internalTransferLogs.currency, currency));
      }
      
      if (status) {
        conditions.push(eq(internalTransferLogs.status, status));
      }
      
      if (dateFrom) {
        conditions.push(sql`${internalTransferLogs.createdAt} >= ${dateFrom}::timestamp`);
      }
      
      if (dateTo) {
        conditions.push(sql`${internalTransferLogs.createdAt} <= ${dateTo}::timestamp`);
      }

      // جلب السجلات مع الترشيح
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const logs = await db
        .select()
        .from(internalTransferLogs)
        .where(whereClause)
        .orderBy(desc(internalTransferLogs.createdAt))
        .limit(limit)
        .offset(offset);

      // جلب العدد الإجمالي للسجلات
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(internalTransferLogs)
        .where(whereClause);
      
      const totalCount = totalCountResult[0]?.count || 0;
      
      // حساب الإحصائيات
      const statsQuery = await db
        .select({
          totalAmount: sql<string>`COALESCE(SUM(CAST(${internalTransferLogs.amount} AS DECIMAL)), 0)`,
          totalCommission: sql<string>`COALESCE(SUM(CAST(${internalTransferLogs.commission} AS DECIMAL)), 0)`,
          totalTransfers: sql<number>`COUNT(*)`
        })
        .from(internalTransferLogs)
        .where(whereClause);
      
      const stats = statsQuery[0] || { totalAmount: '0', totalCommission: '0', totalTransfers: 0 };

      res.json({
        logs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        },
        statistics: {
          totalAmount: stats.totalAmount,
          totalCommission: stats.totalCommission,
          totalTransfers: stats.totalTransfers
        }
      });
      
    } catch (error) {
      console.error("خطأ في جلب سجلات التحويلات الداخلية:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء جلب سجلات التحويلات الداخلية",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // جلب تفاصيل تحويل داخلي محدد
  app.get("/api/admin/internal-transfer-logs/:id", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const user = await storage.getUser(userId);
      
      // التحقق من أن المستخدم مدير
      if (user?.type !== 'admin') {
        return res.status(403).json({ 
          message: "غير مصرح لك بعرض تفاصيل التحويلات الداخلية"
        });
      }

      const logId = parseInt(req.params.id);
      
      if (isNaN(logId)) {
        return res.status(400).json({ message: "معرف السجل غير صحيح" });
      }

      // جلب تفاصيل السجل مع معلومات التحويل الأصلي
      const logWithTransfer = await db
        .select({
          // بيانات السجل
          id: internalTransferLogs.id,
          transferId: internalTransferLogs.transferId,
          senderName: internalTransferLogs.senderName,
          senderAccountNumber: internalTransferLogs.senderAccountNumber,
          receiverName: internalTransferLogs.receiverName,
          receiverAccountNumber: internalTransferLogs.receiverAccountNumber,
          amount: internalTransferLogs.amount,
          commission: internalTransferLogs.commission,
          currency: internalTransferLogs.currency,
          note: internalTransferLogs.note,
          status: internalTransferLogs.status,
          ipAddress: internalTransferLogs.ipAddress,
          userAgent: internalTransferLogs.userAgent,
          createdAt: internalTransferLogs.createdAt,
          // بيانات التحويل الأصلي
          originalTransferNote: transfers.note,
          originalTransferCreatedAt: transfers.createdAt
        })
        .from(internalTransferLogs)
        .leftJoin(transfers, eq(internalTransferLogs.transferId, transfers.id))
        .where(eq(internalTransferLogs.id, logId))
        .limit(1);

      if (logWithTransfer.length === 0) {
        return res.status(404).json({ message: "سجل التحويل غير موجود" });
      }

      res.json(logWithTransfer[0]);
      
    } catch (error) {
      console.error("خطأ في جلب تفاصيل سجل التحويل:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء جلب تفاصيل سجل التحويل",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // جلب سجل الحوالات الداخلية للمشرف
  app.get("/api/admin/internal-transfers", authMiddleware, async (req, res) => {
    const { type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مشرف
      if (type !== "admin") {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط للمشرفين" });
      }
      
      // بيانات اختبار للحوالات الداخلية
      const mockTransfers = [
        {
          id: 1,
          amount: "500",
          commission: "5",
          currency: "LYD",
          sender_name: "محمد علي",
          receiver_name: "أحمد محمود",
          status: "completed",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          amount: "1200",
          commission: "12",
          currency: "USD",
          sender_name: "سالم خالد",
          receiver_name: "محمد أحمد",
          status: "completed",
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          amount: "300",
          commission: "3",
          currency: "EUR",
          sender_name: "علي سالم",
          receiver_name: "عمر إبراهيم",
          status: "completed",
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      
      res.json(mockTransfers);
      
    } catch (error) {
      console.error("خطأ في جلب سجل الحوالات الداخلية:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب سجل الحوالات الداخلية" });
    }
  });
  
  // جلب جميع التحويلات للمشرف (داخلية + مدينية + دولية)
  app.get("/api/admin/all-transfers", authMiddleware, async (req, res) => {
    const { type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مشرف
      if (type !== "admin") {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط للمشرفين" });
      }
      
      const allTransfers = [];

      // جلب التحويلات الداخلية مع أسماء المستخدمين
      const internalTransfersQuery = `
        SELECT 
          t.id,
          t.sender_id as senderId,
          t.receiver_id as receiverId,
          t.amount,
          t.commission,
          t.currency,
          t.reference_number as referenceNumber,
          t.created_at as createdAt,
          sender.full_name as senderName,
          receiver.full_name as receiverName
        FROM transfers t
        LEFT JOIN users sender ON t.sender_id = sender.id
        LEFT JOIN users receiver ON t.receiver_id = receiver.id
        ORDER BY t.created_at DESC
      `;
      
      const internalTransfersFromDb = await db.execute(sql.raw(internalTransfersQuery));

      // تنسيق التحويلات الداخلية
      for (const transfer of internalTransfersFromDb.rows) {
        allTransfers.push({
          id: transfer.id,
          type: 'internal',
          senderId: transfer.senderid,
          senderName: transfer.sendername || 'غير معروف',
          receiverId: transfer.receiverid,
          receiverName: transfer.receivername || 'غير معروف',
          amount: transfer.amount,
          commission: transfer.commission,
          currency: transfer.currency,
          referenceNumber: transfer.referencenumber,
          status: 'completed', // التحويلات الداخلية دائماً مكتملة
          createdAt: transfer.createdat
        });
      }

      // جلب الحوالات المدينية
      const cityTransfersFromDb = await db
        .select({
          id: cityTransfers.id,
          senderId: cityTransfers.senderId,
          receiverOfficeId: cityTransfers.receiverOfficeId,
          recipientName: cityTransfers.recipientName,
          amount: cityTransfers.amount,
          commission: cityTransfers.commissionForReceiver,
          currency: cityTransfers.currency,
          status: cityTransfers.status,
          verificationCode: cityTransfers.code,
          createdAt: cityTransfers.createdAt,
          completedAt: cityTransfers.completedAt
        })
        .from(cityTransfers)
        .orderBy(desc(cityTransfers.createdAt));

      // جلب أسماء المرسلين للحوالات المدينية
      const citySenderIds = cityTransfersFromDb.map(ct => ct.senderId);
      const citySenders = citySenderIds.length > 0 ? await db
        .select({
          id: users.id,
          fullName: users.fullName
        })
        .from(users)
        .where(inArray(users.id, citySenderIds)) : [];

      // جلب أسماء المكاتب للحوالات المدينية
      const cityOfficeIds = cityTransfersFromDb.map(ct => ct.receiverOfficeId);
      const cityOffices = cityOfficeIds.length > 0 ? await db
        .select({
          id: users.id,
          fullName: users.fullName
        })
        .from(users)
        .where(inArray(users.id, cityOfficeIds)) : [];

      // تنسيق الحوالات المدينية
      for (const transfer of cityTransfersFromDb) {
        const sender = citySenders.find(s => s.id === transfer.senderId);
        const receiverOffice = cityOffices.find(o => o.id === transfer.receiverOfficeId);

        allTransfers.push({
          id: transfer.id,
          type: 'city',
          senderId: transfer.senderId,
          senderName: sender?.fullName || 'غير معروف',
          receiverOfficeId: transfer.receiverOfficeId,
          receiverOfficeName: receiverOffice?.fullName || 'غير معروف',
          recipientName: transfer.recipientName,
          amount: transfer.amount,
          commission: transfer.commission,
          currency: transfer.currency,
          status: transfer.status,
          verificationCode: transfer.verificationCode,
          createdAt: transfer.createdAt,
          completedAt: transfer.completedAt
        });
      }

      // جلب الحوالات الدولية (مُعطّل مؤقتاً لاختبار باقي التحويلات)
      // const internationalTransfersFromDb = await db
      //   .select()
      //   .from(internationalTransfers)
      //   .orderBy(desc(internationalTransfers.createdAt));

      // ترتيب جميع التحويلات حسب التاريخ
      allTransfers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(allTransfers);
      
    } catch (error) {
      console.error("خطأ في جلب جميع التحويلات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب جميع التحويلات" });
    }
  });

  // جلب سجل الحوالات المدينية للمشرف (للتوافق مع النظام الحالي)
  app.get("/api/admin/city-transfers", authMiddleware, async (req, res) => {
    const { type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مشرف
      if (type !== "admin") {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط للمشرفين" });
      }
      
      // جلب الحوالات من قاعدة البيانات
      const cityTransfersFromDb = await db
        .select({
          id: cityTransfers.id,
          senderId: cityTransfers.senderId,
          receiverOfficeId: cityTransfers.receiverOfficeId,
          recipientName: cityTransfers.recipientName,
          amount: cityTransfers.amount,
          commission: cityTransfers.commissionForReceiver,
          currency: cityTransfers.currency,
          status: cityTransfers.status,
          verificationCode: cityTransfers.code,
          createdAt: cityTransfers.createdAt,
          completedAt: cityTransfers.completedAt
        })
        .from(cityTransfers)
        .orderBy(desc(cityTransfers.createdAt));

      // جلب أسماء المرسلين
      const senderIds = cityTransfersFromDb.map(ct => ct.senderId);
      const senders = senderIds.length > 0 ? await db
        .select({
          id: users.id,
          fullName: users.fullName
        })
        .from(users)
        .where(inArray(users.id, senderIds)) : [];

      // جلب أسماء المكاتب المستلمة
      const receiverOfficeIds = cityTransfersFromDb.map(ct => ct.receiverOfficeId);
      const receiverOffices = receiverOfficeIds.length > 0 ? await db
        .select({
          id: agentOffices.id,
          officeName: agentOffices.officeName
        })
        .from(agentOffices)
        .where(inArray(agentOffices.id, receiverOfficeIds)) : [];

      // دمج البيانات
      const result = cityTransfersFromDb.map(transfer => {
        const sender = senders.find(s => s.id === transfer.senderId);
        const receiverOffice = receiverOffices.find(ro => ro.id === transfer.receiverOfficeId);

        return {
          id: transfer.id,
          senderId: transfer.senderId,
          senderName: sender?.fullName || 'غير معروف',
          receiverOfficeId: transfer.receiverOfficeId,
          receiverOfficeName: receiverOffice?.officeName || 'غير معروف',
          recipientName: transfer.recipientName,
          amount: transfer.amount,
          commission: transfer.commission,
          currency: transfer.currency,
          status: transfer.status,
          verificationCode: transfer.verificationCode,
          createdAt: transfer.createdAt,
          completedAt: transfer.completedAt
        };
      });
      
      res.json(result);
      
    } catch (error) {
      console.error("خطأ في جلب سجل الحوالات المدينية:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب سجل الحوالات المدينية" });
    }
  });
  
  // جلب سجل التحويل بين المكاتب للمشرف
  app.get("/api/admin/inter-office-transfers", authMiddleware, async (req, res) => {
    const { type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مشرف
      if (type !== "admin") {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط للمشرفين" });
      }
      
      // بيانات اختبار للحوالات الدولية
      const mockInternationalTransfers = [
        {
          id: 1,
          amount: "5000",
          currency: "USD",
          sender_name: "مكتب الأمانة للصرافة",
          receiver_name: "مكتب اسطنبول للصرافة",
          status: "completed",
          commission_for_receiver: "50",
          commission_for_system: "25",
          sending_country: "غير محدد",
          receiving_country: "تركيا",
          code: "INT123456",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          amount: "3000",
          currency: "EUR",
          sender_name: "مكتب النور للصرافة",
          receiver_name: "مكتب القاهرة للصرافة",
          status: "pending",
          commission_for_receiver: "30",
          commission_for_system: "15",
          sending_country: "غير محدد",
          receiving_country: "مصر",
          code: "INT654321",
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          amount: "7000",
          currency: "USD",
          sender_name: "مكتب الشرق للصرافة",
          receiver_name: "مكتب دبي للصرافة",
          status: "completed",
          commission_for_receiver: "70",
          commission_for_system: "35",
          sending_country: "غير محدد",
          receiving_country: "الإمارات",
          code: "INT789012",
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      
      res.json(mockInternationalTransfers);
      
    } catch (error) {
      console.error("خطأ في جلب سجل التحويل بين المكاتب:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب سجل التحويل بين المكاتب" });
    }
  });
  
  // جلب إحصائيات الحوالات للمشرف
  app.get("/api/admin/transfers-stats", authMiddleware, async (req, res) => {
    const { type } = (req as AuthRequest).user;
    
    try {
      // التحقق من أن المستخدم مشرف
      if (type !== "admin") {
        return res.status(403).json({ message: "هذه الخدمة متاحة فقط للمشرفين" });
      }
      
      // إحصائيات الحوالات الداخلية باستخدام استعلام SQL مباشر من خلال drizzle
      const [internalStats] = (await db.sql`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_amount,
          COALESCE(SUM(CAST(commission AS DECIMAL)), 0) as total_commission
        FROM transfers
      `).map(row => ({
        count: Number(row.count) || 0,
        totalAmount: String(row.total_amount) || '0',
        totalCommission: String(row.total_commission) || '0'
      }));
      
      // إحصائيات الحوالات المدينية
      const [cityStats] = (await db.sql`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_amount,
          COALESCE(SUM(CAST(commission_for_system AS DECIMAL)), 0) as total_system_commission,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
        FROM city_transfers
      `).map(row => ({
        count: Number(row.count) || 0,
        totalAmount: String(row.total_amount) || '0',
        totalSystemCommission: String(row.total_system_commission) || '0',
        completedCount: Number(row.completed_count) || 0,
        pendingCount: Number(row.pending_count) || 0
      }));
      
      // إحصائيات التحويل بين المكاتب
      const [internationalStats] = (await db.sql`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_amount,
          COALESCE(SUM(CAST(commission_for_system AS DECIMAL)), 0) as total_system_commission,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
        FROM inter_office_transfers
      `).map(row => ({
        count: Number(row.count) || 0,
        totalAmount: String(row.total_amount) || '0',
        totalSystemCommission: String(row.total_system_commission) || '0',
        completedCount: Number(row.completed_count) || 0,
        pendingCount: Number(row.pending_count) || 0
      }));
      
      // المكاتب الأكثر نشاطاً
      const topAgents = (await db.sql`
        SELECT 
          u.id,
          u.full_name as full_name,
          u.city,
          (
            SELECT COUNT(*) FROM city_transfers WHERE sender_id = u.id
          ) + (
            SELECT COUNT(*) FROM inter_office_transfers WHERE sender_id = u.id
          ) as transfer_count
        FROM users u
        WHERE u.type = 'agent'
        ORDER BY transfer_count DESC
        LIMIT 5
      `).map(row => ({
        id: Number(row.id),
        fullName: String(row.full_name),
        city: String(row.city),
        transferCount: Number(row.transfer_count) || 0
      }));
      
      // إحصائيات العملات
      const currencyStats = (await db.sql`
        SELECT 
          currency,
          COUNT(*) as count,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_amount
        FROM transfers
        GROUP BY currency
        ORDER BY total_amount DESC
      `).map(row => ({
        currency: String(row.currency),
        count: Number(row.count) || 0,
        totalAmount: String(row.total_amount) || '0'
      }));
      
      res.json({
        internalStats,
        cityStats,
        internationalStats,
        topAgents,
        currencyStats
      });
      
    } catch (error) {
      console.error("خطأ في جلب إحصائيات الحوالات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب إحصائيات الحوالات" });
    }
  });
  
  // ===== واجهة برمجة التطبيق لجلب سجل أنشطة المستخدمين =====
  
  // الحصول على سجل الأنشطة لمستخدم معين
  app.get("/api/admin/users/:userId/activities", async (req, res) => {
    try {
      // التحقق من التوكن يدوياً
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "غير مصرح به" });
      }
      
      const token = authHeader.split(' ')[1];
      const JWT_SECRET = getJwtSecret();
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; type: string };
        
        // التحقق من صلاحيات المسؤول
        if (decoded.type !== 'admin') {
          console.log("رفض الوصول: المستخدم ليس مسؤولاً", decoded);
          return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
        }
        
        const { userId } = req.params;
        
        // جلب معاملات المستخدم من قاعدة البيانات
        const transactions = await storage.getUserTransactions(parseInt(userId));
        console.log("تم جلب المعاملات:", transactions.length);
        
        // جلب تحويلات المستخدم المرسلة والمستلمة
        const transfers = await storage.getUserTransfers(parseInt(userId));
        console.log("تم جلب التحويلات:", transfers.length);
        
        // تنسيق البيانات كمصفوفة أنشطة
        const formattedTransactions = transactions.map(tx => ({
          type: 'transaction',
          date: tx.date || tx.createdAt || new Date(),
          data: tx
        }));
        
        const formattedTransfers = transfers.map(transfer => ({
          type: 'transfer',
          date: transfer.createdAt || new Date(),
          data: transfer
        }));
        
        // دمج وترتيب الأنشطة
        const activities = [...formattedTransactions, ...formattedTransfers]
          .sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date || new Date());
            const dateB = b.date instanceof Date ? b.date : new Date(b.date || new Date());
            return dateB.getTime() - dateA.getTime(); // ترتيب تنازلي (الأحدث أولاً)
          });
        
        return res.status(200).json({ activities });
      } catch (jwtError) {
        console.error("خطأ في التحقق من التوكن:", jwtError);
        return res.status(401).json({ message: "توكن غير صالح" });
      }
    } catch (error) {
      console.error("خطأ في جلب سجل الأنشطة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب سجل الأنشطة" });
    }
  });

  // ===== واجهة برمجة التطبيق لإدارة طلبات توثيق الحسابات =====
  
  // الحصول على طلب التوثيق الخاص بالمستخدم الحالي
  app.get("/api/verification-requests/my", authMiddleware, async (req, res) => {
    try {
      const { id: userId } = (req as AuthRequest).user;
      const request = await storage.getUserVerificationRequest(userId);
      
      if (!request) {
        return res.status(404).json({ message: "لم يتم العثور على طلب توثيق" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("خطأ في جلب طلب التوثيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب طلب التوثيق" });
    }
  });

  // إرسال طلب توثيق حساب مع ملفات
  app.post("/api/user/verify-account", authMiddleware, upload.fields([
    { name: 'id_photo', maxCount: 1 },
    { name: 'proof_of_address', maxCount: 1 }
  ]), handleUploadErrors, async (req, res) => {
    try {
      const { id: userId } = (req as AuthRequest).user;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // التحقق من توفر الملفات
      if (!files.id_photo || !files.proof_of_address) {
        return res.status(400).json({ 
          message: "يجب توفير صورة الهوية وإثبات العنوان" 
        });
      }
      
      // التحقق من وجود طلب توثيق سابق للمستخدم
      const existingRequest = await storage.getUserVerificationRequest(userId);
      if (existingRequest) {
        // السماح بطلب جديد فقط إذا كان الطلب السابق مرفوضاً
        if (existingRequest.status === "pending") {
          return res.status(400).json({ 
            message: "لديك طلب توثيق قيد المراجعة بالفعل، انتظر الرد من الإدارة",
            request: existingRequest
          });
        } else if (existingRequest.status === "approved") {
          return res.status(400).json({ 
            message: "حسابك موثق بالفعل",
            request: existingRequest
          });
        }
        // إذا كان مرفوض، السماح بإرسال طلب جديد (لا نفعل شيء)
      }
      
      // استخراج مسارات الملفات
      const idPhotoUrl = `/uploads/verification/id/${files.id_photo[0].filename}`;
      const proofOfAddressUrl = `/uploads/verification/address/${files.proof_of_address[0].filename}`;
      
      // إنشاء طلب توثيق جديد
      const request = await storage.createVerificationRequest({
        userId,
        idPhotoUrl,
        proofOfAddressUrl
      });
      
      res.status(201).json({
        message: "تم إرسال طلب التوثيق بنجاح وسيتم مراجعته من قبل الإدارة",
        request
      });
      
    } catch (error) {
      console.error("خطأ في إنشاء طلب التوثيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء طلب التوثيق" });
    }
  });
  
  // الطريقة القديمة باستخدام Base64 (للتوافق مع الواجهة السابقة)
  app.post("/api/verification-requests", authMiddleware, async (req, res) => {
    try {
      const { id: userId } = (req as AuthRequest).user;
      const { idPhotoUrl, proofOfAddressUrl } = req.body;
      
      // التحقق من البيانات المطلوبة
      if (!idPhotoUrl || !proofOfAddressUrl) {
        return res.status(400).json({ 
          message: "يجب توفير صورة الهوية وإثبات العنوان" 
        });
      }
      
      // التحقق من وجود طلب توثيق سابق للمستخدم
      const existingRequest = await storage.getUserVerificationRequest(userId);
      if (existingRequest) {
        // السماح بطلب جديد فقط إذا كان الطلب السابق مرفوضاً
        if (existingRequest.status === "pending") {
          return res.status(400).json({ 
            message: "لديك طلب توثيق قيد المراجعة بالفعل، انتظر الرد من الإدارة",
            request: existingRequest
          });
        } else if (existingRequest.status === "approved") {
          return res.status(400).json({ 
            message: "حسابك موثق بالفعل",
            request: existingRequest
          });
        }
        // إذا كان مرفوض، السماح بإرسال طلب جديد (لا نفعل شيء)
      }
      
      // إنشاء طلب توثيق جديد
      const request = await storage.createVerificationRequest({
        userId,
        idPhotoUrl,
        proofOfAddressUrl
      });
      
      res.status(201).json({
        message: "تم إرسال طلب التوثيق بنجاح وسيتم مراجعته من قبل الإدارة",
        request
      });
      
    } catch (error) {
      console.error("خطأ في إنشاء طلب التوثيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء طلب التوثيق" });
    }
  });
  
  // الحصول على معلومات طلب التوثيق الخاص بالمستخدم
  app.get("/api/verification-requests/my", authMiddleware, async (req, res) => {
    try {
      const { id: userId } = (req as AuthRequest).user;
      
      const request = await storage.getUserVerificationRequest(userId);
      
      if (!request) {
        return res.status(404).json({ message: "لم تقم بتقديم طلب توثيق بعد" });
      }
      
      res.json(request);
      
    } catch (error) {
      console.error("خطأ في الحصول على طلب التوثيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب طلب التوثيق" });
    }
  });
  
  // الحصول على جميع طلبات التوثيق (للإدارة فقط) - نقطة وصول قديمة
  app.get("/api/verification-requests", authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه البيانات" });
      }
      
      const status = req.query.status as string | undefined;
      const requests = await storage.getAllVerificationRequests(status);
      
      res.json(requests);
      
    } catch (error) {
      console.error("خطأ في الحصول على طلبات التوثيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب طلبات التوثيق" });
    }
  });
  
  // الحصول على جميع طلبات التوثيق (للإدارة فقط) - نقطة وصول جديدة لواجهة الإدارة
  app.get("/api/admin/verification-requests", authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه البيانات" });
      }
      
      const status = req.query.status as string | undefined;
      const requests = await storage.getAllVerificationRequests(status);
      
      res.json(requests);
      
    } catch (error) {
      console.error("خطأ في الحصول على طلبات التوثيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب طلبات التوثيق" });
    }
  });
  
  // الموافقة أو رفض طلب توثيق (للإدارة فقط)
  app.post("/api/verification-requests/:id/status", authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتغيير حالة طلبات التوثيق" });
      }
      
      const requestId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      // التحقق من صحة البيانات
      if (!requestId || !status || (status !== "approved" && status !== "rejected")) {
        return res.status(400).json({ message: "بيانات غير صالحة" });
      }
    
    } catch (error) {
      console.error("خطأ في تحديث حالة طلب التوثيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة طلب التوثيق" });
    }
  });
  
  // جلب بيانات المستخدم الحالي
  app.get("/api/user", authMiddleware, async (req, res) => {
    // منع الcache بشكل قوي
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': Math.random().toString()
    });
    
    try {
      const { id } = (req as AuthRequest).user;
      
      console.log(`🔍 [${new Date().toISOString()}] Checking permissions for user ${id}`);
      
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`❌ User ${id} not found`);
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      console.log(`👤 User found: ${user.fullName}, type: ${user.type}`);
      
      // التحقق من طلبات الترقية المقبولة للوكلاء
      let hasExternalTransferAccess = false;
      let hasAgentAccess = false;
      
      if (user.type === 'agent') {
        // التحقق من وجود طلب ترقية خارجية مقبول (وكيل دولي)
        const externalTransferRequest = await db.query.upgradeRequests.findFirst({
          where: and(
            eq(upgradeRequests.userId, id),
            eq(upgradeRequests.type, "external_transfer"),
            eq(upgradeRequests.status, "approved")
          )
        });
        hasExternalTransferAccess = !!externalTransferRequest;
        console.log(`📡 External transfer request found:`, externalTransferRequest);
        console.log(`🌍 hasExternalTransferAccess: ${hasExternalTransferAccess}`);
        
        // التحقق من وجود طلب ترقية وكيل عادي مقبول
        const agentRequest = await db.query.upgradeRequests.findFirst({
          where: and(
            eq(upgradeRequests.userId, id),
            eq(upgradeRequests.type, "agent_upgrade"),
            eq(upgradeRequests.status, "approved")
          )
        });
        hasAgentAccess = !!agentRequest;
        console.log(`🏢 Agent request found:`, agentRequest);
        console.log(`🔵 hasAgentAccess: ${hasAgentAccess}`);
      }
      
      // إرسال البيانات مع إخفاء كلمة المرور
      const { password, ...userWithoutPassword } = user;
      
      // منع cache-ing البيانات
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json({
        ...userWithoutPassword,
        hasExternalTransferAccess,
        hasAgentAccess
      });
      
    } catch (error) {
      console.error("خطأ في جلب بيانات المستخدم:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات المستخدم" });
    }
  });

  // جلب جلسات تسجيل الدخول للمستخدم الحالي
  app.get("/api/user/login-sessions", authMiddleware, async (req, res) => {
    try {
      const { id: userId, email } = (req as AuthRequest).user;
      
      console.log(`🔍 جلب جلسات تسجيل الدخول للمستخدم: ${email} (${userId})`);
      
      // جلب السجلات الأمنية للمستخدم من قاعدة البيانات
      const securityLogs = await storage.getSecurityLogs({
        userId: userId,
        email: email,
        limit: 50, // آخر 50 محاولة تسجيل دخول
        offset: 0
      });
      
      // تنسيق البيانات لعرض جلسات تسجيل الدخول
      const loginSessions = securityLogs
        .filter(log => log.eventType === 'LOGIN' || log.eventType === 'FAILED_LOGIN')
        .map(log => ({
          id: log.id,
          timestamp: log.createdAt,
          success: log.eventType === 'LOGIN',
          ipAddress: log.ipAddress || 'غير معروف',
          location: {
            city: log.city || 'غير معروف',
            country: log.country || 'غير معروف'
          },
          device: {
            userAgent: log.userAgent || 'غير معروف',
            platform: log.platform || 'غير معروف',
            fingerprint: log.fingerprint?.substring(0, 8) + '...' || 'غير معروف'
          },
          // تحديد ما إذا كانت هذه هي الجلسة الحالية
          isCurrent: false // سيتم تحديث هذا لاحقاً
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // إضافة معلومات إضافية
      const response = {
        sessions: loginSessions,
        totalCount: loginSessions.length,
        successfulLogins: loginSessions.filter(s => s.success).length,
        failedAttempts: loginSessions.filter(s => !s.success).length,
        lastLogin: loginSessions.find(s => s.success)?.timestamp || null
      };
      
      console.log(`📊 تم جلب ${loginSessions.length} جلسة تسجيل دخول للمستخدم ${email}`);
      
      res.json(response);
      
    } catch (error) {
      console.error("خطأ في جلب جلسات تسجيل الدخول:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء جلب جلسات تسجيل الدخول",
        sessions: [],
        totalCount: 0,
        successfulLogins: 0,
        failedAttempts: 0,
        lastLogin: null
      });
    }
  });

  // جلب قائمة المستخدمين (للإدارة فقط)
  app.get("/api/admin/users", authMiddleware, requirePermission('users'), async (req, res) => {
    try {
      
      // استخدام Drizzle لجلب بيانات المستخدمين بطريقة آمنة
      const allUsers = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          type: users.type,
          adminLevel: users.adminLevel,
          // الصلاحيات التفصيلية
          canManageUsers: users.canManageUsers,
          canManageMarket: users.canManageMarket,
          canManageChat: users.canManageChat,
          canManageInternalTransfers: users.canManageInternalTransfers,
          canManageExternalTransfers: users.canManageExternalTransfers,
          canManageNewAccounts: users.canManageNewAccounts,
          canManageSecurity: users.canManageSecurity,
          canManageSupport: users.canManageSupport,
          canManageReports: users.canManageReports,
          canManageSettings: users.canManageSettings,
          active: users.active,
          verified: users.verified,
          city: users.city,
          extTransferEnabled: users.extTransferEnabled,
          extDailyLimit: users.extDailyLimit,
          extMonthlyLimit: users.extMonthlyLimit,
          extAllowedCountries: users.extAllowedCountries,
          extAllowedCurrencies: users.extAllowedCurrencies,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
      
      // جلب الأرصدة وصلاحيات التحويل الخارجي لكل مستخدم
      const usersWithBalances = await Promise.all(
        allUsers.map(async (user) => {
          const balances = await storage.getUserBalances(user.id);
          
          // حساب الصلاحيات بناءً على النظام الجديد
          const hasAgentAccess = user.type === "agent" || user.type === "office";
          const hasExternalTransferAccess = hasAgentAccess && (user.extTransferEnabled === true);
          
          return {
            ...user,
            hasExternalTransferAccess,
            hasAgentAccess,
            balances: balances.reduce((acc, balance) => {
              acc[balance.currency] = balance.amount;
              return acc;
            }, {} as Record<string, string>)
          };
        })
      );
      
      res.json({
        users: usersWithBalances
      });
      
    } catch (error) {
      console.error("خطأ في جلب قائمة المستخدمين:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب قائمة المستخدمين" });
    }
  });
  
  // ===========================================
  // 🛡️ SUPER ADMIN PROTECTION SYSTEM - USER STATUS TOGGLE
  // ===========================================
  // تعطيل/تفعيل حساب مستخدم (للإدارة فقط) - مع حماية السوبر أدمن
  app.post("/api/admin/users/:id/toggle-status", authMiddleware, requirePermission('users'), async (req, res) => {
    try {
      const adminUser = (req as AuthRequest).user;
      const { type } = adminUser;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const userId = parseInt(req.params.id);
      
      // نجلب معلومات المستخدم لنعرف حالته الحالية
      const targetUser = await storage.getUser(userId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // 🛡️ SUPER ADMIN PROTECTION: منع تعطيل السوبر أدمن نهائياً
      if (security.isSuperAdmin(targetUser.email)) {
        console.log(`🚨 SUPER ADMIN PROTECTION: محاولة تعطيل السوبر أدمن ${targetUser.email} من قبل ${adminUser.email} - تم المنع!`);
        return res.status(403).json({ 
          message: "لا يمكن تعطيل المدير المسؤول الأساسي - هذا الحساب محمي بشكل دائم ولا يمكن تعطيله", 
          error: "SUPER_ADMIN_PROTECTION_ACTIVATED" 
        });
      }
      
      // التحقق من صلاحية المدير لتغيير حالة المستخدم المستهدف
      if (!security.canRestrictUser(targetUser.email, adminUser.email)) {
        return res.status(403).json({ 
          message: "غير مصرح لك بتغيير حالة هذا المستخدم",
          error: "INSUFFICIENT_PERMISSIONS"
        });
      }
      
      // نقوم بعكس حالة المستخدم الحالية
      const newStatus = !targetUser.active;
      
      console.log(`تغيير حالة المستخدم ${targetUser.fullName} (${userId}) من ${targetUser.active ? 'مفعّل' : 'معطّل'} إلى ${newStatus ? 'مفعّل' : 'معطّل'}`);
      
      // تنفيذ الاستعلام المباشر لتحديث حالة المستخدم
      const result = await db.$client.query(`
        UPDATE users 
        SET active = $1 
        WHERE id = $2
        RETURNING *
      `, [newStatus, userId]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "لم يتم العثور على المستخدم" });
      }
      
      // إرسال إشعار للمستخدم بتغيير حالة الحساب
      await storage.createUserNotification({
        userId: userId,
        title: newStatus ? "تم تفعيل حسابك" : "تم تعطيل حسابك",
        body: newStatus ? "تم تفعيل حسابك من قبل الإدارة، يمكنك الآن استخدام جميع خدمات النظام" : "تم تعطيل حسابك من قبل الإدارة، يرجى التواصل مع الدعم الفني",
        type: newStatus ? "success" : "error",
        isRead: false
      });
      
      // إرسال الاستجابة
      res.status(200).json({
        message: newStatus ? "تم تفعيل حساب المستخدم بنجاح" : "تم تعطيل حساب المستخدم بنجاح",
        user: result.rows[0]
      });
      
    } catch (error) {
      console.error("خطأ في تحديث حالة المستخدم:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة المستخدم" });
    }
  });
  
  // رفع سقف التحويل الخارجي للوكلاء (للإدارة فقط)
  app.post("/api/admin/users/:id/raise-external-transfer-limit", authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const userId = parseInt(req.params.id);
      const { 
        extDailyLimit, 
        extMonthlyLimit, 
        extAllowedCurrencies
      } = req.body;
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // التحقق من أن المستخدم وكيل
      if (user.type !== "agent") {
        return res.status(400).json({ message: "يمكن رفع سقف التحويل الخارجي للوكلاء فقط" });
      }
      
      // تحديث إعدادات التحويل الخارجي
      const updatedSettings = await storage.updateUserExternalTransferSettings(userId, {
        extTransferEnabled: true, // تفعيل التحويل الخارجي تلقائياً
        extDailyLimit: extDailyLimit?.toString(),
        extMonthlyLimit: extMonthlyLimit?.toString(),
        extAllowedCurrencies: extAllowedCurrencies || ['USD']
      });
      
      // إرسال إشعار للوكيل
      await storage.createUserNotification({
        userId: userId,
        title: "تم رفع سقف التحويل الخارجي",
        body: `تم رفع سقف التحويل الخارجي الخاص بك. الحد اليومي: ${extDailyLimit || 'غير محدد'}، الحد الشهري: ${extMonthlyLimit || 'غير محدد'}`,
        type: "success",
        isRead: false
      });
      
      console.log(`✅ تم رفع سقف التحويل الخارجي للوكيل ${user.fullName} (${userId})`);
      
      res.status(200).json({
        message: "تم رفع سقف التحويل الخارجي بنجاح",
        settings: updatedSettings
      });
      
    } catch (error) {
      console.error("خطأ في رفع سقف التحويل الخارجي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء رفع سقف التحويل الخارجي" });
    }
  });
  
  // ===========================================
  // 🛡️ SUPER ADMIN PROTECTION SYSTEM - USER DELETE
  // ===========================================
  // حذف حساب مستخدم (للإدارة فقط) - مع حماية السوبر أدمن
  app.delete("/api/admin/users/:id", authMiddleware, requirePermission('users'), async (req, res) => {
    try {
      const adminUser = (req as AuthRequest).user;
      const { type } = adminUser;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const userId = parseInt(req.params.id);
      
      // التحقق من وجود المستخدم
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // 🛡️ SUPER ADMIN PROTECTION: منع حذف السوبر أدمن نهائياً
      if (security.isSuperAdmin(targetUser.email)) {
        console.log(`🚨 SUPER ADMIN PROTECTION: محاولة حذف السوبر أدمن ${targetUser.email} من قبل ${adminUser.email} - تم المنع!`);
        return res.status(403).json({ 
          message: "لا يمكن حذف المدير المسؤول الأساسي - هذا الحساب محمي بشكل دائم", 
          error: "SUPER_ADMIN_PROTECTION_ACTIVATED" 
        });
      }
      
      // التحقق من صلاحية المدير لحذف المستخدم المستهدف
      if (!security.canDeleteUser(targetUser.email, adminUser.email)) {
        return res.status(403).json({ 
          message: "غير مصرح لك بحذف هذا المستخدم",
          error: "INSUFFICIENT_PERMISSIONS"
        });
      }
      
      console.log(`✅ تم تأكيد الصلاحية: ${adminUser.email} يستطيع حذف ${targetUser.email}`);
      
      // حذف البيانات المرتبطة باستخدام transaction واحد لضمان الاتساق
      console.log(`🚀 بدء حذف المستخدم ${userId} باستخدام transaction آمن...`);
      
      // استخدام transaction لضمان الاتساق وتجنب race conditions
      await db.transaction(async (tx) => {
        // 1. حذف إعجابات وقراءات رسائل الدردشة العامة
        console.log("🔄 حذف إعجابات وقراءات رسائل الدردشة العامة...");
        await tx.execute(sql`DELETE FROM message_likes WHERE message_id IN (SELECT id FROM chat_messages WHERE sender_id = ${userId})`);
        await tx.execute(sql`DELETE FROM chat_message_reads WHERE message_id IN (SELECT id FROM chat_messages WHERE sender_id = ${userId})`);
        await tx.execute(sql`DELETE FROM chat_message_reads WHERE user_id = ${userId}`);
        
        // 2. حذف إعجابات وقراءات رسائل المجموعات
        console.log("🔄 حذف إعجابات وقراءات رسائل المجموعات...");
        await tx.execute(sql`DELETE FROM message_likes WHERE message_id IN (SELECT id FROM group_messages WHERE sender_id = ${userId})`);
        await tx.execute(sql`DELETE FROM group_message_reads WHERE message_id IN (SELECT id FROM group_messages WHERE sender_id = ${userId})`);
        await tx.execute(sql`DELETE FROM group_message_reads WHERE user_id = ${userId}`);
        
        // 3. حذف إعجابات وقراءات الرسائل الخاصة
        console.log("🔄 حذف إعجابات وقراءات الرسائل الخاصة...");
        await tx.execute(sql`DELETE FROM message_likes WHERE message_id IN (SELECT id FROM private_messages WHERE sender_id = ${userId})`);
        await tx.execute(sql`DELETE FROM private_message_reads WHERE message_id IN (SELECT id FROM private_messages WHERE sender_id = ${userId})`);
        await tx.execute(sql`DELETE FROM private_message_reads WHERE user_id = ${userId}`);
        
        // 4. حذف إعجابات وقراءات رسائل المحادثات الخاصة (المرسلة والمستقبلة)
        console.log("🔄 حذف إعجابات وقراءات رسائل المحادثات الخاصة...");
        await tx.execute(sql`
          DELETE FROM message_likes 
          WHERE message_id IN (
            SELECT pm.id FROM private_messages pm 
            JOIN private_chats pc ON pm.chat_id = pc.id 
            WHERE pc.user1_id = ${userId} OR pc.user2_id = ${userId}
          )
        `);
        await tx.execute(sql`
          DELETE FROM private_message_reads 
          WHERE message_id IN (
            SELECT pm.id FROM private_messages pm 
            JOIN private_chats pc ON pm.chat_id = pc.id 
            WHERE pc.user1_id = ${userId} OR pc.user2_id = ${userId}
          )
        `);
        
        // 5. حذف إعجابات المستخدم على جميع الرسائل الأخرى
        console.log("🔄 حذف إعجابات المستخدم على الرسائل الأخرى...");
        await tx.execute(sql`DELETE FROM message_likes WHERE user_id = ${userId}`);
        
        console.log("✅ تم حذف جميع الإعجابات والقراءات بنجاح - داخل transaction");
        
        // 6. الآن حذف الرسائل بأمان
        console.log("🔄 حذف الرسائل...");
        await tx.execute(sql`DELETE FROM chat_messages WHERE sender_id = ${userId}`);
        await tx.execute(sql`
          DELETE FROM private_messages 
          WHERE sender_id = ${userId} 
          OR chat_id IN (
            SELECT id FROM private_chats 
            WHERE user1_id = ${userId} OR user2_id = ${userId}
          )
        `);
        await tx.execute(sql`DELETE FROM group_messages WHERE sender_id = ${userId}`);
        
        // 7. حذف المحادثات الخاصة
        console.log("🔄 حذف المحادثات الخاصة...");
        await tx.execute(sql`DELETE FROM private_chats WHERE user1_id = ${userId} OR user2_id = ${userId}`);
        
        // 8. حذف البيانات الأخرى (بناءً على أسماء الأعمدة الحقيقية من قاعدة البيانات)
        console.log("🔄 حذف باقي البيانات المرتبطة...");
        await tx.execute(sql`DELETE FROM upgrade_requests WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM agent_transfers WHERE sender_id = ${userId} OR receiver_id = ${userId} OR agent_id = ${userId} OR destination_agent_id = ${userId}`);
        await tx.execute(sql`DELETE FROM international_transfers WHERE agent_id = ${userId}`);
        await tx.execute(sql`DELETE FROM transfers WHERE sender_id = ${userId} OR receiver_id = ${userId}`);
        await tx.execute(sql`DELETE FROM transactions WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM balances WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM agent_commissions WHERE agent_id = ${userId}`);
        await tx.execute(sql`DELETE FROM push_subscriptions WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM user_notifications WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM agent_offices WHERE agent_id = ${userId}`);
        await tx.execute(sql`DELETE FROM hidden_transfers WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM user_settings WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM user_receive_settings WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM user_points WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM points_history WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM user_rewards WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM user_badges WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM referral_balances WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM group_members WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM market_offers WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM market_bids WHERE user_id = ${userId}`);
        await tx.execute(sql`DELETE FROM city_transfers WHERE sender_id = ${userId}`);
        await tx.execute(sql`DELETE FROM international_transfers_new WHERE sender_agent_id = ${userId}`);
        
        // 9. أخيراً حذف المستخدم نفسه
        console.log("🔄 حذف المستخدم نفسه...");
        await tx.delete(users).where(eq(users.id, userId));
        
        console.log("🎉 تم إكمال جميع عمليات الحذف بنجاح داخل transaction واحد");
      }); // إنهاء الـ transaction
      
      console.log(`✅ تم حذف المستخدم ${userId} بنجاح مع جميع البيانات المرتبطة`);
      
      res.json({
        message: "تم حذف حساب المستخدم بنجاح"
      });
      
    } catch (error) {
      console.error("خطأ في حذف حساب المستخدم:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف حساب المستخدم" });
    }
  });

  
  // تحديث بيانات مستخدم (للإدارة فقط)
  app.put("/api/admin/users/:id", authMiddleware, requirePermission('users'), async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const userId = parseInt(req.params.id);
      const { fullName, email, phone, city, type: userType } = req.body;
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // تحديث بيانات المستخدم
      const updatedUser = await storage.updateUser(userId, {
        fullName: fullName || user.fullName,
        email: email || user.email,
        phone: phone || user.phone,
        city: city || user.city,
        type: userType || user.type
      });
      
      // إضافة إشعار للمستخدم بالتحديث
      await storage.createUserNotification({
        userId: userId,
        title: "تحديث بيانات الحساب",
        body: "تم تحديث بيانات حسابك بواسطة المسؤول",
        type: "info",
        isRead: false
      });
      
      res.json({
        message: "تم تحديث بيانات المستخدم بنجاح",
        user: updatedUser
      });
      
    } catch (error) {
      console.error("خطأ في تحديث بيانات المستخدم:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث بيانات المستخدم" });
    }
  });
  
  // إرسال إشعار لمستخدم بواسطة معرفه (للإدارة فقط)
  app.post("/api/admin/users/:id/notify", authMiddleware, requirePermission('users'), async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const userId = parseInt(req.params.id);
      const { message, subject } = req.body;
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      console.log("إرسال إشعار للمستخدم:", {
        userId: userId,
        userName: user.fullName,
        userEmail: user.email,
        phone: user.phone
      });
      
      // إنشاء إشعار للمستخدم
      const notification = await storage.createUserNotification({
        userId: userId,
        title: subject,
        body: message,
        type: "info",
        isRead: false
      });
      
      console.log("تم إنشاء الإشعار:", notification);
      
      // إرسال الاستجابة بنجاح
      res.json({
        message: "تم إرسال الإشعار بنجاح",
        notification
      });
    } catch (error) {
      console.error("خطأ في إرسال الإشعار:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إرسال الإشعار" });
    }
  });
  
  // إرسال إشعار لمستخدم بواسطة رقم الحساب (للإدارة فقط)
  app.post("/api/admin/notify-by-account", authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const { account_number, message, subject } = req.body;
      
      if (!account_number || !message || !subject) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة: رقم الحساب، الموضوع، الرسالة" });
      }
      
      // البحث عن المستخدم برقم الحساب
      const user = await storage.getUserByPhoneOrId(account_number);
      
      if (!user) {
        return res.status(404).json({ message: "لم يتم العثور على مستخدم بهذا الرقم" });
      }
      
      console.log("إرسال إشعار للمستخدم بواسطة رقم الحساب:", {
        accountNumber: account_number,
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email
      });
      
      // إنشاء الإشعار للمستخدم
      const notification = await storage.createUserNotification({
        userId: user.id,
        title: subject,
        body: message,
        type: "info",
        isRead: false
      });
      
      // تسجيل نجاح إنشاء الإشعار في السجلات
      console.log(`✅ تم إنشاء إشعار برقم ${notification.id} للمستخدم ${user.fullName} (${user.id}) برقم حساب ${account_number}`);
      
      // إرسال الاستجابة بنجاح
      return res.status(200).json({
        message: `تم إرسال الإشعار بنجاح إلى ${user.fullName}`,
        notification,
        success: true
      });
      
    } catch (error) {
      console.error("خطأ في إرسال الإشعار:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إرسال الإشعار" });
    }
  });
  
  // جلب سجل الأنشطة لمستخدم معين (للإدارة فقط)
  app.get("/api/admin/users/:id/activities", authMiddleware, async (req, res) => {
    // تعطيل cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    try {
      console.log(`🎯🎯🎯 بدء معالجة طلب activities للمستخدم ${req.params.id}`);
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه البيانات" });
      }
      
      const userId = parseInt(req.params.id);
      console.log(`🔍 معالجة activities للمستخدم ID: ${userId}`);
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // جلب المعاملات والتحويلات
      console.log(`📊 جلب المعاملات والتحويلات للمستخدم ${userId}...`);
      const transactions = await storage.getUserTransactions(userId);
      const transfers = await storage.getUserTransfers(userId);
      
      console.log(`تم جلب المعاملات: ${transactions.length}`);
      console.log(`تم جلب التحويلات: ${transfers.length}`);
      
      // إثراء بيانات التحويلات بأسماء المرسل والمستقبل
      console.log(`🔍 تحسين بيانات ${transfers.length} تحويلات...`);
      
      const enrichedTransfers = await Promise.all(
        transfers.map(async (transfer) => {
          console.log(`🔍 معالجة تحويل ${transfer.id} - المرسل ID: ${transfer.senderId}, المستقبل ID: ${transfer.receiverId}`);
          
          const senderUser = await storage.getUser(transfer.senderId);
          const receiverUser = await storage.getUser(transfer.receiverId);
          
          console.log(`📧 إثراء تحويل ${transfer.id}:`);
          console.log(`   - المرسل: ${senderUser?.fullName} (${senderUser?.accountNumber})`);
          console.log(`   - المستقبل: ${receiverUser?.fullName} (${receiverUser?.accountNumber})`);
          
          const enrichedTransfer = {
            ...transfer,
            senderName: senderUser?.fullName || `المستخدم ${transfer.senderId}`,
            receiverName: receiverUser?.fullName || `المستخدم ${transfer.receiverId}`,
            senderAccountNumber: senderUser?.accountNumber || null,
            receiverAccountNumber: receiverUser?.accountNumber || null
          };
          
          console.log(`✅ تحويل ${transfer.id} محسن بنجاح`);
          return enrichedTransfer;
        })
      );
      
      console.log(`🎉 تم تحسين ${enrichedTransfers.length} تحويلات بنجاح`);
      
      // جمع الأنشطة وترتيبها حسب التاريخ
      const activities = [
        ...transactions.map(t => ({
          type: "transaction",
          data: t,
          createdAt: t.createdAt
        })),
        ...enrichedTransfers.map(t => ({
          type: "transfer",
          data: t,
          createdAt: t.createdAt
        }))
      ].sort((a, b) => 
        new Date(b.createdAt || new Date()).getTime() - 
        new Date(a.createdAt || new Date()).getTime()
      );
      
      res.json({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email
        },
        activities
      });
      
    } catch (error) {
      console.error("خطأ في جلب سجل الأنشطة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب سجل الأنشطة" });
    }
  });

  // شحن رصيد مستخدم (للإدارة فقط)
  app.post("/api/admin/topup", authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const { account_number, currency, amount } = req.body;
      
      // التحقق من صحة البيانات
      if (!account_number || !currency || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: "بيانات غير صالحة" });
      }
      
      // البحث عن المستخدم برقم الحساب
      const user = await storage.getUserByPhoneOrId(account_number);
      
      if (!user) {
        return res.status(404).json({ message: "لم يتم العثور على مستخدم بهذا الرقم" });
      }
      
      // إيداع المبلغ في حساب المستخدم
      // 1. إنشاء معاملة جديدة
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: "deposit",
        amount: Number(amount),
        currency,
        description: "إيداع بواسطة الإدارة",
        createdAt: new Date()
      });
      
      // 2. تحديث رصيد المستخدم بطريقة مختلفة - استخدام raw SQL لضمان الدقة
      let balance;
      
      // نستخدم استعلام SQL مباشر لتحديث الرصيد بدقة ونتأكد من إضافة المبلغ الجديد إلى الرصيد الحالي
      console.log(`بدء عملية تحديث رصيد المستخدم ${user.id} بمبلغ ${amount} ${currency}`);
      
      // تحويل المبلغ المضاف إلى رقم للتأكد من صحة العملية الحسابية
      const numericAmount = parseFloat(amount);
      
      const result = await db.$client.query(`
        INSERT INTO balances (user_id, currency, amount)
        VALUES ($1, $2, $3::numeric)
        ON CONFLICT (user_id, currency) DO UPDATE
        SET amount = (COALESCE(balances.amount, '0')::numeric + $3::numeric)
        RETURNING *;
      `, [user.id, currency, numericAmount]);
      
      balance = result.rows[0];
      
      // تسجيل النتيجة للتأكد من صحة العملية
      console.log(`تم تحديث الرصيد بنجاح: ${JSON.stringify(balance)}`);
      
      
      // 3. إنشاء إشعار للمستخدم بعملية الشحن
      await storage.createUserNotification({
        userId: user.id,
        title: "تم شحن رصيدك",
        body: `تم إضافة ${amount} ${currency} إلى رصيدك بواسطة الإدارة`,
        type: "success",
        isRead: false
      });
      
      // إرسال استجابة نجاح
      res.status(200).json({
        message: `✅ تم شحن ${amount} ${currency} لحساب ${user.fullName} بنجاح.`,
        transaction,
        balance
      });
      
    } catch (error) {
      console.error("خطأ في شحن رصيد المستخدم:", error);
      res.status(500).json({ message: "حدث خطأ أثناء شحن رصيد المستخدم" });
    }
  });
  
  // سحب رصيد من مستخدم (للإدارة فقط)
  app.post("/api/admin/withdraw", authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const { user_id, currency, amount } = req.body;
      
      // التحقق من صحة البيانات
      if (!user_id || !currency || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة: user_id, amount, currency" });
      }
      
      // البحث عن المستخدم برقم المعرف
      const user = await storage.getUser(Number(user_id));
      
      if (!user) {
        return res.status(404).json({ message: "لم يتم العثور على المستخدم" });
      }
      
      // التحقق من كفاية الرصيد
      const userBalance = await storage.getUserBalance(user.id, currency);
      
      if (!userBalance || parseFloat(userBalance.amount) < parseFloat(amount)) {
        return res.status(400).json({ message: "الرصيد غير كافٍ لإجراء عملية السحب" });
      }
      
      // سحب المبلغ من حساب المستخدم
      // 1. إنشاء معاملة جديدة
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: "withdraw",
        amount: Number(amount),
        currency,
        description: "سحب بواسطة الإدارة",
        createdAt: new Date()
      });
      
      // 2. تحديث رصيد المستخدم بطريقة مباشرة للسحب من الرصيد
      // نحصل أولاً على الرصيد الحالي مرة أخرى (للتأكد)
      let balance;
      const existingBalance = await storage.getUserBalance(user.id, currency);
      
      if (existingBalance) {
        // إذا كان هناك رصيد موجود، نقوم بتحديثه مباشرة
        const currentAmount = parseFloat(existingBalance.amount);
        const amountToSubtract = parseFloat(amount);
        const newAmount = (currentAmount - amountToSubtract).toString();
        
        console.log(`تحديث الرصيد: الرصيد الحالي ${existingBalance.amount} - السحب ${amount} = ${newAmount}`);
        
        // تحويل المبلغ المسحوب إلى رقم للتأكد من صحة العملية الحسابية
        const numericAmount = parseFloat(amount);
        
        // استخدام استعلام SQL مباشر لتحديث الرصيد بدقة
        const result = await db.$client.query(`
          UPDATE balances 
          SET amount = (COALESCE(balances.amount, '0')::numeric - $3::numeric)
          WHERE user_id = $1 AND currency = $2
          RETURNING *;
        `, [user.id, currency, numericAmount]);
        
        balance = result.rows[0];
        
        // تسجيل النتيجة للتأكد من صحة العملية
        console.log(`تم تحديث الرصيد بعد السحب بنجاح: ${JSON.stringify(balance)}`);
      } else {
        // هذه الحالة غير متوقعة لأننا تحققنا من وجود رصيد كافي مسبقًا
        console.error("خطأ: لا يوجد رصيد للسحب منه!");
        return res.status(400).json({ message: "لا يوجد رصيد للسحب منه" });
      }
      
      // 3. إنشاء إشعار للمستخدم بعملية السحب
      await storage.createUserNotification({
        userId: user.id,
        title: "تم سحب رصيد من حسابك",
        body: `تم سحب ${amount} ${currency} من رصيدك بواسطة الإدارة`,
        type: "error",
        isRead: false
      });
      
      // إرسال استجابة نجاح
      res.status(200).json({
        message: `✅ تم سحب ${amount} ${currency} من حساب ${user.fullName} بنجاح.`,
        transaction,
        balance
      });
      
    } catch (error) {
      console.error("خطأ في سحب رصيد المستخدم:", error);
      res.status(500).json({ message: "حدث خطأ أثناء سحب رصيد المستخدم" });
    }
  });

  // الموافقة أو رفض طلب توثيق (للإدارة فقط) - نقطة وصول جديدة
  app.post("/api/admin/verification-requests/:id/status", authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتغيير حالة طلبات التوثيق" });
      }
      
      const requestId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      // التحقق من صحة البيانات
      if (!requestId || !status || (status !== "approved" && status !== "rejected")) {
        return res.status(400).json({ message: "بيانات غير صالحة" });
      }
      
      // تحديث حالة الطلب
      const updatedRequest = await storage.updateVerificationRequestStatus(requestId, status, notes);
      
      // إذا تمت الموافقة على الطلب، قم بتحديث حالة توثيق المستخدم
      if (status === "approved") {
        try {
          const verificationRequest = await storage.getUserVerificationRequestById(requestId);
          if (verificationRequest) {
            // تحديث حالة التوثيق للمستخدم
            await db.update(users)
              .set({ verified: true })
              .where(eq(users.id, verificationRequest.userId));
          }
        } catch (error) {
          console.error("خطأ في تحديث حالة توثيق المستخدم:", error);
          // لا نريد إيقاف العملية هنا، فقط تسجيل الخطأ
        }
      }
      
      // إرسال رد للمستخدم
      res.json({
        message: status === "approved" 
          ? "تمت الموافقة على طلب التوثيق بنجاح" 
          : "تم رفض طلب التوثيق",
        request: updatedRequest
      });
    } catch (error) {
      console.error("خطأ في تحديث حالة طلب التوثيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة طلب التوثيق" });
    }
  });
  
  // ====== نظام إشعارات المستخدمين ======
  
  // الحصول على إشعارات المستخدم
  app.get("/api/notifications", authMiddleware, async (req, res) => {
    try {
      const { id } = (req as AuthRequest).user;
      
      // استخدام استعلام SQL مباشر - يستخدم الطريقة المباشرة للحصول على الإشعارات
      const result = await db.$client.query(`
        SELECT id, user_id as "userId", title, body, type, is_read as "isRead", created_at as "createdAt"
        FROM user_notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [id]);
      
      const notifications = result.rows;
      
      res.json(notifications);
      
    } catch (error) {
      console.error("خطأ في جلب الإشعارات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب إشعارات المستخدم" });
    }
  });
  
  // تعليم إشعار كمقروء
  app.post("/api/notifications/:id/read", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "معرف الإشعار غير صحيح" });
      }
      
      // التحقق من أن الإشعار ينتمي للمستخدم الحالي
      const notifications = await storage.getUserNotifications(userId);
      const notification = notifications.find(n => n.id === notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "الإشعار غير موجود" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      
      res.json(updatedNotification);
      
    } catch (error) {
      console.error("خطأ في تعليم الإشعار كمقروء:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تعليم الإشعار كمقروء" });
    }
  });
  
  // تعليم جميع الإشعارات كمقروءة
  app.post("/api/notifications/read-all", authMiddleware, async (req, res) => {
    try {
      const { id } = (req as AuthRequest).user;
      
      await storage.markAllUserNotificationsAsRead(id);
      
      res.json({ message: "تم تعليم جميع الإشعارات كمقروءة" });
      
    } catch (error) {
      console.error("خطأ في تعليم جميع الإشعارات كمقروءة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تعليم جميع الإشعارات كمقروءة" });
    }
  });
  
  // إضافة إشعار للمستخدم (للمسؤول فقط)
  app.post("/api/admin/notifications", authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بإضافة إشعارات للمستخدمين" });
      }
      
      const { userId, title, body, notificationType } = req.body;
      
      if (!userId || !title) {
        return res.status(400).json({ message: "معرف المستخدم وعنوان الإشعار مطلوبان" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      const notification = await storage.createUserNotification({
        userId,
        title,
        body,
        type: notificationType || "info",
        isRead: false
      });
      
      res.status(201).json(notification);
      
    } catch (error) {
      console.error("خطأ في إضافة إشعار للمستخدم:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إضافة إشعار للمستخدم" });
    }
  });
  
  // إرسال إشعار للمستخدم عن طريق رقم الحساب (للمسؤولين فقط)
  app.post("/api/admin/notify-by-account", authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بإضافة إشعارات للمستخدمين" });
      }
      
      const { account_number, subject, message } = req.body;
      
      if (!account_number || !subject || !message) {
        return res.status(400).json({ message: "رقم الحساب وعنوان الإشعار ومحتواه مطلوبة" });
      }
      
      // البحث عن المستخدم باستخدام رقم الحساب
      const user = await storage.getUserByPhoneOrId(account_number);
      
      if (!user) {
        return res.status(404).json({ message: "لم يتم العثور على حساب بهذا الرقم" });
      }
      
      // إنشاء الإشعار
      const notification = await storage.createUserNotification({
        userId: user.id,
        title: subject,
        body: message,
        type: "info",
        isRead: false
      });
      
      // تسجيل نجاح إنشاء الإشعار في السجلات
      console.log(`✅ تم إنشاء إشعار برقم ${notification.id} للمستخدم ${user.fullName} (${user.id}) برقم حساب ${account_number}`);
      
      // إرسال الاستجابة بنجاح
      return res.status(200).json({
        message: `تم إرسال الإشعار بنجاح إلى ${user.fullName}`,
        notification,
        success: true
      });
      
    } catch (error) {
      console.error("خطأ في إرسال الإشعار:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إرسال الإشعار" });
    }
  });
  
  // إضافة رسالة للمسؤول من قبل المستخدم
  app.post('/api/user/admin-message', authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const { message } = req.body;
      
      if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ message: "الرسالة مطلوبة ولا يمكن أن تكون فارغة" });
      }
      
      // إضافة الرسالة في جدول admin_messages
      const result = await db.$client.query(`
        INSERT INTO admin_messages (user_id, message, is_read)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [userId, message, false]);
      
      // إنشاء إشعار للمستخدم
      await storage.createUserNotification({
        userId: userId,
        title: "إرسال رسالة للمسؤول",
        body: "تم إرسال رسالتك للمسؤول وسيتم الرد عليها في أقرب وقت",
        type: "info",
        isRead: false
      });
      
      // الحصول على بيانات المستخدم المرسل
      const senderUser = await storage.getUser(userId);
      
      // إنشاء إشعار للمسؤول
      // الحصول على المستخدم المسؤول
      const adminUser = await storage.getAdminUser();
      if (adminUser) {
        // إنشاء إشعار للمسؤول
        await storage.createUserNotification({
          userId: adminUser.id,
          title: "رسالة جديدة من مستخدم",
          body: `تم استلام رسالة جديدة من المستخدم: ${senderUser?.fullName || 'غير معروف'} (${userId})`,
          type: "info",
          isRead: false
        });
      }
      
      res.status(201).json({
        message: "تم إرسال الرسالة بنجاح",
        adminMessage: result.rows[0]
      });
    } catch (error: any) {
      console.error("خطأ في إرسال رسالة للمسؤول:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء إرسال الرسالة" });
    }
  });
  
  // الحصول على الرسائل المرسلة للمسؤول من قبل المستخدم الحالي
  app.get('/api/user/admin-messages', authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      
      const result = await db.$client.query(`
        SELECT * FROM admin_messages
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error("خطأ في جلب رسائل المسؤول:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب الرسائل" });
    }
  });
  
  // الحصول على جميع الرسائل المرسلة للمسؤول (للمسؤولين فقط)
  app.get('/api/admin/messages', authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه البيانات" });
      }
      
      // الحصول على جميع الرسائل مع معلومات المستخدم
      const result = await db.$client.query(`
        SELECT m.*, u.full_name, u.email
        FROM admin_messages m
        JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at DESC
      `);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error("خطأ في جلب رسائل المستخدمين:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب الرسائل" });
    }
  });
  
  // إرسال رسالة من المسؤول للمستخدم (للمسؤولين فقط)
  app.post('/api/admin/message', authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const { user_id, message } = req.body;
      
      if (!user_id || !message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ message: "معرف المستخدم والرسالة مطلوبان" });
      }
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(user_id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // حفظ الرسالة في جدول admin_messages
      const result = await db.$client.query(`
        INSERT INTO admin_messages (user_id, message, is_read)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [user_id, message, false]);
      
      // الحصول على معلومات المستخدم المرسل إليه
      const targetUser = await storage.getUser(user_id);
      
      // إنشاء إشعار للمستخدم برسالة من المسؤول
      await storage.createUserNotification({
        userId: user_id,
        title: "رسالة من إدارة النظام",
        body: message,
        type: "info",
        isRead: false
      });
      
      res.json({ 
        message: "📩 تم إرسال الرسالة بنجاح",
        adminMessage: result.rows[0],
        notification: {
          userId: user_id,
          title: "رسالة من إدارة النظام",
          body: message,
          createdAt: new Date()
        }
      });
    } catch (error: any) {
      console.error("خطأ في إرسال رسالة للمستخدم:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء إرسال الرسالة للمستخدم" });
    }
  });

  // الرد على رسالة مستخدم (للمسؤولين فقط)
  app.post('/api/admin/messages/:id/reply', authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const messageId = parseInt(req.params.id);
      const { reply } = req.body;
      
      if (!reply || typeof reply !== 'string' || reply.trim() === '') {
        return res.status(400).json({ message: "الرد مطلوب ولا يمكن أن يكون فارغًا" });
      }
      
      // الحصول على معلومات الرسالة والمستخدم
      const messageResult = await db.$client.query(`
        SELECT m.*, u.id as user_id
        FROM admin_messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = $1
      `, [messageId]);
      
      if (messageResult.rowCount === 0) {
        return res.status(404).json({ message: "الرسالة غير موجودة" });
      }
      
      const message = messageResult.rows[0];
      
      // تعليم الرسالة كمقروءة
      await db.$client.query(`
        UPDATE admin_messages
        SET is_read = TRUE
        WHERE id = $1
      `, [messageId]);
      
      // إنشاء إشعار للمستخدم بالرد
      await storage.createUserNotification({
        userId: message.user_id,
        title: "رد من المسؤول على رسالتك",
        body: reply,
        type: "success",
        isRead: false
      });
      
      res.json({
        message: "تم إرسال الرد بنجاح",
        adminMessage: {
          ...message,
          is_read: true
        }
      });
    } catch (error: any) {
      console.error("خطأ في الرد على رسالة:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء الرد على الرسالة" });
    }
  });

  // تعليم رسالة كمقروءة (للمسؤولين فقط)
  app.post('/api/admin/messages/:id/read', authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const messageId = parseInt(req.params.id);
      
      // تحديث حالة الرسالة
      const result = await db.$client.query(`
        UPDATE admin_messages
        SET is_read = TRUE
        WHERE id = $1
        RETURNING *
      `, [messageId]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "الرسالة غير موجودة" });
      }
      
      res.json({
        message: "تم تعليم الرسالة كمقروءة",
        adminMessage: result.rows[0]
      });
    } catch (error: any) {
      console.error("خطأ في تعليم الرسالة كمقروءة:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء تعليم الرسالة كمقروءة" });
    }
  });

  // تعديل بيانات مستخدم (للمسؤولين فقط)
  app.post('/api/admin/edit-user', authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const { user_id, full_name, email } = req.body;
      
      // التحقق من صحة البيانات المدخلة
      if (!user_id || !full_name || !email) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة: user_id, full_name, email" });
      }
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(user_id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // التحقق من عدم وجود بريد إلكتروني مكرر
      if (email !== user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== user_id) {
          return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
        }
      }
      
      // تحديث بيانات المستخدم
      await db.$client.query(`
        UPDATE users SET full_name = $1, email = $2 WHERE id = $3
      `, [full_name, email, user_id]);
      
      // إنشاء إشعار للمستخدم
      await storage.createUserNotification({
        userId: user_id,
        title: "تحديث البيانات",
        body: "تم تحديث بياناتك الشخصية بواسطة المسؤول",
        type: "info",
        isRead: false
      });
      
      res.json({ message: "✅ تم تعديل بيانات المستخدم بنجاح" });
    } catch (error: any) {
      console.error("خطأ في تعديل بيانات المستخدم:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء تعديل بيانات المستخدم" });
    }
  });


  // تفعيل أو تعطيل حساب مستخدم (للمسؤولين فقط)
  app.post('/api/admin/toggle-user', authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const { user_id, status } = req.body;
      
      // التحقق من صحة البيانات المدخلة
      if (!user_id) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }
      
      if (typeof status !== 'boolean') {
        return res.status(400).json({ message: "حالة المستخدم يجب أن تكون صحيحة أو خاطئة" });
      }
      
      // استخدام SQL مباشر لتحديث حالة المستخدم
      await db.$client.query(`
        UPDATE users SET active = $1 WHERE id = $2
      `, [status, user_id]);
      
      // إنشاء إشعار للمستخدم
      await storage.createUserNotification({
        userId: user_id,
        title: status ? "تفعيل الحساب" : "تعطيل الحساب",
        body: status ? "تم تفعيل حسابك بواسطة المسؤول" : "تم تعطيل حسابك بواسطة المسؤول",
        type: status ? "success" : "warning",
        isRead: false
      });
      
      res.json({ 
        message: status ? "✅ تم تفعيل المستخدم" : "🚫 تم تعطيل المستخدم" 
      });
    } catch (error: any) {
      console.error("خطأ في تحديث حالة المستخدم:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء تحديث حالة المستخدم" });
    }
  });

  // سحب رصيد من حساب مستخدم (للمسؤولين فقط)
  app.post('/api/admin/withdraw', authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }
      
      const { user_id, amount, currency } = req.body;
      
      // التحقق من صحة البيانات المدخلة
      if (!user_id || !amount || !currency) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة: user_id, amount, currency" });
      }
      
      // التأكد من أن المبلغ رقم موجب
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ message: "المبلغ يجب أن يكون رقماً موجباً" });
      }
      
      // استخدام استعلام SQL مباشر لسحب المبلغ مع التحقق من توفر الرصيد
      const result = await db.$client.query(`
        UPDATE balances SET amount = amount - $1
        WHERE user_id = $2 AND currency = $3 AND amount >= $1
        RETURNING *
      `, [amount, user_id, currency]);
      
      // التحقق من نجاح العملية
      if (result.rowCount === 0) {
        return res.status(400).json({ message: "فشل في سحب المبلغ. تأكد من وجود رصيد كافٍ." });
      }
      
      // إنشاء إشعار للمستخدم
      await storage.createUserNotification({
        userId: user_id,
        title: "سحب من الرصيد",
        body: `تم سحب ${amount} ${currency} من رصيدك بواسطة المسؤول`,
        type: "warning",
        isRead: false
      });
      
      // إنشاء معاملة لتسجيل السحب
      await storage.createTransaction({
        userId: user_id,
        type: "withdraw",
        amount: amount.toString(),
        currency,
        description: "سحب بواسطة المسؤول"
      });
      
      res.json({ 
        message: "✅ تم سحب المبلغ بنجاح",
        updatedBalance: result.rows[0]
      });
    } catch (error: any) {
      console.error("خطأ في سحب المبلغ:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء سحب المبلغ" });
    }
  });
  
  // الحصول على نشاط مستخدم محدد (للمسؤولين فقط)
  app.get('/api/admin/user-activity/:id', authMiddleware, async (req, res) => {
    try {
      const { type } = (req as AuthRequest).user;
      
      // التحقق من أن المستخدم مسؤول
      if (type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه البيانات" });
      }
      
      const userId = parseInt(req.params.id);
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // الحصول على بيانات نشاط المستخدم من جميع الجداول ذات الصلة
      
      // 1. عمليات التحويل
      const transfersResult = await db.$client.query(`
        SELECT * FROM transfers
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      // 2. عمليات التحويل بين المدن
      const cityTransfersResult = await db.$client.query(`
        SELECT * FROM city_transfers
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      // 3. عمليات التحويل الدولية
      const internationalTransfersResult = await db.$client.query(`
        SELECT * FROM inter_office_transfers
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      // 4. المعاملات المالية
      const transactionsResult = await db.$client.query(`
        SELECT * FROM transactions
        WHERE user_id = $1
        ORDER BY date DESC
      `, [userId]);
      
      // 5. عروض السوق
      const marketOffersResult = await db.$client.query(`
        SELECT * FROM market_offers
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      // 6. معاملات السوق
      const marketTransactionsResult = await db.$client.query(`
        SELECT * FROM market_transactions
        WHERE buyer_id = $1 OR seller_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      // 7. طلبات الترقية
      const upgradeRequestsResult = await db.$client.query(`
        SELECT * FROM upgrade_requests
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      // 8. طلبات التوثيق
      const verificationRequestsResult = await db.$client.query(`
        SELECT * FROM verification_requests
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      // 9. الحوالات عبر الوكلاء
      const agentTransfersResult = await db.$client.query(`
        SELECT * FROM agent_transfers
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      // 10. الإشعارات
      const notificationsResult = await db.$client.query(`
        SELECT * FROM user_notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      // 11. رسائل المسؤول
      const adminMessagesResult = await db.$client.query(`
        SELECT * FROM admin_messages
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      // 12. الأرصدة
      const balancesResult = await db.$client.query(`
        SELECT * FROM balances
        WHERE user_id = $1
      `, [userId]);
      
      // تجميع البيانات وإرسالها
      res.json({
        user,
        activity: {
          transfers: transfersResult.rows || [],
          cityTransfers: cityTransfersResult.rows || [],
          internationalTransfers: internationalTransfersResult.rows || [],
          transactions: transactionsResult.rows || [],
          marketOffers: marketOffersResult.rows || [],
          marketTransactions: marketTransactionsResult.rows || [],
          upgradeRequests: upgradeRequestsResult.rows || [],
          verificationRequests: verificationRequestsResult.rows || [],
          agentTransfers: agentTransfersResult.rows || [],
          notifications: notificationsResult.rows || [],
          adminMessages: adminMessagesResult.rows || [],
          balances: balancesResult.rows || []
        }
      });
    } catch (error: any) {
      console.error("خطأ في الحصول على نشاط المستخدم:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء الحصول على نشاط المستخدم" });
    }
  });
  
  // ===== واجهة برمجة التطبيقات للدردشة =====
  
  // الحصول على قائمة غرف الدردشة
  app.get("/api/chat/rooms", authMiddleware, async (req, res) => {
    try {
      const rooms = await storage.getChatRooms();
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب غرف الدردشة" });
    }
  });
  
  // الحصول على الغرفة العامة
  app.get("/api/chat/public-room", authMiddleware, async (req, res) => {
    try {
      const room = await storage.getPublicChatRoom();
      if (!room) {
        return res.status(404).json({ message: "الغرفة العامة غير موجودة" });
      }
      res.json(room);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب الغرفة العامة" });
    }
  });
  
  // الحصول على رسائل غرفة معينة
  app.get("/api/chat/messages/:roomId", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const { roomId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getChatMessages(parseInt(roomId), limit, userId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب رسائل الدردشة" });
    }
  });
  
  // إضافة رسالة جديدة (عبر HTTP، يمكن استخدامها كبديل للـ WebSocket)
  app.post("/api/chat/messages", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const { roomId, content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "محتوى الرسالة مطلوب" });
      }
      
      // التحقق من وجود الغرفة
      let targetRoomId = roomId;
      if (!targetRoomId) {
        const publicRoom = await storage.getPublicChatRoom();
        if (!publicRoom) {
          return res.status(404).json({ message: "الغرفة غير موجودة" });
        }
        targetRoomId = publicRoom.id;
      }
      
      // حفظ الرسالة
      const message = await storage.createChatMessage({
        roomId: targetRoomId,
        senderId: userId,
        content
      });
      
      // بث الرسالة عبر WebSocket إذا كان متاحًا
      const user = await storage.getUser(userId);
      if (user && io) {
        io.to(`room-${targetRoomId}`).emit('newMessage', {
          ...message,
          senderName: user.fullName
        });
      }
      
      res.status(201).json(message);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء إرسال الرسالة" });
    }
  });

  // ===== واجهة برمجة التطبيقات للدردشات الخاصة =====
  
  // الحصول على قائمة الدردشات الخاصة للمستخدم
  app.get("/api/chat/private", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      
      // جلب الدردشات الخاصة
      const chats = await storage.getUserPrivateChats(userId);
      
      // جلب عدد الرسائل غير المقروءة
      const unreadCounts = await storage.getUnreadMessagesCount(userId);
      
      // دمج المعلومات
      const enhancedChats = chats.map(chat => {
        const unreadInfo = unreadCounts.find(u => u.chatId === chat.id);
        return {
          ...chat,
          unreadCount: unreadInfo ? parseInt(unreadInfo.count as any) : 0
        };
      });
      
      res.json(enhancedChats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب الدردشات الخاصة" });
    }
  });
  
  // ======== واجهات برمجة التطبيقات لمحادثات المجموعات (Group Chats) ========
  
  // إنشاء مجموعة دردشة جديدة
  app.post("/api/chat/group/create", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const { name, isPrivate, description } = req.body;
      
      // التحقق من البيانات المطلوبة
      if (!name || name.trim() === "") {
        return res.status(400).json({ message: "اسم المجموعة مطلوب" });
      }
      
      // إنشاء مجموعة جديدة
      const group = await storage.createGroupChat({
        name,
        creatorId: userId,
        isPrivate: isPrivate === true,
        description
      });
      
      res.status(201).json({ 
        message: "تم إنشاء المجموعة بنجاح", 
        groupId: group.id 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء إنشاء المجموعة" });
    }
  });
  
  // الحصول على مجموعات المستخدم + جميع المجموعات العامة
  app.get("/api/chat/groups", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      
      // جلب المجموعات التي المستخدم عضو فيها (الخاصة والعامة)
      const userGroups = await storage.getUserGroupChats(userId);
      
      // جلب جميع المجموعات العامة
      const publicGroups = await storage.getAllPublicGroupChats();
      
      // دمج المجموعات وتجنب التكرار
      const userGroupIds = new Set(userGroups.map(g => g.id));
      const additionalPublicGroups = publicGroups.filter(g => !userGroupIds.has(g.id));
      
      // المجموعات التي المستخدم عضو فيها أولاً، ثم العامة الأخرى
      const allGroups = [...userGroups, ...additionalPublicGroups];
      
      console.log(`👥 المستخدم ${userId} - مجموعات العضوية: ${userGroups.length}, عامة إضافية: ${additionalPublicGroups.length}, المجموع: ${allGroups.length}`);
      
      res.json(allGroups);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب المجموعات" });
    }
  });

  // خروج تلقائي من جميع المجموعات العامة (للتنظيف)
  app.post("/api/chat/groups/leave-public", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      
      console.log(`🧹 طلب خروج تلقائي من جميع المجموعات العامة للمستخدم ${userId}`);
      
      // جلب جميع المجموعات التي المستخدم عضو فيها
      const userGroups = await storage.getUserGroupChats(userId);
      
      // فلترة المجموعات العامة فقط
      const publicGroups = userGroups.filter(group => !group.isPrivate);
      
      let removedCount = 0;
      for (const group of publicGroups) {
        try {
          const userRole = await storage.getUserRoleInGroup(group.id, userId);
          
          // لا نحذف المالك من مجموعته الخاصة
          if (userRole !== 'owner') {
            const success = await storage.removeGroupMember(group.id, userId);
            if (success) {
              removedCount++;
              console.log(`✅ تم إخراج المستخدم ${userId} من المجموعة العامة ${group.id}`);
            }
          }
        } catch (error) {
          console.error(`❌ فشل إخراج المستخدم ${userId} من المجموعة ${group.id}:`, error);
        }
      }
      
      console.log(`🧹 تم إخراج المستخدم ${userId} من ${removedCount} مجموعة عامة`);
      
      res.json({ 
        success: true, 
        removedCount,
        message: `تم الخروج من ${removedCount} مجموعة عامة` 
      });
      
    } catch (error: any) {
      console.error("خطأ في الخروج من المجموعات العامة:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء الخروج من المجموعات العامة" });
    }
  });

  // ترك المجموعة (حذف المجموعة من حساب المستخدم)
  app.delete("/api/chat/groups/:groupId/leave", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const groupId = parseInt(req.params.groupId);
      
      if (!groupId) {
        return res.status(400).json({ message: "معرف المجموعة غير صحيح" });
      }
      
      // التحقق من وجود المجموعة
      const group = await storage.getGroupChat(groupId);
      if (!group) {
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }
      
      // التحقق من عضوية المستخدم في المجموعة
      const userRole = await storage.getUserRoleInGroup(groupId, userId);
      if (!userRole) {
        return res.status(404).json({ message: "أنت لست عضواً في هذه المجموعة" });
      }
      
      // منع مالك المجموعة من تركها إلا إذا كان العضو الوحيد
      if (userRole === 'owner') {
        const members = await storage.getGroupMembers(groupId);
        if (members.length > 1) {
          return res.status(400).json({ 
            message: "لا يمكن لمالك المجموعة تركها. يجب تعيين مالك جديد أو حذف المجموعة نهائياً" 
          });
        }
      }
      
      // حذف العضوية
      const success = await storage.removeGroupMember(groupId, userId);
      
      if (!success) {
        return res.status(500).json({ message: "فشل في ترك المجموعة" });
      }
      
      res.json({ 
        success: true, 
        message: "تم ترك المجموعة بنجاح" 
      });
      
    } catch (error: any) {
      console.error("خطأ في ترك المجموعة:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء ترك المجموعة" });
    }
  });

  // حذف المجموعة نهائياً (مؤسس المجموعة فقط)
  app.delete("/api/chat/groups/:groupId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const groupId = parseInt(req.params.groupId);
      
      if (!groupId) {
        return res.status(400).json({ message: "معرف المجموعة غير صحيح" });
      }
      
      // التحقق من وجود المجموعة
      const group = await storage.getGroupChat(groupId);
      if (!group) {
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }
      
      // التحقق من أن المستخدم هو مؤسس المجموعة
      if (group.creatorId !== userId) {
        return res.status(403).json({ 
          message: "فقط مؤسس المجموعة يمكنه حذف المجموعة نهائياً" 
        });
      }
      
      // الحصول على جميع أعضاء المجموعة قبل الحذف
      const members = await storage.getGroupMembers(groupId);
      
      // حذف المجموعة نهائياً
      const success = await storage.deleteGroup(groupId);
      
      if (!success) {
        return res.status(500).json({ message: "فشل في حذف المجموعة" });
      }
      
      // إشعار جميع الأعضاء بحذف المجموعة عبر Socket.IO
      if (io) {
        // إخراج جميع الأعضاء من غرفة المجموعة وإشعارهم
        for (const member of members) {
          const memberUserId = (member as any).user_id || member.userId;
          if (memberUserId !== userId) { // لا نرسل إشعار للمؤسس نفسه
            io.to(`user-${memberUserId}`).emit('groupDeleted', {
              groupId,
              groupName: group.name,
              deletedBy: userId
            });
          }
        }
        
        // إخراج جميع المتصلين من غرفة المجموعة
        const roomName = `group-${groupId}`;
        const sockets = await io.in(roomName).fetchSockets();
        for (const socket of sockets) {
          await socket.leave(roomName);
        }
        
        console.log(`🗑️ تم حذف المجموعة ${groupId} وإخراج ${sockets.length} متصل من الغرفة`);
      }
      
      res.json({ 
        success: true, 
        message: "تم حذف المجموعة نهائياً" 
      });
      
    } catch (error: any) {
      console.error("خطأ في حذف المجموعة:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء حذف المجموعة" });
    }
  });
  
  // إضافة عضو إلى المجموعة
  app.post("/api/chat/groups/:groupId/members", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const groupId = parseInt(req.params.groupId);
      const { memberId, role } = req.body;
      
      if (!memberId) {
        return res.status(400).json({ message: "معرف العضو مطلوب" });
      }
      
      // التحقق من وجود المجموعة
      const group = await storage.getGroupChat(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }
      
      // التحقق من أن المستخدم هو مسؤول في المجموعة
      const members = await storage.getGroupMembers(groupId);
      console.log("المجموعة", groupId, "الأعضاء:", members);
      console.log("المستخدم الحالي:", userId);
      // استخدام كلا الأشكال للتحقق من أن المستخدم هو مسؤول (مالك أو مدير)
      const isAdmin = members.some(m => 
        ((m as any).user_id === userId || m.userId === userId) && 
        (m.role === "admin" || m.role === "owner")
      );
      
      if (!isAdmin) {
        return res.status(403).json({ message: "يجب أن تكون مسؤولاً في المجموعة لإضافة أعضاء" });
      }
      
      // التحقق من وجود المستخدم المراد إضافته
      const targetUser = await storage.getUser(memberId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم المراد إضافته غير موجود" });
      }
      
      // التحقق من أن العضو ليس موجوداً بالفعل
      const isMember = members.some(m => m.userId === memberId);
      if (isMember) {
        return res.status(400).json({ message: "المستخدم عضو بالفعل في المجموعة" });
      }
      
      // للمجموعات العامة: فحص حد 100 عضو
      if (!group.isPrivate && members.length >= 100) {
        return res.status(400).json({ 
          message: "لا يمكن إضافة أعضاء جدد. المجموعات العامة محدودة بـ 100 عضو كحد أقصى"
        });
      }
      
      // إضافة العضو
      await storage.addGroupMember({
        groupId,
        userId: memberId,
        role: role || "member"
      });
      
      // إرسال إشعار للمستخدم المضاف
      await storage.createUserNotification({
        userId: memberId,
        title: "إضافة إلى مجموعة محادثة",
        body: `تمت إضافتك إلى مجموعة ${group.name}`,
        type: "info",
        isRead: false
      });
      
      res.json({ message: "تمت إضافة العضو بنجاح" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء إضافة العضو" });
    }
  });

  // الحصول على مجموعة محددة
  app.get("/api/chat/groups/:groupId", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const groupId = parseInt(req.params.groupId);
      
      // التحقق من وجود المجموعة
      const group = await storage.getGroupChat(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }
      
      // التحقق من عضوية المستخدم في المجموعة
      const members = await storage.getGroupMembers(groupId);
      const isMember = members.some(m => (m as any).user_id === userId || m.userId === userId);
      
      if (!isMember && group.isPrivate) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه المجموعة" });
      }
      
      // إرجاع بيانات المجموعة مع الأعضاء
      res.json({
        group,
        members
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب بيانات المجموعة" });
    }
  });
  
  // إضافة عضو إلى المجموعة
  app.post("/api/chat/group/:groupId/add-member", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const groupId = parseInt(req.params.groupId);
      const { targetUserId } = req.body;
      
      if (!targetUserId) {
        return res.status(400).json({ message: "معرف المستخدم المراد إضافته مطلوب" });
      }
      
      // التحقق من وجود المجموعة
      const group = await storage.getGroupChat(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }
      
      // التحقق من أن المستخدم هو مسؤول في المجموعة
      const isAdmin = await storage.isGroupAdmin(groupId, userId);
      
      if (!isAdmin) {
        return res.status(403).json({ message: "يجب أن تكون مسؤولاً في المجموعة لإضافة أعضاء" });
      }
      
      // التحقق من وجود المستخدم المراد إضافته
      const targetUser = await storage.getUser(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم المراد إضافته غير موجود" });
      }
      
      // إضافة العضو
      await storage.addGroupMember({
        groupId,
        userId: targetUserId,
        role: "member"
      });
      
      // إرسال إشعار للمستخدم المضاف
      await storage.createUserNotification({
        userId: targetUserId,
        title: "إضافة إلى مجموعة محادثة",
        body: `تمت إضافتك إلى مجموعة ${group.name}`,
        type: "info",
        isRead: false
      });
      
      res.json({ message: "تمت إضافة العضو بنجاح" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء إضافة العضو" });
    }
  });

  // دخول تلقائي للمجموعات العامة
  app.post("/api/chat/groups/:groupId/auto-join", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const groupId = parseInt(req.params.groupId);
      
      // التحقق من وجود المجموعة
      const group = await storage.getGroupChat(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }
      
      // التحقق من أن المجموعة عامة
      if (group.isPrivate) {
        return res.status(403).json({ message: "هذه المجموعة خاصة ولا يمكن الدخول إليها تلقائياً" });
      }
      
      // تنظيف تلقائي: إزالة الأعضاء غير المتصلين من المجموعة العامة
      const io = req.app.get('io');
      if (io) {
        const members = await storage.getGroupMembers(groupId);
        console.log(`🧹 فحص ${members.length} عضو في المجموعة العامة ${groupId} للتنظيف التلقائي`);
        
        for (const member of members) {
          const memberId = (member as any).user_id || member.userId;
          
          // البحث عن اتصالات Socket.IO النشطة للعضو
          const connectedSockets = await io.in(`group-${groupId}`).fetchSockets();
          const memberConnected = connectedSockets.some(socket => socket.data?.userId === memberId);
          
          if (!memberConnected) {
            console.log(`🧹 إزالة العضو غير المتصل ${memberId} من المجموعة العامة ${groupId}`);
            await storage.removeGroupMember(groupId, memberId);
          }
        }
      }
      
      // جلب الأعضاء المحدثين بعد التنظيف
      const members = await storage.getGroupMembers(groupId);
      const isMember = members.some(m => 
        ((m as any).user_id === userId || m.userId === userId)
      );
      
      // إذا كان المستخدم عضواً بالفعل، لا نحتاج لفعل شيء
      if (isMember) {
        return res.json({ 
          message: "أنت عضو بالفعل في المجموعة",
          joined: false,
          memberCount: members.length
        });
      }
      
      // التحقق من حد 100 عضو للمجموعات العامة
      if (members.length >= 100) {
        return res.status(400).json({ 
          message: "لا يمكن الانضمام للمجموعة. الحد الأقصى 100 عضو للمجموعات العامة",
          memberCount: members.length
        });
      }
      
      // إضافة المستخدم تلقائياً كعضو عادي
      await storage.addGroupMember({
        groupId,
        userId,
        role: "member"
      });
      
      console.log(`✅ انضمام تلقائي: المستخدم ${userId} انضم للمجموعة العامة ${groupId}`);
      
      res.json({ 
        message: "تم الانضمام للمجموعة تلقائياً",
        joined: true,
        memberCount: members.length + 1
      });
      
    } catch (error: any) {
      console.error("خطأ في الانضمام التلقائي:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء الانضمام للمجموعة" });
    }
  });
  
  // جلب أعضاء المجموعة
  // إضافة رسالة جديدة إلى مجموعة محادثة
  app.post("/api/chat/groups/:groupId/messages", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const groupId = parseInt(req.params.groupId);
      const { content, fileUrl, fileType } = req.body;
      
      console.log(`محاولة إرسال رسالة من المستخدم ${userId} إلى المجموعة ${groupId}: "${content}", مرفق: ${fileUrl ? 'نعم' : 'لا'}`);
      
      // التحقق من وجود نص أو ملف مرفق على الأقل
      if ((!content || typeof content !== 'string' || content.trim() === '') && !fileUrl) {
        return res.status(400).json({ message: "يجب أن تحتوي الرسالة على نص أو ملف مرفق" });
      }
      
      // التحقق من وجود المجموعة
      const group = await storage.getGroupChat(groupId);
      if (!group) {
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }
      
      // التحقق من العضوية في المجموعة الخاصة
      if (group.isPrivate) {
        const isMember = await storage.isGroupMember(groupId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه المجموعة" });
        }
      }

      // 🚫 التحقق من حالة الحظر أولاً
      const isBanned = await storage.isUserBanned(groupId, userId);
      if (isBanned) {
        console.log(`🚫 المستخدم ${userId} محظور في المجموعة ${groupId} - رفض الرسالة عبر HTTP`);
        return res.status(403).json({ 
          message: 'تم حظرك من هذه المجموعة ولا يمكنك إرسال رسائل أو المشاركة فيها',
          isBanned: true
        });
      }

      // 🔇 التحقق من حالة الكتم قبل السماح بالإرسال
      const isMuted = await storage.isUserMuted(groupId, userId);
      if (isMuted) {
        console.log(`🔇 المستخدم ${userId} مكتوم في المجموعة ${groupId} - رفض الرسالة عبر HTTP`);
        return res.status(403).json({ 
          message: 'أنت مكتوم في هذه المجموعة ولا يمكنك إرسال رسائل حالياً',
          isMuted: true
        });
      }
      
      // إضافة الرسالة
      const message = await storage.createGroupMessage({
        groupId,
        senderId: userId,
        content: content ? content.trim() : '',
        fileUrl,
        fileType
      });
      
      // إضافة معلومات المرسل
      const user = await storage.getUser(userId);
      const fullMessage = {
        ...message,
        senderName: user ? user.fullName : "مستخدم"
      };
      
      res.status(201).json(fullMessage);
      
      // إرسال الرسالة عبر WebSocket إلى كل أعضاء المجموعة
      const roomName = `group-${groupId}`;
      io.to(roomName).emit('newGroupMessage', fullMessage);
      
    } catch (error) {
      console.error("خطأ في إضافة رسالة إلى المجموعة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إرسال الرسالة" });
    }
  });

  // تعديل رسالة في مجموعة
  app.put("/api/chat/groups/:groupId/messages/:messageId", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const groupId = parseInt(req.params.groupId);
      const messageId = parseInt(req.params.messageId);
      const { content } = req.body;
      
      console.log(`محاولة تعديل الرسالة ${messageId} في المجموعة ${groupId} بواسطة المستخدم ${userId}`);
      console.log('محتوى الرسالة الجديد:', content);
      
      // تحقق من صحة البيانات
      if (!groupId || isNaN(groupId)) {
        console.log("خطأ: معرف المجموعة غير صالح");
        return res.status(400).json({ message: "معرف المجموعة غير صالح" });
      }
      
      if (!messageId || isNaN(messageId)) {
        console.log("خطأ: معرف الرسالة غير صالح");
        return res.status(400).json({ message: "معرف الرسالة غير صالح" });
      }
      
      if (!content || typeof content !== 'string' || content.trim() === '') {
        console.log("خطأ: محتوى الرسالة غير صالح");
        return res.status(400).json({ message: "محتوى الرسالة مطلوب" });
      }
      
      // التحقق من وجود المجموعة
      console.log(`جاري البحث عن المجموعة بالمعرف ${groupId}`);
      const group = await storage.getGroupChat(groupId);
      if (!group) {
        console.log("المجموعة غير موجودة:", groupId);
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }
      console.log("تم العثور على المجموعة:", group);
      
      // التحقق من العضوية في المجموعة
      console.log(`التحقق من عضوية المستخدم ${userId} في المجموعة ${groupId}`);
      const isMember = await storage.isGroupMember(groupId, userId);
      console.log('هل المستخدم عضو في المجموعة؟', isMember);
      if (!isMember) {
        console.log(`المستخدم ${userId} ليس عضوا في المجموعة ${groupId}`);
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه المجموعة" });
      }
      
      // التحقق من وجود الرسالة وملكيتها
      console.log(`البحث عن الرسالة بالمعرف ${messageId} في المجموعة ${groupId}`);
      const messageResult = await db.execute(sql`
        SELECT * FROM group_messages 
        WHERE id = ${messageId} AND group_id = ${groupId}
        LIMIT 1
      `);
      
      console.log("نتيجة استعلام الرسالة:", messageResult);
      console.log("عدد الصفوف المسترجعة:", messageResult.rows.length);
      
      if (!messageResult.rows || messageResult.rows.length === 0) {
        console.log(`لم يتم العثور على رسالة بالمعرف ${messageId} في المجموعة ${groupId}`);
        return res.status(404).json({ message: "الرسالة غير موجودة" });
      }
      
      const message = messageResult.rows[0];
      console.log('الرسالة المراد تعديلها:', message);
      
      // التحقق من أن المستخدم هو مالك الرسالة
      console.log(`مقارنة معرف مرسل الرسالة ${message.sender_id} مع معرف المستخدم الحالي ${userId}`);
      
      if (message.sender_id !== userId) {
        console.log(`خطأ: المستخدم ${userId} ليس مالك الرسالة ${messageId}`);
        return res.status(403).json({ message: "لا يمكنك تعديل رسائل الآخرين" });
      }
      
      // التحقق من الوقت المسموح به للتعديل (5 دقائق = 300000 مللي ثانية)
      const FIVE_MINUTES = 5 * 60 * 1000;
      const now = new Date();
      const sentTime = new Date(message.created_at);
      const timeElapsed = now.getTime() - sentTime.getTime();
      
      console.log(`الوقت المنقضي منذ إرسال الرسالة: ${timeElapsed}ms من أصل ${FIVE_MINUTES}ms مسموح به`);
      
      if (timeElapsed > FIVE_MINUTES) {
        console.log(`خطأ: انتهى وقت التعديل المسموح به (${FIVE_MINUTES}ms)`);
        return res.status(400).json({ message: "انتهى وقت التعديل المسموح به (5 دقائق)" });
      }
      
      console.log("التحقق من الصلاحيات والوقت اكتمل بنجاح");
      
      // تحديث الرسالة
      console.log(`تحديث محتوى الرسالة ${messageId} إلى: "${content.trim()}"`);
      try {
        const updateResult = await db.execute(sql`
          UPDATE group_messages 
          SET content = ${content.trim()}, edited_at = NOW(), is_edited = TRUE
          WHERE id = ${messageId} AND sender_id = ${userId}
          RETURNING *
        `);
        console.log('نتيجة تحديث الرسالة:', updateResult);
        
        if (updateResult.rows && updateResult.rows.length > 0) {
          console.log('الرسالة المحدثة من استعلام التحديث:', updateResult.rows[0]);
        } else {
          console.log('استعلام التحديث لم يُرجع أي صفوف');
        }
      } catch (updateError) {
        console.error('خطأ أثناء تحديث الرسالة:', updateError);
        return res.status(500).json({ message: "حدث خطأ أثناء تحديث الرسالة" });
      }

      console.log('تم تحديث الرسالة في قاعدة البيانات، جاري استرجاع البيانات المحدثة');
      
      // جلب الرسالة المحدثة
      try {
        const updatedMessageResult = await db.execute(sql`
          SELECT * FROM group_messages 
          WHERE id = ${messageId}
          LIMIT 1
        `);
        
        console.log('نتيجة استعلام الرسالة المحدثة:', updatedMessageResult);
        console.log('عدد الصفوف المسترجعة:', updatedMessageResult.rows ? updatedMessageResult.rows.length : 0);
        
        if (!updatedMessageResult.rows || updatedMessageResult.rows.length === 0) {
          console.log(`لم يتم العثور على الرسالة المحدثة بالمعرف ${messageId}`);
          return res.status(500).json({ message: "فشل تحديث الرسالة" });
        }
      } catch (fetchError) {
        console.error('خطأ أثناء استرجاع الرسالة المحدثة:', fetchError);
        return res.status(500).json({ message: "فشل استرجاع الرسالة المحدثة" });
      }
      
      // استخراج الرسالة المحدثة من نتائج الاستعلام
      const updatedMessageResult = await db.execute(sql`
        SELECT * FROM group_messages 
        WHERE id = ${messageId}
        LIMIT 1
      `);
      
      console.log('نتيجة استعلام الرسالة المحدثة:', updatedMessageResult);
      
      if (!updatedMessageResult.rows || updatedMessageResult.rows.length === 0) {
        console.log(`لم يتم العثور على الرسالة المحدثة بالمعرف ${messageId}`);
        return res.status(500).json({ message: "فشل استرجاع الرسالة المحدثة" });
      }
      
      const messageData = updatedMessageResult.rows[0];
      console.log('الرسالة بعد التحديث:', messageData);
      
      // إضافة معلومات المرسل
      const user = await storage.getUser(userId);
      const fullMessage = {
        id: messageData.id,
        groupId: messageData.group_id,
        senderId: messageData.sender_id,
        content: messageData.content,
        createdAt: messageData.created_at,
        editedAt: messageData.edited_at,
        isEdited: messageData.is_edited,
        senderName: user ? user.fullName : "مستخدم"
      };
      
      console.log("الرسالة المكتملة المُعدّة للإرسال:", JSON.stringify(fullMessage));
      
      console.log('إرسال الرسالة المحدثة عبر WebSocket:', fullMessage);
      
      // إرسال الرسالة المحدثة عبر WebSocket
      const roomName = `group-${groupId}`;
      if (io) {
        io.to(roomName).emit('updatedGroupMessage', fullMessage);
      } else {
        console.error('خطأ: WebSocket غير متاح');
      }
      
      res.json(fullMessage);
    } catch (error) {
      console.error("خطأ في تعديل رسالة المجموعة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تعديل الرسالة" });
    }
  });

  app.get("/api/chat/groups/:groupId/members", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const groupId = req.params.groupId;
      
      if (!groupId) {
        return res.status(400).json({ message: "معرف المجموعة مطلوب" });
      }
      
      const groupIdNumber = parseInt(groupId);
      
      // التحقق من وجود المجموعة
      const group = await storage.getGroupChat(groupIdNumber);
      
      if (!group) {
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }
      
      // التحقق من عضوية المستخدم في المجموعة
      const members = await storage.getGroupMembers(groupIdNumber);
      const isMember = members.some(m => (m as any).user_id === userId || m.userId === userId);
      
      if (!isMember && group.isPrivate) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه المجموعة" });
      }
      
      // إرسال قائمة الأعضاء
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب أعضاء المجموعة" });
    }
  });
  
  // جلب رسائل المجموعة
  app.get("/api/chat/groups/:groupId/messages", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const groupId = parseInt(req.params.groupId);
      
      // التحقق من وجود المجموعة
      const group = await storage.getGroupChat(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }
      
      // التحقق من عضوية المستخدم في المجموعة
      const members = await storage.getGroupMembers(groupId);
      const isMember = members.some(m => (m as any).user_id === userId || m.userId === userId);
      
      if (!isMember && group.isPrivate) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه المجموعة" });
      }
      
      // جلب الرسائل مع تطبيق منطق الحذف الفردي
      const messages = await storage.getGroupMessages(groupId, 50, userId);
      
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب رسائل المجموعة" });
    }
  });
  
  // جلب الغرفة العامة
  app.get("/api/chat/public-room", authMiddleware, async (req, res) => {
    try {
      const publicRoom = await storage.getPublicChatRoom();
      
      if (!publicRoom) {
        return res.status(404).json({ message: "الغرفة العامة غير موجودة" });
      }
      
      res.json(publicRoom);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب الغرفة العامة" });
    }
  });
  
  // جلب رسائل الدردشة العامة
  app.get("/api/chat/messages", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const publicRoom = await storage.getPublicChatRoom();
      
      if (!publicRoom) {
        return res.status(404).json({ message: "الغرفة العامة غير موجودة" });
      }
      
      // جلب الرسائل مع إعجابات المستخدم
      const messages = await storage.getChatMessages(publicRoom.id, 100, userId);
      
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب رسائل الدردشة العامة" });
    }
  });

  // تبديل إعجاب الرسالة
  app.post("/api/chat/messages/:messageId/like", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const messageId = parseInt(req.params.messageId);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "معرف الرسالة غير صحيح" });
      }
      
      const result = await storage.toggleMessageLike(messageId, userId);
      
      res.json({
        success: true,
        liked: result.liked,
        count: result.count
      });
    } catch (error: any) {
      console.error("خطأ في تبديل إعجاب الرسالة:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء معالجة الإعجاب" });
    }
  });

  // جلب قائمة المعجبين برسالة
  app.get("/api/chat/messages/:messageId/likes", authMiddleware, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "معرف الرسالة غير صحيح" });
      }
      
      const likes = await storage.getMessageLikes(messageId);
      
      res.json(likes);
    } catch (error: any) {
      console.error("خطأ في جلب إعجابات الرسالة:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب الإعجابات" });
    }
  });
  
  // رفع ملف للدردشة العامة
  app.post("/api/chat/upload", authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "لم يتم تحميل أي ملف" });
      }

      // إنشاء مسار الملف المحمل
      const fileUrl = `/uploads/${req.file.filename}`;
      const fileType = req.file.mimetype;
      
      console.log(`تم تحميل الملف بنجاح: ${fileUrl} من النوع ${fileType}`);
      
      // إرجاع مسار الملف وبعض المعلومات الإضافية
      res.status(200).json({
        fileUrl: fileUrl,
        fileType: fileType,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error: any) {
      console.error("خطأ في تحميل الملف:", error);
      res.status(500).json({ message: error.message || "حدث خطأ أثناء تحميل الملف" });
    }
  }, handleUploadErrors);
  
  // تعديل رسالة في الغرفة العامة
  app.put("/api/chat/messages/:messageId", authMiddleware, async (req: AuthRequest, res: Response) => {
    const { messageId } = req.params;
    const { content, roomId } = req.body;
    const userId = req.user.id;

    console.log(`محاولة تعديل الرسالة ${messageId} في الغرفة ${roomId} بواسطة المستخدم ${userId}`);

    if (!content || !content.trim()) {
      console.log("خطأ: محتوى الرسالة فارغ");
      return res.status(400).json({ message: "محتوى الرسالة مطلوب" });
    }

    try {
      // التحقق من وجود الرسالة وأنها تنتمي للمستخدم
      const messageResult = await db.$client.query(`
        SELECT * FROM chat_messages 
        WHERE id = $1 
        AND sender_id = $2
        AND room_id = $3
        LIMIT 1
      `, [parseInt(messageId), userId, roomId]);
      
      if (messageResult.rows.length === 0) {
        console.log(`خطأ: الرسالة ${messageId} غير موجودة أو غير مملوكة للمستخدم ${userId}`);
        return res.status(404).json({ message: "الرسالة غير موجودة أو غير مصرح لك بتعديلها" });
      }

      const message = messageResult.rows[0];
      console.log("تم العثور على الرسالة:", message);

      // التحقق من أن الرسالة يمكن تعديلها (خلال 5 دقائق من إرسالها)
      const FIVE_MINUTES = 5 * 60 * 1000;
      const now = new Date();
      const sentTime = new Date(message.created_at);
      const timeElapsed = now.getTime() - sentTime.getTime();
      
      console.log(`الوقت المنقضي منذ إرسال الرسالة: ${timeElapsed}ms من أصل ${FIVE_MINUTES}ms مسموح به`);
      
      if (timeElapsed > FIVE_MINUTES) {
        console.log(`خطأ: انتهى وقت التعديل المسموح به (${FIVE_MINUTES}ms)`);
        return res.status(400).json({ message: "انتهى وقت التعديل المسموح به (5 دقائق)" });
      }
      
      console.log("التحقق من الصلاحيات والوقت اكتمل بنجاح");
      
      // تحديث الرسالة
      console.log(`تحديث محتوى الرسالة ${messageId} إلى: "${content.trim()}"`);
      
      const updateResult = await db.$client.query(`
        UPDATE chat_messages 
        SET content = $1, 
            is_edited = true, 
            edited_at = NOW() 
        WHERE id = $2 
        RETURNING *
      `, [content.trim(), parseInt(messageId)]);
      
      const updatedMessage = updateResult.rows[0];
      console.log("الرسالة المحدثة:", updatedMessage);
      
      // جلب اسم المرسل
      const userResult = await db.$client.query(`
        SELECT full_name FROM users WHERE id = $1 LIMIT 1
      `, [userId]);
      
      // إعداد الرسالة للإرسال
      const result = {
        id: updatedMessage.id,
        roomId: updatedMessage.room_id,
        senderId: updatedMessage.sender_id,
        content: updatedMessage.content,
        createdAt: updatedMessage.created_at,
        senderName: userResult.rows[0]?.full_name || req.user.fullName,
        isEdited: updatedMessage.is_edited,
        editedAt: updatedMessage.edited_at
      };
      
      // إرسال الرسالة المحدثة للمستخدمين في الغرفة
      io.to(`room-${roomId}`).emit('messageUpdated', result);
      
      console.log("تم إرسال الرسالة المحدثة إلى الغرفة room-" + roomId);
      return res.status(200).json(result);
      
    } catch (error) {
      console.error("خطأ في تعديل الرسالة:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء تعديل الرسالة" });
    }
  });
  
  // الحصول على رسائل دردشة خاصة محددة
  app.get("/api/chat/private/:chatId", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const chatId = parseInt(req.params.chatId);
      
      // التحقق من صلاحية المستخدم للوصول إلى هذه الدردشة
      const privateChatsResult = await db.execute(sql`
        SELECT * FROM private_chats
        WHERE id = ${chatId} AND (user1_id = ${userId} OR user2_id = ${userId})
        LIMIT 1
      `);
      
      const chat = privateChatsResult.rows[0];
      
      if (!chat || chat.id !== chatId) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه الدردشة" });
      }
      
      // جلب الرسائل مع تطبيق منطق الحذف الفردي
      const messagesResult = await db.execute(sql`
        SELECT pm.*, u.full_name as sender_name
        FROM private_messages pm
        JOIN users u ON pm.sender_id = u.id
        WHERE pm.chat_id = ${chatId}
          AND pm.is_deleted = false
          AND (pm.deleted_for_users IS NULL 
               OR pm.deleted_for_users = '{}' 
               OR ${userId} != ALL(pm.deleted_for_users))
        ORDER BY pm.created_at DESC
        LIMIT 50
      `);
      
      const messages = messagesResult.rows.map((msg: any) => ({
        id: msg.id,
        chatId: msg.chat_id,
        senderId: msg.sender_id,
        content: msg.content,
        fileUrl: msg.file_url,
        fileType: msg.file_type,
        isRead: msg.is_read,
        isEdited: msg.is_edited,
        createdAt: msg.created_at,
        editedAt: msg.edited_at,
        senderName: msg.sender_name,
        isDeleted: msg.is_deleted,
        deletedBy: msg.deleted_by,
        deletedAt: msg.deleted_at
      }));
      
      // تحديد المستخدم الآخر في المحادثة
      const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
      const otherUser = await storage.getUser(otherUserId);
      
      // تعليم الرسائل كمقروءة
      await storage.markMessagesAsRead(chatId, userId);
      
      res.json({
        messages: messages.reverse(),
        chat,
        otherUser: otherUser ? {
          id: otherUser.id,
          fullName: otherUser.fullName
        } : null
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب رسائل الدردشة الخاصة" });
    }
  });
  
  // إنشاء دردشة خاصة جديدة
  app.post("/api/chat/private/create", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const { otherUserId } = req.body;
      
      if (!otherUserId) {
        return res.status(400).json({ message: "معرف المستخدم الآخر مطلوب" });
      }
      
      // التحقق من عدم إنشاء محادثة مع النفس
      if (userId === otherUserId) {
        return res.status(400).json({ message: "لا يمكن إنشاء محادثة مع نفسك" });
      }
      
      // التحقق من وجود المستخدم الآخر
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "المستخدم الآخر غير موجود" });
      }
      
      // البحث عن محادثة موجودة بالفعل أو إنشاء واحدة جديدة
      let chat = await storage.getPrivateChat(userId, otherUserId);
      
      if (!chat) {
        chat = await storage.createPrivateChat(userId, otherUserId);
        
        // إنشاء إشعار للطرف الثاني بوجود محادثة جديدة
        const userInfo = await storage.getUser(userId);
        if (userInfo) {
          await storage.createUserNotification({
            userId: otherUserId,
            title: "محادثة جديدة",
            body: `بدأ ${userInfo.fullName} محادثة معك`,
            type: "info",
            isRead: false
          });
        }
        
        // إرسال إشعار بالمحادثة الجديدة للطرف الثاني عبر الويب سوكت إذا كان متصلاً
        if (io && userInfo) {
          // إرسال إشعار بتحديث قائمة المحادثات للطرف الثاني
          io.to(`user-${otherUserId}`).emit('newChatCreated', {
            chat: {
              id: chat.id,
              user1Id: chat.user1Id,
              user2Id: chat.user2Id,
              lastMessageAt: chat.lastMessageAt || new Date().toISOString(),
              createdAt: chat.createdAt || new Date().toISOString(),
              otherUser: {
                id: userInfo.id,
                fullName: userInfo.fullName
              },
              unreadCount: 0
            }
          });
        }
      }
      
      res.status(201).json({
        chat,
        otherUser: {
          id: otherUser.id,
          fullName: otherUser.fullName
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء إنشاء الدردشة الخاصة" });
    }
  });
  
  // إرسال رسالة خاصة (عبر HTTP، يمكن استخدامها كبديل للـ WebSocket)
  app.post("/api/chat/private/messages", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const { chatId, content } = req.body;
      
      if (!chatId || !content) {
        return res.status(400).json({ message: "معرف الدردشة ومحتوى الرسالة مطلوبان" });
      }
      
      // التحقق من صلاحية المستخدم للوصول إلى هذه الدردشة
      const chatResult = await db.execute(sql`
        SELECT * FROM private_chats
        WHERE id = ${chatId} AND (user1_id = ${userId} OR user2_id = ${userId})
        LIMIT 1
      `);
      
      const chat = chatResult.rows[0];
      
      if (!chat) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه الدردشة" });
      }
      
      // حفظ الرسالة
      const message = await storage.createPrivateMessage({
        chatId,
        senderId: userId,
        content,
        isRead: false
      });
      
      // تحديد المستخدم الآخر في المحادثة
      const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
      
      // إنشاء إشعار للمستقبل
      const sender = await storage.getUser(userId);
      await storage.createUserNotification({
        userId: otherUserId,
        title: "رسالة خاصة جديدة",
        body: `لديك رسالة جديدة من ${sender?.fullName || 'مستخدم آخر'}`,
        type: "info",
        isRead: false
      });
      
      // بث الرسالة عبر WebSocket إذا كان متاحًا
      if (sender && io) {
        io.to(`private-${chatId}`).emit('newPrivateMessage', {
          ...message,
          senderName: sender.fullName
        });
      }
      
      res.status(201).json(message);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء إرسال الرسالة الخاصة" });
    }
  });
  
  // تعديل رسالة في محادثة خاصة
  app.put("/api/chat/private/:chatId/messages/:messageId", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const chatId = parseInt(req.params.chatId);
      const messageId = parseInt(req.params.messageId);
      const { content } = req.body;
      
      console.log(`محاولة تعديل الرسالة ${messageId} في المحادثة الخاصة ${chatId} بواسطة المستخدم ${userId}`);
      console.log('محتوى الرسالة الجديد:', content);
      
      // تحقق من صحة البيانات
      if (!chatId || isNaN(chatId)) {
        console.log("خطأ: معرف المحادثة غير صالح");
        return res.status(400).json({ message: "معرف المحادثة غير صالح" });
      }
      
      if (!messageId || isNaN(messageId)) {
        console.log("خطأ: معرف الرسالة غير صالح");
        return res.status(400).json({ message: "معرف الرسالة غير صالح" });
      }
      
      if (!content || typeof content !== 'string' || content.trim() === '') {
        console.log("خطأ: محتوى الرسالة غير صالح");
        return res.status(400).json({ message: "محتوى الرسالة مطلوب" });
      }
      
      // التحقق من وجود المحادثة وأن المستخدم هو أحد طرفي المحادثة
      const chatResult = await db.execute(sql`
        SELECT * FROM private_chats
        WHERE id = ${chatId} AND (user1_id = ${userId} OR user2_id = ${userId})
        LIMIT 1
      `);
      
      if (!chatResult.rows || chatResult.rows.length === 0) {
        console.log(`المستخدم ${userId} ليس طرفاً في المحادثة ${chatId} أو المحادثة غير موجودة`);
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه المحادثة" });
      }
      
      // التحقق من وجود الرسالة وملكيتها
      console.log(`البحث عن الرسالة بالمعرف ${messageId} في المحادثة ${chatId}`);
      const messageResult = await db.execute(sql`
        SELECT * FROM private_messages 
        WHERE id = ${messageId} AND chat_id = ${chatId}
        LIMIT 1
      `);
      
      console.log("نتيجة استعلام الرسالة:", messageResult);
      console.log("عدد الصفوف المسترجعة:", messageResult.rows ? messageResult.rows.length : 0);
      
      if (!messageResult.rows || messageResult.rows.length === 0) {
        console.log(`لم يتم العثور على رسالة بالمعرف ${messageId} في المحادثة ${chatId}`);
        return res.status(404).json({ message: "الرسالة غير موجودة" });
      }
      
      const message = messageResult.rows[0];
      console.log('الرسالة المراد تعديلها:', message);
      
      // التحقق من أن المستخدم هو مالك الرسالة
      console.log(`مقارنة معرف مرسل الرسالة ${message.sender_id} مع معرف المستخدم الحالي ${userId}`);
      
      if (message.sender_id !== userId) {
        console.log(`خطأ: المستخدم ${userId} ليس مالك الرسالة ${messageId}`);
        return res.status(403).json({ message: "لا يمكنك تعديل رسائل الآخرين" });
      }
      
      // التحقق من الوقت المسموح به للتعديل (5 دقائق = 300000 مللي ثانية)
      const FIVE_MINUTES = 5 * 60 * 1000;
      const now = new Date();
      const sentTime = new Date(message.created_at);
      const timeElapsed = now.getTime() - sentTime.getTime();
      
      console.log(`الوقت المنقضي منذ إرسال الرسالة: ${timeElapsed}ms من أصل ${FIVE_MINUTES}ms مسموح به`);
      
      if (timeElapsed > FIVE_MINUTES) {
        console.log(`خطأ: انتهى وقت التعديل المسموح به (${FIVE_MINUTES}ms)`);
        return res.status(400).json({ message: "انتهى وقت التعديل المسموح به (5 دقائق)" });
      }
      
      console.log("التحقق من الصلاحيات والوقت اكتمل بنجاح");
      
      // تحديث الرسالة
      console.log(`تحديث محتوى الرسالة ${messageId} إلى: "${content.trim()}"`);
      try {
        const updateResult = await db.execute(sql`
          UPDATE private_messages 
          SET content = ${content.trim()}, edited_at = NOW(), is_edited = TRUE
          WHERE id = ${messageId} AND sender_id = ${userId}
          RETURNING *
        `);
        console.log('نتيجة تحديث الرسالة:', updateResult);
        
        if (updateResult.rows && updateResult.rows.length > 0) {
          console.log('الرسالة المحدثة من استعلام التحديث:', updateResult.rows[0]);
        } else {
          console.log('استعلام التحديث لم يُرجع أي صفوف');
        }
      } catch (updateError) {
        console.error('خطأ أثناء تحديث الرسالة:', updateError);
        return res.status(500).json({ message: "حدث خطأ أثناء تحديث الرسالة" });
      }
      
      // استخراج الرسالة المحدثة من نتائج الاستعلام
      const updatedMessageResult = await db.execute(sql`
        SELECT * FROM private_messages 
        WHERE id = ${messageId}
        LIMIT 1
      `);
      
      console.log('نتيجة استعلام الرسالة المحدثة:', updatedMessageResult);
      
      if (!updatedMessageResult.rows || updatedMessageResult.rows.length === 0) {
        console.log(`لم يتم العثور على الرسالة المحدثة بالمعرف ${messageId}`);
        return res.status(500).json({ message: "فشل استرجاع الرسالة المحدثة" });
      }
      
      const messageData = updatedMessageResult.rows[0];
      console.log('الرسالة بعد التحديث:', messageData);
      
      // إضافة معلومات المرسل
      const user = await storage.getUser(userId);
      const fullMessage = {
        id: messageData.id,
        chatId: messageData.chat_id,
        senderId: messageData.sender_id,
        content: messageData.content,
        isRead: messageData.is_read,
        createdAt: messageData.created_at,
        editedAt: messageData.edited_at,
        isEdited: messageData.is_edited,
        senderName: user ? user.fullName : "مستخدم"
      };
      
      console.log("الرسالة المكتملة المُعدّة للإرسال:", JSON.stringify(fullMessage));
      
      // إرسال الرسالة المحدثة عبر WebSocket
      const roomName = `private-${chatId}`;
      if (io) {
        io.to(roomName).emit('updatedPrivateMessage', fullMessage);
        console.log(`تم إرسال الرسالة المحدثة إلى الغرفة ${roomName}`);
      } else {
        console.error('خطأ: WebSocket غير متاح');
      }
      
      res.json(fullMessage);
    } catch (error) {
      console.error("خطأ في تعديل رسالة خاصة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تعديل الرسالة" });
    }
  });

  // تعليم رسائل الدردشة الخاصة كمقروءة
  app.post("/api/chat/private/:chatId/read", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const chatId = parseInt(req.params.chatId);
      
      // التحقق من صلاحية المستخدم للوصول إلى هذه الدردشة
      const chatResult = await db.execute(sql`
        SELECT * FROM private_chats
        WHERE id = ${chatId} AND (user1_id = ${userId} OR user2_id = ${userId})
        LIMIT 1
      `);
      
      const chat = chatResult.rows[0];
      
      if (!chat) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه الدردشة" });
      }
      
      // تعليم الرسائل كمقروءة
      await storage.markMessagesAsRead(chatId, userId);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء تعليم الرسائل كمقروءة" });
    }
  });
  
  // البحث عن المستخدمين
  app.get("/api/search/users", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      const query = req.query.query as string;
      
      if (!query || query.length < 2) {
        return res.status(200).json([]);
      }
      
      // البحث عن المستخدمين باستثناء المستخدم الحالي
      const users = await db.execute(sql`
        SELECT id, full_name as "fullName"
        FROM users
        WHERE id != ${userId} 
        AND (full_name ILIKE ${'%' + query + '%'} OR email ILIKE ${'%' + query + '%'})
        LIMIT 10
      `);
      
      res.json(users.rows);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء البحث عن المستخدمين" });
    }
  });
  
  // الحصول على قائمة المستخدمين المتاحين للدردشة (لصفحة الدردشة العامة)
  app.get("/api/users/available", authMiddleware, async (req, res) => {
    try {
      const userId = (req as AuthRequest).user.id;
      
      // البحث عن المستخدمين النشطين باستثناء المستخدم الحالي
      const users = await db.execute(sql`
        SELECT id, full_name as "fullName", type, verified
        FROM users
        WHERE id != ${userId} AND active = true
        ORDER BY full_name ASC
        LIMIT 20
      `);
      
      res.json(users.rows);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "حدث خطأ أثناء جلب قائمة المستخدمين" });
    }
  });

  // واجهة برمجة لحذف رسائل الغرفة العامة
  app.delete("/api/chat/messages/:messageId", authMiddleware, async (req: AuthRequest, res: Response) => {
    const { messageId } = req.params;
    const userId = req.user.id;
    const userType = req.user.type; // 'user' أو 'admin'
    
    console.log(`محاولة حذف الرسالة ${messageId} بواسطة المستخدم ${userId} (النوع: ${userType})`);
    
    try {
      // جلب الرسالة للتحقق
      const messageResult = await db.execute(sql`
        SELECT * FROM chat_messages 
        WHERE id = ${parseInt(messageId)} 
        LIMIT 1
      `);
      
      if (messageResult.rows.length === 0) {
        console.log(`خطأ: الرسالة ${messageId} غير موجودة`);
        return res.status(404).json({ message: "الرسالة غير موجودة" });
      }
      
      const message = messageResult.rows[0];
      console.log("تم العثور على الرسالة:", message);
      
      // التحقق من الصلاحيات (يمكن للمستخدم حذف رسائله فقط، والمدير يمكنه حذف أي رسالة)
      if (message.sender_id !== userId && userType !== 'admin') {
        console.log(`خطأ: المستخدم ${userId} غير مصرح له بحذف الرسالة ${messageId}`);
        return res.status(403).json({ message: "غير مصرح لك بحذف هذه الرسالة" });
      }
      
      // تنفيذ الحذف الناعم (soft delete)
      const updateResult = await db.execute(sql`
        UPDATE chat_messages 
        SET is_deleted = true, 
            deleted_by = ${userId}, 
            deleted_at = NOW() 
        WHERE id = ${parseInt(messageId)} 
        RETURNING *
      `);
      
      const deletedMessage = updateResult.rows[0];
      console.log("تم حذف الرسالة:", deletedMessage);
      
      // إرسال إشعار بالحذف للمستخدمين الآخرين عبر Socket.IO
      if (io) {
        io.to(`room-${message.room_id}`).emit('messageDeleted', {
          id: parseInt(messageId),
          roomId: message.room_id,
          deletedBy: userId
        });
      }
      
      return res.json({ 
        success: true, 
        message: "تم حذف الرسالة بنجاح" 
      });
      
    } catch (error) {
      console.error("خطأ في حذف الرسالة:", error);
      return res.status(500).json({ 
        message: "حدث خطأ أثناء حذف الرسالة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });
  
  // واجهة برمجة لحذف رسائل المجموعات
  app.delete("/api/chat/groups/:groupId/messages/:messageId", authMiddleware, async (req: AuthRequest, res: Response) => {
    const { groupId, messageId } = req.params;
    const userId = req.user.id;
    const userType = req.user.type;
    
    console.log(`محاولة حذف الرسالة ${messageId} في المجموعة ${groupId} بواسطة المستخدم ${userId}`);
    
    try {
      // جلب الرسالة للتحقق
      const messageResult = await db.execute(sql`
        SELECT * FROM group_messages 
        WHERE id = ${parseInt(messageId)} 
        AND group_id = ${parseInt(groupId)}
        LIMIT 1
      `);
      
      if (messageResult.rows.length === 0) {
        console.log(`خطأ: الرسالة ${messageId} غير موجودة في المجموعة ${groupId}`);
        return res.status(404).json({ message: "الرسالة غير موجودة" });
      }
      
      const message = messageResult.rows[0];
      
      // التحقق من أن المستخدم عضو في المجموعة وله صلاحية الحذف
      const memberResult = await db.execute(sql`
        SELECT * FROM group_members 
        WHERE group_id = ${parseInt(groupId)} 
        AND user_id = ${userId}
        LIMIT 1
      `);
      
      // التحقق من صلاحيات الحذف (المرسل أو المشرف في المجموعة أو مدير النظام)
      const isGroupAdmin = memberResult.rows.length > 0 && memberResult.rows[0].role === 'admin';
      const isMessageSender = message.sender_id === userId;
      const isSystemAdmin = userType === 'admin';
      
      if (!isMessageSender && !isGroupAdmin && !isSystemAdmin) {
        console.log(`خطأ: المستخدم ${userId} غير مصرح له بحذف الرسالة ${messageId} في المجموعة ${groupId}`);
        return res.status(403).json({ message: "غير مصرح لك بحذف هذه الرسالة" });
      }
      
      // تطبيق الحذف الفردي - إضافة المستخدم إلى قائمة من حذفوا الرسالة
      let deletedForUsers = [];
      if (Array.isArray(message.deleted_for_users)) {
        deletedForUsers = message.deleted_for_users;
      }
      
      // إضافة المستخدم الحالي إلى قائمة من حذفوا الرسالة
      if (!deletedForUsers.includes(userId)) {
        deletedForUsers.push(userId);
      }
      
      console.log(`تحديث deleted_for_users للرسالة ${messageId} في المجموعة ${groupId} إلى: [${deletedForUsers.join(', ')}]`);
      
      const arrayString = deletedForUsers.length > 0 ? `{${deletedForUsers.join(',')}}` : '{}';
      const updateResult = await db.execute(sql`
        UPDATE group_messages 
        SET deleted_for_users = ${arrayString}::integer[], 
            deleted_at = NOW() 
        WHERE id = ${parseInt(messageId)} 
        RETURNING *
      `);
      
      // إرسال إشعار حذف فردي للمستخدم فقط
      if (io) {
        const userSockets = await io.in(`group-${groupId}`).fetchSockets();
        for (const socket of userSockets) {
          if (socket.userId === userId) {
            socket.emit('messageDeletedForUser', {
              messageId: parseInt(messageId),
              groupId: parseInt(groupId),
              deletedBy: userId,
              deletedForUser: userId
            });
            console.log(`تم إرسال حدث messageDeletedForUser للمستخدم ${userId} في المجموعة ${groupId}`);
            break;
          }
        }
      }
      
      return res.json({ 
        success: true, 
        message: "تم حذف الرسالة بنجاح" 
      });
      
    } catch (error) {
      console.error("خطأ في حذف رسالة المجموعة:", error);
      return res.status(500).json({ 
        message: "حدث خطأ أثناء حذف الرسالة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });
  
  // واجهة برمجة لحذف الرسائل الخاصة
  app.delete("/api/chat/private/:chatId/messages/:messageId", authMiddleware, async (req: AuthRequest, res: Response) => {
    const { chatId, messageId } = req.params;
    const userId = req.user.id;
    const userType = req.user.type;
    
    console.log(`محاولة حذف الرسالة الخاصة ${messageId} في المحادثة ${chatId} بواسطة المستخدم ${userId}`);
    
    try {
      // جلب الرسالة للتحقق
      const messageResult = await db.execute(sql`
        SELECT * FROM private_messages 
        WHERE id = ${parseInt(messageId)} 
        AND chat_id = ${parseInt(chatId)}
        LIMIT 1
      `);
      
      if (messageResult.rows.length === 0) {
        console.log(`خطأ: الرسالة ${messageId} غير موجودة في المحادثة ${chatId}`);
        return res.status(404).json({ message: "الرسالة غير موجودة" });
      }
      
      const message = messageResult.rows[0];
      
      // جلب معلومات المحادثة للتأكد أن المستخدم جزء منها
      const chatResult = await db.execute(sql`
        SELECT * FROM private_chats 
        WHERE id = ${parseInt(chatId)} 
        AND (user1_id = ${userId} OR user2_id = ${userId})
        LIMIT 1
      `);
      
      if (chatResult.rows.length === 0) {
        console.log(`خطأ: المستخدم ${userId} ليس جزءًا من المحادثة ${chatId}`);
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذه المحادثة" });
      }
      
      // التحقق من صلاحيات الحذف
      const isMessageSender = message.sender_id === userId;
      const isSystemAdmin = userType === 'admin';
      
      // المرسل فقط يمكنه حذف رسائله (أو المدير)
      const canDelete = isMessageSender || isSystemAdmin;
      
      if (!canDelete) {
        console.log(`خطأ: المستخدم ${userId} غير مصرح له بحذف الرسالة ${messageId}. السبب: يمكن للمرسل فقط حذف رسائله`);
        return res.status(403).json({ message: "يمكن للمرسل فقط حذف رسائله" });
      }
      
      let updateResult;
      
      // حذف فردي للمرسل فقط - الرسالة تبقى عند المستلم
      let deletedForUsers = [];
      if (Array.isArray(message.deleted_for_users)) {
        deletedForUsers = message.deleted_for_users;
      }
      
      // إضافة المستخدم الحالي إلى قائمة من حذفوا الرسالة
      if (!deletedForUsers.includes(userId)) {
        deletedForUsers.push(userId);
      }
      
      console.log(`تحديث deleted_for_users للرسالة ${messageId} إلى: [${deletedForUsers.join(', ')}]`);
      
      const arrayString = deletedForUsers.length > 0 ? `{${deletedForUsers.join(',')}}` : '{}';
      updateResult = await db.execute(sql`
        UPDATE private_messages 
        SET deleted_for_users = ${arrayString}::integer[], 
            deleted_at = NOW() 
        WHERE id = ${parseInt(messageId)} 
        RETURNING *
      `);
      
      const chat = chatResult.rows[0];
      const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
      
      console.log(`تم حذف الرسالة ${messageId} بنجاح من قاعدة البيانات`);

      // الحصول على Socket.IO من التطبيق
      const io = req.app.get('io');
      if (io) {
        console.log(`إرسال حدث حذف فردي للرسالة ${messageId} للمستخدم ${userId}`);
        const deletionData = {
          messageId: parseInt(messageId),
          chatId: parseInt(chatId),
          deletedBy: userId,
          isGlobalDelete: false, // دائماً حذف فردي
          deletedForUser: userId // المستخدم الذي حذف الرسالة
        };
        
        // حذف فردي - إرسال للمستخدم الذي حذف فقط
        const userSockets = await io.in(`private-${chatId}`).fetchSockets();
        for (const socket of userSockets) {
          if (socket.userId === userId) {
            socket.emit('messageDeletedForUser', deletionData);
            console.log(`تم إرسال حدث messageDeletedForUser للمستخدم ${userId} فقط`);
            break;
          }
        }
      } else {
        console.error('Socket.IO غير متاح للإرسال');
      }
      
      return res.json({ 
        success: true, 
        message: "تم حذف الرسالة بنجاح" 
      });
      
    } catch (error) {
      console.error("خطأ في حذف الرسالة الخاصة:", error);
      return res.status(500).json({ 
        message: "حدث خطأ أثناء حذف الرسالة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });

  // تنظيف المحادثة الخاصة (حذف جميع الرسائل من جهة المستخدم فقط)
  app.delete("/api/chat/private/:chatId/clear", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const userId = req.user.id;
      
      if (!chatId || isNaN(chatId)) {
        return res.status(400).json({ message: "معرف المحادثة غير صحيح" });
      }
      
      console.log(`بدء تنظيف المحادثة ${chatId} للمستخدم ${userId}`);
      
      // جلب جميع رسائل المحادثة لإضافة معرف المستخدم إلى deleted_for_users
      const messagesResult = await db.execute(sql`
        SELECT id, deleted_for_users 
        FROM private_messages 
        WHERE chat_id = ${chatId}
      `);
      
      const messages = messagesResult.rows as any[];
      
      if (messages.length === 0) {
        return res.status(200).json({ message: "لا توجد رسائل لحذفها" });
      }
      
      // إضافة معرف المستخدم لجميع الرسائل في المحادثة
      for (const message of messages) {
        const currentDeletedUsers = message.deleted_for_users || [];
        
        // تحقق من أن المستخدم ليس مضافاً بالفعل
        if (!currentDeletedUsers.includes(userId)) {
          const updatedDeletedUsers = [...currentDeletedUsers, userId];
          
          await db.execute(sql`
            UPDATE private_messages 
            SET deleted_for_users = ${sql.raw(`ARRAY[${updatedDeletedUsers.join(',')}]::integer[]`)}
            WHERE id = ${message.id}
          `);
        }
      }
      
      console.log(`تم تنظيف ${messages.length} رسالة للمستخدم ${userId} من المحادثة ${chatId}`);
      
      return res.status(200).json({ 
        message: "تم تنظيف المحادثة بنجاح",
        clearedCount: messages.length
      });
      
    } catch (error) {
      console.error("خطأ في تنظيف المحادثة الخاصة:", error);
      return res.status(500).json({ 
        message: "حدث خطأ أثناء تنظيف المحادثة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });

  // === إدارة أعضاء المجموعات (Group Members Management) ===
  
  // كتم عضو في المجموعة
  app.post("/api/chat/groups/:groupId/members/:userId/mute", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const actorId = req.user.id;
      const groupId = parseInt(req.params.groupId);
      const targetUserId = parseInt(req.params.userId);
      const { durationMinutes, reason } = req.body;
      
      if (!groupId || !targetUserId) {
        return res.status(400).json({ message: "معرف المجموعة أو المستخدم غير صحيح" });
      }
      
      // التحقق من صلاحيات الممثل (admin أو owner)
      const actorRole = await storage.getUserRoleInGroup(groupId, actorId);
      if (!actorRole || !['admin', 'owner'].includes(actorRole)) {
        return res.status(403).json({ message: "غير مصرح لك بكتم الأعضاء" });
      }
      
      // التحقق من دور المستخدم المستهدف
      const targetRole = await storage.getUserRoleInGroup(groupId, targetUserId);
      if (!targetRole) {
        return res.status(404).json({ message: "المستخدم غير موجود في المجموعة" });
      }
      
      // منع كتم المسؤولين (إلا إذا كان الممثل مالك المجموعة)
      if (targetRole === 'admin' && actorRole !== 'owner') {
        return res.status(403).json({ message: "لا يمكن كتم المسؤولين" });
      }
      
      // منع كتم مالك المجموعة
      if (targetRole === 'owner') {
        return res.status(403).json({ message: "لا يمكن كتم مالك المجموعة" });
      }
      
      // حساب تاريخ انتهاء الكتم
      const mutedUntil = durationMinutes ? new Date(Date.now() + durationMinutes * 60 * 1000) : null;
      
      // تطبيق الكتم
      const success = await storage.setMemberMuteUntil(groupId, targetUserId, mutedUntil);
      
      if (!success) {
        return res.status(500).json({ message: "فشل في كتم العضو" });
      }
      
      // إرسال إشعار فوري عبر Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${groupId}`).emit('memberMuted', {
          groupId,
          userId: targetUserId,
          mutedBy: actorId,
          mutedUntil,
          reason
        });
      }
      
      res.json({ 
        success: true, 
        message: "تم كتم العضو بنجاح",
        mutedUntil
      });
      
    } catch (error) {
      console.error("خطأ في كتم العضو:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });
  
  // إلغاء كتم عضو في المجموعة
  app.post("/api/chat/groups/:groupId/members/:userId/unmute", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const actorId = req.user.id;
      const groupId = parseInt(req.params.groupId);
      const targetUserId = parseInt(req.params.userId);
      
      if (!groupId || !targetUserId) {
        return res.status(400).json({ message: "معرف المجموعة أو المستخدم غير صحيح" });
      }
      
      // التحقق من صلاحيات الممثل
      const actorRole = await storage.getUserRoleInGroup(groupId, actorId);
      if (!actorRole || !['admin', 'owner'].includes(actorRole)) {
        return res.status(403).json({ message: "غير مصرح لك بإلغاء كتم الأعضاء" });
      }
      
      // التحقق من وجود المستخدم في المجموعة
      const targetMember = await storage.getGroupMember(groupId, targetUserId);
      if (!targetMember) {
        return res.status(404).json({ message: "المستخدم غير موجود في المجموعة" });
      }
      
      // إلغاء الكتم
      const success = await storage.setMemberMuteUntil(groupId, targetUserId, null);
      
      if (!success) {
        return res.status(500).json({ message: "فشل في إلغاء كتم العضو" });
      }
      
      // إرسال إشعار فوري عبر Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${groupId}`).emit('memberUnmuted', {
          groupId,
          userId: targetUserId,
          unmutedBy: actorId
        });
      }
      
      res.json({ 
        success: true, 
        message: "تم إلغاء كتم العضو بنجاح"
      });
      
    } catch (error) {
      console.error("خطأ في إلغاء كتم العضو:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // حظر عضو في المجموعة
  app.post("/api/chat/groups/:groupId/members/:userId/ban", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const actorId = req.user.id;
      const groupId = parseInt(req.params.groupId);
      const targetUserId = parseInt(req.params.userId);
      const { reason } = req.body;
      
      if (!groupId || !targetUserId) {
        return res.status(400).json({ message: "معرف المجموعة أو المستخدم غير صحيح" });
      }
      
      // التحقق من صلاحيات الممثل
      const actorRole = await storage.getUserRoleInGroup(groupId, actorId);
      if (!actorRole || !['admin', 'owner'].includes(actorRole)) {
        return res.status(403).json({ message: "غير مصرح لك بحظر الأعضاء" });
      }
      
      // التحقق من دور المستخدم المستهدف
      const targetRole = await storage.getUserRoleInGroup(groupId, targetUserId);
      if (!targetRole) {
        return res.status(404).json({ message: "المستخدم غير موجود في المجموعة" });
      }
      
      // منع حظر المسؤولين (إلا إذا كان الممثل مالك المجموعة)
      if (targetRole === 'admin' && actorRole !== 'owner') {
        return res.status(403).json({ message: "لا يمكن حظر المسؤولين" });
      }
      
      // منع حظر مالك المجموعة
      if (targetRole === 'owner') {
        return res.status(403).json({ message: "لا يمكن حظر مالك المجموعة" });
      }
      
      // تطبيق الحظر
      const success = await storage.banGroupMember(groupId, targetUserId, actorId, reason);
      
      if (!success) {
        return res.status(500).json({ message: "فشل في حظر العضو" });
      }
      
      // إرسال إشعار فوري عبر Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${groupId}`).emit('memberBanned', {
          groupId,
          userId: targetUserId,
          bannedBy: actorId,
          reason
        });
      }
      
      res.json({ 
        success: true, 
        message: "تم حظر العضو بنجاح",
        reason
      });
      
    } catch (error) {
      console.error("خطأ في حظر العضو:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });
  
  // إلغاء حظر عضو في المجموعة
  app.post("/api/chat/groups/:groupId/members/:userId/unban", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const actorId = req.user.id;
      const groupId = parseInt(req.params.groupId);
      const targetUserId = parseInt(req.params.userId);
      
      if (!groupId || !targetUserId) {
        return res.status(400).json({ message: "معرف المجموعة أو المستخدم غير صحيح" });
      }
      
      // التحقق من صلاحيات الممثل
      const actorRole = await storage.getUserRoleInGroup(groupId, actorId);
      if (!actorRole || !['admin', 'owner'].includes(actorRole)) {
        return res.status(403).json({ message: "غير مصرح لك بإلغاء حظر الأعضاء" });
      }
      
      // إلغاء الحظر
      const success = await storage.unbanGroupMember(groupId, targetUserId);
      
      if (!success) {
        return res.status(500).json({ message: "فشل في إلغاء حظر العضو" });
      }
      
      // إرسال إشعار فوري عبر Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${groupId}`).emit('memberUnbanned', {
          groupId,
          userId: targetUserId,
          unbannedBy: actorId
        });
      }
      
      res.json({ 
        success: true, 
        message: "تم إلغاء حظر العضو بنجاح"
      });
      
    } catch (error) {
      console.error("خطأ في إلغاء حظر العضو:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });
  
  // حذف عضو من المجموعة
  app.delete("/api/chat/groups/:groupId/members/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const actorId = req.user.id;
      const groupId = parseInt(req.params.groupId);
      const targetUserId = parseInt(req.params.userId);
      
      if (!groupId || !targetUserId) {
        return res.status(400).json({ message: "معرف المجموعة أو المستخدم غير صحيح" });
      }
      
      // السماح للمستخدم بحذف نفسه من أي مجموعة
      const isSelfRemoval = actorId === targetUserId;
      
      if (!isSelfRemoval) {
        // التحقق من صلاحيات الممثل لحذف الآخرين
        const actorRole = await storage.getUserRoleInGroup(groupId, actorId);
        if (!actorRole || !['admin', 'owner'].includes(actorRole)) {
          return res.status(403).json({ message: "غير مصرح لك بحذف الأعضاء" });
        }
      }
      
      // التحقق من دور المستخدم المستهدف
      const targetRole = await storage.getUserRoleInGroup(groupId, targetUserId);
      if (!targetRole) {
        return res.status(404).json({ message: "المستخدم غير موجود في المجموعة" });
      }
      
      // منع حذف المسؤولين (إلا إذا كان الممثل مالك المجموعة)
      if (targetRole === 'admin' && actorRole !== 'owner') {
        return res.status(403).json({ message: "لا يمكن حذف المسؤولين" });
      }
      
      // منع حذف مالك المجموعة
      if (targetRole === 'owner') {
        return res.status(403).json({ message: "لا يمكن حذف مالك المجموعة" });
      }
      
      // حذف العضو
      const success = await storage.removeGroupMember(groupId, targetUserId);
      
      if (!success) {
        return res.status(500).json({ message: "فشل في حذف العضو" });
      }
      
      // إجبار المستخدم على مغادرة غرفة Socket.IO
      const io = req.app.get('io');
      if (io) {
        const sockets = await io.in(`group-${groupId}`).fetchSockets();
        for (const socket of sockets) {
          if (socket.data?.userId === targetUserId) {
            await socket.leave(`group-${groupId}`);
            socket.emit('removedFromGroup', { groupId, removedBy: actorId });
          }
        }
        
        // إشعار باقي الأعضاء
        io.to(`group-${groupId}`).emit('memberRemoved', {
          groupId,
          userId: targetUserId,
          removedBy: actorId
        });
      }
      
      res.json({ 
        success: true, 
        message: "تم حذف العضو بنجاح"
      });
      
    } catch (error) {
      console.error("خطأ في حذف العضو:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Agent commission settings routes
  app.get("/api/agent/commissions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user || user.type !== 'agent') {
        return res.status(403).json({ message: "مسموح للوكلاء فقط" });
      }

      const commissions = await storage.getAgentCommissions(user.id);
      res.json(commissions);
    } catch (error) {
      console.error("خطأ في جلب عمولات الوكيل:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/agent/commissions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user || user.type !== 'agent') {
        return res.status(403).json({ message: "مسموح للوكلاء فقط" });
      }

      const { currencyCode, type, value } = req.body;

      // التحقق من صحة البيانات
      if (!currencyCode || !type || !value) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }

      if (!['percentage', 'fixed'].includes(type)) {
        return res.status(400).json({ message: "نوع العمولة غير صحيح" });
      }

      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        return res.status(400).json({ message: "قيمة العمولة يجب أن تكون رقماً موجباً" });
      }

      if (type === 'percentage' && numValue > 100) {
        return res.status(400).json({ message: "النسبة المئوية لا يمكن أن تتجاوز 100%" });
      }

      const commissionData = {
        agentId: user.id,
        currencyCode,
        type,
        value: value.toString()
      };

      const commission = await storage.createOrUpdateAgentCommission(commissionData);
      res.json(commission);
    } catch (error) {
      console.error("خطأ في حفظ عمولة الوكيل:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.delete("/api/agent/commissions/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user || user.type !== 'agent') {
        return res.status(403).json({ message: "مسموح للوكلاء فقط" });
      }

      const commissionId = parseInt(req.params.id);
      if (isNaN(commissionId)) {
        return res.status(400).json({ message: "معرف العمولة غير صحيح" });
      }

      await storage.deleteAgentCommission(commissionId);
      res.json({ message: "تم حذف العمولة بنجاح" });
    } catch (error) {
      console.error("خطأ في حذف عمولة الوكيل:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // إحصائيات عمولات جميع المكاتب (أعلى وأقل عمولة)
  app.get("/api/agent/commission-stats", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user || (user.type !== 'agent' && user.type !== 'admin')) {
        return res.status(403).json({ message: "مسموح للوكلاء والمدراء فقط" });
      }

      // جلب جميع عمولات الوكلاء من النظام
      const allCommissions = await storage.getAllAgentCommissions();
      
      if (allCommissions.length === 0) {
        return res.json({
          highest: null,
          lowest: null,
          total: 0
        });
      }

      // تحويل العمولات إلى قيم رقمية للمقارنة
      const commissionValues = allCommissions.map(commission => {
        const value = parseFloat(commission.value);
        return {
          ...commission,
          numericValue: value
        };
      });

      // العثور على أعلى وأقل عمولة
      const highest = commissionValues.reduce((max, current) => 
        current.numericValue > max.numericValue ? current : max
      );
      
      const lowest = commissionValues.reduce((min, current) => 
        current.numericValue < min.numericValue ? current : min
      );

      res.json({
        highest: {
          currencyCode: highest.currencyCode,
          type: highest.type,
          value: highest.value,
          numericValue: highest.numericValue,
          agentName: highest.agentName || `الوكيل #${highest.agentId}`
        },
        lowest: {
          currencyCode: lowest.currencyCode,
          type: lowest.type,
          value: lowest.value,
          numericValue: lowest.numericValue,
          agentName: lowest.agentName || `الوكيل #${lowest.agentId}`
        },
        total: allCommissions.length
      });
    } catch (error) {
      console.error("خطأ في جلب إحصائيات عمولات جميع المكاتب:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // نسب العمولة الافتراضية للنظام - للمدراء فقط
  
  // جلب نسب العمولة النشطة (للمستخدمين العاديين - للعرض فقط)
  app.get("/api/commission-rates", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const rates = await storage.getSystemCommissionRates();
      
      // إرجاع النسب النشطة فقط مع إخفاء المعلومات الحساسة
      const activeRates = rates
        .filter(rate => rate.isActive)
        .map(rate => ({
          id: rate.id,
          transferType: rate.transferType,
          currency: rate.currency,
          commissionRate: rate.commissionRate,
          perMilleRate: rate.perMilleRate,
          fixedAmount: rate.fixedAmount,
          isActive: rate.isActive
        }));
      
      res.json(activeRates);
    } catch (error) {
      console.error("خطأ في جلب نسب العمولة:", error);
      res.status(500).json({ message: "خطأ في جلب نسب العمولة" });
    }
  });
  
  // جلب جميع نسب العمولة
  app.get("/api/admin/system-commission-rates", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      console.log("🔍 طلب جلب نسب العمولة من المستخدم:", req.user.id, "نوع المستخدم:", req.user.type);
      
      if (req.user.type !== 'admin') {
        console.log("❌ المستخدم ليس مدير:", req.user.type);
        return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
      }

      console.log("⏳ جلب نسب العمولة من قاعدة البيانات...");
      const rates = await storage.getSystemCommissionRates();
      console.log("📊 نسب العمولة المجلبة:", rates);
      console.log("📝 عدد النسب:", rates.length);
      
      res.json(rates);
    } catch (error) {
      console.error("خطأ في جلب نسب العمولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  // إضافة نسبة عمولة جديدة
  app.post("/api/admin/system-commission-rates", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      console.log("🔥 بدء طلب إضافة نسبة عمولة جديدة");
      
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك بإضافة نسب العمولة" });
      }

      const { transferType, currency, commissionRate, perMilleRate, fixedAmount } = req.body.data || req.body;
      
      console.log("📥 البيانات المستلمة:", { transferType, currency, commissionRate, perMilleRate, fixedAmount });

      if (!transferType || !currency || (!commissionRate && !perMilleRate && !fixedAmount)) {
        return res.status(400).json({ message: "يجب تحديد نسبة العمولة أو نسبة في الألف أو مبلغ ثابت" });
      }

      // التحقق من صحة النسبة المئوية إذا تم تحديدها
      if (commissionRate && commissionRate !== "") {
        const rate = parseFloat(commissionRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          return res.status(400).json({ message: "نسبة العمولة يجب أن تكون رقماً بين 0 و 100" });
        }
      }

      // التحقق من صحة النسبة في الألف إذا تم تحديدها
      if (perMilleRate && perMilleRate !== "") {
        const rate = parseFloat(perMilleRate);
        if (isNaN(rate) || rate < 0 || rate > 1000) {
          return res.status(400).json({ message: "نسبة في الألف يجب أن تكون رقماً بين 0 و 1000" });
        }
      }

      // التحقق من صحة المبلغ الثابت إذا تم تحديدها
      if (fixedAmount && fixedAmount !== "") {
        const amount = parseFloat(fixedAmount);
        if (isNaN(amount) || amount < 0) {
          return res.status(400).json({ message: "المبلغ الثابت يجب أن يكون رقماً موجباً" });
        }
      }

      // التحقق من عدم وجود نسبة مماثلة
      const existingRate = await storage.getSystemCommissionRate(transferType, currency);
      if (existingRate) {
        console.log("نسبة موجودة بالفعل:", existingRate);
        const typeLabel = transferType === 'internal' ? 'التحويل الداخلي' : 
                         transferType === 'city' ? 'الحوالات بين المدن' : 'التحويل بين المكاتب';
        return res.status(400).json({ 
          message: `يوجد بالفعل نسبة عمولة ${(parseFloat(existingRate.commissionRate) * 100).toFixed(2)}% لـ ${typeLabel} بعملة ${currency}` 
        });
      }

      const processedData = {
        transferType,
        currency,
        commissionRate: commissionRate ? (parseFloat(commissionRate) / 100).toString() : "0",
        perMilleRate: perMilleRate ? perMilleRate : null, // لا نقسم على 1000 هنا لأن الواجهة الأمامية تقسم بالفعل
        fixedAmount: fixedAmount ? parseFloat(fixedAmount).toString() : null,
        isActive: true
      };
      
      console.log("البيانات المُعالجة للحفظ:", processedData);
      
      const newRate = await storage.createSystemCommissionRate(processedData);

      // تحويل البيانات للتنسيق المطلوب
      const formattedRate = {
        ...newRate,
        commissionRate: newRate.commissionRate,
        perMilleRate: newRate.perMilleRate
      };

      console.log("✅ تم إنشاء النسبة:", formattedRate);
      res.status(201).json(formattedRate);
    } catch (error) {
      console.error("❌ خطأ في إضافة نسبة العمولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إضافة نسبة العمولة" });
    }
  });

  // تحديث نسبة عمولة
  app.put("/api/admin/system-commission-rates/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك بتحديث نسب العمولة" });
      }

      const { id } = req.params;
      const { transferType, currency, commissionRate, perMilleRate, fixedAmount } = req.body.data || req.body;

      if (!transferType || !currency || (!commissionRate && !perMilleRate && !fixedAmount)) {
        return res.status(400).json({ message: "يجب تحديد نسبة العمولة أو نسبة في الألف أو مبلغ ثابت" });
      }

      // التحقق من صحة النسبة المئوية إذا تم تحديدها
      if (commissionRate && commissionRate !== "") {
        const rate = parseFloat(commissionRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          return res.status(400).json({ message: "نسبة العمولة يجب أن تكون رقماً بين 0 و 100" });
        }
      }

      // التحقق من صحة النسبة في الألف إذا تم تحديدها
      if (perMilleRate && perMilleRate !== "") {
        const rate = parseFloat(perMilleRate);
        if (isNaN(rate) || rate < 0 || rate > 1000) {
          return res.status(400).json({ message: "نسبة في الألف يجب أن تكون رقماً بين 0 و 1000" });
        }
      }

      // التحقق من صحة المبلغ الثابت إذا تم تحديدها
      if (fixedAmount && fixedAmount !== "") {
        const amount = parseFloat(fixedAmount);
        if (isNaN(amount) || amount < 0) {
          return res.status(400).json({ message: "المبلغ الثابت يجب أن يكون رقماً موجباً" });
        }
      }

      const updatedRate = await storage.updateSystemCommissionRate(parseInt(id), {
        transferType,
        currency,
        commissionRate: commissionRate ? (parseFloat(commissionRate) / 100).toString() : "0",
        perMilleRate: perMilleRate ? perMilleRate : null, // لا نقسم على 1000 هنا لأن الواجهة الأمامية تقسم بالفعل
        fixedAmount: fixedAmount ? parseFloat(fixedAmount).toString() : null
      });

      if (!updatedRate) {
        return res.status(404).json({ message: "لم يتم العثور على نسبة العمولة المطلوبة" });
      }

      // تحويل البيانات للتنسيق المطلوب
      const formattedRate = {
        ...updatedRate,
        commissionRate: updatedRate.commissionRate || "0",
        perMilleRate: updatedRate.perMilleRate || null
      };

      res.json(formattedRate);
    } catch (error) {
      console.error("خطأ في تحديث نسبة العمولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث نسبة العمولة" });
    }
  });

  // حذف نسبة عمولة
  app.delete("/api/admin/system-commission-rates/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك بحذف نسب العمولة" });
      }

      const { id } = req.params;
      await storage.deleteSystemCommissionRate(parseInt(id));
      
      res.json({ message: "تم حذف نسبة العمولة بنجاح" });
    } catch (error) {
      console.error("خطأ في حذف نسبة العمولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف نسبة العمولة" });
    }
  });

  // Commission Pool API endpoints
  app.get("/api/commission-pool/balance", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user || user.type !== 'admin') {
        return res.status(403).json({ message: "مسموح للمدراء فقط" });
      }

      const balances = await storage.getCommissionPoolBalance();
      res.json(balances);
    } catch (error) {
      console.error("خطأ في جلب رصيد حساب العمولات:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // جلب عمولات المستخدم الشخصية من commission pool
  app.get("/api/commission-pool/user-transactions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      
      // جلب عمولات المستخدم من commission pool
      const userCommissions = await db
        .select({
          id: commissionPoolTransactions.id,
          amount: commissionPoolTransactions.amount,
          currencyCode: commissionPoolTransactions.currencyCode,
          description: commissionPoolTransactions.description,
          transactionType: commissionPoolTransactions.transactionType,
          createdAt: commissionPoolTransactions.createdAt
        })
        .from(commissionPoolTransactions)
        .where(eq(commissionPoolTransactions.sourceId, userId))
        .orderBy(desc(commissionPoolTransactions.createdAt))
        .limit(50);

      res.json(userCommissions);
    } catch (error) {
      console.error("خطأ في جلب عمولات المستخدم:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/commission-pool/transactions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user || user.type !== 'admin') {
        return res.status(403).json({ message: "مسموح للمدراء فقط" });
      }

      const { currencyCode, sourceType, limit, offset } = req.query;
      
      const filters: any = {};
      if (currencyCode && currencyCode !== 'all') filters.currencyCode = currencyCode as string;
      if (sourceType && sourceType !== 'all') filters.sourceType = sourceType as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const transactions = await storage.getCommissionPoolTransactions(filters);
      
      // تحويل البيانات من snake_case إلى camelCase
      const formattedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        sourceType: transaction.sourceType,
        sourceId: transaction.sourceId,
        sourceName: transaction.sourceName,
        currencyCode: transaction.currencyCode,
        amount: transaction.amount,
        transactionType: transaction.transactionType,
        relatedTransactionId: transaction.relatedTransactionId,
        description: transaction.description,
        createdAt: transaction.createdAt
      }));

      res.json(formattedTransactions);
    } catch (error) {
      console.error("خطأ في جلب معاملات حساب العمولات:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });


  // API لحساب عمولة المكتب المستلم حسب الشرائح (للعرض في الواجهة)
  app.post("/api/calculate-receiver-commission", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { receiverOfficeId, amount, currency, senderCity, receiverCity } = req.body;
      
      console.log(`🔍 طلب حساب عمولة مكتب:`, {
        receiverOfficeId,
        amount,
        currency,
        senderCity,
        receiverCity,
        userRequesting: req.user.id
      });
      
      if (!receiverOfficeId || !amount || !currency) {
        return res.status(400).json({ message: "البيانات المطلوبة مفقودة" });
      }
      
      // البحث عن شريحة العمولة المطبقة
      const applicableTier = await storage.findApplicableCityCommission(
        receiverOfficeId,
        Number(amount),
        currency,
        senderCity,
        receiverCity
      );
      
      let commission = 0;
      let source = 'default';
      
      if (applicableTier) {
        // التحقق من نوع العمولة: نسبة في الألف أم ثابتة
        if (applicableTier.perMilleRate) {
          // حساب العمولة كنسبة في الألف
          commission = Number(amount) * (Number(applicableTier.perMilleRate) / 1000);
          source = 'tier_permille';
        } else {
          // عمولة ثابتة
          commission = Number(applicableTier.commission);
          source = 'tier_fixed';
        }
      } else {
        // البحث عن معرف الوكيل المالك للمكتب أولاً
        console.log(`🔍 البحث عن معرف الوكيل للمكتب ${receiverOfficeId}`);
        const office = await db.select().from(agentOffices).where(eq(agentOffices.id, receiverOfficeId)).limit(1);
        
        if (!office || office.length === 0) {
          console.log(`❌ لم يتم العثور على المكتب ${receiverOfficeId}`);
          commission = Number(amount) * 0.015;
          source = 'default_percentage';
        } else {
          const agentId = office[0].agentId;
          console.log(`✅ تم العثور على المكتب ${receiverOfficeId}، معرف الوكيل: ${agentId}`);
          
          // البحث عن إعدادات العمولة الإدارية للوكيل المالك للمكتب
          const receiverCommissionSettings = await storage.getAgentCommissionByCurrency(agentId, currency);
          
          console.log(`🔍 البحث عن إعدادات العمولة للوكيل ${agentId} بالعملة ${currency}:`, receiverCommissionSettings);
        
          if (receiverCommissionSettings) {
            // استخدام إعدادات العمولة الإدارية - الكود يجب أن يستخدم الحقول الصحيحة type و value
            if (receiverCommissionSettings.type === 'percentage') {
              commission = Number(amount) * (Number(receiverCommissionSettings.value) / 100);
              source = 'agent_percentage';
              console.log(`✅ تطبيق عمولة نسبية: ${receiverCommissionSettings.value}% من ${amount} = ${commission} ${currency}`);
            } else if (receiverCommissionSettings.type === 'fixed') {
              commission = Number(receiverCommissionSettings.value);
              source = 'agent_fixed';
              console.log(`✅ تطبيق عمولة ثابتة: ${commission} ${currency}`);
            } else {
              commission = Number(amount) * 0.015;
              source = 'default_percentage';
              console.log(`⚠️ نوع عمولة غير مدعوم، استخدام الافتراضي النسبي: ${commission} ${currency} (1.5% من ${amount})`);
            }
          } else {
            // إذا لم توجد إعدادات إدارية، استخدام العمولة الافتراضية 1.5%
            commission = Number(amount) * 0.015;
            source = 'default_percentage';
            console.log(`⚠️ لم توجد إعدادات عمولة للوكيل ${agentId}، استخدام الافتراضي النسبي: ${commission} ${currency} (1.5% من ${amount})`);
          }
        }
      }
      
      res.json({
        commission: commission.toFixed(2),
        source,
        tierInfo: applicableTier ? {
          minAmount: applicableTier.minAmount,
          maxAmount: applicableTier.maxAmount,
          commission: applicableTier.commission
        } : null
      });
    } catch (error) {
      console.error("خطأ في حساب عمولة المكتب المستلم:", error);
      res.status(500).json({ message: "حدث خطأ في حساب العمولة" });
    }
  });


  app.post("/api/commission-pool/withdraw", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user || user.type !== 'admin') {
        return res.status(403).json({ message: "مسموح للمدراء فقط" });
      }

      const { currencyCode, amount, description } = req.body;

      if (!currencyCode || !amount || !description) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }

      const withdrawalAmount = parseFloat(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: "مبلغ غير صحيح" });
      }

      const withdrawal = await storage.withdrawFromCommissionPool(currencyCode, amount, description);
      
      // تحويل البيانات من snake_case إلى camelCase
      const formattedWithdrawal = {
        id: withdrawal.id,
        sourceType: withdrawal.sourceType,
        sourceId: withdrawal.sourceId,
        sourceName: withdrawal.sourceName,
        currencyCode: withdrawal.currencyCode,
        amount: withdrawal.amount,
        transactionType: withdrawal.transactionType,
        relatedTransactionId: withdrawal.relatedTransactionId,
        description: withdrawal.description,
        createdAt: withdrawal.createdAt
      };

      res.json(formattedWithdrawal);
    } catch (error) {
      console.error("خطأ في سحب من حساب العمولات:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "خطأ في الخادم" });
    }
  });

  // استلام حوالة دولية برمز واحد موحد
  app.post("/api/receive-international-transfer", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== 'agent' && req.user.type !== 'admin') {
        return res.status(403).json({ message: "هذه الخدمة متاحة للمكاتب فقط" });
      }

      const { transferCode } = req.body;

      if (!transferCode) {
        return res.status(400).json({ message: "يرجى إدخال رمز الاستلام" });
      }

      if (transferCode.length < 6) {
        return res.status(400).json({ message: "رمز الاستلام يجب أن يكون على الأقل 6 أرقام" });
      }

      let transfer;
      
      // للمدراء: البحث برمز التحويل الكامل
      if (req.user.type === 'admin') {
        const result = await pool.query(
          "SELECT * FROM international_transfers WHERE transfer_code = $1 AND status = 'pending' LIMIT 1",
          [transferCode]
        );
        transfer = result.rows[0];
      } 
      // للوكلاء: البحث برمز المستلم (6 أرقام)
      else if (req.user.type === 'agent') {
        // التحقق من أن الرمز هو 6 أرقام فقط
        if (transferCode.length !== 6 || !/^\d{6}$/.test(transferCode)) {
          return res.status(400).json({ message: "رمز المستلم يجب أن يكون 6 أرقام بالضبط" });
        }
        
        // العثور على مكتب الوكيل
        const userOffice = await storage.getAgentOfficeByUserId(req.user.id);
        if (!userOffice) {
          return res.status(403).json({ message: "لم يتم العثور على مكتب مرتبط بحسابك" });
        }
        
        const result = await pool.query(
          "SELECT * FROM international_transfers WHERE receiver_code = $1 AND receiving_office_id = $2 AND status = 'pending' LIMIT 1",
          [transferCode, userOffice.id]
        );
        transfer = result.rows[0];
      }
      
      if (!transfer) {
        if (req.user.type === 'admin') {
          return res.status(404).json({ message: "حوالة غير موجودة برمز التحويل المحدد" });
        } else {
          return res.status(404).json({ message: "حوالة غير موجودة برمز المستلم المحدد أو غير مخصصة لمكتبك" });
        }
      }

      // حساب العمولة ومبلغ الاستلام (الحوالة الدولية الجديدة لا تحتوي على عمولة مخصومة مسبقاً)
      const transferAmount = parseFloat(transfer.amount);
      const commissionAmount = 0; // في النظام الجديد لا توجد عمولة مخصومة
      const netAmount = transferAmount; // المبلغ الكامل للمستلم

      // لا نحتاج لخصم من المرسل في النظام الجديد - المبلغ مخصوم مسبقاً عند الإرسال

      // إضافة المبلغ الكامل لرصيد المكتب المستلم
      const currentBalance = await storage.getUserBalance(req.user.id, transfer.currency_code);
      const currentBalanceNum = parseFloat(currentBalance || "0");
      const newBalance = currentBalanceNum + netAmount;
      await storage.setUserBalance(req.user.id, transfer.currency_code, newBalance.toString());
      console.log(`إضافة للمستلم: ${currentBalanceNum} + ${netAmount} = ${newBalance}`);

      // إضافة عمولة النظام إلى حساب العمولات عند الاستلام (وليس عند الإنشاء)
      const systemCommission = parseFloat(transfer.commission || "0");
      if (systemCommission > 0) {
        await storage.addCommissionPoolTransaction({
          sourceType: 'international_transfer',
          sourceId: transfer.id,
          sourceName: `حوالة دولية - ${transfer.sender_name}`,
          currencyCode: transfer.currency_code,
          amount: systemCommission.toString(),
          transactionType: 'credit',
          relatedTransactionId: transfer.id,
          description: `عمولة نظام من حوالة دولية مكتملة - رمز: ${transferCode}`
        });
        console.log(`✅ تم إضافة عمولة النظام ${systemCommission} ${transfer.currency_code} إلى حساب العمولات عند الاستلام`);
      }

      // إنشاء سجل معاملة للمستلم (إضافة)
      await storage.createTransaction({
        userId: req.user.id,
        type: 'international_transfer_receive',
        amount: netAmount.toString(),
        currency: transfer.currency_code,
        description: `استلام حوالة دولية من ${transfer.sender_name} برمز: ${transferCode}`
      });

      // يمكن إضافة الإشعارات لاحقاً بإضافة دالة createNotification إلى storage

      // تحديث حالة الحوالة إلى مكتملة - استعلام مباشر
      await pool.query(
        "UPDATE international_transfers SET status = 'completed', completed_at = NOW() WHERE id = $1",
        [transfer.id]
      );

      res.json({
        message: "تم استلام الحوالة الدولية بنجاح",
        transfer: {
          id: transfer.id,
          amount: transfer.amount,
          currencyCode: transfer.currency_code,
          senderName: transfer.sender_name,
          receiverName: transfer.receiver_name,
          commissionAmount: "0", // لا توجد عمولة في النظام المبسط
          netAmount: netAmount.toString(),
          originCountry: transfer.origin_country
        }
      });

    } catch (error) {
      console.error("خطأ في استلام الحوالة الدولية:", error);
      res.status(500).json({ message: "حدث خطأ أثناء محاولة استلام الحوالة" });
    }
  });

  // APIs إدارة الدول ومكاتب الوكلاء (للمدراء)
  
  // جلب جميع الدول (للإدارة)
  app.get("/api/admin/countries", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك" });
      }
      
      const countriesList = await storage.getAllCountries();
      res.json(countriesList);
    } catch (error) {
      console.error("خطأ في جلب الدول:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  // إضافة دولة جديدة
  app.post("/api/admin/countries", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك" });
      }

      const { name, code, currency } = req.body;
      
      if (!name || !code || !currency) {
        return res.status(400).json({ message: "يرجى ملء جميع الحقول" });
      }

      const newCountry = await storage.createCountry({
        name,
        code: code.toUpperCase(),
        currency: currency.toUpperCase(),
        isActive: true
      });

      res.status(201).json(newCountry);
    } catch (error) {
      console.error("خطأ في إضافة الدولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إضافة الدولة" });
    }
  });

  // حذف دولة
  app.delete("/api/admin/countries/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك" });
      }

      const { id } = req.params;
      await storage.deleteCountry(parseInt(id));
      res.json({ message: "تم حذف الدولة بنجاح" });
    } catch (error) {
      console.error("خطأ في حذف الدولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف الدولة" });
    }
  });

  // جلب جميع الدول العامة (للتحويلات الدولية)
  app.get("/api/countries", async (req: Request, res: Response) => {
    try {
      const countries = await storage.getAllCountries();
      console.log("Countries API called, returning:", countries);
      res.json(countries);
    } catch (error) {
      console.error("خطأ في جلب الدول:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  // جلب المدن حسب الدولة (لنموذج التسجيل)
  app.get("/api/countries/:countryId/cities", async (req: Request, res: Response) => {
    try {
      const { countryId } = req.params;
      const countries = await storage.getCities(parseInt(countryId));
      console.log(`Cities API called for country ${countryId}, returning:`, countries);
      res.json(countries);
    } catch (error) {
      console.error("خطأ في جلب المدن:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب المدن" });
    }
  });

  // جلب الدول المعتمدة للتحويل الدولي (التي لديها مكاتب فعلية)
  app.get("/api/countries/international", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const currentUserId = req.user.id;
      
      // 🇱🇾 التحقق من دولة المستخدم الحالي لتطبيق قيود التحويل بين المكاتب الليبية
      // تحديد الليبية من جنسية المستخدم وليس من مكاتبه
      let isCurrentUserLibyan = false;
      try {
        const libyanCheckResult = await db.execute(sql`
          SELECT (u.country_id = 1 OR u.country_name = 'ليبيا') AS is_libyan
          FROM users u
          WHERE u.id = ${currentUserId}
        `);
        
        isCurrentUserLibyan = libyanCheckResult.rows[0]?.is_libyan || false;
        console.log(`🌍 User ${currentUserId} has LY office: ${isCurrentUserLibyan}`);
        
        if (isCurrentUserLibyan) {
          console.log(`🚫 Libyan user ${currentUserId}: Libya excluded from international transfer countries`);
        }
      } catch (error) {
        console.error('🚨 Could not determine user country, applying strict policy - excluding Libya for safety:', error);
        // إعتماد سياسة أمنية صارمة: منع ليبيا عند عدم التأكد
        isCurrentUserLibyan = true; // اعتبار المستخدم ليبي للأمان
      }
      
      // جلب الدول التي لديها مكاتب نشطة ومعتمدة للتحويل الدولي
      // تم التحديث: التجميع حسب جنسية مالك المكتب وليس موقع المكتب
      const whereClause = isCurrentUserLibyan ? sql`AND u.country_name != 'ليبيا'` : sql``;
      
      const result = await db.execute(sql`
        SELECT DISTINCT 
          u.country_name as name,
          COUNT(ao.id) as office_count
        FROM users u
        INNER JOIN agent_offices ao ON u.id = ao.agent_id
        WHERE ao.is_active = true 
          AND u.ext_transfer_enabled = true
          AND u.country_name IS NOT NULL
          ${whereClause}
        GROUP BY u.country_name
        ORDER BY u.country_name
      `);
      
      // تحويل البيانات لتتطابق مع نوع Country في الفرونت-إند
      const countries = result.rows.map((row: any) => ({
        name: row.name,
        officeCount: Number(row.office_count)
      }));
      
      if (isCurrentUserLibyan) {
        console.log(`🚫 Libyan user ${currentUserId}: Libya excluded from international transfer countries`);
      }
      
      res.json(countries);
    } catch (error) {
      console.error("Error fetching international countries:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  // حساب العمولة للتحويلات الدولية (quote system)
  app.get("/api/inter-office-transfers/quote", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { amount, currency, receiverOfficeId } = req.query;
      const currentUserId = req.user.id;
      
      if (!amount || !currency || !receiverOfficeId) {
        return res.status(400).json({ 
          message: "يجب تقديم المبلغ والعملة ومعرف المكتب المستلم" 
        });
      }
      
      const transferAmount = parseFloat(amount as string);
      if (transferAmount <= 0) {
        return res.status(400).json({ message: "المبلغ يجب أن يكون أكبر من الصفر" });
      }
      
      // التحقق من وجود المكتب المستلم
      const receiverOffice = await storage.getAgentOffice(parseInt(receiverOfficeId as string));
      if (!receiverOffice || !receiverOffice.isActive) {
        return res.status(404).json({ message: "المكتب المستلم غير موجود أو غير نشط" });
      }
      
      console.log(`💰 حساب عمولة التحويل الدولي: ${amount} ${currency} إلى المكتب ${receiverOffice.officeName}`);
      
      // حساب العمولة باستخدام نفس المنطق الموجود في POST /api/inter-office-transfers
      let systemCommission = 0;
      let commissionType = 'default';
      
      try {
        // جلب إعدادات العمولة للتحويلات الدولية
        const systemCommissionRate = await storage.getSystemCommissionRate('international', currency as string);
        if (systemCommissionRate && systemCommissionRate.isActive) {
          
          if (systemCommissionRate.fixedAmount && parseFloat(systemCommissionRate.fixedAmount) > 0) {
            systemCommission = parseFloat(systemCommissionRate.fixedAmount);
            commissionType = 'fixed';
            console.log(`💰 استخدام العمولة الثابتة: ${systemCommission} ${currency}`);
          }
          else if (systemCommissionRate.perMilleRate && parseFloat(systemCommissionRate.perMilleRate) > 0) {
            systemCommission = transferAmount * parseFloat(systemCommissionRate.perMilleRate);
            commissionType = 'per_mille';
            console.log(`💰 استخدام نسبة العمولة في الألف: ${(parseFloat(systemCommissionRate.perMilleRate) * 1000).toFixed(1)}‰`);
          } 
          else if (systemCommissionRate.commissionRate && parseFloat(systemCommissionRate.commissionRate) > 0) {
            systemCommission = transferAmount * parseFloat(systemCommissionRate.commissionRate);
            commissionType = 'percentage';
            console.log(`💰 استخدام نسبة العمولة المئوية: ${(parseFloat(systemCommissionRate.commissionRate) * 100).toFixed(2)}%`);
          }
          else {
            // استخدام النسبة الافتراضية 1.5%
            systemCommission = transferAmount * 0.015;
            commissionType = 'default';
            console.log(`💰 استخدام العمولة الافتراضية: 1.5%`);
          }
        } else {
          // استخدام النسبة الافتراضية 1.5%
          systemCommission = transferAmount * 0.015;
          commissionType = 'default';
          console.log(`💰 لا توجد إعدادات عمولة، استخدام الافتراضية: 1.5%`);
        }
      } catch (error) {
        console.error("خطأ في جلب نسبة العمولة، استخدام الافتراضية:", error);
        systemCommission = transferAmount * 0.015;
        commissionType = 'default';
      }
      
      // حساب عمولة المكتب المستلم (نفس المنطق الموجود في endpoint الإرسال)
      let receiverCommissionAmount = 0;
      const receiverOfficeIdNum = parseInt(receiverOfficeId as string);
      const receiverAgentId = receiverOffice.agentId;
      
      // أولاً البحث عن شريحة العمولة المطبقة للمكتب المستلم
      const applicableTier = await storage.findApplicableCityCommission(
        receiverOfficeIdNum,
        transferAmount,
        currency as string,
        req.user.city,
        receiverOffice.city
      );
      
      if (applicableTier) {
        // استخدام قيمة العمولة من الشريحة المطبقة
        receiverCommissionAmount = Number(applicableTier.commission);
        console.log(`💰 عرض الأسعار: تطبيق عمولة شريحة ${applicableTier.commission} ${currency} للمكتب ${receiverOffice.officeName}`);
      } else {
        // البحث عن إعدادات العمولة الإدارية للوكيل المستلم (استخدام agent_id وليس office_id)
        const receiverCommissionSettings = await storage.getAgentCommissionByCurrency(receiverAgentId, currency as string);
        
        if (receiverCommissionSettings) {
          // استخدام إعدادات العمولة الإدارية
          let rate = 0;
          if (receiverCommissionSettings.type === 'percentage') {
            rate = Number(receiverCommissionSettings.value) / 100;
            receiverCommissionAmount = transferAmount * rate;
          } else if (receiverCommissionSettings.type === 'fixed') {
            receiverCommissionAmount = Number(receiverCommissionSettings.value);
          }
          
          console.log(`💰 عرض الأسعار: تطبيق إعدادات عمولة المكتب الإدارية ${receiverCommissionSettings.type === 'percentage' ? (rate * 100 + '%') : 'ثابت'} = ${receiverCommissionAmount} ${currency} للمكتب ${receiverOffice.officeName}`);
        } else {
          // إذا لم توجد شريحة مناسبة ولا إعدادات إدارية، استخدام العمولة الافتراضية 1.5%
          const defaultCommissionRate = 0.015; // 1.5%
          receiverCommissionAmount = transferAmount * defaultCommissionRate;
          console.log(`💰 عرض الأسعار: استخدام العمولة الافتراضية 1.5% = ${receiverCommissionAmount} ${currency} (لا توجد شرائح ولا إعدادات)`);
        }
      }
      
      const totalAmount = transferAmount + systemCommission + receiverCommissionAmount;
      
      console.log(`💰 نتيجة حساب العمولة: المبلغ=${transferAmount}, عمولة النظام=${systemCommission.toFixed(6)}, عمولة المكتب=${receiverCommissionAmount.toFixed(6)}, المجموع=${totalAmount.toFixed(6)} ${currency}`);
      
      res.json({
        amount: transferAmount,
        systemCommission: parseFloat(systemCommission.toFixed(6)),
        receiverCommission: parseFloat(receiverCommissionAmount.toFixed(6)),
        commission: parseFloat(systemCommission.toFixed(6)), // للتوافق مع النظام القديم
        total: parseFloat(totalAmount.toFixed(6)),
        currency: currency,
        commissionType: commissionType,
        receiverOffice: {
          id: receiverOffice.id,
          name: receiverOffice.officeName,
          agentName: receiverOffice.agentName || 'غير محدد',
          city: receiverOffice.city
        }
      });
      
    } catch (error) {
      console.error("خطأ في حساب عمولة التحويل الدولي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حساب العمولة" });
    }
  });

  // جلب مكاتب الوكلاء حسب الدولة (للتحويلات الدولية فقط)
  app.get("/api/agent-offices", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { country, all } = req.query;
      const currentUserId = req.user.id;
      
      // السماح لجميع المستخدمين المصادق عليهم بالوصول لقائمة المكاتب للتحويل الدولي
      console.log(`✅ User ${currentUserId} (${req.user?.type}) accessing agent offices list`);
      
      // 🇱🇾 التحقق من دولة المستخدم الحالي لتطبيق قيود التحويل بين المكاتب الليبية
      // تحديد الليبية من جنسية المستخدم وليس من مكاتبه
      let isCurrentUserLibyan = false;
      try {
        const libyanCheckResult = await db.execute(sql`
          SELECT (u.country_id = 1 OR u.country_name = 'ليبيا') AS is_libyan
          FROM users u
          WHERE u.id = ${currentUserId}
        `);
        
        isCurrentUserLibyan = libyanCheckResult.rows[0]?.is_libyan || false;
        console.log(`🌍 User ${currentUserId} has LY office: ${isCurrentUserLibyan}`);
        
        if (isCurrentUserLibyan) {
          console.log(`🚫 Libyan user ${currentUserId}: LY offices excluded from agent offices list`);
        }
      } catch (error) {
        console.error('🚨 Could not determine user country for offices, applying strict policy - excluding Libya for safety:', error);
        // إعتماد سياسة أمنية صارمة: منع ليبيا عند عدم التأكد
        isCurrentUserLibyan = true; // اعتبار المستخدم ليبي للأمان
      }
      
      // جلب بيانات المستخدم الحالي للتحقق من دولته
      const currentUser = await storage.getUser(currentUserId);
      
      // إذا كان الطلب لجلب جميع المكاتب
      if (all === 'true') {
        const libyanOfficeFilter = isCurrentUserLibyan ? sql`AND ao.country_code != 'LY'` : sql``;
        
        const result = await db.execute(sql`
          SELECT 
            ao.*,
            u.full_name as agent_name,
            u.ext_transfer_enabled,
            u.ext_daily_limit,
            u.ext_monthly_limit,
            u.country_name as owner_nationality
          FROM agent_offices ao
          INNER JOIN users u ON ao.agent_id = u.id
          WHERE ao.is_active = true 
            AND u.ext_transfer_enabled = true
            AND (u.ext_daily_limit > 0 OR u.ext_monthly_limit > 0)
            AND ao.agent_id != ${currentUserId}
            ${libyanOfficeFilter}
          ORDER BY ao.office_name
        `);
        
        if (isCurrentUserLibyan) {
          console.log(`🚫 Libyan user ${currentUserId}: Libyan offices excluded from all offices list`);
        }
        
        // تحويل البيانات من snake_case إلى camelCase للواجهة الأمامية
        const formattedAllOffices = result.rows.map(office => ({
          id: office.id,
          agentId: office.agent_id,
          countryCode: office.country_code,
          city: office.city,
          officeCode: office.office_code,
          officeName: office.office_name,
          contactInfo: office.contact_info,
          address: office.address,
          isActive: office.is_active,
          createdAt: office.created_at,
          commissionRate: office.commission_rate,
          userId: office.user_id,
          agentName: office.agent_name,
          extTransferEnabled: office.ext_transfer_enabled,
          ownerNationality: office.owner_nationality
        }));
        
        return res.json(formattedAllOffices);
      }
      
      console.log(`🌍 Request from user ${currentUserId} for offices in country: ${country}`);
      
      if (country) {
        // 🇱🇾 منع المستخدمين الليبيين من طلب مكاتب ليبية مباشرة
        if (isCurrentUserLibyan && country === 'LY') {
          console.log(`🚫 Libyan user ${currentUserId} tried to access Libyan offices - blocked`);
          return res.json([]); // إرجاع قائمة فارغة
        }
        
        // 🔍 البحث عن المكاتب مع التحقق من ترخيص الحوالات الدولية
        console.log(`🔍 Fetching offices with international transfer permission for country: ${country}`);
        
        // استخدام SQL مباشر للانضمام مع جدول المستخدمين والتحقق من extTransferEnabled
        // والتأكد من وجود حدود مالية صالحة للتحويل الخارجي
        // استثناء المكتب الخاص بالمستخدم الحالي لمنع التحويل لنفس المكتب
        const result = await db.execute(sql`
          SELECT 
            ao.*,
            u.full_name as agent_name,
            u.ext_transfer_enabled,
            u.ext_daily_limit,
            u.ext_monthly_limit,
            u.country_name as owner_nationality
          FROM agent_offices ao
          INNER JOIN users u ON ao.agent_id = u.id
          WHERE u.country_name = ${country}
            AND ao.is_active = true 
            AND u.ext_transfer_enabled = true
            AND (u.ext_daily_limit > 0 OR u.ext_monthly_limit > 0)
            AND ao.agent_id != ${currentUserId}
          ORDER BY ao.office_name
        `);
        const officesWithPermission = result.rows;
        
        console.log(`🎯 Found ${officesWithPermission.length} offices with international transfer permission in ${country}`);
        console.log('📋 Offices details:', officesWithPermission.map(office => ({
          id: office.id,
          officeName: office.office_name,
          agentName: office.agent_name,
          extTransferEnabled: office.ext_transfer_enabled,
          agentId: office.agent_id,
          currentUserId: currentUserId
        })));
        
        if (officesWithPermission.length === 0) {
          console.log(`⚠️ No offices found for country ${country}. This might indicate:
          1. No offices exist in this country
          2. All offices are owned by the current user (${currentUserId})
          3. Offices exist but don't have extTransferEnabled=true
          4. Database issues`);
        }
        
        // تحويل البيانات من snake_case إلى camelCase للواجهة الأمامية
        const formattedOffices = officesWithPermission.map(office => ({
          id: office.id,
          agentId: office.agent_id,
          countryCode: office.country_code,
          city: office.city,
          officeCode: office.office_code,
          officeName: office.office_name,
          contactInfo: office.contact_info,
          address: office.address,
          isActive: office.is_active,
          createdAt: office.created_at,
          commissionRate: office.commission_rate,
          userId: office.user_id,
          agentName: office.agent_name,
          extTransferEnabled: office.ext_transfer_enabled,
          ownerNationality: office.owner_nationality
        }));
        
        res.json(formattedOffices);
      } else {
        // جلب جميع المكاتب مع ترخيص الحوالات الدولية
        console.log(`🌐 Fetching all offices with international transfer permission`);
        
        const libyanOfficeFilter = isCurrentUserLibyan ? sql`AND ao.country_code != 'LY'` : sql``;
        
        const result = await db.execute(sql`
          SELECT 
            ao.*,
            u.full_name as agent_name,
            u.ext_transfer_enabled,
            u.country_name as owner_nationality
          FROM agent_offices ao
          INNER JOIN users u ON ao.agent_id = u.id
          INNER JOIN upgrade_requests ur ON u.id = ur.user_id
          WHERE ao.is_active = true 
            AND u.ext_transfer_enabled = true
            AND ur.request_type = 'external_transfer'
            AND ur.status = 'approved'
            ${libyanOfficeFilter}
          ORDER BY ao.country_code, ao.office_name
        `);
        const allOfficesWithPermission = result.rows;
        
        if (isCurrentUserLibyan) {
          console.log(`🚫 Libyan user ${currentUserId}: Libyan offices excluded from general offices list`);
        }
        
        console.log(`🎯 Found ${allOfficesWithPermission.length} total offices with international transfer permission`);
        
        // تحويل البيانات من snake_case إلى camelCase للواجهة الأمامية
        const formattedOffices = allOfficesWithPermission.map(office => ({
          id: office.id,
          agentId: office.agent_id,
          countryCode: office.country_code,
          city: office.city,
          officeCode: office.office_code,
          officeName: office.office_name,
          contactInfo: office.contact_info,
          address: office.address,
          isActive: office.is_active,
          createdAt: office.created_at,
          commissionRate: office.commission_rate,
          userId: office.user_id,
          agentName: office.agent_name,
          extTransferEnabled: office.ext_transfer_enabled,
          ownerNationality: office.owner_nationality
        }));
        
        res.json(formattedOffices);
      }
    } catch (error) {
      console.error("❌ خطأ في جلب مكاتب الوكلاء:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  // جلب جميع مكاتب الوكلاء (للإدارة)
  app.get("/api/admin/agent-offices", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك" });
      }
      
      const offices = await storage.getAllAgentOffices();
      res.json(offices);
    } catch (error) {
      console.error("خطأ في جلب مكاتب الوكلاء:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  // جلب المستخدمين الذين لديهم حسابات مكاتب صرافة
  app.get("/api/users/exchange-office-users", authMiddleware, async (req: AuthRequest, res: Response) => {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ message: "غير مصرح لك بالوصول" });
    }

    try {
      const users = await storage.getExchangeOfficeUsers();
      console.log("Exchange office users found:", users);
      res.json(users);
    } catch (error) {
      console.error("خطأ في جلب مستخدمي مكاتب الصرافة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب المستخدمين" });
    }
  });

  // إضافة مكتب وكيل جديد
  app.post("/api/admin/agent-offices", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك" });
      }

      const { agentId, countryCode, city, officeCode, officeName, contactInfo, address } = req.body;
      
      console.log("Creating office with data:", { agentId, countryCode, city, officeCode, officeName, contactInfo, address });
      
      if (!agentId || !countryCode || !city || !officeCode || !officeName || !contactInfo || !address) {
        return res.status(400).json({ message: "يرجى ملء جميع الحقول" });
      }

      // استخدام معرف الوكيل المرسل من النموذج
      const newOffice = await storage.createAgentOffice({
        agentId: parseInt(agentId),
        countryCode: countryCode.toUpperCase(),
        city,
        officeCode: officeCode.toUpperCase(),
        officeName,
        contactInfo,
        address,
        isActive: true
      });
      
      console.log("Office created successfully:", newOffice);

      res.status(201).json(newOffice);
    } catch (error: any) {
      console.error("خطأ في إضافة مكتب الوكيل:", error);
      
      // التحقق من نوع الخطأ - duplicate office code
      if (error.code === '23505' && error.constraint === 'agent_offices_office_code_key') {
        return res.status(409).json({ 
          message: "رمز المكتب مستخدم مسبقاً. يرجى استخدام رمز مختلف." 
        });
      }
      
      // التحقق من نوع الخطأ - country not found
      if (error.code === '23503' && error.constraint === 'agent_offices_country_code_fkey') {
        return res.status(400).json({ 
          message: "الدولة المختارة غير موجودة. يرجى إضافة الدولة أولاً من قائمة الدول." 
        });
      }
      
      res.status(500).json({ message: "حدث خطأ أثناء إضافة مكتب الوكيل" });
    }
  });

  // حذف مكتب وكيل
  app.delete("/api/admin/agent-offices/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك" });
      }

      const { id } = req.params;
      await storage.deleteAgentOffice(parseInt(id));
      res.json({ message: "تم حذف مكتب الوكيل بنجاح" });
    } catch (error: any) {
      console.error("خطأ في حذف مكتب الوكيل:", error);
      
      // التحقق من نوع الخطأ - foreign key constraint
      if (error.code === '23503') {
        return res.status(409).json({ 
          message: "لا يمكن حذف هذا المكتب لأنه مرتبط بتحويلات موجودة. يرجى حذف التحويلات أولاً أو إلغاء تفعيل المكتب." 
        });
      }
      
      res.status(500).json({ message: "حدث خطأ أثناء حذف مكتب الوكيل" });
    }
  });

  // ===== واجهات برمجة التطبيق لإعدادات استقبال الحوالات =====
  
  // جلب إعدادات استقبال الحوالات للمستخدم
  app.get("/api/user-receive-settings", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const settings = await storage.getUserReceiveSettings(req.user.id);
      
      // إضافة معلومات الدولة لكل إعداد
      const settingsWithCountryInfo = await Promise.all(
        settings.map(async (setting) => {
          const country = await storage.getCountryById(setting.countryId);
          return {
            ...setting,
            countryName: country?.name || "غير محدد",
            countryCurrency: country?.currency || "",
          };
        })
      );
      
      res.json(settingsWithCountryInfo);
    } catch (error) {
      console.error("خطأ في جلب إعدادات الاستقبال:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الإعدادات" });
    }
  });

  // إضافة إعدادات استقبال جديدة
  app.post("/api/user-receive-settings", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { countryId, commissionRate } = req.body;
      
      if (!countryId || commissionRate === undefined) {
        return res.status(400).json({ message: "يرجى إدخال جميع البيانات المطلوبة" });
      }

      // التحقق من عدم وجود إعدادات مسبقة لنفس الدولة
      const existingSettings = await storage.getUserReceiveSettingsByCountry(req.user.id, countryId);
      if (existingSettings) {
        return res.status(400).json({ message: "لديك إعدادات مسبقة لهذه الدولة" });
      }

      const newSettings = await storage.createUserReceiveSettings({
        userId: req.user.id,
        countryId,
        commissionRate: commissionRate.toString(),
      });

      res.status(201).json(newSettings);
    } catch (error) {
      console.error("خطأ في إضافة إعدادات الاستقبال:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إضافة الإعدادات" });
    }
  });

  // تحديث إعدادات استقبال
  app.put("/api/user-receive-settings/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const settingsId = parseInt(req.params.id);
      const { countryId, commissionRate } = req.body;
      
      if (!settingsId || !countryId || commissionRate === undefined) {
        return res.status(400).json({ message: "يرجى إدخال جميع البيانات المطلوبة" });
      }

      const updatedSettings = await storage.updateUserReceiveSettings(settingsId, {
        countryId,
        commissionRate: commissionRate.toString(),
      });

      res.json(updatedSettings);
    } catch (error) {
      console.error("خطأ في تحديث إعدادات الاستقبال:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث الإعدادات" });
    }
  });

  // حذف إعدادات استقبال
  app.delete("/api/user-receive-settings/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const settingsId = parseInt(req.params.id);
      
      if (!settingsId) {
        return res.status(400).json({ message: "معرف الإعدادات غير صحيح" });
      }

      await storage.deleteUserReceiveSettings(settingsId);
      res.json({ message: "تم حذف الإعدادات بنجاح" });
    } catch (error) {
      console.error("خطأ في حذف إعدادات الاستقبال:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف الإعدادات" });
    }
  });

  // جلب المستخدمين الذين لديهم إعدادات استقبال حوالات
  app.get("/api/users-with-receive-settings", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const usersWithSettings = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          accountNumber: users.accountNumber,
          commissionRate: userReceiveSettings.commissionRate,
          countryId: userReceiveSettings.countryId,
          countryName: countries.name,
          countryCurrency: countries.currency,
        })
        .from(userReceiveSettings)
        .innerJoin(users, eq(userReceiveSettings.userId, users.id))
        .innerJoin(countries, eq(userReceiveSettings.countryId, countries.id))
        .where(eq(userReceiveSettings.isActive, true));

      res.json(usersWithSettings);
    } catch (error) {
      console.error("خطأ في جلب المستخدمين مع إعدادات الاستقبال:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  // API endpoints للحوالات الدولية الجديدة - نظام التجميد والخصم
  
  // حساب تكلفة الحوالة الدولية
  app.post("/api/international-transfer/calculate-costs", authMiddleware, async (req, res) => {
    try {
      const { amountOriginal, currencyCode } = req.body;
      
      if (!amountOriginal || !currencyCode) {
        return res.status(400).json({ message: "المبلغ والعملة مطلوبان" });
      }
      
      const amount = parseFloat(amountOriginal);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "المبلغ غير صحيح" });
      }
      
      const costs = await storage.calculateInternationalTransferCosts(amount, currencyCode);
      
      res.json({
        amountOriginal: amount,
        ...costs
      });
    } catch (error) {
      console.error("خطأ في حساب تكلفة الحوالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حساب التكلفة" });
    }
  });

  // إنشاء حوالة دولية جديدة
  app.post("/api/international-transfer/create", authMiddleware, async (req, res) => {
    console.log("🌟 نقطة النهاية الصحيحة! /api/international-transfer/create");
    console.log("📝 بيانات الطلب:", req.body);
    try {
      const user = req.user as any;
      const { receiverOfficeId, currencyCode, amountOriginal, note } = req.body;
      
      if (!receiverOfficeId || !currencyCode || !amountOriginal) {
        return res.status(400).json({ message: "جميع البيانات مطلوبة" });
      }
      
      const amount = parseFloat(amountOriginal);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "المبلغ غير صحيح" });
      }
      
      // التحقق من صلاحيات التحويل الخارجي (تعتبر جميع التحويلات الدولية خارجية)
      console.log("International transfer detected, checking external transfer permissions...");
      
      const limits = await storage.getUserExternalTransferLimits(user.id);
      if (!limits || !limits.extTransferEnabled) {
        return res.status(403).json({ 
          message: "التحويل الخارجي غير مفعل لحسابك. يرجى تقديم طلب ترقية من لوحة الطلبات.",
          code: "EXTERNAL_TRANSFER_DISABLED"
        });
      }
      
      // التحقق من العملة المسموحة
      if (limits.extAllowedCurrencies && !limits.extAllowedCurrencies.includes(currencyCode)) {
        return res.status(403).json({
          message: `العملة ${currencyCode} غير مسموحة للتحويل الخارجي`,
          allowedCurrencies: limits.extAllowedCurrencies
        });
      }
      
      // التحقق من الحد اليومي
      const dailyUsed = await storage.getUserDailyTransferAmount(user.id, currencyCode);
      const dailyLimit = parseFloat(limits.extDailyLimit || "0");
      
      console.log(`💰 تحقق السقف اليومي: المستخدم ${dailyUsed.toFixed(2)} + الحالي ${amount} = ${(dailyUsed + amount).toFixed(2)} من أصل ${dailyLimit} ${currencyCode}`);
      
      if (dailyUsed + amount > dailyLimit) {
        return res.status(403).json({
          message: `تجاوز الحد اليومي المسموح. 
            
📊 التفاصيل:
• السقف اليومي المسموح: ${dailyLimit} ${currencyCode}
• المبلغ المُستخدم اليوم: ${dailyUsed.toFixed(2)} ${currencyCode}
• التحويل الحالي: ${amount} ${currencyCode}
• المجموع النهائي: ${(dailyUsed + amount).toFixed(2)} ${currencyCode}

💡 ملاحظة: السقف اليومي هو مجموع كل التحويلات اليومية وليس لكل تحويل منفرد.`,
          dailyLimit,
          dailyUsed,
          currentTransfer: amount,
          totalWouldBe: dailyUsed + amount
        });
      }
      
      // التحقق من الحد الشهري
      const monthlyUsed = await storage.getUserMonthlyTransferAmount(user.id, currencyCode);
      const monthlyLimit = parseFloat(limits.extMonthlyLimit || "0");
      
      console.log(`📅 تحقق السقف الشهري: المستخدم ${monthlyUsed.toFixed(2)} + الحالي ${amount} = ${(monthlyUsed + amount).toFixed(2)} من أصل ${monthlyLimit} ${currencyCode}`);
      
      if (monthlyUsed + amount > monthlyLimit) {
        return res.status(403).json({
          message: `تجاوز الحد الشهري المسموح. 
            
📊 التفاصيل:
• السقف الشهري المسموح: ${monthlyLimit} ${currencyCode}
• المبلغ المُستخدم هذا الشهر: ${monthlyUsed.toFixed(2)} ${currencyCode}
• التحويل الحالي: ${amount} ${currencyCode}
• المجموع النهائي: ${(monthlyUsed + amount).toFixed(2)} ${currencyCode}

💡 ملاحظة: السقف الشهري هو مجموع كل التحويلات الشهرية وليس لكل تحويل منفرد.`,
          monthlyLimit,
          monthlyUsed,
          currentTransfer: amount,
          totalWouldBe: monthlyUsed + amount
        });
      }
      
      console.log("External transfer permissions verified successfully for international transfer");
      
      // التحقق من رصيد المرسل
      const userBalance = await storage.getUserBalance(user.id, currencyCode);
      const currentBalance = parseFloat(userBalance?.amount || "0");
      
      if (currentBalance < amount) {
        return res.status(400).json({ message: "الرصيد غير كافٍ" });
      }
      
      // حساب التكاليف
      const costs = await storage.calculateInternationalTransferCosts(amount, currencyCode);
      
      // توليد رمز التحويل
      const transferCode = await storage.generateInternationalTransferCode();
      
      // إنشاء الحوالة
      const newTransfer = await storage.createInternationalTransferNew({
        senderAgentId: user.id,
        receiverOfficeId: parseInt(receiverOfficeId),
        currencyCode,
        amountOriginal: amount.toString(),
        commissionSystem: costs.commissionSystem.toString(),
        commissionRecipient: costs.commissionRecipient.toString(),
        amountPending: costs.amountPending.toString(),
        transferCode,
        note: note || null
      });
      
      // خصم المبلغ الكامل من رصيد المرسل (الحوالة + عمولة المستلم + عمولة النظام)
      // جميع المبالغ معلقة حتى الاستلام أو الإلغاء
      const totalAmountToDeduct = amount; // المبلغ الأصلي كاملاً
      const newBalance = currentBalance - totalAmountToDeduct;
      await storage.setUserBalance(user.id, currencyCode, newBalance.toString());
      
      console.log(`💰 تم تعليق الحوالة كاملة ${amount} ${currencyCode} (${costs.amountPending} + ${costs.commissionRecipient} + ${costs.commissionSystem}) - معلقة حتى الاستلام أو الإلغاء`);
      
      // إضافة معاملة للمرسل (خصم المبلغ الكامل)
      await storage.createTransaction({
        userId: user.id,
        type: 'international_transfer_new_out',
        amount: totalAmountToDeduct.toString(),
        currency: currencyCode,
        description: `حوالة دولية معلقة - رمز: ${transferCode} (الحوالة: ${costs.amountPending}, عمولة المستلم: ${costs.commissionRecipient}, عمولة النظام: ${costs.commissionSystem})`
      });
      
      // ملاحظة: عمولة النظام معلقة ولن تدخل في حساب العمولات حتى يتم استلام الحوالة
      
      // منح نقاط للحوالة الدولية
      try {
        const settings = await rewardsService.getSettings();
        await rewardsService.awardPoints({
          userId: user.id,
          points: settings.internationalTransferPoints,
          action: 'international_transfer',
          description: `International transfer: ${amount} ${currencyCode}`,
          descriptionAr: `حوالة دولية: ${amount} ${currencyCode}`,
          referenceId: transferCode,
          referenceType: 'international_transfer',
        });
        console.log(`✅ تم منح ${settings.internationalTransferPoints} نقطة للمستخدم ${user.id} للحوالة الدولية`);
      } catch (error) {
        console.error('خطأ في منح النقاط للحوالة الدولية:', error);
      }

      res.status(201).json({
        transferCode,
        message: "تم إنشاء الحوالة الدولية بنجاح"
      });
    } catch (error) {
      console.error("خطأ في إنشاء الحوالة الدولية:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء الحوالة" });
    }
  });

  // البحث عن حوالة دولية برمز التحويل
  app.post("/api/international-transfer/search", authMiddleware, async (req, res) => {
    try {
      const { transferCode } = req.body;
      
      if (!transferCode) {
        return res.status(400).json({ message: "رمز التحويل مطلوب" });
      }
      
      const transfer = await storage.getInternationalTransferNewByCode(transferCode);
      
      if (!transfer) {
        return res.status(404).json({ message: "لم يتم العثور على حوالة بهذا الرمز" });
      }
      
      if (transfer.status !== 'pending') {
        return res.status(400).json({ message: "هذه الحوالة تم استلامها مسبقاً" });
      }
      
      res.json(transfer);
    } catch (error) {
      console.error("خطأ في البحث عن الحوالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء البحث عن الحوالة" });
    }
  });

  // تأكيد استلام الحوالة الدولية
  app.post("/api/international-transfer/receive", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      const { transferCode } = req.body;
      
      if (!transferCode) {
        return res.status(400).json({ message: "رمز التحويل مطلوب" });
      }
      
      const transfer = await storage.getInternationalTransferNewByCode(transferCode);
      
      if (!transfer) {
        return res.status(404).json({ message: "لم يتم العثور على حوالة بهذا الرمز" });
      }
      
      if (transfer.status !== 'pending') {
        return res.status(400).json({ message: "هذه الحوالة تم استلامها مسبقاً" });
      }
      
      // التحقق من أن المستخدم هو المكتب المستقبل
      if (transfer.receiverOfficeId !== user.id) {
        return res.status(403).json({ message: "ليس لديك صلاحية لاستلام هذه الحوالة" });
      }
      
      // تأكيد استلام الحوالة
      await storage.confirmInternationalTransferNew(transferCode, user.id);
      
      // إضافة الحوالة + عمولة المستلم لرصيد المستلم
      const receiverBalance = await storage.getUserBalance(user.id, transfer.currencyCode);
      const currentBalance = parseFloat(receiverBalance?.amount || "0");
      const amountForReceiver = parseFloat(transfer.amountPending) + parseFloat(transfer.commissionRecipient);
      const newBalance = currentBalance + amountForReceiver;
      
      await storage.setUserBalance(user.id, transfer.currencyCode, newBalance.toString());
      
      // إضافة عمولة النظام المعلقة إلى حساب العمولات (مع خصم مكافأة الإحالة إن وجدت)
      const systemCommission = parseFloat(transfer.commissionSystem);
      if (systemCommission > 0) {
        // فحص مكافأة الإحالة وخصمها من عمولة النظام
        const { allocateFixedReferralReward } = await import('./referral-system');
        const operationType = transfer.currencyCode === 'LYD' ? 'transfer_lyd' : 'transfer_usd';
        console.log(`🎁 فحص مكافأة الإحالة للمرسل ${transfer.senderAgentId} في التحويل الدولي`);
        
        const referralResult = await allocateFixedReferralReward(
          transfer.id,
          operationType,
          systemCommission,
          transfer.currencyCode,
          transfer.senderAgentId // المستخدم المُحال هو المرسل
        );

        // إضافة صافي عمولة النظام (بعد خصم مكافأة الإحالة) إلى حساب العمولات
        const netSystemCommission = referralResult.netSystemCommission;
        if (netSystemCommission > 0) {
          await storage.addCommissionPoolTransaction({
            sourceType: 'international_transfer',
            sourceId: transfer.id,
            sourceName: `حوالة دولية - رمز: ${transferCode}`,
            currencyCode: transfer.currencyCode,
            amount: netSystemCommission.toString(),
            transactionType: 'credit',
            relatedTransactionId: null,
            description: referralResult.hasReferral 
              ? `عمولة نظام (بعد خصم مكافأة إحالة ${referralResult.rewardAmount}) - رمز: ${transferCode}`
              : `عمولة نظام من حوالة دولية مؤكدة - رمز: ${transferCode}`
          });
          console.log(`✅ تم إضافة صافي عمولة النظام ${netSystemCommission} ${transfer.currencyCode} (أصلية: ${systemCommission}, مكافأة إحالة: ${referralResult.rewardAmount})`);
        }
      }

      // إضافة عمولة المكتب المستلم إلى حساب العمولات الخاص به
      const recipientCommission = parseFloat(transfer.commissionRecipient);
      if (recipientCommission > 0) {
        console.log(`💼 إضافة عمولة المكتب ${recipientCommission} ${transfer.currencyCode} لحساب المكتب ${user.id}`);
        await storage.addAgentCommission(
          user.id,
          recipientCommission,
          transfer.currencyCode,
          `عمولة استلام حوالة دولية - ${transferCode}`
        );
      }
      
      // إضافة معاملة للمستلم (الحوالة + عمولة المستلم)
      await storage.createTransaction({
        userId: user.id,
        type: 'international_transfer_new_in',
        amount: amountForReceiver.toString(),
        currency: transfer.currencyCode,
        description: `استلام حوالة دولية - رمز: ${transferCode} (الحوالة: ${transfer.amountPending}, عمولة المستلم: ${transfer.commissionRecipient})`
      });
      
      res.json({
        amountReceived: amountForReceiver,
        currencyCode: transfer.currencyCode,
        message: "تم استلام الحوالة بنجاح"
      });
    } catch (error) {
      console.error("خطأ في استلام الحوالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء استلام الحوالة" });
    }
  });

  // إلغاء حوالة دولية
  app.delete("/api/international-transfer/:transferCode", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      const { transferCode } = req.params;
      
      if (!transferCode) {
        return res.status(400).json({ message: "رمز التحويل مطلوب" });
      }
      
      const transfer = await storage.getInternationalTransferNewByCode(transferCode);
      
      if (!transfer) {
        return res.status(404).json({ message: "لم يتم العثور على حوالة بهذا الرمز" });
      }
      
      // التحقق من أن المستخدم هو المرسل أو مدير
      if (transfer.senderAgentId !== user.id && user.type !== 'admin') {
        return res.status(403).json({ message: "ليس لديك صلاحية لإلغاء هذه الحوالة" });
      }
      
      // إلغاء التحويل
      const result = await storage.cancelInternationalTransferNew(transferCode);
      
      if (result.success) {
        res.json({
          message: "تم إلغاء الحوالة بنجاح وإرجاع المبلغ للمرسل",
          transferCode,
          refundedAmount: transfer.amountOriginal,
          currency: transfer.currencyCode
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("خطأ في إلغاء الحوالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إلغاء الحوالة" });
    }
  });

  // تحديث معلومات الملف الشخصي
  app.put("/api/user/profile", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      const { fullName, email, phone } = req.body;
      
      if (!fullName || !email) {
        return res.status(400).json({ message: "الاسم والبريد الإلكتروني مطلوبان" });
      }
      
      // التحقق من صحة البريد الإلكتروني
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "البريد الإلكتروني غير صحيح" });
      }
      
      // التحقق من عدم استخدام البريد من قبل مستخدم آخر
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ message: "البريد الإلكتروني مستخدم من قبل مستخدم آخر" });
      }
      
      // تحديث معلومات المستخدم
      await storage.updateUserProfile(user.id, {
        fullName,
        email,
        phone: phone || null
      });
      
      // جلب معلومات المستخدم المحدثة
      const updatedUser = await storage.getUser(user.id);
      
      if (updatedUser) {
        // إزالة كلمة المرور من الاستجابة
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: "المستخدم غير موجود" });
      }
    } catch (error) {
      console.error("خطأ في تحديث الملف الشخصي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث الملف الشخصي" });
    }
  });

  // تغيير كلمة المرور
  app.put("/api/user/change-password", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "كلمة المرور الحالية والجديدة مطلوبتان" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
      }
      
      // جلب معلومات المستخدم مع كلمة المرور
      const userWithPassword = await storage.getUser(user.id);
      if (!userWithPassword) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // التحقق من كلمة المرور الحالية (دعم النظام القديم والجديد)
      let isCurrentPasswordValid = false;
      
      // إذا كان كلمة المرور مُشفرة بـ bcrypt
      if (userWithPassword.password.startsWith('$2b$') || userWithPassword.password.startsWith('$2a$')) {
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
      } else {
        // للنظام القديم مع scrypt
        const { scrypt, timingSafeEqual } = await import('crypto');
        const { promisify } = await import('util');
        const scryptAsync = promisify(scrypt);
        
        const [hashed, salt] = userWithPassword.password.split(".");
        if (salt && hashed) {
          const hashedBuf = Buffer.from(hashed, "hex");
          const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
          isCurrentPasswordValid = timingSafeEqual(hashedBuf, suppliedBuf);
        }
      }
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });
      }
      
      // تشفير كلمة المرور الجديدة
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
          // تحديث كلمة المرور في قاعدة البيانات
      await db.execute(sql`
        UPDATE users 
        SET password = ${hashedNewPassword}
        WHERE id = ${user.id}
      `);
      
      res.json({ message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      console.error("خطأ في تغيير كلمة المرور:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تغيير كلمة المرور" });
    }
  });

  // =================== API المصادقة الثنائية ===================
  
  // الحصول على حالة المصادقة الثنائية
  app.get("/api/2fa/status", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      
      const [user2fa] = await db.select()
        .from(user2FA)
        .where(eq(user2FA.userId, user.id));
      
      res.json({
        isEnabled: user2fa?.isEnabled || false,
        hasSecret: !!user2fa?.secret
      });
    } catch (error) {
      console.error("خطأ في الحصول على حالة المصادقة الثنائية:", error);
      res.status(500).json({ message: "حدث خطأ في النظام" });
    }
  });

  // إعداد المصادقة الثنائية (إنشاء secret و QR code)
  app.post("/api/2fa/setup", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      const speakeasy = await import('speakeasy');
      const QRCode = await import('qrcode');
      
      // التحقق من عدم تفعيل المصادقة الثنائية مسبقاً
      const [existing2fa] = await db.select()
        .from(user2FA)
        .where(eq(user2FA.userId, user.id));
      
      if (existing2fa?.isEnabled) {
        return res.status(400).json({ message: "المصادقة الثنائية مفعلة بالفعل" });
      }
      
      // إنشاء secret جديد
      const secret = speakeasy.generateSecret({
        name: user.fullName || user.email,
        issuer: 'منصة الصرافة',
        length: 20
      });
      
      // إنشاء رموز نسخ احتياطي
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
      }
      
      // حفظ أو تحديث إعدادات المصادقة الثنائية
      if (existing2fa) {
        await db.update(user2FA)
          .set({
            secret: secret.base32,
            backupCodes,
            updatedAt: new Date()
          })
          .where(eq(user2FA.userId, user.id));
      } else {
        await db.insert(user2FA).values({
          userId: user.id,
          secret: secret.base32,
          backupCodes,
          isEnabled: false
        });
      }
      
      // إنشاء QR Code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
      
      res.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes,
        manualEntryKey: secret.base32
      });
    } catch (error) {
      console.error("خطأ في إعداد المصادقة الثنائية:", error);
      res.status(500).json({ message: "حدث خطأ في النظام" });
    }
  });

  // تفعيل المصادقة الثنائية
  app.post("/api/2fa/enable", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      const { token } = req.body;
      const speakeasy = await import('speakeasy');
      
      if (!token || token.length !== 6) {
        return res.status(400).json({ message: "رمز التحقق يجب أن يكون 6 أرقام" });
      }
      
      // الحصول على إعدادات المصادقة الثنائية
      const [user2fa] = await db.select()
        .from(user2FA)
        .where(eq(user2FA.userId, user.id));
      
      if (!user2fa?.secret) {
        return res.status(400).json({ message: "يجب إعداد المصادقة الثنائية أولاً" });
      }
      
      if (user2fa.isEnabled) {
        return res.status(400).json({ message: "المصادقة الثنائية مفعلة بالفعل" });
      }
      
      // التحقق من الرمز
      const verified = speakeasy.totp.verify({
        secret: user2fa.secret,
        encoding: 'base32',
        token,
        window: 2
      });
      
      if (!verified) {
        return res.status(400).json({ message: "رمز التحقق غير صحيح" });
      }
      
      // تفعيل المصادقة الثنائية
      await db.update(user2FA)
        .set({
          isEnabled: true,
          lastUsedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(user2FA.userId, user.id));
      
      res.json({ message: "تم تفعيل المصادقة الثنائية بنجاح" });
    } catch (error) {
      console.error("خطأ في تفعيل المصادقة الثنائية:", error);
      res.status(500).json({ message: "حدث خطأ في النظام" });
    }
  });

  // إلغاء تفعيل المصادقة الثنائية
  app.post("/api/2fa/disable", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, token } = req.body;
      const speakeasy = await import('speakeasy');
      
      if (!currentPassword || !token) {
        return res.status(400).json({ message: "كلمة المرور الحالية ورمز التحقق مطلوبان" });
      }
      
      // التحقق من كلمة المرور الحالية
      const userWithPassword = await storage.getUser(user.id);
      if (!userWithPassword) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // التحقق من كلمة المرور الحالية (دعم النظام القديم والجديد)
      let isCurrentPasswordValid = false;
      
      if (userWithPassword.password.startsWith('$2b$') || userWithPassword.password.startsWith('$2a$')) {
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
      } else {
        const { scrypt, timingSafeEqual } = await import('crypto');
        const { promisify } = await import('util');
        const scryptAsync = promisify(scrypt);
        
        const [hashed, salt] = userWithPassword.password.split(".");
        if (salt && hashed) {
          const hashedBuf = Buffer.from(hashed, "hex");
          const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
          isCurrentPasswordValid = timingSafeEqual(hashedBuf, suppliedBuf);
        }
      }
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });
      }
      
      // الحصول على إعدادات المصادقة الثنائية
      const [user2fa] = await db.select()
        .from(user2FA)
        .where(eq(user2FA.userId, user.id));
      
      if (!user2fa?.isEnabled) {
        return res.status(400).json({ message: "المصادقة الثنائية غير مفعلة" });
      }
      
      // التحقق من الرمز أو رمز النسخ الاحتياطي
      let verified = false;
      
      // التحقق من رمز TOTP
      if (token.length === 6 && /^\d{6}$/.test(token)) {
        verified = speakeasy.totp.verify({
          secret: user2fa.secret!,
          encoding: 'base32',
          token: token,
          window: 2
        });
      }
      
      // التحقق من رمز النسخ الاحتياطي
      if (!verified && user2fa.backupCodes.includes(token.toUpperCase())) {
        verified = true;
        // إزالة رمز النسخ الاحتياطي المستخدم
        const updatedBackupCodes = user2fa.backupCodes.filter(backupCode => backupCode !== token.toUpperCase());
        await db.update(user2FA)
          .set({ backupCodes: updatedBackupCodes })
          .where(eq(user2FA.userId, user.id));
      }
      
      if (!verified) {
        return res.status(400).json({ message: "رمز التحقق غير صحيح" });
      }
      
      // إلغاء تفعيل المصادقة الثنائية
      await db.update(user2FA)
        .set({
          isEnabled: false,
          secret: null,
          backupCodes: [],
          updatedAt: new Date()
        })
        .where(eq(user2FA.userId, user.id));
      
      res.json({ message: "تم إلغاء تفعيل المصادقة الثنائية بنجاح" });
    } catch (error) {
      console.error("خطأ في إلغاء تفعيل المصادقة الثنائية:", error);
      res.status(500).json({ message: "حدث خطأ في النظام" });
    }
  });


  // التحقق من رمز المصادقة الثنائية أثناء تسجيل الدخول (مسار جديد لتجنب التضارب)
  app.post("/api/auth/2fa-verify-login", async (req, res) => {
    console.log('🚨🚨🚨 HANDLER HIT: /api/auth/2fa-verify-login');
    console.log('🚨🚨🚨 REQUEST - tempToken موجود:', !!req.body.tempToken, 'code موجود:', !!req.body.code);
    try {
      console.log('🔐 [2FA SERVER DEBUG] بدء التحقق من المصادقة الثنائية');
      console.log('🔐 [2FA SERVER DEBUG] tempToken موجود:', !!req.body.tempToken, 'code موجود:', !!req.body.code);
      
      const { tempToken, code } = req.body;
      
      if (!tempToken || !code) {
        console.log('🔐 [2FA SERVER DEBUG] بيانات ناقصة - tempToken:', !!tempToken, 'code:', !!code);
        return res.status(400).json({ message: "tempToken ورمز التحقق مطلوبان" });
      }

      // فك تشفير tempToken للحصول على معلومات المستخدم
      const JWT_SECRET = getJwtSecret();
      
      // تنظيف tempToken من أي بادئات أو مسافات
      const cleanedToken = String(tempToken || '').replace(/^Bearer\s+/i, '').trim();
      
      let decodedToken;
      try {
        decodedToken = jwt.verify(cleanedToken, JWT_SECRET, { clockTolerance: 30 }) as any;
      } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ message: "انتهت صلاحية رمز التحقق، يرجى تسجيل الدخول مرة أخرى" });
        } else if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: "رمز التحقق غير صالح، يرجى تسجيل الدخول مرة أخرى" });
        }
        return res.status(401).json({ message: "tempToken غير صالح أو منتهي الصلاحية" });
      }

      const userId = decodedToken.userId;
      const speakeasy = await import('speakeasy');
      
      // الحصول على المستخدم
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // الحصول على إعدادات المصادقة الثنائية
      const [user2fa] = await db.select()
        .from(user2FA)
        .where(eq(user2FA.userId, userId));
      
      if (!user2fa?.isEnabled) {
        return res.status(400).json({ message: "المصادقة الثنائية غير مفعلة" });
      }
      
      let verified = false;
      
      // التحقق من رمز TOTP
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        verified = speakeasy.totp.verify({
          secret: user2fa.secret!,
          encoding: 'base32',
          token: code,
          window: 2
        });
      }
      
      // التحقق من رمز النسخ الاحتياطي
      if (!verified && user2fa.backupCodes.includes(code.toUpperCase())) {
        verified = true;
        // إزالة رمز النسخ الاحتياطي المستخدم
        const updatedBackupCodes = user2fa.backupCodes.filter(backupCode => backupCode !== code.toUpperCase());
        await db.update(user2FA)
          .set({ 
            backupCodes: updatedBackupCodes,
            lastUsedAt: new Date()
          })
          .where(eq(user2FA.userId, userId));
      } else if (verified) {
        // تحديث آخر استخدام
        await db.update(user2FA)
          .set({ lastUsedAt: new Date() })
          .where(eq(user2FA.userId, userId));
      }
      
      if (!verified) {
        console.log('🔐 [2FA SERVER DEBUG] فشل التحقق من الرمز');
        return res.status(400).json({ message: "رمز التحقق غير صحيح" });
      }

      console.log('🔐 [2FA SERVER DEBUG] نجح التحقق، إنشاء JWT token');
      
      // إنشاء JWT token نهائي للمستخدم
      const payload = {
        userId: user.id,
        email: user.email,
        type: user.type,
        isActive: user.isActive,
      };

      const finalToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
      
      const responseData = { 
        token: finalToken,
        user: {
          id: user.id,
          accountNumber: user.accountNumber,
          fullName: user.fullName,
          email: user.email,
          type: user.type,
          isActive: user.isActive,
          isVerified: user.isVerified,
          countryName: user.countryName,
          cityName: user.cityName,
          balance: user.balance
        }
      };

      console.log('🔐 [2FA SERVER DEBUG] إرسال الاستجابة النهائية:', {
        token: finalToken ? 'موجود' : 'غير موجود',
        userId: user.id,
        email: user.email,
        responseSize: JSON.stringify(responseData).length
      });

      console.log('🚨 [CRITICAL DEBUG] عن قبل إرسال res.json - responseData موجود:', !!responseData);
      console.log('🚨 [CRITICAL DEBUG] token في responseData:', !!responseData.token);
      
      res.json(responseData);
      
      console.log('🚨 [CRITICAL DEBUG] تم إرسال res.json بنجاح!');
    } catch (error) {
      console.error("خطأ في التحقق من المصادقة الثنائية:", error);
      res.status(500).json({ message: "حدث خطأ في النظام" });
    }
  });

  // التحقق من رمز المصادقة الثنائية (للمستخدمين المسجلين دخولهم)
  app.post("/api/2fa/verify", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      const { token } = req.body;
      const speakeasy = await import('speakeasy');
      
      if (!token) {
        return res.status(400).json({ message: "رمز التحقق مطلوب" });
      }
      
      // الحصول على إعدادات المصادقة الثنائية
      const [user2fa] = await db.select()
        .from(user2FA)
        .where(eq(user2FA.userId, user.id));
      
      if (!user2fa?.isEnabled) {
        return res.status(400).json({ message: "المصادقة الثنائية غير مفعلة" });
      }
      
      let verified = false;
      
      // التحقق من رمز TOTP
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        verified = speakeasy.totp.verify({
          secret: user2fa.secret!,
          encoding: 'base32',
          token: code,
          window: 2
        });
      }
      
      // التحقق من رمز النسخ الاحتياطي
      if (!verified && user2fa.backupCodes.includes(code.toUpperCase())) {
        verified = true;
        // إزالة رمز النسخ الاحتياطي المستخدم
        const updatedBackupCodes = user2fa.backupCodes.filter(backupCode => backupCode !== code.toUpperCase());
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
        return res.status(400).json({ message: "رمز التحقق غير صحيح" });
      }
      
      res.json({ message: "تم التحقق بنجاح", verified: true });
    } catch (error) {
      console.error("خطأ في التحقق من المصادقة الثنائية:", error);
      res.status(500).json({ message: "حدث خطأ في النظام" });
    }
  });

  // =================== API إدارة عمولات التحويلات بين المكاتب ===================
  
  // جلب عمولات التحويلات بين المكاتب (عمولتي + عمولات المكاتب الأخرى)
  app.get("/api/inter-office-commissions", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.type !== "agent" && user.type !== "admin") {
        return res.status(403).json({ message: "هذه الخدمة متاحة للوكلاء والمدراء فقط" });
      }

      // جلب عمولة المكتب الحالي
      const myCommissionResult = await db.$client.query(`
        SELECT ac.*, u.full_name as agent_name
        FROM agent_commissions ac
        JOIN users u ON ac.agent_id = u.id
        WHERE ac.agent_id = $1
        LIMIT 1
      `, [user.id]);
      
      const myCommission = myCommissionResult.rows[0] ? {
        id: myCommissionResult.rows[0].id,
        agentId: myCommissionResult.rows[0].agent_id,
        agentName: myCommissionResult.rows[0].agent_name,
        commission: myCommissionResult.rows[0].value,
        isPercentage: myCommissionResult.rows[0].type === 'percentage',
        currency: myCommissionResult.rows[0].currency_code,
        createdAt: myCommissionResult.rows[0].created_at,
        updatedAt: myCommissionResult.rows[0].updated_at
      } : null;

      // جلب عمولات المكاتب الأخرى
      const otherCommissionsResult = await db.$client.query(`
        SELECT ac.*, u.full_name as agent_name
        FROM agent_commissions ac
        JOIN users u ON ac.agent_id = u.id
        WHERE ac.agent_id != $1 AND u.type = 'agent'
        ORDER BY CAST(ac.value AS DECIMAL) ASC
      `, [user.id]);
      
      const otherCommissions = otherCommissionsResult.rows.map((row: any) => ({
        id: row.id,
        agentId: row.agent_id,
        agentName: row.agent_name,
        commission: row.value,
        isPercentage: row.type === 'percentage',
        currency: row.currency_code,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json({
        myCommission,
        otherCommissions
      });
    } catch (error) {
      console.error("خطأ في جلب عمولات التحويلات بين المكاتب:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  // تحديث عمولة التحويلات بين المكاتب للمكتب الحالي
  app.post("/api/inter-office-commissions", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;
      const { rate } = req.body;
      
      console.log("طلب تحديث العمولة للمستخدم:", user.id, "النسبة:", rate);
      
      if (user.type !== "agent" && user.type !== "admin") {
        return res.status(403).json({ message: "هذه الخدمة متاحة للوكلاء والمدراء فقط" });
      }

      // التحقق من صحة النسبة
      if (typeof rate !== "number" || rate < 0 || rate > 100) {
        return res.status(400).json({ message: "نسبة العمولة يجب أن تكون بين 0% و 100%" });
      }

      // البحث عن السجل الموجود للمكتب
      const existingResult = await db.$client.query(`
        SELECT id FROM agent_commissions WHERE agent_id = $1
      `, [user.id]);
      
      console.log("السجلات الموجودة للمستخدم:", existingResult.rows.length);

      if (existingResult.rows.length > 0) {
        // تحديث السجل الموجود
        console.log("تحديث السجل الموجود...");
        const updateResult = await db.$client.query(`
          UPDATE agent_commissions 
          SET value = $1, type = 'percentage', updated_at = NOW()
          WHERE agent_id = $2
        `, [rate.toString(), user.id]);
        console.log("نتيجة التحديث:", updateResult.rowCount);
      } else {
        // إنشاء سجل جديد
        console.log("إنشاء سجل جديد...");
        const insertResult = await db.$client.query(`
          INSERT INTO agent_commissions (agent_id, value, type, currency_code, created_at, updated_at)
          VALUES ($1, $2, 'percentage', 'LYD', NOW(), NOW())
        `, [user.id, rate.toString()]);
        console.log("نتيجة الإدراج:", insertResult.rowCount);
      }

      console.log("تم حفظ العمولة بنجاح للمستخدم:", user.id);
      res.json({ message: "تم تحديث عمولة التحويلات بين المكاتب بنجاح" });
    } catch (error) {
      console.error("خطأ في تحديث عمولة التحويلات بين المكاتب:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث العمولة" });
    }
  });

  // API لجلب نسب العمولة من إعدادات النظام
  app.get("/api/commission-rates", authMiddleware, async (req, res) => {
    try {
      const { transferType = 'inter-office', currency = 'LYD' } = req.query;
      
      // جلب نسبة العمولة من جدول systemCommissionRates
      const systemRateResult = await db.$client.query(`
        SELECT commission_rate as "commissionRate", per_mille_rate as "perMilleRate", fixed_amount as "fixedAmount"
        FROM system_commission_rates 
        WHERE transfer_type = $1 AND currency = $2 AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `, [transferType, currency]);
      
      let systemCommissionRate = '0.01'; // 1% افتراضي
      let rateType = 'default';
      
      if (systemRateResult.rows[0]) {
        const dbRow = systemRateResult.rows[0];
        // إذا كان هناك مبلغ ثابت، استخدمه
        if (dbRow.fixedAmount && parseFloat(dbRow.fixedAmount) > 0) {
          systemCommissionRate = dbRow.fixedAmount; // استخدام المبلغ الثابت
          rateType = 'fixed';
        } else if (dbRow.perMilleRate && parseFloat(dbRow.perMilleRate) > 0) {
          systemCommissionRate = dbRow.perMilleRate; // استخدام النسبة في الألف مباشرة
          rateType = 'per_mille';
        } else {
          // وإلا استخدم النسبة المئوية العادية
          systemCommissionRate = dbRow.commissionRate;
          rateType = 'percentage';
        }
      }
      
      console.log(`📊 جلب نسبة عمولة النظام: ${systemCommissionRate} (${rateType}) لنوع ${transferType} وعملة ${currency}`);
      
      res.json({
        systemCommissionRate: parseFloat(systemCommissionRate),
        transferType,
        currency,
        source: systemRateResult.rows[0] ? 'database' : 'default',
        rateType
      });
      
    } catch (error) {
      console.error("خطأ في جلب نسب العمولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب نسب العمولة" });
    }
  });

  // API لجلب نسبة عمولة مكتب محدد
  app.get("/api/agent-commission-rate/:agentId", authMiddleware, async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      const { currency = 'LYD' } = req.query;
      
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "معرف الوكيل غير صالح" });
      }
      
      // جلب نسبة عمولة الوكيل من جدول agent_commissions
      const agentCommissionResult = await db.$client.query(`
        SELECT commission_rate as "commissionRate", commission_type as "commissionType"
        FROM agent_commissions 
        WHERE agent_id = $1 AND currency = $2 AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `, [agentId, currency]);
      
      // استخدام نسبة افتراضية إذا لم توجد في الإعدادات
      const recipientCommissionRate = agentCommissionResult.rows[0]?.commissionRate || '1.5'; // 1.5% افتراضي
      
      console.log(`🏦 جلب نسبة عمولة المكتب ${agentId}: ${recipientCommissionRate}% للعملة ${currency}`);
      
      res.json({
        recipientCommissionRate: parseFloat(recipientCommissionRate),
        agentId,
        currency,
        source: agentCommissionResult.rows[0] ? 'database' : 'default',
        commissionType: agentCommissionResult.rows[0]?.commissionType || 'percentage'
      });
      
    } catch (error) {
      console.error("خطأ في جلب نسبة عمولة المكتب:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب نسبة عمولة المكتب" });
    }
  });



  // APIs إعدادات عمولة متعددة العملات - النظام المحسن
  // جلب إعدادات العمولة بتنسيق JSON
  app.get("/api/market/commission", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      console.log('🔍 طلب جلب إعدادات العمولة المحسنة من المستخدم:', req.user?.id, 'النوع:', req.user?.type);
      
      // التحقق من صلاحية المدير
      if (!req.user || req.user.type !== 'admin') {
        console.log('❌ رفض الوصول - المستخدم ليس مديراً:', req.user?.type);
        return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
      }

      const settings = await db.select()
        .from(systemCommissionSettings)
        .orderBy(asc(systemCommissionSettings.currency));

      console.log('📊 تم جلب إعدادات العمولة من قاعدة البيانات:', settings.length, 'إعداد');
      
      const currencies = settings.map(setting => ({
        currency: setting.currency,
        type: setting.type === "percentage" ? "PERCENT" : "FIXED",
        value: parseFloat(setting.value)
      }));

      console.log('📤 إرسال الإعدادات بتنسيق JSON للعميل:', currencies);
      res.json({ currencies });

    } catch (error) {
      console.error("🔥 خطأ في جلب إعدادات العمولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الإعدادات" });
    }
  });

  // حفظ إعدادات العمولة لجميع العملات
  app.put("/api/market/commission", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      console.log('🔍 طلب حفظ إعدادات العمولة المحسنة من المستخدم:', req.user?.id);
      
      // التحقق من صلاحية المدير
      if (!req.user || req.user.type !== 'admin') {
        console.log('❌ رفض الوصول - المستخدم ليس مديراً:', req.user?.type);
        return res.status(403).json({ message: "غير مصرح لك بحفظ هذه الإعدادات" });
      }

      const { currencies } = req.body;
      
      if (!Array.isArray(currencies)) {
        return res.status(400).json({ message: "يجب أن تكون البيانات عبارة عن مصفوفة من العملات" });
      }

      console.log('📥 البيانات الواردة:', currencies);

      // التحقق من صحة البيانات
      for (const curr of currencies) {
        if (!curr.currency || !curr.type || typeof curr.value !== 'number') {
          return res.status(400).json({ 
            message: "بيانات غير صحيحة: يجب توفر currency و type و value لكل عملة" 
          });
        }
        
        if (curr.type === "PERCENT" && (curr.value < 0 || curr.value > 100)) {
          return res.status(400).json({ 
            message: `النسبة المئوية للعملة ${curr.currency} يجب أن تكون بين 0 و 100` 
          });
        }
        
        if (curr.type === "FIXED" && curr.value < 0) {
          return res.status(400).json({ 
            message: `المبلغ الثابت للعملة ${curr.currency} يجب أن يكون أكبر من أو يساوي صفر` 
          });
        }
      }

      // التحقق من عدم تكرار العملات
      const currencyCodes = currencies.map(c => c.currency);
      const uniqueCurrencies = new Set(currencyCodes);
      if (currencyCodes.length !== uniqueCurrencies.size) {
        return res.status(400).json({ message: "لا يمكن تكرار نفس العملة" });
      }

      // حذف الإعدادات الحالية أولاً
      await db.delete(systemCommissionSettings);
      console.log('🗑️ تم حذف الإعدادات القديمة');

      // إدراج الإعدادات الجديدة
      if (currencies.length > 0) {
        const insertData = currencies.map(curr => ({
          currency: curr.currency,
          type: curr.type === "PERCENT" ? "percentage" : "fixed",
          value: curr.value.toString(),
          updatedBy: req.user.id,
          updatedAt: new Date(),
        }));

        await db.insert(systemCommissionSettings).values(insertData);
        console.log('✅ تم إدراج الإعدادات الجديدة:', insertData.length, 'عملة');
      }

      console.log(`✅ تم حفظ إعدادات العمولة بنجاح بواسطة المدير ${req.user.id}`);
      
      res.json({ 
        message: "تم حفظ إعدادات العمولة بنجاح",
        currencies: currencies
      });

    } catch (error) {
      console.error("🔥 خطأ في حفظ إعدادات العمولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حفظ الإعدادات" });
    }
  });




  // Get commission logs (admin only)
  app.get("/api/admin/commission-logs", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      // التحقق من صلاحية المدير
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: "هذه الصفحة متاحة للمدراء فقط" });
      }

      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "20");
      const offset = (page - 1) * limit;
      
      const logs = await db.select()
        .from(commissionLogs)
        .orderBy(desc(commissionLogs.createdAt))
        .limit(limit)
        .offset(offset);
      
      const totalCount = await db.select({ count: sql`count(*)` })
        .from(commissionLogs);
      
      res.json({
        logs: logs.map(log => ({
          ...log,
          commissionAmount: log.commissionAmount.toString(),
          createdAt: log.createdAt?.toISOString()
        })),
        total: parseInt(totalCount[0].count.toString()),
        page,
        totalPages: Math.ceil(parseInt(totalCount[0].count.toString()) / limit)
      });
    } catch (error) {
      console.error("خطأ في جلب سجلات العمولة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب سجلات العمولة" });
    }
  });

  // مسارات نظام الأمان
  app.post('/api/security/check-block', security.checkBlockedFingerprint);
  app.post('/api/security/report-attack', security.reportSuspiciousActivity);
  
  // ===== نقطة نهاية جديدة للتصوير الصامت بعد 3 محاولات فاشلة =====
  app.post('/api/security/silent-capture', async (req, res) => {
    try {
      const { imageData, fingerprint, ipAddress, userAgent, location, failedAttempts, reportType = 'failed_login_attempts' } = req.body;
      
      if (!imageData || !fingerprint) {
        return res.status(400).json({ message: 'بيانات مطلوبة مفقودة' });
      }
      
      // التحقق من أن عدد المحاولات الفاشلة = 3 بالضبط للتصوير الصامت
      if (reportType === 'failed_login_attempts' && failedAttempts !== 3) {
        console.log(`🚫 محاولة تصوير مبكرة - المحاولات: ${failedAttempts} (مطلوب: 3 بالضبط)`);
        return res.status(400).json({ message: 'التصوير ينشط بعد 3 محاولات فاشلة بالضبط' });
      }
      
      console.log('📸 تنفيذ التصوير الصامت بعد 3 محاولات فاشلة');
      console.log(`🔍 البصمة: ${fingerprint.substring(0, 10)}...`);
      console.log(`🌐 عنوان IP: ${ipAddress}`);
      console.log(`📱 متصفح: ${userAgent?.substring(0, 50)}...`);
      
      // حفظ الصورة مع معرف فريد
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const imageFilename = `silent_capture_${fingerprint.substring(0, 8)}_${timestamp}.jpg`;
      
      const result = await security.handleSilentCapture({
        imageData,
        fingerprint,
        ipAddress,
        userAgent,
        location,
        failedAttempts: failedAttempts || 3,
        reportType,
        filename: imageFilename
      });
      
      if (result.success) {
        console.log('✅ تم حفظ التصوير الصامت بنجاح');
        res.json({
          success: true,
          message: 'تم تسجيل النشاط الأمني',
          logId: result.logId
        });
      } else {
        console.error('❌ فشل في حفظ التصوير الصامت:', result.error);
        res.status(500).json({
          success: false,
          message: 'حدث خطأ في التسجيل الأمني'
        });
      }
      
    } catch (error) {
      console.error('❌ خطأ في API التصوير الصامت:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ خادم داخلي'
      });
    }
  });
  
  // مسارات إدارة الأمان (محمية للمسؤول الأعلى فقط)
  app.get('/api/security/logs', authMiddleware, security.securityMiddleware, security.getSecurityLogs);
  app.post('/api/security/block', authMiddleware, security.securityMiddleware, security.blockFingerprint);
  app.post('/api/security/unblock', authMiddleware, security.securityMiddleware, security.unblockFingerprint);
  
  // مسارات حذف السجلات الأمنية (محصورة للمدير الأعلى ss73ss73ss73@gmail.com فقط)
  app.delete('/api/security/logs/:logId', authMiddleware, security.securityMiddleware, security.deleteSecurityLog);
  app.delete('/api/security/logs', authMiddleware, security.securityMiddleware, security.clearAllSecurityLogs);
  
  // الصور الأمنية محمية بـ authMiddleware فقط (إصلاح مؤقت)
  app.get('/api/security/image/:filename', security.securityImageMiddleware, security.getSecurityImage);

  // ==================== مسارات كشف الحساب ====================
  
  // جلب كشف الحساب للمستخدم
  app.get('/api/statements', authMiddleware, checkPageRestrictions('statement'), async (req: AuthRequest, res: Response) => {
    try {
      const {
        start,
        end,
        currency,
        type,
        status,
        q,
        reference,
        page = 1,
        pageSize = 50
      } = req.query;

      const userId = req.user.id;
      const offset = (Number(page) - 1) * Number(pageSize);

      console.log('📊 فلاتر كشف الحساب المطلوبة:', { 
        userId, start, end, currency, type, status, q, reference, page, pageSize 
      });

      // تسجيل هوية المستخدم المطلوب
      const user = await storage.getUser(userId);
      console.log(`👤 طلب كشف الحساب للمستخدم: ${userId} - ${user?.fullName || 'غير معروف'}`);

      // بناء شروط الفلترة
      const conditions = [eq(transactions.userId, userId)];

      // إضافة فلاتر
      if (currency && currency !== 'all') {
        conditions.push(eq(transactions.currency, currency as string));
      }
      if (type && type !== 'all') {
        conditions.push(eq(transactions.type, type as string));
      }
      if (status && status !== 'all') {
        conditions.push(eq(transactions.status, status as string));
      }
      if (start && end) {
        // تحويل تاريخ النهاية إلى نهاية اليوم (23:59:59.999)
        conditions.push(
          sql`${transactions.date} >= ${start}::timestamp AND ${transactions.date} <= (${end}::timestamp + INTERVAL '1 day' - INTERVAL '1 millisecond')`
        );
        console.log(`📅 فلتر التاريخ: من ${start} إلى نهاية ${end}`);
      } else if (start) {
        conditions.push(sql`${transactions.date} >= ${start}::timestamp`);
        console.log(`📅 فلتر التاريخ: من ${start}`);
      } else if (end) {
        // تحويل تاريخ النهاية إلى نهاية اليوم
        conditions.push(sql`${transactions.date} <= (${end}::timestamp + INTERVAL '1 day' - INTERVAL '1 millisecond')`);
        console.log(`📅 فلتر التاريخ: حتى نهاية ${end}`);
      }
      if (q && q.trim()) {
        conditions.push(
          like(transactions.description, `%${q}%`)
        );
      }
      if (reference && reference.trim()) {
        conditions.push(
          like(transactions.referenceNumber, `%${reference}%`)
        );
      }

      console.log('📊 عدد شروط الفلترة المطبقة:', conditions.length);
      
      // اختبار معاملات exchange محددة للمستخدم 28
      if (userId === 28) {
        const exchangeTest = await db
          .select()
          .from(transactions)
          .where(and(eq(transactions.userId, 28), eq(transactions.type, 'exchange')))
          .orderBy(desc(transactions.date));
        console.log(`🔍 معاملات exchange للمستخدم 28: ${exchangeTest.length} معاملة`);
        exchangeTest.forEach((tx, i) => {
          console.log(`  ${i+1}. ${tx.referenceNumber} - ${tx.date} - ${tx.description}`);
        });
      }

      // استخدام جدول transactions العادي مع كل الشروط وترتيب ذكي
      let transactionsQuery = db
        .select()
        .from(transactions)
        .where(and(...conditions));

      // ترتيب النتائج: البحث المطابق أولاً، ثم بالتاريخ
      if (reference && reference.trim()) {
        console.log(`🔍 ترتيب حسب الرقم المرجعي: "${reference}"`);
        // إذا كان هناك بحث برقم مرجعي، رتب النتائج المطابقة أولاً
        transactionsQuery = transactionsQuery
          .orderBy(
            // البحث المطابق تماماً أولاً
            sql`CASE WHEN ${transactions.referenceNumber} = ${reference} THEN 0 ELSE 1 END`,
            // ثم البحث الجزئي
            sql`CASE WHEN ${transactions.referenceNumber} LIKE ${`%${reference}%`} THEN 0 ELSE 1 END`,
            // أخيراً بالتاريخ (الأحدث أولاً)
            desc(transactions.date), 
            desc(transactions.id)
          );
      } else if (q && q.trim()) {
        console.log(`🔍 ترتيب حسب البحث النصي: "${q}"`);
        // إذا كان هناك بحث نصي، رتب النتائج المطابقة أولاً
        transactionsQuery = transactionsQuery
          .orderBy(
            // النتائج المطابقة للبحث النصي أولاً
            sql`CASE WHEN ${transactions.description} LIKE ${`%${q}%`} THEN 0 ELSE 1 END`,
            desc(transactions.date), 
            desc(transactions.id)
          );
      } else {
        console.log('🔍 ترتيب عادي بالتاريخ');
        // الترتيب العادي بالتاريخ
        transactionsQuery = transactionsQuery
          .orderBy(desc(transactions.date), desc(transactions.id));
      }
      
      transactionsQuery = transactionsQuery
        .limit(Number(pageSize))
        .offset(offset);

      // تنفيذ الاستعلام
      const transactionsResult = await transactionsQuery.execute();
      
      console.log(`📊 نتائج الاستعلام: ${transactionsResult.length} معاملة`);

      // إضافة بيانات المستخدم لكل معاملة
      const enrichedTransactions = await Promise.all(
        transactionsResult.map(async (transaction) => {
          if (transaction.userId) {
            const user = await storage.getUser(transaction.userId);
            return {
              ...transaction,
              userAccountNumber: user?.accountNumber,
              userName: user?.fullName,
              fullName: user?.fullName,
              userPhone: user?.phone
            };
          }
          return transaction;
        })
      );

      // حساب الرصيد الافتتاحي والمجاميع
      const allTransactionsQuery = db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(asc(transactions.date), asc(transactions.id));

      const allTransactions = await allTransactionsQuery.execute();

      // حساب الرصيد الافتتاحي (المعاملات قبل تاريخ البداية)
      let openingBalance = 0;
      let totalDebits = 0;
      let totalCredits = 0;
      
      for (const transaction of allTransactions) {
        const amount = Math.abs(Number(transaction.amount || 0));
        
        // إذا كان هناك فلتر تاريخ بداية وهذه المعاملة قبله
        if (start && new Date(transaction.date) < new Date(start as string)) {
          if (Number(transaction.amount) >= 0) {
            openingBalance += amount;
          } else {
            openingBalance -= amount;
          }
        }
        // إذا كانت المعاملة ضمن النطاق المطلوب (مع تضمين نهاية اليوم)
        else if ((!start || new Date(transaction.date) >= new Date(start as string)) &&
                 (!end || new Date(transaction.date) <= new Date(new Date(end as string).getTime() + 24 * 60 * 60 * 1000 - 1))) {
          if (Number(transaction.amount) >= 0) {
            totalCredits += amount;
          } else {
            totalDebits += amount;
          }
        }
      }

      // تحويل البيانات لتنسيق كشف الحساب مع الحفاظ على ترتيب النتائج
      let runningBalance = openingBalance;
      
      // إذا كان هناك بحث، لا نعيد حساب الرصيد التراكمي لأنه يفقد الترتيب
      let shouldCalculateRunningBalance = !reference && !q;
      
      const statementRows = enrichedTransactions.map((transaction, index) => {
        const amount = Number(transaction.amount || 0);
        const absAmount = Math.abs(amount);
        
        // تحديث الرصيد الجاري فقط إذا لم يكن هناك بحث
        if (shouldCalculateRunningBalance) {
          runningBalance += amount;
        }
        
        console.log(`📊 معاملة ${index + 1}: ${transaction.referenceNumber} - ${transaction.description}`);
        
        return {
          id: transaction.id,
          date: transaction.date,
          type: transaction.type,
          description: transaction.description || '',
          referenceNumber: transaction.referenceNumber || '',
          amount: absAmount.toFixed(4),
          direction: amount >= 0 ? 'credit' : 'debit',
          currency: transaction.currency,
          runningBalance: runningBalance.toFixed(4),
          userId: transaction.userId,
          userAccountNumber: transaction.userAccountNumber,
          userName: transaction.userName,
          fullName: transaction.fullName,
          userPhone: transaction.userPhone
        };
      });

      res.json({
        openingBalance: openingBalance.toFixed(4),
        rows: statementRows,
        totals: {
          debits: totalDebits.toFixed(4),
          credits: totalCredits.toFixed(4),
          fees: '0.0000', // حاليًا لا نحسب الرسوم منفصلة
          net: (totalCredits - totalDebits).toFixed(4)
        },
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          hasMore: transactionsResult.length === Number(pageSize)
        }
      });

    } catch (error) {
      console.error('❌ خطأ في جلب كشف الحساب:', error);
      res.status(500).json({ 
        success: false, 
        message: 'حدث خطأ في جلب كشف الحساب' 
      });
    }
  });

  // تصدير كشف الحساب الفوري
  app.post('/api/statements/export', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { format, ...filters } = req.body;

      // دالة تنسيق التاريخ الآمنة
      const formatDateSafely = (dateInput: Date | string | null): string => {
        if (!dateInput) return '';
        try {
          const date = new Date(dateInput);
          if (isNaN(date.getTime())) return '';
          return date.toLocaleDateString('ar-LY');
        } catch (error) {
          return '';
        }
      };

      // خريطة أنواع المعاملات
      const typeMapping: Record<string, string> = {
        'deposit': 'إيداع',
        'withdraw': 'سحب',
        'internal_transfer_sent': 'حوالة داخلية مرسلة',
        'internal_transfer_received': 'حوالة داخلية مستلمة',
        'inter_office_sent': 'حوالة بين المكاتب مرسلة',
        'inter_office_received': 'حوالة بين المكاتب مستلمة',
        'international_sent': 'حوالة دولية مرسلة',
        'international_received': 'حوالة دولية مستلمة'
      };
      
      if (!['pdf', 'excel'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'تنسيق التصدير غير مدعوم'
        });
      }

      const userId = req.user.id;

      // جلب بيانات كشف الحساب للتصدير
      let whereConditions = [eq(transactions.userId, userId)];
      
      // تطبيق الفلاتر
      if (filters.start) {
        whereConditions.push(gte(transactions.date, new Date(filters.start)));
      }
      
      if (filters.end) {
        const endDate = new Date(filters.end);
        endDate.setHours(23, 59, 59, 999);
        whereConditions.push(lte(transactions.date, endDate));
      }
      
      if (filters.currency && filters.currency !== 'all') {
        whereConditions.push(eq(transactions.currency, filters.currency));
      }
      
      if (filters.type && filters.type !== 'all') {
        whereConditions.push(eq(transactions.type, filters.type));
      }
      
      if (filters.reference) {
        whereConditions.push(like(transactions.referenceNumber, `%${filters.reference}%`));
      }
      
      if (filters.q) {
        whereConditions.push(like(transactions.description, `%${filters.q}%`));
      }

      const transactionsResult = await db.select()
        .from(transactions)
        .where(and(...whereConditions))
        .orderBy(asc(transactions.date)); // ترتيب تصاعدي لحساب الرصيد الجاري

      if (format === 'pdf') {
        // تصدير PDF باستخدام خدمة الإيصالات الحرارية
        try {
          const { ThermalReceiptGenerator } = await import('./receipt-services/thermal-receipt-generator');
          
          // حساب الرصيد الجاري (Running Balance) 
          let runningBalance = 0; // الرصيد الابتدائي
          
          // حساب الرصيد الجاري لكل معاملة
          const processedRows = transactionsResult.map(t => {
            const amount = parseFloat(t.amount);
            
            // تحديد اتجاه المعاملة (دائن أم مدين)
            const isCredit = ['deposit', 'internal_transfer_in', 'inter_office_received', 'international_received'].includes(t.type);
            
            // تحديث الرصيد الجاري
            if (isCredit) {
              runningBalance += amount;
            } else {
              runningBalance -= amount;
            }
            
            return {
              id: t.id,
              date: t.date ? formatDateSafely(t.date) : '',
              type: typeMapping[t.type] || t.type,
              referenceNumber: t.referenceNumber || t.id.toString(),
              amount: t.amount,
              currency: t.currency,
              description: t.description || '',
              balance: runningBalance.toFixed(4) // الرصيد التراكمي الصحيح
            };
          });

          const statementData = {
            openingBalance: '0.0000',
            rows: processedRows.reverse(), // عكس الترتيب لعرض الأحدث أولاً في الإيصال
            totals: {
              debits: '0.0000',
              credits: transactionsResult.reduce((sum, t) => sum + parseFloat(t.amount), 0).toString(),
              fees: '0.0000',
              net: runningBalance.toFixed(4)
            }
          };

          const receiptHtml = await ThermalReceiptGenerator.generateStatementReceipt(statementData);
          const { HtmlImageGenerator } = await import('./receipt-services/html-image-generator');
          const pdfBuffer = await HtmlImageGenerator.generatePDF(receiptHtml, {
            format: 'A4',
            printBackground: true
          });

          const fileName = `statement_${Date.now()}.pdf`;
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Length', pdfBuffer.length);
          res.send(pdfBuffer);
          
        } catch (error) {
          console.error('خطأ في تصدير PDF:', error);
          throw new Error('فشل في إنشاء ملف PDF');
        }
      } else {
        // تصدير Excel (CSV)
        const csvHeader = 'التاريخ,النوع,المبلغ,العملة,الوصف\n';
        const csvRows = transactionsResult.map(t => {
          const arabicType = typeMapping[t.type] || t.type;
          const formattedDate = t.date ? formatDateSafely(t.date) : '';
          const description = t.description || '';
          
          return `${formattedDate},"${arabicType}","${t.amount}","${t.currency}","${description}"`;
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        const fileName = `statement_${Date.now()}.csv`;
        
        // إرسال الملف مباشرة
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
        
        // إضافة BOM لدعم UTF-8 في Excel
        res.write('\uFEFF');
        res.write(csvContent, 'utf8');
        res.end();
      }

    } catch (error) {
      console.error('❌ خطأ في تصدير كشف الحساب:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تصدير كشف الحساب'
      });
    }
  });



  // ===== واجهات برمجة التطبيق لنظام الإيصالات المختومة رقمياً =====
  
  // إنشاء إيصال للتحويل الدولي
  app.post("/api/receipts/international-transfer", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { transferCode, locale = 'ar' } = req.body;
      
      if (!transferCode) {
        return res.status(400).json({ message: "كود التحويل مطلوب" });
      }
      
      // البحث عن التحويل بكود الاستلام
      const transfer = await storage.getAgentTransferByReceiverCode(transferCode);
      
      if (!transfer) {
        return res.status(404).json({ message: "التحويل غير موجود" });
      }
      
      // التحقق من أن المستخدم هو المرسل أو المستلم أو الوكيل المختص
      if (transfer.senderId !== userId && 
          transfer.destinationAgentId !== userId && 
          transfer.agentId !== userId) {
        return res.status(403).json({ message: "غير مصرح لك بإنشاء إيصال لهذا التحويل" });
      }
      
      // إعداد بيانات التحويل للإيصال
      const transactionData = {
        id: transfer.id.toString(),
        type: 'international_transfer',
        userId: transfer.senderId,
        amount: transfer.amount,
        currency: transfer.currency,
        commission: transfer.commission,
        counterparty: transfer.recipientName,
        ref: transfer.transferCode,
        referenceNumber: transfer.receiverCode,
        note: transfer.note || '',
        executedAt: transfer.createdAt,
        status: transfer.status,
        // خاص بالتحويل الدولي
        receiverCode: transfer.receiverCode,
        destinationCountry: transfer.country,
        recipientPhone: transfer.recipientPhone
      };
      
      const { InternationalReceiptService } = await import('./receipt-services/international-receipt-service');
      const receiptId = await InternationalReceiptService.generateInternationalTransferReceipt(transactionData, locale);
      
      res.status(201).json({
        message: "تم إنشاء إيصال التحويل الدولي بنجاح",
        receiptId,
        transferCode: transfer.receiverCode
      });
      
    } catch (error) {
      console.error("خطأ في إنشاء إيصال التحويل الدولي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء الإيصال" });
    }
  });

  // تحميل ملف الإيصال
  app.get("/api/receipts/:receiptId/file", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { receiptId } = req.params;
      
      // البحث عن الإيصال في قاعدة البيانات
      const { receipts } = await import('@shared/schema');
      const [receipt] = await db
        .select()
        .from(receipts)
        .where(eq(receipts.id, receiptId))
        .limit(1);
      
      if (!receipt) {
        return res.status(404).json({ message: "الإيصال غير موجود" });
      }
      
      // التحقق من ملكية الإيصال (إضافة فحص بسيط)
      // يمكن تطوير هذا الفحص حسب الحاجة
      
      // إصلاح المسار (إضافة ./ إذا لم تكن موجودة)
      let filePath = receipt.storagePath;
      
      if (!filePath) {
        console.error(`مسار الإيصال مفقود للإيصال: ${receiptId}`);
        return res.status(404).json({ message: "مسار الإيصال مفقود" });
      }
      
      if (!filePath.startsWith('./') && !filePath.startsWith('/')) {
        filePath = `./${filePath}`;
      }
      
      const fs = await import('fs');
      const path = await import('path');
      
      // التحقق من وجود الملف
      if (!fs.existsSync(filePath)) {
        console.error(`ملف الإيصال غير موجود في المسار: ${filePath}`);
        return res.status(404).json({ message: "ملف الإيصال غير موجود" });
      }
      
      // تحديد نوع المحتوى حسب امتداد الملف
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.pdf') contentType = 'application/pdf';
      
      // إرسال الملف
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptId}${ext}"`);
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      
    } catch (error) {
      console.error("خطأ في تحميل ملف الإيصال:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحميل الإيصال" });
    }
  });

  // عرض إيصال للطباعة (HTML) - بدون مصادقة لأن UUID الإيصال يوفر الحماية المطلوبة
  app.get("/api/receipts/:receiptId/print", async (req: any, res: Response) => {
    try {
      const { receiptId } = req.params;
      
      // البحث عن الإيصال في قاعدة البيانات
      const { receipts } = await import('@shared/schema');
      const [receipt] = await db
        .select()
        .from(receipts)
        .where(eq(receipts.id, receiptId))
        .limit(1);
      
      if (!receipt) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head><title>خطأ</title></head>
          <body><h1>الإيصال غير موجود</h1></body>
          </html>
        `);
      }

      // البحث عن بيانات التحويل
      const transferId = receipt.txnId;
      const { agentTransfers } = await import('@shared/schema');
      const [transfer] = await db
        .select()
        .from(agentTransfers)
        .where(eq(agentTransfers.id, parseInt(transferId)))
        .limit(1);
      
      if (!transfer) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head><title>خطأ</title></head>
          <body><h1>بيانات التحويل غير موجودة</h1></body>
          </html>
        `);
      }

      // إنشاء HTML للطباعة
      const printHtml = await generatePrintableReceipt(receipt, transfer);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(printHtml);
      
    } catch (error) {
      console.error("خطأ في عرض الإيصال للطباعة:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><title>خطأ</title></head>
        <body><h1>حدث خطأ أثناء عرض الإيصال</h1></body>
        </html>
      `);
    }
  });
  
  // إنشاء إيصال لمعاملة
  app.post("/api/receipts/generate", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { transactionId, locale = 'ar' } = req.body;
      
      if (!transactionId) {
        return res.status(400).json({ message: "معرف المعاملة مطلوب" });
      }
      
      // الحصول على بيانات المعاملة
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, parseInt(transactionId)))
        .limit(1);
      
      if (!transaction) {
        return res.status(404).json({ message: "المعاملة غير موجودة" });
      }
      
      // التحقق من الصلاحية
      if (transaction.userId !== userId && req.user.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك بإنشاء إيصال لهذه المعاملة" });
      }
      
      // تحويل بيانات المعاملة
      const transactionData = {
        id: transactionId,
        type: transaction.type,
        userId: transaction.userId,
        amount: transaction.amount,
        currency: transaction.currency,
        commission: transaction.commission || '0',
        counterparty: transaction.counterparty || '',
        ref: transaction.ref || '',
        referenceNumber: transaction.referenceNumber || `REF-${transactionId}`,
        note: transaction.description || '',
        executedAt: new Date(transaction.date),
        status: 'completed'
      };
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      const receiptId = await ReceiptService.generateReceipt(transactionData, locale);
      
      res.status(201).json({
        message: "تم إنشاء الإيصال بنجاح",
        receiptId
      });
      
    } catch (error) {
      console.error("خطأ في إنشاء الإيصال:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء الإيصال" });
    }
  });
  
  // التحقق من صحة إيصال
  app.get("/api/receipts/:receiptId/verify", async (req: Request, res: Response) => {
    try {
      const { receiptId } = req.params;
      const { token } = req.query;
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      const result = await ReceiptService.verifyReceipt(receiptId, token as string);
      
      res.json(result);
      
    } catch (error) {
      console.error("خطأ في التحقق من الإيصال:", error);
      res.status(500).json({ 
        valid: false, 
        reasons: ['خطأ في النظام']
      });
    }
  });
  
  // تحميل ملف الإيصال
  app.get("/api/receipts/:receiptId/file", async (req: Request, res: Response) => {
    try {
      const { receiptId } = req.params;
      
      // الحصول على تفاصيل الإيصال
      const [receipt] = await db
        .select()
        .from(receipts)
        .where(eq(receipts.id, receiptId))
        .limit(1);
      
      if (!receipt) {
        return res.status(404).json({ message: "الإيصال غير موجود" });
      }
      
      if (receipt.revoked) {
        return res.status(410).json({ message: "الإيصال ملغي" });
      }
      
      // إرسال الملف
      const fs = await import('fs/promises');
      const path = await import('path');
      
      try {
        const fileBuffer = await fs.readFile(receipt.storagePath);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt_${receiptId}.pdf"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        res.send(fileBuffer);
        
        // تسجيل التحميل
        const { ReceiptService } = await import('./receipt-services/receipt-service');
        await ReceiptService.logAuditAction(receiptId, 'download', 'anonymous');
        
      } catch (fileError) {
        console.error("خطأ في قراءة ملف الإيصال:", fileError);
        res.status(404).json({ message: "ملف الإيصال غير موجود" });
      }
      
    } catch (error) {
      console.error("خطأ في تحميل الإيصال:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحميل الإيصال" });
    }
  });
  
  // صفحة التحقق العامة
  app.get("/r/:receiptId", async (req: Request, res: Response) => {
    try {
      const { receiptId } = req.params;
      const { t: token } = req.query;
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      const verification = await ReceiptService.verifyReceipt(receiptId, token as string);
      
      // إنشاء صفحة HTML للتحقق
      const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التحقق من الإيصال - ${receiptId}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .status { padding: 15px; border-radius: 5px; margin: 20px 0; }
        .valid { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .invalid { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background-color: #e2e3e5; color: #383d41; border: 1px solid #d6d8db; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>التحقق من صحة الإيصال</h1>
        <p><strong>معرف الإيصال:</strong> ${receiptId}</p>
        
        <div class="status ${verification.valid ? 'valid' : 'invalid'}">
            <h3>${verification.valid ? '✅ إيصال صحيح' : '❌ إيصال غير صحيح'}</h3>
            ${verification.reasons.length > 0 ? `<ul>${verification.reasons.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
        </div>
        
        ${verification.summary ? `
        <div class="info">
            <h4>تفاصيل الإيصال:</h4>
            <p><strong>معرف المعاملة:</strong> ${verification.summary.txnId}</p>
            <p><strong>الإصدار:</strong> ${verification.summary.version}</p>
            <p><strong>اللغة:</strong> ${verification.summary.locale}</p>
            <p><strong>تاريخ الإنشاء:</strong> ${new Date(verification.summary.createdAt).toLocaleString('ar-EG')}</p>
            ${verification.summary.verifiedAt ? `<p><strong>آخر تحقق:</strong> ${new Date(verification.summary.verifiedAt).toLocaleString('ar-EG')}</p>` : ''}
        </div>
        ` : ''}
        
        ${verification.valid ? `
        <a href="/api/receipts/${receiptId}/file" class="btn">تحميل الإيصال</a>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
            <p>هذه الصفحة للتحقق من صحة الإيصالات المختومة رقمياً</p>
            <p>نظام التحقق الآمن - منصة الصرافة الليبية</p>
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
      
    } catch (error) {
      console.error("خطأ في صفحة التحقق:", error);
      res.status(500).send('<h1>خطأ في النظام</h1><p>حدث خطأ أثناء التحقق من الإيصال</p>');
    }
  });
  
  // نقطة نهاية JWKS للتحقق الخارجي
  app.get("/.well-known/jwks.json", async (req: Request, res: Response) => {
    try {
      const { CryptoService } = await import('./receipt-services/crypto-service');
      const jwks = await CryptoService.getJWKS();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json(jwks);
      
    } catch (error) {
      console.error("خطأ في JWKS:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // إبطال إيصال (للمدراء فقط)
  app.post("/api/receipts/:receiptId/revoke", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type, id: userId } = req.user;
      
      if (type !== 'admin') {
        return res.status(403).json({ message: "هذه العملية متاحة للمدراء فقط" });
      }
      
      const { receiptId } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "سبب الإبطال مطلوب" });
      }
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      const success = await ReceiptService.revokeReceipt(receiptId, reason, userId.toString());
      
      if (success) {
        res.json({ message: "تم إبطال الإيصال بنجاح" });
      } else {
        res.status(404).json({ message: "الإيصال غير موجود" });
      }
      
    } catch (error) {
      console.error("خطأ في إبطال الإيصال:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إبطال الإيصال" });
    }
  });
  
  // إعادة إصدار إيصال
  app.post("/api/receipts/regenerate", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type, id: userId } = req.user;
      
      if (type !== 'admin') {
        return res.status(403).json({ message: "هذه العملية متاحة للمدراء فقط" });
      }
      
      const { transactionId, locale = 'ar', reason } = req.body;
      
      if (!transactionId || !reason) {
        return res.status(400).json({ message: "معرف المعاملة وسبب إعادة الإصدار مطلوبان" });
      }
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      const receiptId = await ReceiptService.regenerateReceipt(
        transactionId,
        locale,
        reason,
        userId.toString()
      );
      
      if (receiptId) {
        res.json({ 
          message: "تم إعادة إصدار الإيصال بنجاح",
          receiptId
        });
      } else {
        res.status(404).json({ message: "المعاملة غير موجودة" });
      }
      
    } catch (error) {
      console.error("خطأ في إعادة إصدار الإيصال:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إعادة إصدار الإيصال" });
    }
  });
  
  // تحميل إيصال المعاملة (إنشاء إيصال جديد إذا لم يكن موجوداً)
  app.get("/api/receipts/transaction/:transactionId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id: userId, type } = req.user;
      const { transactionId } = req.params;
      
      // إزالة البادئة وتحويل إلى رقم
      const numericId = transactionId.replace(/^(tx-|mkt-|tr-)/, '');
      const parsedId = parseInt(numericId);
      
      if (isNaN(parsedId)) {
        return res.status(400).json({ message: "معرف المعاملة غير صالح" });
      }
      
      // الحصول على المعاملة أولاً
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, parsedId))
        .limit(1);
        
      if (!transaction) {
        return res.status(404).json({ message: "المعاملة غير موجودة" });
      }
      
      // التحقق من الصلاحية - المستخدم يجب أن يكون مالك المعاملة أو admin
      if (type !== 'admin' && transaction.userId !== userId) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه الإيصالات" });
      }
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      
      // البحث عن إيصال موجود للمعاملة
      let receipts = await ReceiptService.getReceiptsByTransaction(parsedId.toString());
      
      // إذا لم يوجد إيصال، إنشاء واحد جديد
      if (!receipts || receipts.length === 0) {
        try {
          // إنشاء بيانات المعاملة للإيصال
          const transactionData = {
            id: parsedId.toString(),
            type: transaction.type,
            userId: transaction.userId,
            amount: transaction.amount,
            currency: transaction.currency,
            commission: transaction.commission || '0',
            counterparty: transaction.counterparty || '',
            ref: transaction.ref || '',
            referenceNumber: transaction.referenceNumber || `REF-${parsedId}`,
            note: transaction.description || '',
            executedAt: new Date(transaction.date),
            status: 'completed'
          };
          
          const receiptId = await ReceiptService.generateReceipt(transactionData, 'ar');
          if (receiptId) {
            receipts = await ReceiptService.getReceiptsByTransaction(parsedId.toString());
          }
        } catch (generateError) {
          console.error("خطأ في إنشاء الإيصال:", generateError);
          return res.status(404).json({ message: "لا يمكن إنشاء إيصال لهذه المعاملة" });
        }
      }
      
      if (!receipts || receipts.length === 0) {
        return res.status(404).json({ message: "لا يوجد إيصال لهذه المعاملة" });
      }
      
      // تحميل ملف PDF للإيصال الأحدث
      const latestReceipt = receipts[0];
      const pdfPath = latestReceipt.filePath;
      
      if (!pdfPath) {
        return res.status(404).json({ message: "مسار ملف الإيصال غير موجود" });
      }
      
      const fs = await import('fs');
      const path = await import('path');
      const fullPath = path.resolve(pdfPath);
      
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ message: "ملف الإيصال غير موجود" });
      }
      
      // تحديد نوع الملف حسب امتداد الملف
      const fileExtension = path.extname(fullPath).toLowerCase();
      
      if (fileExtension === '.png') {
        // إرسال ملف صورة
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="receipt-${latestReceipt.id}.png"`);
      } else {
        // إرسال ملف PDF (إذا كان نوع قديم)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="receipt-${latestReceipt.id}.pdf"`);
      }
      
      res.sendFile(path.resolve(pdfPath));
      
    } catch (error) {
      console.error("خطأ في تحميل إيصال المعاملة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحميل الإيصال" });
    }
  });

  // جلب قائمة إيصالات المعاملة (JSON)
  app.get("/api/receipts/transaction/:transactionId/list", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id: userId, type } = req.user;
      const { transactionId } = req.params;
      
      // إزالة البادئة وتحويل إلى رقم
      const numericId = transactionId.replace(/^(tx-|mkt-|tr-)/, '');
      const parsedId = parseInt(numericId);
      
      if (isNaN(parsedId)) {
        return res.status(400).json({ message: "معرف المعاملة غير صالح" });
      }
      
      // التحقق من الصلاحية
      if (type !== 'admin') {
        const [transaction] = await db
          .select({ userId: transactions.userId })
          .from(transactions)
          .where(eq(transactions.id, parsedId))
          .limit(1);
        
        if (!transaction || transaction.userId !== userId) {
          return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه الإيصالات" });
        }
      }
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      const receipts = await ReceiptService.getReceiptsByTransaction(parsedId.toString());
      
      res.json(receipts);
      
    } catch (error) {
      console.error("خطأ في جلب إيصالات المعاملة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الإيصالات" });
    }
  });

  // جلب قائمة جميع الإيصالات (للمدير فقط)
  app.get("/api/receipts/admin/all", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.user;
      
      if (type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      const receipts = await ReceiptService.getAllReceipts(limit, offset);
      
      res.json(receipts);
      
    } catch (error) {
      console.error("خطأ في جلب الإيصالات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الإيصالات" });
    }
  });

  // إحصائيات نظام الإيصالات (للمدير فقط)
  app.get("/api/receipts/admin/stats", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.user;
      
      if (type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
      }
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      const stats = await ReceiptService.getReceiptStats();
      
      res.json(stats);
      
    } catch (error) {
      console.error("خطأ في جلب إحصائيات الإيصالات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الإحصائيات" });
    }
  });

  // تحديث إعدادات نظام الإيصالات (للمدير فقط)
  app.post("/api/receipts/admin/settings", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type, email } = req.user;
      
      if (type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
      }
      
      const { key, value } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ message: "المفتاح والقيمة مطلوبان" });
      }
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      const success = await ReceiptService.updateReceiptSetting(key, value, email);
      
      if (success) {
        res.json({ message: "تم تحديث الإعداد بنجاح" });
      } else {
        res.status(500).json({ message: "فشل في تحديث الإعداد" });
      }
      
    } catch (error) {
      console.error("خطأ في تحديث إعدادات الإيصالات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث الإعدادات" });
    }
  });

  // جلب إعداد محدد (للمدير فقط)
  app.get("/api/receipts/admin/settings/:key", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.user;
      
      if (type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
      }
      
      const { key } = req.params;
      
      const { ReceiptService } = await import('./receipt-services/receipt-service');
      const value = await ReceiptService.getReceiptSetting(key);
      
      res.json({ key, value });
      
    } catch (error) {
      console.error("خطأ في جلب إعداد الإيصالات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الإعداد" });
    }
  });

  // سجل تدقيق الإيصالات (للمدير فقط)
  app.get("/api/receipts/admin/audit/:receiptId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.user;
      
      if (type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
      }
      
      const { receiptId } = req.params;
      
      const auditLogs = await db
        .select()
        .from(receiptAuditLog)
        .where(eq(receiptAuditLog.receiptId, receiptId))
        .orderBy(desc(receiptAuditLog.timestamp));
      
      res.json(auditLogs);
      
    } catch (error) {
      console.error("خطأ في جلب سجل التدقيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب سجل التدقيق" });
    }
  });

  // =====================================================================
  // نقاط النهاية للرسائل الصوتية (Voice Messages)
  // =====================================================================

  // بدء رفع رسالة صوتية
  app.post('/api/voice/init', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { roomId, privateRoomId, mimeType, durationEstimate } = req.body;
      const userId = req.user.id;

      // التحقق من حدود المعدل
      const rateLimit = await VoiceService.checkRateLimit(userId);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          message: 'تجاوزت الحد الأقصى للرسائل الصوتية',
          remaining: rateLimit.remaining,
          resetIn: 10 // دقائق
        });
      }

      // التحقق من صحة البيانات
      if (!mimeType || !durationEstimate) {
        return res.status(400).json({
          message: 'نوع الملف ومدة التسجيل مطلوبان'
        });
      }

      if (durationEstimate > 120) {
        return res.status(400).json({
          message: 'مدة التسجيل طويلة جداً (الحد الأقصى 120 ثانية)'
        });
      }

      // TODO: التحقق من عضوية الغرفة

      res.json({
        message: 'جاهز لرفع الملف الصوتي',
        maxSizeMB: 10,
        allowedTypes: ['audio/ogg', 'audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav']
      });

    } catch (error) {
      console.error('خطأ في بدء رفع الرسالة الصوتية:', error);
      res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
  });

  // رفع وحفظ رسالة صوتية
  app.post('/api/voice/upload', authMiddleware, voiceUpload.single('voice'), async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { roomId, privateRoomId, messageId, privateMessageId, durationSeconds } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'لم يتم رفع ملف صوتي' });
      }

      if (!durationSeconds) {
        return res.status(400).json({ message: 'مدة التسجيل مطلوبة' });
      }

      // التحقق من حدود المعدل
      const rateLimit = await VoiceService.checkRateLimit(userId);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          message: 'تجاوزت الحد الأقصى للرسائل الصوتية',
          remaining: rateLimit.remaining
        });
      }

      // التحقق من صحة الملف
      const validation = VoiceService.validateVoiceFile(file, parseInt(durationSeconds));
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      // إنشاء رسالة دردشة أولاً لربطها بالرسالة الصوتية
      let newMessage;
      if (roomId) {
        [newMessage] = await db.insert(chatMessages).values({
          roomId: parseInt(roomId),
          senderId: userId,
          content: `[رسالة صوتية - ${Math.floor(parseInt(durationSeconds) / 60)}:${(parseInt(durationSeconds) % 60).toString().padStart(2, '0')}]`,
          createdAt: new Date()
        }).returning();
      } else if (privateRoomId) {
        [newMessage] = await db.insert(privateMessages).values({
          chatId: parseInt(privateRoomId),
          senderId: userId,
          content: `[رسالة صوتية - ${Math.floor(parseInt(durationSeconds) / 60)}:${(parseInt(durationSeconds) % 60).toString().padStart(2, '0')}]`,
          createdAt: new Date()
        }).returning();
      }

      // حفظ الرسالة الصوتية مع ربطها بالرسالة
      const voiceId = await VoiceService.saveVoiceMessage({
        messageId: newMessage?.id,
        privateMessageId: privateRoomId ? newMessage?.id : undefined,
        senderId: userId,
        roomId: roomId ? parseInt(roomId) : undefined,
        privateRoomId: privateRoomId ? parseInt(privateRoomId) : undefined,
        file,
        durationSeconds: parseInt(durationSeconds)
      });

      // تحديث الرسالة لتشمل معرف الصوت
      if (roomId && newMessage) {
        await db.update(chatMessages)
          .set({
            voiceId: voiceId,
            voiceDuration: parseInt(durationSeconds)
          })
          .where(eq(chatMessages.id, newMessage.id));
      } else if (privateRoomId && newMessage) {
        await db.update(privateMessages)
          .set({
            voiceId: voiceId,
            voiceDuration: parseInt(durationSeconds)
          })
          .where(eq(privateMessages.id, newMessage.id));
      }

      // زيادة عداد المعدل
      await VoiceService.incrementRateLimit(userId);

      // جلب اسم المرسل
      const [sender] = await db.select({
        fullName: users.fullName
      }).from(users).where(eq(users.id, userId));

      // إرسال الرسالة عبر WebSocket
      if (roomId && newMessage) {
        const messageWithSender = {
          ...newMessage,
          voiceId: voiceId,
          voiceDuration: parseInt(durationSeconds),
          senderName: sender?.fullName || 'مستخدم',
          isEdited: false,
          isDeleted: false,
        };

        io.to(`room-${roomId}`).emit('newMessage', messageWithSender);
      } else if (privateRoomId && newMessage) {
        const messageWithSender = {
          ...newMessage,
          voiceId: voiceId,
          voiceDuration: parseInt(durationSeconds),
          senderName: sender?.fullName || 'مستخدم',
          isEdited: false,
          isDeleted: false,
        };

        io.to(`private-${privateRoomId}`).emit('newPrivateMessage', messageWithSender);
      }

      res.json({
        message: 'تم رفع الرسالة الصوتية بنجاح',
        voiceId,
        durationSeconds: parseInt(durationSeconds)
      });

    } catch (error) {
      console.error('خطأ في رفع الرسالة الصوتية:', error);
      res.status(500).json({ message: 'حدث خطأ في رفع الملف الصوتي' });
    }
  });

  // تشغيل ملف صوتي
  app.get('/api/voice/stream/:voiceId', async (req: Request, res: Response) => {
    try {
      // التحقق من المصادقة من خلال رأس Authorization أو معامل token
      let token = req.headers.authorization?.replace('Bearer ', '') || req.query.token as string;
      
      if (!token) {
        return res.status(401).json({ message: 'الرمز المميز مطلوب' });
      }

      // التحقق من صحة الرمز المميز
      const JWT_SECRET = getJwtSecret();
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const userId = decoded.userId;
      const { voiceId } = req.params;

      const result = await VoiceService.getVoiceFileUrl(voiceId, userId);
      if (!result) {
        return res.status(404).json({ message: 'الملف الصوتي غير موجود أو غير مصرح لك بالوصول إليه' });
      }

      const { voice } = result;
      console.log('محاولة الوصول للملف الصوتي:', {
        voiceId,
        storageKey: voice.storageKey,
        mimeType: voice.mimeType
      });

      // استخدام المسار الكامل من storageKey
      const filePath = voice.storageKey.startsWith('uploads/') ? voice.storageKey : `uploads/${voice.storageKey}`;
      console.log('مسار الملف النهائي:', filePath);

      try {
        const fs = await import('fs');
        
        // فحص وجود الملف
        try {
          await fs.promises.access(filePath);
        } catch (accessError) {
          console.error('الملف غير موجود:', filePath, accessError);
          return res.status(404).json({ message: 'الملف الصوتي غير موجود على القرص' });
        }

        const stat = await fs.promises.stat(filePath);
        
        // دعم Range Requests للتشغيل
        const range = req.headers.range;
        if (range) {
          const fileSize = stat.size;
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = (end - start) + 1;
          
          const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': voice.mimeType || 'audio/ogg',
          };

          res.writeHead(206, head);
          const file = fs.default.createReadStream(filePath, { start, end });
          file.pipe(res);
        } else {
          res.set({
            'Content-Type': voice.mimeType || 'audio/ogg',
            'Content-Length': stat.size.toString(),
            'Cache-Control': 'private, max-age=3600',
            'Accept-Ranges': 'bytes'
          });
          
          const stream = fs.default.createReadStream(filePath);
          stream.pipe(res);
        }
      } catch (fsError) {
        console.error('خطأ عام في معالجة الملف:', fsError);
        return res.status(500).json({ message: 'خطأ في قراءة الملف الصوتي' });
      }

    } catch (error) {
      console.error('خطأ في تشغيل الملف الصوتي:', error);
      res.status(500).json({ message: 'حدث خطأ في تشغيل الملف الصوتي' });
    }
  });

  // الحصول على معلومات رسالة صوتية
  app.get('/api/voice/:voiceId/info', ensureAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { voiceId } = req.params;
      const userId = req.user.id;

      const [voice] = await db
        .select({
          id: messageVoices.id,
          durationSeconds: messageVoices.durationSeconds,
          fileSizeBytes: messageVoices.fileSizeBytes,
          waveformPeaks: messageVoices.waveformPeaks,
          transcript: messageVoices.transcript,
          transcriptLang: messageVoices.transcriptLang,
          status: messageVoices.status,
          createdAt: messageVoices.createdAt,
          senderName: users.fullName,
        })
        .from(messageVoices)
        .leftJoin(users, eq(messageVoices.senderId, users.id))
        .where(eq(messageVoices.id, voiceId))
        .limit(1);

      if (!voice) {
        return res.status(404).json({ message: 'الرسالة الصوتية غير موجودة' });
      }

      // التحقق من الصلاحيات
      const hasAccess = await VoiceService.checkVoiceAccess(voice, userId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'غير مصرح لك بالوصول لهذه الرسالة الصوتية' });
      }

      res.json(voice);

    } catch (error) {
      console.error('خطأ في جلب معلومات الرسالة الصوتية:', error);
      res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
  });

  // البحث في الرسائل الصوتية
  app.get('/api/voice/search', ensureAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { q, limit = 20 } = req.query;
      const userId = req.user.id;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'نص البحث مطلوب' });
      }

      const results = await VoiceService.searchVoiceMessages(q, userId, parseInt(limit as string));
      res.json(results);

    } catch (error) {
      console.error('خطأ في البحث في الرسائل الصوتية:', error);
      res.status(500).json({ message: 'حدث خطأ في البحث' });
    }
  });

  // حذف رسالة صوتية
  app.delete('/api/voice/:voiceId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { voiceId } = req.params;
      const userId = req.user.id;

      const success = await VoiceService.deleteVoiceMessage(voiceId, userId);
      if (success) {
        res.json({ message: 'تم حذف الرسالة الصوتية بنجاح' });
      } else {
        res.status(403).json({ message: 'غير مصرح لك بحذف هذه الرسالة الصوتية' });
      }

    } catch (error) {
      console.error('خطأ في حذف الرسالة الصوتية:', error);
      res.status(500).json({ message: 'حدث خطأ في حذف الرسالة الصوتية' });
    }
  });

  // إحصائيات الاستخدام
  app.get('/api/voice/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const stats = await VoiceService.getUsageStats(userId);
      res.json(stats);

    } catch (error) {
      console.error('خطأ في جلب إحصائيات الرسائل الصوتية:', error);
      res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
  });

  // إعدادات الصوت للأدمن
  app.get('/api/admin/voice/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user || user.type !== 'admin') {
        return res.status(403).json({ message: 'غير مصرح لك بهذه العملية' });
      }

      const [settings] = await db.select().from(voiceSettings).limit(1);
      res.json(settings || {
        maxDurationSeconds: 120,
        maxFileSizeMb: 10,
        enabled: true,
        transcriptionEnabled: true,
        allowedMimeTypes: ['audio/ogg', 'audio/webm', 'audio/mpeg']
      });

    } catch (error) {
      console.error('خطأ في جلب إعدادات الصوت:', error);
      res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
  });

  // ======== نقاط نهاية رفع الصور ========
  
  // تهيئة رفع الصورة الشخصية
  app.post('/api/me/avatar/init', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { mime, size } = req.body;

      // التحقق من نوع الملف
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(mime)) {
        return res.status(400).json({ 
          message: 'نوع الملف غير مدعوم. استخدم صور بصيغة JPEG أو PNG أو WebP' 
        });
      }

      // التحقق من حجم الملف (2MB)
      const maxSize = 2 * 1024 * 1024;
      if (size > maxSize) {
        return res.status(400).json({ 
          message: 'حجم الملف كبير جداً. الحد الأقصى 2MB' 
        });
      }

      // إنشاء Object Storage Service
      const objectStorageService = new ObjectStorageService();
      
      // إنشاء مفتاح تخزين فريد
      const storageKey = `avatars/${userId}/${Date.now()}-${crypto.randomUUID()}`;
      
      // الحصول على رابط الرفع
      const uploadUrl = await objectStorageService.getObjectEntityUploadURL();

      res.json({
        uploadUrl,
        storageKey
      });

    } catch (error) {
      console.error('خطأ في تهيئة رفع الصورة:', error);
      res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
  });

  // إنهاء رفع الصورة الشخصية
  app.post('/api/me/avatar/finalize', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { storageKey } = req.body;

      if (!storageKey) {
        return res.status(400).json({ message: 'مفتاح التخزين مطلوب' });
      }

      // تحديث الصورة الشخصية في قاعدة البيانات
      const avatarUrl = `/objects/${storageKey}`;
      
      await db.update(users)
        .set({ avatarUrl })
        .where(eq(users.id, userId));

      res.json({
        avatarUrl,
        message: 'تم تحديث الصورة الشخصية بنجاح'
      });

    } catch (error) {
      console.error('خطأ في إنهاء رفع الصورة:', error);
      res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
  });

  // خدمة الصور المخزنة
  app.get('/objects/:storageKey(*)', async (req: Request, res: Response) => {
    try {
      const storageKey = req.params.storageKey;
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(`/objects/${storageKey}`);
      objectStorageService.downloadObject(objectFile, res);

    } catch (error) {
      console.error('خطأ في جلب الصورة:', error);
      if (error instanceof Error && error.message === 'Object not found') {
        res.status(404).json({ message: 'الصورة غير موجودة' });
      } else {
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
      }
    }
  });

  // الحصول على معلومات المستخدم (بما في ذلك الصورة الشخصية)
  app.get('/api/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      console.log('🔍 جلب بيانات المستخدم:', userId);
      
      const user = await storage.getUser(userId);
      console.log('👤 بيانات المستخدم:', user ? 'موجودة' : 'غير موجودة');

      if (!user) {
        return res.status(404).json({ message: 'المستخدم غير موجود' });
      }

      // جلب إعدادات المستخدم
      const [userSettingsData] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
      console.log('⚙️ إعدادات المستخدم:', userSettingsData ? 'موجودة' : 'غير موجودة');
      console.log('📊 تفاصيل الإعدادات:', userSettingsData);

      const responseData = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        avatarUrl: user.avatarUrl,
        settings: userSettingsData || null
      };
      
      console.log('📤 البيانات المرسلة:', responseData);
      res.json(responseData);

    } catch (error) {
      console.error('خطأ في جلب معلومات المستخدم:', error);
      res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
  });

  // تحديث الملف الشخصي
  app.patch('/api/me/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const profileData = updateUserProfileSchema.parse(req.body);

      await db.update(users)
        .set({
          fullName: profileData.fullName,
          phone: profileData.phone,
          city: profileData.city
        })
        .where(eq(users.id, userId));

      res.json({ message: 'تم تحديث الملف الشخصي بنجاح' });

    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
  });

  // تغيير كلمة المرور
  app.patch('/api/me/password', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const passwordData = changePasswordSchema.parse(req.body);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'المستخدم غير موجود' });
      }

      // التحقق من كلمة المرور الحالية
      const isValidPassword = await bcrypt.compare(passwordData.currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
      }

      // تشفير كلمة المرور الجديدة
      const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, 10);

      await db.update(users)
        .set({ password: hashedNewPassword })
        .where(eq(users.id, userId));

      res.json({ message: 'تم تغيير كلمة المرور بنجاح' });

    } catch (error) {
      console.error('خطأ في تغيير كلمة المرور:', error);
      res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
  });

  // تحديث إعدادات المستخدم
  app.patch('/api/me/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const settingsData = insertUserSettingsSchema.parse(req.body);

      // التحقق من وجود إعدادات موجودة
      const [existingSettings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

      if (existingSettings) {
        // تحديث الإعدادات الموجودة
        await db.update(userSettings)
          .set({
            language: settingsData.language,
            theme: settingsData.theme,
            timezone: settingsData.timezone,
            baseCurrency: settingsData.baseCurrency,
            notifications: settingsData.notifications
          })
          .where(eq(userSettings.userId, userId));
      } else {
        // إنشاء إعدادات جديدة
        await db.insert(userSettings).values({
          userId,
          language: settingsData.language,
          theme: settingsData.theme,
          timezone: settingsData.timezone,
          baseCurrency: settingsData.baseCurrency,
          notifications: settingsData.notifications
        });
      }

      res.json({ message: 'تم تحديث الإعدادات بنجاح' });

    } catch (error) {
      console.error('خطأ في تحديث الإعدادات:', error);
      res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
  });

  // ===== API مراقبة الرسائل للمشرف العام =====
  
  // routes مراقبة الرسائل (للمشرف العام فقط)
  app.get("/api/admin/message-monitoring/private-chats", authMiddleware, async (req, res) => {
    try {
      const { email } = (req as AuthRequest).user;
      
      // التحقق من صلاحية المشرف العام
      if (email !== "ss73ss73ss73@gmail.com") {
        return res.status(403).json({ 
          error: "غير مصرح - هذه الصفحة مخصصة للمشرف العام فقط" 
        });
      }
      
      console.log("🔍 جلب ملخص الدردشات الخاصة...");
      
      const privateChatsSummary = await db
        .select({
          id: privateChats.id,
          user1Id: privateChats.user1Id,
          user2Id: privateChats.user2Id,
          user1Name: sql<string>`u1.full_name`,
          user2Name: sql<string>`u2.full_name`,
          user1AccountNumber: sql<string>`u1.account_number`,
          user2AccountNumber: sql<string>`u2.account_number`,
          lastMessageAt: privateChats.lastMessageAt,
          messageCount: sql<number>`COUNT(pm.id)::int`,
        })
        .from(privateChats)
        .leftJoin(sql`users u1`, eq(privateChats.user1Id, sql`u1.id`))
        .leftJoin(sql`users u2`, eq(privateChats.user2Id, sql`u2.id`))
        .leftJoin(privateMessages, eq(privateChats.id, privateMessages.chatId))
        .groupBy(
          privateChats.id,
          privateChats.user1Id,
          privateChats.user2Id,
          sql`u1.full_name`,
          sql`u2.full_name`,
          sql`u1.account_number`,
          sql`u2.account_number`,
          privateChats.lastMessageAt
        )
        .orderBy(desc(privateChats.lastMessageAt));

      console.log(`✅ تم جلب ${privateChatsSummary.length} دردشة خاصة`);
      res.json(privateChatsSummary);
    } catch (error) {
      console.error("❌ خطأ في جلب الدردشات الخاصة:", error);
      res.status(500).json({ error: "خطأ في جلب البيانات" });
    }
  });

  // جلب ملخص الغرف العامة
  app.get("/api/admin/message-monitoring/public-chats", authMiddleware, async (req, res) => {
    try {
      const { email } = (req as AuthRequest).user;
      
      if (email !== "ss73ss73ss73@gmail.com") {
        return res.status(403).json({ 
          error: "غير مصرح - هذه الصفحة مخصصة للمشرف العام فقط" 
        });
      }
      
      console.log("🔍 جلب ملخص الغرف العامة...");
      
      // جلب غرف الدردشة العامة
      const publicRooms = await db
        .select({
          id: chatRooms.id,
          roomName: chatRooms.name,
          description: chatRooms.description,
          isActive: chatRooms.isPublic,
          messageCount: sql<number>`COUNT(cm.id)::int`,
          participantCount: sql<number>`0`,
          lastMessageAt: sql<string>`COALESCE(MAX(cm.created_at), ${chatRooms.createdAt})`,
        })
        .from(chatRooms)
        .leftJoin(sql`chat_messages cm`, eq(chatRooms.id, sql`cm.room_id`))
        .groupBy(chatRooms.id, chatRooms.name, chatRooms.description, chatRooms.isPublic, chatRooms.createdAt)
        .orderBy(desc(sql`COALESCE(MAX(cm.created_at), ${chatRooms.createdAt})`));

      // جلب محادثات المجموعات
      const groupChatsData = await db
        .select({
          id: groupChats.id,
          roomName: groupChats.name,
          description: groupChats.description,
          isActive: sql<boolean>`true`,
          messageCount: sql<number>`COUNT(gm.id)::int`,
          participantCount: sql<number>`0`,
          lastMessageAt: sql<string>`COALESCE(MAX(gm.created_at), ${groupChats.createdAt})`,
        })
        .from(groupChats)
        .leftJoin(sql`group_messages gm`, eq(groupChats.id, sql`gm.group_id`))
        .groupBy(groupChats.id, groupChats.name, groupChats.description, groupChats.createdAt)
        .orderBy(desc(sql`COALESCE(MAX(gm.created_at), ${groupChats.createdAt})`));

      // دمج البيانات
      const allPublicChats = [
        ...publicRooms.map(room => ({
          ...room,
          type: 'public_room' as const
        })),
        ...groupChatsData.map(group => ({
          ...group,
          type: 'group_chat' as const
        }))
      ];

      console.log(`✅ تم جلب ${allPublicChats.length} غرفة عامة/مجموعة`);
      res.json(allPublicChats);
    } catch (error) {
      console.error("❌ خطأ في جلب الغرف العامة:", error);
      res.status(500).json({ error: "خطأ في جلب البيانات" });
    }
  });

  // جلب رسائل محادثة
  app.get("/api/admin/message-monitoring/messages/:chatId", authMiddleware, async (req, res) => {
    try {
      const { email } = (req as AuthRequest).user;
      const { chatId } = req.params;
      const { chatType, startDate, endDate, keyword, sender } = req.query;
      
      if (email !== "ss73ss73ss73@gmail.com") {
        return res.status(403).json({ 
          error: "غير مصرح - هذه الصفحة مخصصة للمشرف العام فقط" 
        });
      }
      
      console.log(`🔍 جلب رسائل ${chatType} للمحادثة ${chatId}...`);

      let messages: any[] = [];

      if (chatType === "private") {
        // جلب رسائل المحادثة الخاصة
        const whereConditions = [eq(privateMessages.chatId, parseInt(chatId))];
        
        if (startDate) {
          whereConditions.push(gte(privateMessages.createdAt, new Date(startDate as string)));
        }
        if (endDate) {
          whereConditions.push(lte(privateMessages.createdAt, new Date(endDate as string)));
        }
        if (keyword) {
          whereConditions.push(like(privateMessages.content, `%${keyword}%`));
        }

        messages = await db
          .select({
            id: privateMessages.id,
            senderId: privateMessages.senderId,
            senderName: users.fullName,
            senderAccountNumber: users.accountNumber,
            content: privateMessages.content,
            createdAt: privateMessages.createdAt,
            isEdited: privateMessages.isEdited,
            editedAt: privateMessages.editedAt,
            isDeleted: privateMessages.isDeleted,
            deletedAt: privateMessages.deletedAt,
            deletedBy: privateMessages.deletedBy,
            fileUrl: privateMessages.fileUrl,
            fileType: privateMessages.fileType,
            voiceId: privateMessages.voiceId,
            voiceDuration: privateMessages.voiceDuration,
          })
          .from(privateMessages)
          .leftJoin(users, eq(privateMessages.senderId, users.id))
          .where(and(...whereConditions))
          .orderBy(desc(privateMessages.createdAt));

      } else if (chatType === "public") {
        // تحديد نوع الغرفة (عامة أم مجموعة)
        const chatRoomExists = await db
          .select({ id: chatRooms.id })
          .from(chatRooms)
          .where(eq(chatRooms.id, parseInt(chatId)))
          .limit(1);

        if (chatRoomExists.length > 0) {
          // غرفة دردشة عامة
          const whereConditions = [eq(chatMessages.roomId, parseInt(chatId))];
          
          if (startDate) {
            whereConditions.push(gte(chatMessages.createdAt, new Date(startDate as string)));
          }
          if (endDate) {
            whereConditions.push(lte(chatMessages.createdAt, new Date(endDate as string)));
          }
          if (keyword) {
            whereConditions.push(like(chatMessages.content, `%${keyword}%`));
          }

          messages = await db
            .select({
              id: chatMessages.id,
              senderId: chatMessages.senderId,
              senderName: users.fullName,
              senderAccountNumber: users.accountNumber,
              content: chatMessages.content,
              createdAt: chatMessages.createdAt,
              isEdited: chatMessages.isEdited,
              editedAt: chatMessages.editedAt,
              isDeleted: chatMessages.isDeleted,
              deletedAt: chatMessages.deletedAt,
              deletedBy: chatMessages.deletedBy,
              fileUrl: chatMessages.fileUrl,
              fileType: chatMessages.fileType,
              voiceId: chatMessages.voiceId,
              voiceDuration: chatMessages.voiceDuration,
            })
            .from(chatMessages)
            .leftJoin(users, eq(chatMessages.senderId, users.id))
            .where(and(...whereConditions))
            .orderBy(desc(chatMessages.createdAt));
        } else {
          // محادثة مجموعة
          const whereConditions = [eq(groupMessages.groupId, parseInt(chatId))];
          
          if (startDate) {
            whereConditions.push(gte(groupMessages.createdAt, new Date(startDate as string)));
          }
          if (endDate) {
            whereConditions.push(lte(groupMessages.createdAt, new Date(endDate as string)));
          }
          if (keyword) {
            whereConditions.push(like(groupMessages.content, `%${keyword}%`));
          }

          messages = await db
            .select({
              id: groupMessages.id,
              senderId: groupMessages.senderId,
              senderName: users.fullName,
              senderAccountNumber: users.accountNumber,
              content: groupMessages.content,
              createdAt: groupMessages.createdAt,
              isEdited: groupMessages.isEdited,
              editedAt: groupMessages.editedAt,
              isDeleted: sql<boolean>`false`,
              deletedAt: sql<Date | null>`null`,
              deletedBy: sql<number | null>`null`,
              fileUrl: groupMessages.fileUrl,
              fileType: groupMessages.fileType,
              voiceId: sql<string | null>`null`,
              voiceDuration: sql<number | null>`null`,
              groupId: groupMessages.groupId,
              groupName: groupChats.name,
            })
            .from(groupMessages)
            .leftJoin(users, eq(groupMessages.senderId, users.id))
            .leftJoin(groupChats, eq(groupMessages.groupId, groupChats.id))
            .where(and(...whereConditions))
            .orderBy(desc(groupMessages.createdAt));
        }
      }

      console.log(`✅ تم جلب ${messages.length} رسالة`);
      res.json(messages);
    } catch (error) {
      console.error("❌ خطأ في جلب الرسائل:", error);
      res.status(500).json({ error: "خطأ في جلب الرسائل" });
    }
  });

  // تصدير بيانات المحادثة
  app.post("/api/admin/message-monitoring/export", authMiddleware, async (req, res) => {
    try {
      const { email } = (req as AuthRequest).user;
      const { chatId, chatType, format, filter } = req.body;
      
      if (email !== "ss73ss73ss73@gmail.com") {
        return res.status(403).json({ 
          error: "غير مصرح - هذه الصفحة مخصصة للمشرف العام فقط" 
        });
      }
      
      console.log(`📤 تصدير بيانات المحادثة ${chatId} بصيغة ${format}...`);

      if (format === 'csv') {
        // تصدير CSV مبسط
        const csvHeader = 'الرقم,المرسل,رقم الحساب,المحتوى,التاريخ,معدلة,محذوفة\n';
        const csvRows = `1,"مثال","123","مثال محتوى","${new Date().toLocaleString('ar-SA')}","لا","لا"`;
        const csvContent = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=chat-${chatId}-${new Date().toISOString().split('T')[0]}.csv`);
        res.send('\uFEFF' + csvContent);
        
      } else {
        res.status(400).json({ error: "صيغة تصدير غير مدعومة" });
      }

      console.log(`✅ تم تصدير البيانات بنجاح`);
    } catch (error) {
      console.error("❌ خطأ في تصدير البيانات:", error);
      res.status(500).json({ error: "خطأ في تصدير البيانات" });
    }
  });

  // جلب جميع الرسائل الخاصة للمراقبة - نسخة محسنة
  app.get("/api/chat/private-messages-all", authMiddleware, async (req, res) => {
    try {
      const { email } = (req as AuthRequest).user;
      
      if (email !== "ss73ss73ss73@gmail.com") {
        return res.status(403).json({ 
          error: "غير مصرح - هذه الصفحة مخصصة للمشرف العام فقط" 
        });
      }

      console.log("🔍 جلب جميع الرسائل الخاصة للمراقبة...");

      const result = await pool.query(`
        SELECT 
          pm.id,
          pm.content,
          pm.sender_id as "senderId",
          s.full_name as "senderName",
          s.email as "senderEmail",
          CASE WHEN pc.user1_id = pm.sender_id THEN pc.user2_id ELSE pc.user1_id END as "receiverId",
          CASE WHEN pc.user1_id = pm.sender_id THEN r2.full_name ELSE r1.full_name END as "receiverName",
          CASE WHEN pc.user1_id = pm.sender_id THEN r2.email ELSE r1.email END as "receiverEmail",
          pm.created_at as "createdAt",
          COALESCE(pm.is_edited, false) as "isEdited",
          COALESCE(pm.is_deleted, false) as "isDeleted",
          pm.file_url as "fileUrl",
          pm.file_type as "fileType",
          'private' as type
        FROM private_messages pm
        JOIN private_chats pc ON pm.chat_id = pc.id
        JOIN users s ON pm.sender_id = s.id
        JOIN users r1 ON pc.user1_id = r1.id
        JOIN users r2 ON pc.user2_id = r2.id
        ORDER BY pm.created_at DESC
        LIMIT 100
      `);

      console.log(`✅ تم جلب ${result.rows.length} رسالة خاصة`);
      res.json(result.rows);
    } catch (error) {
      console.error("❌ خطأ في جلب الرسائل الخاصة:", error);
      res.status(500).json({ error: "خطأ في جلب الرسائل الخاصة" });
    }
  });

  // ===== مسارات السوق المباشر =====
  
  // جلب العروض النشطة
  app.get("/api/market/offers", authMiddleware, checkPageRestrictions('market'), async (req, res) => {
    try {
      console.log("🔍 جلب العروض النشطة من السوق...");

      const result = await pool.query(`
        SELECT 
          mo.id,
          mo.user_id as "userId",
          u.full_name as "userFullName",
          u.email as "userEmail",
          mo.side,
          mo.base_currency as "baseCurrency",
          mo.quote_currency as "quoteCurrency",
          mo.price,
          mo.min_amount as "minAmount",
          mo.max_amount as "maxAmount",
          mo.remaining_amount as "remainingAmount",
          mo.city,
          mo.deliver_type as "deliverType",
          mo.terms,
          mo.status,
          mo.created_at as "createdAt"
        FROM market_offers mo
        JOIN users u ON mo.user_id = u.id
        WHERE mo.status = 'open'
        ORDER BY mo.created_at DESC
        LIMIT 50
      `);

      // Add legacy field mappings for frontend compatibility
      const enhancedOffers = result.rows.map(offer => ({
        ...offer,
        // Legacy field mappings for frontend compatibility
        offerType: offer.side,
        fromCurrency: offer.baseCurrency,
        toCurrency: offer.quoteCurrency,
        rate: parseFloat(offer.price),
        amount: offer.maxAmount,
        available: offer.remainingAmount,
      }));

      console.log(`✅ تم جلب ${result.rows.length} عرض`);
      res.json(enhancedOffers);
    } catch (error) {
      console.error("❌ خطأ في جلب العروض:", error);
      res.status(500).json({ error: "خطأ في جلب العروض" });
    }
  });

  // إنشاء عرض جديد
  app.post("/api/market/offers", authMiddleware, async (req, res) => {
    try {
      const { id: userId } = (req as AuthRequest).user;
      const { 
        side, baseCurrency, quoteCurrency, price, 
        minAmount, maxAmount, city, deliverType, terms 
      } = req.body;

      console.log("📝 إنشاء عرض جديد:", { side, baseCurrency, quoteCurrency, price });

      // التحقق من الحقول المطلوبة
      if (!side || !baseCurrency || !quoteCurrency || !price || !minAmount || !maxAmount) {
        return res.status(400).json({ 
          error: "جميع الحقول مطلوبة",
          message: "يرجى ملء جميع الحقول المطلوبة" 
        });
      }

      // التحقق من صحة البيانات
      if (parseFloat(price) <= 0) {
        return res.status(400).json({ 
          error: "سعر غير صالح",
          message: "يجب أن يكون السعر أكبر من الصفر" 
        });
      }

      if (parseFloat(minAmount) <= 0 || parseFloat(maxAmount) <= 0) {
        return res.status(400).json({ 
          error: "كمية غير صالحة",
          message: "يجب أن تكون الكمية أكبر من الصفر" 
        });
      }

      if (parseFloat(minAmount) > parseFloat(maxAmount)) {
        return res.status(400).json({ 
          error: "خطأ في الحدود",
          message: "الحد الأدنى يجب أن يكون أقل من أو يساوي الحد الأقصى" 
        });
      }

      const result = await pool.query(`
        INSERT INTO market_offers (
          user_id, side, base_currency, quote_currency, price,
          min_amount, max_amount, remaining_amount, city, deliver_type, terms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10)
        RETURNING id, created_at as "createdAt"
      `, [
        userId, side, baseCurrency, quoteCurrency, price,
        minAmount, maxAmount, city || null, deliverType || 'internal_transfer', terms || null
      ]);

      const newOffer = result.rows[0];
      
      // إنشاء رسالة في دردشة السوق لتبليغ المستخدمين
      await pool.query(`
        INSERT INTO market_messages (user_id, type, offer_id, content)
        VALUES ($1, 'OFFER', $2, $3)
      `, [
        userId, 
        newOffer.id,
        `عرض جديد: ${side === 'sell' ? 'بيع' : 'شراء'} ${baseCurrency}/${quoteCurrency} بسعر ${price}`
      ]);

      console.log(`✅ تم إنشاء العرض رقم ${newOffer.id} بنجاح`);
      res.json({
        success: true,
        id: newOffer.id,
        side,
        baseCurrency,
        quoteCurrency, 
        price,
        minAmount,
        maxAmount,
        city,
        deliverType: deliverType || 'internal_transfer',
        terms,
        createdAt: newOffer.createdAt,
        message: "تم إنشاء العرض بنجاح"
      });
    } catch (error) {
      console.error("❌ خطأ في إنشاء العرض:", error);
      res.status(500).json({ 
        error: "خطأ في إنشاء العرض",
        message: "حدث خطأ أثناء إنشاء العرض، يرجى المحاولة مرة أخرى" 
      });
    }
  });

  // جلب رسائل دردشة السوق
  app.get("/api/market/messages", authMiddleware, checkPageRestrictions('market'), async (req, res) => {
    try {
      console.log("🔍 جلب رسائل دردشة السوق...");

      const result = await pool.query(`
        SELECT 
          mm.id,
          mm.user_id as "userId",
          u.full_name as "userFullName",
          u.email as "userEmail",
          mm.type,
          mm.content,
          mm.offer_id as "offerId",
          mm.bid_id as "bidId",
          mm.created_at as "createdAt",
          -- معلومات العرض إن وجد
          mo.side as "offerSide",
          mo.base_currency as "offerBaseCurrency",
          mo.quote_currency as "offerQuoteCurrency",
          mo.price as "offerPrice"
        FROM market_messages mm
        LEFT JOIN users u ON mm.user_id = u.id
        LEFT JOIN market_offers mo ON mm.offer_id = mo.id
        WHERE mm.channel_id = 1  -- الغرفة الافتراضية
        ORDER BY mm.created_at ASC
        LIMIT 50
      `);

      console.log(`✅ تم جلب ${result.rows.length} رسالة من دردشة السوق`);
      res.json(result.rows);
    } catch (error) {
      console.error("❌ خطأ في جلب رسائل دردشة السوق:", error);
      res.status(500).json({ error: "خطأ في جلب الرسائل" });
    }
  });

  // إرسال رسالة إلى دردشة السوق
  app.post("/api/market/messages", authMiddleware, async (req, res) => {
    try {
      const { id: userId } = (req as AuthRequest).user;
      const { content } = req.body;

      console.log("📝 إرسال رسالة جديدة إلى دردشة السوق:", { userId, content });

      // التحقق من وجود المحتوى
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ 
          error: "محتوى الرسالة مطلوب",
          message: "يرجى كتابة محتوى الرسالة" 
        });
      }

      // إدراج الرسالة في قاعدة البيانات
      const result = await pool.query(`
        INSERT INTO market_messages (user_id, type, content, channel_id)
        VALUES ($1, 'MESSAGE', $2, 1)
        RETURNING id, created_at as "createdAt"
      `, [userId, content.trim()]);

      const newMessage = result.rows[0];

      console.log(`✅ تم إرسال الرسالة رقم ${newMessage.id} بنجاح`);
      res.json({
        success: true,
        messageId: newMessage.id,
        message: "تم إرسال الرسالة بنجاح"
      });
    } catch (error) {
      console.error("❌ خطأ في إرسال رسالة دردشة السوق:", error);
      res.status(500).json({ 
        error: "خطأ في إرسال الرسالة",
        message: "حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى" 
      });
    }
  });

  // تنفيذ صفقة فورية في السوق المباشر
  app.post("/api/market/execute-trade", authMiddleware, async (req, res) => {
    try {
      const { id: buyerId } = (req as AuthRequest).user;
      const { offerId, amount, notes } = req.body;

      console.log("💰 تنفيذ صفقة فورية:", { buyerId, offerId, amount, notes });

      // التحقق من صحة البيانات
      if (!offerId || !amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "بيانات الصفقة غير صحيحة" 
        });
      }

      // جلب تفاصيل العرض
      const offerResult = await pool.query(`
        SELECT 
          mo.*,
          u.full_name as "userFullName",
          u.account_number as "userAccountNumber"
        FROM market_offers mo
        LEFT JOIN users u ON mo.user_id = u.id
        WHERE mo.id = $1 AND mo.status = 'open'
      `, [offerId]);

      if (offerResult.rows.length === 0) {
        console.log("❌ العرض غير موجود أو مغلق - معرف العرض:", offerId);
        return res.status(404).json({ 
          success: false, 
          message: "العرض غير موجود أو مغلق" 
        });
      }

      const offer = offerResult.rows[0];
      const tradeAmount = parseFloat(amount);

      // التحقق من الحدود
      if (tradeAmount < parseFloat(offer.min_amount) || tradeAmount > parseFloat(offer.max_amount)) {
        return res.status(400).json({ 
          success: false, 
          message: `المبلغ يجب أن يكون بين ${offer.min_amount} و ${offer.max_amount} ${offer.base_currency}` 
        });
      }

      // التحقق من المبلغ المتبقي
      if (tradeAmount > parseFloat(offer.remaining_amount)) {
        return res.status(400).json({ 
          success: false, 
          message: `المبلغ المتبقي في العرض هو ${offer.remaining_amount} ${offer.base_currency}` 
        });
      }

      // منع المستخدم من التداول مع عرضه الخاص
      if (offer.user_id === buyerId) {
        return res.status(400).json({ 
          success: false, 
          message: "لا يمكنك التداول مع عرضك الخاص" 
        });
      }

      // حساب التكلفة الإجمالية
      const totalCost = tradeAmount * parseFloat(offer.price);
      const currency = offer.side === 'sell' ? offer.quote_currency : offer.base_currency;
      
      console.log('💰 تفاصيل العرض:', {
        offerId: offer.id,
        side: offer.side,
        baseCurrency: offer.base_currency,
        quoteCurrency: offer.quote_currency,
        price: offer.price,
        tradeAmount,
        totalCost,
        paymentCurrency: currency
      });

      // التحقق من رصيد المشتري
      const buyerBalanceResult = await pool.query(`
        SELECT amount FROM balances WHERE user_id = $1 AND currency = $2
      `, [buyerId, currency]);

      const buyerBalance = buyerBalanceResult.rows.length > 0 ? 
                          parseFloat(buyerBalanceResult.rows[0].amount) : 0;

      if (buyerBalance < totalCost) {
        return res.status(400).json({ 
          success: false, 
          message: `رصيد ${currency} غير كافي. المطلوب: ${totalCost.toFixed(2)}، المتاح: ${buyerBalance.toFixed(2)}` 
        });
      }

      // بدء المعاملة
      await pool.query('BEGIN');

      try {
        // تحديث رصيد المشتري (خصم)
        await pool.query(`
          UPDATE balances 
          SET amount = amount - $1
          WHERE user_id = $2 AND currency = $3
        `, [totalCost, buyerId, currency]);

        // تحديث رصيد البائع (إضافة)
        const buyerCurrency = offer.side === 'sell' ? offer.base_currency : offer.quote_currency;
        const buyerReceiveAmount = offer.side === 'sell' ? tradeAmount : totalCost;
        
        console.log('🔄 تفاصيل تحديث الأرصدة:', {
          buyerCurrency,
          buyerReceiveAmount,
          sellerId: offer.user_id,
          paymentCurrency: currency,
          paymentAmount: totalCost
        });
        
        // التحقق من وجود رصيد البائع أولاً
        const sellerBalanceCheck = await pool.query(`
          SELECT id FROM balances WHERE user_id = $1 AND currency = $2
        `, [offer.user_id, currency]);

        if (sellerBalanceCheck.rows.length === 0) {
          // إنشاء رصيد للبائع إذا لم يكن موجوداً
          await pool.query(`
            INSERT INTO balances (user_id, currency, amount)
            VALUES ($1, $2, $3)
          `, [offer.user_id, currency, totalCost]);
        } else {
          // تحديث رصيد البائع
          await pool.query(`
            UPDATE balances 
            SET amount = amount + $1
            WHERE user_id = $2 AND currency = $3
          `, [totalCost, offer.user_id, currency]);
        }

        // التحقق من وجود رصيد المشتري في العملة المستلمة
        const buyerReceiveCurrencyCheck = await pool.query(`
          SELECT id FROM balances WHERE user_id = $1 AND currency = $2
        `, [buyerId, buyerCurrency]);

        if (buyerReceiveCurrencyCheck.rows.length === 0) {
          // إنشاء رصيد للمشتري إذا لم يكن موجوداً
          await pool.query(`
            INSERT INTO balances (user_id, currency, amount)
            VALUES ($1, $2, $3)
          `, [buyerId, buyerCurrency, buyerReceiveAmount]);
        } else {
          // تحديث رصيد المشتري في العملة المستلمة
          await pool.query(`
            UPDATE balances 
            SET amount = amount + $1
            WHERE user_id = $2 AND currency = $3
          `, [buyerReceiveAmount, buyerId, buyerCurrency]);
        }

        // تحديث المبلغ المتبقي في العرض
        const newRemainingAmount = parseFloat(offer.remaining_amount) - tradeAmount;
        // إذا لم يبق شيء في العرض، نلغيه، وإلا نبقيه مفتوحاً
        const newStatus = newRemainingAmount <= 0 ? 'cancelled' : 'open';

        await pool.query(`
          UPDATE market_offers 
          SET remaining_amount = $1, 
              status = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [newRemainingAmount.toString(), newStatus, offerId]);

        // إنشاء معاملة في جدول market_transactions
        const marketTransactionResult = await pool.query(`
          INSERT INTO market_transactions (
            buyer_id, offer_id, amount, total_cost, commission, created_at
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          RETURNING id
        `, [buyerId, offerId, tradeAmount.toString(), totalCost.toString(), '0']);

        const marketTransactionId = marketTransactionResult.rows[0].id;

        // إنشاء معاملة في جدول transactions للمشتري
        await pool.query(`
          INSERT INTO transactions (
            user_id, type, amount, currency, description, 
            reference_number, created_at
          ) VALUES ($1, 'market_trade_buy', $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [
          buyerId, 
          totalCost.toString(), 
          currency,
          `شراء ${tradeAmount} ${buyerCurrency} بسعر ${offer.price}`,
          `MKT-${marketTransactionId}`
        ]);

        // إنشاء معاملة في جدول transactions للبائع  
        await pool.query(`
          INSERT INTO transactions (
            user_id, type, amount, currency, description, 
            reference_number, created_at
          ) VALUES ($1, 'market_trade_sell', $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [
          offer.user_id, 
          buyerReceiveAmount.toString(), 
          buyerCurrency,
          `بيع ${tradeAmount} ${buyerCurrency} بسعر ${offer.price}`,
          `MKT-${marketTransactionId}`
        ]);

        // إرسال رسالة تأكيد في الدردشة
        const confirmationMessage = `✅ تمت الصفقة بنجاح!
💰 المبلغ: ${tradeAmount} ${buyerCurrency}
💱 السعر: ${offer.price} ${currency}
💵 التكلفة: ${totalCost.toFixed(2)} ${currency}
👤 البائع: ${offer.userFullName}
🏦 رقم الحساب: ${offer.userAccountNumber}
📄 الرقم المرجعي: MKT-${marketTransactionId}`;

        await pool.query(`
          INSERT INTO market_messages (user_id, type, content, channel_id)
          VALUES ($1, 'DEAL', $2, 1)
        `, [buyerId, confirmationMessage]);

        // معالجة العمولات المعلقة وتحويلها للنظام
        try {
          // جلب معلومات العمولة من سجل العمولات المعلقة
          const commissionLogsResult = await db.select()
            .from(commissionLogs)
            .where(and(
              eq(commissionLogs.sourceId, offerId),
              eq(commissionLogs.sourceType, 'market_offer'),
              eq(commissionLogs.action, 'suspended')
            ))
            .orderBy(desc(commissionLogs.createdAt))
            .limit(1);
          
          if (commissionLogsResult.length > 0) {
            const log = commissionLogsResult[0];
            // حساب العمولة التناسبية بناءً على الكمية المباعة فقط
            const totalOfferAmount = parseFloat(offer.maxAmount);
            const soldAmount = parseFloat(amount);
            const tradeRatio = soldAmount / totalOfferAmount;
            const proportionalCommission = parseFloat(log.commissionAmount) * tradeRatio;
            
            console.log(`📊 حساب العمولة التناسبية: ${log.commissionAmount} × (${soldAmount}/${totalOfferAmount}) = ${proportionalCommission.toFixed(6)}`);
            
            // أولاً: حساب مكافأة الإحالة وخصمها من العمولة
            let finalCommissionToSystem = proportionalCommission;
            let referralRewardAmount = 0;
            
            // التحقق من وجود إحالة للمشتري
            const referralCheck = await pool.query(`
              SELECT u.referred_by, s.enabled as referral_enabled
              FROM users u
              CROSS JOIN (SELECT value->'enabled' as enabled FROM settings WHERE key = 'referral.enabled' LIMIT 1) s
              WHERE u.id = $1 AND u.referred_by IS NOT NULL
            `, [buyerId]);

            if (referralCheck.rows.length > 0 && referralCheck.rows[0].referral_enabled === true) {
              // حساب مكافأة ثابتة: 5 دولار لكل عملية تداول
              referralRewardAmount = log.commissionCurrency === 'USD' ? 5.0 : 
                                   log.commissionCurrency === 'LYD' ? 25.0 : 5.0;
              
              // التأكد من أن المكافأة لا تتجاوز العمولة
              if (referralRewardAmount > proportionalCommission) {
                referralRewardAmount = proportionalCommission * 0.5; // 50% من العمولة كحد أقصى
              }
              
              finalCommissionToSystem = proportionalCommission - referralRewardAmount;
              console.log(`🎁 تم حساب مكافأة إحالة: ${referralRewardAmount.toFixed(6)} ${log.commissionCurrency}`);
              console.log(`💰 صافي العمولة للنظام: ${finalCommissionToSystem.toFixed(6)} ${log.commissionCurrency}`);
            }
            
            // ثانياً: إضافة صافي العمولة فقط (بعد خصم الإحالة) إلى حساب تجميع النظام
            await storage.addCommissionPoolTransaction({
              sourceType: 'user',
              sourceId: offer.user_id,
              sourceName: `صافي عمولة بيع (بعد خصم الإحالة): ${offer.base_currency}→${offer.quote_currency}`,
              currencyCode: log.commissionCurrency,
              amount: finalCommissionToSystem.toFixed(6),
              transactionType: 'credit',
              description: `صافي عمولة السوق بعد خصم مكافأة إحالة ${referralRewardAmount.toFixed(6)} - البائع: ${offer.user_id}, المشتري: ${buyerId}`
            });
            
            console.log(`🏦 تم إضافة صافي العمولة لحساب النظام: ${finalCommissionToSystem.toFixed(6)} ${log.commissionCurrency}`);
            
            // إضافة سجل تحويل صافي العمولة (بعد خصم الإحالة)
            await db.insert(commissionLogs).values({
              userId: offer.user_id,
              userName: log.userName,
              offerType: log.offerType,
              commissionAmount: finalCommissionToSystem.toFixed(6),
              commissionCurrency: log.commissionCurrency,
              sourceId: offerId,
              sourceType: 'market_offer',
              action: 'transferred',
              description: `صافي عمولة النظام بعد خصم إحالة ${referralRewardAmount.toFixed(6)} من ${proportionalCommission.toFixed(6)} - ${offer.base_currency}→${offer.quote_currency}`,
            });

            // حساب وتسجيل عمولة مكتسبة للمشتري (نسبة من العمولة المدفوعة)
            const buyerCommissionRate = 0.5; // المشتري يحصل على 50% من العمولة
            const buyerCommission = proportionalCommission * buyerCommissionRate;
            
            // جلب اسم المشتري
            const buyerResult = await pool.query(`SELECT full_name FROM users WHERE id = $1`, [buyerId]);
            const buyerName = buyerResult.rows[0]?.full_name || 'مستخدم غير معروف';
            
            // تسجيل عمولة مكتسبة للمشتري
            await db.insert(commissionLogs).values({
              userId: buyerId,
              userName: buyerName,
              offerType: 'buy',
              commissionAmount: buyerCommission.toFixed(6),
              commissionCurrency: log.commissionCurrency,
              sourceId: offerId,
              sourceType: 'market_transaction',
              action: 'earned',
              description: `عمولة مكتسبة من شراء: ${offer.base_currency}→${offer.quote_currency}, المبلغ: ${tradeAmount}`,
            });
            
            console.log(`💰 تم تسجيل عمولة مكتسبة للمشتري ${buyerId}: ${buyerCommission.toFixed(6)} ${log.commissionCurrency}`);
            
            // ثالثاً: الآن فقط إعطاء المكافأة للمُحيل (بعد أن تم خصمها من النظام بالفعل)
            if (referralRewardAmount > 0 && referralCheck.rows.length > 0) {
              try {
                const referrerId = referralCheck.rows[0].referred_by;
                
                // إضافة المكافأة إلى رصيد الإحالة
                await pool.query(`
                  INSERT INTO referral_balances (user_id, currency, amount)
                  VALUES ($1, $2, $3)
                  ON CONFLICT (user_id, currency) 
                  DO UPDATE SET amount = referral_balances.amount + EXCLUDED.amount
                `, [referrerId, log.commissionCurrency, referralRewardAmount]);

                // تسجيل في كشف حساب المُحيل
                await pool.query(`
                  INSERT INTO account_statements (
                    user_id, type, amount, currency, description, 
                    reference_number, created_at
                  ) VALUES ($1, 'referral_reward_received', $2, $3, $4, $5, CURRENT_TIMESTAMP)
                `, [
                  referrerId,
                  referralRewardAmount,
                  log.commissionCurrency,
                  `مكافأة إحالة مخصومة من عمولة السوق - معاملة ${marketTransactionId}`,
                  `REF-${marketTransactionId}`
                ]);

                // إشعار المُحيل
                const referrerInfo = await pool.query(`SELECT full_name FROM users WHERE id = $1`, [referrerId]);
                const buyerInfo = await pool.query(`SELECT full_name FROM users WHERE id = $1`, [buyerId]);
                
                if (referrerInfo.rows.length > 0) {
                  await pool.query(`
                    INSERT INTO user_notifications (user_id, title, body, type, is_read, created_at)
                    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                  `, [
                    referrerId,
                    '🎁 مكافأة إحالة مخصومة من عمولة السوق',
                    `حصلت على ${referralRewardAmount.toFixed(2)} ${log.commissionCurrency} مخصومة من عمولة النظام عبر ${buyerInfo.rows[0]?.full_name || 'مستخدم محال'}`,
                    'success',
                    false
                  ]);
                }

                console.log(`✅ تم توزيع مكافأة الإحالة بعد خصمها من النظام: ${referralRewardAmount.toFixed(6)} ${log.commissionCurrency} للمُحيل ${referrerId}`);
              } catch (error) {
                console.error('خطأ في توزيع مكافأة الإحالة:', error);
              }
            }
          } else {
            console.log(`⚠️ لم يتم العثور على سجل عمولة معلقة للعرض ${offerId}`);
          }
        } catch (error) {
          console.error("خطأ في تحويل العمولة المعلقة للنظام:", error);
        }

        // تأكيد المعاملة
        await pool.query('COMMIT');

        console.log(`✅ تمت الصفقة رقم ${marketTransactionId} بنجاح`);
        
        res.json({
          success: true,
          message: "تمت الصفقة بنجاح",
          transactionId: marketTransactionId,
          referenceNumber: `MKT-${marketTransactionId}`,
          details: {
            amount: tradeAmount,
            price: offer.price,
            totalCost: totalCost.toFixed(2),
            currency,
            buyerCurrency,
            sellerName: offer.userFullName,
            sellerAccount: offer.userAccountNumber
          }
        });

      } catch (innerError) {
        await pool.query('ROLLBACK');
        throw innerError;
      }

    } catch (error) {
      console.error("❌ خطأ في تنفيذ الصفقة:", error);
      res.status(500).json({ 
        success: false,
        message: "حدث خطأ أثناء تنفيذ الصفقة" 
      });
    }
  });

  // ===== واجهات برمجة التطبيق لطلبات التحويل الخارجي =====
  
  // إنشاء طلب تفعيل التحويل الخارجي
  app.post("/api/upgrade/external-transfer/request", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { countryId, cityId, cityNameManual, requestedLimits, message, documents } = req.body;
      
      // التحقق من توثيق الحساب قبل السماح بطلب ترقية التحويلات الخارجية
      const user = await storage.getUser(req.user.id);
      if (!user?.verified) {
        return res.status(400).json({
          ok: false,
          code: "ACCOUNT_NOT_VERIFIED",
          message: "يجب توثيق الحساب أولاً قبل طلب تفعيل التحويلات الخارجية. يرجى إرسال المستندات المطلوبة للتوثيق."
        });
      }
      
      // التحقق من عدم وجود طلب pending بالفعل
      const existingRequests = await storage.getExternalTransferRequestsByUser(req.user.id);
      const pendingRequest = existingRequests.find(r => r.status === 'pending');
      
      if (pendingRequest) {
        return res.status(400).json({
          ok: false,
          code: "PENDING_REQUEST_EXISTS",
          message: "لديك طلب قيد المراجعة بالفعل"
        });
      }
      
      // Get country and city names
      let countryName = "";
      let cityName = "";
      
      if (countryId) {
        const country = await storage.getCountryById(countryId);
        countryName = country?.name || "";
      }
      
      if (cityId) {
        const city = await storage.getCityById(cityId);
        cityName = city?.nameAr || "";
      } else if (cityNameManual) {
        cityName = cityNameManual;
      }
      
      const request = await storage.createExternalTransferRequest({
        userId: req.user.id,
        fullName: user.fullName, // إضافة الاسم الكامل المطلوب
        phone: user.phone || user.email || "",
        city: `${countryName} - ${cityName}`,
        requestType: "external_transfer", // إضافة نوع الطلب
        requestedLimits,
        message,
        documents
      });
      
      res.status(201).json({
        ok: true,
        status: 'pending',
        requestId: request.id,
        message: "تم إرسال طلب تفعيل التحويل الخارجي بنجاح"
      });
      
    } catch (error) {
      console.error("خطأ في إنشاء طلب التحويل الخارجي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إرسال الطلب" });
    }
  });
  
  // جلب طلبات المستخدم للتحويل الخارجي
  app.get("/api/upgrade/external-transfer/my-requests", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const requests = await storage.getExternalTransferRequestsByUser(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("خطأ في جلب طلبات التحويل الخارجي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الطلبات" });
    }
  });
  
  // جلب جميع طلبات التحويل الخارجي (للأدمن)
  app.get("/api/admin/upgrade/external-transfer/requests", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول" });
      }
      
      const requests = await storage.getExternalTransferRequests();
      
      // إضافة بيانات المستخدم لكل طلب
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const user = await storage.getUser(request.userId);
          return {
            ...request,
            userFullName: user?.fullName,
            userEmail: user?.email,
            userType: user?.type
          };
        })
      );
      
      res.json(requestsWithUsers);
    } catch (error) {
      console.error("خطأ في جلب طلبات التحويل الخارجي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الطلبات" });
    }
  });
  
  // موافقة على طلب التحويل الخارجي
  app.post("/api/admin/upgrade/external-transfer/requests/:id/approve", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول" });
      }
      
      const requestId = parseInt(req.params.id);
      const { daily, monthly, currencies, countries } = req.body;
      
      console.log('بيانات الموافقة المستلمة:', { requestId, daily, monthly, currencies, countries });
      
      // التحقق من صحة البيانات
      if (!requestId || isNaN(requestId)) {
        return res.status(400).json({ message: "رقم الطلب غير صحيح" });
      }
      
      // تحديث طلب الترقية
      await storage.updateExternalTransferRequest(requestId, {
        status: 'approved',
        decidedBy: req.user.id,
        reviewNotes: "تمت الموافقة على الطلب"
      });
      
      // الحصول على بيانات الطلب
      const allRequests = await storage.getExternalTransferRequests();
      const request = allRequests.find(r => r.id === requestId);
      
      if (!request) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }
      
      // جلب جميع البلدان المتاحة من قاعدة البيانات لدعم التحويل لجميع البلدان
      const allCountries = await db.select({ code: countriesTable.code }).from(countriesTable).where(eq(countriesTable.isActive, true));
      const allCountryCodes = allCountries.map(c => c.code);
      
      // تحديث إعدادات المستخدم مع التحقق من البيانات - الوكيل الدولي يمكنه التحويل لجميع البلدان
      const settings = {
        extTransferEnabled: true,
        extDailyLimit: daily ? daily.toString() : "50000",
        extMonthlyLimit: monthly ? monthly.toString() : "200000",
        extAllowedCurrencies: Array.isArray(currencies) && currencies.length > 0 ? currencies : ["USD", "EUR", "LYD", "TRY", "AED"],
        extAllowedCountries: allCountryCodes // جميع البلدان المتاحة
      };
      
      console.log('إعدادات المستخدم المحدثة:', settings);
      
      await storage.updateUserExternalTransferSettings(request.userId, settings);
      
      // تحديث نوع المستخدم إلى وكيل
      await storage.updateUser(request.userId, { type: 'agent' });
      
      // إنشاء مكتب تلقائياً في ليبيا (الدولة الأساسية)
      const defaultCountry = 'LY';
      
      // الحصول على بيانات المستخدم أولاً
      const user = await storage.getUser(request.userId);
      
      // جلب بيانات الدولة الافتراضية من قاعدة البيانات
      const [countryInfo] = await db.select({ name: countriesTable.name }).from(countriesTable).where(eq(countriesTable.code, defaultCountry));
      
      const countryName = user?.countryName || countryInfo?.name || 'غير محدد';
      const defaultCity = user?.cityName || user?.city || 'غير محدد';
      const userAccountNumber = user?.accountNumber || `33003${request.userId.toString().padStart(3, '0')}`;
      
      // إنشاء كود مكتب فريد
      const officeCode = `${defaultCountry}${userAccountNumber.slice(-3)}`;
      
      try {
        // إنشاء المكتب
        await db.insert(agentOffices).values({
          agentId: request.userId,
          countryCode: defaultCountry,
          city: defaultCity,
          officeCode: officeCode,
          officeName: `مكتب ${user?.fullName || 'الوكيل'} - ${countryName}`,
          contactInfo: user?.phone || '+1234567890',
          address: `العنوان الرئيسي، ${defaultCity}، ${user?.countryName || countryName}`,
          isActive: true,
          createdAt: new Date()
        });
        
        console.log(`تم إنشاء مكتب تلقائي برقم ${officeCode} للمستخدم ${request.userId}`);
      } catch (officeError) {
        console.error("خطأ في إنشاء المكتب التلقائي:", officeError);
      }
      
      // إضافة إعدادات عمولة افتراضية
      try {
        const defaultCurrency = settings.extAllowedCurrencies[0];
        await storage.createOrUpdateAgentCommission({
          agentId: request.userId,
          currencyCode: defaultCurrency,
          type: 'fixed',
          value: '7.5'
        });
        
        console.log(`تم إضافة إعدادات عمولة افتراضية ${defaultCurrency} للمستخدم ${request.userId}`);
      } catch (commissionError) {
        console.error("خطأ في إضافة إعدادات العمولة:", commissionError);
      }
      
      // إنشاء إشعار للمستخدم
      await storage.createUserNotification({
        userId: request.userId,
        title: "تمت الموافقة على طلب التحويل الخارجي",
        body: "تم تفعيل صلاحية التحويل الخارجي وإنشاء مكتبك التلقائي",
        type: "success",
        isRead: false
      });
      
      res.json({
        ok: true,
        message: "تم قبول الطلب وتفعيل صلاحية التحويل الخارجي"
      });
      
    } catch (error) {
      console.error("خطأ في موافقة طلب التحويل الخارجي:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء موافقة الطلب", 
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      });
    }
  });
  
  // رفض طلب التحويل الخارجي
  app.post("/api/admin/upgrade/external-transfer/requests/:id/reject", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.type !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول" });
      }
      
      const requestId = parseInt(req.params.id);
      const { reason } = req.body;
      
      // تحديث طلب الترقية
      await storage.updateExternalTransferRequest(requestId, {
        status: 'rejected',
        decidedBy: req.user.id,
        reviewNotes: reason || "تم رفض الطلب"
      });
      
      // الحصول على بيانات الطلب
      const allRequests = await storage.getExternalTransferRequests();
      const request = allRequests.find(r => r.id === requestId);
      
      if (request) {
        // إنشاء إشعار للمستخدم
        await storage.createUserNotification({
          userId: request.userId,
          title: "تم رفض طلب التحويل الخارجي",
          body: `تم رفض طلبك: ${reason || "لم يتم تحديد السبب"}`,
          type: "error",
          isRead: false
        });
      }
      
      res.json({
        ok: true,
        message: "تم رفض الطلب"
      });
      
    } catch (error) {
      console.error("خطأ في رفض طلب التحويل الخارجي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء رفض الطلب" });
    }
  });
  
  // جلب حدود التحويل الخارجي للمستخدم
  app.get("/api/external-transfer/limits", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const limits = await storage.getUserExternalTransferLimits(req.user.id);
      
      if (!limits || !limits.extTransferEnabled) {
        return res.json({
          enabled: false,
          message: "التحويل الخارجي غير مفعل. يرجى تقديم طلب ترقية."
        });
      }
      
      res.json({
        enabled: true,
        dailyLimit: limits.extDailyLimit,
        monthlyLimit: limits.extMonthlyLimit,
        allowedCurrencies: limits.extAllowedCurrencies,
        allowedCountries: limits.extAllowedCountries
      });
      
    } catch (error) {
      console.error("خطأ في جلب حدود التحويل الخارجي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الحدود" });
    }
  });

  // Geo API Endpoints - واجهات API للمواقع الجغرافية
  app.get("/api/geo/countries", async (req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ error: "فشل في جلب قائمة الدول" });
    }
  });

  app.get("/api/geo/cities", async (req, res) => {
    try {
      const { country_id, search } = req.query;
      const countryId = country_id ? parseInt(country_id as string) : undefined;
      const cities = await storage.getCities(countryId, search as string);
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ error: "فشل في جلب قائمة المدن" });
    }
  });

  // External Transfer Upgrade Request - طلب ترقية التحويل الخارجي
  app.post("/api/upgrade/external-transfer/request", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const validatedData = externalTransferRequestSchema.parse({
        ...req.body,
        userId,
        requestType: "external_transfer"
      });

      // التحقق من صحة الدولة
      const country = await storage.getCountryById(validatedData.countryId);
      if (!country) {
        return res.status(400).json({ error: "الدولة المحددة غير صحيحة" });
      }

      // التحقق من صحة المدينة إذا تم تحديدها
      if (validatedData.cityId) {
        const city = await storage.getCityById(validatedData.cityId);
        if (!city || city.countryId !== validatedData.countryId) {
          return res.status(400).json({ error: "المدينة المحددة غير صحيحة أو غير متطابقة مع الدولة" });
        }
      }

      const upgradeRequest = await storage.createExternalTransferRequest(validatedData);
      res.status(201).json(upgradeRequest);
    } catch (error) {
      console.error("Error creating external transfer request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "بيانات غير صحيحة", 
          details: error.errors 
        });
      }
      if (error instanceof Error && error.message.includes("معلق")) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: "فشل في إنشاء طلب الترقية" });
    }
  });

  // Admin upgrade requests with details - طلبات الترقية مع التفاصيل للإدارة
  app.get("/api/admin/upgrade-requests/detailed", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.type !== 'admin') {
        return res.status(403).json({ error: "ليس لديك صلاحية للوصول إلى هذا المورد" });
      }

      const { type, status } = req.query;
      const requestType = type as "agent_upgrade" | "external_transfer" | undefined;
      const requestStatus = status as "pending" | "approved" | "rejected" | undefined;
      
      const requests = await storage.getUpgradeRequestsWithDetails(requestType, requestStatus);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching detailed upgrade requests:", error);
      res.status(500).json({ error: "فشل في جلب طلبات الترقية" });
    }
  });

  // دالة إنشاء إيصال HTML قابل للطباعة
  async function generatePrintableReceipt(receipt: any, transfer: any): Promise<string> {
    const moment = await import('moment-timezone');
    const libyaTime = moment.default(transfer.createdAt).tz('Africa/Tripoli');
    
    // معلومات الدولة
    const countries: { [key: string]: string } = {
      'AU': 'أستراليا', 'AE': 'الإمارات العربية المتحدة', 'EG': 'مصر',
      'SA': 'السعودية', 'TN': 'تونس', 'MA': 'المغرب', 'JO': 'الأردن',
      'LB': 'لبنان', 'SY': 'سوريا', 'IQ': 'العراق', 'YE': 'اليمن',
      'OM': 'عُمان', 'QA': 'قطر', 'BH': 'البحرين', 'KW': 'الكويت'
    };
    
    const countryName = countries[transfer.country] || transfer.country;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إيصال تحويل دولي - ${transfer.receiverCode}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              background: white;
            }
            .receipt-container {
              transform: none;
              box-shadow: none;
              border: none;
            }
            .no-print { display: none !important; }
            @page { 
              size: 80mm auto; 
              margin: 2mm; 
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            background: #f0f0f0;
            color: #000;
            line-height: 1.4;
            padding: 10px;
            margin: 0;
            display: flex;
            justify-content: center;
          }
          
          .receipt-container {
            width: 80mm;
            max-width: 80mm;
            background: white;
            font-size: 10px;
            border: 1px solid #ccc;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            transform: scale(1.0);
            transform-origin: top center;
            padding: 3mm;
          }
          
          .header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
            margin-bottom: 5px;
          }
          
          .company-name {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 1px;
          }
          
          .company-info {
            font-size: 7px;
            margin-bottom: 0px;
          }
          
          .receipt-title {
            font-size: 10px;
            font-weight: bold;
            text-align: center;
            border: 1px solid #000;
            padding: 2px;
            margin: 3px 0;
          }
          
          .separator {
            text-align: center;
            margin: 3px 0;
            font-size: 8px;
          }
          
          .receiver-code-section {
            text-align: center;
            margin: 5px 0;
            border: 1px solid #000;
            padding: 5px;
          }
          
          .receiver-code-label {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .receiver-code {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 1px;
            font-family: 'Courier New', monospace;
          }
          
          .details-section {
            margin: 3px 0;
          }
          
          .section-title {
            font-size: 9px;
            font-weight: bold;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 1px;
            margin-bottom: 2px;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 1px 0;
            border-bottom: 1px dotted #ccc;
            font-size: 8px;
          }
          
          .detail-label {
            font-weight: bold;
            flex: 1;
          }
          
          .detail-value {
            flex: 1;
            text-align: left;
          }
          
          .amount-section {
            text-align: center;
            border: 1px solid #000;
            padding: 4px;
            margin: 5px 0;
            font-weight: bold;
          }
          
          .amount-label {
            font-size: 9px;
            margin-bottom: 2px;
          }
          
          .amount-value {
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          
          .commission-info {
            font-size: 7px;
            margin-top: 1px;
          }
          
          .footer {
            margin-top: 8px;
            padding-top: 3px;
            border-top: 1px solid #000;
            text-align: center;
            font-size: 6px;
          }
          
          .print-button {
            background: #000;
            color: white;
            border: none;
            padding: 6px 12px;
            font-size: 10px;
            cursor: pointer;
            margin: 5px 0;
            width: 100%;
          }
          
          .status {
            text-align: center;
            font-weight: bold;
            padding: 2px;
            margin: 3px 0;
            border: 1px solid #000;
            font-size: 8px;
          }
          
          .dashed-line {
            border-top: 1px dashed #000;
            margin: 2px 0;
          }
          
          .center-text {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- رأس الإيصال -->
          <div class="header">
            <div class="company-name">منصة الصرافة الليبية</div>
            <div class="company-info">Libya Exchange Platform</div>
            <div class="company-info">طرابلس - ليبيا</div>
            <div class="company-info">Tel: +218-XXX-XXXXXX</div>
          </div>

          <div class="receipt-title">إيصال تحويل دولي</div>
          
          <div class="separator">================================</div>

          <!-- كود الاستلام -->
          <div class="receiver-code-section">
            <div class="receiver-code-label">كود الاستلام</div>
            <div class="receiver-code">${transfer.receiverCode}</div>
          </div>

          <div class="dashed-line"></div>

          <!-- معلومات التحويل -->
          <div class="details-section">
            <div class="section-title">تفاصيل التحويل</div>
            <div class="detail-row">
              <span class="detail-label">رقم الإيصال:</span>
              <span class="detail-value">${receipt.id.substring(0, 8)}...</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">رقم التحويل:</span>
              <span class="detail-value">${transfer.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">التاريخ:</span>
              <span class="detail-value">${libyaTime.format('YYYY-MM-DD')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">الوقت:</span>
              <span class="detail-value">${libyaTime.format('HH:mm')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">الدولة المقصد:</span>
              <span class="detail-value">${countryName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">نوع التحويل:</span>
              <span class="detail-value">تحويل دولي</span>
            </div>
          </div>

          <div class="dashed-line"></div>

          <!-- معلومات المُرسل -->
          <div class="details-section">
            <div class="section-title">بيانات المُرسل</div>
            <div class="detail-row">
              <span class="detail-label">رقم المُرسل:</span>
              <span class="detail-value">${transfer.senderId || 'غير محدد'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">مكتب الإرسال:</span>
              <span class="detail-value">منصة الصرافة الليبية</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">رمز التحويل:</span>
              <span class="detail-value">${transfer.transferCode}</span>
            </div>
          </div>

          <div class="dashed-line"></div>

          <!-- معلومات المستفيد -->
          <div class="details-section">
            <div class="section-title">بيانات المستفيد</div>
            <div class="detail-row">
              <span class="detail-label">الاسم:</span>
              <span class="detail-value">${transfer.recipientName}</span>
            </div>
            ${transfer.recipientPhone ? `
            <div class="detail-row">
              <span class="detail-label">الهاتف:</span>
              <span class="detail-value">${transfer.recipientPhone}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">كود الاستلام:</span>
              <span class="detail-value">${transfer.receiverCode}</span>
            </div>
          </div>

          <div class="separator">================================</div>

          <!-- المبلغ -->
          <div class="amount-section">
            <div class="amount-label">المبلغ للاستلام</div>
            <div class="amount-value">${parseFloat(transfer.amount).toLocaleString()} ${transfer.currency}</div>
          </div>

          <!-- الحالة -->
          <div class="status">
            الحالة: ${transfer.status === 'completed' ? 'مكتمل ✓' : 'معلق ⏳'}
          </div>

          ${transfer.note ? `
            <div class="dashed-line"></div>
            <div class="details-section">
              <div class="section-title">ملاحظات</div>
              <div class="center-text" style="padding: 5px 0; font-size: 9px;">${transfer.note}</div>
            </div>
          ` : ''}

          <!-- زر الطباعة -->
          <div class="no-print">
            <button class="print-button" onclick="window.print()">طباعة الإيصال</button>
          </div>

          <!-- معلومات مختصرة -->
          <div class="dashed-line"></div>
          <div class="center-text" style="font-size: 7px; margin: 2px 0;">
            التاريخ: ${transfer.completedAt ? new Date(transfer.completedAt).toLocaleDateString('ar-LY', {timeZone: 'Africa/Tripoli'}) : libyaTime.format('YYYY-MM-DD')} | 
            الوكيل: ${transfer.agentId || 'N/A'} → ${transfer.destinationAgentId || 'N/A'}
          </div>

          <!-- تذييل الإيصال -->
          <div class="footer">
            <div>منصة الصرافة الليبية</div>
            <div>إيصال مختوم رقمياً</div>
            <div>${new Date().toLocaleDateString('ar-LY', {timeZone: 'Africa/Tripoli'})}</div>
            <div>هاتف: +218-XXX-XXXXXX</div>
            <div>للاستفسار: خدمة العملاء</div>
          </div>
          
          <div class="separator" style="margin-top: 10px;">================================</div>
          <div class="center-text" style="font-size: 8px; margin-top: 5px;">
            احتفظ بهذا الإيصال
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // =================== API ROUTES للإشعارات المحمولة ===================
  
  // اشتراك في إشعارات push
  app.post('/api/notifications/subscribe', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const subscription = req.body;
      
      await pushNotifications.savePushSubscription(userId, subscription);
      
      res.json({ 
        success: true, 
        message: 'تم تفعيل الإشعارات بنجاح' 
      });
    } catch (error: any) {
      console.error('خطأ في اشتراك الإشعارات:', error);
      res.status(500).json({ 
        success: false, 
        message: 'فشل في تفعيل الإشعارات', 
        error: error.message 
      });
    }
  });

  // إلغاء اشتراك إشعارات push
  app.post('/api/notifications/unsubscribe', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const { endpoint } = req.body;
      
      await pushNotifications.removePushSubscription(userId, endpoint);
      
      res.json({ 
        success: true, 
        message: 'تم إلغاء الإشعارات بنجاح' 
      });
    } catch (error: any) {
      console.error('خطأ في إلغاء اشتراك الإشعارات:', error);
      res.status(500).json({ 
        success: false, 
        message: 'فشل في إلغاء الإشعارات', 
        error: error.message 
      });
    }
  });

  // اختبار إرسال إشعار
  app.post('/api/notifications/test', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      
      await pushNotifications.sendPushNotificationToUser(userId, {
        title: 'إشعار تجريبي',
        body: 'هذا إشعار تجريبي للتأكد من عمل النظام',
        data: { type: 'test' },
        url: '/',
        tag: 'test'
      });
      
      res.json({ 
        success: true, 
        message: 'تم إرسال الإشعار التجريبي' 
      });
    } catch (error: any) {
      console.error('خطأ في إرسال الإشعار التجريبي:', error);
      res.status(500).json({ 
        success: false, 
        message: 'فشل في إرسال الإشعار التجريبي', 
        error: error.message 
      });
    }
  });

  // =================== تعديل إنشاء الإشعارات الحالية ===================
  
  // تعديل endpoint إنشاء الإشعار ليدعم push notifications
  const originalNotificationPost = app._router.stack.find(layer => 
    layer.route && layer.route.path === '/api/notifications' && layer.route.methods.post
  );
  
  if (originalNotificationPost) {
    // إضافة middleware لإرسال push notification عند إنشاء إشعار جديد
    app.use('/api/notifications', authMiddleware, async (req, res, next) => {
      if (req.method === 'POST' && !req.url.includes('subscribe') && !req.url.includes('unsubscribe') && !req.url.includes('test')) {
        // حفظ الاستجابة الأصلية
        const originalSend = res.send;
        const originalJson = res.json;
        
        res.json = function(body: any) {
          // إذا تم إنشاء الإشعار بنجاح
          if (res.statusCode === 200 || res.statusCode === 201) {
            // إرسال push notification
            if (req.body.userId && req.body.title) {
              pushNotifications.sendPushNotificationToUser(req.body.userId, {
                title: req.body.title,
                body: req.body.message || 'لديك إشعار جديد',
                data: { type: 'notification', id: body.id },
                url: '/',
                tag: 'notification'
              }).catch(error => {
                console.error('خطأ في إرسال push notification:', error);
              });
            }
          }
          return originalJson.call(this, body);
        };
      }
      next();
    });
  }

  // =================== نظام المكافآت والشارات ===================

  // الحصول على تقدم المستخدم (النقاط والشارات)
  app.get('/api/rewards/progress', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const progress = await rewardsService.getUserProgress(userId);
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      console.error('خطأ في جلب تقدم المستخدم:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب بيانات التقدم',
        error: error.message
      });
    }
  });

  // الحصول على جميع الشارات المتاحة
  app.get('/api/rewards/badges', authMiddleware, async (req, res) => {
    try {
      const badges = await db.select().from(badgeTypes).where(eq(badgeTypes.active, true));
      
      res.json({
        success: true,
        data: badges
      });
    } catch (error: any) {
      console.error('خطأ في جلب الشارات:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب الشارات',
        error: error.message
      });
    }
  });

  // الحصول على جميع المكافآت المتاحة
  app.get('/api/rewards/available', authMiddleware, async (req, res) => {
    try {
      const rewardsList = await db.select().from(rewards).where(eq(rewards.active, true));
      
      res.json({
        success: true,
        data: rewardsList
      });
    } catch (error: any) {
      console.error('خطأ في جلب المكافآت:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب المكافآت',
        error: error.message
      });
    }
  });

  // استبدال مكافأة
  app.post('/api/rewards/redeem', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const { rewardId } = req.body;

      if (!rewardId) {
        return res.status(400).json({
          success: false,
          message: 'معرف المكافأة مطلوب'
        });
      }

      const result = await rewardsService.redeemReward(userId, parseInt(rewardId));
      
      res.json({
        success: true,
        message: 'تم استبدال المكافأة بنجاح',
        data: result
      });
    } catch (error: any) {
      console.error('خطأ في استبدال المكافأة:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'فشل في استبدال المكافأة'
      });
    }
  });

  // الحصول على سجل استبدال المكافآت للمستخدم
  app.get('/api/rewards/my-redemptions', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      
      const redemptions = await db.select({
        id: userRewards.id,
        reward: rewards,
        pointsSpent: userRewards.pointsSpent,
        status: userRewards.status,
        redemptionCode: userRewards.redemptionCode,
        usedAt: userRewards.usedAt,
        expiresAt: userRewards.expiresAt,
        redeemedAt: userRewards.redeemedAt,
      })
      .from(userRewards)
      .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
      .where(eq(userRewards.userId, userId))
      .orderBy(desc(userRewards.redeemedAt));
      
      res.json({
        success: true,
        data: redemptions
      });
    } catch (error: any) {
      console.error('خطأ في جلب سجل الاستبدال:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب سجل الاستبدال',
        error: error.message
      });
    }
  });

  // تحديث سلسلة الأيام المتتالية (يتم استدعاؤها عند تسجيل الدخول)
  app.post('/api/rewards/daily-login', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const userIP = getClientPublicIP(req);
      
      // فحص أمني: التحقق من عدد الطلبات لهذا المستخدم في الساعة الأخيرة
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      const recentAttempts = await db.select()
        .from(pointsHistory)
        .where(and(
          eq(pointsHistory.userId, userId),
          eq(pointsHistory.action, 'daily_login'),
          gte(pointsHistory.createdAt, lastHour)
        ));

      if (recentAttempts.length > 1) {
        console.warn(`🚨 محاولة مشبوهة للحصول على مكافآت يومية متعددة - المستخدم: ${userId}, IP: ${userIP}`);
        return res.status(429).json({
          success: false,
          message: 'تم اكتشاف محاولة مشبوهة. يمكنك الحصول على المكافأة اليومية مرة واحدة فقط.'
        });
      }

      // استخدام دالة آمنة لمنح النقاط اليومية مع فحص التكرار
      const result = await rewardsService.awardDailyLoginPointsSafe(userId, userIP);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || 'تم الحصول على المكافأة اليومية بالفعل'
        });
      }
      
      res.json({
        success: true,
        message: result.message || 'تم تسجيل النشاط اليومي',
        data: result.data
      });
    } catch (error: any) {
      console.error('خطأ في تسجيل النشاط اليومي:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في تسجيل النشاط اليومي',
        error: error.message
      });
    }
  });

  // API لإدارة شرائح عمولة الحوالات المدنية
  
  // جلب شرائح العمولة للوكيل
  app.get('/api/city-commission-tiers', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // جلب شرائح العمولة للوكيل الحالي
      const tiers = await db.select()
        .from(cityTransferCommissions)
        .where(eq(cityTransferCommissions.agentId, userId))
        .orderBy(cityTransferCommissions.createdAt);
      
      res.json(tiers);
    } catch (error: any) {
      console.error('خطأ في جلب شرائح العمولة:', error);
      res.status(500).json({
        message: 'فشل في جلب شرائح العمولة',
        error: error.message
      });
    }
  });

  // إضافة شريحة عمولة جديدة
  app.post('/api/city-commission-tiers', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const { originCity, destinationCity, minAmount, maxAmount, commission, perMilleRate, currencyCode } = req.body;

      // التحقق من البيانات المطلوبة
      if (!minAmount || (!commission && !perMilleRate)) {
        return res.status(400).json({
          message: 'يرجى إدخال المبلغ الأدنى والعمولة أو النسبة في الألف'
        });
      }

      // التحقق من القيم الرقمية
      const numMinAmount = typeof minAmount === 'number' ? minAmount : parseFloat(minAmount);
      const numMaxAmount = maxAmount ? (typeof maxAmount === 'number' ? maxAmount : parseFloat(maxAmount)) : null;
      const numCommission = commission ? (typeof commission === 'number' ? commission : parseFloat(commission)) : null;
      const numPerMilleRate = perMilleRate ? (typeof perMilleRate === 'number' ? perMilleRate : parseFloat(perMilleRate)) : null;

      // إنشاء الشريحة الجديدة
      const newTier = await db.insert(cityTransferCommissions).values({
        agentId: userId,
        originCity: originCity || null,
        destinationCity: destinationCity || null,
        minAmount: numMinAmount.toString(),
        maxAmount: numMaxAmount ? numMaxAmount.toString() : null,
        commission: numPerMilleRate ? null : (numCommission ? numCommission.toString() : null),
        perMilleRate: numPerMilleRate ? numPerMilleRate.toString() : null,
        currencyCode: currencyCode || 'LYD'
      }).returning();

      res.json({
        message: 'تم إضافة شريحة العمولة بنجاح',
        tier: newTier[0]
      });
    } catch (error: any) {
      console.error('خطأ في إضافة شريحة العمولة:', error);
      res.status(500).json({
        message: 'فشل في إضافة شريحة العمولة',
        error: error.message
      });
    }
  });

  // تحديث شريحة عمولة
  app.put('/api/city-commission-tiers/:id', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const tierId = parseInt(req.params.id);
      const { originCity, destinationCity, minAmount, maxAmount, commission, perMilleRate, currencyCode } = req.body;

      // التحقق من ملكية الشريحة
      const existingTier = await db.select()
        .from(cityTransferCommissions)
        .where(and(
          eq(cityTransferCommissions.id, tierId),
          eq(cityTransferCommissions.agentId, userId)
        ))
        .limit(1);

      if (existingTier.length === 0) {
        return res.status(404).json({
          message: 'الشريحة غير موجودة أو ليس لديك صلاحية لتعديلها'
        });
      }

      // التحقق من القيم الرقمية للتحديث
      const numMinAmount = typeof minAmount === 'number' ? minAmount : parseFloat(minAmount);
      const numMaxAmount = maxAmount ? (typeof maxAmount === 'number' ? maxAmount : parseFloat(maxAmount)) : null;
      const numCommission = commission ? (typeof commission === 'number' ? commission : parseFloat(commission)) : null;
      const numPerMilleRate = perMilleRate ? (typeof perMilleRate === 'number' ? perMilleRate : parseFloat(perMilleRate)) : null;

      // تحديث الشريحة
      const updatedTier = await db.update(cityTransferCommissions)
        .set({
          originCity: originCity || null,
          destinationCity: destinationCity || null,
          minAmount: numMinAmount.toString(),
          maxAmount: numMaxAmount ? numMaxAmount.toString() : null,
          commission: numPerMilleRate ? null : (numCommission ? numCommission.toString() : null),
          perMilleRate: numPerMilleRate ? numPerMilleRate.toString() : null,
          currencyCode: currencyCode || 'LYD',
          updatedAt: new Date()
        })
        .where(eq(cityTransferCommissions.id, tierId))
        .returning();

      res.json({
        message: 'تم تحديث شريحة العمولة بنجاح',
        tier: updatedTier[0]
      });
    } catch (error: any) {
      console.error('خطأ في تحديث شريحة العمولة:', error);
      res.status(500).json({
        message: 'فشل في تحديث شريحة العمولة',
        error: error.message
      });
    }
  });

  // حذف شريحة عمولة
  app.delete('/api/city-commission-tiers/:id', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const tierId = parseInt(req.params.id);

      // التحقق من ملكية الشريحة
      const existingTier = await db.select()
        .from(cityTransferCommissions)
        .where(and(
          eq(cityTransferCommissions.id, tierId),
          eq(cityTransferCommissions.agentId, userId)
        ))
        .limit(1);

      if (existingTier.length === 0) {
        return res.status(404).json({
          message: 'الشريحة غير موجودة أو ليس لديك صلاحية لحذفها'
        });
      }

      // حذف الشريحة
      await db.delete(cityTransferCommissions)
        .where(eq(cityTransferCommissions.id, tierId));

      res.json({
        message: 'تم حذف شريحة العمولة بنجاح'
      });
    } catch (error: any) {
      console.error('خطأ في حذف شريحة العمولة:', error);
      res.status(500).json({
        message: 'فشل في حذف شريحة العمولة',
        error: error.message
      });
    }
  });

  // تحديث بيانات المستخدم (للمدراء فقط)
  app.put('/api/admin/users/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user;
      const userId = parseInt(req.params.userId);
      const { fullName, email, phone, type, adminLevel } = req.body;

      // التحقق من أن المستخدم الحالي مدير
      if (currentUser.type !== 'admin') {
        return res.status(403).json({ message: "ليس لديك صلاحية لتحديث بيانات المستخدمين" });
      }

      // التحقق من أن المستخدم المراد تحديثه موجود
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // التحقق من الصلاحيات: فقط المدير العام يمكنه تعديل مدراء آخرين
      const currentUserData = await storage.getUser(currentUser.id);
      if (targetUser.type === 'admin' && (!currentUserData || currentUserData.adminLevel !== 2)) {
        return res.status(403).json({ message: "فقط المدير العام يمكنه تعديل بيانات المدراء الآخرين" });
      }

      // بناء بيانات التحديث
      const updateData: Partial<User> = {
        fullName,
        email,
        phone,
        type
      };

      // إضافة adminLevel فقط إذا كان النوع admin وكان المستخدم الحالي مدير عام
      if (type === 'admin' && currentUserData?.adminLevel === 2) {
        updateData.adminLevel = adminLevel || 1; // المستوى الافتراضي للمدير المحدود
      }

      // تحديث بيانات المستخدم
      const updatedUser = await storage.updateUser(userId, updateData);

      res.json({
        message: "تم تحديث بيانات المستخدم بنجاح",
        user: {
          id: updatedUser.id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          type: updatedUser.type,
          adminLevel: updatedUser.adminLevel
        }
      });
    } catch (error: any) {
      console.error("خطأ في تحديث بيانات المستخدم:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء تحديث بيانات المستخدم",
        error: error.message 
      });
    }
  });

  // =====================================================================
  // API نظام الإحالة (Referral System)
  // =====================================================================

  // جلب إعدادات نظام الإحالة (للمدير فقط)
  app.get("/api/admin/referral/settings", authMiddleware, requirePermission('canManageSettings'), async (req: AuthRequest, res: Response) => {
    try {
      const isEnabled = await referralSystem.getSetting('referral.enabled', { enabled: false });
      const rewardRate = await referralSystem.getSetting('referral.reward_rate', { rate: 0.20 });

      res.json({
        enabled: isEnabled.enabled,
        rewardRate: rewardRate.rate
      });
    } catch (error) {
      console.error("خطأ في جلب إعدادات الإحالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الإعدادات" });
    }
  });

  // تحديث إعدادات نظام الإحالة (للمدير فقط)
  app.put("/api/admin/referral/settings", authMiddleware, requirePermission('canManageSettings'), async (req: AuthRequest, res: Response) => {
    try {
      const { enabled, rewardRate } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ message: "قيمة التفعيل يجب أن تكون true أو false" });
      }

      if (typeof rewardRate !== 'number' || rewardRate < 0 || rewardRate > 1) {
        return res.status(400).json({ message: "نسبة المكافأة يجب أن تكون رقماً بين 0 و 1" });
      }

      await referralSystem.setSetting('referral.enabled', { enabled });
      await referralSystem.setSetting('referral.reward_rate', { rate: rewardRate });

      res.json({ message: "تم تحديث إعدادات نظام الإحالة بنجاح" });
    } catch (error) {
      console.error("خطأ في تحديث إعدادات الإحالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث الإعدادات" });
    }
  });

  // جلب رمز الإحالة للمستخدم الحالي
  app.get("/api/referral/my-code", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || !user.referralCode) {
        return res.status(404).json({ message: "رمز الإحالة غير موجود" });
      }

      res.json({ 
        referralCode: user.referralCode,
        shareUrl: `${req.protocol}://${req.get('host')}/register?ref=${user.referralCode}`
      });
    } catch (error) {
      console.error("خطأ في جلب رمز الإحالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب رمز الإحالة" });
    }
  });

  // جلب إحصائيات الإحالة للمستخدم
  // إزالة هذا المسار المكرر - سيتم استخدام المسار الأحدث أدناه

  // جلب سجل مكافآت الإحالة للمستخدم
  app.get("/api/referral/history", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      
      const history = await referralSystem.getReferralHistory(userId, limit);

      res.json(history);
    } catch (error) {
      console.error("خطأ في جلب سجل الإحالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب السجل" });
    }
  });

  // جلب أرصدة مكافآت الإحالة للمستخدم
  app.get("/api/referral/balances", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const balances = await referralSystem.getReferralBalances(userId);

      res.json(balances);
    } catch (error) {
      console.error("خطأ في جلب أرصدة الإحالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الأرصدة" });
    }
  });

  // تحويل رصيد مكافآت الإحالة إلى الرصيد الأساسي
  app.post("/api/referral/transfer-balance", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { currency, amount } = req.body;

      if (!currency || !amount) {
        return res.status(400).json({ message: "العملة والمبلغ مطلوبان" });
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "المبلغ يجب أن يكون رقماً موجباً" });
      }

      const success = await referralSystem.transferReferralBalance(userId, currency, amount);

      if (!success) {
        return res.status(400).json({ message: "فشل في تحويل الرصيد - تحقق من الرصيد المتاح" });
      }

      res.json({ message: "تم تحويل الرصيد بنجاح" });
    } catch (error) {
      console.error("خطأ في تحويل رصيد الإحالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحويل الرصيد" });
    }
  });

  // التحقق من صحة رمز الإحالة (عام)
  app.get("/api/referral/validate/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const validation = await referralSystem.validateReferralCode(code);

      res.json(validation);
    } catch (error) {
      console.error("خطأ في التحقق من رمز الإحالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء التحقق من الرمز" });
    }
  });

  // APIs لصفحة إدارة الإحالات
  
  // التحقق من صحة رمز الإحالة للمستخدمين العامين
  app.get('/api/referral/validate/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const result = await referralSystem.validateReferralCode(code);
      res.json(result);
    } catch (error) {
      console.error('خطأ في التحقق من رمز الإحالة:', error);
      res.status(500).json({ error: 'فشل في التحقق من رمز الإحالة' });
    }
  });

  // جلب إحصائيات الإحالة للمستخدم المسجل دخوله
  app.get('/api/referral/stats', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const stats = await referralSystem.getUserReferralStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الإحالة:', error);
      res.status(500).json({ error: 'فشل في جلب إحصائيات الإحالة' });
    }
  });

  // جلب قائمة مكافآت الإحالة للمستخدم
  app.get('/api/referral/rewards', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const rewards = await referralSystem.getUserReferralRewards(req.user.id);
      res.json(rewards);
    } catch (error) {
      console.error('خطأ في جلب مكافآت الإحالة:', error);
      res.status(500).json({ error: 'فشل في جلب مكافآت الإحالة' });
    }
  });

  // Get commission earnings from market trades for the current user
  app.get('/api/commission/earnings', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user.id;
      
      // جلب العمولات المكتسبة من سجل العمولات
      const commissionEarnings = await db.select({
        id: commissionLogs.id,
        commissionAmount: commissionLogs.commissionAmount,
        commissionCurrency: commissionLogs.commissionCurrency,
        offerType: commissionLogs.offerType,
        action: commissionLogs.action,
        description: commissionLogs.description,
        createdAt: commissionLogs.createdAt,
        sourceId: commissionLogs.sourceId
      })
      .from(commissionLogs)
      .where(and(
        eq(commissionLogs.userId, userId),
        eq(commissionLogs.action, 'earned')
      ))
      .orderBy(desc(commissionLogs.createdAt))
      .limit(50);

      // حساب إجمالي العمولات المكتسبة لكل عملة
      const totals = commissionEarnings.reduce((acc, log) => {
        const currency = log.commissionCurrency;
        const amount = parseFloat(log.commissionAmount);
        acc[currency] = (acc[currency] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        earnings: commissionEarnings,
        totals
      });
    } catch (error) {
      console.error('خطأ في جلب العمولات المكتسبة:', error);
      res.status(500).json({ message: 'خطأ في جلب العمولات المكتسبة' });
    }
  });

  // جلب قائمة الأشخاص الذين أحالهم المستخدم
  app.get('/api/referral/my-referrals', authMiddleware, async (req: AuthRequest, res) => {
    try {
      // جلب المُحالين مباشرة من جدول المستخدمين مع تحديد الحالة
      const referrals = await db
        .select({
          id: users.id,
          referredUserName: users.fullName,
          referredUserEmail: users.email,
          joinedAt: users.createdAt,
          // تحديد الحالة كـ "نشط" لجميع المستخدمين المسجلين
          status: sql<string>`'active'`
        })
        .from(users)
        .where(eq(users.referredBy, req.user.id))
        .orderBy(desc(users.createdAt));

      res.json(referrals);
    } catch (error) {
      console.error('خطأ في جلب قائمة الإحالات:', error);
      res.status(500).json({ error: 'فشل في جلب قائمة الإحالات' });
    }
  });

  // جلب معلومات مستخدم أساسية (للتحقق من الإحالة)
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'معرف المستخدم غير صالح' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }

      // إرجاع معلومات أساسية فقط لأغراض الأمان
      res.json({
        id: user.id,
        fullName: user.fullName
      });
    } catch (error) {
      console.error('خطأ في جلب معلومات المستخدم:', error);
      res.status(500).json({ error: 'فشل في جلب معلومات المستخدم' });
    }
  });

  // إعدادات نظام الإحالة (للمدراء فقط)
  
  // جلب إعدادات الإحالة
  app.get('/api/admin/referral/settings', authMiddleware, requirePermission('canManageSettings'), async (req: AuthRequest, res) => {
    try {
      const settings = {
        referralCommissionPercentage: await referralSystem.getSetting('referral_commission_percentage', 5),
        referralSignupBonus: await referralSystem.getSetting('referral_signup_bonus', 10),
        maxReferralLevels: await referralSystem.getSetting('max_referral_levels', 2),
        minReferralAmount: await referralSystem.getSetting('min_referral_amount', 1),
      };
      res.json(settings);
    } catch (error) {
      console.error('خطأ في جلب إعدادات الإحالة:', error);
      res.status(500).json({ error: 'فشل في جلب الإعدادات' });
    }
  });

  // تحديث إعدادات الإحالة
  app.post('/api/admin/referral/settings', authMiddleware, requirePermission('canManageSettings'), async (req: AuthRequest, res) => {
    try {
      console.log('📊 طلب تحديث إعدادات الإحالة من المستخدم:', req.user.id);
      console.log('📦 البيانات الواردة:', req.body);
      
      const { referralCommissionPercentage, referralSignupBonus, maxReferralLevels, minReferralAmount } = req.body;

      // التحقق من صحة البيانات
      if (isNaN(Number(referralCommissionPercentage)) || isNaN(Number(referralSignupBonus)) || 
          isNaN(Number(maxReferralLevels)) || isNaN(Number(minReferralAmount))) {
        return res.status(400).json({ error: 'البيانات المدخلة غير صحيحة' });
      }

      console.log('💾 بدء حفظ الإعدادات...');
      
      await Promise.all([
        referralSystem.setSetting('referral_commission_percentage', Number(referralCommissionPercentage)),
        referralSystem.setSetting('referral_signup_bonus', Number(referralSignupBonus)),
        referralSystem.setSetting('max_referral_levels', Number(maxReferralLevels)),
        referralSystem.setSetting('min_referral_amount', Number(minReferralAmount)),
      ]);

      console.log('✅ تم حفظ إعدادات الإحالة بنجاح');
      res.json({ success: true, message: 'تم تحديث الإعدادات بنجاح' });
    } catch (error) {
      console.error('❌ خطأ في تحديث إعدادات الإحالة:', error);
      res.status(500).json({ error: `فشل في تحديث الإعدادات: ${error.message}` });
    }
  });

  // توليد رموز الإحالة للمستخدمين الموجودين
  app.post('/api/admin/referral/generate-codes', authMiddleware, requirePermission('canManageSettings'), async (req: AuthRequest, res) => {
    try {
      // جلب المستخدمين الذين لا يملكون رموز إحالة
      const usersWithoutCodes = await db
        .select({ id: users.id })
        .from(users)
        .where(isNull(users.referralCode));

      let generated = 0;
      for (const user of usersWithoutCodes) {
        let referralCode;
        let isUnique = false;
        let attempts = 0;
        
        // توليد رمز فريد
        while (!isUnique && attempts < 10) {
          referralCode = referralSystem.generateReferralCode();
          const existing = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.referralCode, referralCode))
            .limit(1);
          
          if (existing.length === 0) {
            isUnique = true;
          }
          attempts++;
        }

        if (isUnique && referralCode) {
          await db
            .update(users)
            .set({ referralCode })
            .where(eq(users.id, user.id));
          generated++;
        }
      }

      res.json({ 
        success: true, 
        message: `تم توليد ${generated} رمز إحالة جديد`,
        generated 
      });
    } catch (error) {
      console.error('خطأ في توليد رموز الإحالة:', error);
      res.status(500).json({ error: 'فشل في توليد رموز الإحالة' });
    }
  });

  // جلب إعدادات المكافآت الثابتة
  app.get("/api/admin/referral/fixed-rewards", authMiddleware, requirePermission('canManageSettings'), async (req: AuthRequest, res: Response) => {
    try {
      const settings = {
        lydReward: await referralSystem.getSetting('referral.fixed_reward_lyd', { amount: 1.00 }),
        usdReward: await referralSystem.getSetting('referral.fixed_reward_usd', { amount: 0.50 }),
        marketReward: await referralSystem.getSetting('referral.fixed_reward_market_sell', { amount: 0.005 }),
        systemFeeRate: await referralSystem.getSetting('referral.system_fee_rate', { rate: 0.10 })
      };

      res.json(settings);
    } catch (error) {
      console.error('خطأ في جلب إعدادات المكافآت الثابتة:', error);
      res.status(500).json({ error: 'فشل في جلب الإعدادات' });
    }
  });

  // تحديث إعدادات المكافآت الثابتة
  app.put("/api/admin/referral/fixed-rewards", authMiddleware, requirePermission('canManageSettings'), async (req: AuthRequest, res: Response) => {
    try {
      const { lydReward, usdReward, marketReward, systemFeeRate } = req.body;

      // التحقق من صحة البيانات
      if (typeof lydReward?.amount !== 'number' || lydReward.amount < 0) {
        return res.status(400).json({ error: 'مكافأة تحويل LYD يجب أن تكون رقم موجب' });
      }
      if (typeof usdReward?.amount !== 'number' || usdReward.amount < 0) {
        return res.status(400).json({ error: 'مكافأة تحويل USD يجب أن تكون رقم موجب' });
      }
      if (typeof marketReward?.amount !== 'number' || marketReward.amount < 0) {
        return res.status(400).json({ error: 'مكافأة بيع السوق يجب أن تكون رقم موجب' });
      }
      if (typeof systemFeeRate?.rate !== 'number' || systemFeeRate.rate < 0 || systemFeeRate.rate > 1) {
        return res.status(400).json({ error: 'نسبة رسوم النظام يجب أن تكون بين 0 و 1' });
      }

      // حفظ الإعدادات
      await referralSystem.setSetting('referral.fixed_reward_lyd', lydReward);
      await referralSystem.setSetting('referral.fixed_reward_usd', usdReward);
      await referralSystem.setSetting('referral.fixed_reward_market_sell', marketReward);
      await referralSystem.setSetting('referral.system_fee_rate', systemFeeRate);

      res.json({ 
        success: true, 
        message: 'تم تحديث إعدادات المكافآت الثابتة بنجاح',
        settings: { lydReward, usdReward, marketReward, systemFeeRate }
      });
    } catch (error) {
      console.error('خطأ في تحديث إعدادات المكافآت الثابتة:', error);
      res.status(500).json({ error: 'فشل في تحديث الإعدادات' });
    }
  });

  // إحصائيات شاملة لنظام الإحالة (للمدير فقط)
  app.get("/api/admin/referral/overview", authMiddleware, requirePermission('canManageReports'), async (req: AuthRequest, res: Response) => {
    try {
      // إجمالي المستخدمين المُحالين
      const totalReferredResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(isNotNull(users.referredBy));

      // إجمالي المكافآت المدفوعة
      const totalRewardsResult = await db
        .select({
          currency: referralRewards.currency,
          total: sql<number>`SUM(${referralRewards.rewardAmount})`
        })
        .from(referralRewards)
        .where(eq(referralRewards.status, 'paid'))
        .groupBy(referralRewards.currency);

      // أفضل المُحيلين
      const topReferrersResult = await db
        .select({
          referrerId: referralRewards.referrerId,
          totalRewards: sql<number>`SUM(${referralRewards.rewardAmount})`,
          referralCount: sql<number>`COUNT(*)`
        })
        .from(referralRewards)
        .where(eq(referralRewards.status, 'paid'))
        .groupBy(referralRewards.referrerId)
        .orderBy(sql`SUM(${referralRewards.rewardAmount}) DESC`)
        .limit(10);

      // إضافة أسماء المُحيلين
      const topReferrers = await Promise.all(
        topReferrersResult.map(async (referrer) => {
          const user = await storage.getUser(referrer.referrerId);
          return {
            ...referrer,
            referrerName: user?.fullName || 'غير معروف',
            referrerAccountNumber: user?.accountNumber
          };
        })
      );

      res.json({
        totalReferred: totalReferredResult[0]?.count || 0,
        totalRewards: totalRewardsResult,
        topReferrers
      });
    } catch (error) {
      console.error("خطأ في جلب نظرة عامة على نظام الإحالة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الإحصائيات" });
    }
  });

  // ===== نظام إدارة قيود الوصول =====
  
  // التحقق من صلاحية الوصول للحساب المُصرح له فقط
  const checkRestrictionsAdmin = (req: AuthRequest, res: Response, next: any) => {
    const authorizedEmail = 'ss73ss73ss73@gmail.com';
    if (req.user.email !== authorizedEmail) {
      return res.status(403).json({ message: "غير مُصرح بالوصول لهذه الوظيفة" });
    }
    next();
  };

  // دالة لتسجيل العمليات في سجل التدقيق
  const logAuditAction = async (actorId: number, action: string, entity: string, entityId?: number, data?: any) => {
    try {
      await db.insert(auditLogs).values({
        actorId,
        action,
        entity,
        entityId,
        data: data || {},
      });
    } catch (error) {
      console.error('خطأ في تسجيل العملية:', error);
    }
  };

  // إضافة قيد شامل على صفحة (منع جميع المستخدمين)
  app.post("/api/restrictions/global", authMiddleware, checkRestrictionsAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { pageKey, reason, isActive: requestIsActive = true, expiresAt, allowedUsers = [] } = req.body;
      
      // القيود الشاملة الجديدة تكون نشطة دائماً 
      const isActive = true;

      if (!pageKey) {
        return res.status(400).json({ message: "مفتاح الصفحة مطلوب" });
      }

      // إضافة قيد شامل (userId = null للقيود الشاملة)
      const globalRestriction = await db.insert(pageRestrictions).values({
        userId: null, // القيود الشاملة لها userId = null
        accountNumber: 'GLOBAL', // معرف خاص للقيود الشاملة
        pageKey,
        scope: 'global',
        reason: reason || `قيد شامل على صفحة ${pageKey}`,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: req.user.id,
      }).returning();

      // إضافة المستخدمين المسموح لهم كاستثناءات
      if (allowedUsers.length > 0) {
        for (const userIdentifier of allowedUsers) {
          let user;
          if (userIdentifier.includes('@')) {
            user = await db.select().from(users).where(eq(users.email, userIdentifier)).limit(1);
          } else {
            user = await db.select().from(users).where(eq(users.accountNumber, userIdentifier)).limit(1);
          }

          if (user.length > 0) {
            // إضافة استثناء للمستخدم (قيد معكوس - isActive = false يعني مسموح)
            await db.insert(pageRestrictions).values({
              userId: user[0].id,
              accountNumber: user[0].accountNumber,
              pageKey,
              scope: 'exception',
              reason: `استثناء من القيد الشامل على ${pageKey}`,
              isActive: false, // false يعني هذا استثناء (مسموح)
              expiresAt: expiresAt ? new Date(expiresAt) : null,
              createdBy: req.user.id,
            });
          }
        }
      }

      await logAuditAction(req.user.id, 'create_global_restriction', 'page_restrictions', globalRestriction[0]?.id, {
        type: 'global_restriction_created',
        pageKey,
        allowedUsersCount: allowedUsers.length,
      });

      res.json({ 
        message: "تم إنشاء القيد الشامل بنجاح", 
        restriction: globalRestriction[0],
        allowedUsersCount: allowedUsers.length
      });
    } catch (error) {
      console.error("خطأ في إنشاء القيد الشامل:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء القيد الشامل" });
    }
  });

  // جلب جميع القيود الشاملة
  app.get("/api/restrictions/global", authMiddleware, checkRestrictionsAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const globalRestrictions = await db.select({
        id: pageRestrictions.id,
        pageKey: pageRestrictions.pageKey,
        reason: pageRestrictions.reason,
        isActive: pageRestrictions.isActive,
        expiresAt: pageRestrictions.expiresAt,
        createdAt: pageRestrictions.createdAt,
        createdByName: users.fullName,
      })
      .from(pageRestrictions)
      .leftJoin(users, eq(pageRestrictions.createdBy, users.id))
      .where(and(
        isNull(pageRestrictions.userId), // القيود الشاملة لها userId = null
        eq(pageRestrictions.scope, 'global')
      ))
      .orderBy(desc(pageRestrictions.createdAt));

      // جلب الاستثناءات لكل قيد شامل
      const restrictionsWithExceptions = await Promise.all(
        globalRestrictions.map(async (restriction) => {
          const exceptions = await db.select({
            id: pageRestrictions.id,
            userId: pageRestrictions.userId,
            accountNumber: pageRestrictions.accountNumber,
            fullName: users.fullName,
            email: users.email,
          })
          .from(pageRestrictions)
          .leftJoin(users, eq(pageRestrictions.userId, users.id))
          .where(and(
            eq(pageRestrictions.pageKey, restriction.pageKey),
            eq(pageRestrictions.scope, 'exception'),
            eq(pageRestrictions.isActive, true) // الاستثناءات النشطة لها isActive = true
          ));

          return {
            ...restriction,
            exceptions: exceptions
          };
        })
      );

      res.json(restrictionsWithExceptions);
    } catch (error) {
      console.error("خطأ في جلب القيود الشاملة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب القيود الشاملة" });
    }
  });

  // إضافة استثناء لقيد شامل
  app.post("/api/restrictions/global/:pageKey/exceptions", authMiddleware, checkRestrictionsAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { pageKey } = req.params;
      const { userIdentifier } = req.body;

      if (!userIdentifier) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }

      // البحث عن المستخدم
      let user;
      if (userIdentifier.includes('@')) {
        user = await db.select().from(users).where(eq(users.email, userIdentifier)).limit(1);
      } else {
        user = await db.select().from(users).where(eq(users.accountNumber, userIdentifier)).limit(1);
      }

      if (!user.length) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // التحقق من وجود القيد الشامل
      const globalRestriction = await db.select()
        .from(pageRestrictions)
        .where(and(
          isNull(pageRestrictions.userId),
          eq(pageRestrictions.pageKey, pageKey),
          eq(pageRestrictions.scope, 'global'),
          eq(pageRestrictions.isActive, true)
        ))
        .limit(1);

      if (!globalRestriction.length) {
        return res.status(404).json({ message: "لا يوجد قيد شامل نشط على هذه الصفحة" });
      }

      // التحقق من عدم وجود استثناء مسبق
      const existingException = await db.select()
        .from(pageRestrictions)
        .where(and(
          eq(pageRestrictions.userId, user[0].id),
          eq(pageRestrictions.pageKey, pageKey),
          eq(pageRestrictions.scope, 'exception')
        ))
        .limit(1);

      if (existingException.length) {
        return res.status(409).json({ message: "يوجد استثناء مسبق لهذا المستخدم" });
      }

      // إضافة الاستثناء
      const exception = await db.insert(pageRestrictions).values({
        userId: user[0].id,
        accountNumber: user[0].accountNumber,
        pageKey,
        scope: 'exception',
        reason: `استثناء من القيد الشامل على ${pageKey}`,
        isActive: false, // false يعني هذا استثناء (مسموح)
        createdBy: req.user.id,
      }).returning();

      await logAuditAction(req.user.id, 'add_exception', 'page_restrictions', exception[0]?.id, {
        type: 'exception_added',
        pageKey,
        targetUserId: user[0].id,
        accountNumber: user[0].accountNumber,
      });

      res.json({ 
        message: "تم إضافة الاستثناء بنجاح", 
        exception: exception[0]
      });
    } catch (error) {
      console.error("خطأ في إضافة الاستثناء:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إضافة الاستثناء" });
    }
  });

  // إضافة عدة استثناءات دفعة واحدة لقيد شامل
  const bulkExceptionsSchema = z.object({
    identifiers: z.array(z.string().min(1)).min(1).max(100),
    reason: z.string().optional().default("استثناء إدخال متعدد")
  });

  app.post("/api/restrictions/global/:pageKey/exceptions/bulk", authMiddleware, checkRestrictionsAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { pageKey } = req.params;
      
      // التحقق من صحة البيانات المدخلة
      const validationResult = bulkExceptionsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "بيانات غير صحيحة", 
          errors: validationResult.error.issues 
        });
      }

      const { identifiers, reason } = validationResult.data;

      // التحقق من وجود قيد شامل نشط
      const globalRestriction = await db.select().from(pageRestrictions)
        .where(and(
          isNull(pageRestrictions.userId),
          eq(pageRestrictions.scope, 'global'),
          or(
            eq(pageRestrictions.pageKey, pageKey),
            eq(pageRestrictions.pageKey, 'all')
          ),
          eq(pageRestrictions.isActive, true)
        ))
        .limit(1);

      if (!globalRestriction.length) {
        return res.status(404).json({ message: "لا يوجد قيد شامل نشط لهذه الصفحة" });
      }

      console.log(`🔍 [إضافة استثناءات متعددة] معالجة ${identifiers.length} معرف للصفحة: ${pageKey}`);

      const results: Array<{
        identifier: string;
        userId?: number;
        accountNumber?: string;
        status: 'added' | 'exists' | 'not_found' | 'error';
        message: string;
      }> = [];

      // إزالة التكرارات
      const uniqueIdentifiers = [...new Set(identifiers)];

      let addedCount = 0;
      
      // استخدام transaction للحفاظ على سلامة البيانات
      await db.transaction(async (tx) => {
        for (const identifier of uniqueIdentifiers) {
          try {
            // البحث عن المستخدم
            let user;
            if (identifier.includes('@')) {
              user = await tx.select().from(users).where(eq(users.email, identifier.trim())).limit(1);
            } else {
              user = await tx.select().from(users).where(eq(users.accountNumber, identifier.trim())).limit(1);
            }

            if (!user.length) {
              results.push({
                identifier,
                status: 'not_found',
                message: 'المستخدم غير موجود'
              });
              continue;
            }

            const foundUser = user[0];

            // التحقق من وجود استثناء موجود
            const existingException = await tx.select().from(pageRestrictions)
              .where(and(
                eq(pageRestrictions.userId, foundUser.id),
                or(
                  eq(pageRestrictions.pageKey, pageKey),
                  eq(pageRestrictions.pageKey, 'all')
                ),
                eq(pageRestrictions.scope, 'exception')
              ))
              .limit(1);

            if (existingException.length > 0) {
              results.push({
                identifier,
                userId: foundUser.id,
                accountNumber: foundUser.accountNumber,
                status: 'exists',
                message: 'الاستثناء موجود مسبقاً'
              });
              continue;
            }

            // إضافة الاستثناء الجديد
            const newException = await tx.insert(pageRestrictions).values({
              userId: foundUser.id,
              pageKey: pageKey,
              scope: 'exception',
              reason: reason,
              isActive: true,
              expiresAt: globalRestriction[0].expiresAt, // وراثة تاريخ الانتهاء
              createdBy: req.user.id
            }).returning();

            results.push({
              identifier,
              userId: foundUser.id,
              accountNumber: foundUser.accountNumber,
              status: 'added',
              message: 'تم إضافة الاستثناء بنجاح'
            });

            addedCount++;

          } catch (error) {
            console.error(`خطأ في معالجة المعرف ${identifier}:`, error);
            results.push({
              identifier,
              status: 'error',
              message: 'حدث خطأ أثناء المعالجة'
            });
          }
        }
      });

      // تسجيل العملية في سجل التدقيق
      await logAuditAction(req.user.id, 'add_bulk_exceptions', 'page_restrictions', globalRestriction[0].id, {
        type: 'bulk_exceptions_added',
        pageKey,
        totalSubmitted: identifiers.length,
        uniqueSubmitted: uniqueIdentifiers.length,
        addedCount,
        results: results.map(r => ({ identifier: r.identifier, status: r.status }))
      });

      console.log(`✅ [إضافة استثناءات متعددة] تمت معالجة العملية: ${addedCount} إضافة من أصل ${uniqueIdentifiers.length} معرف`);

      res.json({
        message: `تمت معالجة العملية: تم إضافة ${addedCount} استثناء من أصل ${uniqueIdentifiers.length} معرف`,
        summary: {
          totalSubmitted: identifiers.length,
          uniqueIdentifiers: uniqueIdentifiers.length,
          addedCount,
          existsCount: results.filter(r => r.status === 'exists').length,
          notFoundCount: results.filter(r => r.status === 'not_found').length,
          errorCount: results.filter(r => r.status === 'error').length
        },
        results
      });
    } catch (error) {
      console.error("❌ [إضافة استثناءات متعددة] خطأ:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إضافة الاستثناءات المتعددة" });
    }
  });

  // إزالة استثناء من قيد شامل
  app.delete("/api/restrictions/global/:pageKey/exceptions/:userId", authMiddleware, checkRestrictionsAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { pageKey, userId } = req.params;

      const deletedExceptions = await db.delete(pageRestrictions)
        .where(and(
          eq(pageRestrictions.userId, parseInt(userId)),
          eq(pageRestrictions.pageKey, pageKey),
          eq(pageRestrictions.scope, 'exception')
        ))
        .returning();

      if (!deletedExceptions.length) {
        return res.status(404).json({ message: "الاستثناء غير موجود" });
      }

      await logAuditAction(req.user.id, 'remove_exception', 'page_restrictions', deletedExceptions[0].id, {
        type: 'exception_removed',
        pageKey,
        targetUserId: parseInt(userId),
      });

      res.json({ message: "تم إزالة الاستثناء بنجاح" });
    } catch (error) {
      console.error("خطأ في إزالة الاستثناء:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إزالة الاستثناء" });
    }
  });

  // إزالة قيد شامل مع جميع استثناءاته
  app.delete("/api/restrictions/global/:pageKey", authMiddleware, checkRestrictionsAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { pageKey } = req.params;

      // حذف جميع الاستثناءات أولاً
      await db.delete(pageRestrictions)
        .where(and(
          eq(pageRestrictions.pageKey, pageKey),
          eq(pageRestrictions.scope, 'exception')
        ));

      // حذف القيد الشامل
      const deletedRestrictions = await db.delete(pageRestrictions)
        .where(and(
          isNull(pageRestrictions.userId),
          eq(pageRestrictions.pageKey, pageKey),
          eq(pageRestrictions.scope, 'global')
        ))
        .returning();

      if (!deletedRestrictions.length) {
        return res.status(404).json({ message: "القيد الشامل غير موجود" });
      }

      await logAuditAction(req.user.id, 'remove_global_restriction', 'page_restrictions', deletedRestrictions[0].id, {
        type: 'global_restriction_removed',
        pageKey,
      });

      res.json({ message: "تم إزالة القيد الشامل وجميع استثناءاته بنجاح" });
    } catch (error) {
      console.error("خطأ في إزالة القيد الشامل:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إزالة القيد الشامل" });
    }
  });

  // إضافة أو تحديث قيد صفحة
  app.post("/api/restrictions", authMiddleware, checkRestrictionsAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { userIdentifier, pageKey, scope = 'page', reason, isActive = true, expiresAt } = req.body;

      // البحث عن المستخدم بالحساب أو البريد
      let user;
      if (userIdentifier.includes('@')) {
        user = await db.select().from(users).where(eq(users.email, userIdentifier)).limit(1);
      } else {
        user = await db.select().from(users).where(eq(users.accountNumber, userIdentifier)).limit(1);
      }

      if (!user.length) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const targetUser = user[0];

      // منع تعطيل الحساب المُصرح له
      if (targetUser.email === 'ss73ss73ss73@gmail.com') {
        return res.status(400).json({ message: "لا يمكن تطبيق قيود على الحساب المُصرح له" });
      }

      // حساب تاريخ الانتهاء إذا تم توفير مدة
      let expirationDate = null;
      if (expiresAt && expiresAt !== '') {
        expirationDate = new Date(expiresAt);
      }

      // التحقق من البيانات المطلوبة
      if (!pageKey || !scope) {
        return res.status(400).json({ message: "يجب تحديد نوع الصفحة والنطاق" });
      }

      console.log('إضافة قيد للمستخدم:', {
        userId: targetUser.id,
        accountNumber: targetUser.accountNumber,
        pageKey,
        scope,
        reason,
        isActive,
        expiresAt: expirationDate,
        createdBy: req.user.id,
      });

      // إضافة أو تحديث القيد
      const restriction = await db.insert(pageRestrictions).values({
        userId: targetUser.id,
        accountNumber: targetUser.accountNumber || '',
        pageKey,
        scope,
        reason: reason || '',
        isActive,
        expiresAt: expirationDate,
        createdBy: req.user.id,
      }).onConflictDoUpdate({
        target: [pageRestrictions.userId, pageRestrictions.pageKey],
        set: {
          scope,
          reason: reason || '',
          isActive,
          expiresAt: expirationDate,
          createdBy: req.user.id,
        },
      }).returning();

      // تسجيل العملية
      await logAuditAction(req.user.id, 'upsert_restriction', 'page_restrictions', restriction[0]?.id, {
        type: 'restriction_upsert',
        pageKey,
        scope,
        isActive,
        accountNumber: targetUser.accountNumber,
        targetUserId: targetUser.id,
      });

      res.json({ message: "تم حفظ القيد بنجاح", restriction: restriction[0] });
    } catch (error) {
      console.error("خطأ في إدارة القيود:", error);
      
      // معالجة أخطاء محددة
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          res.status(400).json({ message: "يوجد قيد مماثل للمستخدم على هذه الصفحة بالفعل" });
        } else if (error.message.includes('foreign key')) {
          res.status(400).json({ message: "بيانات غير صحيحة، تأكد من وجود المستخدم" });
        } else if (error.message.includes('not null')) {
          res.status(400).json({ message: "جميع الحقول المطلوبة يجب أن تكون معبأة" });
        } else {
          res.status(500).json({ message: `خطأ في حفظ القيد: ${error.message}` });
        }
      } else {
        res.status(500).json({ message: "حدث خطأ غير متوقع أثناء حفظ القيد" });
      }
    }
  });

  // جلب قيود مستخدم معين
  app.get("/api/restrictions/:userIdentifier", authMiddleware, checkRestrictionsAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { userIdentifier } = req.params;

      // البحث عن المستخدم
      let user;
      if (userIdentifier.includes('@')) {
        user = await db.select().from(users).where(eq(users.email, userIdentifier)).limit(1);
      } else {
        user = await db.select().from(users).where(eq(users.accountNumber, userIdentifier)).limit(1);
      }

      if (!user.length) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const targetUser = user[0];

      // جلب القيود النشطة
      const restrictions = await db.select({
        id: pageRestrictions.id,
        pageKey: pageRestrictions.pageKey,
        scope: pageRestrictions.scope,
        reason: pageRestrictions.reason,
        isActive: pageRestrictions.isActive,
        expiresAt: pageRestrictions.expiresAt,
        createdAt: pageRestrictions.createdAt,
        createdByName: users.fullName,
      }).from(pageRestrictions)
        .leftJoin(users, eq(pageRestrictions.createdBy, users.id))
        .where(eq(pageRestrictions.userId, targetUser.id))
        .orderBy(desc(pageRestrictions.createdAt));

      res.json({ 
        user: {
          id: targetUser.id,
          fullName: targetUser.fullName,
          email: targetUser.email,
          accountNumber: targetUser.accountNumber,
          active: targetUser.active,
        },
        restrictions 
      });
    } catch (error) {
      console.error("خطأ في جلب القيود:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب القيود" });
    }
  });

  // إزالة قيد
  app.delete("/api/restrictions/:restrictionId", authMiddleware, checkRestrictionsAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const restrictionId = parseInt(req.params.restrictionId);

      // جلب معلومات القيد قبل الحذف
      const restriction = await db.select().from(pageRestrictions).where(eq(pageRestrictions.id, restrictionId)).limit(1);

      if (!restriction.length) {
        return res.status(404).json({ message: "القيد غير موجود" });
      }

      // حذف القيد
      await db.delete(pageRestrictions).where(eq(pageRestrictions.id, restrictionId));

      // تسجيل العملية
      await logAuditAction(req.user.id, 'remove_restriction', 'page_restrictions', restrictionId, {
        type: 'restriction_removed',
        pageKey: restriction[0].pageKey,
        userId: restriction[0].userId,
      });

      res.json({ message: "تم إزالة القيد بنجاح" });
    } catch (error) {
      console.error("خطأ في إزالة القيد:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إزالة القيد" });
    }
  });

  // التحقق من قيود المستخدم الحالي
  app.get("/api/my-restrictions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      // Super Admin يتجاوز جميع القيود
      if (security.isSuperAdmin(req.user.email, req.user.id)) {
        return res.json({ 
          restrictedPages: [],
          hasGlobalRestriction: false,
          restrictions: []
        });
      }

      const restrictions = await db.select({
        pageKey: pageRestrictions.pageKey,
        scope: pageRestrictions.scope,
        reason: pageRestrictions.reason,
        expiresAt: pageRestrictions.expiresAt,
      }).from(pageRestrictions)
        .where(and(
          or(
            eq(pageRestrictions.userId, req.user.id), // قيود خاصة بالمستخدم
            isNull(pageRestrictions.userId) // قيود شاملة
          ),
          eq(pageRestrictions.isActive, true),
          or(
            isNull(pageRestrictions.expiresAt),
            gte(pageRestrictions.expiresAt, new Date())
          )
        ));

      const restrictedPages = restrictions.map(r => r.pageKey);
      const hasGlobalRestriction = restrictedPages.includes('all');

      res.json({ 
        restrictedPages,
        hasGlobalRestriction,
        restrictions: restrictions.map(r => ({
          pageKey: r.pageKey,
          reason: r.reason,
          expiresAt: r.expiresAt,
        }))
      });
    } catch (error) {
      console.error("خطأ في جلب قيود المستخدم:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب القيود" });
    }
  });

  // التحقق من قيد صفحة محددة للمستخدم الحالي
  app.get("/api/check-restriction/:pageKey", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { pageKey } = req.params;
      console.log(`🔍 [API تحقق قيود] فحص قيود صفحة: ${pageKey} للمستخدم ID: ${req.user.id}`);
      
      // Super Admin يتجاوز جميع القيود
      if (security.isSuperAdmin(req.user.email, req.user.id)) {
        console.log(`🔑 Super Admin تجاوز قيود صفحة ${pageKey}`);
        return res.json({ isBlocked: false, reason: null });
      }

      // أولاً: البحث عن قيد شامل نشط
      console.log(`📊 بحث عن قيود شاملة لصفحة ${pageKey}...`);
      const globalRestriction = await db.select().from(pageRestrictions)
        .where(and(
          isNull(pageRestrictions.userId), // قيود شاملة فقط
          eq(pageRestrictions.scope, 'global'), // تحديد واضح للنطاق
          or(
            eq(pageRestrictions.pageKey, pageKey),
            eq(pageRestrictions.pageKey, 'all')
          ),
          eq(pageRestrictions.isActive, true),
          or(
            isNull(pageRestrictions.expiresAt),
            gte(pageRestrictions.expiresAt, new Date())
          )
        ))
        .limit(1);

      if (globalRestriction.length > 0) {
        console.log(`🔍 [API قيد شامل] وُجد قيد شامل نشط: ${globalRestriction[0].reason}`);
        
        // ثانياً: البحث عن استثناء لهذا المستخدم
        console.log(`🔍 [API استثناء] بحث عن استثناء للمستخدم ${req.user.id}...`);
        const userException = await db.select().from(pageRestrictions)
          .where(and(
            eq(pageRestrictions.userId, req.user.id),
            or(
              eq(pageRestrictions.pageKey, pageKey),
              eq(pageRestrictions.pageKey, 'all')
            ),
            eq(pageRestrictions.scope, 'exception'),
            // ❌ إزالة شرط isActive = false (كان يسبب المشكلة)
            or(
              isNull(pageRestrictions.expiresAt),
              gte(pageRestrictions.expiresAt, new Date())
            )
          ))
          .orderBy(pageRestrictions.createdAt) // أحدث استثناء أولاً
          .limit(1);

        if (userException.length > 0) {
          console.log(`✅ [API استثناء] وُجد استثناء للمستخدم: ${userException[0].reason}`);
          return res.json({ isBlocked: false, reason: null }); // السماح بالوصول - المستخدم مستثنى
        }

        console.log(`🚫 [API رفض] لا يوجد استثناء - سيتم منع الوصول`);
        return res.json({ 
          isBlocked: true, 
          reason: globalRestriction[0].reason || 'غير مسموح بالوصول'
        });
      }

      // ثالثاً: البحث عن قيود خاصة بالمستخدم
      console.log(`📊 بحث عن قيود خاصة بالمستخدم ${req.user.id}...`);
      const userRestriction = await db.select().from(pageRestrictions)
        .where(and(
          eq(pageRestrictions.userId, req.user.id),
          or(
            eq(pageRestrictions.pageKey, pageKey),
            eq(pageRestrictions.pageKey, 'all')
          ),
          eq(pageRestrictions.isActive, true),
          or(
            isNull(pageRestrictions.expiresAt),
            gte(pageRestrictions.expiresAt, new Date())
          )
        ))
        .limit(1);

      if (userRestriction.length > 0) {
        console.log(`🚫 [API قيد خاص] وُجد قيد خاص بالمستخدم: ${userRestriction[0].reason}`);
        return res.json({ 
          isBlocked: true, 
          reason: userRestriction[0].reason || 'غير مسموح بالوصول'
        });
      }

      console.log(`✅ [API تحقق قيود] لا توجد قيود لصفحة ${pageKey}`);
      res.json({ isBlocked: false, reason: null });
    } catch (error) {
      console.error("❌ [API تحقق قيود] خطأ في التحقق من القيد:", error);
      res.status(500).json({ message: "حدث خطأ أثناء التحقق من القيد" });
    }
  });

  // جلب سجل التدقيق
  app.get("/api/audit-logs", authMiddleware, checkRestrictionsAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const logs = await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        data: auditLogs.data,
        createdAt: auditLogs.createdAt,
        actorName: users.fullName,
        actorEmail: users.email,
      }).from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorId, users.id))
        .where(eq(auditLogs.entity, 'page_restrictions'))
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);

      res.json(logs);
    } catch (error) {
      console.error("خطأ في جلب سجل التدقيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب السجل" });
    }
  });

  // ===== Dev Studio API Routes =====
  
  // Middleware للتحقق من الوصول لـ Dev Studio
  const checkDevStudioAccess = (req: AuthRequest, res: Response, next: any) => {
    if (!req.user || req.user.email !== 'ss73ss73ss73@gmail.com') {
      return res.status(403).json({ message: "غير مصرح بالوصول إلى Dev Studio" });
    }
    next();
  };

  // جلب جميع الصفحات في Dev Studio
  app.get("/api/dev-studio/pages", authMiddleware, checkDevStudioAccess, async (req: AuthRequest, res: Response) => {
    try {
      const pages = await db.select().from(devPages).orderBy(devPages.updatedAt);
      res.json(pages);
    } catch (error) {
      console.error("خطأ في جلب الصفحات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الصفحات" });
    }
  });

  // إنشاء/تحديث صفحة
  app.post("/api/dev-studio/pages", authMiddleware, checkDevStudioAccess, async (req: AuthRequest, res: Response) => {
    try {
      const { route, titleAr, layout, status, visibility, allowedRoles } = req.body;
      
      // استدعاء RPC function لإنشاء/تحديث الصفحة
      const result = await pool.query(
        'SELECT dev_studio_page_upsert($1, $2, $3, $4, $5, $6, $7)',
        [route, titleAr, layout || 'default', status || 'draft', visibility || 'public', allowedRoles || [], req.user.email]
      );
      
      const pageId = result.rows[0].dev_studio_page_upsert;
      
      res.json({ success: true, pageId });
    } catch (error) {
      console.error("خطأ في إنشاء/تحديث الصفحة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حفظ الصفحة" });
    }
  });

  // جلب Feature Flags
  app.get("/api/dev-studio/feature-flags", authMiddleware, checkDevStudioAccess, async (req: AuthRequest, res: Response) => {
    try {
      const flags = await db.select().from(devFeatureFlags).orderBy(devFeatureFlags.key);
      res.json(flags);
    } catch (error) {
      console.error("خطأ في جلب أعلام الميزات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب أعلام الميزات" });
    }
  });

  // تحديث Feature Flag
  app.post("/api/dev-studio/feature-flags", authMiddleware, checkDevStudioAccess, async (req: AuthRequest, res: Response) => {
    try {
      const { key, enabled, perAccount } = req.body;
      
      // استدعاء RPC function لتحديث العلم
      await pool.query(
        'SELECT dev_studio_flag_set($1, $2, $3, $4)',
        [key, enabled, perAccount || {}, req.user.email]
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("خطأ في تحديث علم الميزة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث علم الميزة" });
    }
  });

  // جلب السمات
  app.get("/api/dev-studio/themes", authMiddleware, checkDevStudioAccess, async (req: AuthRequest, res: Response) => {
    try {
      const themes = await db.select().from(devThemes).orderBy(devThemes.createdAt);
      res.json(themes);
    } catch (error) {
      console.error("خطأ في جلب السمات:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب السمات" });
    }
  });

  // حفظ سمة جديدة أو تحديث موجودة
  app.post("/api/dev-studio/themes", authMiddleware, checkDevStudioAccess, async (req: AuthRequest, res: Response) => {
    try {
      const { name, tokens, isActive } = req.body;
      
      // إذا كانت السمة الجديدة نشطة، قم بإلغاء تفعيل الأخرى
      if (isActive) {
        await db.update(devThemes)
          .set({ isActive: false })
          .where(eq(devThemes.isActive, true));
      }
      
      const [theme] = await db.insert(devThemes)
        .values({
          name,
          tokens,
          isActive: isActive || false
        })
        .returning();
      
      // تسجيل في audit log
      await db.insert(devAuditLogs).values({
        actorEmail: req.user.email,
        action: 'create',
        entity: 'theme',
        entityId: theme.id,
        data: { name, tokens }
      });
      
      res.json({ success: true, theme });
    } catch (error) {
      console.error("خطأ في حفظ السمة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حفظ السمة" });
    }
  });

  // جلب سجل التدقيق لـ Dev Studio
  app.get("/api/dev-studio/audit-logs", authMiddleware, checkDevStudioAccess, async (req: AuthRequest, res: Response) => {
    try {
      const logs = await db.select()
        .from(devAuditLogs)
        .orderBy(devAuditLogs.createdAt)
        .limit(100);
      
      res.json(logs);
    } catch (error) {
      console.error("خطأ في جلب سجل التدقيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب سجل التدقيق" });
    }
  });

  // Debug endpoint to check IP resolution (REMOVE IN PRODUCTION)
  app.get('/api/debug/ip', async (req, res) => {
    try {
      const ipResult = getClientPublicIP(req);
      const geo = await getGeoLocation(ipResult.ip);
      
      res.json({
        message: 'IP Debug Info',
        timestamp: new Date().toISOString(),
        ipResult,
        geoLocation: geo,
        headers: {
          'cf-connecting-ip': req.headers['cf-connecting-ip'],
          'fly-client-ip': req.headers['fly-client-ip'],
          'x-client-ip': req.headers['x-client-ip'],
          'x-real-ip': req.headers['x-real-ip'],
          'x-forwarded-for': req.headers['x-forwarded-for'],
        },
        expressData: {
          'req.ip': req.ip,
          'req.socket.remoteAddress': req.socket?.remoteAddress
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Debug failed', details: error });
    }
  });

  // جلب المعاملات الإدارية (للإدمن فقط)
  app.get("/api/admin/transactions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      
      // التحقق من صلاحيات الإدمن
      if (user.type !== 'admin') {
        return res.status(403).json({ 
          message: "غير مصرح لك بعرض المعاملات الإدارية - هذه العملية محصورة للمشرفين فقط" 
        });
      }

      // استخراج فلاتر من query parameters
      const filters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        q: req.query.q as string,
        status: req.query.status as string,
        type: req.query.type as string,
        currency: req.query.currency as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 50
      };

      console.log('🔍 جلب جميع معاملات المستخدمين من جميع الجداول...');
      console.log('📊 تنفيذ استعلامات البيانات والعد...');
      
      // استيراد الفئة
      const { AdminTransactionsFixed } = await import('./admin-transactions-fixed');
      
      // استدعاء الدالة مع الفلاتر
      const result = await AdminTransactionsFixed.getAllTransactions(filters);
      
      console.log(`✅ تم جلب ${result.rows.length} معاملة من أصل ${result.summary.totalCount}`);
      
      res.json(result);
    } catch (error: any) {
      console.error("❌ خطأ في جلب المعاملات الإدارية:", error);
      res.status(500).json({ 
        error: "المعاملة غير موجودة",
        message: "حدث خطأ أثناء جلب المعاملات",
        details: error.message
      });
    }
  });

  // حذف المعاملات (للإدمن فقط)
  app.delete("/api/admin/transactions/delete", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      
      // التحقق من صلاحيات الإدمن
      if (user.type !== 'admin') {
        return res.status(403).json({ 
          message: "غير مصرح لك بحذف المعاملات - هذه العملية محصورة للمشرفين فقط" 
        });
      }

      const { transactionIds } = req.body;
      
      // التحقق من البيانات المرسلة
      if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
        return res.status(400).json({ 
          message: "يجب تحديد معرفات المعاملات المطلوب حذفها" 
        });
      }

      // حد أقصى للأمان - لا يمكن حذف أكثر من 100 معاملة في المرة الواحدة
      if (transactionIds.length > 100) {
        return res.status(400).json({ 
          message: "لا يمكن حذف أكثر من 100 معاملة في المرة الواحدة لأسباب أمنية" 
        });
      }

      console.log(`🗑️ [ADMIN DELETE] المشرف ${user.email} (ID: ${user.id}) يحاول حذف ${transactionIds.length} معاملة`);
      
      let deletedCount = 0;
      let errors = [];

      // حذف المعاملات واحدة تلو الأخرى للتحكم الأفضل
      for (const transactionId of transactionIds) {
        try {
          // التحقق من وجود المعاملة أولاً
          const existingTransaction = await db.select()
            .from(transactions)
            .where(eq(transactions.id, transactionId))
            .limit(1);

          if (existingTransaction.length === 0) {
            errors.push(`المعاملة ${transactionId} غير موجودة`);
            continue;
          }

          // حذف المعاملة
          const deleteResult = await db.delete(transactions)
            .where(eq(transactions.id, transactionId));

          if (deleteResult.rowCount && deleteResult.rowCount > 0) {
            deletedCount++;
            console.log(`✅ تم حذف المعاملة ${transactionId} بنجاح`);
          } else {
            errors.push(`فشل في حذف المعاملة ${transactionId}`);
          }
        } catch (error) {
          console.error(`❌ خطأ في حذف المعاملة ${transactionId}:`, error);
          errors.push(`خطأ في حذف المعاملة ${transactionId}: ${error.message || 'خطأ غير معروف'}`);
        }
      }

      // تسجيل العملية في سجل التدقيق
      try {
        await logAuditAction(user.id, 'delete_transactions', 'transactions', null, {
          deletedCount,
          requestedCount: transactionIds.length,
          transactionIds,
          errors,
          adminEmail: user.email,
          timestamp: new Date().toISOString()
        });
      } catch (auditError) {
        console.error('❌ خطأ في تسجيل عملية الحذف في سجل التدقيق:', auditError);
      }

      // إعداد الاستجابة
      const response: any = {
        success: true,
        message: `تم حذف ${deletedCount} معاملة من أصل ${transactionIds.length}`,
        deletedCount,
        requestedCount: transactionIds.length
      };

      if (errors.length > 0) {
        response.errors = errors;
        response.message += `. ${errors.length} خطأ حدث أثناء العملية.`;
      }

      console.log(`🎯 [ADMIN DELETE] نتيجة العملية: حُذف ${deletedCount} من أصل ${transactionIds.length} معاملة`);
      
      // إذا لم يتم حذف أي معاملة، اعتبر العملية فاشلة
      if (deletedCount === 0) {
        return res.status(500).json({
          success: false,
          message: "فشل في حذف أي معاملة",
          errors
        });
      }

      res.json(response);

    } catch (error: any) {
      console.error("❌ خطأ عام في حذف المعاملات:", error);
      res.status(500).json({ 
        success: false,
        message: "حدث خطأ أثناء حذف المعاملات",
        error: error.message || 'خطأ خادم داخلي'
      });
    }
  });

  // إحصائيات المعاملات (للإدارة فقط)
  app.get("/api/admin/transactions/stats", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      console.log(`🔑 [ADMIN STATS] طلب إحصائيات المعاملات من المستخدم ${req.user.id}`);
      
      const user = req.user;

      // التحقق من صلاحيات الإدارة
      if (user.type !== 'admin') {
        console.log(`❌ [ADMIN STATS] المستخدم ${user.id} ليس مديراً`);
        return res.status(403).json({ 
          success: false,
          message: "صلاحية الإدارة مطلوبة لعرض إحصائيات المعاملات" 
        });
      }

      // جلب إحصائيات المعاملات
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_count,
          SUM(CASE WHEN type = 'deposit' THEN CAST(amount AS DECIMAL) ELSE 0 END) as total_deposits,
          SUM(CASE WHEN type = 'withdrawal' THEN CAST(amount AS DECIMAL) ELSE 0 END) as total_withdrawals,
          COUNT(CASE WHEN type = 'deposit' THEN 1 END) as deposit_count,
          COUNT(CASE WHEN type = 'withdrawal' THEN 1 END) as withdrawal_count,
          currency
        FROM transactions 
        WHERE created_at >= ${startOfDay.toISOString()} 
          AND created_at < ${endOfDay.toISOString()}
        GROUP BY currency
      `);

      // جلب إحصائيات شهرية
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const monthlyStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_count,
          SUM(CASE WHEN type = 'deposit' THEN CAST(amount AS DECIMAL) ELSE 0 END) as total_deposits,
          SUM(CASE WHEN type = 'withdrawal' THEN CAST(amount AS DECIMAL) ELSE 0 END) as total_withdrawals,
          currency
        FROM transactions 
        WHERE created_at >= ${startOfMonth.toISOString()}
        GROUP BY currency
      `);

      // تجميع البيانات
      const stats = {
        today: todayStats.rows.reduce((acc: any, row: any) => {
          acc[row.currency] = {
            totalCount: Number(row.total_count),
            totalDeposits: Number(row.total_deposits || 0),
            totalWithdrawals: Number(row.total_withdrawals || 0),
            depositCount: Number(row.deposit_count || 0),
            withdrawalCount: Number(row.withdrawal_count || 0)
          };
          return acc;
        }, {}),
        monthly: monthlyStats.rows.reduce((acc: any, row: any) => {
          acc[row.currency] = {
            totalCount: Number(row.total_count),
            totalDeposits: Number(row.total_deposits || 0),
            totalWithdrawals: Number(row.total_withdrawals || 0)
          };
          return acc;
        }, {})
      };

      console.log(`📊 [ADMIN STATS] تم جلب إحصائيات المعاملات بنجاح`);
      
      res.json({
        success: true,
        stats
      });

    } catch (error: any) {
      console.error("❌ خطأ في جلب إحصائيات المعاملات:", error);
      res.status(500).json({ 
        success: false,
        message: "حدث خطأ أثناء جلب إحصائيات المعاملات",
        error: error.message || 'خطأ خادم داخلي'
      });
    }
  });

  // حذف التحويلات (للإدارة فقط)
  app.delete("/api/admin/transfers/delete", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      console.log(`🔑 [ADMIN DELETE TRANSFERS] طلب حذف التحويلات من المستخدم ${req.user.id}`);
      
      const user = req.user;

      // التحقق من صلاحيات الإدارة
      if (user.type !== 'admin') {
        console.log(`❌ [ADMIN DELETE TRANSFERS] المستخدم ${user.id} ليس مديراً`);
        return res.status(403).json({ 
          success: false,
          message: "صلاحية الإدارة مطلوبة لحذف التحويلات" 
        });
      }

      const { transferIds } = req.body;
      
      // التحقق من البيانات المرسلة
      if (!transferIds || !Array.isArray(transferIds) || transferIds.length === 0) {
        return res.status(400).json({ 
          message: "يجب تحديد معرفات التحويلات المطلوب حذفها" 
        });
      }

      // حد أقصى للأمان - لا يمكن حذف أكثر من 100 تحويل في المرة الواحدة
      if (transferIds.length > 100) {
        return res.status(400).json({ 
          message: "لا يمكن حذف أكثر من 100 تحويل في المرة الواحدة لأسباب أمنية" 
        });
      }

      console.log(`🗑️ [ADMIN DELETE TRANSFERS] المشرف ${user.email} (ID: ${user.id}) يحاول حذف ${transferIds.length} تحويل`);
      
      let deletedCount = 0;
      let errors = [];

      // حذف التحويلات واحدة تلو الأخرى للتحكم الأفضل
      for (const transferId of transferIds) {
        try {
          // استخراج نوع التحويل ورقم ID من النص المركب (مثل "city-70" -> نوع: city، رقم: 70)
          let transferType = 'internal';
          let actualId;
          
          if (typeof transferId === 'string' && transferId.includes('-')) {
            const parts = transferId.split('-');
            transferType = parts[0]; // internal, city, international
            actualId = parseInt(parts[1]);
          } else {
            actualId = parseInt(transferId);
          }

          if (isNaN(actualId)) {
            errors.push(`معرف التحويل ${transferId} غير صالح`);
            continue;
          }

          // تحديد الجدول المناسب بناءً على نوع التحويل
          let table, existingTransfer, deleteResult;
          
          switch (transferType) {
            case 'internal':
              // التحقق من وجود التحويل الداخلي
              existingTransfer = await db.select()
                .from(transfers)
                .where(eq(transfers.id, actualId))
                .limit(1);

              if (existingTransfer.length === 0) {
                errors.push(`التحويل الداخلي ${transferId} غير موجود`);
                continue;
              }

              // حذف التحويل الداخلي
              deleteResult = await db.delete(transfers)
                .where(eq(transfers.id, actualId));
              break;

            case 'city':
              // التحقق من وجود تحويل المدينة
              existingTransfer = await db.select()
                .from(cityTransfers)
                .where(eq(cityTransfers.id, actualId))
                .limit(1);

              if (existingTransfer.length === 0) {
                errors.push(`تحويل المدينة ${transferId} غير موجود`);
                continue;
              }

              // حذف تحويل المدينة
              deleteResult = await db.delete(cityTransfers)
                .where(eq(cityTransfers.id, actualId));
              break;

            case 'international':
              // التحقق من وجود التحويل الدولي
              existingTransfer = await db.select()
                .from(internationalTransfers)
                .where(eq(internationalTransfers.id, actualId))
                .limit(1);

              if (existingTransfer.length === 0) {
                errors.push(`التحويل الدولي ${transferId} غير موجود`);
                continue;
              }

              // حذف التحويل الدولي
              deleteResult = await db.delete(internationalTransfers)
                .where(eq(internationalTransfers.id, actualId));
              break;

            default:
              errors.push(`نوع التحويل ${transferType} غير مدعوم`);
              continue;
          }

          if (deleteResult.rowCount && deleteResult.rowCount > 0) {
            deletedCount++;
            console.log(`✅ تم حذف التحويل ${transferId} بنجاح`);
          } else {
            errors.push(`فشل في حذف التحويل ${transferId}`);
          }
        } catch (error) {
          console.error(`❌ خطأ في حذف التحويل ${transferId}:`, error);
          errors.push(`خطأ في حذف التحويل ${transferId}: ${error.message || 'خطأ غير معروف'}`);
        }
      }

      // تسجيل العملية في سجل التدقيق
      try {
        await logAuditAction(user.id, 'delete_transfers', 'transfers', null, {
          deletedCount,
          requestedCount: transferIds.length,
          transferIds,
          errors,
          adminEmail: user.email,
          timestamp: new Date().toISOString()
        });
      } catch (auditError) {
        console.error('❌ خطأ في تسجيل عملية الحذف في سجل التدقيق:', auditError);
      }

      // إعداد الاستجابة
      const response: any = {
        success: true,
        message: `تم حذف ${deletedCount} تحويل من أصل ${transferIds.length}`,
        deletedCount,
        requestedCount: transferIds.length
      };

      if (errors.length > 0) {
        response.errors = errors;
        response.message += `. ${errors.length} خطأ حدث أثناء العملية.`;
      }

      console.log(`🎯 [ADMIN DELETE TRANSFERS] نتيجة العملية: حُذف ${deletedCount} من أصل ${transferIds.length} تحويل`);
      
      // إذا لم يتم حذف أي تحويل، اعتبر العملية فاشلة
      if (deletedCount === 0) {
        return res.status(500).json({
          success: false,
          message: "فشل في حذف أي تحويل",
          errors
        });
      }

      res.json(response);

    } catch (error: any) {
      console.error("❌ خطأ عام في حذف التحويلات:", error);
      res.status(500).json({ 
        success: false,
        message: "حدث خطأ أثناء حذف التحويلات",
        error: error.message || 'خطأ خادم داخلي'
      });
    }
  });

  return httpServer;
}
