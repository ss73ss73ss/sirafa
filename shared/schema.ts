import { pgTable, text, serial, integer, boolean, timestamp, numeric, unique, check, json, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users: any = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  officeName: text("office_name").notNull(), // اسم المكتب - حقل ملزم
  officeAddress: text("office_address"), // عنوان المكتب
  countryId: integer("country_id").references(() => countries.id),
  countryName: text("country_name"),
  cityId: integer("city_id").references(() => cities.id),
  cityName: text("city_name"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  accountNumber: text("account_number").unique(), // رقم الحساب الفريد للمستخدم
  password: text("password").notNull(),
  type: text("type").notNull().default("user"), // "user", "office", "agent", "admin"
  adminLevel: integer("admin_level").default(0), // 0: عادي، 1: مدير نظام محدود، 2: مدير عام
  // صلاحيات الإدارة التفصيلية
  canManageUsers: boolean("can_manage_users").default(false), // إدارة المستخدمين
  canManageMarket: boolean("can_manage_market").default(false), // مراقبة صفحة السوق
  canManageChat: boolean("can_manage_chat").default(false), // مراقبة الدردشة
  canManageInternalTransfers: boolean("can_manage_internal_transfers").default(false), // التحويل الداخلي
  canManageExternalTransfers: boolean("can_manage_external_transfers").default(false), // التحويل الخارجي
  canManageNewAccounts: boolean("can_manage_new_accounts").default(false), // الحسابات الجديدة
  canManageSecurity: boolean("can_manage_security").default(false), // الدخول المشبوه والأمان
  canManageSupport: boolean("can_manage_support").default(false), // الرد على الاستفسارات
  canManageReports: boolean("can_manage_reports").default(false), // التقارير والإحصائيات
  canManageSettings: boolean("can_manage_settings").default(false), // إعدادات النظام
  // نظام الإحالة
  referralCode: text("referral_code").unique(), // رمز الإحالة الفريد للمستخدم
  referredBy: integer("referred_by").references(() => users.id), // المستخدم الذي أحال هذا المستخدم
  referredAt: timestamp("referred_at"), // تاريخ الإحالة
  city: text("city"), // المدينة التي يتبع لها المكتب
  commissionRate: numeric("commission_rate").default("1"), // نسبة العمولة التي يحصل عليها المكتب (النسبة المئوية)
  countriesSupported: text("countries_supported").array(), // الدول التي يدعمها المكتب للحوالات الدولية
  verified: boolean("verified").default(false), // حالة توثيق الحساب
  active: boolean("active").default(true), // حالة تفعيل الحساب
  avatarUrl: text("avatar_url"), // صورة الملف الشخصي
  // أعمدة التحويل الخارجي الجديدة
  extTransferEnabled: boolean("ext_transfer_enabled").default(false), // مفعّل/غير مفعّل
  extDailyLimit: numeric("ext_daily_limit").default("0"), // حد يومي
  extMonthlyLimit: numeric("ext_monthly_limit").default("0"), // حد شهري
  extAllowedCurrencies: text("ext_allowed_currencies").array().default([]), // عملات مسموحة
  extAllowedCountries: text("ext_allowed_countries").array().default([]), // دول مسموحة (ISO-2)
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  language: text("language").default("ar"), // ar, en
  theme: text("theme").default("auto"), // light, dark, auto
  timezone: text("timezone").default("Africa/Tripoli"),
  baseCurrency: text("base_currency").default("LYD"),
  notifications: json("notifications").default({
    email: true,
    push: true,
    security: true,
    marketing: false
  }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول المصادقة الثنائية
export const user2FA = pgTable("user_2fa", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  isEnabled: boolean("is_enabled").default(false), // حالة تفعيل المصادقة الثنائية
  secret: text("secret"), // المفتاح السري للـ TOTP
  backupCodes: text("backup_codes").array().default([]), // رموز النسخ الاحتياطي (10 رموز)
  lastUsedAt: timestamp("last_used_at"), // آخر استخدام للمصادقة الثنائية
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول المعاملات الموحد الجديد للأدمن
export const adminTransactions: any = pgTable("admin_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  refNo: text("ref_no").notNull().unique(), // رقم مرجعي فريد
  type: text("type").notNull(), // INTERNAL_TRANSFER, SALE, PURCHASE, EXTERNAL_REMIT, OFFICE_REMIT, DEPOSIT, WITHDRAW, FEE, ADJUSTMENT
  status: text("status").notNull().default("PENDING"), // PENDING, SUCCESS, FAILED, CANCELLED, REVERSED, ON_HOLD
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  executedAt: timestamp("executed_at"),
  fromAccountId: text("from_account_id"),
  toAccountId: text("to_account_id"),
  userId: integer("user_id").notNull().references(() => users.id),
  officeId: integer("office_id"),
  cityFrom: text("city_from"),
  cityTo: text("city_to"),
  currency: text("currency").notNull(),
  amount: numeric("amount").notNull(),
  rate: numeric("rate"),
  feeSystem: numeric("fee_system"),
  feeRecipient: numeric("fee_recipient"),
  netAmount: numeric("net_amount").notNull(),
  channel: text("channel").notNull().default("WEB"), // WEB, MOBILE, DESKTOP, API
  createdBy: integer("created_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  kycLevel: integer("kyc_level"),
  riskScore: integer("risk_score"),
  flags: json("flags"),
  parentTxnId: uuid("parent_txn_id").references(() => adminTransactions.id),
  externalProvider: text("external_provider"),
  externalRef: text("external_ref"),
  notes: text("notes"),
  meta: json("meta")
}, (table) => ({
  refNoIdx: index("admin_transactions_ref_no_idx").on(table.refNo),
  typeCreatedAtIdx: index("admin_transactions_type_created_at_idx").on(table.type, table.createdAt),
  statusCreatedAtIdx: index("admin_transactions_status_created_at_idx").on(table.status, table.createdAt),
  userIdCreatedAtIdx: index("admin_transactions_user_id_created_at_idx").on(table.userId, table.createdAt),
  fromAccountIdIdx: index("admin_transactions_from_account_id_idx").on(table.fromAccountId),
  toAccountIdIdx: index("admin_transactions_to_account_id_idx").on(table.toAccountId),
  executedAtIdx: index("admin_transactions_executed_at_idx").on(table.executedAt)
}));

// جدول المعاملات الأصلي (للتوافق مع النظام الحالي)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "exchange", "transfer", "receive"
  amount: text("amount").notNull(),
  currency: text("currency").notNull(),
  description: text("description"),
  referenceNumber: text("reference_number"), // الرقم المرجعي للمعاملة
  date: timestamp("date").defaultNow(),
});

export const balances = pgTable("balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  currency: text("currency").notNull(),
  amount: numeric("amount").notNull().default("0"),
}, (table) => {
  return {
    userCurrencyUnique: unique().on(table.userId, table.currency),
  }
});

export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  amount: numeric("amount").notNull(),
  commission: numeric("commission").notNull(),
  currency: text("currency").notNull().default("LYD"),
  referenceNumber: text("reference_number").unique(), // رقم مرجعي فريد للتحويل
  note: text("note"),
  transferKind: text("transfer_kind").notNull().default("internal"), // "internal", "external"
  destinationCountry: text("destination_country"), // الدولة المقصودة للتحويل الخارجي
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول سجل التحويلات الداخلية للمدير
export const internalTransferLogs = pgTable("internal_transfer_logs", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").notNull().references(() => transfers.id),
  referenceNumber: text("reference_number"), // الرقم المرجعي للتحويل
  senderName: text("sender_name").notNull(),
  senderAccountNumber: text("sender_account_number").notNull(),
  receiverName: text("receiver_name").notNull(),
  receiverAccountNumber: text("receiver_account_number").notNull(),
  amount: numeric("amount").notNull(),
  commission: numeric("commission").notNull(),
  currency: text("currency").notNull(),
  note: text("note"),
  status: text("status").notNull().default("completed"), // completed, failed
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول المدن
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").notNull().references(() => countries.id),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  isActive: boolean("is_active").notNull().default(true),
});

export const upgradeRequests = pgTable("upgrade_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  requestType: text("request_type").notNull(), // "external_transfer", "agent_upgrade"
  fullName: text("full_name"),
  phone: text("phone"),
  city: text("city"), // يُستخدم لطلب "agent_upgrade" فقط
  commissionRate: numeric("commission_rate").default("0"), // يُستخدم لطلب "agent_upgrade" فقط
  // حقول التحويل الخارجي الجديدة
  countryId: integer("country_id").references(() => countries.id),
  cityId: integer("city_id").references(() => cities.id),
  cityNameManual: text("city_name_manual"), // إذا كتب المدينة يدوياً
  message: text("message"),
  requestedLimits: json("requested_limits"), // { "daily": 5000, "monthly": 20000, "currencies": ["USD","EUR"], "countries": ["TN","TR"] }
  documents: json("documents"), // مفاتيح مرفقات/روابط تحقق
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
  decidedAt: timestamp("decided_at"),
  decidedBy: integer("decided_by").references(() => users.id),
  reviewNotes: text("review_notes"),
});

