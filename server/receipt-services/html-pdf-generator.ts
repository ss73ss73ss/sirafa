import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import moment from 'moment-timezone';
import { ReceiptData } from './pdf-generator';
import { CanonicalTransaction } from './crypto-service';

/**
 * HTML-based PDF generator with full Arabic support
 */
export class HtmlPdfGenerator {
  
  /**
   * Generate PDF receipt using HTML template and Puppeteer
   */
  static async generateReceipt(data: ReceiptData): Promise<Uint8Array> {
    const htmlTemplate = this.getHtmlTemplate();
    const template = Handlebars.compile(htmlTemplate);
    
    // Prepare template data
    const templateData = {
      receiptNumber: data.receiptNumber,
      date: moment(data.transaction.executed_at || new Date())
        .tz('Africa/Tripoli')
        .format('YYYY-MM-DD HH:mm:ss'),
      transaction: {
        ...data.transaction,
        typeArabic: this.getTransactionTypeArabic(data.transaction.txn_type),
        amountFormatted: `${data.transaction.amount_src?.value || 'غير محدد'} ${data.transaction.amount_src?.ccy || ''}`,
        commissionFormatted: data.transaction.fees && data.transaction.fees.length > 0 
          ? `${data.transaction.fees[0].value} ${data.transaction.fees[0].ccy}`
          : null,
        netAmountFormatted: data.transaction.net_to_beneficiary
          ? `${data.transaction.net_to_beneficiary.value} ${data.transaction.net_to_beneficiary.ccy}`
          : null,
        senderName: data.transaction.sender_ref || 'غير محدد',
        beneficiaryName: data.transaction.beneficiary_ref || 'غير محدد'
      },
      verificationHash: data.verificationInfo.hash,
      verificationHashShort: data.verificationInfo.hash.substring(0, 40) + '...',
      qrCodeUrl: data.verificationInfo.qrCodeUrl || ''
    };

    const html = template(templateData);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return new Uint8Array(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Get Arabic transaction type
   */
  private static getTransactionTypeArabic(type: string): string {
    const typeMapping: Record<string, string> = {
      'internal_transfer_out': 'تحويل داخلي - صادر',
      'internal_transfer_in': 'تحويل داخلي - وارد',
      'inter_office_transfer': 'تحويل بين المكاتب',
      'international_transfer': 'تحويل دولي'
    };
    return typeMapping[type] || type || 'غير محدد';
  }

  /**
   * HTML template with full Arabic support
   */
  private static getHtmlTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إيصال المعاملة</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans Arabic', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      background: #f8f9fa;
      padding: 20px;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .receipt {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .header .subtitle {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .content {
      padding: 30px;
    }
    
    .receipt-info {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
      border-right: 4px solid #3b82f6;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    
    .info-label {
      font-weight: 600;
      color: #475569;
    }
    
    .info-value {
      color: #1e293b;
      font-weight: 500;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #3b82f6;
    }
    
    .transaction-details {
      background: #fafafa;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e5e7eb;
    }
    
    .amount-highlight {
      background: #dcfce7;
      border: 1px solid #16a34a;
      border-radius: 6px;
      padding: 12px;
      margin: 10px 0;
      text-align: center;
    }
    
    .amount-highlight .amount {
      font-size: 20px;
      font-weight: 700;
      color: #16a34a;
    }
    
    .parties-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }
    
    .party {
      background: #f8fafc;
      border-radius: 8px;
      padding: 15px;
      border: 1px solid #e2e8f0;
    }
    
    .party-title {
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .verification {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .hash {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #1f2937;
      color: #f9fafb;
      padding: 8px;
      border-radius: 4px;
      margin: 10px 0;
      word-break: break-all;
      direction: ltr;
      text-align: left;
    }
    
    .qr-section {
      text-align: center;
      margin: 20px 0;
    }
    
    .footer {
      background: #1f2937;
      color: white;
      padding: 25px;
      text-align: center;
    }
    
    .company-info {
      margin-bottom: 15px;
    }
    
    .company-name {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .company-location {
      opacity: 0.8;
    }
    
    .footer-note {
      font-size: 12px;
      opacity: 0.7;
      border-top: 1px solid #374151;
      padding-top: 15px;
      margin-top: 15px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Header -->
    <div class="header">
      <h1>إيصال المعاملة</h1>
      <div class="subtitle">منصة الصرافة الليبية - مكتب صرافة رقمي</div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Receipt Info -->
      <div class="receipt-info">
        <div class="info-row">
          <span class="info-label">رقم الإيصال:</span>
          <span class="info-value">{{receiptNumber}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">التاريخ والوقت:</span>
          <span class="info-value">{{date}} (توقيت ليبيا)</span>
        </div>
      </div>

      <!-- Transaction Details -->
      <div class="section">
        <h2 class="section-title">تفاصيل المعاملة</h2>
        <div class="transaction-details">
          <div class="info-row">
            <span class="info-label">نوع المعاملة:</span>
            <span class="info-value">{{transaction.typeArabic}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">المبلغ:</span>
            <span class="info-value">{{transaction.amountFormatted}}</span>
          </div>
          {{#if transaction.commissionFormatted}}
          <div class="info-row">
            <span class="info-label">العمولة:</span>
            <span class="info-value">{{transaction.commissionFormatted}}</span>
          </div>
          {{/if}}
          {{#if transaction.netAmountFormatted}}
          <div class="amount-highlight">
            <div>صافي المبلغ للمستفيد</div>
            <div class="amount">{{transaction.netAmountFormatted}}</div>
          </div>
          {{/if}}
        </div>
      </div>

      <!-- Parties Information -->
      <div class="section">
        <h2 class="section-title">معلومات الأطراف</h2>
        <div class="parties-info">
          <div class="party">
            <div class="party-title">المرسل</div>
            <div>الاسم: {{transaction.senderName}}</div>
            <div>رقم الحساب: {{transaction.senderName}}</div>
          </div>
          <div class="party">
            <div class="party-title">المستفيد</div>
            <div>الاسم: {{transaction.beneficiaryName}}</div>
            <div>رقم الحساب: {{transaction.beneficiaryName}}</div>
          </div>
        </div>
      </div>

      <!-- Verification -->
      <div class="section">
        <h2 class="section-title">التحقق من الإيصال</h2>
        <div class="verification">
          <p><strong>التوقيع الرقمي:</strong></p>
          <div class="hash">{{verificationHashShort}}</div>
          <div class="qr-section">
            <p>امسح رمز QR للتحقق من صحة الإيصال</p>
            {{#if qrCodeUrl}}
            <img src="{{qrCodeUrl}}" alt="QR Code" style="max-width: 150px; margin-top: 10px;">
            {{/if}}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="company-info">
        <div class="company-name">منصة الصرافة الليبية</div>
        <div class="company-location">طرابلس، ليبيا</div>
      </div>
      <div class="footer-note">
        هذا الإيصال موقع رقمياً ومؤمن. يمكن التحقق من صحته عبر رمز QR أعلاه.
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}