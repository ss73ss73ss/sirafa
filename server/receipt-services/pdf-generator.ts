import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import moment from 'moment-timezone';
import { CanonicalTransaction } from './crypto-service';

export interface ReceiptData {
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
  };
  verificationInfo: {
    hash: string;
    jwsToken: string;
    verificationUrl: string;
  };
  locale: 'ar' | 'en';
}

export class PDFGenerator {
  private static readonly COLORS = {
    primary: rgb(0.2, 0.4, 0.8),
    secondary: rgb(0.5, 0.5, 0.5),
    success: rgb(0.2, 0.7, 0.3),
    warning: rgb(0.9, 0.6, 0.1),
    danger: rgb(0.8, 0.2, 0.2),
    background: rgb(0.98, 0.98, 0.98),
    text: rgb(0.1, 0.1, 0.1)
  };

  /**
   * Generate PDF receipt - Mixed Arabic/English approach to avoid font encoding issues
   */
  static async generateReceipt(data: ReceiptData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    
    // Load fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Generate receipt with English labels but Arabic context
    await this.generateMixedLanguageReceipt(page, data, fontRegular, fontBold);

    return await pdfDoc.save();
  }

  /**
   * Generate mixed language receipt using English labels to avoid font encoding issues
   */
  private static async generateMixedLanguageReceipt(
    page: PDFPage, 
    data: ReceiptData, 
    fontRegular: PDFFont, 
    fontBold: PDFFont
  ): Promise<void> {
    const { width, height } = page.getSize();
    let currentY = height - 50;

    // Header - Professional bilingual format  
    page.drawText('TRANSACTION RECEIPT - EESAAL AL-MU\'AMALA', {
      x: width / 2 - 140,
      y: currentY,
      size: 16,
      font: fontBold,
      color: this.COLORS.primary,
    });
    
    currentY -= 20;
    
    page.drawText('Libya Exchange Platform - منصة الصرافة الليبية', {
      x: width / 2 - 150,
      y: currentY,
      size: 12,
      font: fontRegular,
      color: this.COLORS.secondary,
    });

    currentY -= 30;

    // Receipt info - English with Arabic labels in Latin script
    page.drawText(`Receipt Number (Raqam Al-Eesaal): ${data.receiptNumber}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: fontRegular,
    });

    currentY -= 20;

    page.drawText(`Date & Time (Al-Taareekh): ${moment(data.transaction.executed_at || new Date()).tz('Africa/Tripoli').format('YYYY-MM-DD HH:mm:ss')} Libya Time`, {
      x: 50,
      y: currentY,
      size: 12,
      font: fontRegular,
    });

    currentY -= 30;

    // Transaction details - Professional bilingual format
    page.drawText('TRANSACTION DETAILS (Tafaseel Al-Mu\'amala)', {
      x: 50,
      y: currentY,
      size: 14,
      font: fontBold,
      color: this.COLORS.primary,
    });

    currentY -= 25;

    // Transaction type - English with Arabic pronunciation
    const typeMapping = {
      'internal_transfer_out': 'Internal Transfer - Outgoing (Tahweel Dakhili Sadir)',
      'internal_transfer_in': 'Internal Transfer - Incoming (Tahweel Dakhili Warid)', 
      'inter_office_transfer': 'Inter-Office Transfer (Tahweel Bayn Al-Makatib)',
      'international_transfer': 'International Transfer (Tahweel Dawli)'
    };
    
    page.drawText(`Transaction Type (An-Naw\'): ${typeMapping[data.transaction.txn_type as keyof typeof typeMapping] || data.transaction.txn_type || 'Not Specified'}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: fontRegular,
    });

    currentY -= 20;

    page.drawText(`Amount (Al-Mablagh): ${data.transaction.amount_src?.value || 'Not Specified'} ${data.transaction.amount_src?.ccy || 'N/A'}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: fontRegular,
    });

    currentY -= 20;

    // Add commission information if available - Professional bilingual
    if (data.transaction.fees && data.transaction.fees.length > 0) {
      const commission = data.transaction.fees[0];
      page.drawText(`Commission Fee (Al-\'Umoola): ${commission.value} ${commission.ccy}`, {
        x: 50,
        y: currentY,
        size: 12,
        font: fontRegular,
      });
      currentY -= 20;
    }

    // Net amount to beneficiary - Highlighted important info
    if (data.transaction.net_to_beneficiary) {
      page.drawText(`Net Amount to Beneficiary (Safi Al-Mablagh lil-Mustafeed): ${data.transaction.net_to_beneficiary.value} ${data.transaction.net_to_beneficiary.ccy}`, {
        x: 50,
        y: currentY,
        size: 12,
        font: fontBold,
        color: this.COLORS.success,
      });
      currentY -= 20;
    }

    currentY -= 30;

    // Parties information - Professional bilingual format
    page.drawText('PARTIES INFORMATION (Ma\'lumaat Al-Atraf)', {
      x: 50,
      y: currentY,
      size: 14,
      font: fontBold,
      color: this.COLORS.primary,
    });

    currentY -= 25;

    page.drawText(`Sender (Al-Mursil): ${data.transaction.sender_ref || 'Not Specified'}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: fontRegular,
    });

    currentY -= 20;

    page.drawText(`Sender Account Number: ${data.transaction.sender_ref || 'Not Specified'}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: fontRegular,
    });

    currentY -= 25;

    page.drawText(`Beneficiary (Al-Mustafeed): ${data.transaction.beneficiary_ref || 'Not Specified'}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: fontRegular,
    });

    currentY -= 20;

    page.drawText(`Beneficiary Account Number: ${data.transaction.beneficiary_ref || 'Not Specified'}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: fontRegular,
    });

    currentY -= 40;

    // Generate QR code
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data.verificationInfo.verificationUrl);
      const qrImageBytes = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
      const qrImage = await page.doc.embedPng(qrImageBytes);
      
      page.drawImage(qrImage, {
        x: width - 120,
        y: currentY - 80,
        width: 80,
        height: 80,
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    // Verification info - Professional security section
    page.drawText('RECEIPT VERIFICATION (At-Tahaqqoq)', {
      x: 50,
      y: currentY,
      size: 14,
      font: fontBold,
      color: this.COLORS.primary,
    });

    currentY -= 25;

    page.drawText(`Digital Signature Hash: ${data.verificationInfo.hash.substring(0, 40)}...`, {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });

    currentY -= 20;

    page.drawText('Scan QR Code to Verify Receipt Authenticity', {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });

    currentY -= 30;

    // Company information - Professional branding
    page.drawText('COMPANY INFORMATION', {
      x: 50,
      y: currentY,
      size: 12,
      font: fontBold,
      color: this.COLORS.primary,
    });

    currentY -= 20;

    page.drawText('Libya Exchange Platform (Minassat As-Sarrafa Al-Leebiya)', {
      x: 50,
      y: currentY,
      size: 11,
      font: fontBold,
    });

    currentY -= 15;

    page.drawText('Tripoli, Libya (Tarablus, Leebiya)', {
      x: 50,
      y: currentY,
      size: 10,
      font: fontRegular,
    });

    // Footer - Security disclaimer
    page.drawText('This receipt is digitally signed and cryptographically secured for authenticity verification', {
      x: 50,
      y: 50,
      size: 8,
      font: fontRegular,
      color: this.COLORS.secondary,
    });
  }

  /**
   * Mask account number for privacy
   */
  private static maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 6) return accountNumber;
    const visible = accountNumber.slice(-4);
    const masked = '*'.repeat(accountNumber.length - 4);
    return masked + visible;
  }
}