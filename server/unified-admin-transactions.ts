import { db } from "./db";
import { sql } from "drizzle-orm";

// أنواع المعاملات
export interface UnifiedTransaction {
  id: string;
  refNo: string;
  type: string;
  status: string;
  createdAt: string;
  amount: string;
  currency: string;
  description?: string;
  userName: string;
  userAccountNumber: string;
  source: string;
}

export interface TransactionSummary {
  totalCount: number;
  totalAmount: string;
  byCurrency: { [key: string]: { count: number; amount: string } };
}

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

// النظام الموحد لجلب جميع معاملات المستخدمين
export class UnifiedAdminTransactions {
  static async getAllTransactions(filters: TransactionFilters = {}): Promise<{
    rows: UnifiedTransaction[];
    summary: TransactionSummary;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const offset = (page - 1) * pageSize;

    console.log('🔍 جلب جميع معاملات المستخدمين من جميع الجداول...');

    try {

      console.log('📊 تنفيذ استعلامات البيانات والعد...');
      
      // تنفيذ الاستعلام باستخدام sql template literals
      const [dataResult, countResult] = await Promise.all([
        db.execute(sql`
          WITH all_transactions AS (
            -- 1. المعاملات الإدارية
            SELECT 
              'admin' as source,
              at.id::text as id,
              COALESCE(at.ref_no, 'ADM-' || at.id) as ref_no,
              at.type,
              COALESCE(at.status, 'completed') as status,
              at.created_at,
              COALESCE(at.amount::text, '0') as amount,
              COALESCE(at.currency, 'LYD') as currency,
              COALESCE(at.notes, '') as description,
              COALESCE(u.full_name, 'غير محدد') as user_name,
              COALESCE(u.account_number, '') as user_account_number
            FROM admin_transactions at
            LEFT JOIN users u ON at.user_id = u.id
            
            UNION ALL
            
            -- 2. المعاملات العادية
            SELECT 
              'regular' as source,
              t.id::text as id,
              COALESCE(t.reference_number, 'TX-' || t.id) as ref_no,
              COALESCE(t.type, 'unknown') as type,
              'completed' as status,
              t.date as created_at,
              COALESCE(t.amount::text, '0') as amount,
              COALESCE(t.currency, 'LYD') as currency,
              COALESCE(t.description, '') as description,
              COALESCE(u.full_name, 'غير محدد') as user_name,
              COALESCE(u.account_number, '') as user_account_number
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            
            UNION ALL
            
            -- 3. التحويلات الداخلية (المرسلة)
            SELECT 
              'internal_transfer' as source,
              tr.id::text as id,
              'TR-' || tr.id as ref_no,
              'internal_transfer_out' as type,
              'completed' as status,
              tr.created_at,
              COALESCE(tr.amount::text, '0') as amount,
              COALESCE(tr.currency, 'LYD') as currency,
              'تحويل داخلي صادر إلى ' || COALESCE(ur.full_name, 'غير محدد') || ' (رقم الحساب: ' || COALESCE(ur.account_number, '') || ')' as description,
              COALESCE(us.full_name, 'غير محدد') as user_name,
              COALESCE(us.account_number, '') as user_account_number
            FROM transfers tr
            LEFT JOIN users us ON tr.sender_id = us.id
            LEFT JOIN users ur ON tr.receiver_id = ur.id
            
            UNION ALL
            
            -- 4. التحويلات الداخلية (المستلمة)
            SELECT 
              'internal_transfer' as source,
              tr.id::text as id,
              'TR-' || tr.id || '-IN' as ref_no,
              'internal_transfer_in' as type,
              'completed' as status,
              tr.created_at,
              COALESCE(tr.amount::text, '0') as amount,
              COALESCE(tr.currency, 'LYD') as currency,
              'تحويل داخلي وارد من ' || COALESCE(us.full_name, 'غير محدد') || ' (رقم الحساب: ' || COALESCE(us.account_number, '') || ')' as description,
              COALESCE(ur.full_name, 'غير محدد') as user_name,
              COALESCE(ur.account_number, '') as user_account_number
            FROM transfers tr
            LEFT JOIN users us ON tr.sender_id = us.id
            LEFT JOIN users ur ON tr.receiver_id = ur.id
            
            UNION ALL
            
            -- 5. التحويلات الدولية/بين المكاتب
            SELECT 
              'international' as source,
              iot.id::text as id,
              COALESCE(iot.transfer_code, 'IO-' || iot.id) as ref_no,
              'international_transfer' as type,
              COALESCE(iot.status, 'pending') as status,
              iot.created_at,
              COALESCE(iot.amount::text, '0') as amount,
              COALESCE(iot.currency, 'LYD') as currency,
              'تحويل دولي إلى ' || COALESCE(iot.recipient_name, 'غير محدد') || ' - ' || COALESCE(iot.country, 'غير محدد') as description,
              COALESCE(u.full_name, 'غير محدد') as user_name,
              COALESCE(u.account_number, '') as user_account_number
            FROM agent_transfers iot
            LEFT JOIN users u ON iot.sender_id = u.id
            
            UNION ALL
            
            -- 6. تحويلات المدن
            SELECT 
              'city_transfer' as source,
              ct.id::text as id,
              'CT-' || ct.id as ref_no,
              'city_transfer' as type,
              COALESCE(ct.status, 'pending') as status,
              ct.created_at,
              COALESCE(ct.amount::text, '0') as amount,
              COALESCE(ct.currency, 'LYD') as currency,
              'تحويل بين المدن إلى ' || COALESCE(ur.full_name, 'مكتب غير محدد') as description,
              COALESCE(us.full_name, 'غير محدد') as user_name,
              COALESCE(us.account_number, '') as user_account_number
            FROM city_transfers ct
            LEFT JOIN users us ON ct.sender_id = us.id
            LEFT JOIN users ur ON ct.receiver_office_id = ur.id
            
            UNION ALL
            
            -- 7. معاملات السوق
            SELECT 
              'market' as source,
              mt.id::text as id,
              'MK-' || mt.id as ref_no,
              'market_trade' as type,
              'completed' as status,
              mt.created_at,
              COALESCE(mt.amount::text, '0') as amount,
              'USD' as currency,
              'معاملة سوق العملات - إجمالي التكلفة: ' || COALESCE(mt.total_cost::text, '0') || ' - عمولة: ' || COALESCE(mt.commission::text, '0') as description,
              COALESCE(u.full_name, 'غير محدد') as user_name,
              COALESCE(u.account_number, '') as user_account_number
            FROM market_transactions mt
            LEFT JOIN users u ON mt.buyer_id = u.id
          )
          SELECT 
            source,
            id,
            ref_no,
            type,
            status,
            created_at,
            amount,
            currency,
            description,
            user_name,
            user_account_number
          FROM all_transactions 
          WHERE 1=1 
          ${filters.dateFrom && filters.dateTo ? sql`AND created_at BETWEEN ${filters.dateFrom} AND ${filters.dateTo + ' 23:59:59'}` : sql``}
          ${filters.dateFrom && !filters.dateTo ? sql`AND created_at >= ${filters.dateFrom}` : sql``}
          ${!filters.dateFrom && filters.dateTo ? sql`AND created_at <= ${filters.dateTo + ' 23:59:59'}` : sql``}
          ${filters.q ? sql`AND (
            ref_no ILIKE ${'%' + filters.q + '%'} OR 
            description ILIKE ${'%' + filters.q + '%'} OR 
            user_name ILIKE ${'%' + filters.q + '%'} OR 
            user_account_number ILIKE ${'%' + filters.q + '%'}
          )` : sql``}
          ORDER BY created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `),
        db.execute(sql`
          SELECT COUNT(*) as total FROM (
            SELECT at.created_at, COALESCE(at.ref_no, 'ADM-' || at.id) as ref_no, COALESCE(at.notes, '') as description, COALESCE(u.full_name, 'غير محدد') as user_name, COALESCE(u.account_number, '') as user_account_number
            FROM admin_transactions at LEFT JOIN users u ON at.user_id = u.id
            UNION ALL
            SELECT t.date as created_at, COALESCE(t.reference_number, 'TX-' || t.id) as ref_no, COALESCE(t.description, '') as description, COALESCE(u.full_name, 'غير محدد') as user_name, COALESCE(u.account_number, '') as user_account_number
            FROM transactions t LEFT JOIN users u ON t.user_id = u.id
            UNION ALL
            SELECT tr.created_at, 'TR-' || tr.id as ref_no, 'تحويل داخلي صادر' as description, COALESCE(us.full_name, 'غير محدد') as user_name, COALESCE(us.account_number, '') as user_account_number
            FROM transfers tr LEFT JOIN users us ON tr.sender_id = us.id
            UNION ALL
            SELECT tr.created_at, 'TR-' || tr.id || '-IN' as ref_no, 'تحويل داخلي وارد' as description, COALESCE(ur.full_name, 'غير محدد') as user_name, COALESCE(ur.account_number, '') as user_account_number
            FROM transfers tr LEFT JOIN users ur ON tr.receiver_id = ur.id
            UNION ALL
            SELECT iot.created_at, COALESCE(iot.transfer_code, 'IO-' || iot.id) as ref_no, 'تحويل دولي' as description, COALESCE(u.full_name, 'غير محدد') as user_name, COALESCE(u.account_number, '') as user_account_number
            FROM agent_transfers iot LEFT JOIN users u ON iot.sender_id = u.id
            UNION ALL
            SELECT ct.created_at, 'CT-' || ct.id as ref_no, 'تحويل بين المدن' as description, COALESCE(us.full_name, 'غير محدد') as user_name, COALESCE(us.account_number, '') as user_account_number
            FROM city_transfers ct LEFT JOIN users us ON ct.sender_id = us.id
            UNION ALL
            SELECT mt.created_at, 'MK-' || mt.id as ref_no, 'معاملة سوق' as description, COALESCE(u.full_name, 'غير محدد') as user_name, COALESCE(u.account_number, '') as user_account_number
            FROM market_transactions mt LEFT JOIN users u ON mt.buyer_id = u.id
          ) all_transactions
          WHERE 1=1 
          ${filters.dateFrom && filters.dateTo ? sql`AND created_at BETWEEN ${filters.dateFrom} AND ${filters.dateTo + ' 23:59:59'}` : sql``}
          ${filters.dateFrom && !filters.dateTo ? sql`AND created_at >= ${filters.dateFrom}` : sql``}
          ${!filters.dateFrom && filters.dateTo ? sql`AND created_at <= ${filters.dateTo + ' 23:59:59'}` : sql``}
          ${filters.q ? sql`AND (
            ref_no ILIKE ${'%' + filters.q + '%'} OR 
            description ILIKE ${'%' + filters.q + '%'} OR 
            user_name ILIKE ${'%' + filters.q + '%'} OR 
            user_account_number ILIKE ${'%' + filters.q + '%'}
          )` : sql``}
        `)
      ]);

      const results = Array.isArray(dataResult) ? dataResult : dataResult.rows || [];
      const totalCount = Array.isArray(countResult) ? countResult[0]?.total || 0 : countResult.rows?.[0]?.total || 0;

      console.log(`✅ تم جلب ${results.length} معاملة من أصل ${totalCount}`);

      // حساب الملخص
      let totalAmount = 0;
      const byCurrency: { [key: string]: { count: number; amount: string } } = {};

      results.forEach((row: any) => {
        const amount = parseFloat(row.amount || '0');
        const currency = row.currency || 'LYD';
        
        totalAmount += Math.abs(amount);
        
        if (!byCurrency[currency]) {
          byCurrency[currency] = { count: 0, amount: '0' };
        }
        byCurrency[currency].count += 1;
        byCurrency[currency].amount = (parseFloat(byCurrency[currency].amount) + Math.abs(amount)).toString();
      });

      const summary: TransactionSummary = {
        totalCount: Number(totalCount),
        totalAmount: totalAmount.toString(),
        byCurrency
      };

      // تحويل النتائج للتنسيق المطلوب
      const formattedResults = results.map((row: any): UnifiedTransaction => ({
        id: row.id,
        refNo: row.ref_no,
        type: row.type,
        status: row.status,
        createdAt: row.created_at,
        amount: row.amount,
        currency: row.currency,
        description: row.description,
        userName: row.user_name,
        userAccountNumber: row.user_account_number,
        source: row.source
      }));

      const totalPages = Math.ceil(Number(totalCount) / pageSize);

      return {
        rows: formattedResults,
        summary,
        pagination: {
          page,
          pageSize,
          total: Number(totalCount),
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };

    } catch (error) {
      console.error('❌ خطأ في جلب المعاملات الموحدة:', error);
      return {
        rows: [],
        summary: {
          totalCount: 0,
          totalAmount: '0',
          byCurrency: {}
        },
        pagination: {
          page: 1,
          pageSize,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        }
      };
    }
  }
}