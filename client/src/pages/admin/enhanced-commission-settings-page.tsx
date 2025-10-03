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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Settings, 
  DollarSign, 
  Percent, 
  Info, 
  Save, 
  Plus,
  Edit3,
  Trash2,
  Calculator
} from "lucide-react";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";

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

const commissionSchema = z.object({
  currency: z.enum(["LYD", "USD", "EUR", "TRY", "AED", "EGP", "TND", "GBP"], {
    errorMap: () => ({ message: "يجب اختيار عملة صحيحة" })
  }),
  type: z.enum(["PERCENT", "FIXED"], {
    errorMap: () => ({ message: "نوع العمولة يجب أن يكون نسبة مئوية أو مبلغ ثابت" })
  }),
  value: z.number()
    .min(0, { message: "القيمة يجب أن تكون أكبر من أو تساوي صفر" })
    .max(100, { message: "النسبة المئوية يجب أن تكون أقل من أو تساوي 100" }),
}).refine((data) => {
  if (data.type === "PERCENT" && data.value > 100) {
    return false;
  }
  return true;
}, {
  message: "النسبة المئوية يجب أن تكون بين 0 و 100",
  path: ["value"]
});

type CommissionFormValues = z.infer<typeof commissionSchema>;

interface CommissionPreviewItem {
  currency: string;
  type: "PERCENT" | "FIXED";
  value: number;
}

export default function EnhancedCommissionSettingsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [commissionPreview, setCommissionPreview] = useState<CommissionPreviewItem[]>([]);
  const [testAmount, setTestAmount] = useState(100);

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

  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      currency: "LYD",
      type: "PERCENT",
      value: 1,
    },
  });

  // جلب الإعدادات الحالية
  const { data: currentSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/market/commission'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/market/commission');
        if (res.status === 404) {
          return { currencies: [] };
        }
        if (!res.ok) {
          throw new Error('فشل في جلب الإعدادات');
        }
        return await res.json();
      } catch (error) {
        console.error('خطأ في جلب إعدادات العمولة:', error);
        return { currencies: [] };
      }
    }
  });

  // تحديث المعاينة عند تحميل الإعدادات
  useEffect(() => {
    if (currentSettings?.currencies) {
      setCommissionPreview(currentSettings.currencies);
    }
  }, [currentSettings]);

  // حفظ الإعدادات
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: { currencies: CommissionPreviewItem[] }) => {
      const res = await apiRequest('PUT', '/api/market/commission', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'فشل في حفظ الإعدادات');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات العمولة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/market/commission'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحفظ",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // إضافة أو تحديث عملة في المعاينة
  const upsertCurrencyInPreview = (data: CommissionFormValues) => {
    setCommissionPreview(prev => {
      const existingIndex = prev.findIndex(item => item.currency === data.currency);
      
      if (existingIndex >= 0) {
        // تحديث العملة الموجودة
        const updated = [...prev];
        updated[existingIndex] = {
          currency: data.currency,
          type: data.type,
          value: data.value
        };
        return updated;
      } else {
        // إضافة عملة جديدة
        return [...prev, {
          currency: data.currency,
          type: data.type,
          value: data.value
        }];
      }
    });
  };

  // حذف عملة من المعاينة
  const removeCurrencyFromPreview = (currency: string) => {
    setCommissionPreview(prev => prev.filter(item => item.currency !== currency));
  };

  // حساب العمولة
  const calculateCommission = (amount: number, type: "PERCENT" | "FIXED", value: number) => {
    if (type === "PERCENT") {
      return Math.round((amount * (value / 100)) * 1000) / 1000;
    } else {
      return value;
    }
  };

  // الحصول على معلومات العملة
  const getCurrencyInfo = (code: string) => {
    return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
  };

  // العملات المتاحة للإضافة
  const availableCurrencies = CURRENCIES.filter(
    currency => !commissionPreview.some(item => item.currency === currency.code)
  );

  // إضافة عملة للمعاينة
  const onSubmit = (data: CommissionFormValues) => {
    upsertCurrencyInPreview(data);
    form.reset({
      currency: availableCurrencies.length > 1 ? availableCurrencies[1].code as any : "LYD",
      type: "PERCENT",
      value: 1
    });
  };

  // حفظ جميع الإعدادات
  const handleSaveAll = () => {
    if (commissionPreview.length === 0) {
      toast({
        title: "تحذير",
        description: "يجب إضافة عملة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }
    saveSettingsMutation.mutate({ currencies: commissionPreview });
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
        <h1 className="text-2xl font-bold text-slate-800">إعدادات عمولة السوق - معاينة فورية</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* إضافة/تحديث العملات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إضافة عملة جديدة
            </CardTitle>
            <CardDescription>
              أضف عملة مع نسبة العمولة الخاصة بها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          {availableCurrencies.map((currency) => (
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            <RadioGroupItem value="PERCENT" id="percent" />
                            <Label htmlFor="percent" className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              نسبة مئوية
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="FIXED" id="fixed" />
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

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("type") === "PERCENT" ? "النسبة المئوية" : "المبلغ الثابت"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={form.watch("type") === "PERCENT" ? "100" : undefined}
                          placeholder={form.watch("type") === "PERCENT" ? "1.5" : "10"}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch("type") === "PERCENT" 
                          ? "النسبة المئوية من قيمة الصفقة (0-100%)"
                          : "المبلغ الثابت الذي يُخصم من كل صفقة"
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={availableCurrencies.length === 0}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة للمعاينة
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* معاينة الإعدادات الحالية */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  معاينة الإعدادات الحالية
                </CardTitle>
                <CardDescription>
                  عرض فوري لجميع العملات والعمولات المحددة
                </CardDescription>
              </div>
              {commissionPreview.length > 0 && (
                <Button onClick={handleSaveAll} disabled={saveSettingsMutation.isPending}>
                  {saveSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      حفظ جميع الإعدادات
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* حقل المبلغ التجريبي */}
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <Label htmlFor="testAmount">المبلغ التجريبي للحساب:</Label>
              <Input
                id="testAmount"
                type="number"
                min="1"
                step="0.01"
                value={testAmount}
                onChange={(e) => setTestAmount(parseFloat(e.target.value) || 100)}
                className="mt-2 max-w-xs"
              />
              <p className="text-sm text-muted-foreground mt-1">
                سيتم حساب العمولة على هذا المبلغ لجميع العملات
              </p>
            </div>

            {commissionPreview.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العملة</TableHead>
                    <TableHead className="text-right">نوع العمولة</TableHead>
                    <TableHead className="text-right">القيمة</TableHead>
                    <TableHead className="text-right">العمولة المحسوبة</TableHead>
                    <TableHead className="text-right">الصافي</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionPreview.map((item) => {
                    const currency = getCurrencyInfo(item.currency);
                    const fee = calculateCommission(testAmount, item.type, item.value);
                    const net = testAmount - fee;
                    
                    return (
                      <TableRow key={item.currency}>
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
                          <Badge variant={item.type === "PERCENT" ? "default" : "secondary"}>
                            {item.type === "PERCENT" ? "نسبة مئوية" : "مبلغ ثابت"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {item.value}{item.type === "PERCENT" ? "%" : ` ${currency.symbol}`}
                        </TableCell>
                        <TableCell className="text-destructive font-medium">
                          {fee.toFixed(3)} {currency.symbol}
                        </TableCell>
                        <TableCell className="text-primary font-medium">
                          {net.toFixed(3)} {currency.symbol}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                form.setValue("currency", item.currency as any);
                                form.setValue("type", item.type);
                                form.setValue("value", item.value);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeCurrencyFromPreview(item.currency)}
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
                  لم يتم تحديد أي إعدادات عمولة بعد. أضف عملة من النموذج المجاور لبدء المعاينة.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* معلومات إضافية */}
      {commissionPreview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              ملخص المعاينة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {commissionPreview.map((item) => {
                const currency = getCurrencyInfo(item.currency);
                const fee = calculateCommission(testAmount, item.type, item.value);
                const net = testAmount - fee;
                
                return (
                  <div key={item.currency} className="p-3 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold">{currency.code}</div>
                      <div className="text-sm text-muted-foreground">
                        {testAmount} {currency.symbol} → عمولة {item.value}{item.type === "PERCENT" ? "%" : currency.symbol}
                      </div>
                      <div className="text-sm font-medium text-primary">
                        = {fee.toFixed(3)} {currency.symbol}
                      </div>
                      <div className="text-sm font-medium">
                        الصافي: {net.toFixed(3)} {currency.symbol}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}