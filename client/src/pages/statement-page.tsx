import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Download, FileText, Filter, Search, AlertCircle, Clock, Printer, ArrowRight, RefreshCw } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { ar } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Guard } from "@/components/Guard";

interface TransactionLog {
  id: number;
  date: string;
  type: string;
  currency: string;
  amount: string;
  description: string;
  direction: 'debit' | 'credit';
  runningBalance: string;
  referenceNumber?: string;
}

interface StatementData {
  openingBalance: string;
  rows: TransactionLog[];
  totals: {
    debits: string;
    credits: string;
    fees: string;
    net: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

interface ExportJob {
  status: 'pending' | 'processing' | 'ready' | 'failed';
  downloadUrl?: string;
  completedAt?: string;
  errorMessage?: string;
}

// خريطة أسماء أنواع المعاملات
const transactionTypeMap: Record<string, string> = {
  deposit: "إيداع",
  withdrawal: "سحب",
  internal_transfer_in: "تحويل داخلي وارد",
  internal_transfer_out: "تحويل داخلي صادر",
  office_remit: "حوالة مكتبية",
  market_trade_buy: "شراء عملة",
  market_trade_sell: "بيع عملة",
  exchange: "صرافة",
  commission_withdrawal: "سحب عمولة",
  external_payment: "دفع خارجي",
  fee: "عمولة",
  referral_reward_received: "مكافأة إحالة مستلمة",
  referral_balance_withdrawal: "سحب رصيد مكافآت",
  referral_balance_deposit: "إيداع مكافآت للرصيد الرئيسي"
};

// خريطة ألوان الحالات
const statusColorMap: Record<string, string> = {
  completed: "default",
  pending: "secondary",
  failed: "destructive"
};

const statusLabelMap: Record<string, string> = {
  completed: "مكتمل",
  pending: "قيد الانتظار",
  failed: "فاشل"
};

export default function StatementPage() {
  return (
    <Guard page="statement">
      <StatementContent />
    </Guard>
  );
}

function StatementContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // دالة طباعة الإيصال
  const handlePrintReceipt = async (transactionId: number) => {
    try {
      // استخدام التوكن للتصريح
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/receipts/transaction/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // فتح نافذة طباعة
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
            window.URL.revokeObjectURL(url);
          };
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: "خطأ غير معروف" }));
        toast({
          title: "خطأ",
          description: errorData.message || "لا يوجد إيصال لهذه المعاملة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل الإيصال:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الإيصال",
        variant: "destructive"
      });
    }
  };

  // حالة الفلاتر
  const [filters, setFilters] = useState({
    start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
    currency: 'all',
    type: 'all',
    status: 'all',
    q: '',
    reference: ''
  });

  // استعلام جلب كشف الحساب
  const { data: statementData, isLoading, error, refetch } = useQuery<StatementData>({
    queryKey: ['/api/statements', filters],
    enabled: false, // عدم جلب البيانات تلقائياً
    queryFn: async () => {
      console.log('🔍 إرسال طلب كشف الحساب مع الفلاتر:', filters);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/statements?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('فشل في جلب كشف الحساب');
      }

      return response.json();
    }
  });

  // طفرة التصدير الفوري
  const exportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'excel') => {
      console.log('بدء التصدير الفوري:', { format, filters });
      try {
        const response = await fetch('/api/statements/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ format, ...filters })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'فشل في التصدير');
        }

        // إنشاء blob من الاستجابة
        const blob = await response.blob();
        const fileName = `كشف_حساب_${Date.now()}.csv`;
        
        // إنشاء رابط التحميل
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        return 'success';
      } catch (error) {
        console.error('فشل التصدير الفوري:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تحميل ملف كشف الحساب"
      });
    },
    onError: (error: any) => {
      console.error('خطأ في التصدير:', error);
      toast({
        title: "خطأ",
        description: `فشل في التصدير: ${error.message || 'خطأ غير معروف'}`,
        variant: "destructive"
      });
    }
  });

  // معالجة تحديث الفلاتر
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // تحميل البيانات عند فتح الصفحة لأول مرة
  useEffect(() => {
    refetch();
  }, []);

  // معالجة عرض البيانات
  const handleViewStatement = () => {
    console.log('🔍 تطبيق الفلاتر:', filters);
    refetch();
  };

  // معالجة طباعة الإيصال
  const handlePrintReceiptFromStatement = async (transactionId: number) => {
    try {
      console.log('🖨️ بدء طباعة الإيصال الحراري للمعاملة:', transactionId);
      
      // البحث عن بيانات المعاملة من القائمة المحملة
      const transaction = statementData?.rows.find((row: any) => row.id === transactionId);
      if (!transaction) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على بيانات المعاملة",
          variant: "destructive"
        });
        return;
      }

      // التحقق من نوع المعاملة - إذا كانت من سوق العملات
      const isExchangeTransaction = transaction.type === 'exchange' || 
                                  transaction.description.includes('بيع') || 
                                  transaction.description.includes('شراء') ||
                                  transaction.description.includes('سعر') ||
                                  transaction.description.includes('استلام') && transaction.description.includes('USD');

      if (isExchangeTransaction) {
        console.log('🔍 معاملة سوق عملات مكتشفة:', transaction.type, transaction.description);
        
        // استخراج البيانات من وصف المعاملة والمستخدم
        const extractMarketData = (description: string, userId: number, userAccountNumber?: string | null) => {
          const data = {
            soldAmount: 'غير محدد',
            purchaseValue: 'غير محدد', 
            exchangeRate: 'غير محدد',
            operationType: 'غير محدد',
            sellerAccount: userAccountNumber || String(userId), // رقم حساب البائع
            buyerAccount: userAccountNumber || String(userId), // رقم حساب المشتري
            systemAccount: '1000' // حساب النظام ثابت
          };

          // استخراج المبلغ المباع (USD)
          const usdMatch = description.match(/(\d+(?:\.\d+)?)\s*USD/);
          if (usdMatch) {
            data.soldAmount = usdMatch[1] + ' USD';
          }

          // استخراج المبلغ المستلم (LYD) - من وصف أو مبلغ المعاملة
          const lydMatch = description.match(/(\d+(?:\.\d+)?)\s*LYD/);
          if (lydMatch) {
            data.purchaseValue = lydMatch[1] + ' LYD';
          } else if (description.includes('استلام') && usdMatch) {
            // إذا لم نجد LYD في الوصف، نحسبها من سعر الصرف
            const rateMatch = description.match(/بسعر\s+(\d+(?:\.\d+)?)/);
            if (rateMatch) {
              const usdAmount = parseFloat(usdMatch[1]);
              const rate = parseFloat(rateMatch[1]);
              data.purchaseValue = (usdAmount * rate).toFixed(2) + ' LYD';
            }
          }

          // استخراج سعر الصرف
          const rateMatch = description.match(/بسعر\s+(\d+(?:\.\d+)?)/);
          if (rateMatch) {
            data.exchangeRate = '1 USD = ' + rateMatch[1] + ' LYD';
          }

          // تحديد نوع العملية وأرقام الحسابات
          if (description.includes('بيع')) {
            data.operationType = 'بيع عملة';
            data.sellerAccount = userAccountNumber || String(userId);
            data.buyerAccount = 'النظام';
          } else if (description.includes('شراء')) {
            data.operationType = 'شراء عملة';
            data.sellerAccount = 'النظام';
            data.buyerAccount = userAccountNumber || String(userId);
          } else if (description.includes('استلام')) {
            data.operationType = 'استلام من بيع';
            data.sellerAccount = 'المشتري';
            data.buyerAccount = userAccountNumber || String(userId);
          } else if (description.includes('تعليق')) {
            data.operationType = 'تعليق عرض بيع';
            data.sellerAccount = userAccountNumber || String(userId);
            data.buyerAccount = 'معلق';
          }



          return data;
        };

        const marketData = extractMarketData(transaction.description, (transaction as any).userId || 0, (transaction as any).userAccountNumber || '');
        
        // إنشاء إيصال سوق العملات محلياً
        const marketReceiptHTML = `<!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>إيصال سوق العملات - ${transactionId}</title>
            <style>
                @media print {
                    @page {
                        size: 80mm 120mm;
                        margin: 0;
                    }
                    body {
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                        text-align: right;
                        font-size: 8px;
                        line-height: 1.1;
                        margin: 0;
                        padding: 2mm;
                        width: 76mm;
                        overflow: hidden;
                    }
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    direction: rtl;
                    text-align: right;
                    font-size: 10px;
                    line-height: 1.2;
                    margin: 0;
                    padding: 3mm;
                    width: 74mm;
                    max-width: 74mm;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 2mm;
                    border-bottom: 1px solid #000;
                    padding-bottom: 1mm;
                }
                
                .company-name {
                    font-weight: bold;
                    font-size: 11px;
                    margin-bottom: 0.5mm;
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.8mm;
                    font-size: 9px;
                }
                
                .separator {
                    border-top: 1px dashed #000;
                    margin: 1mm 0;
                }
                
                .amount {
                    font-size: 12px;
                    font-weight: bold;
                    text-align: center;
                    margin: 1mm 0;
                    border: 1px solid #000;
                    padding: 1mm;
                }
                
                .footer {
                    font-size: 8px;
                    text-align: center;
                    margin-top: 2mm;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">منصة الصرافة الليبية</div>
                <div style="font-size: 8px;">طرابلس - ليبيا</div>
                <div style="font-size: 10px; font-weight: bold;">إيصال سوق العملات</div>
            </div>
            
            <div class="info-row">
                <span>رقم العملية:</span>
                <span>${transactionId}</span>
            </div>
            
            <div class="info-row">
                <span>المرجع:</span>
                <span>${transaction.referenceNumber || 'غير محدد'}</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="info-row">
                <span>حساب البائع:</span>
                <span>${marketData.sellerAccount}</span>
            </div>
            
            <div class="info-row">
                <span>حساب المشتري:</span>
                <span>${marketData.buyerAccount}</span>
            </div>
            
            <div class="info-row">
                <span>حساب النظام:</span>
                <span>${marketData.systemAccount}</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="info-row" style="font-weight: bold;">
                <span>تفاصيل الحسابات:</span>
                <span></span>
            </div>
            
            <div class="info-row">
                <span>رقم حساب العميل:</span>
                <span>${(transaction as any).userAccountNumber || 'ACC-' + String((transaction as any).userId).padStart(6, '0')}</span>
            </div>
            
            <div class="info-row">
                <span>اسم العميل:</span>
                <span>${(transaction as any).fullName || (transaction as any).userName || 'عميل رقم ' + (transaction as any).userId}</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="info-row">
                <span>نوع العملية:</span>
                <span>${marketData.operationType}</span>
            </div>
            
            <div class="info-row">
                <span>المبلغ المباع:</span>
                <span>${marketData.soldAmount}</span>
            </div>
            
            <div class="info-row">
                <span>القيمة المشتراة:</span>
                <span>${marketData.purchaseValue}</span>
            </div>
            
            <div class="info-row">
                <span>سعر الصرف:</span>
                <span>${marketData.exchangeRate}</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="amount">
                <div>إجمالي المعاملة</div>
                <div style="font-size: 11px; font-weight: bold; margin-top: 1mm;">
                    ${Math.abs(parseFloat(transaction.amount)).toFixed(2)} ${transaction.currency}
                </div>
            </div>
            
            <div class="separator"></div>
            
            <div class="info-row">
                <span>التاريخ:</span>
                <span>${new Date(transaction.date).toLocaleDateString('ar-LY')}</span>
            </div>
            
            <div class="info-row">
                <span>الوقت:</span>
                <span>${new Date(transaction.date).toLocaleTimeString('ar-LY', { hour12: false })}</span>
            </div>
            
            <div class="info-row">
                <span>الحالة:</span>
                <span>مكتمل ✓</span>
            </div>
            
            <div class="footer">
                شكراً لاستخدام منصة الصرافة - سوق العملات
            </div>
        </body>
        </html>`;

        // فحص إذا كان الجهاز محمول
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // للأجهزة المحمولة: إنشاء blob وتحميل PDF
          const blob = new Blob([marketReceiptHTML], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `receipt-market-${transactionId}.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          // لأجهزة سطح المكتب: طباعة عادية
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(marketReceiptHTML);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 250);
          }
        }
        
        toast({
          title: isMobile ? "تم تحميل الإيصال" : "تم فتح إيصال سوق العملات",
          description: isMobile ? "تم تحميل إيصال سوق العملات، يمكنك فتحه وطباعته" : "تم فتح إيصال سوق العملات المخصص للطباعة"
        });
        return;
      }

      // استخراج معلومات المعاملة للإيصال الحراري
      let fromAccount = "";
      let toAccount = "";
      let amount = parseFloat(transaction.amount);
      
      // تحليل وصف المعاملة لاستخراج أرقام الحسابات
      const descriptionParts = transaction.description.split(' ');
      
      if (transaction.type === 'internal_transfer_out') {
        fromAccount = "4"; // رقم حساب المستخدم الحالي (Admin)
        // البحث عن رقم الحساب في الوصف
        const toAccountMatch = transaction.description.match(/إلى\s+(\w+)/);
        toAccount = toAccountMatch ? toAccountMatch[1] : "غير محدد";
      } else if (transaction.type === 'internal_transfer_in') {
        toAccount = "4"; // رقم حساب المستخدم الحالي (Admin)
        // البحث عن رقم الحساب في الوصف
        const fromAccountMatch = transaction.description.match(/من\s+(\w+)/);
        fromAccount = fromAccountMatch ? fromAccountMatch[1] : "غير محدد";
      }

      // إنشاء HTML للإيصال الحراري
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
              <span>${transactionId}</span>
          </div>
          
          <div class="info-row">
              <span>المرجع:</span>
              <span>${transaction.referenceNumber || 'غير محدد'}</span>
          </div>
          
          <div class="separator"></div>
          
          <div class="info-row">
              <span>من حساب:</span>
              <span>${fromAccount}</span>
          </div>
          
          <div class="info-row">
              <span>إلى حساب:</span>
              <span>${toAccount}</span>
          </div>
          
          <div class="separator"></div>
          
          <div class="amount">
              <div>المبلغ المحول</div>
              <div style="font-size: 16px; font-weight: bold; margin-top: 2mm;">
                  ${amount.toFixed(2)} ${transaction.currency}
              </div>
          </div>
          
          <div class="separator"></div>
          
          <div class="info-row">
              <span>التاريخ:</span>
              <span style="font-size: 10px;">${new Date(transaction.date).toLocaleDateString('ar-LY')}</span>
          </div>
          
          <div class="info-row">
              <span>الوقت:</span>
              <span>${new Date(transaction.date).toLocaleTimeString('ar-LY', { hour12: false })}</span>
          </div>
          
          <div class="info-row">
              <span>الحالة:</span>
              <span>مكتمل</span>
          </div>
          
          <div class="separator"></div>
          <div class="footer">
              شكراً لاستخدام منصة الصرافة الليبية
          </div>
      </body>
      </html>`;

      // فحص إذا كان الجهاز محمول
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // للأجهزة المحمولة: إنشاء blob وتحميل الإيصال
        const blob = new Blob([receiptHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${transactionId}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // لأجهزة سطح المكتب: طباعة عادية
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(receiptHTML);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 250);
        }
      }
      
      toast({
        title: isMobile ? "تم تحميل الإيصال" : "تم فتح الإيصال الحراري للطباعة",
        description: isMobile ? "تم تحميل الإيصال الحراري، يمكنك فتحه وطباعته" : "تم فتح الإيصال الحراري 72mm × 96mm للطباعة"
      });
    } catch (error) {
      console.error('خطأ في طباعة الإيصال:', error);
      toast({
        title: "خطأ",
        description: "فشل في طباعة الإيصال",
        variant: "destructive"
      });
    }
  };


  // معالجة اختيار نطاق زمني سريع
  const handleQuickDateRange = (range: string) => {
    const now = new Date();
    let start = '';
    
    switch (range) {
      case 'today':
        start = format(now, 'yyyy-MM-dd');
        break;
      case 'yesterday':
        start = format(subDays(now, 1), 'yyyy-MM-dd');
        break;
      case 'week':
        start = format(subDays(now, 7), 'yyyy-MM-dd');
        break;
      case 'month':
        start = format(subMonths(now, 1), 'yyyy-MM-dd');
        break;
      case 'quarter':
        start = format(subMonths(now, 3), 'yyyy-MM-dd');
        break;
      case 'year':
        start = format(subMonths(now, 12), 'yyyy-MM-dd');
        break;
      default:
        return;
    }
    
    setFilters(prev => ({
      ...prev,
      start,
      end: format(now, 'yyyy-MM-dd')
    }));
  };

  // تنسيق المبلغ
  const formatAmount = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return `${num.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${currency}`;
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ar });
  };



  return (
    <div className="container mx-auto px-2 sm:px-6 py-2 sm:py-6 space-y-2 sm:space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-1 sm:gap-2 self-start text-xs sm:text-sm h-6 sm:h-9 px-2 sm:px-3"
          >
            <ArrowRight className="h-2 w-2 sm:h-4 sm:w-4" />
            العودة إلى لوحة التحكم
          </Button>
          <div className="w-full sm:w-auto">
            <h1 className="text-sm sm:text-3xl font-bold">كشف الحساب</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">عرض وتصدير جميع المعاملات المالية</p>
          </div>
        </div>
        <FileText className="h-4 w-4 sm:h-8 sm:w-8 text-primary self-end sm:self-auto" />
      </div>

      {/* بطاقة الفلاتر */}
      <Card>
        <CardHeader className="pb-2 sm:pb-6 px-2 sm:px-6 pt-2 sm:pt-6">
          <CardTitle className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base">
            <Filter className="h-3 w-3 sm:h-5 sm:w-5" />
            فلاتر البحث
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">اختر النطاق الزمني وإعدادات العرض</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-4 px-2 sm:px-6 pb-2 sm:pb-6">
          {/* أزرار النطاقات السريعة */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('today')} className="text-xs sm:text-sm h-6 sm:h-9 px-1 sm:px-3">
              اليوم
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('yesterday')} className="text-xs sm:text-sm h-6 sm:h-9 px-1 sm:px-3">
              أمس
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('week')} className="text-xs sm:text-sm h-6 sm:h-9 px-1 sm:px-3">
              آخر أسبوع
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('month')} className="text-xs sm:text-sm h-6 sm:h-9 px-1 sm:px-3">
              آخر شهر
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('quarter')} className="text-xs sm:text-sm h-6 sm:h-9 px-1 sm:px-3">
              آخر ربع
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('year')} className="text-xs sm:text-sm h-6 sm:h-9 px-1 sm:px-3">
              آخر سنة
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            {/* النطاق الزمني */}
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">من تاريخ</Label>
              <Input
                type="date"
                value={filters.start}
                onChange={(e) => handleFilterChange('start', e.target.value)}
                className="text-xs sm:text-sm h-6 sm:h-10"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">إلى تاريخ</Label>
              <Input
                type="date"
                value={filters.end}
                onChange={(e) => handleFilterChange('end', e.target.value)}
                className="text-xs sm:text-sm h-6 sm:h-10"
              />
            </div>

            {/* العملة */}
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">العملة</Label>
              <Select value={filters.currency} onValueChange={(value) => handleFilterChange('currency', value)}>
                <SelectTrigger className="text-xs sm:text-sm h-6 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العملات</SelectItem>
                  <SelectItem value="LYD">دينار ليبي (LYD)</SelectItem>
                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  <SelectItem value="EUR">يورو (EUR)</SelectItem>
                  <SelectItem value="GBP">جنيه إسترليني (GBP)</SelectItem>
                  <SelectItem value="TRY">ليرة تركية (TRY)</SelectItem>
                  <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                  <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                  <SelectItem value="TND">دينار تونسي (TND)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* نوع المعاملة */}
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">نوع المعاملة</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger className="text-xs sm:text-sm h-6 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="deposit">إيداع</SelectItem>
                  <SelectItem value="withdrawal">سحب</SelectItem>
                  <SelectItem value="internal_transfer_sent">تحويل داخلي - مرسل</SelectItem>
                  <SelectItem value="internal_transfer_received">تحويل داخلي - مستلم</SelectItem>
                  <SelectItem value="office_remit">حوالة مكتبية</SelectItem>
                  <SelectItem value="market_trade_buy">شراء عملة</SelectItem>
                  <SelectItem value="market_trade_sell">بيع عملة</SelectItem>
                  <SelectItem value="external_payment">دفع خارجي</SelectItem>
                  <SelectItem value="fee">عمولة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {/* البحث بالرقم المرجعي أو الوصف */}
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">البحث بالرقم المرجعي أو الوصف</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالرقم المرجعي أو الوصف..."
                  value={filters.q || ''}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                  className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* الحالة */}
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">الحالة</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="failed">فاشل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* البحث بالرقم المرجعي */}
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">الرقم المرجعي</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="REF-489..."
                    value={filters.reference}
                    onChange={(e) => handleFilterChange('reference', e.target.value)}
                    className="pr-8 sm:pr-10 text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              أمثلة: REF-489, REF-565, REF-579 (أو جزء من الرقم مثل: 489)
            </p>
          </div>

          {/* أزرار الإجراءات */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pt-3 sm:pt-4">
            <Button onClick={handleViewStatement} disabled={isLoading} className="flex items-center gap-2 text-xs sm:text-sm h-8 sm:h-10">
              <Search className="h-3 w-3 sm:h-4 sm:w-4" />
              {isLoading ? "جاري البحث..." : "بحث"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({
                  start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                  end: format(new Date(), 'yyyy-MM-dd'),
                  currency: 'all',
                  type: 'all',
                  status: 'all',
                  q: '',
                  reference: ''
                });
                handleViewStatement();
              }}
              className="flex items-center gap-2 text-xs sm:text-sm h-8 sm:h-10"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              إعادة تعيين
            </Button>
            <Button
              variant="outline"
              onClick={() => exportMutation.mutate('pdf')}
              disabled={exportMutation.isPending}
              className="text-xs sm:text-sm h-8 sm:h-10"
            >
              <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => exportMutation.mutate('excel')}
              disabled={exportMutation.isPending}
              className="text-xs sm:text-sm h-8 sm:h-10"
            >
              <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>



      {/* عرض الأخطاء */}
      {error && (
        <Card>
          <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">حدث خطأ في جلب البيانات</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* النتائج */}
      {statementData && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm sm:text-base">كشف الحساب</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              الرصيد الافتتاحي: <span className="font-semibold">{statementData.openingBalance}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {/* جدول المعاملات */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">التاريخ</TableHead>
                    <TableHead className="text-xs sm:text-sm">النوع</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">الرقم المرجعي</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">الوصف</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">العملة</TableHead>
                    <TableHead className="text-xs sm:text-sm">مدين</TableHead>
                    <TableHead className="text-xs sm:text-sm">دائن</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">الرصيد الجاري</TableHead>
                    <TableHead className="text-xs sm:text-sm">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statementData.rows.length > 0 ? (
                    statementData.rows.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell className="py-2 sm:py-4">
                          <Badge variant="outline" className="text-xs px-1 py-0.5 sm:px-2 sm:py-1">
                            {transactionTypeMap[transaction.type] || transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm font-mono py-2 sm:py-4 hidden sm:table-cell">
                          <span 
                            className={
                              filters.reference && 
                              transaction.referenceNumber && 
                              transaction.referenceNumber.toLowerCase().includes(filters.reference.toLowerCase())
                                ? "bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded font-semibold"
                                : ""
                            }
                          >
                            {transaction.referenceNumber || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4 hidden md:table-cell">
                          <div className="max-w-20 sm:max-w-none truncate">
                            {transaction.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4 hidden lg:table-cell">{transaction.currency}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">
                          {transaction.direction === 'debit' 
                            ? formatAmount(transaction.amount, transaction.currency)
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">
                          {transaction.direction === 'credit' 
                            ? formatAmount(transaction.amount, transaction.currency)
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs sm:text-sm py-2 sm:py-4 hidden sm:table-cell">
                          {formatAmount(transaction.runningBalance, transaction.currency)}
                        </TableCell>
                        <TableCell className="py-2 sm:py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintReceiptFromStatement(transaction.id)}
                            className="mr-1 sm:mr-2 text-xs sm:text-sm h-6 sm:h-8 px-1 sm:px-2"
                          >
                            <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md">
                              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                                <AlertCircle className="h-5 w-5" />
                                <span className="font-semibold">لا يوجد هذا الرقم المرجعي</span>
                              </div>
                              {filters.reference && (
                                <div className="space-y-2">
                                  <p className="text-sm text-red-700 dark:text-red-300">
                                    الرقم المرجعي المطلوب: <span className="font-mono bg-red-100 dark:bg-red-800 px-1 rounded">"{filters.reference}"</span>
                                  </p>
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    تأكد من صحة الرقم المرجعي أو جرب البحث بجزء منه
                                  </p>
                                </div>
                              )}
                              {!filters.reference && (
                                <p className="text-sm text-muted-foreground">لا توجد معاملات تطابق معايير البحث المحددة</p>
                              )}
                            </div>
                          </div>
                          
                          {filters.q && (
                            <p className="text-sm text-orange-600">
                              تم البحث عن النص: "{filters.q}"
                            </p>
                          )}
                          
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-2">
                              أمثلة على الأرقام المرجعية الموجودة:
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {['REF-489', 'REF-565', 'REF-579', 'REF-573'].map((ref) => (
                                <button
                                  key={ref}
                                  onClick={() => {
                                    handleFilterChange('reference', ref);
                                    setTimeout(() => handleViewStatement(), 100);
                                  }}
                                  className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 transition-colors"
                                >
                                  {ref}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* الملخص */}
            {statementData.rows.length > 0 && (
              <>
                <Separator className="my-3 sm:my-6" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <Card>
                    <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm">إجمالي المدين</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-6 pt-0">
                      <p className="text-sm sm:text-2xl font-bold text-destructive">
                        {statementData.totals.debits}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm">إجمالي الدائن</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-6 pt-0">
                      <p className="text-sm sm:text-2xl font-bold text-green-600">
                        {statementData.totals.credits}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm">صافي الحركة</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-6 pt-0">
                      <p className={`text-sm sm:text-2xl font-bold ${parseFloat(statementData.totals.net) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {statementData.totals.net}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm">إجمالي العمولات</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-6 pt-0">
                      <p className="text-sm sm:text-2xl font-bold text-yellow-600">
                        {statementData.totals.fees}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}