import puppeteer from 'puppeteer';
import moment from 'moment-timezone';
import { ReceiptData } from './pdf-generator';
import QRCode from 'qrcode';

/**
 * HTML-to-Image receipt generator with full Arabic support
 */
export class HtmlImageGenerator {
  /**
   * Generate receipt as PNG image using HTML/CSS and Puppeteer
   */
  static async generateReceipt(data: ReceiptData): Promise<Buffer> {
    let browser;
    try {
      // إعدادات Puppeteer محسنة لـ Replit
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
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium' || '/usr/bin/chromium' || '/usr/bin/chromium-browser' || undefined
      });

      const page = await browser.newPage();
      
      // تحديد حجم الصفحة - 72mm × 96mm 
      await page.setViewport({ width: 272, height: 363, deviceScaleFactor: 1 });
      
      // تعيين حجم الصفحة للطباعة
      await page.addStyleTag({
        content: `
          @page {
            size: 72mm 96mm;
            margin: 0;
          }
        `
      });

      // إنشاء HTML للإيصال
      const html = await this.generateReceiptHTML(data);
      
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // التقاط صورة للصفحة بالحجم المحدد
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
      console.error('خطأ في إنشاء الإيصال باستخدام Puppeteer:', error);
      // العودة لطريقة بديلة - إنشاء إيصال نصي بسيط
      return this.generateSimpleTextReceipt(data);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * إنشاء HTML للإيصال مع تصميم عربي احترافي
   */
  private static async generateReceiptHTML(data: ReceiptData): Promise<string> {
    // إنشاء QR code إذا كان متاحاً
    let qrCodeDataUrl = '';
    try {
      if (data.verificationInfo.verificationUrl) {
        qrCodeDataUrl = await QRCode.toDataURL(data.verificationInfo.verificationUrl, {
          width: 50,
          margin: 1
        });
      }
    } catch (error) {
      console.error('خطأ في إنشاء QR code:', error);
    }

    const dateStr = moment(data.transaction.executed_at || new Date())
      .tz('Africa/Tripoli')
      .format('YYYY-MM-DD HH:mm:ss');

    // تحديد نوع المعاملة
    const typeMapping: Record<string, string> = {
      'internal_transfer_out': 'تحويل داخلي - صادر',
      'internal_transfer_in': 'تحويل داخلي - وارد',
      'inter_office_transfer': 'تحويل بين المكاتب',
      'international_transfer': 'تحويل دولي'
    };

    const transactionType = typeMapping[data.transaction.txn_type as keyof typeof typeMapping] || 'غير محدد';
    const amount = data.transaction.amount_src?.value || 'غير محدد';
    const currency = data.transaction.amount_src?.ccy || '';
    
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إيصال المعاملة</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
            background: #ffffff;
            color: #1a1a1a;
            line-height: 1.2;
            padding: 8px;
            direction: rtl;
            margin: 0;
            width: 72mm;
            height: 96mm;
            font-size: 8px;
        }
        
        .receipt {
            width: 100%;
            height: 100%;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 8px;
            text-align: center;
            flex-shrink: 0;
        }
        
        .header h1 {
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 2px;
        }
        
        .header p {
            font-size: 8px;
            opacity: 0.9;
        }
        