// جداول السوق المباشر للتداول
export const marketChannels = pgTable("market_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketOffers = pgTable("market_offers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  side: text("side").notNull(), // "buy", "sell"
  baseCurrency: text("base_currency").notNull(),
  quoteCurrency: text("quote_currency").notNull(),
  price: numeric("price", { precision: 15, scale: 6 }).notNull(),
  minAmount: numeric("min_amount", { precision: 15, scale: 2 }).notNull(),
  maxAmount: numeric("max_amount", { precision: 15, scale: 2 }).notNull(),
  remainingAmount: numeric("remaining_amount", { precision: 15, scale: 2 }).notNull(),
  city: text("city"),
  deliverType: text("deliver_type").default("internal_transfer"),
  terms: text("terms"),
  status: text("status").default("open"), // "open", "partial", "filled", "cancelled"
  commissionDeducted: boolean("commission_deducted").default(false), // تتبع إذا تم خصم العمولة مرة واحدة فقط
  expiresAt: timestamp("expires_at"), // موعد انتهاء العرض
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketBids = pgTable("market_bids", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull().references(() => marketOffers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  price: numeric("price", { precision: 15, scale: 6 }).notNull(),
  message: text("message"),
  status: text("status").default("pending"), // "pending", "accepted", "rejected", "expired"
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const marketDeals = pgTable("market_deals", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull().references(() => marketOffers.id),
  bidId: integer("bid_id").references(() => marketBids.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  price: numeric("price", { precision: 15, scale: 6 }).notNull(),
  totalValue: numeric("total_value", { precision: 15, scale: 2 }).notNull(),
  baseCurrency: text("base_currency").notNull(),
  quoteCurrency: text("quote_currency").notNull(),
  status: text("status").default("pending"), // "pending", "paid", "confirmed", "disputed", "completed", "cancelled"
  escrowReleased: boolean("escrow_released").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const marketMessages = pgTable("market_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").default(1).references(() => marketChannels.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").default("MESSAGE"), // "MESSAGE", "OFFER", "BID", "DEAL", "SYSTEM"
  content: text("content").notNull(),
  offerId: integer("offer_id").references(() => marketOffers.id),
  bidId: integer("bid_id").references(() => marketBids.id),
  dealId: integer("deal_id").references(() => marketDeals.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketTransactions = pgTable("market_transactions", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  offerId: integer("offer_id").notNull().references(() => marketOffers.id),
  amount: numeric("amount").notNull(),
  totalCost: numeric("total_cost").notNull(),
  commission: numeric("commission").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول حوالات المدن (بين مكاتب الصرافة)
export const cityTransfers = pgTable("city_transfers", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverOfficeId: integer("receiver_office_id").notNull().references(() => users.id),
  recipientName: text("recipient_name"), // اسم المستلم
  amount: numeric("amount").notNull(),
  commissionForReceiver: numeric("commission_for_receiver").notNull(),
  commissionForSystem: numeric("commission_for_system").notNull(),
  currency: text("currency").notNull().default("LYD"),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, completed, canceled
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// جدول الحوالات الدولية الجديد - نظام التجميد والخصم
export const internationalTransfersNew = pgTable("international_transfers_new", {
  id: serial("id").primaryKey(),
  senderAgentId: integer("sender_agent_id").notNull().references(() => users.id),
  receiverOfficeId: integer("receiver_office_id").notNull().references(() => users.id),
  currencyCode: text("currency_code").notNull(),
  amountOriginal: numeric("amount_original").notNull(), // المبلغ الأصلي
  commissionSystem: numeric("commission_system").notNull(), // عمولة النظام
  commissionRecipient: numeric("commission_recipient").notNull(), // عمولة المستلم
  amountPending: numeric("amount_pending").notNull(), // المبلغ المجمد بعد خصم العمولات
  status: text("status").notNull().default("pending"), // pending, completed, refunded
  transferCode: text("transfer_code").notNull().unique(), // رمز التحويل
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// جدول الحوالات الدولية القديم (للتوافق مع النظام الحالي)
export const internationalTransfers = pgTable("international_transfers", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverOfficeId: integer("receiver_office_id").notNull().references(() => users.id),
  sendingCountry: text("sending_country").notNull(),
  receivingCountry: text("receiving_country").notNull(),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  commissionForReceiver: numeric("commission_for_receiver").notNull(),
  commissionForSystem: numeric("commission_for_system").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, completed, canceled
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// جدول الحوالات المالية الخاصة بمكاتب الصرافة (داخلية ودولية)
// جدول عمولات المكاتب حسب المدن
export const officeCommissions = pgTable("office_commissions", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").notNull().references(() => users.id),
  city: text("city").notNull(),
  commissionRate: numeric("commission_rate").notNull(),
}, (table) => {
  return {
    uniqueOfficeCity: unique().on(table.officeId, table.city)
  };
});

// جدول عمولات المكاتب حسب الدول
export const officeCountryCommissions = pgTable("office_country_commissions", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").notNull().references(() => users.id),
  country: text("country").notNull(),
  commissionRate: numeric("commission_rate").notNull(),
}, (table) => {
  return {
    uniqueOfficeCountry: unique().on(table.officeId, table.country)
  };
});

// جدول إعدادات الإدارة
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// جدول إشعارات المستخدمين
export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body"),
  type: text("type").notNull().default("info"), // info, warning, success, error, system
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// جدول طلبات توثيق الحسابات
export const verificationRequests = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  idPhotoUrl: text("id_photo_url").notNull(),
  proofOfAddressUrl: text("proof_of_address_url").notNull(),
  status: text("status").notNull().default("pending"), // pending / approved / rejected
  notes: text("notes"), // ملاحظات الرفض أو القبول
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const agentTransfers = pgTable("agent_transfers", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id"), // قد يكون فارغًا في حالة الحوالة التي تنتظر الاستلام (الكود)
  agentId: integer("agent_id").notNull().references(() => users.id), // مكتب الصرافة الذي أنشأ الحوالة
  destinationAgentId: integer("destination_agent_id").references(() => users.id), // مكتب الصرافة المستلم (اختياري)
  amount: numeric("amount").notNull(),
  commission: numeric("commission").notNull(),
  currency: text("currency").notNull(),
  transferCode: text("transfer_code"), // كود الحوالة للاستلام
  note: text("note"),
  status: text("status").notNull().default("pending"), // "pending", "completed", "canceled"
  type: text("type").notNull(), // "local" للحوالات الداخلية، "international" للحوالات الدولية
  country: text("country"), // الدولة المرسل إليها (للحوالات الدولية)
  city: text("city"), // المدينة المرسل إليها
  recipientName: text("recipient_name").notNull(), // اسم المستلم
  recipientPhone: text("recipient_phone"), // رقم هاتف المستلم (اختياري)
  recipientId: text("recipient_id"), // رقم هوية المستلم (اختياري)
  // حقول نظام التجميد والخصم الجديد
  amountOriginal: numeric("amount_original"), // المبلغ الأصلي قبل العمولات
  commissionSystem: numeric("commission_system"), // عمولة النظام
  commissionRecipient: numeric("commission_recipient"), // عمولة المكتب المستلم
  amountPending: numeric("amount_pending"), // المبلغ المجمد (المبلغ الأصلي ناقص عمولة النظام)
  receiverCode: text("receiver_code"), // رمز المستلم (6 أرقام)
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// جدول سجل المعاملات المالية الموحد - لنظام كشف الحساب
export const transactionLogs = pgTable("transaction_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  ts: timestamp("ts").defaultNow().notNull(), // الطابع الزمني
  type: text("type").notNull(), // deposit, withdrawal, internal_transfer_sent, internal_transfer_received, office_remit, market_trade_buy, market_trade_sell, external_payment, fee
  currency: text("currency").notNull(),
  amount: numeric("amount", { precision: 18, scale: 4 }).notNull(),
  commission: numeric("commission", { precision: 18, scale: 4 }).default("0"),
  direction: text("direction").notNull(), // 'debit' أو 'credit'
  counterparty: text("counterparty"), // الطرف الآخر في المعاملة
  ref: text("ref"), // المرجع أو الكود
  referenceNumber: text("reference_number"), // الرقم المرجعي للمعاملة
  status: text("status").notNull().default("completed"), // pending, completed, failed
  note: text("note"),
  // معرفات مرجعية للجداول الأخرى
  transferId: integer("transfer_id").references(() => transfers.id),
  cityTransferId: integer("city_transfer_id").references(() => cityTransfers.id),
  agentTransferId: integer("agent_transfer_id").references(() => agentTransfers.id),
  marketTransactionId: integer("market_transaction_id").references(() => marketTransactions.id),
  internationalTransferId: integer("international_transfer_id").references(() => internationalTransfers.id),
  // بيانات إضافية كـ JSON
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول أسعار الصرف التاريخية
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
}, (table) => {
  return {
    uniqueCurrencyPair: unique().on(table.fromCurrency, table.toCurrency, table.fetchedAt)
  };
});

// جدول وظائف التصدير
export const exportJobs = pgTable("export_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'statement_pdf', 'statement_excel'
  status: text("status").notNull().default("pending"), // pending, processing, ready, failed
  params: json("params").notNull(), // معاملات الطلب
  filePath: text("file_path"), // مسار الملف المُصدر
  downloadUrl: text("download_url"), // رابط التحميل
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  fullName: true,
  officeName: true,
  officeAddress: true,
  countryId: true,
  countryName: true,
  cityId: true,
  cityName: true,
  email: true,
  phone: true,
  accountNumber: true,
  password: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  type: true,
  amount: true,
  currency: true,
  description: true,
  referenceNumber: true,
});

export const insertBalanceSchema = createInsertSchema(balances).pick({
  userId: true,
  currency: true,
  amount: true,
});

export const insertTransferSchema = createInsertSchema(transfers).pick({
  senderId: true,
  receiverId: true,
  amount: true,
  commission: true,
  currency: true,
  note: true,
});

export const insertUpgradeRequestSchema = createInsertSchema(upgradeRequests).pick({
  userId: true,
  fullName: true,
  phone: true,
  city: true,
  commissionRate: true,
  message: true,
});

// Add missing properties to market offers that the frontend expects
export const insertMarketOfferSchema = createInsertSchema(marketOffers).extend({
  // Legacy properties expected by frontend
  offerType: z.enum(["buy", "sell"]).optional(),
  fromCurrency: z.string().optional(),
  toCurrency: z.string().optional(),
  rate: z.string().optional(),
  amount: z.string().optional(),
  available: z.string().optional(),
  // Add expiration hours for UI input
  expirationHours: z.number().min(1).max(720).optional(), // من ساعة إلى 30 يوم
}).pick({
  userId: true,
  side: true,
  baseCurrency: true,
  quoteCurrency: true,
  price: true,
  minAmount: true,
  maxAmount: true,
  remainingAmount: true,
  city: true,
  deliverType: true,
  terms: true,
  expiresAt: true,
  offerType: true,
  fromCurrency: true,
  toCurrency: true,
  rate: true,
  amount: true,
  available: true,
  expirationHours: true,
});

export const insertMarketTransactionSchema = createInsertSchema(marketTransactions).pick({
  buyerId: true,
  offerId: true,
  amount: true,
  totalCost: true,
  commission: true,
});

export const insertCityTransferSchema = createInsertSchema(cityTransfers).pick({
  senderId: true,
  receiverOfficeId: true,
  amount: true,
  commissionForReceiver: true,
  commissionForSystem: true,
  currency: true,
  code: true,
  status: true,
});

// نموذج إدخال الحوالات الدولية
export const insertInternationalTransferSchema = createInsertSchema(internationalTransfers).pick({
  senderId: true,
  receiverOfficeId: true,
  sendingCountry: true,
  receivingCountry: true,
  amount: true,
  currency: true,
  commissionForReceiver: true,
  commissionForSystem: true,
  code: true,
  note: true,
});

// نموذج إدخال الحوالات الدولية الجديد - نظام التجميد والخصم
export const insertInternationalTransferNewSchema = createInsertSchema(internationalTransfersNew).pick({
  senderAgentId: true,
  receiverOfficeId: true,
  currencyCode: true,
  amountOriginal: true,
  commissionSystem: true,
  commissionRecipient: true,
  amountPending: true,
  transferCode: true,
  note: true,
});

export const insertAgentTransferSchema = createInsertSchema(agentTransfers).pick({
  senderId: true,
  receiverId: true,
  agentId: true,
  destinationAgentId: true,
  amount: true,
  commission: true,
  currency: true,
  transferCode: true,
  note: true,
  status: true,
  type: true,
  country: true,
  city: true,
  recipientName: true,
  recipientPhone: true,
  recipientId: true,
  amountOriginal: true,
  commissionSystem: true,
  commissionRecipient: true,
  amountPending: true,
  receiverCode: true,
});

export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).pick({
  userId: true,
  idPhotoUrl: true,
  proofOfAddressUrl: true,
  status: true,
});

// Base type exports for database tables
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Balance = typeof balances.$inferSelect;
export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type UpgradeRequest = typeof upgradeRequests.$inferSelect;
export type InsertUpgradeRequest = z.infer<typeof insertUpgradeRequestSchema>;

// Market offer enhanced type for frontend
export interface MarketOfferEnhanced extends MarketOffer {
  offerType: "buy" | "sell";
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  amount: string;
  available: string;
  userFullName: string;
}

export const insertTransactionLogSchema = createInsertSchema(transactionLogs).pick({
  userId: true,
  ts: true,
  type: true,
  currency: true,
  amount: true,
  commission: true,
  direction: true,
  counterparty: true,
  ref: true,
  referenceNumber: true,
  status: true,
  note: true,
  transferId: true,
  cityTransferId: true,
  agentTransferId: true,
  marketTransactionId: true,
  internationalTransferId: true,
  metadata: true,
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).pick({
  fromCurrency: true,
  toCurrency: true,
  rate: true,
  fetchedAt: true,
});

export const insertExportJobSchema = createInsertSchema(exportJobs).pick({
  userId: true,
  type: true,
  params: true,
});

// Additional types for transaction logs and other tables
export type TransactionLog = typeof transactionLogs.$inferSelect;
export type InsertTransactionLog = z.infer<typeof insertTransactionLogSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type ExportJob = typeof exportJobs.$inferSelect;
export type InsertExportJob = z.infer<typeof insertExportJobSchema>;

// أنواع البيانات للمعاملات الموحدة
export type AdminTransaction = typeof adminTransactions.$inferSelect;
export type InsertAdminTransaction = typeof adminTransactions.$inferInsert;

export const upgradeRequestSchema = z.object({
  fullName: z.string().min(3, { message: "يجب أن يكون الاسم أكثر من 3 أحرف" }),
  phone: z.string().min(10, { message: "يجب أن يكون رقم الهاتف صحيحًا" }),
  city: z.string().min(2, { message: "يرجى إدخال اسم المدينة" }),
  message: z.string().optional(),
});

export const verificationRequestSchema = z.object({
  idPhotoUrl: z.string().min(1, { message: "يجب رفع صورة الهوية" }),
  proofOfAddressUrl: z.string().min(1, { message: "يجب رفع إثبات العنوان" }),
});

export const marketOfferSchema = z.object({
  side: z.enum(["sell", "buy"], {
    errorMap: () => ({ message: "نوع العرض يجب أن يكون بيع أو شراء" })
  }),
  baseCurrency: z.string().min(1, { message: "يجب اختيار العملة المصدر" }),
  quoteCurrency: z.string().min(1, { message: "يجب اختيار العملة الهدف" }),
  minAmount: z.string().or(z.number())
    .transform(val => Number(val))
    .refine(val => val > 0, { 
      message: "يجب أن تكون الكمية الدنيا أكبر من صفر" 
    }),
  maxAmount: z.string().or(z.number())
    .transform(val => Number(val))
    .refine(val => val > 0, { 
      message: "يجب أن تكون الكمية العليا أكبر من صفر" 
    }),
  price: z.string().or(z.number())
    .transform(val => Number(val))
    .refine(val => val > 0, { 
      message: "يجب أن يكون سعر الصرف أكبر من صفر" 
    }),
  expirationMinutes: z.number()
    .min(5, { message: "يجب أن تكون المدة 5 دقائق على الأقل" })
    .max(43200, { message: "لا يمكن أن تتجاوز المدة 30 يوماً" })
    .optional(),
  city: z.string().optional(),
  deliverType: z.string().optional(),
  terms: z.string().optional(),
}).refine(data => Number(data.minAmount) <= Number(data.maxAmount), {
  message: "الكمية الدنيا يجب أن تكون أقل من أو تساوي الكمية العليا",
  path: ["minAmount"]
});

export const transferSchema = z.object({
  receiver: z.string().min(1, { message: "يجب إدخال رقم حساب المستلم أو رقم الهاتف" }),
  amount: z.string().or(z.number()).refine(val => Number(val) > 0, {
    message: "يجب أن يكون المبلغ أكبر من صفر"
  }),
  note: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  fingerprint: z.string().optional(),
  userAgent: z.string().optional(),
  platform: z.string().optional(),
  language: z.string().optional(),
  screen: z.string().optional(),
  timezone: z.string().optional(),
  timestamp: z.string().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type UpgradeRequestInput = z.infer<typeof upgradeRequestSchema>;
// Market type aliases
export type MarketChannel = typeof marketChannels.$inferSelect;
export type MarketBid = typeof marketBids.$inferSelect;
export type MarketDeal = typeof marketDeals.$inferSelect;
export type MarketMessage = typeof marketMessages.$inferSelect;

export type InsertMarketChannel = typeof marketChannels.$inferInsert;
export type InsertMarketOffer = typeof marketOffers.$inferInsert;
export type InsertMarketBid = typeof marketBids.$inferInsert;
export type InsertMarketDeal = typeof marketDeals.$inferInsert;
export type InsertMarketMessage = typeof marketMessages.$inferInsert;

// للتوافق مع النظام القديم
export type MarketOfferInput = z.infer<typeof marketOfferSchema>;
export type MarketTransaction = typeof marketTransactions.$inferSelect;
export type InsertMarketTransaction = z.infer<typeof insertMarketTransactionSchema>;

// Base market offer type
export type MarketOffer = typeof marketOffers.$inferSelect;

// Enhanced types for frontend compatibility
export interface MarketOfferEnhanced extends MarketOffer {
  userFullName: string;
  // Legacy field mappings for frontend compatibility
  offerType: "buy" | "sell";
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  amount: string;
  available: string;
}

export interface MarketOfferChat {
  id: number;
  userId: number;
  side: string;
  baseCurrency: string;
  quoteCurrency: string;
  price: string;
  minAmount: string;
  maxAmount: string;
  remainingAmount: string;
  city?: string | null;
  deliverType?: string | null;
  terms?: string | null;
  status?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  userFullName?: string;
  userName?: string;
  userType?: string;
  // Legacy field mappings for frontend compatibility
  offerType: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  amount: string;
  available: string;
}
export type AgentTransfer = typeof agentTransfers.$inferSelect;
export type InsertAgentTransfer = z.infer<typeof insertAgentTransferSchema>;
export type CityTransfer = typeof cityTransfers.$inferSelect;
export type InsertCityTransfer = z.infer<typeof insertCityTransferSchema>;

export type InternationalTransfer = typeof internationalTransfers.$inferSelect;
export type InsertInternationalTransfer = z.infer<typeof insertInternationalTransferSchema>;
export type InternationalTransferNew = typeof internationalTransfersNew.$inferSelect;
export type InsertInternationalTransferNew = z.infer<typeof insertInternationalTransferNewSchema>;

// نماذج الدردشة
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => chatRooms.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  voiceId: text("voice_id"), // معرف الرسالة الصوتية
  voiceDuration: integer("voice_duration"), // مدة الرسالة الصوتية بالثواني
  createdAt: timestamp("created_at").defaultNow(),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  deletedBy: integer("deleted_by"),
  deletedAt: timestamp("deleted_at")
});

// جدول إعجابات الرسائل
export const messageLikes = pgTable("message_likes", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => chatMessages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  // فهرس فريد لضمان عدم إعجاب المستخدم بنفس الرسالة أكثر من مرة
  uniqueUserMessage: unique().on(table.messageId, table.userId),
}));

// جدول سجلات قراءة رسائل الدردشة العامة
export const chatMessageReads = pgTable("chat_message_reads", {
  messageId: integer("message_id").notNull().references(() => chatMessages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  readAt: timestamp("read_at").defaultNow(),
}, (table) => {
  return {
    messageUserUnique: unique().on(table.messageId, table.userId)
  };
});

// جداول الدردشة الخاصة (1 إلى 1)
export const privateChats = pgTable("private_chats", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    usersPair: unique().on(table.user1Id, table.user2Id)
  }
});

export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => privateChats.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  voiceId: text("voice_id"), // معرف الرسالة الصوتية
  voiceDuration: integer("voice_duration"), // مدة الرسالة الصوتية بالثواني
  isRead: boolean("is_read").default(false),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  deletedBy: integer("deleted_by"),
  deletedAt: timestamp("deleted_at"),
  // حقول إعادة التوجيه
  isForwarded: boolean("is_forwarded").default(false),
  originalSenderId: integer("original_sender_id").references(() => users.id),
  forwardedFromSender: text("forwarded_from_sender") // اسم المرسل الأصلي
});

// جداول محادثات المجموعات (Group Chats)
export const groupChats = pgTable("group_chats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});

// جدول أعضاء المجموعات
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupChats.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").default("member"), // member / admin / owner
  mutedUntil: timestamp("muted_until"), // null = غير مكتوم، وقت = مكتوم حتى هذا التاريخ
  isBanned: boolean("is_banned").default(false), // نظام الحظر الجديد
  bannedBy: integer("banned_by").references(() => users.id), // مَن قام بالحظر
  bannedAt: timestamp("banned_at"), // وقت الحظر
  banReason: text("ban_reason"), // سبب الحظر
  joinedAt: timestamp("joined_at").defaultNow()
}, (table) => {
  return {
    userGroupUnique: unique().on(table.groupId, table.userId)
  };
});

// جدول رسائل المجموعات
export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupChats.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  createdAt: timestamp("created_at").defaultNow(),
  editedAt: timestamp("edited_at"),
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  deletedForUsers: integer("deleted_for_users").array()
});

// إنشاء مخططات Zod
export const insertChatRoomSchema = createInsertSchema(chatRooms);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertPrivateChatSchema = createInsertSchema(privateChats).omit({
  lastMessageAt: true,
  createdAt: true
});
export const insertPrivateMessageSchema = createInsertSchema(privateMessages).omit({
  createdAt: true
});

// أنواع TypeScript
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type PrivateChat = typeof privateChats.$inferSelect;
export type InsertPrivateChat = z.infer<typeof insertPrivateChatSchema>;
export type PrivateMessage = typeof privateMessages.$inferSelect;
export type InsertPrivateMessage = z.infer<typeof insertPrivateMessageSchema>;

// مخطط إدخال إعجابات الرسائل
export const insertMessageLikeSchema = createInsertSchema(messageLikes).omit({
  id: true,
  createdAt: true,
});

export type MessageLike = typeof messageLikes.$inferSelect;
export type InsertMessageLike = z.infer<typeof insertMessageLikeSchema>;

// مخططات محادثات المجموعات
export const insertGroupChatSchema = createInsertSchema(groupChats).omit({
  id: true,
  createdAt: true
});

// Types for GroupChat
export type GroupChat = typeof groupChats.$inferSelect;
export type InsertGroupChat = z.infer<typeof insertGroupChatSchema>;
export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
  mutedUntil: true,
  isBanned: true,
  bannedBy: true,
  bannedAt: true,
  banReason: true
});

