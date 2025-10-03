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
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Settings, DollarSign, Percent, Info, Save, History, ArrowLeft, Plus, Edit3, Trash2 } from "lucide-react";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CURRENCIES = [
  { code: "LYD", name: "الدينار الليبي", symbol: "د.ل" },
  { code: "USD", name: "الدولار الأمريكي", symbol: "$" },
  { code: "EUR", name: "اليورو", symbol: "€" },
  { code: "TRY", name: "الليرة التركية", symbol: "₺" },
  { code: "AED", name: "الدرهم الإماراتي", symbol: "د.إ" },
  { code: "EGP", name: "الجنيه المصري", symbol: "ج.م" },
  { code: "TND", name: "الدينار التونسي", symbol: "د.ت" },
  { code: "GBP", name: "الجنيه الإسترليني", symbol: "£" },
];

const settingsSchema = z.object({
  type: z.enum(["percentage", "fixed"], {
    errorMap: () => ({ message: "نوع العمولة يجب أن يكون نسبة مئوية أو ثابت" })
  }),
  value: z.string().or(z.number())
    .transform(val => Number(val))
    .refine(val => val > 0, { 
      message: "يجب أن تكون قيمة العمولة أكبر من صفر" 
    }),
  currency: z.enum(["LYD", "USD", "EUR", "TRY", "AED", "EGP", "TND", "GBP"], {
    errorMap: () => ({ message: "يجب اختيار عملة صحيحة" })
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface CommissionSetting {
  id: number;
  type: string;
  value: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: number | null;
}

export default function MultiCurrencyCommissionSettingsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // التحقق من صلاحية المدير
  useEffect(() => {
    if (user && user.type !== 'admin') {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة متاحة للمدراء فقط",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, setLocation, toast]);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      type: "percentage",
      value: 1,
      currency: "LYD",
    },
  });

  // جلب الإعدادات الحالية لجميع العملات
  const { data: allSettings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery<CommissionSetting[]>({
    queryKey: ['/api/admin/system-commission-rates'],
    queryFn: async () => {
      try {
        console.log('🔍 محاولة جلب جميع إعدادات العمولة...');
        const res = await apiRequest('/api/admin/system-commission-rates', 'GET');
        console.log('📊 حالة الاستجابة:', res.status);
        
        if (res.status === 404) {
          console.log('⚠️ لا توجد إعدادات في قاعدة البيانات');
          return []; // لا توجد إعدادات
        }
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error('❌ خطأ في API:', errorData);
          throw new Error(errorData.message || 'فشل في جلب الإعدادات');
        }
        
        const data = await res.json();
        console.log('✅ تم جلب إعدادات العمولة:', data);
        console.log('📝 عدد الإعدادات المجلبة:', data.length);
        
        return data;
      } catch (error) {
        console.error('🔥 خطأ في جلب إعدادات العمولة:', error);
        return [];
      }
    }
  });

  // إضافة أو تحديث إعداد عمولة
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormValues & { id?: number }) => {
      const endpoint = data.id ? `/api/admin/system-commission-rates/${data.id}` : '/api/admin/system-commission-rates';
      const method = data.id ? 'PUT' : 'POST';
      const res = await apiRequest(endpoint, method, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'فشل في تحديث الإعدادات');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث إعدادات عمولة سوق العملة",
      });
      setEditingId(null);
      setIsAddDialogOpen(false);
      form.reset();
      refetchSettings();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-commission-rates'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث الإعدادات",
        variant: "destructive",
      });
    },
  });

  // حذف إعداد عمولة
  const deleteSettingsMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/admin/system-commission-rates/${id}`, 'DELETE');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'فشل في حذف الإعدادات');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف إعدادات العمولة للعملة المحددة",
      });
      refetchSettings();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-commission-rates'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "فشل في حذف الإعدادات",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    updateSettingsMutation.mutate(editingId ? { ...data, id: editingId } : data);
  };

  const handleEdit = (setting: CommissionSetting) => {
    setEditingId(setting.id);
    form.reset({
      type: setting.type as "percentage" | "fixed",
      value: parseFloat(setting.value),
      currency: setting.currency as any,
    });
    setIsAddDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    form.reset({
      type: "percentage",
      value: 1,
      currency: "LYD",
    });
    setIsAddDialogOpen(true);
  };

  const getCurrencyInfo = (currencyCode: string) => {
    return CURRENCIES.find(c => c.code === currencyCode) || { code: currencyCode, name: currencyCode, symbol: currencyCode };
  };

  const getAvailableCurrencies = () => {
    const usedCurrencies = allSettings?.map(s => s.currency) || [];
    return CURRENCIES.filter(c => !usedCurrencies.includes(c.code) || (editingId && allSettings?.find(s => s.id === editingId)?.currency === c.code));
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
        <span className="mr-2">جاري تحميل الإعدادات...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* شريط التنقل */}
      <div className="flex items-center gap-4 mb-6">
        <BackToDashboardButton variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800" />
        <div className="h-6 w-px bg-slate-300" />
        <h1 className="text-2xl font-bold text-slate-800">إعدادات عمولة متعددة العملات</h1>
      </div>

      {/* عرض ملخص العملات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {CURRENCIES.map((currency) => {
          const setting = allSettings?.find(s => s.currency === currency.code);
          return (
            <Card key={currency.code} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currency.symbol}</span>
                    <div>
                      <CardTitle className="text-lg">{currency.code}</CardTitle>
                      <CardDescription className="text-sm">{currency.name}</CardDescription>
                    </div>
                  </div>
                  {setting ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      محدد
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      غير محدد
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {setting ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>النوع:</span>
                      <Badge variant={setting.type === "percentage" ? "default" : "secondary"}>
                        {setting.type === "percentage" ? "نسبة مئوية" : "مبلغ ثابت"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>القيمة:</span>
                      <span className="font-bold">
                        {setting.value}
                        {setting.type === "percentage" ? "%" : ` ${currency.symbol}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>آخر تحديث:</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(setting.updatedAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لم يتم تحديد إعدادات العمولة لهذه العملة
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6">
        {/* قائمة إعدادات العملات الحالية */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  إعدادات العمولة حسب العملة
                </CardTitle>
                <CardDescription>
                  إدارة إعدادات العمولة لكل عملة مدعومة
                </CardDescription>
              </div>
              <Button onClick={handleAdd} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة عملة جديدة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {allSettings && allSettings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العملة</TableHead>
                    <TableHead className="text-right">نوع العمولة</TableHead>
                    <TableHead className="text-right">القيمة</TableHead>
                    <TableHead className="text-right">مثال على 1000 وحدة</TableHead>
                    <TableHead className="text-right">آخر تحديث</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSettings.map((setting) => {
                    const currency = getCurrencyInfo(setting.currency);
                    const exampleAmount = setting.type === "percentage" 
                      ? (1000 * parseFloat(setting.value) / 100).toFixed(2)
                      : setting.value;
                    
                    return (
                      <TableRow key={setting.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg">{currency.symbol}</span>
                            <div>
                              <div className="font-medium">{currency.name}</div>
                              <Badge variant="outline" className="text-xs">{currency.code}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={setting.type === "percentage" ? "default" : "secondary"}>
                            {setting.type === "percentage" ? "نسبة مئوية" : "مبلغ ثابت"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {setting.value}{setting.type === "percentage" ? "%" : ` ${currency.symbol}`}
                        </TableCell>
                        <TableCell className="text-primary font-medium">
                          {exampleAmount} {currency.symbol}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(setting.updatedAt).toLocaleDateString('ar-EG')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(setting)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteSettingsMutation.mutate(setting.id)}
                              disabled={deleteSettingsMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  لا توجد إعدادات عمولة محددة بعد. انقر على "إضافة عملة جديدة" لبدء إضافة الإعدادات.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              ملاحظات مهمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p><strong>عملة واحدة فقط:</strong> يمكن تحديد إعدادات عمولة واحدة فقط لكل عملة.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p><strong>تطبيق فوري:</strong> الإعدادات الجديدة تُطبق فوراً على جميع الصفقات القادمة.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p><strong>حساب التجميع:</strong> العمولات تُحول تلقائياً إلى حساب تجميع العمولات حسب العملة.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p><strong>عمولة افتراضية:</strong> إذا لم تكن هناك إعدادات لعملة معينة، لن يتم خصم عمولة.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نافذة إضافة/تعديل إعدادات */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل إعدادات العمولة" : "إضافة إعدادات عمولة جديدة"}
            </DialogTitle>
            <DialogDescription>
              تحديد نوع وقيمة العمولة للعملة المحددة
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* نوع العمولة */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع العمولة</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="percentage" id="percentage" />
                          <Label htmlFor="percentage" className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            نسبة مئوية
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="fixed" id="fixed" />
                          <Label htmlFor="fixed" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
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
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch("type") === "percentage" ? "النسبة المئوية" : "المبلغ الثابت"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={form.watch("type") === "percentage" ? "1.5" : "10"}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {form.watch("type") === "percentage" 
                        ? "النسبة المئوية من قيمة الصفقة (مثال: 1.5 = 1.5%)"
                        : "المبلغ الثابت الذي يُخصم من كل صفقة"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* العملة */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العملة</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العملة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailableCurrencies().map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{currency.symbol}</span>
                              <span>{currency.name}</span>
                              <Badge variant="outline">{currency.code}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      العملة التي ستُحسب بها العمولة وتُحول إلى حساب التجميع
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      {editingId ? "تحديث" : "إضافة"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}