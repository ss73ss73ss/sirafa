import { db } from "./db";
import { adminTransactions, transactions, users } from "@shared/schema";
import { eq, and, or, desc, asc, sql, like, gte, lte, inArray } from "drizzle-orm";

// أنواع المعاملات
export interface TransactionRow {
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
  source: 'admin' | 'regular';
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
  type?: string;
  status?: string;
  currency?: string;
  amountMin?: string;
  amountMax?: string;
  page?: number;
  pageSize?: number;
}

// دالة مبسطة لجلب جميع المعاملات
export class AdminTransactionsFixed {
  static async getAllTransactions(filters: TransactionFilters = {}): Promise<{
    rows: TransactionRow[];
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

    console.log('🔍 جلب جميع المعاملات...');
    console.log('🎯 الفلاتر المستلمة:', JSON.stringify(filters, null, 2));

    try {
      // جلب المعاملات الإدارية
      let adminQuery = `
        SELECT 
          'admin' as source,
          at.id::text,
          at.ref_no as refNo,
          at.type,
          COALESCE(at.status, 'completed') as status,
          at.created_at as createdAt,
          at.amount,
          at.currency,
          at.notes as description,
          u.full_name as userName,
          u.account_number as userAccountNumber
        FROM admin_transactions at
        LEFT JOIN users u ON at.user_id = u.id
        WHERE 1=1
      `;

      // جلب المعاملات العادية - جميع الأنواع
      let regularQuery = `
        SELECT 
          'regular' as source,
          t.id::text,
          COALESCE(t.reference_number, 'TX-' || t.id) as refNo,
          t.type,
          'completed' as status,
          t.date as createdAt,
          t.amount,
          t.currency,
          t.description,
          u.full_name as userName,
          u.account_number as userAccountNumber
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;

      // إضافة فلاتر التاريخ
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (filters.dateFrom) {
        adminQuery += ` AND at.created_at >= '${filters.dateFrom}'`;
        regularQuery += ` AND t.date >= '${filters.dateFrom}'`;
      }

      if (filters.dateTo) {
        adminQuery += ` AND at.created_at <= '${filters.dateTo}'`;
        regularQuery += ` AND t.date <= '${filters.dateTo}'`;
      }

      // إضافة فلتر البحث
      if (filters.q) {
        const searchTerm = `%${filters.q}%`;
        adminQuery += ` AND (at.ref_no ILIKE '${searchTerm}' OR at.notes ILIKE '${searchTerm}' OR u.full_name ILIKE '${searchTerm}' OR u.account_number ILIKE '${searchTerm}')`;
        regularQuery += ` AND (t.reference_number ILIKE '${searchTerm}' OR t.description ILIKE '${searchTerm}' OR u.full_name ILIKE '${searchTerm}' OR u.account_number ILIKE '${searchTerm}')`;
      }

      // إضافة فلتر النوع
      if (filters.type) {
        adminQuery += ` AND at.type = '${filters.type}'`;
        regularQuery += ` AND t.type = '${filters.type}'`;
      }

      // إضافة فلتر الحالة
      if (filters.status) {
        adminQuery += ` AND COALESCE(at.status, 'completed') = '${filters.status}'`;
        // المعاملات العادية دائماً completed، لذلك نفلتر فقط للـ completed
        if (filters.status !== 'completed') {
          regularQuery += ` AND 1=0`; // لا نريد نتائج من المعاملات العادية إذا كان الفلتر غير completed
        }
      }

      // إضافة فلتر العملة  
      if (filters.currency) {
        adminQuery += ` AND at.currency = '${filters.currency}'`;
        regularQuery += ` AND t.currency = '${filters.currency}'`;
      }

      // إضافة فلتر المبلغ الأدنى
      if (filters.amountMin) {
        adminQuery += ` AND CAST(at.amount AS DECIMAL) >= ${filters.amountMin}`;
        regularQuery += ` AND CAST(t.amount AS DECIMAL) >= ${filters.amountMin}`;
      }

      // إضافة فلتر المبلغ الأعلى
      if (filters.amountMax) {
        adminQuery += ` AND CAST(at.amount AS DECIMAL) <= ${filters.amountMax}`;
        regularQuery += ` AND CAST(t.amount AS DECIMAL) <= ${filters.amountMax}`;
      }

      console.log('📋 تنفيذ الاستعلامات منفصلة...');
      
      // تنفيذ الاستعلامات منفصلة ثم دمجها
      const [adminQueryResult, regularQueryResult] = await Promise.all([
        db.execute(sql.raw(adminQuery)),
        db.execute(sql.raw(regularQuery))
      ]);

      // استخراج الصفوف من النتائج
      const adminResults = Array.isArray(adminQueryResult) ? adminQueryResult : adminQueryResult.rows || [];
      const regularResults = Array.isArray(regularQueryResult) ? regularQueryResult : regularQueryResult.rows || [];

      // دمج النتائج
      const allResults = [...adminResults, ...regularResults];
      
      // ترتيب النتائج حسب التاريخ
      allResults.sort((a: any, b: any) => {
        const dateA = new Date(a.createdat || a.createdAt).getTime();
        const dateB = new Date(b.createdat || b.createdAt).getTime();
        return dateB - dateA; // ترتيب تنازلي
      });
      
      console.log(`📊 إجمالي المعاملات: ${allResults.length} (${adminResults.length} إدارية + ${regularResults.length} عادية)`);
      
      // حساب الملخص
      let totalAmount = 0;
      const byCurrency: { [key: string]: { count: number; amount: string } } = {};

      allResults.forEach((row: any) => {
        const amount = parseFloat(row.amount || '0');
        const currency = row.currency || 'LYD';
        
        totalAmount += Math.abs(amount); // استخدام القيمة المطلقة لحساب المجموع
        
        if (!byCurrency[currency]) {
          byCurrency[currency] = { count: 0, amount: '0' };
        }
        byCurrency[currency].count += 1;
        byCurrency[currency].amount = (parseFloat(byCurrency[currency].amount) + Math.abs(amount)).toString();
      });

      const summary: TransactionSummary = {
        totalCount: allResults.length,
        totalAmount: totalAmount.toString(),
        byCurrency
      };

      // تطبيق التصفح
      const paginatedResults = allResults.slice(offset, offset + pageSize);
      
      // تحويل النتائج للتنسيق المطلوب
      const rows: TransactionRow[] = paginatedResults.map((row: any) => ({
        id: row.id,
        refNo: row.refno || `REF-${row.id}`,
        type: row.type,
        status: row.status,
        createdAt: new Date(row.createdat).toISOString(),
        amount: row.amount,
        currency: row.currency,
        description: row.description || '',
        userName: row.username || `مستخدم ${row.id}`,
        userAccountNumber: row.useraccountnumber || '',
        source: row.source as 'admin' | 'regular'
      }));

      console.log(`✅ تم جلب ${rows.length} معاملة من أصل ${allResults.length}`);

      return {
        rows,
        summary,
        pagination: {
          page,
          pageSize,
          total: allResults.length,
          totalPages: Math.ceil(allResults.length / pageSize),
          hasNext: offset + pageSize < allResults.length,
          hasPrevious: page > 1
        }
      };

    } catch (error: any) {
      console.error('❌ خطأ في جلب المعاملات:', error);
      throw new Error(`فشل في جلب المعاملات: ${error?.message || 'خطأ غير معروف'}`);
    }
  }
}