// Types for GroupMember
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export const insertGroupMessageSchema = createInsertSchema(groupMessages).omit({
  id: true,
  createdAt: true
});

// أنواع محادثات المجموعات  
export type GroupMessage = typeof groupMessages.$inferSelect;
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;

export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;

export const insertOfficeCommissionSchema = createInsertSchema(officeCommissions).pick({
  officeId: true,
  city: true,
  commissionRate: true,
});

// مخطط إدخال عمولات المكاتب حسب الدول
export const insertOfficeCountryCommissionSchema = createInsertSchema(officeCountryCommissions).pick({
  officeId: true,
  country: true,
  commissionRate: true,
});

// مخطط إدخال إعدادات الإدارة
export const insertAdminSettingSchema = createInsertSchema(adminSettings).pick({
  key: true,
  value: true,
  description: true,
});

export type OfficeCommission = typeof officeCommissions.$inferSelect;
export type InsertOfficeCommission = z.infer<typeof insertOfficeCommissionSchema>;

export type OfficeCountryCommission = typeof officeCountryCommissions.$inferSelect;
export type InsertOfficeCountryCommission = z.infer<typeof insertOfficeCountryCommissionSchema>;

export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;

// مخطط إدخال الإشعارات
export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({
  id: true,
  createdAt: true,
});

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;