        .content {
            padding: 8px;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        .receipt-info {
            background: #f8fafc;
            padding: 4px;
            border-radius: 2px;
            margin-bottom: 4px;
            border-right: 2px solid #1e40af;
        }
        
        .section {
            margin-bottom: 4px;
        }
        
        .section-title {
            font-size: 9px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 2px;
            padding-bottom: 2px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 7px;
        }
        
        .detail-row:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        
        .detail-value {
            font-weight: 400;
            color: #1f2937;
        }
        
        .amount-highlight {
            background: #dcfce7;
            color: #166534;
            padding: 4px;
            border-radius: 2px;
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            margin: 4px 0;
        }
        
        .qr-section {
            text-align: center;
            margin: 4px 0;
            padding: 4px;
            background: #f8fafc;
            border-radius: 2px;
        }
        
        .qr-code {
            margin: 2px 0;
        }
        
        .verification {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 4px;
            border-radius: 2px;
            margin-top: 4px;
            font-size: 6px;
        }
        
        .hash {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            word-break: break-all;
            color: #374151;
            background: white;
            padding: 8px;
            border-radius: 4px;
            margin-top: 8px;
        }
        
        .footer {
            background: #1f2937;
            color: white;
            padding: 25px;
            text-align: center;
        }
        
        .footer h3 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        
        .footer p {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .security-notice {
            font-size: 12px;
            color: #6b7280;
            text-align: center;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <h1>إيصال المعاملة</h1>
            <p>منصة الصرافة الليبية</p>
        </div>
        
        <div class="content">
            <div class="receipt-info">
                <div class="detail-row">
                    <span class="detail-label">رقم الإيصال:</span>
                    <span class="detail-value">${data.receiptNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">التاريخ والوقت:</span>
                    <span class="detail-value">${dateStr} (توقيت ليبيا)</span>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">تفاصيل المعاملة</h2>
                <div class="detail-row">
                    <span class="detail-label">نوع المعاملة:</span>
                    <span class="detail-value">${transactionType}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">المبلغ:</span>
                    <span class="detail-value">${amount} ${currency}</span>
                </div>
                ${data.transaction.fees && data.transaction.fees.length > 0 ? `
                <div class="detail-row">
                    <span class="detail-label">العمولة:</span>
                    <span class="detail-value">${data.transaction.fees[0].value} ${data.transaction.fees[0].ccy}</span>
                </div>
                ` : ''}
            </div>
            
            ${data.transaction.net_to_beneficiary ? `
            <div class="amount-highlight">
                صافي المبلغ للمستفيد: ${data.transaction.net_to_beneficiary.value} ${data.transaction.net_to_beneficiary.ccy}
            </div>
            ` : ''}
            
            <div class="section">
                <h2 class="section-title">معلومات الأطراف</h2>
                <div class="detail-row">
                    <span class="detail-label">المرسل:</span>
                    <span class="detail-value">${data.transaction.sender_ref || 'غير محدد'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">المستفيد:</span>
                    <span class="detail-value">${data.transaction.beneficiary_ref || 'غير محدد'}</span>
                </div>
            </div>
            
            ${qrCodeDataUrl ? `
            <div class="qr-section">
                <h3>رمز التحقق</h3>
                <div class="qr-code">
                    <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 180px; height: auto;">
                </div>
                <p>امسح الرمز للتحقق من صحة الإيصال</p>
            </div>
            ` : ''}
            
            <div class="verification">
                <h3>التحقق من الإيصال</h3>
                <p>التوقيع الرقمي:</p>
                <div class="hash">${data.verificationInfo.hash.substring(0, 64)}...</div>
            </div>
            
            <div class="security-notice">
                هذا الإيصال موقع رقمياً ومؤمن • تاريخ الإنشاء: ${new Date().toLocaleDateString('ar')}
            </div>
        </div>
        
        <div class="footer">
            <h3>منصة الصرافة الليبية</h3>
            <p>طرابلس، ليبيا</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * إنشاء إيصال نصي بسيط كخيار احتياطي
   */
  private static generateSimpleTextReceipt(data: ReceiptData): Buffer {
    const dateStr = moment(data.transaction.executed_at || new Date())
      .tz('Africa/Tripoli')
      .format('YYYY-MM-DD HH:mm:ss');

    const receiptText = `
=======================================
            إيصال المعاملة
        منصة الصرافة الليبية
=======================================

رقم الإيصال: ${data.receiptNumber}
التاريخ: ${dateStr} (توقيت ليبيا)

---------------------------------------
تفاصيل المعاملة:
---------------------------------------
النوع: ${data.transaction.txn_type || 'غير محدد'}
المبلغ: ${data.transaction.amount_src?.value || 'غير محدد'} ${data.transaction.amount_src?.ccy || ''}
${data.transaction.fees && data.transaction.fees.length > 0 ? `العمولة: ${data.transaction.fees[0].value} ${data.transaction.fees[0].ccy}` : ''}

---------------------------------------
معلومات الأطراف:
---------------------------------------
المرسل: ${data.transaction.sender_ref || 'غير محدد'}
المستفيد: ${data.transaction.beneficiary_ref || 'غير محدد'}

---------------------------------------
التحقق:
---------------------------------------
التوقيع: ${data.verificationInfo.hash.substring(0, 40)}...

=======================================
هذا الإيصال موقع رقمياً ومؤمن
=======================================
`;

    return Buffer.from(receiptText, 'utf-8');
  }

  /**
   * Generate PDF from HTML content
   */
  static async generatePDF(html: string, options: { format: string, printBackground: boolean }): Promise<Buffer> {
    let browser;
    try {
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
      
      // تحديد حجم الصفحة
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
      
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // إنشاء PDF
      const pdfBuffer = await page.pdf({
        format: options.format === 'A4' ? 'a4' : 'letter' as any,
        printBackground: options.printBackground,
        margin: {
          top: '10mm',
          bottom: '10mm',
          left: '10mm',
          right: '10mm'
        }
      });

      return Buffer.from(pdfBuffer);
      
    } catch (error) {
      console.error('خطأ في إنشاء PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}