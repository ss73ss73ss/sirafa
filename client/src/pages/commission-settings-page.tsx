import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Guard } from "@/components/Guard";
import { 
  Settings, 
  DollarSign, 
  Edit3, 
  Plus, 
  Info, 
  Trash2,
  Calculator,
} from "lucide-react";

// الواجهات والأنواع
interface AgentCommissionSetting {
  id: number;
  agentId: number;
  currencyCode: string;
  type: "percentage" | "fixed";
  value: string;
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

// صيغة التحقق للعمولة
const commissionSchema = z.object({
  currencyCode: z.string().min(1, "يرجى اختيار العملة"),
  type: z.enum(["percentage", "fixed"], {
    required_error: "يرجى اختيار نوع العمولة",
  }),
  value: z.string().min(1, "يرجى إدخال قيمة العمولة").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "يجب أن تكون القيمة رقماً موجباً"),
});

type CommissionFormValues = z.infer<typeof commissionSchema>;

export default function CommissionSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingCommission, setEditingCommission] = useState<AgentCommissionSetting | null>(null);

  // نموذج العمولة
  const commissionForm = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      currencyCode: "",
      type: "percentage",
      value: "",
    },
  });

  // ==== استعلامات البيانات ====

  // جلب عمولات الوكيل
  const { data: agentCommissions = [], isLoading: agentCommissionsLoading, refetch: refetchCommissions } = useQuery({
    queryKey: ['/api/agent/commissions'],
    queryFn: async () => {
      const res = await apiRequest('/api/agent/commissions', 'GET');
      return await res.json();
    },
    enabled: user?.type === 'agent' || user?.type === 'admin',
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000, // 10 دقائق
    refetchOnWindowFocus: false, // منع إعادة التحميل عند العودة للنافذة
  });

  // جلب إحصائيات عمولات الوكيل (أعلى وأقل عمولة)
  const { data: commissionStats = null, isLoading: commissionStatsLoading } = useQuery({
    queryKey: ['/api/agent/commission-stats'],
    queryFn: async () => {
      const res = await apiRequest('/api/agent/commission-stats', 'GET');
      return await res.json();
    },
    enabled: user?.type === 'agent' || user?.type === 'admin',
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000, // 10 دقائق
    refetchOnWindowFocus: false, // منع إعادة التحميل عند العودة للنافذة
  });

  // ==== الطفرات (Mutations) ====

  // إضافة/تحديث عمولة الوكيل
  const addCommissionMutation = useMutation({
    mutationFn: async (data: CommissionFormValues) => {
      const res = await apiRequest('/api/agent/commissions', 'POST', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ العمولة بنجاح",
        description: "تم إضافة إعدادات العمولة للعملة المحددة",
      });
      commissionForm.reset();
      setEditingCommission(null);
      queryClient.invalidateQueries({ queryKey: ['/api/agent/commissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agent/commission-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حفظ العمولة",
        description: error.message || "حدث خطأ أثناء حفظ العمولة",
        variant: "destructive",
      });
    },
  });

  // حذف عمولة الوكيل
  const deleteCommissionMutation = useMutation({
    mutationFn: async (commissionId: number) => {
      const res = await apiRequest(`/api/agent/commissions/${commissionId}`, 'DELETE');
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم حذف العمولة بنجاح",
        description: "تم حذف إعدادات العمولة للعملة المحددة",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agent/commissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agent/commission-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف العمولة",
        description: error.message || "حدث خطأ أثناء حذف العمولة",
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

  const formatCommissionValue = (commission: AgentCommissionSetting) => {
    if (commission.type === 'percentage') {
      return `${commission.value}%`;
    } else {
      return `${commission.value} ${commission.currencyCode}`;
    }
  };

  // ==== معالجات الأحداث ====

  const onSubmitCommission = async (data: CommissionFormValues) => {
    addCommissionMutation.mutate(data);
  };

  const handleEditCommission = (commission: AgentCommissionSetting) => {
    setEditingCommission(commission);
    commissionForm.setValue("currencyCode", commission.currencyCode);
    commissionForm.setValue("type", commission.type);
    commissionForm.setValue("value", commission.value);
  };

  const handleDeleteCommission = (commissionId: number) => {
    if (confirm("هل أنت متأكد من حذف هذه العمولة؟")) {
      deleteCommissionMutation.mutate(commissionId);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommission(null);
    commissionForm.reset();
  };

  // العملات المتاحة للإضافة (التي لم يتم تحديد عمولة لها بعد)
  const availableCurrencies = SUPPORTED_CURRENCIES.filter(
    currency => !agentCommissions.some((c: AgentCommissionSetting) => c.currencyCode === currency.code) || 
    (editingCommission && editingCommission.currencyCode === currency.code)
  );

  if (!user) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <Guard page="commission_settings">
      <div className="container mx-auto p-1 sm:p-6 space-y-2 sm:space-y-6 max-w-7xl">
        {/* العنوان وزر العودة */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-3xl font-bold flex items-center gap-1 sm:gap-2">
              <Settings className="h-5 w-5 sm:h-8 sm:w-8" />
              إعدادات العمولة
            </h1>
            <p className="text-[10px] sm:text-lg text-muted-foreground mt-0.5 sm:mt-2">
              إدارة إعدادات العمولة للعملات المختلفة
            </p>
          </div>
          <BackToDashboardButton className="w-full sm:w-auto" />
        </div>

        {/* معلومات توضيحية */}
        <Alert className="py-1.5 sm:py-4">
          <Info className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertDescription className="text-[10px] sm:text-sm">
            يمكنك تحديد نسبة عمولة مختلفة لكل عملة. العمولة تُضاف لرصيدك عند استلام الحوالات من مكاتب أخرى.
            <span className="hidden sm:inline"> يمكن استخدام نسبة مئوية أو مبلغ ثابت لكل عملة.</span>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6">
          {/* نموذج إضافة/تعديل العمولة */}
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="flex items-center gap-1 sm:gap-2 text-sm sm:text-lg">
                {editingCommission ? (
                  <>
                    <Edit3 className="h-3 w-3 sm:h-5 sm:w-5" />
                    تعديل إعدادات العمولة
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 sm:h-5 sm:w-5" />
                    إضافة إعدادات عمولة جديدة
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-sm">
                {editingCommission 
                  ? "تعديل إعدادات العمولة للعملة المحددة"
                  : "حدد العملة ونوع العمولة المطلوبة"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <Form {...commissionForm}>
                <form onSubmit={commissionForm.handleSubmit(onSubmitCommission)} className="space-y-2 sm:space-y-4">
                  {/* اختيار العملة */}
                  <FormField
                    control={commissionForm.control}
                    name="currencyCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] sm:text-sm">العملة</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!!editingCommission}
                        >
                          <FormControl>
                            <SelectTrigger className="h-6 sm:h-10 text-[10px] sm:text-sm">
                              <SelectValue placeholder="اختر العملة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCurrencies.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="font-medium text-[10px] sm:text-sm">{currency.symbol}</span>
                                  <span className="text-[10px] sm:text-sm">{currency.name}</span>
                                  <span className="text-[9px] sm:text-sm text-muted-foreground">({currency.code})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* نوع العمولة */}
                  <FormField
                    control={commissionForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-1 sm:space-y-3">
                        <FormLabel className="text-[10px] sm:text-sm">نوع العمولة</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1 sm:space-y-2"
                          >
                            <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
                              <RadioGroupItem value="percentage" id="percentage" className="scale-75 sm:scale-100" />
                              <Label htmlFor="percentage" className="flex items-center gap-1 sm:gap-2 cursor-pointer text-[10px] sm:text-sm">
                                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                                نسبة مئوية (%)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
                              <RadioGroupItem value="fixed" id="fixed" className="scale-75 sm:scale-100" />
                              <Label htmlFor="fixed" className="flex items-center gap-1 sm:gap-2 cursor-pointer text-[10px] sm:text-sm">
                                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                                مبلغ ثابت
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* قيمة العمولة */}
                  <FormField
                    control={commissionForm.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] sm:text-sm">
                          {commissionForm.watch("type") === 'percentage' ? 'النسبة المئوية' : 'المبلغ الثابت'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={commissionForm.watch("type") === 'percentage' ? "100" : undefined}
                            placeholder={commissionForm.watch("type") === 'percentage' ? "مثال: 2.5" : "مثال: 10"}
                            className="h-6 sm:h-10 text-[10px] sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-[9px] sm:text-sm text-muted-foreground">
                          {commissionForm.watch("type") === 'percentage' 
                            ? 'أدخل النسبة المئوية (من 0 إلى 100)'
                            : `أدخل المبلغ الثابت ${commissionForm.watch("currencyCode") ? `بالـ${getCurrencyName(commissionForm.watch("currencyCode"))}` : ''}`
                          }
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* أزرار التحكم */}
                  <div className="flex gap-1 sm:gap-2 pt-2 sm:pt-4">
                    <Button 
                      type="submit" 
                      disabled={addCommissionMutation.isPending}
                      className="flex-1 h-6 sm:h-10 text-[10px] sm:text-sm"
                    >
                      {addCommissionMutation.isPending 
                        ? "جاري الحفظ..." 
                        : editingCommission ? "تحديث العمولة" : "إضافة العمولة"
                      }
                    </Button>
                    
                    {editingCommission && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="h-6 sm:h-10 text-[10px] sm:text-sm"
                      >
                        إلغاء
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* عرض العمولات الحالية */}
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="text-sm sm:text-lg">العمولات المحددة</CardTitle>
              <CardDescription className="text-[10px] sm:text-sm">
                العمولات المحددة حاليًا لكل عملة
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {agentCommissionsLoading ? (
                <div className="text-center py-4 sm:py-8">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-1 sm:mb-2"></div>
                  <p className="text-[10px] sm:text-sm">جاري تحميل البيانات...</p>
                </div>
              ) : agentCommissions.length === 0 ? (
                <div className="text-center py-4 sm:py-8">
                  <Settings className="h-6 w-6 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-1 sm:mb-2" />
                  <p className="text-[10px] sm:text-sm text-muted-foreground">لم يتم تحديد أي عمولات بعد</p>
                  <p className="text-[9px] sm:text-sm text-muted-foreground">قم بإضافة إعدادات العمولة للعملات المختلفة</p>
                </div>
              ) : (
                <div className="space-y-1.5 sm:space-y-3">
                  {agentCommissions.map((commission: AgentCommissionSetting) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-1.5 sm:p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-[10px] sm:text-sm font-bold text-primary">
                            {getCurrencySymbol(commission.currencyCode)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-[10px] sm:text-sm">
                            {getCurrencyName(commission.currencyCode)}
                          </div>
                          <div className="text-[9px] sm:text-sm text-muted-foreground">
                            {commission.currencyCode}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Badge variant="secondary" className="text-[10px] sm:text-lg font-bold px-1 py-0.5 sm:px-2 sm:py-1">
                          {formatCommissionValue(commission)}
                        </Badge>
                        
                        <div className="flex gap-0.5 sm:gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCommission(commission)}
                            disabled={editingCommission?.id === commission.id}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                          >
                            <Edit3 className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCommission(commission.id)}
                            disabled={deleteCommissionMutation.isPending}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                          >
                            <Trash2 className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* إحصائيات العمولات */}
        {agentCommissions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6">
            {/* إحصائيات عامة */}
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-sm sm:text-lg">
                  <Calculator className="h-3 w-3 sm:h-5 sm:w-5" />
                  ملخص العمولات
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-2 gap-1.5 sm:gap-4">
                  <div className="text-center p-1.5 sm:p-4 bg-primary/5 rounded-lg">
                    <div className="text-sm sm:text-2xl font-bold text-primary">{agentCommissions.length}</div>
                    <div className="text-[9px] sm:text-sm text-muted-foreground">عملة محددة</div>
                  </div>
                  <div className="text-center p-1.5 sm:p-4 bg-green-50 rounded-lg">
                    <div className="text-sm sm:text-2xl font-bold text-green-600">
                      {agentCommissions.filter((c: AgentCommissionSetting) => c.type === 'percentage').length}
                    </div>
                    <div className="text-[9px] sm:text-sm text-muted-foreground">نسبة مئوية</div>
                  </div>
                  <div className="text-center p-1.5 sm:p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm sm:text-2xl font-bold text-blue-600">
                      {agentCommissions.filter((c: AgentCommissionSetting) => c.type === 'fixed').length}
                    </div>
                    <div className="text-[9px] sm:text-sm text-muted-foreground">مبلغ ثابت</div>
                  </div>
                  <div className="text-center p-1.5 sm:p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm sm:text-2xl font-bold text-purple-600">
                      {SUPPORTED_CURRENCIES.length - agentCommissions.length}
                    </div>
                    <div className="text-[9px] sm:text-sm text-muted-foreground">عملة متاحة</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إحصائيات أعلى وأقل عمولة */}
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-sm sm:text-lg">
                  <DollarSign className="h-3 w-3 sm:h-5 sm:w-5" />
                  أعلى وأقل عمولة
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                {commissionStatsLoading ? (
                  <div className="text-center py-2 sm:py-4">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-6 sm:w-6 border-b-2 border-primary mx-auto mb-1 sm:mb-2"></div>
                    <p className="text-[9px] sm:text-sm text-muted-foreground">جاري حساب الإحصائيات...</p>
                  </div>
                ) : commissionStats && commissionStats.total > 0 ? (
                  <div className="space-y-2 sm:space-y-4">
                    {/* أعلى عمولة */}
                    {commissionStats.highest && (
                      <div className="p-2 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <DollarSign className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-green-800 text-[10px] sm:text-sm">أعلى عمولة</div>
                              <div className="text-[9px] sm:text-sm text-green-600">
                                {getCurrencyName(commissionStats.highest.currencyCode)}
                              </div>
                              <div className="text-[8px] sm:text-xs text-green-500">
                                {commissionStats.highest.agentName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] sm:text-lg font-bold text-green-700">
                              {commissionStats.highest.type === 'percentage' 
                                ? `${commissionStats.highest.value}%` 
                                : `${commissionStats.highest.value} ${commissionStats.highest.currencyCode}`
                              }
                            </div>
                            <div className="text-[8px] sm:text-xs text-green-600">
                              {commissionStats.highest.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* أقل عمولة */}
                    {commissionStats.lowest && (
                      <div className="p-2 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <DollarSign className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-blue-800 text-[10px] sm:text-sm">أقل عمولة</div>
                              <div className="text-[9px] sm:text-sm text-blue-600">
                                {getCurrencyName(commissionStats.lowest.currencyCode)}
                              </div>
                              <div className="text-[8px] sm:text-xs text-blue-500">
                                {commissionStats.lowest.agentName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] sm:text-lg font-bold text-blue-700">
                              {commissionStats.lowest.type === 'percentage' 
                                ? `${commissionStats.lowest.value}%` 
                                : `${commissionStats.lowest.value} ${commissionStats.lowest.currencyCode}`
                              }
                            </div>
                            <div className="text-[8px] sm:text-xs text-blue-600">
                              {commissionStats.lowest.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 sm:py-4">
                    <DollarSign className="h-4 w-4 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-1 sm:mb-2" />
                    <p className="text-[9px] sm:text-sm text-muted-foreground">لا توجد عمولات لحساب الإحصائيات</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Guard>
  );
}