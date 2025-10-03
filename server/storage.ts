import { users, transactions, balances, transfers, upgradeRequests, marketOffers, marketTransactions, agentTransfers, cityTransfers, officeCommissions, officeCountryCommissions, adminSettings, internationalTransfers, internationalTransfersNew, verificationRequests, userNotifications, chatRooms, chatMessages, messageLikes, privateChats, privateMessages, groupChats, groupMembers, groupMessages, agentCommissions, commissionPoolTransactions, systemCommissionRates, cityTransferCommissions, countries, cities, agentOffices, userReceiveSettings, pushSubscriptions, securityLogs, type User, type InsertUser, type Transaction, type InsertTransaction, type Balance, type InsertBalance, type Transfer, type InsertTransfer, type UpgradeRequest, type InsertUpgradeRequest, type MarketOffer, type InsertMarketOffer, type MarketTransaction, type InsertMarketTransaction, type AgentTransfer, type InsertAgentTransfer, type CityTransfer, type InsertCityTransfer, type OfficeCommission, type InsertOfficeCommission, type OfficeCountryCommission, type InsertOfficeCountryCommission, type AdminSetting, type InsertAdminSetting, type InternationalTransfer, type InsertInternationalTransfer, type InternationalTransferNew, type InsertInternationalTransferNew, type VerificationRequest, type InsertVerificationRequest, type UserNotification, type InsertUserNotification, type ChatRoom, type InsertChatRoom, type ChatMessage, type InsertChatMessage, type PrivateChat, type InsertPrivateChat, type PrivateMessage, type InsertPrivateMessage, type GroupChat, type InsertGroupChat, type GroupMember, type InsertGroupMember, type GroupMessage, type InsertGroupMessage, type AgentCommission, type InsertAgentCommission, type CommissionPoolTransaction, type InsertCommissionPoolTransaction, type InsertSystemCommissionRate, type SelectSystemCommissionRate, type CityTransferCommission, type InsertCityTransferCommission, type Country, type InsertCountry, type City, type InsertCity, type AgentOffice, type InsertAgentOffice, type UserReceiveSettings, type InsertUserReceiveSettings } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, sql, like, ilike, desc, asc, isNull, isNotNull, lt, lte, gte, inArray } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhoneOrId(phoneOrId: string): Promise<User | undefined>;
  getAdminUser(): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, data: Partial<User>): Promise<User>;
  updateUserProfile(userId: number, data: { fullName: string; email: string; phone: string | null }): Promise<User>;
  getLastAccountNumber(): Promise<string | null>;
  
  // غرف الدردشة العامة والرسائل
  getChatRooms(): Promise<ChatRoom[]>;
  getPublicChatRoom(): Promise<ChatRoom | undefined>;
  getChatMessages(roomId: number, limit?: number): Promise<(ChatMessage & { senderName: string; likesCount: number; likedByMe: boolean })[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // إعجابات الرسائل
  toggleMessageLike(messageId: number, userId: number): Promise<{ liked: boolean; count: number }>;
  getMessageLikes(messageId: number): Promise<{ userId: number; userName: string }[]>;
  
  // الدردشات الخاصة (1 إلى 1)
  getUserPrivateChats(userId: number): Promise<(PrivateChat & { otherUser: { id: number, fullName: string } })[]>;
  getPrivateChat(user1Id: number, user2Id: number): Promise<PrivateChat | undefined>;
  createPrivateChat(user1Id: number, user2Id: number): Promise<PrivateChat>;
  getPrivateMessages(chatId: number, limit?: number): Promise<(PrivateMessage & { senderName: string })[]>;
  createPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage>;
  markMessagesAsRead(chatId: number, userId: number): Promise<void>;
  getUnreadMessagesCount(userId: number): Promise<{chatId: number, count: number}[]>;
  
  // محادثات المجموعات (Group Chats)
  createGroupChat(groupChat: InsertGroupChat): Promise<GroupChat>;
  getGroupChat(groupId: number): Promise<GroupChat | undefined>;
  getUserGroupChats(userId: number): Promise<GroupChat[]>;
  getAllPublicGroupChats(): Promise<GroupChat[]>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<(GroupMember & { fullName: string })[]>;
  isGroupAdmin(groupId: number, userId: number): Promise<boolean>;
  isGroupMember(groupId: number, userId: number): Promise<boolean>;
  createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage>;
  getGroupMessages(groupId: number, limit?: number): Promise<(GroupMessage & { senderName: string })[]>;
  
  // إدارة أعضاء المجموعات
  getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined>;
  getUserRoleInGroup(groupId: number, userId: number): Promise<string | null>;
  setMemberMuteUntil(groupId: number, userId: number, until: Date | null): Promise<boolean>;
  removeGroupMember(groupId: number, userId: number): Promise<boolean>;
  deleteGroup(groupId: number): Promise<boolean>;
  isUserMuted(groupId: number, userId: number): Promise<boolean>;
  isUserBanned(groupId: number, userId: number): Promise<boolean>;
  banGroupMember(groupId: number, userId: number, bannedBy: number, reason?: string): Promise<boolean>;
  unbanGroupMember(groupId: number, userId: number): Promise<boolean>;
  
  // وظائف إدارة الإشعارات
  getUserNotifications(userId: number): Promise<UserNotification[]>;
  createUserNotification(notification: InsertUserNotification): Promise<UserNotification>;
  markNotificationAsRead(notificationId: number): Promise<UserNotification>;
  markAllUserNotificationsAsRead(userId: number): Promise<void>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserBalances(userId: number): Promise<Balance[]>;
  getUserBalance(userId: number, currency: string): Promise<Balance | undefined>;
  createOrUpdateBalance(balance: InsertBalance): Promise<Balance>;
  setUserBalance(userId: number, currency: string, amount: string): Promise<Balance>;
  transferMoney(senderId: number, receiverId: number, amount: number, commission: number, currency: string, note?: string): Promise<Transfer>;
  createInternalTransfer(transfer: InsertTransfer & { referenceNumber?: string }): Promise<Transfer>;
  updateUserBalance(userId: number, currency: string, amount: number): Promise<Balance>;
  getUserTransfers(userId: number): Promise<Transfer[]>;
  getPendingUpgradeRequest(userId: number): Promise<UpgradeRequest | undefined>;
  getUserUpgradeRequests(userId: number): Promise<UpgradeRequest[]>;
  getAllUpgradeRequests(status?: string): Promise<UpgradeRequest[]>;
  createUpgradeRequest(request: InsertUpgradeRequest): Promise<UpgradeRequest>;
  updateRequestStatus(requestId: number, status: 'approved' | 'rejected', notes?: string): Promise<UpgradeRequest>;
  createMarketOffer(offer: InsertMarketOffer): Promise<MarketOffer>;
  getMarketOffers(filters?: { status?: string; offerType?: string; fromCurrency?: string; toCurrency?: string }): Promise<MarketOffer[]>;
  getUserMarketOffers(userId: number): Promise<MarketOffer[]>;
  getMarketOfferById(id: number): Promise<MarketOffer | undefined>;
  updateMarketOfferStatus(id: number, status: string, availableAmount?: number): Promise<MarketOffer>;
  expireMarketOffers(): Promise<number>;
  createMarketTransaction(transaction: InsertMarketTransaction): Promise<MarketTransaction>;
  getUserMarketTransactions(userId: number): Promise<MarketTransaction[]>;
  createAgentTransfer(transfer: InsertAgentTransfer): Promise<AgentTransfer>;
  getAgentTransfers(agentId: number): Promise<AgentTransfer[]>;
  getAgentTransferByCode(code: string): Promise<AgentTransfer | undefined>;
  getAgentTransferByReceiverCode(receiverCode: string): Promise<AgentTransfer | undefined>;
  updateAgentTransferStatus(id: number, status: string, receiverId?: number): Promise<AgentTransfer>;
  
  // دوال إدارة الحوالات بين المدن
  createCityTransfer(transfer: InsertCityTransfer): Promise<CityTransfer>;
  getCityTransfers(agentId: number): Promise<CityTransfer[]>;
  getCityTransferByCode(code: string): Promise<CityTransfer | undefined>;
  updateCityTransferStatus(id: number, status: string): Promise<CityTransfer>;
  
  // دوال إدارة الحوالات الدولية
  createInternationalTransfer(transfer: InsertInternationalTransfer): Promise<InternationalTransfer>;
  getInternationalTransfers(agentId: number): Promise<InternationalTransfer[]>;
  getInternationalTransferByCode(code: string): Promise<InternationalTransfer | undefined>;
  updateInternationalTransferStatus(id: number, status: string): Promise<InternationalTransfer>;
  
  // دوال إدارة الحوالات الدولية الجديدة - نظام التجميد والخصم
  createInternationalTransferNew(transfer: InsertInternationalTransferNew): Promise<InternationalTransferNew>;
  getInternationalTransferNewByCode(code: string): Promise<(InternationalTransferNew & { senderName: string }) | undefined>;
  confirmInternationalTransferNew(transferCode: string, receiverId: number): Promise<InternationalTransferNew>;
  cancelInternationalTransferNew(transferCode: string): Promise<{ success: boolean; transfer?: InternationalTransferNew; message?: string }>;
  calculateInternationalTransferCosts(amount: number, currencyCode: string): Promise<{ commissionSystem: number; commissionRecipient: number; amountPending: number }>;
  generateInternationalTransferCode(): Promise<string>;
  
  // دوال إدارة عمولات المكاتب حسب المدن
  getOfficeCommissions(officeId: number): Promise<OfficeCommission[]>;
  getOfficeCommissionByCity(officeId: number, city: string): Promise<OfficeCommission | undefined>;
  createOrUpdateOfficeCommission(commission: InsertOfficeCommission): Promise<OfficeCommission>;
  deleteOfficeCommission(id: number): Promise<void>;
  
  // دوال إدارة عمولات المكاتب حسب الدول
  getOfficeCountryCommissions(officeId: number): Promise<OfficeCountryCommission[]>;
  getOfficeCommissionByCountry(officeId: number, country: string): Promise<OfficeCountryCommission | undefined>;
  createOrUpdateOfficeCountryCommission(commission: InsertOfficeCountryCommission): Promise<OfficeCountryCommission>;
  deleteOfficeCountryCommission(id: number): Promise<void>;
  
  // دوال إدارة إعدادات النظام
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  getAdminSettings(): Promise<AdminSetting[]>;
  createOrUpdateAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
  deleteAdminSetting(key: string): Promise<void>;
  
  // دوال إدارة طلبات توثيق الحسابات
  getUserVerificationRequest(userId: number): Promise<VerificationRequest | undefined>;
  getAllVerificationRequests(status?: string): Promise<VerificationRequest[]>;
  createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest>;
  updateVerificationRequestStatus(requestId: number, status: 'approved' | 'rejected', notes?: string): Promise<VerificationRequest>;
  
  // Agent commission methods
  getAgentCommissions(agentId: number): Promise<AgentCommission[]>;
  getAgentCommissionByCurrency(agentId: number, currencyCode: string): Promise<AgentCommission | undefined>;
  createOrUpdateAgentCommission(commission: InsertAgentCommission): Promise<AgentCommission>;
  deleteAgentCommission(id: number): Promise<void>;

  // Commission pool methods
  getCommissionPoolBalance(currencyCode?: string): Promise<{ [currency: string]: string }>;
  getCommissionPoolTransactions(filters?: { currencyCode?: string; sourceType?: string; limit?: number; offset?: number }): Promise<CommissionPoolTransaction[]>;
  addCommissionPoolTransaction(transaction: InsertCommissionPoolTransaction): Promise<CommissionPoolTransaction>;
  withdrawFromCommissionPool(currencyCode: string, amount: string, description: string): Promise<CommissionPoolTransaction>;

  // نسب العمولة الافتراضية للنظام
  createSystemCommissionRate(rate: InsertSystemCommissionRate): Promise<SelectSystemCommissionRate>;
  getSystemCommissionRates(): Promise<SelectSystemCommissionRate[]>;
  getSystemCommissionRate(transferType: string, currency: string): Promise<SelectSystemCommissionRate | undefined>;
  updateSystemCommissionRate(id: number, rate: Partial<InsertSystemCommissionRate>): Promise<SelectSystemCommissionRate | null>;
  deleteSystemCommissionRate(id: number): Promise<void>;
  
  // External transfer upgrade requests
  createExternalTransferRequest(data: any): Promise<any>;
  getExternalTransferRequests(): Promise<any[]>;
  getExternalTransferRequestsByUser(userId: number): Promise<any[]>;
  updateExternalTransferRequest(id: number, data: any): Promise<any>;
  getUserExternalTransferLimits(userId: number): Promise<any>;
  getUserDailyTransferAmount(userId: number, currency: string): Promise<number>;
  getUserMonthlyTransferAmount(userId: number, currency: string): Promise<number>;
  updateUserExternalTransferSettings(userId: number, settings: any): Promise<any>;
  
  sessionStore: any; // Using any to avoid type errors with SessionStore

  // وظائف إدارة الدول والمدن
  getCountries(): Promise<Country[]>;
  getCountryById(id: number): Promise<Country | undefined>;
  getCities(countryId?: number, search?: string): Promise<City[]>;
  getCityById(id: number): Promise<City | undefined>;
  
  // وظائف السجلات الأمنية
  addSecurityLog(logData: any): Promise<any>;
  getSecurityLogs(filters?: { limit?: number; offset?: number; startDate?: Date; endDate?: Date }): Promise<any[]>;
  deleteSecurityLog(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any to avoid type errors with SessionStore

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhoneOrId(phoneOrId: string): Promise<User | undefined> {
    // البحث بواسطة رقم الحساب أولاً
    const [userByAccountNumber] = await db.select().from(users).where(eq(users.accountNumber, phoneOrId));
    if (userByAccountNumber) return userByAccountNumber;
    
    // البحث بواسطة رقم الهاتف
    const [userByPhone] = await db.select().from(users).where(eq(users.phone, phoneOrId));
    if (userByPhone) return userByPhone;
    
    // ثم نحاول البحث بواسطة المعرف إذا كان رقمًا
    if (!isNaN(Number(phoneOrId))) {
      const [userById] = await db.select().from(users).where(eq(users.id, Number(phoneOrId)));
      return userById;
    }
    
    return undefined;
  }
  
  async getAdminUser(): Promise<User | undefined> {
    const [admin] = await db.select().from(users).where(eq(users.type, 'admin'));
    return admin;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(userId: number, data: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserProfile(userId: number, data: { fullName: string; email: string; phone: string | null }): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getLastAccountNumber(prefix: string = '33003'): Promise<string | null> {
    const result = await db
      .select({ accountNumber: users.accountNumber })
      .from(users)
      .where(like(users.accountNumber, `${prefix}%`))
      .orderBy(desc(users.accountNumber))
      .limit(1);
    
    return result.length > 0 ? result[0].accountNumber : null;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    // إذا لم يكن هناك رقم مرجعي، أنشئ واحداً
    if (!transaction.referenceNumber) {
      // إنشاء رقم مرجعي فريد بناءً على الوقت ومعرف عشوائي
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      transaction.referenceNumber = `REF-${timestamp}-${randomId}`;
    }

    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }
  
  async getUserBalances(userId: number): Promise<Balance[]> {
    return await db
      .select()
      .from(balances)
      .where(eq(balances.userId, userId));
  }
  
  async getUserBalance(userId: number, currency: string): Promise<Balance | undefined> {
    const [balance] = await db
      .select()
      .from(balances)
      .where(
        and(
          eq(balances.userId, userId),
          eq(balances.currency, currency)
        )
      );
    return balance;
  }
  
  async createOrUpdateBalance(balance: InsertBalance): Promise<Balance> {
    console.log("=== بداية تحديث الرصيد ===");
    console.log("بيانات الرصيد المستلمة:", balance);
    
    // Check if balance exists
    const existingBalance = await this.getUserBalance(balance.userId, balance.currency);
    console.log("الرصيد الحالي:", existingBalance);
    
    if (existingBalance) {
      // تحديث الرصيد الموجود عن طريق إضافة المبلغ الجديد إلى الرصيد الحالي
      const currentAmount = parseFloat(existingBalance.amount);
      const amountToAdd = parseFloat(balance.amount || "0");
      const newAmount = (currentAmount + amountToAdd).toString();
      
      console.log(`حساب الرصيد الجديد: ${currentAmount} + ${amountToAdd} = ${newAmount}`);
      
      const [updatedBalance] = await db
        .update(balances)
        .set({ 
          amount: newAmount
        })
        .where(
          and(
            eq(balances.userId, balance.userId),
            eq(balances.currency, balance.currency)
          )
        )
        .returning();
        
      console.log("الرصيد بعد التحديث:", updatedBalance);
      return updatedBalance;
    } else {
      // Create new balance
      console.log("إنشاء رصيد جديد لعدم وجود رصيد سابق");
      const [newBalance] = await db
        .insert(balances)
        .values(balance)
        .returning();
        
      console.log("الرصيد الجديد:", newBalance);
      return newBalance;
    }
  }
  
  async setUserBalance(userId: number, currency: string, amount: string): Promise<Balance> {
    console.log(`=== تعيين الرصيد مباشرة ===`);
    console.log(`المستخدم: ${userId}, العملة: ${currency}, المبلغ: ${amount}`);
    
    // التحقق من صحة المبلغ وإصلاح NaN
    const parsedAmount = parseFloat(amount);
    const validAmount = isNaN(parsedAmount) ? 0 : parsedAmount;
    const finalAmount = validAmount.toString();
    
    console.log(`المبلغ بعد التحقق: ${finalAmount}`);
    
    try {
      // استخدام raw SQL للتعامل مع UPSERT بشكل صحيح
      const result = await db.execute(sql`
        INSERT INTO user_balances (user_id, currency, amount)
        VALUES (${userId}, ${currency}, ${finalAmount})
        ON CONFLICT (user_id, currency)
        DO UPDATE SET amount = ${finalAmount}
        RETURNING *
      `);
      
      const balance = result.rows[0] as Balance;
      console.log("تم تحديث/إنشاء الرصيد:", balance);
      return balance;
    } catch (error) {
      console.error(`خطأ في تعيين الرصيد للمستخدم ${userId} والعملة ${currency}:`, error);
      // في حالة الخطأ، نحاول التحديث مباشرة
      const existingBalance = await this.getUserBalance(userId, currency);
      if (existingBalance) {
        const [updatedBalance] = await db
          .update(balances)
          .set({ amount: finalAmount })
          .where(
            and(
              eq(balances.userId, userId),
              eq(balances.currency, currency)
            )
          )
          .returning();
        return updatedBalance;
      }
      throw error;
    }
  }
  
  async transferMoney(senderId: number, receiverId: number, amount: number, commission: number, currency: string, note?: string): Promise<Transfer> {
    // Create transfer record
    const [transfer] = await db
      .insert(transfers)
      .values({
        senderId,
        receiverId,
        currency,
        amount: amount.toString(),
        commission: commission.toString(),
        note: note || '',
        status: 'completed',
        date: new Date()
      })
      .returning();
    
    // Update sender's balance (subtract amount + commission)
    const senderBalance = await this.getUserBalance(senderId, currency);
    const total = amount + commission;
    
    if (senderBalance) {
      const newAmount = Number(senderBalance.amount) - total;
      await this.createOrUpdateBalance({
        userId: senderId,
        currency,
        amount: newAmount.toString()
      });
    }
    
    // Update receiver's balance (add amount only)
    const receiverBalance = await this.getUserBalance(receiverId, currency);
    if (receiverBalance) {
      const newAmount = Number(receiverBalance.amount) + amount;
      await this.createOrUpdateBalance({
        userId: receiverId,
        currency,
        amount: newAmount.toString()
      });
    } else {
      // Create receiver balance if it doesn't exist
      await this.createOrUpdateBalance({
        userId: receiverId,
        currency,
        amount: amount.toString()
      });
    }
    
    // Add commission to commission pool after referral reward deduction
    if (commission > 0) {
      const senderUser = await this.getUser(senderId);
      
      // توزيع مكافأة الإحالة الثابتة أولاً وحساب صافي العمولة
      const { allocateFixedReferralReward } = await import('./referral-system');
      const operationType = currency === 'LYD' ? 'transfer_lyd' : 'transfer_usd';
      const referralResult = await allocateFixedReferralReward(
        transfer.id,
        operationType,
        commission,
        currency,
        senderId // المستخدم المُحال هو المرسل
      );

      // إضافة صافي العمولة فقط (بعد خصم مكافأة الإحالة) إلى مجمع العمولات
      const netCommission = referralResult.netSystemCommission;
      if (netCommission > 0) {
        await this.addCommissionPoolTransaction({
          sourceType: 'user',
          sourceId: senderId,
          sourceName: senderUser?.fullName || 'مستخدم',
          currencyCode: currency,
          amount: netCommission.toString(),
          transactionType: 'credit',
          relatedTransactionId: transfer.id,
          description: `عمولة تحويل داخلي (صافي بعد المكافآت) من ${senderUser?.fullName || 'مستخدم'}`
        });
        
        console.log(`💰 إضافة صافي عمولة ${netCommission} ${currency} إلى مجمع العمولات (بعد خصم مكافأة إحالة ${commission - netCommission})`);
      }
    }
    
    return transfer;
  }
  
  // إنشاء تحويل داخلي
  async createInternalTransfer(transfer: InsertTransfer & { referenceNumber?: string }): Promise<Transfer> {
    const transferData = {
      senderId: transfer.senderId,
      receiverId: transfer.receiverId,
      amount: transfer.amount,
      commission: transfer.commission || "0",
      currency: transfer.currency || "LYD",
      referenceNumber: transfer.referenceNumber,
      note: transfer.note
    };
    
    const [newTransfer] = await db
      .insert(transfers)
      .values(transferData)
      .returning();
    return newTransfer;
  }

  // تحديث رصيد المستخدم (إضافة أو طرح)
  async updateUserBalance(userId: number, currency: string, amount: number): Promise<Balance> {
    // البحث عن الرصيد الحالي
    const existingBalance = await this.getUserBalance(userId, currency);
    
    if (existingBalance) {
      // تحديث الرصيد الموجود
      const currentAmount = parseFloat(existingBalance.amount);
      const newAmount = currentAmount + amount;
      
      const [updatedBalance] = await db
        .update(balances)
        .set({ amount: newAmount.toString() })
        .where(
          and(
            eq(balances.userId, userId),
            eq(balances.currency, currency)
          )
        )
        .returning();
      
      return updatedBalance;
    } else {
      // إنشاء رصيد جديد
      const [newBalance] = await db
        .insert(balances)
        .values({
          userId,
          currency,
          amount: Math.max(0, amount).toString()
        })
        .returning();
      
      return newBalance;
    }
  }

  async getUserTransfers(userId: number): Promise<Transfer[]> {
    return await db
      .select()
      .from(transfers)
      .where(
        or(
          eq(transfers.senderId, userId),
          eq(transfers.receiverId, userId)
        )
      )
      .orderBy(desc(transfers.createdAt));
  }
  
  // طلبات الترقية
  async getPendingUpgradeRequest(userId: number): Promise<UpgradeRequest | undefined> {
    const [request] = await db
      .select()
      .from(upgradeRequests)
      .where(
        and(
          eq(upgradeRequests.userId, userId),
          eq(upgradeRequests.status, 'pending')
        )
      );
    return request;
  }
  
  async getUserUpgradeRequests(userId: number): Promise<UpgradeRequest[]> {
    return await db
      .select()
      .from(upgradeRequests)
      .where(eq(upgradeRequests.userId, userId))
      .orderBy(desc(upgradeRequests.createdAt));
  }
  
  async getAllUpgradeRequests(status?: string): Promise<UpgradeRequest[]> {
    try {
      // استعلام مباشر لجلب البيانات
      let query = `
        SELECT 
          ur.id, ur.user_id, ur.request_type, ur.full_name, ur.phone, ur.city,
          ur.commission_rate, ur.message, ur.requested_limits, ur.documents,
          ur.status, ur.created_at, ur.decided_at, ur.decided_by, ur.review_notes,
          u.email as user_email, u.full_name as user_full_name
        FROM upgrade_requests ur
        LEFT JOIN users u ON ur.user_id = u.id
      `;
      
      const params = [];
      if (status) {
        query += ` WHERE ur.status = $1`;
        params.push(status);
      }
      
      query += ` ORDER BY ur.created_at DESC`;
      
      const result = await pool.query(query, params);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        requestType: row.request_type,
        fullName: row.full_name || row.user_full_name || 'غير محدد',
        phone: row.phone || 'غير محدد',
        city: row.city || 'غير محدد',
        commissionRate: row.commission_rate ? parseFloat(row.commission_rate) : null,
        message: row.message,
        requestedLimits: row.requested_limits,
        documents: row.documents,
        status: row.status,
        createdAt: row.created_at,
        decidedAt: row.decided_at,
        decidedBy: row.decided_by,
        reviewNotes: row.review_notes,
        userEmail: row.user_email || 'غير محدد'
      }));
    } catch (error) {
      console.error('Error fetching upgrade requests:', error);
      return [];
    }
  }
  
  async createUpgradeRequest(request: InsertUpgradeRequest): Promise<UpgradeRequest> {
    const [newRequest] = await db
      .insert(upgradeRequests)
      .values(request)
      .returning();
    return newRequest;
  }
  
  async updateRequestStatus(requestId: number, status: 'approved' | 'rejected', notes?: string): Promise<UpgradeRequest> {
    const updateData: any = {
      status,
      reviewedAt: new Date(),
    };
    
    if (notes) {
      updateData.reviewNotes = notes;
    }
    
    const [updatedRequest] = await db
      .update(upgradeRequests)
      .set(updateData)
      .where(eq(upgradeRequests.id, requestId))
      .returning();
    
    // إذا تمت الموافقة على الطلب، نقوم بترقية حساب المستخدم
    if (status === 'approved') {
      const request = updatedRequest;
      
      // تحديد التحديثات بناءً على نوع الطلب
      const updateData: any = {};
      
      if (request.requestType === 'agent_upgrade') {
        // طلب ترقية لمكتب صرافة (التحويل بين المدن فقط)
        updateData.type = 'agent';
        updateData.city = request.city;
        updateData.commissionRate = request.commissionRate;
        // عدم تفعيل التحويل الخارجي - يحتاج طلب منفصل
      } else if (request.requestType === 'external_transfer') {
        // طلب التحويل الخارجي المنفصل
        updateData.extTransferEnabled = true;
        if (request.requestedLimits) {
          const limits = request.requestedLimits as any;
          if (limits.daily) updateData.extDailyLimit = limits.daily.toString();
          if (limits.monthly) updateData.extMonthlyLimit = limits.monthly.toString();
          if (limits.currencies) updateData.extAllowedCurrencies = limits.currencies;
          if (limits.countries) updateData.extAllowedCountries = limits.countries;
        }
      }
      
      await this.updateUser(request.userId, updateData);
      
      // إنشاء المكتب فقط لطلبات ترقية المكتب، وليس للتحويل الخارجي
      if (request.requestType === 'agent_upgrade') {
        const user = await this.getUser(request.userId);
        if (user) {
        // التحقق من عدم وجود مكتب مسبقاً - يجب أن يكون للوكيل مكتب واحد فقط
        const existingOffices = await db.select()
          .from(agentOffices)
          .where(and(
            eq(agentOffices.agentId, request.userId),
            eq(agentOffices.isActive, true)
          ));
        
        if (existingOffices.length === 0) {
          // إنشاء رمز مكتب فريد تلقائياً
          const officeCode = `AGT${user.id.toString().padStart(4, '0')}`;
          
          try {
            // الحصول على الدولة - استخدام دولة المستخدم أو الطلب
            let countryCode = 'LY'; // افتراضي ليبيا
            let cityName = request.city || user.cityName || user.city || 'غير محدد';
            
            // أولاً: محاولة الحصول على كود الدولة من بيانات الطلب
            if (request.countryId) {
              const country = await db.select()
                .from(countries)
                .where(eq(countries.id, request.countryId))
                .limit(1);
              if (country.length > 0) {
                countryCode = country[0].code;
              }
            }
            // ثانياً: إذا لم يتم العثور على الدولة في الطلب، نستخدم دولة المستخدم
            else if (user.countryId) {
              const country = await db.select()
                .from(countries)
                .where(eq(countries.id, user.countryId))
                .limit(1);
              if (country.length > 0) {
                countryCode = country[0].code;
              }
            }
            
            // إذا كان المستخدم له مدينة مخصصة، استخدمها
            if (user.cityName) {
              cityName = user.cityName;
            }
            
            // للطلبات الخارجية، استخدام المدينة المدخلة يدوياً إذا كانت متوفرة
            if (request.requestType === 'external_transfer' && request.cityNameManual) {
              cityName = request.cityNameManual;
            }
            
            // إنشاء مكتب تلقائياً للمستخدم المقبول
            const newOffice = await this.createAgentOffice({
              agentId: request.userId,
              countryCode: countryCode,
              city: cityName,
              officeCode,
              officeName: user.officeName || `مكتب ${user.fullName}${countryCode !== 'LY' ? ` - ${countryCode}` : ''}`,
              contactInfo: user.phone || request.phone || 'غير محدد',
              address: 'غير محدد',
              isActive: true
            });
            
            console.log(`✅ تم إنشاء مكتب تلقائياً للوكيل ${request.userId} برمز ${officeCode} في ${cityName} - ${countryCode} (نوع الطلب: ${request.requestType})`);
            
            // إنشاء إعدادات عمولة
            const commissionRate = request.commissionRate ? parseFloat(request.commissionRate) : 1.5;
            
            // إعدادات العمولة الأساسية
            const currencies = ['USD', 'LYD'];
            
            // إضافة عملة الدولة إذا كانت مختلفة
            if (countryCode === 'TR') currencies.push('TRY');
            else if (countryCode === 'EG') currencies.push('EGP');
            else if (countryCode === 'TN') currencies.push('TND');
            else if (countryCode === 'AE') currencies.push('AED');
            else if (countryCode === 'GB') currencies.push('GBP');
            else if (['FR', 'DE', 'IT', 'ES'].includes(countryCode)) currencies.push('EUR');
            
            // إنشاء إعدادات العمولة لكل عملة
            for (const currency of currencies) {
              try {
                await this.createOrUpdateAgentCommission({
                  agentId: request.userId,
                  currencyCode: currency,
                  type: 'percentage',
                  value: commissionRate.toString()
                });
              } catch (commError) {
                console.error(`⚠️ خطأ في إنشاء عمولة ${currency} للوكيل ${request.userId}:`, commError);
              }
            }
            
            console.log(`✅ تم إنشاء إعدادات العمولة للوكيل ${request.userId} بنسبة ${commissionRate}% للعملات: ${currencies.join(', ')}`);
            
          } catch (error) {
            console.error(`❌ خطأ في إنشاء المكتب التلقائي للوكيل ${request.userId}:`, error);
          }
        } else {
          console.log(`ℹ️ المكتب موجود مسبقاً للوكيل ${request.userId}, تم تحديث بيانات المستخدم فقط`);
        }
        }
      }
      
      // إرسال إشعار للمستخدم بالموافقة على طلب الترقية
      let notificationTitle = "تمت الموافقة على الطلب";
      let notificationBody = "";
      
      if (request.requestType === 'agent_upgrade') {
        notificationTitle = "تمت الموافقة على طلب الترقية";
        notificationBody = "تهانينا! تمت الموافقة على طلب ترقية حسابك إلى مكتب صرافة وتم إنشاء مكتبك تلقائياً. يمكنك الآن استخدام ميزات مكاتب الصرافة والتحويل بين المدن.";
      } else if (request.requestType === 'external_transfer') {
        notificationTitle = "تمت الموافقة على طلب التحويل الدولي";
        notificationBody = "تهانينا! تمت الموافقة على طلب التحويل الدولي. يمكنك الآن إجراء التحويلات الدولية ضمن الحدود المعتمدة.";
      }
      
      await this.createUserNotification({
        userId: request.userId,
        title: notificationTitle,
        body: notificationBody,
        type: "success",
        isRead: false
      });
    } else if (status === 'rejected') {
      // إرسال إشعار للمستخدم برفض طلب الترقية
      await this.createUserNotification({
        userId: updatedRequest.userId,
        title: "تم رفض طلب الترقية",
        body: `تم رفض طلب ترقية حسابك. ${notes ? 'السبب: ' + notes : ''}`,
        type: "error",
        isRead: false
      });
    }
    
    return updatedRequest;
  }
  
  // سوق العملات
  async createMarketOffer(offer: InsertMarketOffer): Promise<MarketOffer> {
    const [newOffer] = await db
      .insert(marketOffers)
      .values(offer)
      .returning();
    return newOffer;
  }
  
  async getMarketOffers(filters?: { status?: string; side?: string; baseCurrency?: string; quoteCurrency?: string }): Promise<MarketOffer[]> {
    let query = db.select().from(marketOffers);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status) {
        conditions.push(eq(marketOffers.status, filters.status));
      }
      
      if (filters.side) {
        conditions.push(eq(marketOffers.side, filters.side));
      }
      
      if (filters.baseCurrency) {
        conditions.push(eq(marketOffers.baseCurrency, filters.baseCurrency));
      }
      
      if (filters.quoteCurrency) {
        conditions.push(eq(marketOffers.quoteCurrency, filters.quoteCurrency));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(marketOffers.createdAt));
  }
  
  async getUserMarketOffers(userId: number): Promise<MarketOffer[]> {
    return await db
      .select()
      .from(marketOffers)
      .where(
        and(
          eq(marketOffers.userId, userId),
          eq(marketOffers.status, 'open')
        )
      )
      .orderBy(desc(marketOffers.createdAt));
  }
  
  async getMarketOfferById(id: number): Promise<MarketOffer | undefined> {
    const [offer] = await db
      .select()
      .from(marketOffers)
      .where(eq(marketOffers.id, id));
    return offer;
  }
  
  async updateMarketOfferStatus(id: number, status: string, remainingAmount?: number): Promise<MarketOffer> {
    const updateData: any = { status };
    
    if (remainingAmount !== undefined) {
      updateData.remainingAmount = remainingAmount.toString();
    }
    
    const [updatedOffer] = await db
      .update(marketOffers)
      .set(updateData)
      .where(eq(marketOffers.id, id))
      .returning();
    
    return updatedOffer;
  }

  // دالة تنظيف العروض المنتهية الصلاحية مع إرجاع الأموال
  async expireMarketOffers(): Promise<number> {
    const now = new Date();
    
    // البحث عن العروض المنتهية الصلاحية
    const expiredOffers = await db
      .select()
      .from(marketOffers)
      .where(
        and(
          eq(marketOffers.status, 'open'),
          lt(marketOffers.expiresAt, now)
        )
      );
    
    if (expiredOffers.length === 0) {
      return 0;
    }

    console.log(`🕒 معالجة ${expiredOffers.length} عرض منتهي الصلاحية...`);
    
    // معالجة كل عرض منتهي الصلاحية
    for (const offer of expiredOffers) {
      try {
        // إرجاع المبلغ المتبقي للمستخدم (عروض البيع فقط)
        if (offer.side === 'sell' && Number(offer.remainingAmount) > 0) {
          const remainingAmount = Number(offer.remainingAmount);
          
          console.log(`💰 إرجاع ${remainingAmount} ${offer.baseCurrency} للمستخدم ${offer.userId} - عرض منتهي الصلاحية ${offer.id}`);
          
          // إضافة المبلغ لرصيد المستخدم
          await this.updateUserBalance(offer.userId, offer.baseCurrency, remainingAmount);
          
          // تسجيل معاملة الإرجاع
          await this.createTransaction({
            userId: offer.userId,
            type: "exchange",
            amount: remainingAmount.toString(),
            currency: offer.baseCurrency,
            description: `إرجاع ${remainingAmount} ${offer.baseCurrency} من عرض منتهي الصلاحية - الرقم المرجعي: ${offer.id}`,
            referenceNumber: `EXPIRED-${offer.id}`
          });
          
          console.log(`✅ تم إرجاع ${remainingAmount} ${offer.baseCurrency} للمستخدم ${offer.userId}`);
        }
        
        // تحديث حالة العرض إلى منتهي الصلاحية
        await db
          .update(marketOffers)
          .set({ status: 'cancelled' })
          .where(eq(marketOffers.id, offer.id));
          
      } catch (error) {
        console.error(`❌ خطأ في معالجة العرض المنتهي الصلاحية ${offer.id}:`, error);
      }
    }
    
    console.log(`✅ تم معالجة ${expiredOffers.length} عرض منتهي الصلاحية بنجاح`);
    return expiredOffers.length;
  }

  async createMarketTransaction(transaction: InsertMarketTransaction): Promise<MarketTransaction> {
    const [newTransaction] = await db
      .insert(marketTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }
  
  async getUserMarketTransactions(userId: number): Promise<MarketTransaction[]> {
    return await db
      .select()
      .from(marketTransactions)
      .where(
        eq(marketTransactions.buyerId, userId)
      )
      .orderBy(desc(marketTransactions.createdAt));
  }
  
  // حوالات مكاتب الصرافة
  async createAgentTransfer(transfer: InsertAgentTransfer): Promise<AgentTransfer> {
    const [newTransfer] = await db
      .insert(agentTransfers)
      .values(transfer)
      .returning();
    return newTransfer;
  }
  
  async getAgentTransfers(agentId: number): Promise<AgentTransfer[]> {
    try {
      console.log('بدء جلب التحويلات للوكيل:', agentId);
      
      // استخدام pool مباشرة بدلاً من Drizzle ORM لتجنب خطأ orderSelectedFields
      // تصفية السجلات المخفية للمستخدم الحالي
      const query = `
        SELECT * FROM agent_transfers 
        WHERE (sender_id = $1 OR destination_agent_id = $1)
          AND id NOT IN (
            SELECT transfer_id FROM hidden_transfers WHERE user_id = $1
          )
        ORDER BY created_at DESC
      `;
      
      console.log('تنفيذ الاستعلام:', query, 'المعاملات:', [agentId]);
      
      const result = await pool.query(query, [agentId]);
      
      console.log('تم جلب عدد التحويلات:', result.rows.length);
      console.log('عينة من البيانات المُستلمة:', result.rows[0] || 'لا توجد نتائج');
      
      // تحويل البيانات من snake_case إلى camelCase للتوافق مع الواجهة الأمامية
      const transfers = result.rows.map((row: any) => ({
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        agentId: row.agent_id,
        destinationAgentId: row.destination_agent_id,
        amount: row.amount,
        commission: row.commission,
        currency: row.currency,
        transferCode: row.transfer_code, // تحويل snake_case إلى camelCase
        receiverCode: row.receiver_code, // تحويل snake_case إلى camelCase
        note: row.note,
        status: row.status,
        type: row.type,
        country: row.country,
        city: row.city,
        recipientName: row.recipient_name,
        recipientPhone: row.recipient_phone,
        recipientId: row.recipient_id,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        amountOriginal: row.amount_original,
        commissionSystem: row.commission_system,
        commissionRecipient: row.commission_recipient,
        amountPending: row.amount_pending
      }));
      
      console.log('تحويل البيانات إلى camelCase، عدد التحويلات:', transfers.length);
      console.log('أنواع التحويلات الموجودة:', transfers.map(t => ({ id: t.id, type: t.type, status: t.status, currency: t.currency })));
      
      return transfers;
    } catch (error) {
      console.error('خطأ مفصل في جلب التحويلات:', error);
      throw error;
    }
  }
  
  async getAgentTransferByCode(code: string): Promise<AgentTransfer | undefined> {
    const [transfer] = await db
      .select()
      .from(agentTransfers)
      .where(eq(agentTransfers.transferCode, code));
    return transfer;
  }

  async getAgentTransferByReceiverCode(receiverCode: string): Promise<AgentTransfer | undefined> {
    const [transfer] = await db
      .select()
      .from(agentTransfers)
      .where(eq(agentTransfers.receiverCode, receiverCode));
    return transfer;
  }

  
  async updateAgentTransferStatus(id: number, status: string, receiverId?: number): Promise<AgentTransfer> {
    const updateData: any = { status };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    if (receiverId) {
      updateData.receiverId = receiverId;
    }
    
    const [updatedTransfer] = await db
      .update(agentTransfers)
      .set(updateData)
      .where(eq(agentTransfers.id, id))
      .returning();
    
    return updatedTransfer;
  }

  // تنفيذ دوال إدارة الحوالات بين المدن
  
  // إنشاء حوالة بين مدينتين
  async createCityTransfer(transfer: InsertCityTransfer): Promise<CityTransfer> {
    const [result] = await db
      .insert(cityTransfers)
      .values(transfer)
      .returning();
    
    return result;
  }
  
  // الحصول على جميع الحوالات المتعلقة بمكتب صرافة معين (إما كمرسل أو مستلم)
  async getCityTransfers(agentId: number): Promise<CityTransfer[]> {
    const result = await db
      .select()
      .from(cityTransfers)
      .where(
        or(
          eq(cityTransfers.senderId, agentId),
          eq(cityTransfers.receiverOfficeId, agentId)
        )
      )
      .orderBy(desc(cityTransfers.createdAt));
    
    return result;
  }
  
  // البحث عن حوالة بالكود
  async getCityTransferByCode(code: string): Promise<CityTransfer | undefined> {
    const result = await db
      .select()
      .from(cityTransfers)
      .where(eq(cityTransfers.code, code))
      .limit(1);
    
    return result[0];
  }
  
  // تحديث حالة الحوالة
  async updateCityTransferStatus(id: number, status: string): Promise<CityTransfer> {
    const updateData: any = { status };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    const [result] = await db
      .update(cityTransfers)
      .set(updateData)
      .where(eq(cityTransfers.id, id))
      .returning();
    
    return result;
  }
  
  // دوال إدارة الحوالات الدولية
  async createInternationalTransfer(transfer: InsertInternationalTransfer): Promise<InternationalTransfer> {
    const [result] = await db
      .insert(internationalTransfers)
      .values(transfer)
      .returning();
    
    return result;
  }
  
  async getInternationalTransfers(agentId: number): Promise<InternationalTransfer[]> {
    const result = await db
      .select()
      .from(internationalTransfers)
      .where(
        or(
          eq(internationalTransfers.senderId, agentId),
          eq(internationalTransfers.receiverOfficeId, agentId)
        )
      )
      .orderBy(desc(internationalTransfers.createdAt));
    
    return result;
  }
  
  async getInternationalTransferByCode(code: string): Promise<InternationalTransfer | undefined> {
    const result = await db
      .select()
      .from(internationalTransfers)
      .where(eq(internationalTransfers.code, code))
      .limit(1);
    
    return result[0];
  }
  
  async updateInternationalTransferStatus(id: number, status: string): Promise<InternationalTransfer> {
    const updateData: any = { status };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    const [result] = await db
      .update(internationalTransfers)
      .set(updateData)
      .where(eq(internationalTransfers.id, id))
      .returning();
    
    return result;
  }

  async cancelInternationalTransfer(id: number): Promise<{ success: boolean; transfer?: AgentTransfer; message?: string }> {
    try {
      // جلب التحويل أولاً من جدول agent_transfers
      const [transfer] = await db
        .select()
        .from(agentTransfers)
        .where(eq(agentTransfers.id, id))
        .limit(1);

      if (!transfer) {
        return { success: false, message: "التحويل غير موجود" };
      }

      if (transfer.status !== 'pending') {
        return { success: false, message: "لا يمكن إلغاء التحويل - الحالة الحالية: " + transfer.status };
      }

      // إلغاء التحويل
      const [cancelledTransfer] = await db
        .update(agentTransfers)
        .set({ status: 'cancelled' })
        .where(eq(agentTransfers.id, id))
        .returning();

      // استعادة المبلغ للمرسل (المبلغ المعلق + عمولة النظام)
      const totalDeducted = parseFloat(transfer.amountPending || transfer.amount) + parseFloat(transfer.commissionSystem || transfer.commission);
      await this.updateUserBalance(transfer.senderId, transfer.currency, totalDeducted);

      return { success: true, transfer: cancelledTransfer };
    } catch (error) {
      console.error('خطأ في إلغاء التحويل الدولي:', error);
      return { success: false, message: "حدث خطأ في إلغاء التحويل" };
    }
  }

  // دوال إدارة عمولات المكاتب حسب المدن
  async getOfficeCommissions(officeId: number): Promise<OfficeCommission[]> {
    return db
      .select()
      .from(officeCommissions)
      .where(eq(officeCommissions.officeId, officeId));
  }

  async getOfficeCommissionByCity(officeId: number, city: string): Promise<OfficeCommission | undefined> {
    const [commission] = await db
      .select()
      .from(officeCommissions)
      .where(and(
        eq(officeCommissions.officeId, officeId),
        eq(officeCommissions.city, city)
      ));
    return commission;
  }

  async createOrUpdateOfficeCommission(commission: InsertOfficeCommission): Promise<OfficeCommission> {
    const existing = await this.getOfficeCommissionByCity(commission.officeId, commission.city);
    
    if (existing) {
      const [updated] = await db
        .update(officeCommissions)
        .set({ commissionRate: commission.commissionRate })
        .where(eq(officeCommissions.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newCommission] = await db
        .insert(officeCommissions)
        .values(commission)
        .returning();
      return newCommission;
    }
  }

  async deleteOfficeCommission(id: number): Promise<void> {
    await db
      .delete(officeCommissions)
      .where(eq(officeCommissions.id, id));
  }
  
  // تنفيذ دوال إدارة عمولات المكاتب حسب الدول
  
  async getOfficeCountryCommissions(officeId: number): Promise<OfficeCountryCommission[]> {
    return db
      .select()
      .from(officeCountryCommissions)
      .where(eq(officeCountryCommissions.officeId, officeId));
  }

  async getOfficeCommissionByCountry(officeId: number, country: string): Promise<OfficeCountryCommission | undefined> {
    const [commission] = await db
      .select()
      .from(officeCountryCommissions)
      .where(and(
        eq(officeCountryCommissions.officeId, officeId),
        eq(officeCountryCommissions.country, country)
      ));
    
    return commission;
  }

  async createOrUpdateOfficeCountryCommission(commission: InsertOfficeCountryCommission): Promise<OfficeCountryCommission> {
    const { officeId, country, commissionRate } = commission;
    
    // التحقق من وجود عمولة للدولة مسبقاً
    const existingCommission = await this.getOfficeCommissionByCountry(officeId, country);
    
    if (existingCommission) {
      // تحديث العمولة الموجودة
      const [updated] = await db
        .update(officeCountryCommissions)
        .set({ commissionRate })
        .where(eq(officeCountryCommissions.id, existingCommission.id))
        .returning();
      
      return updated;
    } else {
      // إنشاء عمولة جديدة
      const [newCommission] = await db
        .insert(officeCountryCommissions)
        .values(commission)
        .returning();
      
      return newCommission;
    }
  }

  async deleteOfficeCountryCommission(id: number): Promise<void> {
    await db
      .delete(officeCountryCommissions)
      .where(eq(officeCountryCommissions.id, id));
  }
  
  // تنفيذ دوال إعدادات النظام
  
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, key));
    
    return setting;
  }
  
  async getAdminSettings(): Promise<AdminSetting[]> {
    return db
      .select()
      .from(adminSettings);
  }
  
  async createOrUpdateAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    const { key, value, description } = setting;
    
    // التحقق من وجود الإعداد مسبقاً
    const existingSetting = await this.getAdminSetting(key);
    
    if (existingSetting) {
      // تحديث الإعداد الموجود
      const [updated] = await db
        .update(adminSettings)
        .set({ 
          value,
          description,
          updatedAt: new Date()
        })
        .where(eq(adminSettings.key, key))
        .returning();
      
      return updated;
    } else {
      // إنشاء إعداد جديد
      const [newSetting] = await db
        .insert(adminSettings)
        .values(setting)
        .returning();
      
      return newSetting;
    }
  }
  
  async deleteAdminSetting(key: string): Promise<void> {
    await db
      .delete(adminSettings)
      .where(eq(adminSettings.key, key));
  }
  
  // وظائف إدارة طلبات توثيق الحسابات
  
  async getUserVerificationRequest(userId: number): Promise<VerificationRequest | undefined> {
    const [request] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, userId));
    
    return request;
  }
  
  async getUserVerificationRequestById(requestId: number): Promise<VerificationRequest | undefined> {
    const [request] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.id, requestId));
    
    return request;
  }
  
  async getAllVerificationRequests(status?: string): Promise<VerificationRequest[]> {
    console.log(`🔍 جلب طلبات التوثيق - الفلتر: ${status || 'الكل'}`);
    
    let query = db.select({
      request: verificationRequests,
      user: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone
      }
    })
    .from(verificationRequests)
    .innerJoin(users, eq(verificationRequests.userId, users.id))
    .orderBy(desc(verificationRequests.createdAt));
    
    if (status) {
      query = query.where(eq(verificationRequests.status, status));
    }
    
    const results = await query;
    console.log(`📋 عدد طلبات التوثيق المُستلمة: ${results.length}`);
    
    // تنسيق النتائج لتحويلها إلى الشكل المطلوب
    const formattedResults = results.map(row => ({
      ...row.request,
      user: row.user
    })) as unknown as VerificationRequest[];
    
    console.log(`✅ تنسيق طلبات التوثيق مكتمل: ${formattedResults.length}`);
    return formattedResults;
  }
  
  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const [newRequest] = await db
      .insert(verificationRequests)
      .values(request)
      .returning();
    
    return newRequest;
  }
  
  async updateVerificationRequestStatus(requestId: number, status: 'approved' | 'rejected', notes?: string): Promise<VerificationRequest> {
    const [updatedRequest] = await db
      .update(verificationRequests)
      .set({ 
        status, 
        notes, 
        updatedAt: new Date() 
      })
      .where(eq(verificationRequests.id, requestId))
      .returning();
    
    // إذا تمت الموافقة أو الرفض، أرسل إشعارًا للمستخدم
    if (updatedRequest) {
      const userId = updatedRequest.userId;

      if (status === 'approved') {
        // تحديث حالة المستخدم ليصبح موثقًا
        await db
          .update(users)
          .set({ verified: true })
          .where(eq(users.id, userId));

        // جلب بيانات المستخدم للتحقق من نوعه
        const user = await this.getUser(userId);
        
        // إذا كان الحساب من نوع وكيل، إنشاء مكتب له تلقائياً
        if (user && user.type === 'agent') {
          // التحقق من عدم وجود مكتب مسبق
          const existingOffice = await db
            .select()
            .from(agentOffices)
            .where(eq(agentOffices.agentId, userId))
            .limit(1);

          if (existingOffice.length === 0) {
            // إنشاء كود مكتب فريد
            const officeCode = `AGT${userId.toString().padStart(3, '0')}`;
            
            // إنشاء مكتب للوكيل
            await db
              .insert(agentOffices)
              .values({
                agentId: userId,
                countryCode: 'LY',
                city: user.city || 'غير محدد',
                officeCode: officeCode,
                officeName: `مكتب ${user.fullName} - ${user.cityName || user.city || 'غير محدد'}`,
                contactInfo: user.phone || '',
                address: `${user.cityName || user.city || 'غير محدد'}، ${user.countryName || 'غير محدد'}`,
                isActive: true,
                commissionRate: user.commissionRate || 3.0,
                userId: userId
              });

            console.log(`✅ تم إنشاء مكتب للوكيل ${user.fullName} (${userId}) بكود ${officeCode}`);
          }
        }

        // إرسال إشعار بالموافقة
        await this.createUserNotification({
          userId: userId,
          title: "تمت الموافقة على طلب توثيق الحساب",
          body: "تهانينا! تمت الموافقة على طلب توثيق حسابك وأصبح حسابك موثقًا الآن.",
          type: "success",
          isRead: false
        });
      } else if (status === 'rejected') {
        // إرسال إشعار بالرفض
        await this.createUserNotification({
          userId: userId,
          title: "تم رفض طلب توثيق الحساب",
          body: notes ? `تم رفض طلب توثيق حسابك. السبب: ${notes}` : "تم رفض طلب توثيق حسابك. يرجى مراجعة الإدارة.",
          type: "error",
          isRead: false
        });
      }
    }
    
    return updatedRequest;
  }
  
  // ===== وظائف إدارة الإشعارات =====
  
  async getUserNotifications(userId: number): Promise<UserNotification[]> {
    return await db
      .select()
      .from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt));
  }
  
  async createUserNotification(notification: InsertUserNotification): Promise<UserNotification> {
    console.log("=== بداية إنشاء إشعار جديد ===");
    console.log("بيانات الإشعار:", notification);
    
    try {
      const [result] = await db
        .insert(userNotifications)
        .values(notification)
        .returning();
      
      console.log("تم إنشاء الإشعار بنجاح:", result);
      
      // إرسال إشعار push للمستخدم تلقائياً فقط إذا كان مشترك
      try {
        // التحقق من وجود اشتراك push قبل الإرسال
        const [subscription] = await db
          .select()
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.userId, notification.userId));
        
        if (subscription) {
          const pushNotifications = await import('./push-notifications');
          await pushNotifications.sendPushNotificationToUser(notification.userId, {
            title: notification.title,
            body: notification.body || 'لديك إشعار جديد',
            data: { 
              type: 'user_notification',
              notificationId: result.id,
              notificationType: notification.type
            },
            url: '/notifications',
            tag: `notification-${result.id}`
          });
          console.log(`✅ تم إرسال إشعار push للمستخدم ${notification.userId}`);
        } else {
          console.log(`ℹ️ لا توجد اشتراكات إشعارات للمستخدم ${notification.userId} - تم تخطي إرسال push`);
        }
      } catch (pushError) {
        console.error('خطأ في إرسال إشعار push للإشعار الجديد:', pushError);
        // لا نرمي خطأ هنا لأن الإشعار تم إنشاؤه بنجاح
      }
      
      return result;
    } catch (error) {
      console.error("خطأ في إنشاء الإشعار:", error);
      throw error;
    }
  }
  
  async markNotificationAsRead(notificationId: number): Promise<UserNotification> {
    const [notification] = await db
      .update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.id, notificationId))
      .returning();
    
    if (!notification) {
      throw new Error("الإشعار غير موجود");
    }
    
    return notification;
  }
  
  async markAllUserNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.userId, userId));
  }
  
  // ===== وظائف الدردشة الفورية =====
  
  async getChatRooms(): Promise<ChatRoom[]> {
    return await db.select().from(chatRooms).orderBy(desc(chatRooms.createdAt));
  }
  
  async getPublicChatRoom(): Promise<ChatRoom | undefined> {
    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.isPublic, true))
      .limit(1);
    
    return room;
  }
  
  async getChatMessages(roomId: number, limit: number = 50, userId?: number): Promise<(ChatMessage & { senderName: string; likesCount: number; likedByMe: boolean })[]> {
    const messages = await db
      .select({
        message: chatMessages,
        senderName: users.fullName
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    
    // جلب إعجابات كل رسالة
    const messagesWithLikes = await Promise.all(messages.map(async (row) => {
      // عدد الإعجابات
      const likesCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(messageLikes)
        .where(eq(messageLikes.messageId, row.message.id));
      
      const likesCount = Number(likesCountResult[0]?.count || 0);
      
      // هل أعجب المستخدم الحالي بهذه الرسالة
      let likedByMe = false;
      if (userId) {
        const userLike = await db
          .select()
          .from(messageLikes)
          .where(
            and(
              eq(messageLikes.messageId, row.message.id),
              eq(messageLikes.userId, userId)
            )
          )
          .limit(1);
        
        likedByMe = userLike.length > 0;
      }
      
      return {
        ...row.message,
        senderName: row.senderName,
        likesCount,
        likedByMe
      };
    }));
    
    return messagesWithLikes;
  }

  // تبديل إعجاب الرسالة
  async toggleMessageLike(messageId: number, userId: number): Promise<{ liked: boolean; count: number }> {
    // التحقق من وجود الإعجاب
    const existingLike = await db
      .select()
      .from(messageLikes)
      .where(
        and(
          eq(messageLikes.messageId, messageId),
          eq(messageLikes.userId, userId)
        )
      )
      .limit(1);
    
    let liked: boolean;
    
    if (existingLike.length > 0) {
      // إزالة الإعجاب
      await db
        .delete(messageLikes)
        .where(
          and(
            eq(messageLikes.messageId, messageId),
            eq(messageLikes.userId, userId)
          )
        );
      liked = false;
    } else {
      // إضافة إعجاب
      await db
        .insert(messageLikes)
        .values({
          messageId,
          userId
        });
      liked = true;
    }
    
    // جلب عدد الإعجابات الجديد
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageLikes)
      .where(eq(messageLikes.messageId, messageId));
    
    const count = Number(countResult[0]?.count || 0);
    
    return { liked, count };
  }

  // جلب قائمة المعجبين برسالة
  async getMessageLikes(messageId: number): Promise<{ userId: number; userName: string }[]> {
    const likes = await db
      .select({
        userId: messageLikes.userId,
        userName: users.fullName
      })
      .from(messageLikes)
      .innerJoin(users, eq(messageLikes.userId, users.id))
      .where(eq(messageLikes.messageId, messageId))
      .orderBy(desc(messageLikes.createdAt));
    
    return likes;
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    
    return newMessage;
  }

  // ===== وظائف الدردشة الخاصة (1 إلى 1) =====

  async getUserPrivateChats(userId: number): Promise<(PrivateChat & { otherUser: { id: number, fullName: string } })[]> {
    const result = await db.execute(sql`
      SELECT pc.*, 
        CASE 
          WHEN pc.user1_id = ${userId} THEN json_build_object('id', u2.id, 'fullName', u2.full_name)
          ELSE json_build_object('id', u1.id, 'fullName', u1.full_name)
        END as other_user
      FROM private_chats pc
      JOIN users u1 ON pc.user1_id = u1.id
      JOIN users u2 ON pc.user2_id = u2.id
      WHERE pc.user1_id = ${userId} OR pc.user2_id = ${userId}
      ORDER BY pc.last_message_at DESC
    `);
    
    // Transform snake_case to camelCase
    return result.rows.map((row: any) => ({
      id: row.id,
      user1Id: row.user1_id,
      user2Id: row.user2_id,
      lastMessageAt: row.last_message_at,
      createdAt: row.created_at,
      otherUser: row.other_user
    }));
  }

  async getPrivateChat(user1Id: number, user2Id: number): Promise<PrivateChat | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM private_chats 
      WHERE (user1_id = ${user1Id} AND user2_id = ${user2Id})
         OR (user1_id = ${user2Id} AND user2_id = ${user1Id})
      LIMIT 1
    `);
    
    return result.rows.length > 0 ? result.rows[0] : undefined;
  }

  async createPrivateChat(user1Id: number, user2Id: number): Promise<PrivateChat> {
    // تأكد من أن user1Id أقل من user2Id للحفاظ على ترتيب ثابت
    const [firstUserId, secondUserId] = user1Id < user2Id 
      ? [user1Id, user2Id] 
      : [user2Id, user1Id];
      
    const [newChat] = await db.insert(privateChats)
      .values({
        user1Id: firstUserId,
        user2Id: secondUserId
      })
      .returning();
    
    return newChat;
  }

  async getPrivateMessages(chatId: number, limit: number = 50): Promise<(PrivateMessage & { senderName: string })[]> {
    const result = await db.execute(sql`
      SELECT pm.*, u.full_name as sender_name
      FROM private_messages pm
      JOIN users u ON pm.sender_id = u.id
      WHERE pm.chat_id = ${chatId}
      ORDER BY pm.created_at DESC
      LIMIT ${limit}
    `);
    
    return result.rows;
  }

  async createPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    // إنشاء الرسالة الجديدة
    const [newMessage] = await db.insert(privateMessages)
      .values(message)
      .returning();
    
    // تحديث وقت آخر رسالة في المحادثة
    await db.update(privateChats)
      .set({ lastMessageAt: new Date() })
      .where(eq(privateChats.id, message.chatId));
    
    return newMessage;
  }

  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    await db.update(privateMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(privateMessages.chatId, chatId),
          // تحديث فقط الرسائل التي تم استلامها (أي ليست مرسلة) من قبل المستخدم
          sql`sender_id != ${userId}`
        )
      );
  }

  async getUnreadMessagesCount(userId: number): Promise<{chatId: number, count: number}[]> {
    const result = await db.execute(sql`
      SELECT pm.chat_id, COUNT(*) as count
      FROM private_messages pm
      JOIN private_chats pc ON pm.chat_id = pc.id
      WHERE (pc.user1_id = ${userId} OR pc.user2_id = ${userId})
        AND pm.sender_id != ${userId}
        AND pm.is_read = false
      GROUP BY pm.chat_id
    `);
    
    // Transform snake_case to camelCase
    return result.rows.map((row: any) => ({
      chatId: row.chat_id,
      count: parseInt(row.count)
    }));
  }
  
  // تنفيذ وظائف محادثات المجموعات
  
  async createGroupChat(groupChat: InsertGroupChat): Promise<GroupChat> {
    const [chat] = await db
      .insert(groupChats)
      .values(groupChat)
      .returning();
    
    // إضافة المنشئ كمالك للمجموعة
    await db
      .insert(groupMembers)
      .values({
        groupId: chat.id,
        userId: groupChat.creatorId,
        role: "owner"
      });
      
    return chat;
  }
  
  async getGroupChat(groupId: number): Promise<GroupChat | undefined> {
    const [chat] = await db
      .select()
      .from(groupChats)
      .where(eq(groupChats.id, groupId));
      
    return chat;
  }
  
  async getUserGroupChats(userId: number): Promise<GroupChat[]> {
    const result = await db.execute(sql`
      SELECT g.*
      FROM group_chats g
      JOIN group_members m ON g.id = m.group_id
      WHERE m.user_id = ${userId}
      ORDER BY g.created_at DESC
    `);
    
    return result.rows;
  }

  // دالة جديدة للحصول على جميع المجموعات العامة
  async getAllPublicGroupChats(): Promise<GroupChat[]> {
    const result = await db.execute(sql`
      SELECT *
      FROM group_chats
      WHERE is_private = false
      ORDER BY created_at DESC
    `);
    
    return result.rows;
  }
  
  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const [result] = await db
      .insert(groupMembers)
      .values(member)
      .onConflictDoNothing()
      .returning();
      
    return result;
  }
  
  async getGroupMembers(groupId: number): Promise<(GroupMember & { fullName: string })[]> {
    const result = await db.execute(sql`
      SELECT m.*, u.full_name as "fullName"
      FROM group_members m
      JOIN users u ON m.user_id = u.id
      WHERE m.group_id = ${groupId}
      ORDER BY 
        CASE WHEN m.role = 'admin' THEN 0 ELSE 1 END,
        m.joined_at ASC
    `);
    
    return result.rows;
  }

  // جلب أعضاء غرفة الدردشة العامة (جميع المستخدمين المفعلين)
  async getRoomMembers(roomId: number): Promise<{ id: number; fullName: string }[]> {
    const result = await db.execute(sql`
      SELECT id, full_name as "fullName"
      FROM users
      WHERE active = true
      ORDER BY id
    `);
    
    return result.rows;
  }
  
  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `);
    
    return parseInt(result.rows[0].count) > 0;
  }

  async isGroupAdmin(groupId: number, userId: number): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT 1
      FROM group_members
      WHERE group_id = ${groupId}
        AND user_id = ${userId}
        AND role = 'admin'
    `);
      
    return result.rows.length > 0;
  }

  // إدارة أعضاء المجموعات - دوال جديدة
  
  async getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined> {
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
      
    return member;
  }

  async getUserRoleInGroup(groupId: number, userId: number): Promise<string | null> {
    const result = await db.execute(sql`
      SELECT role
      FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `);
    
    return result.rows.length > 0 ? result.rows[0].role : null;
  }

  async setMemberMuteUntil(groupId: number, userId: number, until: Date | null): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        UPDATE group_members 
        SET muted_until = ${until}
        WHERE group_id = ${groupId} AND user_id = ${userId}
      `);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('خطأ في كتم العضو:', error);
      return false;
    }
  }

  async removeGroupMember(groupId: number, userId: number): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        DELETE FROM group_members 
        WHERE group_id = ${groupId} AND user_id = ${userId}
      `);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('خطأ في حذف العضو:', error);
      return false;
    }
  }

  async deleteGroup(groupId: number): Promise<boolean> {
    try {
      // حذف جميع رسائل المجموعة
      await db.execute(sql`
        DELETE FROM group_messages 
        WHERE group_id = ${groupId}
      `);
      
      // حذف جميع أعضاء المجموعة
      await db.execute(sql`
        DELETE FROM group_members 
        WHERE group_id = ${groupId}
      `);
      
      // حذف المجموعة نفسها
      const result = await db.execute(sql`
        DELETE FROM group_chats 
        WHERE id = ${groupId}
      `);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('خطأ في حذف المجموعة:', error);
      return false;
    }
  }

  async isUserMuted(groupId: number, userId: number): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT muted_until
      FROM group_members
      WHERE group_id = ${groupId} 
        AND user_id = ${userId}
        AND muted_until IS NOT NULL 
        AND muted_until > NOW()
    `);
    
    return result.rows.length > 0;
  }

  async isUserBanned(groupId: number, userId: number): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT is_banned
      FROM group_members
      WHERE group_id = ${groupId} 
        AND user_id = ${userId}
        AND is_banned = true
    `);
    
    return result.rows.length > 0;
  }

  async banGroupMember(groupId: number, userId: number, bannedBy: number, reason?: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        UPDATE group_members 
        SET is_banned = true,
            banned_by = ${bannedBy},
            banned_at = NOW(),
            ban_reason = ${reason || 'غير محدد'}
        WHERE group_id = ${groupId} AND user_id = ${userId}
      `);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('خطأ في حظر العضو:', error);
      return false;
    }
  }

  async unbanGroupMember(groupId: number, userId: number): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        UPDATE group_members 
        SET is_banned = false,
            banned_by = NULL,
            banned_at = NULL,
            ban_reason = NULL
        WHERE group_id = ${groupId} AND user_id = ${userId}
      `);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('خطأ في إلغاء حظر العضو:', error);
      return false;
    }
  }
  
  async createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage> {
    const [result] = await db
      .insert(groupMessages)
      .values(message)
      .returning();
      
    return result;
  }
  
  async getGroupMessages(groupId: number, limit: number = 50): Promise<(GroupMessage & { senderName: string })[]> {
    const query = sql`
      SELECT m.*, u.full_name as "senderName"
      FROM group_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.group_id = ${groupId}
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `;
    
    const result = await db.execute(query);
    return result.rows;
  }

  // Agent commission methods implementation
  async getAgentCommissions(agentId: number): Promise<AgentCommission[]> {
    return db
      .select()
      .from(agentCommissions)
      .where(eq(agentCommissions.agentId, agentId))
      .orderBy(agentCommissions.currencyCode);
  }

  async getAllAgentCommissions(): Promise<(AgentCommission & { agentName: string })[]> {
    const result = await db
      .select({
        id: agentCommissions.id,
        agentId: agentCommissions.agentId,
        currencyCode: agentCommissions.currencyCode,
        type: agentCommissions.type,
        value: agentCommissions.value,
        createdAt: agentCommissions.createdAt,
        updatedAt: agentCommissions.updatedAt,
        agentName: users.fullName
      })
      .from(agentCommissions)
      .innerJoin(users, eq(agentCommissions.agentId, users.id))
      .orderBy(agentCommissions.currencyCode);
    
    return result.filter(item => item.agentName);
  }

  async getAgentCommissionByCurrency(agentId: number, currencyCode: string): Promise<AgentCommission | undefined> {
    const [commission] = await db
      .select()
      .from(agentCommissions)
      .where(and(
        eq(agentCommissions.agentId, agentId),
        eq(agentCommissions.currencyCode, currencyCode)
      ));
    
    return commission;
  }

  async createOrUpdateAgentCommission(commission: InsertAgentCommission): Promise<AgentCommission> {
    const existing = await this.getAgentCommissionByCurrency(commission.agentId, commission.currencyCode);
    
    if (existing) {
      const [updated] = await db
        .update(agentCommissions)
        .set({ 
          type: commission.type,
          value: commission.value,
          updatedAt: new Date()
        })
        .where(eq(agentCommissions.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newCommission] = await db
        .insert(agentCommissions)
        .values(commission)
        .returning();
      return newCommission;
    }
  }

  async deleteAgentCommission(id: number): Promise<void> {
    await db
      .delete(agentCommissions)
      .where(eq(agentCommissions.id, id));
  }

  // City Transfer Commission Tiers
  async getCityTransferCommissions(agentId: number): Promise<CityTransferCommission[]> {
    return await db
      .select()
      .from(cityTransferCommissions)
      .where(eq(cityTransferCommissions.agentId, agentId))
      .orderBy(asc(cityTransferCommissions.currencyCode), asc(cityTransferCommissions.minAmount));
  }

  async createCityTransferCommission(commission: InsertCityTransferCommission): Promise<CityTransferCommission> {
    const [newCommission] = await db
      .insert(cityTransferCommissions)
      .values(commission)
      .returning();
    return newCommission;
  }

  async updateCityTransferCommission(id: number, commission: Partial<InsertCityTransferCommission>): Promise<CityTransferCommission> {
    const [updated] = await db
      .update(cityTransferCommissions)
      .set({ ...commission, updatedAt: new Date() })
      .where(eq(cityTransferCommissions.id, id))
      .returning();
    return updated;
  }

  async deleteCityTransferCommission(id: number): Promise<void> {
    await db
      .delete(cityTransferCommissions)
      .where(eq(cityTransferCommissions.id, id));
  }

  async findApplicableCityCommission(
    agentId: number, 
    amount: number, 
    currency: string, 
    originCity?: string, 
    destinationCity?: string
  ): Promise<CityTransferCommission | null> {
    const tiers = await db
      .select()
      .from(cityTransferCommissions)
      .where(
        and(
          eq(cityTransferCommissions.agentId, agentId),
          eq(cityTransferCommissions.currencyCode, currency),
          // Match specific cities or general tiers
          or(
            isNull(cityTransferCommissions.originCity),
            eq(cityTransferCommissions.originCity, originCity || '')
          ),
          or(
            isNull(cityTransferCommissions.destinationCity),
            eq(cityTransferCommissions.destinationCity, destinationCity || '')
          )
        )
      )
      .orderBy(
        // Prioritize specific city matches over general ones
        desc(cityTransferCommissions.originCity),
        desc(cityTransferCommissions.destinationCity),
        asc(cityTransferCommissions.minAmount)
      );

    // Find the applicable tier
    for (const tier of tiers) {
      const minAmount = parseFloat(tier.minAmount);
      const maxAmount = tier.maxAmount ? parseFloat(tier.maxAmount) : Infinity;
      
      if (amount >= minAmount && amount <= maxAmount) {
        return tier;
      }
    }

    return null;
  }

  // Commission pool methods implementation
  async getCommissionPoolBalance(currencyCode?: string): Promise<{ [currency: string]: string }> {
    let query = db
      .select({
        currencyCode: commissionPoolTransactions.currencyCode,
        totalCredits: sql<string>`COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        totalWithdrawals: sql<string>`COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
      })
      .from(commissionPoolTransactions)
      .groupBy(commissionPoolTransactions.currencyCode);

    if (currencyCode) {
      query = query.where(eq(commissionPoolTransactions.currencyCode, currencyCode)) as any;
    }

    const results = await query;
    
    const balances: { [currency: string]: string } = {};
    
    results.forEach(result => {
      const credits = parseFloat(result.totalCredits) || 0;
      const withdrawals = parseFloat(result.totalWithdrawals) || 0;
      const balance = credits - withdrawals;
      balances[result.currencyCode] = balance.toFixed(2);
      console.log(`رصيد حساب التجميع ${result.currencyCode}: الإيداعات=${credits}, السحوبات=${withdrawals}, الرصيد=${balance}`);
    });

    // إضافة العملات التي لها رصيد صفر ولكن موجودة في النظام
    if (!currencyCode) {
      const allCurrencies = ['LYD', 'USD', 'EUR', 'TRY', 'AED', 'EGP', 'TND', 'GBP'];
      allCurrencies.forEach(currency => {
        if (!balances[currency]) {
          balances[currency] = '0.00';
        }
      });
    }

    return balances;
  }

  async getCommissionPoolTransactions(filters?: { currencyCode?: string; sourceType?: string; limit?: number; offset?: number }): Promise<CommissionPoolTransaction[]> {
    let query = db.select().from(commissionPoolTransactions);

    if (filters?.currencyCode) {
      query = query.where(eq(commissionPoolTransactions.currencyCode, filters.currencyCode)) as any;
    }
    
    if (filters?.sourceType) {
      const currentCondition = filters.currencyCode ? 
        and(eq(commissionPoolTransactions.currencyCode, filters.currencyCode), eq(commissionPoolTransactions.sourceType, filters.sourceType)) :
        eq(commissionPoolTransactions.sourceType, filters.sourceType);
      query = query.where(currentCondition) as any;
    }

    query = query.orderBy(desc(commissionPoolTransactions.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return query;
  }

  async addCommissionPoolTransaction(transaction: InsertCommissionPoolTransaction): Promise<CommissionPoolTransaction> {
    console.log(`🔍 addCommissionPoolTransaction: بدء معالجة العمولة - المبلغ: ${transaction.amount}, النوع: ${transaction.transactionType}, المصدر: ${transaction.sourceId}, الوصف: "${transaction.description}"`);
    
    // 🔥 الحل الشامل: تطبيق نظام المكافآت على جميع العمولات تلقائياً
    if (transaction.transactionType === 'credit' && parseFloat(transaction.amount) > 0) {
      try {
        const { allocateFixedReferralReward } = await import('./referral-system');
        
        // تحديد نوع العملية حسب الوصف
        let operationType: 'transfer_lyd' | 'transfer_usd' | 'market_sell' = 'transfer_lyd';
        if (transaction.description?.includes('سوق') || transaction.description?.includes('market') || transaction.description?.includes('عرض') || transaction.description?.includes('صفقة')) {
          operationType = 'market_sell';
          console.log(`🎯 تحديد نوع العملية: ${operationType} (سوق/عرض موجود في الوصف)`);
        } else if (transaction.currencyCode === 'USD') {
          operationType = 'transfer_usd';
          console.log(`🎯 تحديد نوع العملية: ${operationType} (عملة USD)`);
        } else {
          console.log(`🎯 تحديد نوع العملية: ${operationType} (افتراضي)`);
        }
        
        // محاولة تطبيق نظام المكافآت (تخطي إذا كانت العمولة تحتوي على "بعد المكافآت" أو "صافي")
        const shouldApplyReferral = !transaction.description?.includes('صافي') && 
                                    !transaction.description?.includes('بعد المكافآت') && 
                                    !transaction.description?.includes('بعد خصم') &&
                                    !transaction.description?.includes('withdrawal');
        
        console.log(`🔍 فحص تطبيق نظام المكافآت: العمولة=${transaction.amount}, الوصف="${transaction.description}", نوع العملية=${operationType}, سيتم التطبيق=${shouldApplyReferral}, المستخدم=${transaction.sourceId}`);
        
        if (shouldApplyReferral) {
          console.log(`🚀 بدء تطبيق نظام المكافآت...`);
          const referralResult = await allocateFixedReferralReward(
            transaction.relatedTransactionId || 0,
            operationType,
            parseFloat(transaction.amount),
            transaction.currencyCode,
            transaction.sourceId || 0
          );
          
          console.log(`📊 نتيجة نظام المكافآت: hasReferral=${referralResult.hasReferral}, rewardAmount=${referralResult.rewardAmount}, netSystemCommission=${referralResult.netSystemCommission}`);
          
          // استخدام صافي العمولة بدلاً من العمولة الكاملة
          if (referralResult.hasReferral) {
            const originalAmount = parseFloat(transaction.amount);
            const rewardDeducted = originalAmount - referralResult.netSystemCommission;
            
            console.log(`💰 تطبيق نظام المكافآت تلقائياً: العمولة ${originalAmount} → صافي ${referralResult.netSystemCommission} (مكافأة: ${rewardDeducted.toFixed(6)})`);
            
            transaction.amount = referralResult.netSystemCommission.toString();
            if (rewardDeducted > 0) {
              transaction.description += ` (صافي بعد خصم مكافأة إحالة ${rewardDeducted.toFixed(2)})`;
            }
          } else {
            console.log(`ℹ️ لا توجد إحالة للمستخدم ${transaction.sourceId} أو النظام غير مُفعل`);
          }
        } else {
          console.log(`⏭️ تم تخطي تطبيق نظام المكافآت بسبب الوصف أو النوع`);
        }
      } catch (error) {
        console.log('⚠️ تعذر تطبيق نظام المكافآت على هذه العمولة:', error);
        // المتابعة بالعمولة الأصلية في حالة الخطأ
      }
    } else {
      console.log(`⏭️ تم تخطي معالجة المكافآت - النوع: ${transaction.transactionType}, المبلغ: ${transaction.amount}`);
    }

    const [newTransaction] = await db
      .insert(commissionPoolTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async withdrawFromCommissionPool(currencyCode: string, amount: string, description: string): Promise<CommissionPoolTransaction> {
    // التحقق من الرصيد المتاح
    const balances = await this.getCommissionPoolBalance(currencyCode);
    const currentBalance = parseFloat(balances[currencyCode] || '0');
    const withdrawalAmount = parseFloat(amount);

    if (currentBalance < withdrawalAmount) {
      throw new Error(`رصيد غير كافي. الرصيد المتاح: ${currentBalance.toFixed(2)} ${currencyCode}`);
    }

    // إنشاء معاملة السحب
    const withdrawalTransaction = await this.addCommissionPoolTransaction({
      sourceType: 'system',
      sourceId: null,
      sourceName: 'النظام',
      currencyCode,
      amount,
      transactionType: 'withdrawal',
      relatedTransactionId: null,
      description
    });

    // إضافة المبلغ المسحوب إلى رصيد المدير في نفس العملة
    const admin = await this.getAdminUser();
    if (admin) {
      try {
        const adminBalance = await this.getUserBalance(admin.id, currencyCode);
        const currentAmount = parseFloat(adminBalance?.amount || '0');
        const newAmount = (currentAmount + withdrawalAmount).toString();
        
        console.log(`إضافة ${withdrawalAmount} ${currencyCode} إلى رصيد المدير. الرصيد الحالي: ${currentAmount}, الرصيد الجديد: ${newAmount}`);
        
        // تحديث الرصيد باستخدام دالة setUserBalance
        await this.setUserBalance(admin.id, currencyCode, newAmount);

        // إنشاء معاملة في سجل المدير
        await this.createTransaction({
          userId: admin.id,
          type: 'commission_withdrawal',
          amount: withdrawalAmount.toString(),
          currency: currencyCode,
          description: `سحب من حساب العمولات: ${description}`
        });
        
        console.log(`تم تحديث رصيد المدير وإنشاء معاملة سحب بمبلغ ${withdrawalAmount} ${currencyCode}`);
      } catch (error) {
        console.error(`خطأ في إضافة المبلغ لرصيد المدير:`, error);
        throw error;
      }
    }

    return withdrawalTransaction;
  }

  // نسب العمولة الافتراضية للنظام
  async createSystemCommissionRate(rate: any): Promise<any> {
    console.log("💾 حفظ البيانات في قاعدة البيانات:", rate);
    const [newRate] = await db.insert(systemCommissionRates).values(rate).returning();
    console.log("📊 البيانات المُحفوظة:", newRate);
    return newRate;
  }

  async getSystemCommissionRates(): Promise<any[]> {
    return await db.select().from(systemCommissionRates).orderBy(systemCommissionRates.transferType, systemCommissionRates.currency);
  }

  async getSystemCommissionRate(transferType: string, currency: string): Promise<SelectSystemCommissionRate | undefined> {
    const [rate] = await db
      .select()
      .from(systemCommissionRates)
      .where(
        and(
          eq(systemCommissionRates.transferType, transferType),
          eq(systemCommissionRates.currency, currency),
          eq(systemCommissionRates.isActive, true)
        )
      );
    return rate;
  }

  async updateSystemCommissionRate(id: number, rate: Partial<InsertSystemCommissionRate>): Promise<SelectSystemCommissionRate | null> {
    const [updatedRate] = await db
      .update(systemCommissionRates)
      .set({ ...rate, updatedAt: new Date() })
      .where(eq(systemCommissionRates.id, id))
      .returning();
    return updatedRate || null;
  }

  async deleteSystemCommissionRate(id: number): Promise<void> {
    await db.delete(systemCommissionRates).where(eq(systemCommissionRates.id, id));
  }

  // إدارة الدول
  // حذف الوظيفة المكررة - موجودة في مكان آخر

  // حذف الوظيفة المكررة - موجودة في مكان آخر

  // إدارة مكاتب الوكلاء
  async getAgentOfficesByCountry(countryCode: string): Promise<any[]> {
    return await db.select().from(agentOffices).where(
      and(
        eq(agentOffices.countryCode, countryCode),
        eq(agentOffices.isActive, true)
      )
    ).orderBy(agentOffices.city, agentOffices.officeName);
  }

  async createAgentOffice(office: any): Promise<any> {
    const [newOffice] = await db.insert(agentOffices).values(office).returning();
    return newOffice;
  }

  async getAgentOfficeById(id: number): Promise<any> {
    const [office] = await db.select().from(agentOffices).where(eq(agentOffices.id, id));
    return office;
  }

  // حذف الوظيفة المكررة - موجودة في مكان آخر


  async getInternationalTransfersByAgent(agentId: number): Promise<any[]> {
    return await this.getInternationalTransfers(agentId);
  }


  // إدارة الدول (للمدراء)
  async getAllCountries(): Promise<any[]> {
    const result = await db.select().from(countries).where(eq(countries.isActive, true)).orderBy(countries.name);
    console.log("Database countries query result:", result);
    return result;
  }

  async getCountryById(id: number): Promise<any> {
    const [country] = await db.select().from(countries).where(eq(countries.id, id));
    return country;
  }

  async getCityById(id: number): Promise<any> {
    const [city] = await db.select().from(cities).where(eq(cities.id, id));
    return city;
  }

  // حذف الوظيفة المكررة - موجودة في مكان آخر

  async deleteCountry(id: number): Promise<void> {
    await db.delete(countries).where(eq(countries.id, id));
  }

  // جلب المستخدمين الذين لديهم حسابات مكاتب صرافة (وكلاء ومدراء)
  async getExchangeOfficeUsers(): Promise<any[]> {
    return await db.select({
      id: users.id,
      fullName: users.fullName,
      accountNumber: users.accountNumber,
      type: users.type,
      city: users.city,
      email: users.email
    }).from(users)
      .where(or(eq(users.type, 'agent'), eq(users.type, 'admin')))
      .orderBy(users.fullName);
  }

  // إدارة مكاتب الوكلاء (للمدراء) مع معلومات المالك
  async getAllAgentOfficesWithOwners(): Promise<any[]> {
    return await db.select({
      id: agentOffices.id,
      officeName: agentOffices.officeName,
      city: agentOffices.city,
      countryCode: agentOffices.countryCode,
      contactInfo: agentOffices.contactInfo,
      address: agentOffices.address,
      agentId: agentOffices.agentId,
      ownerName: users.fullName,
      ownerAccountNumber: users.accountNumber,
      ownerType: users.type
    }).from(agentOffices)
      .leftJoin(users, eq(agentOffices.agentId, users.id))
      .orderBy(agentOffices.officeName);
  }


  // إدارة مكاتب الوكلاء (للمدراء)
  async getAllAgentOffices(): Promise<any[]> {
    return await db.select().from(agentOffices).orderBy(agentOffices.officeName);
  }


  // جلب مكاتب الوكلاء الدوليين (الذين يمكنهم التعامل مع التحويلات الدولية)
  async getInternationalAgentOffices(): Promise<any[]> {
    const result = await db.select()
      .from(agentOffices)
      .innerJoin(users, eq(agentOffices.agentId, users.id))
      .where(and(
        eq(users.type, 'agent'),
        eq(users.extTransferEnabled, true),
        eq(agentOffices.isActive, true)
      ))
      .orderBy(agentOffices.officeName);
    
    // تحويل النتائج للتنسيق المطلوب
    return result.map(row => ({
      id: row.agent_offices.id,
      agentId: row.agent_offices.agentId,
      countryCode: row.agent_offices.countryCode,
      city: row.agent_offices.city,
      officeCode: row.agent_offices.officeCode,
      officeName: row.agent_offices.officeName,
      contactInfo: row.agent_offices.contactInfo,
      address: row.agent_offices.address,
      isActive: row.agent_offices.isActive,
      createdAt: row.agent_offices.createdAt,
      commissionRate: row.agent_offices.commissionRate,
      userId: row.agent_offices.userId,
      agentName: row.users.fullName
    }));
  }


  async deleteAgentOffice(id: number): Promise<void> {
    await db.delete(agentOffices).where(eq(agentOffices.id, id));
  }


  async getAgentOfficeByUserId(userId: number): Promise<any> {
    const [office] = await db
      .select()
      .from(agentOffices)
      .where(eq(agentOffices.agentId, userId));
    return office;
  }


  // جلب المكاتب للتحويل بينها
  async getOfficeUsers(): Promise<any[]> {
    return await db.select({
      id: users.id,
      fullName: users.fullName,
      accountNumber: users.accountNumber,
      city: users.city,
      type: users.type
    }).from(users).where(or(eq(users.type, 'agent'), eq(users.type, 'admin')));
  }

  // حذف الوظيفة المكررة - موجودة في مكان آخر

  // جلب سجل التحويلات بين المكاتب
  async getInterOfficeTransfers(userId: number): Promise<any[]> {
    const transfersOut = await db.select({
      id: transactions.id,
      receiverName: sql`'تحويل صادر'`,
      amount: transactions.amount,
      currency: transactions.currency,
      commission: sql`'0'`,
      city: sql`'--'`,
      status: sql`'completed'`,
      createdAt: transactions.date
    }).from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'inter_office_transfer_out')
      ))
      .orderBy(desc(transactions.date))
      .limit(10);

    return transfersOut;
  }

  // دالة للحصول على مكتب وكيل واحد
  async getAgentOffice(id: number): Promise<any> {
    const [office] = await db.select().from(agentOffices).where(eq(agentOffices.id, id));
    return office;
  }

  // إعدادات استقبال الحوالات للمستخدمين
  async getUserReceiveSettings(userId: number): Promise<UserReceiveSettings[]> {
    const settings = await db
      .select()
      .from(userReceiveSettings)
      .where(eq(userReceiveSettings.userId, userId))
      .orderBy(userReceiveSettings.createdAt);
    return settings;
  }

  async createUserReceiveSettings(settings: InsertUserReceiveSettings): Promise<UserReceiveSettings> {
    const [newSettings] = await db.insert(userReceiveSettings).values(settings).returning();
    return newSettings;
  }

  async updateUserReceiveSettings(id: number, settings: Partial<InsertUserReceiveSettings>): Promise<UserReceiveSettings> {
    const [updatedSettings] = await db
      .update(userReceiveSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(userReceiveSettings.id, id))
      .returning();
    return updatedSettings;
  }

  async deleteUserReceiveSettings(id: number): Promise<void> {
    await db.delete(userReceiveSettings).where(eq(userReceiveSettings.id, id));
  }

  async getUserReceiveSettingsByCountry(userId: number, countryId: number): Promise<UserReceiveSettings | null> {
    const [settings] = await db
      .select()
      .from(userReceiveSettings)
      .where(
        and(
          eq(userReceiveSettings.userId, userId),
          eq(userReceiveSettings.countryId, countryId),
          eq(userReceiveSettings.isActive, true)
        )
      );
    return settings || null;
  }

  async getCountryById(id: number): Promise<Country | null> {
    const [country] = await db.select().from(countries).where(eq(countries.id, id));
    return country || null;
  }

  // دالة لإضافة مبلغ لحساب تجميع العمولات
  async addToCommissionPool(amount: number, currency: string, source: string): Promise<void> {
    await db.insert(commissionPoolTransactions).values({
      amount: amount.toString(),
      currencyCode: currency,
      sourceType: 'system',
      sourceId: 1,
      sourceName: source,
      transactionType: 'credit',
      description: `عمولة من ${source}`
    });
  }

  // دوال إدارة الحوالات الدولية الجديدة - نظام التجميد والخصم
  async createInternationalTransferNew(transfer: InsertInternationalTransferNew): Promise<InternationalTransferNew> {
    const [newTransfer] = await db.insert(internationalTransfersNew).values(transfer).returning();
    return newTransfer;
  }

  async getInternationalTransferNewByCode(code: string): Promise<(InternationalTransferNew & { senderName: string }) | undefined> {
    const [transfer] = await db
      .select({
        ...internationalTransfersNew,
        senderName: users.fullName
      })
      .from(internationalTransfersNew)
      .leftJoin(users, eq(internationalTransfersNew.senderAgentId, users.id))
      .where(eq(internationalTransfersNew.transferCode, code));
    
    return transfer as (InternationalTransferNew & { senderName: string }) | undefined;
  }

  async confirmInternationalTransferNew(transferCode: string, receiverId: number): Promise<InternationalTransferNew> {
    const [updatedTransfer] = await db
      .update(internationalTransfersNew)
      .set({ 
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(internationalTransfersNew.transferCode, transferCode))
      .returning();
    
    return updatedTransfer;
  }

  async calculateInternationalTransferCosts(amount: number, currencyCode: string): Promise<{ commissionSystem: number; commissionRecipient: number; amountPending: number }> {
    // جلب نسب العمولة من إعدادات النظام
    let systemCommissionRate = 0.015; // 1.5% افتراضي
    let recipientCommissionRate = 0.01; // 1% افتراضي
    
    try {
      // جلب نسبة عمولة النظام للتحويلات الدولية
      const systemRate = await this.getSystemCommissionRate('international', currencyCode);
      if (systemRate) {
        if (systemRate.fixedAmount && parseFloat(systemRate.fixedAmount) > 0) {
          // إذا كانت العمولة مبلغ ثابت
          const commissionSystem = parseFloat(systemRate.fixedAmount);
          const commissionRecipient = amount * recipientCommissionRate;
          const amountPending = amount - commissionSystem - commissionRecipient;
          
          console.log(`💰 استخدام عمولة ثابتة للتحويلات الدولية: ${commissionSystem} ${currencyCode}`);
          
          return {
            commissionSystem: parseFloat(commissionSystem.toFixed(2)),
            commissionRecipient: parseFloat(commissionRecipient.toFixed(2)),
            amountPending: parseFloat(amountPending.toFixed(2))
          };
        } else if (systemRate.commissionRate) {
          systemCommissionRate = parseFloat(systemRate.commissionRate);
        } else if (systemRate.perMilleRate) {
          systemCommissionRate = parseFloat(systemRate.perMilleRate) / 1000;
        }
        
        console.log(`📊 استخدام نسبة عمولة النظام من الإعدادات: ${systemCommissionRate * 100}% للعملة ${currencyCode}`);
      } else {
        console.log(`⚠️ لم توجد إعدادات عمولة للتحويلات الدولية بالعملة ${currencyCode}، استخدام القيمة الافتراضية`);
      }
    } catch (error) {
      console.error('خطأ في جلب إعدادات العمولة:', error);
    }
    
    const commissionSystem = amount * systemCommissionRate;
    const commissionRecipient = amount * recipientCommissionRate;
    const amountPending = amount - commissionSystem - commissionRecipient;
    
    return {
      commissionSystem: parseFloat(commissionSystem.toFixed(2)),
      commissionRecipient: parseFloat(commissionRecipient.toFixed(2)),
      amountPending: parseFloat(amountPending.toFixed(2))
    };
  }

  async generateInternationalTransferCode(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INT${timestamp}${random}`;
  }

  async cancelInternationalTransferNew(transferCode: string): Promise<{ success: boolean; transfer?: InternationalTransferNew; message?: string }> {
    try {
      // جلب التحويل أولاً من جدول international_transfers_new
      const transfer = await this.getInternationalTransferNewByCode(transferCode);

      if (!transfer) {
        return { success: false, message: "التحويل غير موجود" };
      }

      if (transfer.status !== 'pending') {
        return { success: false, message: "لا يمكن إلغاء التحويل - الحالة الحالية: " + transfer.status };
      }

      // إلغاء التحويل
      const [cancelledTransfer] = await db
        .update(internationalTransfersNew)
        .set({ status: 'cancelled' })
        .where(eq(internationalTransfersNew.transferCode, transferCode))
        .returning();

      // استعادة المبلغ الكامل للمرسل (المبلغ الأصلي بدون خصم العمولات لأنها كانت معلقة)
      const senderBalance = await this.getUserBalance(transfer.senderAgentId, transfer.currencyCode);
      const currentBalance = parseFloat(senderBalance?.amount || "0");
      const originalAmount = parseFloat(transfer.amountOriginal);
      const newBalance = currentBalance + originalAmount;
      
      await this.setUserBalance(transfer.senderAgentId, transfer.currencyCode, newBalance.toString());

      // إضافة معاملة إرجاع للمرسل
      await this.createTransaction({
        userId: transfer.senderAgentId,
        type: 'international_transfer_refund',
        amount: transfer.amountOriginal,
        currency: transfer.currencyCode,
        description: `إرجاع حوالة دولية ملغاة - رمز: ${transferCode}`
      });

      console.log(`✅ تم إلغاء التحويل الدولي ${transferCode} وإرجاع ${originalAmount} ${transfer.currencyCode} للمرسل`);

      return { success: true, transfer: cancelledTransfer };
    } catch (error) {
      console.error('خطأ في إلغاء التحويل الدولي:', error);
      return { success: false, message: "حدث خطأ في إلغاء التحويل" };
    }
  }

  // External transfer upgrade requests
  async createExternalTransferRequest(data: {
    userId: number;
    phone: string;
    city: string;
    requestedLimits: any;
    message?: string;
    documents?: any;
  }): Promise<any> {
    const [request] = await db
      .insert(upgradeRequests)
      .values({
        userId: data.userId,
        requestType: 'external_transfer',
        phone: data.phone,
        city: data.city,
        requestedLimits: data.requestedLimits,
        message: data.message,
        documents: data.documents,
        status: 'pending'
      })
      .returning();
    return request;
  }

  async getExternalTransferRequests(): Promise<any[]> {
    const requests = await db
      .select()
      .from(upgradeRequests)
      .where(eq(upgradeRequests.requestType, 'external_transfer'))
      .orderBy(desc(upgradeRequests.createdAt));
    return requests;
  }

  async getExternalTransferRequestsByUser(userId: number): Promise<any[]> {
    const requests = await db
      .select()
      .from(upgradeRequests)
      .where(
        and(
          eq(upgradeRequests.userId, userId),
          eq(upgradeRequests.requestType, 'external_transfer')
        )
      )
      .orderBy(desc(upgradeRequests.createdAt));
    return requests;
  }

  async updateExternalTransferRequest(id: number, data: any): Promise<any> {
    const [updated] = await db
      .update(upgradeRequests)
      .set({
        ...data,
        decidedAt: new Date()
      })
      .where(eq(upgradeRequests.id, id))
      .returning();
    return updated;
  }

  async getUserExternalTransferLimits(userId: number): Promise<any> {
    const [user] = await db
      .select({
        extTransferEnabled: users.extTransferEnabled,
        extDailyLimit: users.extDailyLimit,
        extMonthlyLimit: users.extMonthlyLimit,
        extAllowedCurrencies: users.extAllowedCurrencies,
        extAllowedCountries: users.extAllowedCountries
      })
      .from(users)
      .where(eq(users.id, userId));
    return user;
  }

  async getUserDailyTransferAmount(userId: number, currency: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`🔍 حساب السقف اليومي للمستخدم ${userId} بالعملة ${currency}`);
    
    // حساب التحويلات من جدول transfers (التحويلات العادية)
    const transfersResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transfers.amount}), 0)`
      })
      .from(transfers)
      .where(
        and(
          eq(transfers.senderId, userId),
          eq(transfers.currency, currency),
          eq(transfers.transferKind, 'external'),
          sql`${transfers.createdAt} >= ${today.toISOString()}`
        )
      );
    
    // حساب التحويلات من جدول international_transfers (التحويلات الدولية الجديدة)
    const internationalResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total 
       FROM international_transfers 
       WHERE agent_id = $1 AND currency_code = $2 AND created_at >= $3 AND status != 'canceled'`,
      [userId, currency, today.toISOString()]
    );
    
    // 🔥 حساب التحويلات من جدول agent_transfers (هذا هو المفقود!)
    const agentTransfersResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total 
       FROM agent_transfers 
       WHERE sender_id = $1 AND currency = $2 AND created_at >= $3 AND status != 'canceled' AND type = 'international'`,
      [userId, currency, today.toISOString()]
    );
    
    const transfersTotal = parseFloat(transfersResult[0]?.total || '0');
    const internationalTotal = parseFloat(internationalResult.rows[0]?.total || '0');
    const agentTransfersTotal = parseFloat(agentTransfersResult.rows[0]?.total || '0');
    
    console.log(`📊 تفاصيل حساب السقف اليومي:`, {
      transfers: transfersTotal,
      international: internationalTotal,
      agentTransfers: agentTransfersTotal,
      total: transfersTotal + internationalTotal + agentTransfersTotal
    });
    
    return transfersTotal + internationalTotal + agentTransfersTotal;
  }

  async getUserMonthlyTransferAmount(userId: number, currency: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    console.log(`🔍 حساب السقف الشهري للمستخدم ${userId} بالعملة ${currency}`);
    
    // حساب التحويلات من جدول transfers (التحويلات العادية)
    const transfersResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transfers.amount}), 0)`
      })
      .from(transfers)
      .where(
        and(
          eq(transfers.senderId, userId),
          eq(transfers.currency, currency),
          eq(transfers.transferKind, 'external'),
          sql`${transfers.createdAt} >= ${startOfMonth.toISOString()}`
        )
      );
    
    // حساب التحويلات من جدول international_transfers (التحويلات الدولية الجديدة)
    const internationalResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total 
       FROM international_transfers 
       WHERE agent_id = $1 AND currency_code = $2 AND created_at >= $3 AND status != 'canceled'`,
      [userId, currency, startOfMonth.toISOString()]
    );
    
    // 🔥 حساب التحويلات من جدول agent_transfers (هذا هو المفقود!)
    const agentTransfersResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total 
       FROM agent_transfers 
       WHERE sender_id = $1 AND currency = $2 AND created_at >= $3 AND status != 'canceled' AND type = 'international'`,
      [userId, currency, startOfMonth.toISOString()]
    );
    
    const transfersTotal = parseFloat(transfersResult[0]?.total || '0');
    const internationalTotal = parseFloat(internationalResult.rows[0]?.total || '0');
    const agentTransfersTotal = parseFloat(agentTransfersResult.rows[0]?.total || '0');
    
    console.log(`📊 تفاصيل حساب السقف الشهري:`, {
      transfers: transfersTotal,
      international: internationalTotal,
      agentTransfers: agentTransfersTotal,
      total: transfersTotal + internationalTotal + agentTransfersTotal
    });
    
    return transfersTotal + internationalTotal + agentTransfersTotal;
  }

  async updateUserExternalTransferSettings(userId: number, settings: {
    extTransferEnabled?: boolean;
    extDailyLimit?: string;
    extMonthlyLimit?: string;
    extAllowedCurrencies?: string[];
    extAllowedCountries?: string[];
  }): Promise<any> {
    const [updated] = await db
      .update(users)
      .set(settings)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        extTransferEnabled: users.extTransferEnabled,
        extDailyLimit: users.extDailyLimit,
        extMonthlyLimit: users.extMonthlyLimit,
        extAllowedCurrencies: users.extAllowedCurrencies,
        extAllowedCountries: users.extAllowedCountries
      });
    return updated;
  }

  // وظائف إدارة الدول
  async getCountries(): Promise<Country[]> {
    return await db.select().from(countries).orderBy(countries.name);
  }

  async getCountryById(id: number): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.id, id));
    return country;
  }

  async getCountryByCode(code: string): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.code, code));
    return country;
  }

  // وظائف إدارة المدن
  async getCities(countryId?: number, search?: string): Promise<City[]> {
    const query = db.select().from(cities);
    
    if (countryId) {
      query.where(eq(cities.countryId, countryId));
    }
    
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      if (countryId) {
        query.where(and(
          eq(cities.countryId, countryId),
          or(
            ilike(cities.nameAr, searchTerm),
            ilike(cities.nameEn, searchTerm)
          )
        ));
      } else {
        query.where(or(
          ilike(cities.nameAr, searchTerm),
          ilike(cities.nameEn, searchTerm)
        ));
      }
    }
    
    return await query.orderBy(cities.nameAr);
  }

  async getCityById(id: number): Promise<City | undefined> {
    const [city] = await db.select().from(cities).where(eq(cities.id, id));
    return city;
  }

  // طلبات ترقية التحويل الخارجي
  async createExternalTransferRequest(request: ExternalTransferRequest): Promise<UpgradeRequest> {
    // التحقق من عدم وجود طلب مُعلق بالفعل
    const existingRequest = await db.select()
      .from(upgradeRequests)
      .where(and(
        eq(upgradeRequests.userId, request.userId),
        eq(upgradeRequests.requestType, "external_transfer"),
        eq(upgradeRequests.status, "pending")
      ));

    if (existingRequest.length > 0) {
      throw new Error("لديك طلب ترقية معلق بالفعل");
    }

    const [created] = await db.insert(upgradeRequests).values(request).returning();
    return created;
  }

  // البحث في طلبات الترقية الخارجية للإدارة
  async getUpgradeRequestsWithDetails(
    type?: "agent_upgrade" | "external_transfer",
    status?: "pending" | "approved" | "rejected"
  ) {
    let query = db.select({
      id: upgradeRequests.id,
      userId: upgradeRequests.userId,
      requestType: upgradeRequests.requestType,
      fullName: upgradeRequests.fullName,
      phone: upgradeRequests.phone,
      city: upgradeRequests.city,
      commissionRate: upgradeRequests.commissionRate,
      countryId: upgradeRequests.countryId,
      cityId: upgradeRequests.cityId,
      cityNameManual: upgradeRequests.cityNameManual,
      message: upgradeRequests.message,
      requestedLimits: upgradeRequests.requestedLimits,
      documents: upgradeRequests.documents,
      status: upgradeRequests.status,
      createdAt: upgradeRequests.createdAt,
      decidedAt: upgradeRequests.decidedAt,
      decidedBy: upgradeRequests.decidedBy,
      reviewNotes: upgradeRequests.reviewNotes,
      userEmail: users.email,
    })
    .from(upgradeRequests)
    .leftJoin(users, eq(upgradeRequests.userId, users.id));

    // Apply filters
    const conditions = [];
    
    if (type) {
      conditions.push(eq(upgradeRequests.requestType, type));
    }
    
    if (status) {
      conditions.push(eq(upgradeRequests.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const results = await query.orderBy(desc(upgradeRequests.createdAt));
    
    // Convert the results to ensure proper data types and handle nulls
    return results.map(result => ({
      ...result,
      userEmail: result.userEmail || 'غير معروف',
      requestedLimits: result.requestedLimits || null,
      documents: result.documents || null,
    }));
  }

  // وظائف السجلات الأمنية
  async addSecurityLog(logData: any): Promise<any> {
    try {
      const [securityLog] = await db.insert(securityLogs).values({
        email: logData.email,
        username: logData.username,
        eventType: logData.eventType,
        fingerprint: logData.fingerprint,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        country: logData.country,
        city: logData.city,
        platform: logData.platform,
        language: logData.language,
        screen: logData.screen,
        timezone: logData.timezone,
        attempts: logData.attempts,
        imageFilename: logData.imageFilename,
        blocked: logData.blocked,
        reportType: logData.reportType,
        metadata: logData.metadata || {},
      }).returning();
      
      return securityLog;
    } catch (error) {
      console.error('Failed to add security log:', error);
      throw error;
    }
  }

  async getSecurityLogs(filters?: { limit?: number; offset?: number; startDate?: Date; endDate?: Date }): Promise<any[]> {
    try {
      let query = db.select().from(securityLogs);
      
      if (filters?.startDate && filters?.endDate) {
        query = query.where(and(
          gte(securityLogs.createdAt, filters.startDate),
          lte(securityLogs.createdAt, filters.endDate)
        ));
      }
      
      const logs = await query
        .orderBy(desc(securityLogs.createdAt))
        .limit(filters?.limit || 100)
        .offset(filters?.offset || 0);
      
      return logs;
    } catch (error) {
      console.error('Failed to get security logs:', error);
      throw error;
    }
  }

  async deleteSecurityLog(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ حذف السجل الأمني ID: ${id} من قاعدة البيانات...`);
      
      const result = await db.delete(securityLogs)
        .where(eq(securityLogs.id, id))
        .returning({ id: securityLogs.id });
      
      const deleted = result.length > 0;
      if (deleted) {
        console.log(`✅ تم حذف السجل الأمني ID: ${id} بنجاح`);
      } else {
        console.log(`❌ لم يتم العثور على السجل الأمني ID: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      console.error('Failed to delete security log:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();