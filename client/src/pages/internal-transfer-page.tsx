import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Guard } from "@/components/Guard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyNoCommas } from "@/lib/number-utils";
import { ThermalReceiptModal } from "@/components/thermal-receipt-modal";
import { useOrientationMode } from "@/hooks/useOrientationMode";

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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  ArrowLeft,
  User,
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Printer,
} from "lucide-react";

// Schema للتحقق من البيانات
const internalTransferSchema = z.object({
  recipientSearch: z.string().min(1, "يرجى إدخال اسم المستخدم أو رقم الحساب"),
  currency: z.string().min(1, "يرجى اختيار العملة"),
  amount: z.string()
    .min(1, "يرجى إدخال المبلغ")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "يجب أن يكون المبلغ رقماً موجباً"),
  note: z.string().optional(),
  customCommission: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "العمولة يجب أن تكون رقماً موجباً أو صفر"),
});

type InternalTransferFormData = z.infer<typeof internalTransferSchema>;

// واجهات البيانات
interface User {
  id: number;
  fullName: string;
  phone: string;
  type: string;
}

interface Balance {
  [currency: string]: string;
}

interface SearchResult {
  id: number;
  fullName: string;
  phone?: string;
  accountNumber: string;
  type: string;
}

// العملات المدعومة
const SUPPORTED_CURRENCIES = [
  { code: "LYD", name: "دينار ليبي", symbol: "د.ل" },
  { code: "USD", name: "دولار أمريكي", symbol: "$" },
  { code: "EUR", name: "يورو", symbol: "€" },
  { code: "TRY", name: "ليرة تركية", symbol: "₺" },
  { code: "AED", name: "درهم إماراتي", symbol: "د.إ" },
  { code: "EGP", name: "جنيه مصري", symbol: "ج.م" },
  { code: "TND", name: "دينار تونسي", symbol: "د.ت" },
  { code: "GBP", name: "جنيه إسترليني", symbol: "£" },
];