// نموذج إدخال البيانات للحوالات بين المدن
export const cityTransferSchema = z.object({
  receiverOfficeId: z.number().int().positive({ message: "يرجى اختيار مكتب الصرافة المستلم" }),
  amount: z.string().or(z.number())
    .transform(val => Number(val))
    .refine(val => val > 0, { 
      message: "يجب أن يكون المبلغ أكبر من صفر" 
    }),
  currency: z.string().default("LYD"),
});

// Agent commission settings table
export const agentCommissions = pgTable("agent_commissions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  currencyCode: text("currency_code").notNull(),
  type: text("type").notNull(), // 'percentage' or 'fixed'
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AgentCommission = typeof agentCommissions.$inferSelect;
export type InsertAgentCommission = typeof agentCommissions.$inferInsert;

export const insertAgentCommissionSchema = createInsertSchema(agentCommissions, {
  agentId: z.number().int().positive(),
  currencyCode: z.string().min(2).max(10),
  type: z.enum(['percentage', 'fixed']),
  value: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "يجب أن تكون القيمة رقماً موجباً"),
});

// جدول شرائح عمولات الحوالات بين المدن
export const cityTransferCommissions = pgTable("city_transfer_commissions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => users.id),
  originCity: text("origin_city"),
  destinationCity: text("destination_city"),
  minAmount: text("min_amount").notNull(),
  maxAmount: text("max_amount"), // nullable للشريحة المفتوحة
  commission: text("commission"), // nullable إذا كانت النسبة في الألف محددة
  perMilleRate: text("per_mille_rate"), // نسبة في الألف
  currencyCode: text("currency_code").notNull().default("LYD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CityTransferCommission = typeof cityTransferCommissions.$inferSelect;
export type InsertCityTransferCommission = typeof cityTransferCommissions.$inferInsert;

export const insertCityTransferCommissionSchema = createInsertSchema(cityTransferCommissions, {
  agentId: z.number().int().positive(),
  minAmount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "يجب أن يكون المبلغ الأدنى رقماً صحيحاً"),
  maxAmount: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "يجب أن يكون المبلغ الأقصى رقماً موجباً"),
  commission: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "يجب أن تكون العمولة رقماً موجباً"),
  perMilleRate: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "يجب أن تكون النسبة في الألف رقماً موجباً"),
  currencyCode: z.string().min(2).max(10),
});

