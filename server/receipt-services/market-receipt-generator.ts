import sharp from 'sharp';
import fs from 'fs/promises';

export interface MarketReceiptData {
  receiptNumber: string;
  transactionId: string;
  buyerAccount: string;
  sellerAccount: string;
  systemAccount: string;
  fromCurrency: string;
  toCurrency: string;
  soldAmount: string;
  purchaseValue: string;
  exchangeRate: string;
  commission: string;
  commissionCurrency: string;
  date: string;
  time: string;
  verificationHash: string;
  verificationUrl: string;
}

export class MarketReceiptGenerator {
  /**
   * إنشاء إيصال سوق العملات بصيغة حرارية 72mm
   */
  static async generateMarketReceipt(data: MarketReceiptData): Promise<Buffer> {
    const width = 272; // 72mm at 96 DPI
    const padding = 12;
    const contentWidth = width - (padding * 2);
    
    // إنشاء محتوى HTML للإيصال
    const htmlContent = `
      <div style="width: ${width}px; font-family: 'Amiri', 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; text-align: right; background: white; padding: ${padding}px; box-sizing: border-box;">
        <!-- العنوان -->
        <div style="text-align: center; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 8px;">
          <h1 style="font-size: 16px; font-weight: bold; margin: 0; color: #000;">إيصال سوق العملات</h1>
          <p style="font-size: 10px; margin: 4px 0 0 0; color: #666;">رقم الإيصال: ${data.receiptNumber}</p>
        </div>

        <!-- تفاصيل المعاملة -->
        <div style="margin-bottom: 12px;">
          <div style="font-size: 11px; line-height: 1.4; margin-bottom: 8px;">
            <strong>رقم المعاملة:</strong> ${data.transactionId}
          </div>
          <div style="font-size: 10px; line-height: 1.3; margin-bottom: 6px;">
            <strong>التاريخ:</strong> ${data.date} - ${data.time}
          </div>
        </div>

        <!-- تفاصيل الحسابات -->
        <div style="border: 1px solid #ddd; padding: 8px; margin-bottom: 12px; background: #f9f9f9;">
          <div style="font-size: 10px; line-height: 1.4; margin-bottom: 3px;">
            <strong>حساب البائع:</strong> ${data.sellerAccount}
          </div>
          <div style="font-size: 10px; line-height: 1.4; margin-bottom: 3px;">
            <strong>حساب المشتري:</strong> ${data.buyerAccount}
          </div>
          <div style="font-size: 10px; line-height: 1.4;">
            <strong>حساب النظام:</strong> ${data.systemAccount}
          </div>
        </div>

        <!-- تفاصيل الصرف -->
        <div style="border: 1px solid #333; padding: 8px; margin-bottom: 12px; background: #f5f5f5;">
          <div style="font-size: 11px; line-height: 1.4; margin-bottom: 4px;">
            <strong>المبلغ المباع:</strong> ${data.soldAmount} ${data.fromCurrency}
          </div>
          <div style="font-size: 11px; line-height: 1.4; margin-bottom: 4px;">
            <strong>قيمة الشراء:</strong> ${data.purchaseValue} ${data.toCurrency}
          </div>
          <div style="font-size: 10px; line-height: 1.4; margin-bottom: 4px;">
            <strong>سعر الصرف:</strong> 1 ${data.fromCurrency} = ${data.exchangeRate} ${data.toCurrency}
          </div>
          <div style="font-size: 10px; line-height: 1.4;">
            <strong>عمولة النظام:</strong> ${data.commission} ${data.commissionCurrency}
          </div>
        </div>

        <!-- معلومات التحقق -->
        <div style="border-top: 1px dashed #666; padding-top: 8px; margin-top: 12px;">
          <div style="font-size: 8px; line-height: 1.3; margin-bottom: 6px; color: #666;">
            <strong>رمز التحقق:</strong><br>
            <span style="font-family: monospace; word-break: break-all; font-size: 7px;">
              ${data.verificationHash.substring(0, 40)}...
            </span>
          </div>
          <div style="font-size: 8px; text-align: center; color: #666; margin-top: 8px;">
            منصة الصرافة - نظام إيصالات رقمية آمن
          </div>
        </div>
      </div>
    `;

    // إنشاء صورة بسيطة باستخدام sharp مع النص
    const lines = [
      "إيصال سوق العملات",
      `رقم الإيصال: ${data.receiptNumber}`,
      "",
      `رقم المعاملة: ${data.transactionId}`,
      `التاريخ: ${data.date} - ${data.time}`,
      "",
      "تفاصيل الحسابات:",
      `حساب البائع: ${data.sellerAccount}`,
      `حساب المشتري: ${data.buyerAccount}`,
      `حساب النظام: ${data.systemAccount}`,
      "",
      "تفاصيل الصرف:",
      `المبلغ المباع: ${data.soldAmount} ${data.fromCurrency}`,
      `قيمة الشراء: ${data.purchaseValue} ${data.toCurrency}`,
      `سعر الصرف: 1 ${data.fromCurrency} = ${data.exchangeRate} ${data.toCurrency}`,
      `عمولة النظام: ${data.commission} ${data.commissionCurrency}`,
      "",
      "رمز التحقق:",
      data.verificationHash.substring(0, 40) + "...",
      "",
      "منصة الصرافة - نظام إيصالات رقمية آمن"
    ];

    // إنشاء صورة بيضاء وإضافة النص
    const lineHeight = 20;
    const height = lines.length * lineHeight + 40;
    
    const canvas = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    // إضافة النص كـ SVG overlay
    const textSvg = `
      <svg width="${width}" height="${height}">
        ${lines.map((line, index) => {
          const y = 30 + (index * lineHeight);
          const fontSize = line === "إيصال سوق العملات" ? "16" : "12";
          const fontWeight = line === "إيصال سوق العملات" || line.includes(":") ? "bold" : "normal";
          return `<text x="${width/2}" y="${y}" font-family="Arial" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="middle" fill="black">${line}</text>`;
        }).join('')}
      </svg>
    `;

    const imageBuffer = await canvas
      .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    return imageBuffer;
  }

