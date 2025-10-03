import { db } from "./db";
import { adminTransactions, transactions, users } from "@shared/schema";
import { eq, and, or, desc, asc, sql, like, gte, lte, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

// أنواع المعاملات
export enum TransactionType {
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  EXTERNAL_REMIT = 'EXTERNAL_REMIT',
  OFFICE_REMIT = 'OFFICE_REMIT',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  FEE = 'FEE',
  ADJUSTMENT = 'ADJUSTMENT'
}

// حالات المعاملات
export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
  ON_HOLD = 'ON_HOLD'
}

// قنوات المعاملات
export enum TransactionChannel {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
  API = 'API'
}

// واجهة فلاتر البحث
export interface AdminTransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  useExecutedAt?: boolean;
  types?: TransactionType[];
  statuses?: TransactionStatus[];
  currencies?: string[];
  amountMin?: string;
  amountMax?: string;
  refNo?: string;
  userId?: string;
  officeId?: string;
  city?: string;
  channels?: TransactionChannel[];
  kycLevel?: string;
  riskMin?: string;
  riskMax?: string;
  flags?: string[];
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// واجهة بيانات المعاملة للعرض
export interface AdminTransactionDisplay {
  id: string;
  refNo: string;
  type: TransactionType;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  fromAccountId?: string;
  toAccountId?: string;
  userId: number;
  officeId?: number;
  cityFrom?: string;
  cityTo?: string;
  currency: string;
  amount: string;
  rate?: string;
  feeSystem?: string;
  feeRecipient?: string;
  netAmount: string;
  channel: TransactionChannel;
  createdBy: number;
  approvedBy?: number;
  kycLevel?: number;
  riskScore?: number;
  flags?: any;
  parentTxnId?: string;
  externalProvider?: string;
  externalRef?: string;
  notes?: string;
  meta?: any;
  // بيانات إضافية للعرض
  userName?: string;
  fromAccountName?: string;
  toAccountName?: string;
  officeName?: string;
  createdByName?: string;
  approvedByName?: string;
}

// واجهة ملخص البيانات
export interface AdminTransactionSummary {
  totalCount: number;
  totalAmount: string;
  totalNet: string;
  byStatus: Record<TransactionStatus, number>;
  byCurrency: Record<string, { count: number; amount: string; net: string }>;
}

// واجهة استجابة API
export interface AdminTransactionsResponse {
  rows: AdminTransactionDisplay[];
  total: number;
  summary: AdminTransactionSummary;
}

