import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageRestrictionGuard } from "@/components/PageRestrictionGuard";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { formatCurrencyNoCommas, formatNumber } from "@/lib/number-utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { useOrientationMode } from "@/hooks/useOrientationMode";

// القائمة الكاملة للعملات المدعومة
const supportedCurrencies = ["LYD", "USD", "EUR", "TRY", "AED", "EGP", "TND", "GBP"];

// رموز وأعلام العملات
const currencyInfo: Record<string, { name: string, flag: string }> = {
  "LYD": { name: "دينار ليبي", flag: "🇱🇾" },
  "USD": { name: "دولار أمريكي", flag: "🇺🇸" },
  "EUR": { name: "يورو", flag: "🇪🇺" },
  "TRY": { name: "ليرة تركية", flag: "🇹🇷" },
  "AED": { name: "درهم إماراتي", flag: "🇦🇪" },
  "EGP": { name: "جنيه مصري", flag: "🇪🇬" },
  "TND": { name: "دينار تونسي", flag: "🇹🇳" },
  "GBP": { name: "جنيه إسترليني", flag: "🇬🇧" },
};

export default function BalancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAndroidAppMode } = useOrientationMode();

  
  // استخدام بيانات المستخدم من useAuth  
  const currentUser = user;
  const [activeTab, setActiveTab] = useState("all");

  // جلب الأرصدة
  const {
    data: balanceData,
    isLoading,
    refetch: refetchBalances,
  } = useQuery<{ balances: Record<string, string | number> }>({
    queryKey: ["/api/balance"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Commission earnings query
  const { data: commissionData } = useQuery<{earnings: any[], totals: Record<string, number>}>({
    queryKey: ['/api/commission/earnings'],
  });

  // تحويل البيانات إلى تنسيق أفضل للعرض
  const balances = balanceData?.balances || {};
  
  // إنشاء قائمة بجميع العملات مع أرصدة صفرية للعملات غير الموجودة
  const allCurrencies = supportedCurrencies.map(currency => ({
    currency,
    amount: Number(balances[currency] || 0),
    info: currencyInfo[currency] || { name: currency, flag: "🏳️" }
  }));

  // ترتيب العملات: العملات ذات الرصيد أولاً ثم حسب الترتيب الأبجدي
  const sortedCurrencies = [...allCurrencies].sort((a, b) => {
    // العملات التي لها رصيد أولاً
    if (a.amount > 0 && b.amount === 0) return -1;
    if (a.amount === 0 && b.amount > 0) return 1;
    
    // ثم حسب قيمة الرصيد (تنازلياً)
    if (a.amount !== b.amount) return b.amount - a.amount;
    
    // ثم حسب الترتيب الأبجدي للعملة
    return a.currency.localeCompare(b.currency);
  });

  // تصفية العملات حسب التبويب النشط
  const filteredCurrencies = activeTab === "all" 
    ? sortedCurrencies 
    : activeTab === "with-balance" 
      ? sortedCurrencies.filter(c => c.amount > 0)
      : sortedCurrencies.filter(c => c.amount === 0);

  // حساب إجمالي قيمة الأرصدة بالدينار الليبي (تقريباً)
  // ملاحظة: هذا حساب تقريبي ويجب أن يتم تحديثه مع أسعار الصرف الحقيقية
  const exchangeRates: Record<string, number> = {
    "LYD": 1,
    "USD": 4.85, // 1 دولار = 4.85 دينار ليبي تقريباً
    "EUR": 5.25, // 1 يورو = 5.25 دينار ليبي تقريباً
    "GBP": 6.15, // 1 جنيه استرليني = 6.15 دينار ليبي تقريباً
    "TRY": 0.15, // 1 ليرة تركية = 0.15 دينار ليبي تقريباً
    "AED": 1.32, // 1 درهم إماراتي = 1.32 دينار ليبي تقريباً
    "EGP": 0.10, // 1 جنيه مصري = 0.10 دينار ليبي تقريباً
    "TND": 1.55, // 1 دينار تونسي = 1.55 دينار ليبي تقريباً
  };

  const totalBalanceLYD = sortedCurrencies.reduce((total, curr) => {
    return total + (curr.amount * (exchangeRates[curr.currency] || 1));
  }, 0);

  return (
    <PageRestrictionGuard pageKey="balance" pageName="صفحة الأرصدة">
      <div className="golden-page-bg container mx-auto p-4 rtl">
        <div className={`flex justify-between items-center ${isAndroidAppMode ? 'mb-3' : 'mb-6'}`}>
          {!isAndroidAppMode && <BackToDashboardButton />}
          <h1 className="text-xl font-bold text-center text-primary-foreground bg-primary rounded-lg px-3 py-2">
            الأرصدة <Wallet className={`inline-block ml-2 ${isAndroidAppMode ? 'h-5 w-5' : ''}`} />
          </h1>
          {!isAndroidAppMode && <div></div>}
        </div>
        <div className={`grid ${isAndroidAppMode ? 'grid-cols-2 gap-2 mb-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'}`}>
          <Card className={`rounded-lg border bg-card text-card-foreground shadow-sm ${isAndroidAppMode ? 'text-xs' : 'text-[16px]'} text-center pt-[0px] pb-[0px] pl-[0px] pr-[0px] ml-[0px] mr-[0px] mt-[0px] mb-[0px]`}>
            <CardHeader className={`${isAndroidAppMode ? 'p-2 pb-1' : 'pb-1'}`}>
              <CardTitle className={`tracking-tight text-[#0015ff] ${isAndroidAppMode ? 'text-sm' : 'text-[23px]'} font-bold text-center`}>إجمالي الرصيد</CardTitle>
              <CardDescription className={`${isAndroidAppMode ? 'text-xs' : 'text-sm'} text-[#990e0e] font-bold`}>بالدينار الليبي (تقريباً)</CardDescription>
            </CardHeader>
            <CardContent className={`${isAndroidAppMode ? 'text-sm p-2 pt-0' : 'text-2xl'} font-bold text-[#0f380a]`}>
              {formatCurrencyNoCommas(totalBalanceLYD, "LYD")}
            </CardContent>
          </Card>
          
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
            <CardHeader className={`${isAndroidAppMode ? 'p-2 pb-1' : 'pb-1'}`}>
              <CardTitle className={`tracking-tight text-[#0015ff] font-bold ${isAndroidAppMode ? 'text-sm' : 'text-[23px]'}`}>عدد العملات</CardTitle>
              <CardDescription className={`${isAndroidAppMode ? 'text-xs' : 'text-[13px]'} font-bold bg-[transparent] text-[#8f2e2e]`}>العملات التي تملك فيها رصيد</CardDescription>
            </CardHeader>
            <CardContent className={`${isAndroidAppMode ? 'text-sm p-2 pt-0' : 'text-2xl'} font-bold`}>
              {formatNumber(sortedCurrencies.filter(c => c.amount > 0).length)}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className={`${isAndroidAppMode ? 'p-2 pb-1' : 'pb-1'}`}>
              <CardTitle className={`tracking-tight ${isAndroidAppMode ? 'text-sm' : 'text-[23px]'} text-center font-bold text-[#0b0be6]`}>أعلى رصيد</CardTitle>
              <CardDescription className={`${isAndroidAppMode ? 'text-xs' : 'text-sm'} font-bold text-center text-[#ad2b3b]`}>العملة ذات أعلى رصيد</CardDescription>
            </CardHeader>
            <CardContent className={`${isAndroidAppMode ? 'p-2 pt-0 text-xs' : 'p-6 pt-0 text-2xl'} font-bold text-center`}>
              {sortedCurrencies.filter(c => c.amount > 0).length > 0 ? (
                <>
                  {sortedCurrencies[0].info.flag} {formatCurrencyNoCommas(sortedCurrencies[0].amount, sortedCurrencies[0].currency)}
                </>
              ) : (
                "لا يوجد"
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className={`${isAndroidAppMode ? 'p-2 pb-1' : 'pb-1'}`}>
              <CardTitle className={`tracking-tight font-bold text-[#020bfa] text-center ${isAndroidAppMode ? 'text-sm' : 'text-[23px]'}`}>نوع الحساب</CardTitle>
              <CardDescription className={`${isAndroidAppMode ? 'text-xs' : 'text-sm'} font-bold text-[#962929] text-center`}>مستوى حسابك الحالي</CardDescription>
            </CardHeader>
            <CardContent className={`${isAndroidAppMode ? 'p-2 pt-0' : 'p-6 pt-0'} text-center`}>
              {currentUser?.type === "office" ? (
                <Badge variant="default" className={`${isAndroidAppMode ? 'text-xs px-2 py-1' : 'text-lg px-3 py-1'}`}>
                  مكتب صرافة
                </Badge>
              ) : currentUser?.type === "agent" ? (
                (currentUser as any)?.hasExternalTransferAccess ? (
                  <Badge className={`bg-green-600 text-white hover:bg-green-700 ${isAndroidAppMode ? 'text-xs px-2 py-1' : 'text-lg px-3 py-1'}`}>
                    وكيل دولي
                  </Badge>
                ) : (currentUser as any)?.hasAgentAccess ? (
                  <Badge className={`bg-blue-600 text-white hover:bg-blue-700 ${isAndroidAppMode ? 'text-xs px-2 py-1' : 'text-lg px-3 py-1'}`}>
                    وكيل بين المدن
                  </Badge>
                ) : (
                  <Badge variant="outline" className={`${isAndroidAppMode ? 'text-xs px-2 py-1' : 'text-lg px-3 py-1'}`}>
                    وكيل (بانتظار الموافقة)
                  </Badge>
                )
              ) : currentUser?.type === "admin" ? (
                <Badge variant="destructive" className={`${isAndroidAppMode ? 'text-xs px-2 py-1' : 'text-lg px-3 py-1'}`}>
                  مدير النظام
                </Badge>
              ) : (
                <Badge variant="outline" className={`${isAndroidAppMode ? 'text-xs px-2 py-1' : 'text-lg px-3 py-1'}`}>
                  مستخدم عادي
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* بطاقة العمولات المكتسبة */}
          {commissionData && Object.keys(commissionData.totals).length > 0 && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardHeader className={`${isAndroidAppMode ? 'p-2 pb-1' : 'pb-1'}`}>
                <CardTitle className={`tracking-tight font-bold text-green-700 dark:text-green-400 text-center ${isAndroidAppMode ? 'text-sm' : 'text-[20px]'}`}>العمولات المكتسبة</CardTitle>
                <CardDescription className={`${isAndroidAppMode ? 'text-xs' : 'text-sm'} font-bold text-green-600 dark:text-green-500 text-center`}>من صفقات السوق</CardDescription>
              </CardHeader>
              <CardContent className={`${isAndroidAppMode ? 'p-2 pt-0' : 'p-6 pt-0'} text-center`}>
                <div className={`${isAndroidAppMode ? 'space-y-0' : 'space-y-1'}`}>
                  {Object.entries(commissionData.totals).map(([currency, total]) => (
                    <div key={currency} className={`${isAndroidAppMode ? 'text-xs' : 'text-lg'} font-bold text-green-800 dark:text-green-300`}>
                      {total.toFixed(2)} {currency}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {!isAndroidAppMode && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-1">
                <CardTitle className="text-lg">رقم الحساب</CardTitle>
                <CardDescription>استخدمه للتحويلات واستلام الحوالات</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="bg-blue-50 p-3 px-4 rounded-md">
                  <p className="text-2xl font-mono font-semibold text-blue-800">{currentUser?.accountNumber || "غير متوفر"}</p>
                </div>
                {currentUser?.accountNumber && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(currentUser.accountNumber || "");
                      toast({
                        variant: "default",
                        title: "تم النسخ",
                        description: "تم نسخ رقم الحساب إلى الحافظة"
                      });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard">
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    </svg>
                    نسخ الرقم
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mt-[0px] mb-[0px] ml-[0px] mr-[0px] pt-[0px] pb-[0px] pl-[11px] pr-[11px] bg-[000000]">
          <div className={`flex justify-between items-center ${isAndroidAppMode ? 'mb-2' : 'mb-4'}`}>
            <TabsList className="h-10 items-center justify-center rounded-md p-1 grid w-[400px] grid-cols-3 ml-[0px] mr-[0px] bg-[#09090b] text-[#ffffffff] pl-[10px] pr-[10px] mt-[9px] mb-[9px] pt-[5px] pb-[5px]">
              <TabsTrigger value="all" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-xs pt-[6px] pb-[6px] pl-[12px] pr-[12px] bg-[#16a34a] text-[#ffffff]">جميع العملات</TabsTrigger>
              <TabsTrigger value="with-balance" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-xs mt-[0px] mb-[0px] bg-[#16a34a] text-[#ffffff]">لها رصيد</TabsTrigger>
              <TabsTrigger value="without-balance" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-xs bg-[#16a34a] text-[#ffffffff]">بدون رصيد</TabsTrigger>
            </TabsList>
            
            <Button variant="outline" size={isAndroidAppMode ? "sm" : "sm"} onClick={() => refetchBalances()} className="bg-[#ffffff]">
              <RefreshCw className={`${isAndroidAppMode ? 'h-3 w-3 ml-1' : 'h-4 w-4 ml-2'}`} />
              {!isAndroidAppMode && 'تحديث'}
            </Button>
          </div>
          
          <TabsContent value={activeTab} className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-[#09090b]">
            {isLoading ? (
              <div className={`text-center ${isAndroidAppMode ? 'p-4' : 'p-8'}`}>
                <RefreshCw className={`${isAndroidAppMode ? 'h-6 w-6' : 'h-8 w-8'} animate-spin mx-auto mb-4`} />
                <p className={`${isAndroidAppMode ? 'text-sm' : ''}`}>جاري تحميل الأرصدة...</p>
              </div>
            ) : filteredCurrencies.length === 0 ? (
              <div className={`text-center ${isAndroidAppMode ? 'p-4' : 'p-8'} border rounded-lg`}>
                <p className={`text-muted-foreground ${isAndroidAppMode ? 'text-sm' : ''}`}>لا توجد عملات {activeTab === "with-balance" ? "لديك فيها رصيد" : "بدون رصيد"}</p>
              </div>
            ) : (
              <Card className={`${isAndroidAppMode ? 'text-xs' : ''}`}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 w-8 text-xs bg-[#09090b] text-[#ffffff]">#</TableHead>
                      <TableHead className="h-12 px-4 align-middle font-medium [&:has([role=checkbox])]:pr-0 text-xs bg-[#09090b] text-[#ffffff] text-center">العملة</TableHead>
                      {!isAndroidAppMode && <TableHead className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 bg-[#09090b] text-[#ffffff]">الرمز</TableHead>}
                      <TableHead className="h-12 px-4 align-middle font-medium [&:has([role=checkbox])]:pr-0 text-xs bg-[#09090b] text-[#ffffff] text-center">الرصيد</TableHead>
                      {!isAndroidAppMode && <TableHead className="h-12 px-4 align-middle font-medium [&:has([role=checkbox])]:pr-0 bg-[#09090b] text-[#ffffffff] text-center">القيمة التقريبية (LYD)</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCurrencies.map((item, index) => (
                      <TableRow key={item.currency}>
                        <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-xs py-2 bg-[#ffffff] text-[#16a34a]">{formatNumber(index + 1)}</TableCell>
                        <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0 flex items-center bg-[#ffffff] text-[#16a34a]">
                          <span className={`${isAndroidAppMode ? 'text-sm mr-1' : 'text-lg ml-2'}`}>{item.info.flag}</span>
                          <span className={`${isAndroidAppMode ? 'text-xs' : ''}`}>{isAndroidAppMode ? item.currency : item.info.name}</span>
                        </TableCell>
                        {!isAndroidAppMode && <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-[#16a34a]">{item.currency}</TableCell>}
                        <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium text-xs py-2 bg-[#ffffff] text-[#16a34a] text-center">
                          {formatCurrencyNoCommas(item.amount, item.currency)}
                        </TableCell>
                        {!isAndroidAppMode && (
                          <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-[#16a34a] text-center">
                            ≈ {formatCurrencyNoCommas(item.amount * (exchangeRates[item.currency] || 1), "LYD")}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        {!isAndroidAppMode && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>ملاحظة: أسعار التحويل التقريبية المستخدمة لإظهار القيمة بالدينار الليبي قد تختلف عن الأسعار الفعلية في السوق.</p>
          </div>
        )}
      </div>
    </PageRestrictionGuard>
  );
}