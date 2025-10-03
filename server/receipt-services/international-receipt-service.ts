import { db } from '../db';
import { receipts, receiptAuditLog } from '@shared/schema';
import { CryptoService, CanonicalTransaction } from './crypto-service';
import { ThermalReceiptGenerator } from './thermal-receipt-generator';
import { sql } from 'drizzle-orm';
import moment from 'moment-timezone';
import path from 'path';
import fs from 'fs/promises';

export interface InternationalTransactionData {
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
  receiverCode?: string;
  destinationCountry?: string;
  recipientPhone?: string;
}

export interface InternationalReceiptData {
  receiptNumber: string;
  transaction: CanonicalTransaction;
  companyInfo: {
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    phone: string;
    email: string;
    registrationNumber?: string;
    taxNumber?: string;
  };
  senderInfo: {
    name: string;
    accountNumber: string;
    city: string;
  };
  beneficiaryInfo: {
    name: string;
    accountNumber: string;
    city: string;
    country?: string;
    phone?: string;
  };
  transferInfo: {
    receiverCode: string;
    destinationCountry: string;
    transferType: 'international';
  };
  verificationInfo: {
    hash: string;
    jwsToken: string;
    verificationUrl: string;
  };
  locale: 'ar' | 'en';
}

export class InternationalReceiptService {
  private static readonly STORAGE_BASE_PATH = './public/receipts';
  private static readonly VERIFICATION_BASE_URL = process.env.VERIFICATION_BASE_URL || 'https://localhost:3000';