// Commission pool transactions table
export const commissionPoolTransactions = pgTable("commission_pool_transactions", {
  id: serial("id").primaryKey(),
  sourceType: text("source_type").notNull(), // 'agent', 'user', 'system'
  sourceId: integer("source_id"), // معرف الوكيل أو المستخدم
  sourceName: text("source_name"), // اسم المرسل للعرض
  currencyCode: text("currency_code").notNull(),
  amount: text("amount").notNull(), // مبلغ العمولة
  transactionType: text("transaction_type").notNull(), // 'credit', 'withdrawal'
  relatedTransactionId: integer("related_transaction_id"), // معرف التحويل المرتبط
  description: text("description"), // وصف العملية
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CommissionPoolTransaction = typeof commissionPoolTransactions.$inferSelect;
export type InsertCommissionPoolTransaction = typeof commissionPoolTransactions.$inferInsert;

export const insertCommissionPoolTransactionSchema = createInsertSchema(commissionPoolTransactions, {
  sourceType: z.enum(['agent', 'user', 'system']),
  currencyCode: z.string().min(2).max(10),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "يجب أن يكون المبلغ رقماً موجباً"),
  transactionType: z.enum(['credit', 'withdrawal']),
});

// جدول نسب العمولة الافتراضية للنظام
export const systemCommissionRates = pgTable("system_commission_rates", {
  id: serial("id").primaryKey(),
  transferType: text("transfer_type").notNull(), // 'internal', 'city', 'international'
  currency: text("currency").notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }).notNull(), // نسبة العمولة (مثل 0.01 = 1%)
  perMilleRate: numeric("per_mille_rate", { precision: 5, scale: 4 }), // نسبة في الألف (مثل 0.005 = 5‰)
  fixedAmount: numeric("fixed_amount", { precision: 12, scale: 2 }), // مبلغ ثابت (مثل 7.00 دولار)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InsertSystemCommissionRate = typeof systemCommissionRates.$inferInsert;
export type SelectSystemCommissionRate = typeof systemCommissionRates.$inferSelect;

// جدول طلبات إعادة تعيين كلمة المرور
export const passwordResetRequests = pgTable("password_reset_requests", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// مخططات التحقق والأنواع للإعدادات
export const insertUserSettingsSchema = createInsertSchema(userSettings, {
  language: z.enum(['ar', 'en']).default('ar'),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  timezone: z.string().default('Africa/Tripoli'),
  baseCurrency: z.string().default('LYD'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    security: z.boolean().default(true),
    marketing: z.boolean().default(false)
  })
}).omit({ id: true, updatedAt: true });

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().min(8).max(20).optional(),
  city: z.string().min(2).max(50).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string()
    .min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")
    .max(64, "كلمة المرور طويلة جداً")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير")
    .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم")
    .regex(/[^A-Za-z0-9]/, "يجب أن تحتوي على رمز خاص"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
  path: ["confirmPassword"]
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("عنوان بريد إلكتروني غير صالح")
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "رمز التحقق مطلوب"),
  newPassword: z.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .max(64, "كلمة المرور طويلة جداً")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير")
    .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم")
    .regex(/[^A-Za-z0-9]/, "يجب أن تحتوي على رمز خاص"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور وتأكيدها غير متطابقين",
  path: ["confirmPassword"]
});

// مخططات التحقق والأنواع للمصادقة الثنائية
export const insertUser2FASchema = createInsertSchema(user2FA, {
  isEnabled: z.boolean().default(false),
  secret: z.string().min(16).optional(),
  backupCodes: z.array(z.string()).default([]),
});

export const enable2FASchema = z.object({
  token: z.string().length(6, "رمز التحقق يجب أن يكون 6 أرقام"),
});

export const verify2FASchema = z.object({
  token: z.string().length(6, "رمز التحقق يجب أن يكون 6 أرقام"),
});

export const disable2FASchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  token: z.string().length(6, "رمز التحقق يجب أن يكون 6 أرقام"),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;

// أنواع المصادقة الثنائية
export type User2FA = typeof user2FA.$inferSelect;
export type InsertUser2FA = z.infer<typeof insertUser2FASchema>;
export type Enable2FA = z.infer<typeof enable2FASchema>;
export type Verify2FA = z.infer<typeof verify2FASchema>;
export type Disable2FA = z.infer<typeof disable2FASchema>;

// جدول الدول
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // ISO country code
  currency: text("currency").notNull(),
  phoneCode: text("phone_code"), // مفتاح الدولة للهاتف
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول مكاتب الوكلاء
export const agentOffices = pgTable("agent_offices", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => users.id),
  countryCode: text("country_code").notNull().references(() => countries.code),
  city: text("city").notNull(),
  officeCode: text("office_code").notNull().unique(),
  officeName: text("office_name").notNull(),
  contactInfo: text("contact_info"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول التحويلات الدولية الجديدة
export const newInternationalTransfers = pgTable("international_transfers", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => users.id),
  currencyCode: text("currency_code").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  originCountry: text("origin_country").notNull(),
  destinationCountry: text("destination_country").notNull().references(() => countries.code),
  receivingOfficeId: integer("receiving_office_id").notNull().references(() => agentOffices.id),
  senderName: text("sender_name").notNull(),
  senderPhone: text("sender_phone"),
  receiverName: text("receiver_name").notNull(),
  receiverPhone: text("receiver_phone"),
  receiverCode: text("receiver_code"),
  transferCode: text("transfer_code").notNull().unique(),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type Country = typeof countries.$inferSelect;
export type InsertCountry = typeof countries.$inferInsert;
export type AgentOffice = typeof agentOffices.$inferSelect;
export type InsertAgentOffice = typeof agentOffices.$inferInsert;
export type NewInternationalTransfer = typeof newInternationalTransfers.$inferSelect;
export type InsertNewInternationalTransfer = typeof newInternationalTransfers.$inferInsert;

// جدول إعدادات استقبال الحوالات للمستخدمين
export const userReceiveSettings = pgTable("user_receive_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  countryId: integer("country_id").references(() => countries.id).notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  keysP256dh: text("keys_p256dh").notNull(),
  keysAuth: text("keys_auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userEndpointUnique: unique().on(table.userId, table.endpoint),
}));

export const insertUserReceiveSettingsSchema = createInsertSchema(userReceiveSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserReceiveSettings = typeof userReceiveSettings.$inferSelect;
export type InsertUserReceiveSettings = z.infer<typeof insertUserReceiveSettingsSchema>;

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

// جدول إعدادات عمولة النظام في سوق العملة - محدث لدعم عملات متعددة
export const systemCommissionSettings = pgTable("system_commission_settings", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "percentage" or "fixed"
  value: numeric("value", { precision: 10, scale: 6 }).notNull(),
  currency: text("currency").notNull(), // العملة التي تُحسب بها العمولة
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  // فهرس فريد للتأكد من وجود إعداد واحد فقط لكل عملة
  uniqueCurrencyConstraint: unique("unique_commission_per_currency").on(table.currency)
}));

export const insertSystemCommissionSettingsSchema = createInsertSchema(systemCommissionSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const systemCommissionSettingsSchema = z.object({
  type: z.enum(["percentage", "fixed"], {
    errorMap: () => ({ message: "نوع العمولة يجب أن يكون نسبة مئوية أو ثابت" })
  }),
  value: z.string().or(z.number())
    .transform(val => Number(val))
    .refine(val => val > 0, { 
      message: "يجب أن تكون قيمة العمولة أكبر من صفر" 
    }),
  currency: z.enum(["LYD", "USD", "EUR", "TRY", "AED", "EGP", "TND", "GBP"], {
    errorMap: () => ({ message: "يجب اختيار عملة صحيحة" })
  }),
});

// مخطط للتحديث المجمع لعدة عملات
export const bulkSystemCommissionSettingsSchema = z.object({
  settings: z.array(systemCommissionSettingsSchema).min(1, {
    message: "يجب تحديد إعدادات عمولة لعملة واحدة على الأقل"
  }),
}).refine(data => {
  // التأكد من عدم تكرار العملات
  const currencies = data.settings.map(s => s.currency);
  const uniqueCurrencies = new Set(currencies);
  return currencies.length === uniqueCurrencies.size;
}, {
  message: "لا يمكن تكرار العملة في إعدادات العمولة",
  path: ["settings"]
});

export type SystemCommissionSettings = typeof systemCommissionSettings.$inferSelect;
export type InsertSystemCommissionSettings = z.infer<typeof insertSystemCommissionSettingsSchema>;
export type SystemCommissionSettingsInput = z.infer<typeof systemCommissionSettingsSchema>;
export type BulkSystemCommissionSettingsInput = z.infer<typeof bulkSystemCommissionSettingsSchema>;

// جدول سجلات العمولة - لتتبع جميع عمليات خصم واسترداد العمولة
export const commissionLogs = pgTable("commission_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  userName: text("user_name").notNull(),
  offerType: text("offer_type").notNull(), // "sell", "buy"
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }).notNull(),
  commissionCurrency: text("commission_currency").notNull(),
  sourceId: integer("source_id").notNull(), // ID العرض الأصلي
  sourceType: text("source_type").notNull().default("market_offer"), // نوع المصدر
  action: text("action").notNull(), // "deduct" | "refund"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommissionLogsSchema = createInsertSchema(commissionLogs).omit({
  id: true,
  createdAt: true,
});

export type CommissionLog = typeof commissionLogs.$inferSelect;

// === نظام الإحالة ===

