import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Guard } from "@/components/Guard";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Transfer } from "@shared/schema";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePageRestriction } from "@/hooks/use-access-control";
import { Link } from "wouter";

// الاحتفاظ بالأرقام العربية الغربية (عادية)
const toArabicNumerals = (text: string | number): string => {
  return String(text);
};

// دالة لـ escape HTML لمنع XSS
const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// تحويل الأرقام في التواريخ والأوقات
const convertDateTimeToArabic = (dateTimeString: string): string => {
  return toArabicNumerals(dateTimeString);
};

// تنسيق العملة بالأرقام العادية
const formatCurrencyArabic = (amount: number, currency: string): string => {
  // التحقق إذا كان المبلغ عدد صحيح
  const isWholeNumber = amount % 1 === 0;
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: isWholeNumber ? 0 : 2,
    useGrouping: false, // إزالة فواصل الآلاف
  }).format(amount);
};

// تنسيق التاريخ بالأرقام العربية
const formatDateArabic = (date: string): string => {
  try {
    if (!date || date === "غير محدد") return "غير محدد";
    return toArabicNumerals(formatDate(date));
  } catch (error) {
    return "غير محدد";
  }
};

// تنسيق الوقت بالأرقام العربية
const formatTimeArabic = (date: string): string => {
  try {
    if (!date || date === "غير محدد") return "";
    return toArabicNumerals(formatTime(date));
  } catch (error) {
    return "";
  }
};

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Input } from "@/components/ui/input";
import { 
  ArrowDownUp, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  SearchIcon,
  Printer
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type for enhanced transfer data from API
type EnhancedTransfer = Transfer & {
  senderName: string;
  receiverName: string;
  sender_account_number: string;
  receiver_account_number: string;
  isSender: boolean;
  isReceiver: boolean;
};

export default function TransfersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // فحص القيود للصفحة
  const { data: restrictionData, isLoading: isCheckingRestriction } = usePageRestriction('transfers');

  // Update document title
  useEffect(() => {
    document.title = "سجل الحوالات - صرافة الخليج";
  }, []);

  // Fetch user transfers
  const { data: transfers, isLoading } = useQuery<EnhancedTransfer[]>({
    queryKey: ["/api/transfers"],
    enabled: !!user,
  });

  // Filter transfers based on search term and type filter
  const filteredTransfers = transfers?.filter((transfer) => {
    const matchesSearch =
      searchTerm === "" ||
      transfer.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.note?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "sent" && transfer.isSender) ||
      (typeFilter === "received" && transfer.isReceiver);

    return matchesSearch && matchesType;
  });

  // Go back handler
  const handleGoBack = () => {
    navigate("/");
  };

  // دالة طباعة الإيصال الحراري
  const printReceipt = (transfer: EnhancedTransfer) => {
    const receiptWindow = window.open('', '_blank', 'width=350,height=500');
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إيصال التحويل - ${toArabicNumerals(transfer.id || '')}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.3;
            color: #000;
            padding: 10px;
            background: white;
            text-align: center;
            direction: rtl;
          }
          .receipt {
            width: 80mm;
            max-width: 350px;
            margin: 0 auto;
            padding: 3mm;
            background: white;
            border: 1px solid #ccc;
            text-align: right;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 4mm;
            padding-bottom: 3mm;
            border-bottom: 1px solid #000;
          }
          .title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2mm;
            color: #000;
          }
          .subtitle {
            font-size: 10px;
            color: #000;
          }
          .section {
            margin: 2mm 0;
            padding: 1mm 0;
          }
          .section-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 2mm;
            color: #000;
            border-bottom: 1px dotted #000;
            padding-bottom: 1mm;
            text-align: center;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 1.5mm 0;
            font-size: 9px;
            padding: 1mm 0;
          }
          .label {
            font-weight: bold;
            color: #000;
            width: 40%;
            text-align: right;
          }
          .value {
            font-weight: normal;
            color: #000;
            width: 60%;
            text-align: left;
            word-wrap: break-word;
          }
          .amount {
            font-size: 12px;
            font-weight: bold;
            color: #000;
            text-align: center;
            padding: 3mm;
            border: 2px solid #000;
            margin: 3mm 0;
            background: #f5f5f5;
          }
          .footer {
            text-align: center;
            margin-top: 3mm;
            padding-top: 2mm;
            border-top: 1px solid #000;
            font-size: 7px;
            color: #000;
          }
          .date-time {
            font-size: 6px;
            color: #000;
          }
          .separator {
            text-align: center;
            margin: 2mm 0;
            font-size: 8px;
            color: #000;
          }
          @media print {
            @page {
              size: 80mm auto;
              margin: 2mm;
            }
            body { 
              padding: 0; 
              margin: 0;
              width: 100%;
              text-align: center;
            }
            .receipt { 
              width: 80mm;
              padding: 2mm;
              margin: 0 auto;
              border: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="title">صرافة الخليج</div>
            <div class="subtitle">إيصال تحويل مالي</div>
          </div>
          
          <div class="separator">================================</div>
          
          <div class="section">
            <div class="section-title">تفاصيل العملية</div>
            <div class="row">
              <span class="label">رقم العملية:</span>
              <span class="value">${escapeHtml(toArabicNumerals(transfer.id || 'غير متوفر'))}</span>
            </div>
            <div class="row">
              <span class="label">نوع العملية:</span>
              <span class="value">${escapeHtml(transfer.isSender ? 'مرسلة' : 'مستلمة')}</span>
            </div>
            <div class="row">
              <span class="label">التاريخ:</span>
              <span class="value">${escapeHtml((transfer as any).created_at ? formatDate(String((transfer as any).created_at)) : 'غير محدد')}</span>
            </div>
            <div class="row">
              <span class="label">الوقت:</span>
              <span class="value">${escapeHtml((transfer as any).created_at ? formatTime(String((transfer as any).created_at)) : 'غير محدد')}</span>
            </div>
          </div>

          <div class="separator">- - - - - - - - - - - - - - - - -</div>

          <div class="section">
            <div class="section-title">أطراف العملية</div>
            ${transfer.isSender ? `
              <div class="row">
                <span class="label">المرسل:</span>
                <span class="value">${escapeHtml(transfer.senderName)}</span>
              </div>
              <div class="row">
                <span class="label">المستلم:</span>
                <span class="value">${escapeHtml(transfer.receiverName)}</span>
              </div>
              <div class="row">
                <span class="label">حساب المستلم:</span>
                <span class="value">${toArabicNumerals(String(transfer.receiver_account_number || 'غير متوفر'))}</span>
              </div>
            ` : `
              <div class="row">
                <span class="label">المرسل:</span>
                <span class="value">${escapeHtml(transfer.senderName)}</span>
              </div>
              <div class="row">
                <span class="label">حساب المرسل:</span>
                <span class="value">${toArabicNumerals(String(transfer.sender_account_number || 'غير متوفر'))}</span>
              </div>
              <div class="row">
                <span class="label">المستلم:</span>
                <span class="value">${escapeHtml(transfer.receiverName)}</span>
              </div>
            `}
          </div>

          <div class="separator">- - - - - - - - - - - - - - - - -</div>

          <div class="section">
            <div class="section-title">المبالغ</div>
            <div class="row">
              <span class="label">المبلغ:</span>
              <span class="value">${formatCurrencyArabic(Number(transfer.amount), transfer.currency)}</span>
            </div>
            ${transfer.isSender && transfer.commission ? `
              <div class="row">
                <span class="label">العمولة:</span>
                <span class="value">${formatCurrencyArabic(Number(transfer.commission), transfer.currency)}</span>
              </div>
            ` : ''}
            <div class="row">
              <span class="label">العملة:</span>
              <span class="value">${transfer.currency}</span>
            </div>
          </div>

          <div class="amount">
            المجموع: ${formatCurrencyArabic(
              transfer.isSender 
                ? Number(transfer.amount) + Number(transfer.commission || 0)
                : Number(transfer.amount), 
              transfer.currency
            )}
          </div>

          ${transfer.note ? `
            <div class="section">
              <div class="section-title">ملاحظات</div>
              <div class="value" style="font-size: 7px; word-wrap: break-word;">${escapeHtml(transfer.note)}</div>
            </div>
          ` : ''}

          <div class="footer">
            <div>شكراً لاختيارك صرافة الخليج</div>
            <div class="date-time">طُبع: ${toArabicNumerals(new Date().toLocaleString('ar-LY'))}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  // فحص القيود أولاً
  if (isCheckingRestriction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (restrictionData?.isBlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">تم تقييد الوصول</CardTitle>
            <CardDescription>لا يمكنك الوصول إلى صفحة التحويلات</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {restrictionData.reason && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">السبب:</p>
                <p className="font-medium">{restrictionData.reason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الإدارة
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard" className="w-full">
              <Button className="w-full" variant="outline">
                العودة للوحة التحكم
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <Guard page="send">
      <div className="min-h-screen bg-neutral-100">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-8" dir="rtl">
        <BackToDashboardButton variant="ghost" className="mb-3 sm:mb-6 text-sm sm:text-base" />

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-lg sm:text-2xl font-bold">سجل الحوالات</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              عرض قائمة بجميع الحوالات المالية التي قمت بإرسالها أو استلامها
            </CardDescription>
            
            {/* قسم رقم الحساب */}
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="text-center sm:text-right">
                  <h3 className="font-bold text-sm sm:text-lg">رقم حسابك</h3>
                  <p className="text-neutral-600 text-xs sm:text-sm hidden sm:block">شارك رقم الحساب مع الآخرين ليتمكنوا من إرسال التحويلات إليك</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <div className="bg-white p-2 px-3 sm:px-4 border-2 border-blue-300 rounded-md font-mono text-sm sm:text-xl flex-1 text-center font-bold text-blue-700">{user?.accountNumber ? toArabicNumerals(user.accountNumber) : "غير متوفر"}</div>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                    onClick={() => {
                      if (user?.accountNumber) {
                        navigator.clipboard.writeText(user.accountNumber);
                        toast({
                          title: "تم النسخ",
                          description: "تم نسخ رقم الحساب إلى الحافظة"
                        });
                      }
                    }}
                  >
                    نسخ الرقم
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {/* Filter Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-neutral-400" />
                <Input
                  className="pr-9 sm:pr-10 text-xs sm:text-sm h-8 sm:h-10"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-36 text-xs sm:text-sm h-8 sm:h-10">
                    <SelectValue>
                      {typeFilter === "all" && "جميع المعاملات"}
                      {typeFilter === "sent" && "الحوالات المرسلة"}
                      {typeFilter === "received" && "الحوالات المستلمة"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المعاملات</SelectItem>
                    <SelectItem value="sent">الحوالات المرسلة</SelectItem>
                    <SelectItem value="received">الحوالات المستلمة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transfers Table */}
            {isLoading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-500" />
              </div>
            ) : transfers?.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-neutral-500 text-sm sm:text-base">لا توجد حوالات في سجلك حتى الآن</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption className="text-xs sm:text-sm">قائمة الحوالات المالية</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right text-xs sm:text-sm">النوع</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">الطرف الآخر</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">المبلغ</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm hidden sm:table-cell">العمولة</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm hidden lg:table-cell">العملة</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">التاريخ</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm hidden md:table-cell">ملاحظة</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">طباعة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransfers?.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="py-2 sm:py-4">
                          <Badge
                            variant={transfer.isSender ? "destructive" : "default"}
                            className={`text-xs px-1 py-0.5 sm:px-2 sm:py-1 ${transfer.isSender ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                          >
                            {transfer.isSender
                              ? "مرسلة"
                              : "مستلمة"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">
                          <div className="truncate max-w-20 sm:max-w-none">
                            <div className="font-semibold">
                              {transfer.isSender
                                ? transfer.receiverName
                                : transfer.senderName}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              رقم الحساب: {toArabicNumerals(
                                transfer.isSender
                                  ? transfer.receiver_account_number || 'غير متوفر'
                                  : transfer.sender_account_number || 'غير متوفر'
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4">
                          <div className="font-mono font-bold text-green-600">
                            {formatCurrencyArabic(Number(transfer.amount), transfer.currency)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4 hidden sm:table-cell">
                          <div className="font-mono">
                            {transfer.isSender
                              ? formatCurrencyArabic(Number(transfer.commission || 0), transfer.currency)
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4 hidden lg:table-cell">{transfer.currency}</TableCell>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4">
                          <div className="flex flex-col font-mono">
                            <span className="text-xs sm:text-sm font-semibold">
                              {(transfer as any).created_at ? formatDate(String((transfer as any).created_at)) : "غير محدد"}
                            </span>
                            <span className="text-xs text-neutral-500 hidden sm:block">
                              {(transfer as any).created_at ? formatTime(String((transfer as any).created_at)) : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-16 sm:max-w-xs truncate text-xs sm:text-sm py-2 sm:py-4 hidden md:table-cell">
                          {transfer.note || "-"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 sm:h-8 sm:w-8 p-1"
                            onClick={() => printReceipt(transfer)}
                            title="طباعة إيصال"
                          >
                            <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination (simplified version without actual pagination logic) */}
            <div className="flex justify-center mt-4 sm:mt-6">
              <nav className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled className="h-7 w-7 sm:h-8 sm:w-8">
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-50 h-7 w-7 sm:h-8 sm:w-8 text-xs sm:text-sm">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled className="h-7 w-7 sm:h-8 sm:w-8">
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </nav>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </Guard>
  );
}