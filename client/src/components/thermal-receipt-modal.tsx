import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Printer, Download, X } from "lucide-react";

interface ReceiptData {
  id: string;
  transferId: string;
  fromUser: {
    id: number;
    fullName: string;
    accountNumber?: string;
  };
  toUser: {
    id: number;
    fullName: string;
    accountNumber?: string;
  };
  currency: string;
  amount: number;
  fee?: number;
  netAmount: number;
  status: string;
  ref: string;
  createdAt: string;
  note?: string;
  hash?: string;
}

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

export function ThermalReceiptModal({ isOpen, onClose, receiptData }: ThermalReceiptModalProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!receiptData) return null;

  const formatTripoli = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Africa/Tripoli'
    };
    
    try {
      return new Intl.DateTimeFormat('ar-LY', options).format(date);
    } catch (error) {
      return new Intl.DateTimeFormat('ar', options).format(date);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const receiptHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إيصال حراري</title>
        <style>
            @page {
                size: 72mm 96mm;
                margin: 0;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                background: white;
                color: black;
                width: 72mm;
                min-height: 96mm;
                padding: 4mm;
                direction: rtl;
                text-align: center;
            }
            
            .header {
                text-align: center;
                margin-bottom: 3mm;
                border-bottom: 1px solid #000;
                padding-bottom: 2mm;
            }
            
            .company-name {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 1mm;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1mm;
                font-size: 11px;
            }
            
            .separator {
                border-top: 1px dashed #000;
                margin: 2mm 0;
            }
            
            .amount {
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                margin: 2mm 0;
                border: 1px solid #000;
                padding: 2mm;
            }
            
            .footer {
                font-size: 10px;
                text-align: center;
                margin-top: 3mm;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">منصة الصرافة الليبية</div>
            <div style="font-size: 10px; margin-bottom: 2mm;">طرابلس - ليبيا</div>
            <div style="font-size: 12px; font-weight: bold;">إيصال حوالة داخلية</div>
        </div>
        
        <div class="info-row">
            <span>رقم العملية:</span>
            <span>${receiptData.id || receiptData.transferId}</span>
        </div>
        
        <div class="info-row">
            <span>المرجع:</span>
            <span>${receiptData.ref}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="info-row">
            <span>من حساب:</span>
            <span>${receiptData.fromUser.accountNumber || receiptData.fromUser.id}</span>
        </div>
        
        <div class="info-row">
            <span>إلى حساب:</span>
            <span>${receiptData.toUser.accountNumber || receiptData.toUser.id}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="amount">
            <div>المبلغ المحول</div>
            <div style="font-size: 16px; font-weight: bold; margin-top: 2mm;">
                ${receiptData.amount.toFixed(2)} ${receiptData.currency}
            </div>
        </div>
        
        <div class="separator"></div>
        
        <div class="info-row">
            <span>التاريخ:</span>
            <span style="font-size: 10px;">${formatTripoli(receiptData.createdAt).split(' ').slice(0, -2).join(' ')}</span>
        </div>
        
        <div class="info-row">
            <span>الوقت:</span>
            <span>${formatTripoli(receiptData.createdAt).split(' ').slice(-2).join(' ')}</span>
        </div>
        
        <div class="info-row">
            <span>الحالة:</span>
            <span>${receiptData.status === 'completed' ? 'مكتمل' : receiptData.status}</span>
        </div>
        
        ${receiptData.note ? `
            <div class="separator"></div>
            <div style="font-size: 10px; text-align: center; margin-top: 2mm;">
                ملاحظة: ${receiptData.note}
            </div>
        ` : ''}
        
        <div class="separator"></div>
        <div class="footer">
            شكراً لاستخدام منصة الصرافة الليبية
        </div>
    </body>
    </html>`;

    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            إيصال المعاملة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <h3 className="font-bold text-lg mb-2">تم إنجاز المعاملة بنجاح</h3>
            <p className="text-gray-600">رقم العملية: {receiptData.id || receiptData.transferId}</p>
            <p className="text-gray-600">المبلغ: {receiptData.amount.toFixed(2)} {receiptData.currency}</p>
            <p className="text-gray-600">من حساب: {receiptData.fromUser.accountNumber || receiptData.fromUser.id}</p>
            <p className="text-gray-600">إلى حساب: {receiptData.toUser.accountNumber || receiptData.toUser.id}</p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              طباعة إيصال حراري
            </Button>
            
            <Button
              onClick={onClose}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}