// جدول إعدادات النظام العامة
export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: json("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// جدول مكافآت الإحالة
export const referralRewards = pgTable("referral_rewards", {
  id: serial("id").primaryKey(),
  txId: integer("tx_id").notNull(), // معرف العملية/الحركة التي تولدت منها العمولة
  referrerId: integer("referrer_id").notNull().references(() => users.id), // المحيل
  referredUserId: integer("referred_user_id").notNull().references(() => users.id), // المحال
  commissionBase: numeric("commission_base", { precision: 18, scale: 6 }).notNull(), // قيمة عمولة النظام الأساسية قبل الاقتطاع
  rewardAmount: numeric("reward_amount", { precision: 18, scale: 6 }).notNull(), // قيمة مكافأة الإحالة
  currency: text("currency").notNull(), // نفس عملة العمولة
  status: text("status").notNull().default("paid"), // pending, paid, reversed
  operationType: text("operation_type"), // نوع العملية التي تولدت منها المكافأة
  deductedFromCommission: numeric("deducted_from_commission", { precision: 18, scale: 6 }), // المبلغ المخصوم من العمولة
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
}, (table) => ({
  // منع التكرار: مكافأة واحدة لكل عملية
  uniqueTxConstraint: unique("unique_referral_reward_tx").on(table.txId),
}));

// رصيد مكافآت الإحالة (يمكن دمجه مع جدول balances الموجود أو إنشاء جدول منفصل)
export const referralBalances = pgTable("referral_balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  currency: text("currency").notNull(),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull().default("0"),
}, (table) => ({
  userCurrencyUnique: unique().on(table.userId, table.currency),
}));

// Types للنظام الجديد
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = typeof systemSettings.$inferInsert;

export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertReferralReward = typeof referralRewards.$inferInsert;

export type ReferralBalance = typeof referralBalances.$inferSelect;
export type InsertReferralBalance = typeof referralBalances.$inferInsert;

// Schemas للتحقق من صحة البيانات
export const insertReferralRewardSchema = createInsertSchema(referralRewards, {
  rewardAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "مبلغ المكافأة يجب أن يكون رقماً صحيحاً أكبر من أو يساوي صفر",
  }),
  commissionBase: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "قيمة العمولة الأساسية يجب أن تكون أكبر من صفر",
  }),
}).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings, {
  key: z.string().min(1, "مفتاح الإعداد لا يمكن أن يكون فارغاً"),
}).omit({
  updatedAt: true,
});
export type InsertCommissionLog = z.infer<typeof insertCommissionLogsSchema>;

// أنواع بيانات جدول سجل التحويلات الداخلية
export const insertInternalTransferLogSchema = createInsertSchema(internalTransferLogs).omit({
  id: true,
  createdAt: true,
});

export type InternalTransferLog = typeof internalTransferLogs.$inferSelect;
export type InsertInternalTransferLog = z.infer<typeof insertInternalTransferLogSchema>;

// ==================== نظام الإيصالات المختومة رقمياً ====================

// جدول الإيصالات المختومة
export const receipts = pgTable("receipts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  txnId: text("txn_id").notNull(), // يرتبط بسجل العملية
  version: integer("version").notNull().default(1), // إصدار الإيصال
  locale: text("locale").notNull().default('ar'), // ar|en
  storagePath: text("storage_path").notNull(), // مسار PDF في التخزين
  sha256Base64url: text("sha256_base64url").notNull(), // هاش التمثيل القانوني
  jwsToken: text("jws_token").notNull(), // نسخة مخزنة من JWS
  pdfSigned: boolean("pdf_signed").notNull().default(false), // هل تم توقيع PDF رقمياً
  pdfSignAlgo: text("pdf_sign_algo"), // خوارزمية التوقيع
  pdfCertSerial: text("pdf_cert_serial"), // رقم تسلسلي للشهادة
  revoked: boolean("revoked").notNull().default(false), // إبطال نسخة معينة
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by"), // من أنشأ الإيصال
  verifiedAt: timestamp("verified_at"), // آخر تحقق ناجح
  publicCopy: boolean("public_copy").notNull().default(true), // نسخة عامة مع masking
}, (table) => ({
  txnIdIdx: index("receipts_txn_id_idx").on(table.txnId),
  createdAtIdx: index("receipts_created_at_idx").on(table.createdAt),
  revokedIdx: index("receipts_revoked_idx").on(table.revoked),
}));

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
});

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;

// جدول سجل تدقيق الإيصالات (غير قابل للتعديل)
export const receiptAuditLog = pgTable("receipt_audit_log", {
  id: serial("id").primaryKey(),
  receiptId: text("receipt_id").notNull().references(() => receipts.id),
  action: text("action").notNull(), // generate, sign, revoke, download, verify
  userId: text("user_id"), // المستخدم الذي قام بالعملية
  metadata: json("metadata"), // بيانات إضافية حسب نوع العملية
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  receiptIdIdx: index("receipt_audit_receipt_id_idx").on(table.receiptId),
  timestampIdx: index("receipt_audit_timestamp_idx").on(table.timestamp),
}));

export const insertReceiptAuditLogSchema = createInsertSchema(receiptAuditLog).omit({
  id: true,
  timestamp: true,
});

export type ReceiptAuditLog = typeof receiptAuditLog.$inferSelect;
export type InsertReceiptAuditLog = z.infer<typeof insertReceiptAuditLogSchema>;

// جدول مفاتيح التوقيع وإدارة JWKS
export const signingKeys = pgTable("signing_keys", {
  id: serial("id").primaryKey(),
  kid: text("kid").notNull().unique(), // معرف المفتاح
  algorithm: text("algorithm").notNull().default('RS256'),
  publicKey: text("public_key").notNull(), // PEM format
  privateKey: text("private_key"), // PEM format - مشفر في الإنتاج
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // للتدوير التلقائي
}, (table) => ({
  kidIdx: index("signing_keys_kid_idx").on(table.kid),
  activeIdx: index("signing_keys_active_idx").on(table.active),
}));

export const insertSigningKeySchema = createInsertSchema(signingKeys).omit({
  id: true,
  createdAt: true,
});

export type SigningKey = typeof signingKeys.$inferSelect;
export type InsertSigningKey = z.infer<typeof insertSigningKeySchema>;

