import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Guard } from "@/components/Guard";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  ArrowRightLeft, 
  BuildingIcon, 
  Globe, 
  DollarSign, 
  ClipboardList, 
  Settings, 
  Download,
  MapPin,
  Percent,
  Copy
} from "lucide-react";

export default function AgentDashboardPage() {
  return (
    <Guard page="agent_dashboard">
      <AgentDashboardContent />
    </Guard>
  );
}

function AgentDashboardContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // حماية الصفحة - يجب أن يكون المستخدم من نوع office أو agent
  useEffect(() => {
    if (user && user.type !== 'office' && user.type !== 'agent') {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  // استعلام عن أرصدة المستخدم
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
  } = useQuery<{ balances: Record<string, string | number> }>({
    queryKey: ["/api/balance"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // استعلام عن إحصائيات المكتب (يمكن إضافتها لاحقًا)
  const {
    data: statsData,
    isLoading: isStatsLoading,
  } = useQuery<any>({
    queryKey: ["/api/agent/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
    // في حالة عدم وجود API حاليًا، يمكن استخدام القيمة الافتراضية التالية:
    initialData: {
      totalTransfers: 0,
      pendingTransfers: 0,
      totalCommissions: 0,
      totalVolume: 0,
    }
  });

  if (!user || (user.type !== 'office' && user.type !== 'agent')) {
    return null; // لن يتم عرض الصفحة للمستخدمين العاديين
  }

  // حساب إجمالي الرصيد بالدينار الليبي (تقريباً)
  const exchangeRates: Record<string, number> = {
    "LYD": 1,
    "USD": 4.85, 
    "EUR": 5.25,
    "GBP": 6.15,
    "TRY": 0.15,
    "AED": 1.32,
    "EGP": 0.10,
    "TND": 1.55,
  };

  // حساب إجمالي الرصيد
  const balances = balanceData?.balances || {};
  const totalBalanceLYD = Object.entries(balances).reduce((total, [currency, amount]) => {
    return total + (Number(amount) * (exchangeRates[currency] || 1));
  }, 0);

  // الانتقال إلى صفحات العمليات المختلفة
  const navigateTo = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="container mx-auto p-4 rtl">
      <div className="mb-4">
        <BackToDashboardButton />
      </div>
      <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-l from-purple-600 to-indigo-600 text-transparent bg-clip-text">
        لوحة تحكم مكتب الصرافة <Building2 className="inline-block ml-2" />
      </h1>

      {/* بطاقة معلومات المكتب */}
      <Card className="mb-6 border-2 border-purple-100 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">مرحباً بك، {user.fullName}</CardTitle>
          <CardDescription>مكتب صرافة معتمد</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-full">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المدينة</p>
              <p className="font-medium">{user.city || "غير محدد"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-full">
              <Percent className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نسبة العمولة</p>
              <p className="font-medium">{user.commissionRate || 1}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-full">
              <Copy className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">رقم الحساب</p>
              <div className="flex items-center gap-2">
                <p className="font-mono font-medium">{user.accountNumber || "غير متوفر"}</p>
                {user.accountNumber && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => {
                      navigator.clipboard.writeText(user.accountNumber || "");
                      toast({
                        variant: "default",
                        title: "تم النسخ",
                        description: "تم نسخ رقم الحساب إلى الحافظة"
                      });
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-lg">إجمالي الرصيد</CardTitle>
            <CardDescription>بالدينار الليبي (تقريباً)</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCurrency(totalBalanceLYD, "LYD")}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-lg">الحوالات المنفذة</CardTitle>
            <CardDescription>إجمالي عدد الحوالات</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {statsData?.totalTransfers || 0}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-lg">العمولة المحصلة</CardTitle>
            <CardDescription>إجمالي العمولة</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCurrency(statsData?.totalCommissions || 0, "LYD")}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-lg">حجم التداول</CardTitle>
            <CardDescription>إجمالي المبالغ المتداولة</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCurrency(statsData?.totalVolume || 0, "LYD")}
          </CardContent>
        </Card>
      </div>

      {/* سقف التحويل الخارجي */}
      {(user as any)?.hasExternalTransferAccess && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              سقف التحويل الخارجي
            </CardTitle>
            <CardDescription>الحدود والعملات المسموحة للتحويلات الدولية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(user as any).extDailyLimit && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">الحد اليومي</div>
                  <div className="text-lg font-bold text-green-600">{(user as any).extDailyLimit}</div>
                </div>
              )}
              
              {(user as any).extMonthlyLimit && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">الحد الشهري</div>
                  <div className="text-lg font-bold text-green-600">{(user as any).extMonthlyLimit}</div>
                </div>
              )}
              
              {(user as any).extAllowedCurrencies && (user as any).extAllowedCurrencies.length > 0 && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">العملات المسموحة</div>
                  <div className="flex flex-wrap gap-1 justify-center mt-1">
                    {(user as any).extAllowedCurrencies.map((currency: string) => (
                      <Badge key={currency} variant="outline" className="text-xs">
                        {currency}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {(user as any).extAllowedCountries && (user as any).extAllowedCountries.length > 0 && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">الدول المسموحة</div>
                  <div className="flex flex-wrap gap-1 justify-center mt-1">
                    {(user as any).extAllowedCountries.slice(0, 6).map((country: string) => (
                      <Badge key={country} variant="secondary" className="text-xs">
                        {country}
                      </Badge>
                    ))}
                    {(user as any).extAllowedCountries.length > 6 && (
                      <Badge variant="secondary" className="text-xs">
                        +{(user as any).extAllowedCountries.length - 6} أخرى
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* العمليات المتاحة */}
      <h2 className="text-xl font-bold mb-4">العمليات المتاحة</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">


        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <span>سوق العملات</span>
            </CardTitle>
            <CardDescription>تداول العملات الأجنبية</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              بيع وشراء العملات الأجنبية بأسعار تنافسية من خلال سوق العملات.
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={() => navigateTo('/market')}
            >
              الذهاب إلى السوق
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-600" />
              <span>استلام حوالة</span>
            </CardTitle>
            <CardDescription>استلام الحوالات الواردة</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              استقبال الحوالات من عملاء آخرين عن طريق رمز الحوالة.
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={() => navigateTo('/city-transfers')}
            >
              استلام حوالة
            </Button>
          </CardContent>
        </Card>



        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <span>إعدادات المكتب</span>
            </CardTitle>
            <CardDescription>تعديل إعدادات المكتب</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              تعديل نسبة العمولة وإعدادات المكتب الأخرى.
            </p>
            <div className="space-y-2">
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={() => navigateTo('/simple-commissions')}
              >
                إدارة العمولات (واجهة مبسطة)
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigateTo('/office-commission')}
              >
                إدارة متقدمة للإعدادات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>جميع العمليات تتم وفقًا لقوانين وأنظمة مصرف ليبيا المركزي</p>
      </div>
    </div>
  );
}