export default function InternalTransferPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isAdmin = user?.type === 'admin';
  const { isAndroidAppMode } = useOrientationMode();
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const form = useForm<InternalTransferFormData>({
    resolver: zodResolver(internalTransferSchema),
    defaultValues: {
      recipientSearch: "",
      currency: "LYD",
      amount: "",
      note: "",
      customCommission: "",
    },
  });

  // جلب رصيد المستخدم
  const { data: balancesData, isLoading: isBalancesLoading } = useQuery({
    queryKey: ['/api/balance'],
    queryFn: async () => {
      const res = await apiRequest('/api/balance', 'GET');
      const data = await res.json();
      console.log('🔍 بيانات الرصيد المستلمة من الخادم:', data);
      console.log('🔍 نوع البيانات:', typeof data);
      console.log('🔍 هيكل البيانات:', JSON.stringify(data, null, 2));
      return data;
    },
  });

  const balances: Balance = balancesData?.balances || {};

  // جلب إعدادات العمولة
  const { data: commissionRates = [] } = useQuery({
    queryKey: ['/api/commission-rates'],
  });

  // حساب العمولة بناء على العملة والمبلغ المدخل
  const calculateCommission = (amount: string, currency: string) => {
    if (!amount || !currency) return { commission: 0, total: 0 };
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return { commission: 0, total: 0 };
    
    // البحث عن إعدادات العمولة للتحويل الداخلي والعملة المحددة
    const commissionSetting = Array.isArray(commissionRates) ? commissionRates.find((rate: any) => 
      rate.transferType === 'internal' && 
      rate.currency === currency &&
      rate.isActive
    ) : null;
    
    let commission = 0;
    
    if (commissionSetting) {
      // إذا كانت هناك عمولة ثابتة
      if (commissionSetting.fixedAmount && parseFloat(commissionSetting.fixedAmount) > 0) {
        commission = parseFloat(commissionSetting.fixedAmount);
      }
      // إذا كانت هناك نسبة في الألف
      else if (commissionSetting.perMilleRate && parseFloat(commissionSetting.perMilleRate) > 0) {
        commission = numAmount * parseFloat(commissionSetting.perMilleRate);
      }
      // إذا كانت هناك نسبة مئوية
      else if (commissionSetting.commissionRate && parseFloat(commissionSetting.commissionRate) > 0) {
        commission = numAmount * parseFloat(commissionSetting.commissionRate);
      }
    } else {
      // العمولة الافتراضية 1%
      commission = numAmount * 0.01;
    }
    
    return {
      commission: commission,
      total: numAmount + commission
    };
  };

  // متغيرات لعرض العمولة
  const currentAmount = form.watch("amount");
  const currentCurrency = form.watch("currency");
  const { commission, total } = calculateCommission(currentAmount, currentCurrency);

  // البحث عن المستخدمين
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiRequest(`/api/users/search?q=${encodeURIComponent(query)}`, 'GET');
      const users = await res.json();
      
      // فلترة المستخدم الحالي من النتائج
      const filteredUsers = users.filter((u: User) => u.id !== user?.id);
      setSearchResults(filteredUsers);
      
      // إذا كان هناك نتيجة واحدة فقط، اختارها تلقائياً
      if (filteredUsers.length === 1) {
        setTimeout(() => {
          selectRecipient(filteredUsers[0]);
        }, 300);
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // تنفيذ التحويل
  const transferMutation = useMutation({
    mutationFn: async (data: InternalTransferFormData & { recipientId: number }) => {
      const res = await apiRequest('/api/internal-transfer', 'POST', {
        recipientId: data.recipientId,
        currency: data.currency,
        amount: parseFloat(data.amount),
        note: data.note,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // إنشاء بيانات الإيصال
      const newReceiptData: ReceiptData = {
        id: data.transactionId || data.id,
        transferId: data.transactionId || data.id,
        fromUser: {
          id: user?.id || 0,
          fullName: user?.fullName || "غير محدد",
          accountNumber: user?.accountNumber || ""
        },
        toUser: {
          id: selectedRecipient?.id || 0,
          fullName: selectedRecipient?.fullName || "غير محدد",
          accountNumber: selectedRecipient?.accountNumber || ""
        },
        currency: data.currency || form.getValues("currency"),
        amount: parseFloat(data.amount) || parseFloat(form.getValues("amount")),
        fee: data.fee || 0,
        netAmount: parseFloat(data.amount) || parseFloat(form.getValues("amount")),
        status: 'completed',
        ref: data.ref || `INT-${Date.now()}`,
        createdAt: new Date().toISOString(),
        note: data.note || form.getValues("note"),
        hash: data.hash || `hash_${Date.now()}`
      };

      // إظهار نافذة الإيصال
      setReceiptData(newReceiptData);
      setShowReceiptModal(true);

      toast({
        title: "تم التحويل بنجاح",
        description: `تم تحويل ${data.amount} ${data.currency} إلى ${selectedRecipient?.fullName}`,
      });
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // إعادة تعيين النموذج
      form.reset();
      setSelectedRecipient(null);
      setSearchResults([]);
      setSearchTerm("");
    },
    onError: (error: any) => {
      toast({
        title: "فشل في التحويل",
        description: error.message || "حدث خطأ أثناء تنفيذ التحويل",
        variant: "destructive",
      });
    },
  });

  // تحديث البحث عند تغيير النص
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm && !selectedRecipient && searchTerm.length >= 2) {
        searchUsers(searchTerm);
      } else if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedRecipient]);

  // تنفيذ التحويل
  const onSubmit = async (data: InternalTransferFormData) => {
    if (!selectedRecipient) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المستلم من نتائج البحث",
        variant: "destructive",
      });
      return;
    }

    if (selectedRecipient.id === user?.id) {
      toast({
        title: "خطأ",
        description: "لا يمكن التحويل إلى نفس الحساب",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(data.amount);
    const currentBalance = parseFloat(balances[data.currency] || "0");
    
    console.log('🔍 تحقق من الرصيد عند التحويل:', { 
      currency: data.currency, 
      amount, 
      currentBalance, 
      balances: balances,
      rawBalance: balances[data.currency],
      typeOfBalance: typeof balances[data.currency],
      parsedBalance: parseFloat(balances[data.currency] || "0")
    });
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "خطأ في المبلغ",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }
    
    if (currentBalance < amount) {
      toast({
        title: "رصيد غير كافٍ",
        description: `رصيدك الحالي: ${formatCurrencyNoCommas(currentBalance, data.currency)} - المطلوب: ${formatCurrencyNoCommas(amount, data.currency)}`,
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      ...data,
      recipientId: selectedRecipient.id,
    });
  };

  // اختيار مستلم من نتائج البحث
  const selectRecipient = (recipient: SearchResult) => {
    setSelectedRecipient(recipient);
    setSearchTerm(recipient.fullName);
    setSearchResults([]);
    form.setValue("recipientSearch", recipient.fullName);
  };

  // إلغاء اختيار المستلم
  const clearRecipient = () => {
    setSelectedRecipient(null);
    setSearchTerm("");
    setSearchResults([]);
    form.setValue("recipientSearch", "");
  };

  if (!user) return null;

  return (
    <Guard page="send">
      <div className="golden-page-bg min-h-screen px-1 sm:px-4 py-1 sm:py-4">
      <div className="w-full sm:container sm:mx-auto sm:max-w-4xl">
        {/* شريط التنقل */}
        <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-6">
          <BackToDashboardButton variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 h-6 w-6 sm:h-10 sm:w-10 p-1 sm:p-2" />
          <div className="h-4 w-px sm:h-6 bg-slate-300" />
          <h1 className="text-sm sm:text-2xl font-bold text-slate-800 text-center flex-1">التحويل الداخلي</h1>
        </div>

        <div className="space-y-2 sm:space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          {/* النموذج الرئيسي */}
          <div className="order-1 lg:col-span-2">
            <Card className="shadow-lg border-0 rounded-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg p-2 sm:p-6 text-center">
                <CardTitle className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base">
                  <Send className="h-3 w-3 sm:h-5 sm:w-5" />
                  تحويل داخلي
                </CardTitle>
                <CardDescription className="text-blue-100 text-xs sm:text-sm text-center">
                  قم بتحويل الأموال إلى أي مستخدم داخل المنصة بجميع العملات
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 sm:space-y-6">
                    {/* البحث عن المستلم */}
                    <FormField
                      control={form.control}
                      name="recipientSearch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs sm:text-sm">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            المستلم
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                placeholder="ابحث بالاسم أو رقم الحساب..."
                                value={searchTerm}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSearchTerm(value);
                                  field.onChange(value);
                                  if (selectedRecipient && value !== selectedRecipient.fullName) {
                                    setSelectedRecipient(null);
                                  }
                                }}
                                className="pl-10 text-xs sm:text-sm h-8 sm:h-10"
                              />
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                              {isSearching && (
                                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 animate-spin text-slate-400" />
                              )}
                            </div>
                          </FormControl>
                          
                          {/* نتائج البحث */}
                          {searchResults.length > 1 && !selectedRecipient && (
                            <div className="mt-2 border rounded-lg bg-white shadow-sm max-h-40 sm:max-h-48 overflow-y-auto">
                              {searchResults.map((result) => (
                                <div
                                  key={result.id}
                                  onClick={() => selectRecipient(result)}
                                  className="p-2 sm:p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 flex items-center justify-between active:bg-slate-100"
                                >
                                  <div>
                                    <p className="font-medium text-slate-800 text-xs sm:text-sm">{result.fullName}</p>
                                    <p className="text-slate-500 text-xs">رقم الحساب: {result.accountNumber}</p>
                                  </div>
                                  <Badge variant={result.type === 'agent' ? 'default' : 'secondary'} className="text-xs">
                                    {result.type === 'agent' ? 'وكيل' : 'مستخدم'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* رسالة عدم العثور على نتائج مع اقتراحات */}
                          {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && !selectedRecipient && (
                            <div className="mt-2 p-2 sm:p-3 border rounded-lg bg-slate-50">
                              <p className="text-center text-slate-500 text-xs sm:text-sm mb-2">
                                لم يتم العثور على مستخدمين مطابقين
                              </p>
                              <div className="space-y-2">
                                <p className="text-slate-600 font-medium text-xs">أرقام حسابات متاحة للاختبار:</p>
                                <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:gap-2">
                                  {[
                                    { name: "Test User 1006", account: "1006" },
                                    { name: "m11", account: "33003002" },
                                    { name: "ssss", account: "33003003" },
                                    { name: "m1101", account: "33003004" }
                                  ].map((testUser) => (
                                    <Button
                                      key={testUser.account}
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const testRecipient = {
                                          id: parseInt(testUser.account),
                                          fullName: testUser.name,
                                          accountNumber: testUser.account,
                                          type: "user"
                                        };
                                        selectRecipient(testRecipient);
                                      }}
                                      className="text-xs px-2 py-1 h-auto sm:h-9"
                                    >
                                      <span className="sm:hidden">{testUser.account}</span>
                                      <span className="hidden sm:inline">{testUser.account} ({testUser.name})</span>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* المستلم المختار */}
                          {selectedRecipient && (
                            <div className="mt-2 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-green-800 text-xs sm:text-sm">{selectedRecipient.fullName}</p>
                                  <p className="text-green-600 text-xs">رقم الحساب: {selectedRecipient.accountNumber}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Badge variant={selectedRecipient.type === 'agent' ? 'default' : 'secondary'} className="text-xs">
                                  {selectedRecipient.type === 'agent' ? 'وكيل' : 'مستخدم'}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={clearRecipient}
                                  className="text-green-600 hover:text-green-800 text-xs px-1 sm:px-2 h-6 sm:h-8"
                                >
                                  إلغاء
                                </Button>
                              </div>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* اختيار العملة */}
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs sm:text-sm">
                            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                            العملة
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                                <SelectValue placeholder="اختر العملة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SUPPORTED_CURRENCIES.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                                    <span>{currency.symbol}</span>
                                    <span>{currency.name}</span>
                                    <span className="text-slate-500">({currency.code})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* المبلغ */}
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs sm:text-sm">
                            <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                            المبلغ
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="text-left text-xs sm:text-sm h-8 sm:h-10"
                            />
                          </FormControl>
                          
                          {/* عرض الرصيد المتاح */}
                          {form.watch("currency") && (
                            <p className="text-slate-600 flex items-center gap-1 text-xs sm:text-sm">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              الرصيد المتاح: {formatCurrencyNoCommas(parseFloat(balances[form.watch("currency")] || "0"), form.watch("currency"))}
                            </p>
                          )}
                          
                          {/* عرض تفاصيل العمولة والإجمالي */}
                          {currentAmount && currentCurrency && parseFloat(currentAmount) > 0 && (
                            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                              <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-slate-600">المبلغ:</span>
                                <span className="font-medium">{formatCurrencyNoCommas(parseFloat(currentAmount), currentCurrency)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-slate-600">العمولة:</span>
                                <span className="font-medium text-blue-600">{formatCurrencyNoCommas(commission, currentCurrency)}</span>
                              </div>
                              <div className="border-t border-blue-200 pt-2">
                                <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                                  <span className="text-slate-800">المجموع الكلي:</span>
                                  <span className="text-blue-700">{formatCurrencyNoCommas(total, currentCurrency)}</span>
                                </div>
                              </div>
                              {parseFloat(balances[currentCurrency] || "0") < total && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                                  ⚠️ الرصيد غير كافٍ لإتمام التحويل (يشمل العمولة)
                                </div>
                              )}
                            </div>
                          )}
                          
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* الملاحظة */}
                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">ملاحظة (اختياري)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="أضف ملاحظة للمستلم..."
                              rows={2}
                              className="resize-none text-xs sm:text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isAdmin && (
                      <FormField
                        control={form.control}
                        name="customCommission"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-xs sm:text-sm">
                              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                              عمولة مخصصة (اختياري - للإدارة فقط)
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="قيمة العمولة المخصصة" 
                                type="number" 
                                step="0.01" 
                                min="0"
                                className="text-xs sm:text-sm h-8 sm:h-10"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}



                    {/* زر الإرسال */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 py-2 sm:py-4 text-xs sm:text-base h-8 sm:h-12"
                      disabled={transferMutation.isPending || !selectedRecipient}
                    >
                      {transferMutation.isPending ? (
                        <>
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 animate-spin" />
                          جاري التحويل...
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                          تحويل الأموال
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* الشريط الجانبي */}
          <div className="order-2 space-y-2 sm:space-y-3 lg:space-y-6">
            {/* عرض الأرصدة */}
            <Card className="shadow-lg border-0 rounded-lg">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg p-2 sm:p-6">
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base">
                  <Wallet className="h-3 w-3 sm:h-5 sm:w-5" />
                  أرصدتك الحالية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                {isBalancesLoading ? (
                  <div className="space-y-1 sm:space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 sm:h-12 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 sm:space-y-3">
                    {SUPPORTED_CURRENCIES.slice(0, 5).map((currency) => {
                      const balance = balances[currency.code] || "0";
                      const amount = parseFloat(balance);
                      
                      console.log(`🔍 عرض رصيد ${currency.code}:`, { 
                        balance, 
                        amount, 
                        isNaN: isNaN(amount),
                        balances,
                        currencyCode: currency.code,
                        balanceFromObject: balances[currency.code]
                      });
                      
                      return (
                        <div
                          key={currency.code}
                          className="flex items-center justify-between p-1.5 sm:p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-xs sm:text-lg">{currency.symbol}</span>
                            <span className="font-medium text-xs sm:text-sm">{currency.code}</span>
                          </div>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {formatCurrencyNoCommas(amount, currency.code)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* تنبيهات مهمة */}
            <Card className="shadow-lg border-0 rounded-lg hidden lg:block">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  تنبيهات مهمة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>التحويل فوري ولا يتطلب رموز تأكيد</p>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p>تأكد من صحة بيانات المستلم قبل التحويل</p>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>سيتم إرسال إشعار للمستلم فور استلام المبلغ</p>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p>لا يمكن التراجع عن التحويل بعد التأكيد</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* نافذة الإيصال */}
      <ThermalReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptData={receiptData}
      />
      </div>
    </Guard>
  );
}