// جدول إعدادات نظام الإيصالات
export const receiptSettings = pgTable("receipt_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});

export const insertReceiptSettingsSchema = createInsertSchema(receiptSettings).omit({
  id: true,
  updatedAt: true,
});

export type ReceiptSettings = typeof receiptSettings.$inferSelect;
export type InsertReceiptSettings = z.infer<typeof insertReceiptSettingsSchema>;

// جداول الرسائل الصوتية
export const messageVoices = pgTable("message_voices", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: integer("message_id").references(() => chatMessages.id, { onDelete: "cascade" }),
  privateMessageId: integer("private_message_id").references(() => privateMessages.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roomId: integer("room_id").references(() => chatRooms.id, { onDelete: "cascade" }),
  privateRoomId: integer("private_room_id").references(() => privateChats.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(), // مسار الملف في التخزين
  mimeType: text("mime_type").notNull(), // audio/ogg, audio/mpeg...
  durationSeconds: integer("duration_seconds").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  waveformPeaks: json("waveform_peaks"), // بيانات الموجة (مصفوفة مبسطة)
  transcript: text("transcript"), // النص المنسوخ (إن توفر)
  transcriptLang: text("transcript_lang"), // ar/en/...
  status: text("status").notNull().default("ready"), // pending | processing | ready | failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// إعدادات الصوت
export const voiceSettings = pgTable("voice_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  maxDurationSeconds: integer("max_duration_seconds").notNull().default(120),
  maxFileSizeMb: integer("max_file_size_mb").notNull().default(10),
  enabled: boolean("enabled").notNull().default(true),
  transcriptionEnabled: boolean("transcription_enabled").notNull().default(true),
  allowedMimeTypes: text("allowed_mime_types").array().default(['audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/webm']),
});

// حدود معدل الاستخدام للصوت
export const voiceRateLimits = pgTable("voice_rate_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  messageCount: integer("message_count").notNull().default(0),
  windowStartTime: timestamp("window_start_time").defaultNow(),
  lastResetAt: timestamp("last_reset_at").defaultNow(),
});

// فهارس للبحث السريع - سيتم إنشاؤها بعد إنشاء الجداول

// نماذج التحقق من الصحة
export const insertMessageVoiceSchema = createInsertSchema(messageVoices).pick({
  messageId: true,
  privateMessageId: true,
  senderId: true,
  roomId: true,
  privateRoomId: true,
  storageKey: true,
  mimeType: true,
  durationSeconds: true,
  fileSizeBytes: true,
  waveformPeaks: true,
  transcript: true,
  transcriptLang: true,
  status: true,
});

export const insertVoiceSettingsSchema = createInsertSchema(voiceSettings).pick({
  maxDurationSeconds: true,
  maxFileSizeMb: true,
  enabled: true,
  transcriptionEnabled: true,
  allowedMimeTypes: true,
});

export const insertVoiceRateLimitSchema = createInsertSchema(voiceRateLimits).pick({
  userId: true,
  messageCount: true,
  windowStartTime: true,
  lastResetAt: true,
});

// أنواع البيانات للصوت
export type MessageVoice = typeof messageVoices.$inferSelect;
export type InsertMessageVoice = z.infer<typeof insertMessageVoiceSchema>;
export type VoiceSettings = typeof voiceSettings.$inferSelect;
export type InsertVoiceSettings = z.infer<typeof insertVoiceSettingsSchema>;
export type VoiceRateLimit = typeof voiceRateLimits.$inferSelect;
export type InsertVoiceRateLimit = z.infer<typeof insertVoiceRateLimitSchema>;

// أنواع البيانات للمدن
export type City = typeof cities.$inferSelect;
export type InsertCity = typeof cities.$inferInsert;

// Zod schema لطلب الترقية الخارجي
export const externalTransferRequestSchema = insertUpgradeRequestSchema.extend({
  requestType: z.literal("external_transfer"),
  countryId: z.number().min(1, "اختيار الدولة مطلوب"),
  cityId: z.number().optional(),
  cityNameManual: z.string().optional(),
}).refine(
  (data) => data.cityId || (data.cityNameManual && data.cityNameManual.trim().length > 0),
  {
    message: "يجب اختيار مدينة من القائمة أو إدخال اسم المدينة يدوياً",
    path: ["cityId"]
  }
);

export type ExternalTransferRequest = z.infer<typeof externalTransferRequestSchema>;

// Zod schema لرفع سقف التحويل الخارجي للوكلاء (للإدارة)
export const externalTransferLimitSchema = z.object({
  extDailyLimit: z.string().min(1, "الحد اليومي مطلوب"),
  extMonthlyLimit: z.string().min(1, "الحد الشهري مطلوب"),
  extAllowedCurrencies: z.array(z.string()).min(1, "يجب اختيار عملة واحدة على الأقل"),
  extAllowedCountries: z.array(z.string()).min(1, "يجب اختيار دولة واحدة على الأقل"),
});

export type ExternalTransferLimitRequest = z.infer<typeof externalTransferLimitSchema>;

// جدول السجلات المخفية لكل مستخدم
export const hiddenTransfers = pgTable("hidden_transfers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  transferId: integer("transfer_id").notNull().references(() => agentTransfers.id),
  hiddenAt: timestamp("hidden_at").defaultNow(),
}, (table) => {
  return {
    uniqueUserTransfer: unique().on(table.userId, table.transferId)
  };
});

export const insertHiddenTransferSchema = createInsertSchema(hiddenTransfers).pick({
  userId: true,
  transferId: true,
});

export type InsertHiddenTransfer = z.infer<typeof insertHiddenTransferSchema>;

// ======== نظام المكافآت والشارات الرقمية ========

// جدول أنواع الشارات المتاحة
export const badgeTypes = pgTable("badge_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // اسم الشارة
  nameAr: text("name_ar").notNull(), // الاسم بالعربية
  description: text("description").notNull(), // وصف الشارة
  descriptionAr: text("description_ar").notNull(), // الوصف بالعربية
  icon: text("icon").notNull(), // أيقونة الشارة (emoji أو اسم أيقونة)
  color: text("color").notNull().default("blue"), // لون الشارة
  rarity: text("rarity").notNull().default("common"), // common, rare, epic, legendary
  pointsRequired: integer("points_required").notNull().default(0), // النقاط المطلوبة للحصول عليها
  category: text("category").notNull().default("general"), // general, financial, social, achievement
  condition: json("condition"), // شروط الحصول على الشارة
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول نقاط المستخدمين
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").notNull().default(0), // إجمالي النقاط
  availablePoints: integer("available_points").notNull().default(0), // النقاط المتاحة للإنفاق
  level: integer("level").notNull().default(1), // مستوى المستخدم
  streakDays: integer("streak_days").notNull().default(0), // أيام متتالية من النشاط
  lastActivityDate: timestamp("last_activity_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    userUnique: unique().on(table.userId),
  }
});

// جدول شارات المستخدمين المكتسبة
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeTypeId: integer("badge_type_id").notNull().references(() => badgeTypes.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").defaultNow(),
  isVisible: boolean("is_visible").default(true), // هل الشارة ظاهرة في الملف الشخصي
  notificationSent: boolean("notification_sent").default(false),
}, (table) => {
  return {
    userBadgeUnique: unique().on(table.userId, table.badgeTypeId), // مستخدم واحد لا يمكن أن يحصل على نفس الشارة مرتين
  }
});

// جدول تاريخ النقاط والمكافآت
export const pointsHistory = pgTable("points_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(), // النقاط المكتسبة أو المنفقة (سالب في حالة الإنفاق)
  action: text("action").notNull(), // نوع العمل: transfer, login, badge_earned, reward_claimed
  description: text("description").notNull(), // وصف العمل
  descriptionAr: text("description_ar").notNull(), // الوصف بالعربية
  referenceId: text("reference_id"), // مرجع العملية (ID المعاملة، إلخ)
  referenceType: text("reference_type"), // نوع المرجع (transfer, transaction, badge)
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول المكافآت المتاحة
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // اسم المكافأة
  nameAr: text("name_ar").notNull(), // الاسم بالعربية
  description: text("description").notNull(), // وصف المكافأة
  descriptionAr: text("description_ar").notNull(), // الوصف بالعربية
  icon: text("icon").notNull(), // أيقونة المكافأة
  pointsCost: integer("points_cost").notNull(), // النقاط المطلوبة للاستبدال
  rewardType: text("reward_type").notNull(), // discount, cash_bonus, feature_unlock, badge
  rewardValue: text("reward_value"), // قيمة المكافأة (نسبة خصم، مبلغ نقدي، إلخ)
  maxRedemptions: integer("max_redemptions"), // عدد مرات الاستبدال المسموح (null = لا محدود)
  currentRedemptions: integer("current_redemptions").default(0), // عدد مرات الاستبدال الحالي
  validUntil: timestamp("valid_until"), // تاريخ انتهاء المكافأة
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول المكافآت المستبدلة
export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rewardId: integer("reward_id").notNull().references(() => rewards.id, { onDelete: "cascade" }),
  pointsSpent: integer("points_spent").notNull(), // النقاط المنفقة
  status: text("status").notNull().default("pending"), // pending, active, used, expired
  redemptionCode: text("redemption_code"), // كود الاستبدال
  usedAt: timestamp("used_at"), // تاريخ الاستخدام
  expiresAt: timestamp("expires_at"), // تاريخ انتهاء الصلاحية
  redeemedAt: timestamp("redeemed_at").defaultNow(),
});