// كلاس خدمة إدارة المعاملات
export class AdminTransactionService {
  // توليد رقم مرجعي فريد
  static generateRefNo(type: TransactionType): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const typePrefix = type.substring(0, 3).toUpperCase();
    return `${typePrefix}-${timestamp}-${random}`;
  }

  // إنشاء معاملة جديدة
  static async createTransaction(transactionData: {
    type: TransactionType;
    userId: number;
    amount: string;
    currency: string;
    netAmount: string;
    createdBy: number;
    channel?: TransactionChannel;
    fromAccountId?: string;
    toAccountId?: string;
    officeId?: number;
    cityFrom?: string;
    cityTo?: string;
    rate?: string;
    feeSystem?: string;
    feeRecipient?: string;
    kycLevel?: number;
    riskScore?: number;
    flags?: any;
    parentTxnId?: string;
    externalProvider?: string;
    externalRef?: string;
    notes?: string;
    meta?: any;
  }) {
    const refNo = this.generateRefNo(transactionData.type);
    
    const [newTransaction] = await db
      .insert(adminTransactions)
      .values({
        refNo,
        status: TransactionStatus.PENDING,
        executedAt: transactionData.type === TransactionType.INTERNAL_TRANSFER ? new Date() : undefined,
        channel: transactionData.channel || TransactionChannel.WEB,
        ...transactionData
      })
      .returning();

    return newTransaction;
  }

  // جلب المعاملات مع الفلاتر
  static async getTransactions(filters: AdminTransactionFilters): Promise<AdminTransactionsResponse> {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(100, Math.max(10, filters.pageSize || 50));
    const offset = (page - 1) * pageSize;
    
    console.log('🔍 جلب المعاملات الموحدة من adminTransactions و transactions...');
    
    // بناء استعلام البحث للمعاملات الإدارية
    let adminQuery = db
      .select({
        id: adminTransactions.id,
        refNo: adminTransactions.refNo,
        type: adminTransactions.type,
        status: adminTransactions.status,
        createdAt: adminTransactions.createdAt,
        updatedAt: adminTransactions.updatedAt,
        executedAt: adminTransactions.executedAt,
        userId: adminTransactions.userId,
        fromAccountId: adminTransactions.fromAccountId,
        toAccountId: adminTransactions.toAccountId,
        amount: adminTransactions.amount,
        currency: adminTransactions.currency,
        netAmount: adminTransactions.netAmount,
        feeSystem: adminTransactions.feeSystem,
        feeRecipient: adminTransactions.feeRecipient,
        channel: adminTransactions.channel,
        kycLevel: adminTransactions.kycLevel,
        riskScore: adminTransactions.riskScore,
        flags: adminTransactions.flags,
        parentTxnId: adminTransactions.parentTxnId,
        externalProvider: adminTransactions.externalProvider,
        externalRef: adminTransactions.externalRef,
        notes: adminTransactions.notes,
        meta: adminTransactions.meta,
        cityFrom: adminTransactions.cityFrom,
        cityTo: adminTransactions.cityTo,
        officeId: adminTransactions.officeId,
        userName: users.fullName,
        userAccountNumber: users.accountNumber,
        source: sql<string>`'admin'`
      })
      .from(adminTransactions)
      .leftJoin(users, eq(adminTransactions.userId, users.id));

    // بناء استعلام مبسط للمعاملات العادية
    let regularQuery = db
      .select({
        id: transactions.id,
        refNo: transactions.referenceNumber,
        type: transactions.type,
        status: sql<string>`'completed'`,
        createdAt: transactions.date,
        updatedAt: transactions.date,
        executedAt: transactions.date,
        userId: transactions.userId,
        amount: transactions.amount,
        currency: transactions.currency,
        description: transactions.description,
        userName: users.fullName,
        userAccountNumber: users.accountNumber
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id));

    console.log('🔍 تطبيق الفلاتر على كلا الاستعلامات...');
    
    // تطبيق الفلاتر على adminTransactions
    const adminConditions = [];
    const regularConditions = [
      or(
        eq(transactions.type, 'internal_transfer'),
        eq(transactions.type, 'internal_transfer_in'),
        eq(transactions.type, 'internal_transfer_out'),
        eq(transactions.type, 'exchange'),
        eq(transactions.type, 'market_trade')
      )
    ];

    if (filters.dateFrom || filters.dateTo) {
      const adminDateField = filters.useExecutedAt ? adminTransactions.executedAt : adminTransactions.createdAt;
      const regularDateField = transactions.date; // المعاملات العادية تستخدم date دائماً
      
      if (filters.dateFrom) {
        adminConditions.push(gte(adminDateField, new Date(filters.dateFrom)));
        regularConditions.push(gte(regularDateField, new Date(filters.dateFrom)));
      }
      
      if (filters.dateTo) {
        adminConditions.push(lte(adminDateField, new Date(filters.dateTo)));
        regularConditions.push(lte(regularDateField, new Date(filters.dateTo)));
      }
    }

    if (filters.types && filters.types.length > 0) {
      adminConditions.push(inArray(adminTransactions.type, filters.types));
      
      // تطبيق فلتر الأنواع على المعاملات العادية
      const regularTypeConditions = [];
      if (filters.types.includes('internal_transfer')) {
        regularTypeConditions.push(
          eq(transactions.type, 'internal_transfer'),
          eq(transactions.type, 'internal_transfer_in'),
          eq(transactions.type, 'internal_transfer_out')
        );
      }
      if (filters.types.includes('market_trade')) {
        regularTypeConditions.push(
          eq(transactions.type, 'exchange'),
          eq(transactions.type, 'market_trade')
        );
      }
      if (regularTypeConditions.length > 0) {
        regularConditions.push(or(...regularTypeConditions));
      } else {
        // إذا لم تكن الأنواع المطلوبة موجودة، لا نريد إرجاع المعاملات العادية
        regularConditions.push(sql`1=0`);
      }
    }

    if (filters.statuses && filters.statuses.length > 0) {
      adminConditions.push(inArray(adminTransactions.status, filters.statuses));
      // المعاملات العادية عادة ما تكون مكتملة
      if (!filters.statuses.includes('completed')) {
        regularConditions.push(sql`1=0`);
      }
    }

    if (filters.currencies && filters.currencies.length > 0) {
      adminConditions.push(inArray(adminTransactions.currency, filters.currencies));
      regularConditions.push(inArray(transactions.currency, filters.currencies));
    }

    if (filters.amountMin) {
      adminConditions.push(gte(adminTransactions.amount, filters.amountMin));
      regularConditions.push(gte(transactions.amount, filters.amountMin));
    }

    if (filters.amountMax) {
      adminConditions.push(lte(adminTransactions.amount, filters.amountMax));
      regularConditions.push(lte(transactions.amount, filters.amountMax));
    }

    if (filters.refNo) {
      adminConditions.push(like(adminTransactions.refNo, `%${filters.refNo}%`));
      regularConditions.push(like(transactions.referenceNumber, `%${filters.refNo}%`));
    }

    if (filters.userId) {
      adminConditions.push(eq(adminTransactions.userId, parseInt(filters.userId)));
      regularConditions.push(eq(transactions.userId, parseInt(filters.userId)));
    }

    if (filters.officeId) {
      adminConditions.push(eq(adminTransactions.officeId, parseInt(filters.officeId)));
      // المعاملات العادية ليس لها مكاتب
    }

    if (filters.city) {
      adminConditions.push(
        or(
          like(adminTransactions.cityFrom, `%${filters.city}%`),
          like(adminTransactions.cityTo, `%${filters.city}%`)
        )
      );
      // المعاملات العادية ليس لها مدن
    }

    if (filters.channels && filters.channels.length > 0) {
      adminConditions.push(inArray(adminTransactions.channel, filters.channels));
      // المعاملات العادية كلها ويب
      if (!filters.channels.includes('web')) {
        regularConditions.push(sql`1=0`);
      }
    }

    if (filters.kycLevel) {
      adminConditions.push(eq(adminTransactions.kycLevel, parseInt(filters.kycLevel)));
      // المعاملات العادية ليس لها مستوى KYC
    }

    if (filters.riskMin) {
      adminConditions.push(gte(adminTransactions.riskScore, parseInt(filters.riskMin)));
      // المعاملات العادية ليس لها نقاط مخاطرة
    }

    if (filters.riskMax) {
      adminConditions.push(lte(adminTransactions.riskScore, parseInt(filters.riskMax)));
      // المعاملات العادية ليس لها نقاط مخاطرة
    }

    // البحث العام
    if (filters.q) {
      const searchTerm = `%${filters.q}%`;
      adminConditions.push(
        or(
          like(adminTransactions.refNo, searchTerm),
          like(adminTransactions.externalRef, searchTerm),
          like(adminTransactions.notes, searchTerm),
          like(users.fullName, searchTerm),
          like(users.accountNumber, searchTerm),
          like(adminTransactions.fromAccountId, searchTerm),
          like(adminTransactions.toAccountId, searchTerm)
        )
      );
      
      regularConditions.push(
        or(
          like(transactions.referenceNumber, searchTerm),
          like(transactions.description, searchTerm),
          like(users.fullName, searchTerm),
          like(users.accountNumber, searchTerm)
        )
      );
    }

    // تطبيق الشروط على استعلام adminTransactions
    if (adminConditions.length > 0) {
      adminQuery = adminQuery.where(and(...adminConditions));
    }
    
    // إعادة بناء استعلام regularQuery مع الشروط
    if (regularConditions.length > 0) {
      regularQuery = db
        .select({
          id: transactions.id,
          refNo: transactions.referenceNumber,
          type: transactions.type,
          status: sql<string>`'completed'`,
          createdAt: transactions.date,
          updatedAt: transactions.date,
          executedAt: transactions.date,
          userId: transactions.userId,
          amount: transactions.amount,
          currency: transactions.currency,
          description: transactions.description,
          userName: users.fullName,
          userAccountNumber: users.accountNumber
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.userId, users.id))
        .where(and(...regularConditions));
    }

    console.log('🔄 تنفيذ الاستعلامات...');
    
    // تنفيذ كلا الاستعلامات
    const [adminResults, regularResults] = await Promise.all([
      adminQuery,
      regularQuery
    ]);

    console.log(`📊 النتائج: ${adminResults.length} معاملة إدارية، ${regularResults.length} معاملة عادية`);

    // دمج النتائج
    const allResults = [
      // المعاملات الإدارية
      ...adminResults.map(r => ({
        transaction: {
          id: r.id,
          refNo: r.refNo,
          type: r.type,
          status: r.status,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          executedAt: r.executedAt,
          userId: r.userId,
          fromAccountId: r.fromAccountId,
          toAccountId: r.toAccountId,
          amount: r.amount,
          currency: r.currency,
          netAmount: r.netAmount,
          feeSystem: r.feeSystem,
          feeRecipient: r.feeRecipient,
          channel: r.channel,
          kycLevel: r.kycLevel,
          riskScore: r.riskScore,
          flags: r.flags,
          parentTxnId: r.parentTxnId,
          externalProvider: r.externalProvider,
          externalRef: r.externalRef,
          notes: r.notes,
          meta: r.meta,
          cityFrom: r.cityFrom,
          cityTo: r.cityTo,
          officeId: r.officeId
        },
        userName: r.userName,
        userAccountNumber: r.userAccountNumber,
        source: 'admin'
      })),
      // المعاملات العادية (محولة لنفس التنسيق)
      ...regularResults.map(r => ({
        transaction: {
          id: r.id,
          refNo: r.refNo,
          type: r.type,
          status: r.status || 'completed',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          executedAt: r.executedAt,
          userId: r.userId,
          fromAccountId: null,
          toAccountId: null,
          amount: r.amount,
          currency: r.currency,
          netAmount: r.amount,
          feeSystem: null,
          feeRecipient: null,
          channel: 'web',
          kycLevel: null,
          riskScore: null,
          flags: null,
          parentTxnId: null,
          externalProvider: null,
          externalRef: null,
          notes: r.description,
          meta: null,
          cityFrom: null,
          cityTo: null,
          officeId: null
        },
        userName: r.userName,
        userAccountNumber: r.userAccountNumber,
        source: 'regular'
      }))
    ];

    // الترتيب
    const sortField = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    
    allResults.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'amount':
          aValue = parseFloat(a.transaction.amount || '0');
          bValue = parseFloat(b.transaction.amount || '0');
          break;
        case 'executed_at':
          aValue = a.transaction.executedAt ? new Date(a.transaction.executedAt).getTime() : 0;
          bValue = b.transaction.executedAt ? new Date(b.transaction.executedAt).getTime() : 0;
          break;
        case 'ref_no':
          aValue = a.transaction.refNo || '';
          bValue = b.transaction.refNo || '';
          break;
        case 'status':
          aValue = a.transaction.status || '';
          bValue = b.transaction.status || '';
          break;
        case 'type':
          aValue = a.transaction.type || '';
          bValue = b.transaction.type || '';
          break;
        default:
          aValue = a.transaction.createdAt ? new Date(a.transaction.createdAt).getTime() : 0;
          bValue = b.transaction.createdAt ? new Date(b.transaction.createdAt).getTime() : 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      } else {
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }
    });

    const totalCount = allResults.length;
    const results = allResults.slice(offset, offset + pageSize);

    console.log(`📋 إجمالي المعاملات: ${totalCount}، النتائج المعروضة: ${results.length}`);

    // حساب الملخص من البيانات المدمجة
    const summary: AdminTransactionSummary = {
      totalCount: totalCount,
      totalAmount: '0',
      totalNet: '0',
      byStatus: {} as Record<TransactionStatus, number>,
      byCurrency: {}
    };

    let totalAmount = 0;
    let totalNet = 0;

    // معالجة جميع النتائج لبناء الملخص
    allResults.forEach(result => {
      const transaction = result.transaction;
      const amount = parseFloat(transaction.amount || '0');
      const netAmount = parseFloat(transaction.netAmount || transaction.amount || '0');
      const status = (transaction.status || 'completed') as TransactionStatus;
      const currency = transaction.currency || 'LYD';

      totalAmount += amount;
      totalNet += netAmount;

      // إحصائيات الحالة
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

      // إحصائيات العملة
      if (!summary.byCurrency[currency]) {
        summary.byCurrency[currency] = { count: 0, amount: '0', net: '0' };
      }
      summary.byCurrency[currency].count += 1;
      summary.byCurrency[currency].amount = 
        (parseFloat(summary.byCurrency[currency].amount) + amount).toString();
      summary.byCurrency[currency].net = 
        (parseFloat(summary.byCurrency[currency].net) + netAmount).toString();
    });

    summary.totalAmount = totalAmount.toString();
    summary.totalNet = totalNet.toString();

    console.log(`📊 ملخص المعاملات: إجمالي ${totalCount}، مبلغ ${totalAmount}`);

    // تنسيق النتائج للعرض
    const rows: AdminTransactionDisplay[] = results.map(row => ({
      id: row.transaction.id,
      refNo: row.transaction.refNo,
      type: row.transaction.type as TransactionType,
      status: row.transaction.status as TransactionStatus,
      createdAt: row.transaction.createdAt?.toISOString() || '',
      updatedAt: row.transaction.updatedAt?.toISOString() || '',
      executedAt: row.transaction.executedAt?.toISOString(),
      fromAccountId: row.transaction.fromAccountId,
      toAccountId: row.transaction.toAccountId,
      userId: row.transaction.userId,
      officeId: row.transaction.officeId,
      cityFrom: row.transaction.cityFrom,
      cityTo: row.transaction.cityTo,
      currency: row.transaction.currency,
      amount: row.transaction.amount,
      rate: row.transaction.rate,
      feeSystem: row.transaction.feeSystem,
      feeRecipient: row.transaction.feeRecipient,
      netAmount: row.transaction.netAmount,
      channel: row.transaction.channel as TransactionChannel,
      createdBy: row.transaction.createdBy,
      approvedBy: row.transaction.approvedBy,
      kycLevel: row.transaction.kycLevel,
      riskScore: row.transaction.riskScore,
      flags: row.transaction.flags,
      parentTxnId: row.transaction.parentTxnId,
      externalProvider: row.transaction.externalProvider,
      externalRef: row.transaction.externalRef,
      notes: row.transaction.notes,
      meta: row.transaction.meta,
      userName: row.userName || `مستخدم ${row.transaction.userId}`,
      fromAccountName: row.transaction.fromAccountId,
      toAccountName: row.transaction.toAccountId
    }));

    return {
      rows,
      summary,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: offset + pageSize < totalCount,
        hasPrevious: page > 1
      }
    };
  }

  // جلب معاملة واحدة بالتفصيل
  static async getTransactionById(id: string): Promise<AdminTransactionDisplay | null> {
    const result = await db
      .select({
        transaction: adminTransactions,
        userName: users.fullName,
        userAccountNumber: users.accountNumber
      })
      .from(adminTransactions)
      .leftJoin(users, eq(adminTransactions.userId, users.id))
      .where(eq(adminTransactions.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.transaction.id,
      refNo: row.transaction.refNo,
      type: row.transaction.type as TransactionType,
      status: row.transaction.status as TransactionStatus,
      createdAt: row.transaction.createdAt?.toISOString() || '',
      updatedAt: row.transaction.updatedAt?.toISOString() || '',
      executedAt: row.transaction.executedAt?.toISOString(),
      fromAccountId: row.transaction.fromAccountId,
      toAccountId: row.transaction.toAccountId,
      userId: row.transaction.userId,
      officeId: row.transaction.officeId,
      cityFrom: row.transaction.cityFrom,
      cityTo: row.transaction.cityTo,
      currency: row.transaction.currency,
      amount: row.transaction.amount,
      rate: row.transaction.rate,
      feeSystem: row.transaction.feeSystem,
      feeRecipient: row.transaction.feeRecipient,
      netAmount: row.transaction.netAmount,
      channel: row.transaction.channel as TransactionChannel,
      createdBy: row.transaction.createdBy,
      approvedBy: row.transaction.approvedBy,
      kycLevel: row.transaction.kycLevel,
      riskScore: row.transaction.riskScore,
      flags: row.transaction.flags,
      parentTxnId: row.transaction.parentTxnId,
      externalProvider: row.transaction.externalProvider,
      externalRef: row.transaction.externalRef,
      notes: row.transaction.notes,
      meta: row.transaction.meta,
      userName: row.userName || `مستخدم ${row.transaction.userId}`,
      fromAccountName: row.transaction.fromAccountId,
      toAccountName: row.transaction.toAccountId
    };
  }

  // تحديث معاملة
  static async updateTransaction(id: string, updates: {
    status?: TransactionStatus;
    executedAt?: Date;
    approvedBy?: number;
    notes?: string;
    flags?: any;
    meta?: any;
  }) {
    const [updatedTransaction] = await db
      .update(adminTransactions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(adminTransactions.id, id))
      .returning();

    return updatedTransaction;
  }

  // إحصائيات سريعة للوحة التحكم
  static async getDashboardStats(timeframe: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const stats = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<string>`sum(${adminTransactions.amount})`,
        totalNet: sql<string>`sum(${adminTransactions.netAmount})`,
        status: adminTransactions.status,
        type: adminTransactions.type
      })
      .from(adminTransactions)
      .where(gte(adminTransactions.createdAt, startDate))
      .groupBy(adminTransactions.status, adminTransactions.type);

    return stats;
  }

  // البحث عن التكرار (للكشف عن المعاملات المشبوهة)
  static async findDuplicateTransactions(timeWindow: number = 5) {
    const timeThreshold = new Date(Date.now() - timeWindow * 60 * 1000);
    
    const duplicates = await db
      .select({
        amount: adminTransactions.amount,
        currency: adminTransactions.currency,
        fromAccountId: adminTransactions.fromAccountId,
        toAccountId: adminTransactions.toAccountId,
        count: sql<number>`count(*)`
      })
      .from(adminTransactions)
      .where(
        and(
          gte(adminTransactions.createdAt, timeThreshold),
          inArray(adminTransactions.status, [TransactionStatus.PENDING, TransactionStatus.SUCCESS])
        )
      )
      .groupBy(
        adminTransactions.amount,
        adminTransactions.currency,
        adminTransactions.fromAccountId,
        adminTransactions.toAccountId
      )
      .having(sql`count(*) > 1`);

    return duplicates;
  }
}