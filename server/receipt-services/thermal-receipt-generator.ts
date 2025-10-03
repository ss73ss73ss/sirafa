import moment from 'moment-timezone';
import QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import { ReceiptData } from './pdf-generator';

/**
 * مولد الإيصالات الحرارية - بحجم 72mm × 96mm
 */
export class ThermalReceiptGenerator {
  /**
   * إنشاء إيصال حراري بالحجم المطلوب
   */
  static async generateThermalReceipt(data: ReceiptData): Promise<Buffer> {
    let browser;
    try {
      // إعدادات Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium' || '/usr/bin/chromium' || undefined
      });

      const page = await browser.newPage();
      
      // تحديد حجم الصفحة بدقة - 72mm × 96mm 
      await page.setViewport({ width: 272, height: 363, deviceScaleFactor: 1 });

      // إنشاء HTML للإيصال
      const html = await this.generateThermalReceiptHTML(data);
      
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // التقاط صورة بالحجم المحدد تماماً
      const imageBuffer = await page.screenshot({
        type: 'png',
        clip: {
          x: 0,
          y: 0,
          width: 272,
          height: 363
        },
        omitBackground: false
      });

      return Buffer.from(imageBuffer);
    } catch (error) {
      console.error('خطأ في إنشاء الإيصال الحراري:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * إنشاء HTML للإيصال الحراري
   */
  private static async generateThermalReceiptHTML(data: ReceiptData): Promise<string> {
    // إنشاء QR code صغير
    let qrCodeDataUrl = '';
    try {
      if (data.verificationInfo.verificationUrl) {
        qrCodeDataUrl = await QRCode.toDataURL(data.verificationInfo.verificationUrl, {
          width: 80,
          margin: 1
        });
      }
    } catch (error) {
      console.error('خطأ في إنشاء QR code:', error);
    }

    const dateStr = moment(data.transaction.executed_at || new Date())
      .tz('Africa/Tripoli')
      .format('DD-MM-YYYY | HH:mm');

    // تحديد نوع المعاملة
    const typeMapping: Record<string, string> = {
      'internal_transfer_out': 'تحويل داخلي',
      'internal_transfer_in': 'تحويل داخلي',
      'inter_office_transfer': 'تحويل بين المكاتب',
      'international_transfer': 'تحويل دولي'
    };

    const transactionType = typeMapping[data.transaction.txn_type as keyof typeof typeMapping] || 'عملية مالية';
    const amount = data.transaction.amount_src?.value || '0';
    const currency = data.transaction.amount_src?.ccy || '';
    
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إيصال المعاملة</title>
    <style>
        @page {
            size: 72mm 96mm;
            margin: 2mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            background: white;
            color: #000;
            line-height: 1.4;
            padding: 4px;
            direction: rtl;
            width: 68mm;
            height: 92mm;
        }
        
        .receipt {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        .header {
            text-align: center;
            margin-bottom: 8px;
        }
        
        .company-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .company-desc {
            font-size: 10px;
            color: #666;
        }
        
        .separator {
            border-bottom: 1px dashed #000;
            margin: 6px 0;
            height: 1px;
        }
        
        .transaction-info {
            margin-bottom: 6px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 11px;
        }
        
        .info-label {
            font-weight: bold;
        }
        
        .info-value {
            text-align: left;
            direction: ltr;
        }
        
        .amount-section {
            text-align: center;
            margin: 8px 0;
            padding: 6px;
            border: 1px solid #000;
        }
        
        .amount {
            font-size: 16px;
            font-weight: bold;
        }
        
        .footer {
            text-align: center;
            font-size: 10px;
        }
        
        .qr-code {
            text-align: center;
            margin: 4px 0;
        }
        
        .qr-code img {
            width: 60px;
            height: 60px;
        }
        
        .verification-code {
            font-family: 'Courier New', monospace;
            font-size: 8px;
            word-break: break-all;
            margin-top: 4px;
        }
        
        .transaction-id {
            font-family: 'Courier New', monospace;
            direction: ltr;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <!-- Header -->
        <div class="header">
            <div class="company-name">${data.companyInfo.name}</div>
            <div class="company-desc">مكتب الصرافة الليبي</div>
        </div>
        
        <div class="separator"></div>
        
        <!-- Transaction Info -->
        <div class="transaction-info">
            <div class="info-row">
                <span class="info-label">نوع العملية:</span>
                <span class="info-value">${transactionType}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">الرقم المرجعي:</span>
                <span class="info-value transaction-id">${(data.transaction as any).referenceNumber || `REF-${data.transaction.txn_id}`}</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="info-row">
                <span class="info-label">من حساب:</span>
                <span class="info-value">${data.senderInfo.accountNumber}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">الاسم:</span>
                <span class="info-value">${data.senderInfo.name}</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="info-row">
                <span class="info-label">إلى حساب:</span>
                <span class="info-value">${data.beneficiaryInfo.accountNumber || 'غير محدد'}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">الاسم:</span>
                <span class="info-value">${data.beneficiaryInfo.name}</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="info-row">
                <span class="info-label">التاريخ والوقت:</span>
                <span class="info-value">${dateStr}</span>
            </div>
        </div>
        
        <!-- Amount -->
        <div class="amount-section">
            <div class="amount">${amount} ${currency}</div>
        </div>
        
        <div class="separator"></div>
        
        <!-- QR Code -->
        ${qrCodeDataUrl ? `
        <div class="qr-code">
            <img src="${qrCodeDataUrl}" alt="QR Code" />
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
            <div class="verification-code">
                رمز التحقق: ${data.verificationInfo.hash.substring(0, 16)}...
            </div>
            <div style="margin-top: 4px; font-size: 9px;">
                شكراً لاستخدام خدماتنا
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * إنشاء إيصال كشف الحساب
   */
  static async generateStatementReceipt(statementData: any): Promise<string> {
    const currentDate = new Date().toLocaleDateString('ar-LY');
    
    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>كشف الحساب</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.2;
            background: white;
            color: black;
            direction: rtl;
        }
        
        .statement {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        
        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .header h2 {
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .statement-info {
            margin-bottom: 15px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        
        .table th,
        .table td {
            border: 1px solid #000;
            padding: 5px;
            text-align: center;
            font-size: 9px;
        }
        
        .table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .amount {
            text-align: left;
            direction: ltr;
        }
        
        .totals {
            margin-top: 20px;
            border: 2px solid #000;
            padding: 10px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 8px;
            border-top: 1px solid #000;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="statement">
        <!-- Header -->
        <div class="header">
            <h1>مكتب الصرافة الليبي</h1>
            <h2>كشف الحساب</h2>
        </div>
        
        <!-- Statement Info -->
        <div class="statement-info">
            <div class="info-row">
                <span><strong>تاريخ الإصدار:</strong> ${currentDate}</span>
                <span><strong>الرصيد الافتتاحي:</strong> ${statementData.openingBalance}</span>
            </div>
        </div>
        
        <!-- Transactions Table -->
        <table class="table">
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>الرقم المرجعي</th>
                    <th>الوصف</th>
                    <th>المبلغ</th>
                    <th>العملة</th>
                    <th>الرصيد</th>
                </tr>
            </thead>
            <tbody>
                ${statementData.rows.map((row: any) => `
                <tr>
                    <td>${row.date}</td>
                    <td>${row.type}</td>
                    <td class="amount">${row.referenceNumber || row.id}</td>
                    <td>${row.description}</td>
                    <td class="amount">${row.amount}</td>
                    <td>${row.currency}</td>
                    <td class="amount">${row.balance}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- Totals -->
        <div class="totals">
            <h3 style="text-align: center; margin-bottom: 10px;">ملخص الحساب</h3>
            <div class="total-row">
                <span>إجمالي الإيداعات:</span>
                <span class="amount">${statementData.totals.credits}</span>
            </div>
            <div class="total-row">
                <span>إجمالي السحوبات:</span>
                <span class="amount">${statementData.totals.debits}</span>
            </div>
            <div class="total-row">
                <span>إجمالي الرسوم:</span>
                <span class="amount">${statementData.totals.fees}</span>
            </div>
            <div class="total-row" style="font-weight: bold; border-top: 1px solid #000; padding-top: 5px;">
                <span>الصافي:</span>
                <span class="amount">${statementData.totals.net}</span>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>هذا الكشف مُنتج آلياً من نظام إدارة الصرافة</p>
            <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-LY')}</p>
        </div>
    </div>
</body>
</html>`;
  }
}