  /**
   * إنشاء إيصال خاص بالتحويل الدولي
   */
  static async generateInternationalTransferReceipt(
    transactionData: InternationalTransactionData,
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
      
      // إنشاء رقم الإيصال الخاص بالتحويل الدولي
      const receiptNumber = this.generateInternationalReceiptNumber(transactionData.id, transactionData.receiverCode || '');
      
      // إعداد بيانات الإيصال الخاص بالتحويل الدولي
      const receiptData: InternationalReceiptData = {
        receiptNumber,
        transaction: canonicalTransaction as any, // تحويل النوع مؤقتاً
        companyInfo: await this.getCompanyInfo(),
        senderInfo: await this.getSenderInfo(transactionData.userId),
        beneficiaryInfo: await this.getBeneficiaryInfo(transactionData),
        transferInfo: {
          receiverCode: transactionData.receiverCode || '',
          destinationCountry: transactionData.destinationCountry || '',
          transferType: 'international'
        },
        verificationInfo: {
          hash,
          jwsToken,
          verificationUrl: `${this.VERIFICATION_BASE_URL}/r/${transactionData.id}?t=${jwsToken}`
        },
        locale
      };
      
      // تحويل البيانات وإنشاء الإيصال الحراري
      const adaptedData = this.adaptReceiptData(receiptData);
      const imageBuffer = await ThermalReceiptGenerator.generateThermalReceipt(adaptedData);
      
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
        receiptNumber,
        type: 'international_transfer',
        receiverCode: transactionData.receiverCode
      });

      return receipt.id;
    } catch (error) {
      console.error('خطأ في إنشاء إيصال التحويل الدولي:', error);
      throw new Error('فشل في إنشاء إيصال التحويل الدولي');
    }
  }

  /**
   * تحويل بيانات الإيصال الدولي إلى التنسيق المطلوب
   */
  private static adaptReceiptData(data: InternationalReceiptData): any {
    return {
      receiptNumber: data.receiptNumber,
      transaction: {
        transaction_id: data.transaction.txn_id,
        user_id: '1',
        transaction_type: data.transaction.txn_type,
        amount_original: data.transaction.amount_src.value,
        commission_system: data.transaction.fees.length > 0 ? data.transaction.fees[0].value : '0',
        currency_code: data.transaction.amount_src.ccy,
        counterparty_name: data.beneficiaryInfo.name,
        reference_number: data.transaction.beneficiary_ref,
        notes: `تحويل دولي إلى ${data.transferInfo.destinationCountry}`,
        executed_at: data.transaction.executed_at,
        status: 'completed',
        receiver_code: data.transferInfo.receiverCode,
        destination_country: data.transferInfo.destinationCountry
      },
      companyInfo: data.companyInfo,
      senderInfo: data.senderInfo,
      beneficiaryInfo: data.beneficiaryInfo,
      verificationInfo: data.verificationInfo,
      locale: data.locale
    };
  }


  /**
   * إنشاء رقم الإيصال الخاص بالتحويل الدولي
   */
  private static generateInternationalReceiptNumber(txnId: string, receiverCode: string): string {
    const timestamp = Date.now();
    const prefix = 'INT'; // International Transfer
    return `${prefix}-${timestamp}-${receiverCode}`;
  }

  /**
   * تحويل بيانات المعاملة إلى تنسيق قانوني
   */
  private static async createCanonicalTransaction(data: InternationalTransactionData): Promise<CanonicalTransaction> {
    const commissionAmount = parseFloat(data.commission || '0');
    
    return {
      txn_id: data.id,
      txn_type: 'international_transfer',
      executed_at: data.executedAt.toISOString(),
      timezone: 'Africa/Tripoli',
      amount_src: {
        ccy: data.currency,
        value: data.amount
      },
      net_to_beneficiary: {
        ccy: data.currency,
        value: data.amount
      },
      fees: commissionAmount > 0 ? [
        {
          name: 'commission',
          ccy: data.currency,
          value: data.commission || '0'
        }
      ] : [],
      taxes: [], // مصفوفة فارغة للضرائب
      sender_ref: data.ref || '',
      beneficiary_ref: data.referenceNumber || data.receiverCode || '',
      office_ref: data.receiverCode || '',
      version: 1
    };
  }

  /**
   * الحصول على معلومات الشركة
   */
  private static async getCompanyInfo() {
    return {
      name: 'منصة الصرافة الليبية',
      nameEn: 'Libya Exchange Platform',
      address: 'طرابلس، ليبيا',
      addressEn: 'Tripoli, Libya',
      phone: '+218-XXX-XXXXXX',
      email: 'info@example.com',
      registrationNumber: 'REG-2024-001',
      taxNumber: 'TAX-2024-001'
    };
  }

  /**
   * الحصول على معلومات المرسل
   */
  private static async getSenderInfo(userId: number) {
    // استعلام من قاعدة البيانات للحصول على بيانات المرسل
    const result = await db.execute(sql`
      SELECT full_name, account_number, city 
      FROM users 
      WHERE id = ${userId}
    `);
    
    const user = result.rows[0] as any;
    return {
      name: user?.full_name || 'غير محدد',
      accountNumber: user?.account_number || `#${userId}`,
      city: user?.city || 'غير محدد'
    };
  }

  /**
   * الحصول على معلومات المستفيد
   */
  private static async getBeneficiaryInfo(data: InternationalTransactionData) {
    return {
      name: data.counterparty || 'غير محدد',
      accountNumber: data.referenceNumber || '',
      city: '',
      country: data.destinationCountry || '',
      phone: data.recipientPhone || ''
    };
  }

  /**
   * حفظ ملف الإيصال
   */
  private static async saveReceiptFile(
    txnId: string, 
    buffer: Buffer, 
    locale: string, 
    format: 'png' | 'pdf'
  ): Promise<string> {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `international-${txnId}-${locale}-${Date.now()}.${format}`;
    const filePath = path.join(this.STORAGE_BASE_PATH, timestamp, filename);
    
    // إنشاء المجلد إذا لم يكن موجوداً
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // حفظ الملف
    await fs.writeFile(filePath, buffer);
    
    return filePath;
  }

  /**
   * تسجيل إجراءات التدقيق
   */
  private static async logAuditAction(
    receiptId: string, 
    action: string, 
    userId: string, 
    metadata?: any
  ): Promise<void> {
    await db.insert(receiptAuditLog).values({
      receiptId,
      action,
      userId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      timestamp: new Date()
    });
  }

  /**
   * تحويل رمز الدولة إلى اسم
   */
  private static getCountryName(countryCode: string): string {
    const countries: { [key: string]: string } = {
      'AE': 'الإمارات العربية المتحدة',
      'EG': 'مصر',
      'SA': 'السعودية',
      'TN': 'تونس',
      'MA': 'المغرب',
      'JO': 'الأردن',
      'LB': 'لبنان',
      'SY': 'سوريا',
      'IQ': 'العراق',
      'KW': 'الكويت',
      'BH': 'البحرين',
      'QA': 'قطر',
      'OM': 'عُمان',
      'YE': 'اليمن',
      'PS': 'فلسطين',
      'SD': 'السودان',
      'DZ': 'الجزائر',
      'LY': 'ليبيا',
      'TR': 'تركيا',
      'US': 'الولايات المتحدة',
      'GB': 'بريطانيا',
      'DE': 'ألمانيا',
      'FR': 'فرنسا',
      'IT': 'إيطاليا',
      'ES': 'إسبانيا',
      'CA': 'كندا',
      'AU': 'أستراليا',
      'BR': 'البرازيل',
      'CN': 'الصين',
      'JP': 'اليابان',
      'IN': 'الهند',
      'RU': 'روسيا'
    };
    return countries[countryCode] || countryCode;
  }

  /**
   * نص حالة التحويل
   */
  private static getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'في الانتظار',
      'completed': 'مكتملة',
      'cancelled': 'ملغية',
      'failed': 'فاشلة'
    };
    return statusMap[status] || status;
  }
}