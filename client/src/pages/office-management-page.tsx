import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Guard } from "@/components/Guard";
import { 
  Settings, 
  Info, 
  Building2,
  Wallet,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Archive,
  DollarSign,
  Users,
  Loader2,
  Calculator,
  CheckCircle,
  X,
} from "lucide-react";

// الواجهات والأنواع
interface OfficeUser {
  id: number;
  fullName: string;
  officeName: string;
  accountNumber: string;
  city: string;
  type: string;
}

// العملات المدعومة
const SUPPORTED_CURRENCIES = [
  { code: "LYD", name: "الدينار الليبي", symbol: "د.ل" },
  { code: "USD", name: "الدولار الأمريكي", symbol: "$" },
  { code: "EUR", name: "اليورو", symbol: "€" },
  { code: "TRY", name: "الليرة التركية", symbol: "₺" },
  { code: "AED", name: "الدرهم الإماراتي", symbol: "د.إ" },
  { code: "EGP", name: "الجنيه المصري", symbol: "ج.م" },
  { code: "TND", name: "الدينار التونسي", symbol: "د.ت" },
  { code: "GBP", name: "الجنيه الإسترليني", symbol: "£" }
];

// شرائح التحقق من البيانات
const transferSchema = z.object({
  countryName: z.string().min(1, "يرجى اختيار دولة الوجهة"),
  agentOfficeId: z.string().min(1, "يرجى اختيار المكتب المستلم"),
  amount: z.string().min(1, "يرجى إدخال المبلغ").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "يجب أن يكون المبلغ رقماً موجباً"
  ),
  currency: z.string().min(1, "يرجى اختيار العملة"),
  notes: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

export default function OfficeManagementPage() {
  return (
    <Guard page="office_management">
      <OfficeManagementContent />
    </Guard>
  );
}

function OfficeManagementContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // التحقق من نوع المستخدم والصلاحيات
  useEffect(() => {
    if (user && user.type !== 'agent' && user.type !== 'admin') {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة متاحة للمكاتب فقط",
        variant: "destructive",
      });
      setLocation('/dashboard');
      return;
    }

    if (user && !user.extTransferEnabled) {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة متاحة للمكاتب المرخصة للتحويل الدولي فقط.",
        variant: "destructive",
      });
      setLocation('/dashboard');
    }
  }, [user, setLocation, toast]);

  // نموذج التحويل
  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      countryName: "",
      agentOfficeId: "",
      amount: "",
      currency: "USD",
      notes: "",
    },
  });

  // ==== استعلامات البيانات ====

  // جلب الدول المتاحة للتحويل الدولي
  const { data: internationalCountries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ['/api/countries/international'],
    queryFn: async () => {
      const res = await apiRequest('/api/countries/international', 'GET');
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // جلب مكاتب الوكلاء للدولة المختارة
  const agentOfficesQuery = useQuery({
    queryKey: ['/api/agent-offices', selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return [];
      const res = await apiRequest(`/api/agent-offices?country=${encodeURIComponent(selectedCountry)}`, 'GET');
      const offices = await res.json();
      // تصفية المكاتب المملوكة لنفس المستخدم
      return offices.filter((office: any) => office.agentId !== user?.id);
    },
    enabled: !!selectedCountry && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // جلب الأرصدة
  const balanceQuery = useQuery({
    queryKey: ['/api/balance'],
    queryFn: async () => {
      const res = await apiRequest('/api/balance', 'GET');
      return await res.json();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // جلب سجل التحويلات
  const transferHistoryQuery = useQuery({
    queryKey: ['/api/inter-office-transfers'],
    queryFn: async () => {
      const res = await apiRequest('/api/inter-office-transfers', 'GET');
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // جلب عروض أسعار العمولة (التحديث الفوري للعمولات)
  const commissionQuoteQuery = useQuery({
    queryKey: ['/api/inter-office-transfers/quote', transferForm.watch('amount'), transferForm.watch('currency'), transferForm.watch('agentOfficeId')],
    queryFn: async () => {
      const amount = transferForm.watch('amount');
      const currency = transferForm.watch('currency');
      const agentOfficeId = transferForm.watch('agentOfficeId');
      
      if (!amount || !currency || !agentOfficeId || parseFloat(amount) <= 0) {
        return null;
      }
      
      const res = await apiRequest(
        `/api/inter-office-transfers/quote?amount=${encodeURIComponent(amount)}&currency=${encodeURIComponent(currency)}&receiverOfficeId=${encodeURIComponent(agentOfficeId)}`, 
        'GET'
      );
      return await res.json();
    },
    enabled: !!(transferForm.watch('amount') && transferForm.watch('currency') && transferForm.watch('agentOfficeId') && parseFloat(transferForm.watch('amount') || '0') > 0),
    staleTime: 30 * 1000, // تحديث كل 30 ثانية
    gcTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ==== الطفرات (Mutations) ====

  // إرسال تحويل جديد
  const transferMutation = useMutation({
    mutationFn: async (data: TransferFormValues) => {
      const transferData = {
        receiverName: "تحويل دولي", // placeholder للتحويلات الدولية
        receiverPhone: "00000000", // placeholder
        amount: parseFloat(data.amount),
        receivingOffice: parseInt(data.agentOfficeId),
        destinationCountry: data.countryName,
        notes: data.notes?.trim() || "",
        currency: data.currency
      };
      
      const res = await apiRequest('/api/inter-office-transfers', 'POST', transferData);
      return await res.json();
    },
    onSuccess: (result) => {
      toast({
        title: "✅ تم إنشاء التحويل بنجاح",
        description: `رمز الاستلام: ${result.receiverCode}\nالمبلغ: ${result.amountOriginal} ${result.currency}`,
        duration: 10000,
      });
      transferForm.reset();
      setSelectedCountry(null);
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inter-office-transfers'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحويل",
        description: error.message || "حدث خطأ أثناء إرسال التحويل",
        variant: "destructive",
      });
    },
  });

  // ==== دوال المساعدة ====

  const getCurrencyName = (code: string) => {
    return SUPPORTED_CURRENCIES.find(c => c.code === code)?.name || code;
  };

  const getCurrencySymbol = (code: string) => {
    return SUPPORTED_CURRENCIES.find(c => c.code === code)?.symbol || code;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  // ==== معالجات الأحداث ====

  const onSubmitTransfer = async (data: TransferFormValues) => {
    transferMutation.mutate(data);
  };

  const handleCancelTransfer = async (transferId: number) => {
    try {
      await apiRequest(`/api/inter-office-transfers/${transferId}`, 'DELETE');
      toast({
        title: "تم إلغاء التحويل",
        description: "تم إلغاء التحويل بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inter-office-transfers'] });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إلغاء التحويل",
        variant: "destructive",
      });
    }
  };

  // ==== عرض الصفحة ====

  if (!user || (user.type !== 'agent' && user.type !== 'admin')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">هذه الصفحة مخصصة لمكاتب الصرافة والمديرين فقط</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-1 sm:px-6 py-1 sm:py-6 space-y-2 sm:space-y-6">
      <div className="mb-1 sm:mb-4">
        <BackToDashboardButton />
      </div>

      {/* العنوان الرئيسي */}
      <div className="space-y-0.5 sm:space-y-2">
        <h1 className="text-lg sm:text-3xl font-bold flex items-center gap-1 sm:gap-2">
          <Settings className="h-4 w-4 sm:h-8 sm:w-8 text-primary" />
          إدارة التحويلات الدولية
        </h1>
        <p className="text-xs sm:text-lg text-muted-foreground hidden sm:block">
          إدارة التحويلات الدولية بين المكاتب
        </p>
      </div>

      {/* معلومات توضيحية */}
      <Alert className="relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground text-foreground py-4 px-6 my-3 mx-2 bg-[#8fdfb4] border-[#8fdfb4] pl-[24px] pr-[24px] ml-[0px] mr-[0px] mt-[4px] mb-[4px]">
        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-[#09090b]" />
        <AlertDescription className="text-[10px] sm:text-sm text-[#09090b] text-center">
          يمكنك إرسال تحويلات إلى مكاتب أخرى معتمدة في نظام الصرافة. جميع التحويلات تخضع للرسوم والعمولات المحددة.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6">
        {/* نموذج التحويل */}
        <Card>
          <CardHeader className="pb-2 sm:pb-6 bg-[#bfe8d2]">
            <CardTitle className="flex items-center gap-1 sm:gap-2 text-sm sm:text-lg">
              <Send className="h-3 w-3 sm:h-5 sm:w-5" />
              إرسال تحويل جديد
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-sm">
              أدخل تفاصيل التحويل إلى المكتب المطلوب
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <Form {...transferForm}>
              <form onSubmit={transferForm.handleSubmit(onSubmitTransfer)} className="space-y-2 sm:space-y-4">
                {/* اختيار الدولة */}
                <FormField
                  control={transferForm.control}
                  name="countryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-sm">الدولة المستقبلة</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCountry(value);
                        transferForm.setValue("agentOfficeId", "");
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-6 sm:h-10 text-[10px] sm:text-sm">
                            <SelectValue placeholder="اختر الدولة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {internationalCountries.map((country: any) => (
                            <SelectItem key={country.name} value={country.name}>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-[10px] sm:text-sm">{country.name}</span>
                                <span className="text-[9px] sm:text-sm text-muted-foreground">
                                  ({country.officeCount} مكتب)
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* اختيار المكتب */}
                <FormField
                  control={transferForm.control}
                  name="agentOfficeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-sm">مكتب الوكيل</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value} 
                        disabled={!selectedCountry}
                      >
                        <FormControl>
                          <SelectTrigger className="h-6 sm:h-10 text-[10px] sm:text-sm">
                            <SelectValue placeholder="اختر المكتب" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {agentOfficesQuery.data?.map((office: any) => (
                            <SelectItem key={office.id} value={office.id.toString()}>
                              <div className="flex flex-col">
                                <span className="text-[10px] sm:text-sm font-medium">{office.officeName}</span>
                                <span className="text-[9px] sm:text-sm text-muted-foreground">
                                  {office.agentName} - {office.city}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* العملة والمبلغ */}
                <div className="grid grid-cols-2 gap-1 sm:gap-4">
                  <FormField
                    control={transferForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] sm:text-sm">العملة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-6 sm:h-10 text-[10px] sm:text-sm">
                              <SelectValue placeholder="اختر العملة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                <span className="text-[10px] sm:text-sm">{currency.symbol} {currency.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={transferForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] sm:text-sm">المبلغ</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="1"
                            placeholder="0.00"
                            className="h-6 sm:h-10 text-[10px] sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ملاحظات */}
                <FormField
                  control={transferForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-sm">ملاحظات (اختياري)</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="أدخل أي ملاحظات إضافية..."
                          className="w-full h-12 sm:h-20 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-sm border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ملخص التكاليف */}
                {transferForm.watch("amount") && transferForm.watch("currency") && transferForm.watch("agentOfficeId") && (
                  <div className="bg-muted/20 border rounded-lg p-2 sm:p-3 space-y-1 sm:space-y-2">
                    <h4 className="font-semibold text-[10px] sm:text-sm">ملخص التكاليف</h4>
                    {commissionQuoteQuery.isLoading ? (
                      <div className="text-center py-2">
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary mx-auto mb-1"></div>
                        <p className="text-[8px] sm:text-xs text-muted-foreground">جاري حساب العمولة...</p>
                      </div>
                    ) : commissionQuoteQuery.data ? (
                      <div className="space-y-0.5 sm:space-y-1 text-[9px] sm:text-sm">
                        <div className="flex justify-between">
                          <span>المبلغ الأساسي:</span>
                          <span>{commissionQuoteQuery.data.amount} {commissionQuoteQuery.data.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>عمولة النظام:</span>
                          <span className="text-orange-600 dark:text-orange-400">
                            {commissionQuoteQuery.data.systemCommission || commissionQuoteQuery.data.commission} {commissionQuoteQuery.data.currency}
                          </span>
                        </div>
                        {commissionQuoteQuery.data.receiverCommission && commissionQuoteQuery.data.receiverCommission > 0 && (
                          <div className="flex justify-between">
                            <span>عمولة المكتب المستلم:</span>
                            <span className="text-blue-600 dark:text-blue-400">
                              {commissionQuoteQuery.data.receiverCommission} {commissionQuoteQuery.data.currency}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold border-t pt-0.5 sm:pt-1">
                          <span>المجموع:</span>
                          <span className="text-green-600 dark:text-green-400">
                            {commissionQuoteQuery.data.total} {commissionQuoteQuery.data.currency}
                          </span>
                        </div>
                        {commissionQuoteQuery.data.commissionType && commissionQuoteQuery.data.commissionType !== 'default' && (
                          <div className="text-[8px] sm:text-xs text-muted-foreground pt-0.5 sm:pt-1">
                            نوع العمولة: {
                              commissionQuoteQuery.data.commissionType === 'fixed' ? 'ثابتة' :
                              commissionQuoteQuery.data.commissionType === 'percentage' ? 'نسبة مئوية' :
                              commissionQuoteQuery.data.commissionType === 'per_mille' ? 'في الألف' : 'افتراضية'
                            }
                          </div>
                        )}
                      </div>
                    ) : commissionQuoteQuery.error ? (
                      <div className="text-center py-2">
                        <p className="text-[8px] sm:text-xs text-red-500">
                          خطأ في حساب العمولة
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-[8px] sm:text-xs text-muted-foreground">
                          أدخل جميع البيانات لحساب العمولة
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={transferMutation.isPending}
                  className="w-full h-6 sm:h-10 text-[10px] sm:text-sm"
                >
                  {transferMutation.isPending ? "جاري الإرسال..." : "إرسال التحويل"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* أرصدة العملات */}
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="text-sm sm:text-lg">أرصدة العملات</CardTitle>
            <CardDescription className="text-[10px] sm:text-sm">
              الأرصدة المتاحة للتحويل
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {balanceQuery.isLoading ? (
              <div className="text-center py-4 sm:py-8">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-1 sm:mb-2"></div>
                <p className="text-[10px] sm:text-sm">جاري تحميل الأرصدة...</p>
              </div>
            ) : balanceQuery.data && Object.keys(balanceQuery.data.balances).length > 0 ? (
              <div className="space-y-1.5 sm:space-y-3">
                {Object.entries(balanceQuery.data.balances).map(([currency, balance]: [string, any]) => (
                  <div key={currency} className="flex items-center justify-between p-1.5 sm:p-3 border rounded-lg">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-[10px] sm:text-sm font-bold text-primary">
                          {getCurrencySymbol(currency)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-[10px] sm:text-sm">
                          {getCurrencyName(currency)}
                        </div>
                        <div className="text-[9px] sm:text-sm text-muted-foreground">{currency}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[10px] sm:text-lg">{balance}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 sm:py-8">
                <Wallet className="h-6 w-6 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-1 sm:mb-2" />
                <p className="text-[10px] sm:text-sm text-muted-foreground">لا توجد أرصدة متاحة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* مكاتب معتمدة */}
      {agentOfficesQuery.data && agentOfficesQuery.data.length > 0 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="text-sm sm:text-lg">
              المكاتب المعتمدة
              <Badge variant="secondary" className="mr-1 sm:mr-2 text-[8px] sm:text-xs">
                {agentOfficesQuery.data.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-sm">
              قائمة بالمكاتب المتاحة للتحويل إليها
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-3">
              {agentOfficesQuery.data.map((office: any) => (
                <div 
                  key={office.id} 
                  className="p-1.5 sm:p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[10px] sm:text-sm">{office.officeName}</h4>
                      <p className="text-[9px] sm:text-sm text-muted-foreground">{office.agentName}</p>
                      <p className="text-[8px] sm:text-xs text-muted-foreground">{office.city}, {office.ownerNationality}</p>
                    </div>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Building2 className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* سجل التحويلات */}
      <Card>
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-sm sm:text-lg">سجل التحويلات</CardTitle>
          <CardDescription className="text-[10px] sm:text-sm">
            آخر التحويلات المرسلة والمستقبلة
          </CardDescription>
        </CardHeader>
        <CardContent className="px-1 sm:px-6 pb-3 sm:pb-6">
          {transferHistoryQuery.isLoading ? (
            <div className="text-center py-4 sm:py-8">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-1 sm:mb-2"></div>
              <p className="text-[10px] sm:text-sm">جاري تحميل سجل التحويلات...</p>
            </div>
          ) : transferHistoryQuery.data && transferHistoryQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[8px] sm:text-sm">التاريخ</TableHead>
                    <TableHead className="text-[8px] sm:text-sm">المكتب</TableHead>
                    <TableHead className="text-[8px] sm:text-sm">المبلغ</TableHead>
                    <TableHead className="text-[8px] sm:text-sm">النوع</TableHead>
                    <TableHead className="text-[8px] sm:text-sm">الحالة</TableHead>
                    <TableHead className="text-[8px] sm:text-sm">العمليات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferHistoryQuery.data.map((transfer: any) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="text-[8px] sm:text-xs">
                        {formatDate(transfer.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="text-[8px] sm:text-xs">
                          <div className="font-medium">{transfer.officeName}</div>
                          <div className="text-muted-foreground">{transfer.city}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[8px] sm:text-xs font-medium">
                        {transfer.amount} {transfer.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {transfer.direction === 'outgoing' ? (
                            <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3 text-red-500" />
                          ) : (
                            <ArrowDownLeft className="h-2 w-2 sm:h-3 sm:w-3 text-green-500" />
                          )}
                          <span className="text-[8px] sm:text-xs">
                            {transfer.direction === 'outgoing' ? 'صادر' : 'وارد'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transfer.status === 'completed' ? 'default' : transfer.status === 'pending' ? 'secondary' : 'destructive'}
                          className="text-[8px] sm:text-xs px-1 py-0 sm:px-2 sm:py-1"
                        >
                          {transfer.status === 'completed' ? 'مكتمل' : 
                           transfer.status === 'pending' ? 'معلق' : 
                           transfer.status === 'cancelled' ? 'ملغي' : transfer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transfer.status === 'pending' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelTransfer(transfer.id)}
                            className="h-5 sm:h-8 text-[8px] sm:text-xs px-1 sm:px-3"
                          >
                            <X className="h-2 w-2 sm:h-3 sm:w-3 ml-0.5 sm:ml-1" />
                            إلغاء
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 sm:py-8">
              <Archive className="h-6 w-6 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-1 sm:mb-2" />
              <p className="text-[10px] sm:text-sm text-muted-foreground">لا توجد تحويلات بعد</p>
              <p className="text-[9px] sm:text-sm text-muted-foreground">ابدأ بإرسال أول تحويل لك</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}