  /**
   * إعداد بيانات الإيصال من معاملة السوق
   */
  static async prepareMarketReceiptData(marketTransaction: any): Promise<MarketReceiptData> {
    // جلب بيانات إضافية
    const buyerData = await import('../db').then(({ db }) => 
      db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, marketTransaction.buyer_id)
      })
    );
    
    const sellerData = await import('../db').then(({ db }) => 
      db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, marketTransaction.seller_id)
      })
    );

    const now = new Date();
    const receiptNumber = `MKT-${marketTransaction.id}-${Date.now()}`;

    return {
      receiptNumber,
      transactionId: `REF-${marketTransaction.id}`,
      buyerAccount: buyerData?.accountNumber || 'غير محدد',
      sellerAccount: sellerData?.accountNumber || 'غير محدد', 
      systemAccount: '33003001', // حساب النظام الثابت
      fromCurrency: marketTransaction.from_currency,
      toCurrency: marketTransaction.to_currency,
      soldAmount: parseFloat(marketTransaction.amount).toFixed(2),
      purchaseValue: parseFloat(marketTransaction.total_cost).toFixed(2),
      exchangeRate: parseFloat(marketTransaction.rate).toFixed(4),
      commission: parseFloat(marketTransaction.commission || '0').toFixed(2),
      commissionCurrency: marketTransaction.to_currency, // عادة ما تكون العمولة بعملة الدفع
      date: now.toLocaleDateString('ar-EG'),
      time: now.toLocaleTimeString('ar-EG'),
      verificationHash: await this.generateVerificationHash(marketTransaction),
      verificationUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/verify/market/${marketTransaction.id}`
    };
  }

  /**
   * إنشاء رمز تحقق للمعاملة
   */
  private static async generateVerificationHash(transaction: any): Promise<string> {
    const crypto = await import('crypto');
    const data = `${transaction.id}-${transaction.buyer_id}-${transaction.seller_id}-${transaction.amount}-${transaction.total_cost}-${transaction.created_at}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}