// جدول إعدادات نظام المكافآت
export const rewardSettings = pgTable("reward_settings", {
  id: serial("id").primaryKey(),
  transferPoints: integer("transfer_points").default(1), // نقاط لكل تحويل
  loginPoints: integer("login_points").default(5), // نقاط تسجيل الدخول اليومي
  streakBonusPoints: integer("streak_bonus_points").default(10), // نقاط إضافية للأيام المتتالية
  levelUpBonus: integer("level_up_bonus").default(50), // نقاط الترقية للمستوى التالي
  pointsPerLevel: integer("points_per_level").default(1000), // النقاط المطلوبة لكل مستوى
  maxStreakDays: integer("max_streak_days").default(30), // أقصى أيام متتالية
  systemActive: boolean("system_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// نماذج التحقق من الصحة للشارات والمكافآت
export const insertBadgeTypeSchema = createInsertSchema(badgeTypes).pick({
  name: true,
  nameAr: true,
  description: true,
  descriptionAr: true,
  icon: true,
  color: true,
  rarity: true,
  pointsRequired: true,
  category: true,
  condition: true,
  active: true,
});

export const insertUserPointsSchema = createInsertSchema(userPoints).pick({
  userId: true,
  totalPoints: true,
  availablePoints: true,
  level: true,
  streakDays: true,
  lastActivityDate: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).pick({
  userId: true,
  badgeTypeId: true,
  isVisible: true,
});

export const insertPointsHistorySchema = createInsertSchema(pointsHistory).pick({
  userId: true,
  points: true,
  action: true,
  description: true,
  descriptionAr: true,
  referenceId: true,
  referenceType: true,
});

export const insertRewardSchema = createInsertSchema(rewards).pick({
  name: true,
  nameAr: true,
  description: true,
  descriptionAr: true,
  icon: true,
  pointsCost: true,
  rewardType: true,
  rewardValue: true,
  maxRedemptions: true,
  validUntil: true,
  active: true,
});

export const insertUserRewardSchema = createInsertSchema(userRewards).pick({
  userId: true,
  rewardId: true,
  pointsSpent: true,
  status: true,
  redemptionCode: true,
  expiresAt: true,
});

export const insertRewardSettingsSchema = createInsertSchema(rewardSettings).pick({
  transferPoints: true,
  loginPoints: true,
  streakBonusPoints: true,
  levelUpBonus: true,
  pointsPerLevel: true,
  maxStreakDays: true,
  systemActive: true,
});

// أنواع البيانات
export type BadgeType = typeof badgeTypes.$inferSelect;
export type InsertBadgeType = z.infer<typeof insertBadgeTypeSchema>;
export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type PointsHistory = typeof pointsHistory.$inferSelect;
export type InsertPointsHistory = z.infer<typeof insertPointsHistorySchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type UserReward = typeof userRewards.$inferSelect;
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;
export type RewardSettings = typeof rewardSettings.$inferSelect;
export type InsertRewardSettings = z.infer<typeof insertRewardSettingsSchema>;

// جدول قيود الصفحات
export const pageRestrictions = pgTable("page_restrictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }), // إزالة notNull لدعم القيود الشاملة
  accountNumber: text("account_number"),
  pageKey: text("page_key").notNull(), // 'market', 'send', 'receive', 'wallet', 'dashboard', 'kyc', 'chat', 'inter_office', 'international', 'reports', 'settings', 'admin', 'all'
  scope: text("scope").notNull().default("page"), // 'page' | 'section' | 'global'
  reason: text("reason"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // إزالة constraint الـ unique لأن userId قد يكون null للقيود الشاملة
  // uniqueUserPage: unique().on(table.userId, table.pageKey),
}));

// جدول سجل التدقيق
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  data: json("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas للجداول الجديدة
export const insertPageRestrictionSchema = createInsertSchema(pageRestrictions);
export const insertAuditLogSchema = createInsertSchema(auditLogs);

// أنواع البيانات الجديدة
export type PageRestriction = typeof pageRestrictions.$inferSelect;
export type InsertPageRestriction = z.infer<typeof insertPageRestrictionSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Dev Studio Tables - حصري لـ ss73ss73ss73@gmail.com
export const devPages = pgTable("dev_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  route: text("route").notNull().unique(), // مسار الصفحة مثل /reports/city-usage
  titleAr: text("title_ar").notNull(), // العنوان العربي
  layout: text("layout").default("default"), // نوع التخطيط
  status: text("status").notNull().default("draft"), // draft, published
  visibility: text("visibility").default("public"), // public, auth, role_based
  allowedRoles: text("allowed_roles").array().default([]), // الأدوار المسموحة
  createdBy: text("created_by").notNull(), // البريد الإلكتروني للمنشئ
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const devBlocks = pgTable("dev_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id").notNull().references(() => devPages.id, { onDelete: "cascade" }),
  slot: text("slot").notNull(), // main, sidebar, header, etc.
  componentKey: text("component_key").notNull(), // DataTable, Chart, Form, etc.
  props: json("props").default({}), // خصائص المكون
  orderIndex: integer("order_index").default(0), // ترتيب العرض
  createdAt: timestamp("created_at").defaultNow(),
});

export const devComponents = pgTable("dev_components", {
  key: text("key").primaryKey(), // DataTable, Chart, Form, etc.
  displayName: text("display_name").notNull(), // الاسم للعرض
  schema: json("schema").notNull(), // JSON Schema للخصائص
  category: text("category").default("general"), // general, forms, charts, data
  isCore: boolean("is_core").default(true), // مكون أساسي أم مخصص
  createdAt: timestamp("created_at").defaultNow(),
});

export const devComponentVersions = pgTable("dev_component_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  componentKey: text("component_key").notNull().references(() => devComponents.key),
  version: text("version").notNull(), // semver
  sourceJs: text("source_js"), // كود المكون
  changelog: text("changelog"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const devFunctions = pgTable("dev_functions", {
  name: text("name").primaryKey(), // admin_city_usage, get_office_stats, etc.
  type: text("type").notNull(), // rpc, sql, edge
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const devFunctionVersions = pgTable("dev_function_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  functionName: text("function_name").notNull().references(() => devFunctions.name),
  version: text("version").notNull(), // semver
  source: text("source").notNull(), // كود الدالة
  tests: text("tests"), // اختبارات
  createdAt: timestamp("created_at").defaultNow(),
});

export const devThemes = pgTable("dev_themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  tokens: json("tokens").notNull(), // ألوان، خطوط، مسافات
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const devFeatureFlags = pgTable("dev_feature_flags", {
  key: text("key").primaryKey(), // market_pro, advanced_charts
  description: text("description"),
  enabled: boolean("enabled").default(false),
  perAccount: json("per_account").default({}), // {'33003002': true}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const devNavItems = pgTable("dev_nav_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  labelAr: text("label_ar").notNull(),
  route: text("route").notNull(),
  icon: text("icon"), // اسم الأيقونة من lucide
  orderIndex: integer("order_index").default(0),
  roles: text("roles").array().default([]), // أدوار مسموحة
  parentId: uuid("parent_id"), // للقوائم الفرعية - تمت إزالة المرجع لتجنب المرجع الدائري
  createdAt: timestamp("created_at").defaultNow(),
});

export const devAssets = pgTable("dev_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  path: text("path").notNull().unique(), // مسار الملف
  alt: text("alt"), // النص البديل
  meta: json("meta").default({}), // معلومات إضافية
  createdAt: timestamp("created_at").defaultNow(),
});

export const devReleases = pgTable("dev_releases", {
  id: uuid("id").primaryKey().defaultRandom(),
  tag: text("tag").notNull().unique(), // v1.0.0
  notes: text("notes"), // ملاحظات الإصدار
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const devReleaseItems = pgTable("dev_release_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  releaseId: uuid("release_id").notNull().references(() => devReleases.id, { onDelete: "cascade" }),
  entity: text("entity").notNull(), // page, component, function, theme, nav, flag
  entityKey: text("entity_key").notNull(), // المفتاح أو المعرف
  fromVersion: text("from_version"),
  toVersion: text("to_version"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const devAuditLogs = pgTable("dev_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(), // create, update, delete, publish, rollback
  entity: text("entity").notNull(), // page, component, function, etc.
  entityId: text("entity_id").notNull(),
  data: json("data").default({}), // البيانات المتغيرة
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas لجداول Dev Studio
export const insertDevPageSchema = createInsertSchema(devPages);
export const insertDevBlockSchema = createInsertSchema(devBlocks);
export const insertDevComponentSchema = createInsertSchema(devComponents);
export const insertDevFunctionSchema = createInsertSchema(devFunctions);
export const insertDevThemeSchema = createInsertSchema(devThemes);
export const insertDevFeatureFlagSchema = createInsertSchema(devFeatureFlags);
export const insertDevNavItemSchema = createInsertSchema(devNavItems);
export const insertDevAssetSchema = createInsertSchema(devAssets);
export const insertDevReleaseSchema = createInsertSchema(devReleases);
export const insertDevAuditLogSchema = createInsertSchema(devAuditLogs);

// أنواع البيانات لـ Dev Studio
export type DevPage = typeof devPages.$inferSelect;
export type InsertDevPage = z.infer<typeof insertDevPageSchema>;
export type DevBlock = typeof devBlocks.$inferSelect;
export type InsertDevBlock = z.infer<typeof insertDevBlockSchema>;
export type DevComponent = typeof devComponents.$inferSelect;
export type InsertDevComponent = z.infer<typeof insertDevComponentSchema>;
export type DevFunction = typeof devFunctions.$inferSelect;
export type InsertDevFunction = z.infer<typeof insertDevFunctionSchema>;
export type DevTheme = typeof devThemes.$inferSelect;
export type InsertDevTheme = z.infer<typeof insertDevThemeSchema>;
export type DevFeatureFlag = typeof devFeatureFlags.$inferSelect;
export type InsertDevFeatureFlag = z.infer<typeof insertDevFeatureFlagSchema>;
export type DevNavItem = typeof devNavItems.$inferSelect;
export type InsertDevNavItem = z.infer<typeof insertDevNavItemSchema>;
export type DevAsset = typeof devAssets.$inferSelect;
export type InsertDevAsset = z.infer<typeof insertDevAssetSchema>;
export type DevRelease = typeof devReleases.$inferSelect;
export type InsertDevRelease = z.infer<typeof insertDevReleaseSchema>;
export type DevAuditLog = typeof devAuditLogs.$inferSelect;
export type InsertDevAuditLog = z.infer<typeof insertDevAuditLogSchema>;

// جدول السجلات الأمنية - تسجيل محاولات الدخول المشبوهة والصور الأمنية
export const securityLogs = pgTable("security_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"), // البريد الإلكتروني للمحاولة
  username: text("username"), // اسم المستخدم إن وُجد
  eventType: text("event_type").notNull(), // FAILED_LOGIN, SUCCESSFUL_LOGIN, SUSPICIOUS_ACTIVITY, MANUAL_REPORT, ADMIN_ACTION
  fingerprint: text("fingerprint").notNull(), // بصمة الجهاز
  ipAddress: text("ip_address"), // عنوان IP
  userAgent: text("user_agent"), // معلومات المتصفح
  country: text("country"), // الدولة
  city: text("city"), // المدينة
  platform: text("platform"), // النظام (web, mobile, etc)
  language: text("language"), // لغة المتصفح
  screen: text("screen"), // دقة الشاشة
  timezone: text("timezone"), // المنطقة الزمنية
  attempts: integer("attempts").default(1), // عدد المحاولات
  imageFilename: text("image_filename"), // اسم ملف الصورة الأمنية
  blocked: boolean("blocked").default(false), // هل تم حظر الجهاز
  reportType: text("report_type").default("failed_login"), // نوع التقرير
  metadata: json("metadata").default({}), // معلومات إضافية
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// مخطط إدخال السجلات الأمنية
export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// أنواع البيانات للسجلات الأمنية
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;


