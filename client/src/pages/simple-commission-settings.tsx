import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  Plus,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface CommissionItem {
  currency: string;
  type: "PERCENT" | "FIXED";
  value: number;
}

export default function SimpleCommissionSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState("LYD");
  const [commissionType, setCommissionType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [commissionValue, setCommissionValue] = useState("");
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

  // إضافة عمولة جديدة
  const addCommission = () => {
    const value = parseFloat(commissionValue);
    
    if (!value || value < 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال قيمة صحيحة",
        variant: "destructive",
      });
      return;
    }

    if (commissionType === "PERCENT" && value > 100) {
      toast({
        title: "خطأ",
        description: "النسبة المئوية لا يمكن أن تتجاوز 100%",
        variant: "destructive",
      });
      return;
    }

    // التحقق من عدم تكرار العملة
    const existingIndex = commissions.findIndex(c => c.currency === selectedCurrency);
    
    if (existingIndex >= 0) {
      // تحديث العملة الموجودة
      const updated = [...commissions];
      updated[existingIndex] = {
        currency: selectedCurrency,
        type: commissionType,
        value: value
      };
      setCommissions(updated);
    } else {
      // إضافة عملة جديدة
      setCommissions([...commissions, {
        currency: selectedCurrency,
        type: commissionType,
        value: value
      }]);
    }

    setCommissionValue("");
    toast({
      title: "تم الإضافة",
      description: `تم إضافة عمولة ${selectedCurrency} بنجاح`,
    });
  };

  // حذف عمولة
  const removeCommission = (currency: string) => {
    setCommissions(commissions.filter(c => c.currency !== currency));
    toast({
      title: "تم الحذف",
      description: `تم حذف عمولة ${currency}`,
    });
  };

  // حساب العمولة
  const calculateCommission = (amount: number, type: "PERCENT" | "FIXED", value: number) => {
    if (type === "PERCENT") {
      return (amount * value) / 100;
    }
    return value;
  };

  // الحصول على معلومات العملة
  const getCurrencyInfo = (code: string) => {
    return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
  };

  // العملات المتاحة للإضافة
  const availableCurrencies = CURRENCIES.filter(
    currency => !commissions.some(c => c.currency === currency.code)
  );

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          نظام العمولة المبسط - معاينة فورية
        </h1>
        <p className="text-slate-600">
          أضف وأدر عمولات العملات مع معاينة فورية للحساب
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* إضافة عملة جديدة */}
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
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">العملة</label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نوع العمولة</label>
              <div className="flex gap-4">
                <Button 
                  variant={commissionType === "PERCENT" ? "default" : "outline"}
                  onClick={() => setCommissionType("PERCENT")}
                  className="flex items-center gap-2"
                >
                  <Percent className="h-4 w-4" />
                  نسبة مئوية
                </Button>
                <Button 
                  variant={commissionType === "FIXED" ? "default" : "outline"}
                  onClick={() => setCommissionType("FIXED")}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  مبلغ ثابت
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {commissionType === "PERCENT" ? "النسبة المئوية" : "المبلغ الثابت"}
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={commissionType === "PERCENT" ? "100" : undefined}
                placeholder={commissionType === "PERCENT" ? "1.5" : "10"}
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
              />
            </div>

            <Button 
              onClick={addCommission} 
              className="w-full"
              disabled={!commissionValue || availableCurrencies.length === 0}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة للقائمة
            </Button>
          </CardContent>
        </Card>

        {/* معاينة العمولات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              معاينة العمولات
            </CardTitle>
            <CardDescription>
              عرض فوري للعمولات مع حساب تجريبي
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* حقل المبلغ التجريبي */}
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <label className="block text-sm font-medium mb-2">المبلغ التجريبي:</label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={testAmount}
                onChange={(e) => setTestAmount(parseFloat(e.target.value) || 100)}
                className="max-w-xs"
              />
            </div>

            {commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.map((commission) => {
                  const currency = getCurrencyInfo(commission.currency);
                  const fee = calculateCommission(testAmount, commission.type, commission.value);
                  const net = testAmount - fee;
                  
                  return (
                    <div key={commission.currency} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg">{currency.symbol}</span>
                          <div>
                            <div className="font-medium">{currency.name}</div>
                            <Badge variant="outline" className="text-xs">{currency.code}</Badge>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeCommission(commission.currency)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">نوع العمولة:</span>
                          <div>
                            <Badge variant={commission.type === "PERCENT" ? "default" : "secondary"}>
                              {commission.type === "PERCENT" ? "نسبة مئوية" : "مبلغ ثابت"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">القيمة:</span>
                          <div className="font-bold">
                            {commission.value}{commission.type === "PERCENT" ? "%" : ` ${currency.symbol}`}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">العمولة:</span>
                          <div className="text-destructive font-medium">
                            {fee.toFixed(3)} {currency.symbol}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الصافي:</span>
                          <div className="text-primary font-medium">
                            {net.toFixed(3)} {currency.symbol}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  لم يتم إضافة أي عمولات بعد. أضف عملة من النموذج المجاور لبدء المعاينة.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ملخص سريع */}
      {commissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ملخص سريع للعمولات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {commissions.map((commission) => {
                const currency = getCurrencyInfo(commission.currency);
                const fee = calculateCommission(testAmount, commission.type, commission.value);
                
                return (
                  <div key={commission.currency} className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{currency.code}</div>
                    <div className="text-sm text-muted-foreground">
                      {commission.value}{commission.type === "PERCENT" ? "%" : ` ${currency.symbol}`}
                    </div>
                    <div className="text-sm font-medium text-primary">
                      العمولة: {fee.toFixed(3)} {currency.symbol}
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