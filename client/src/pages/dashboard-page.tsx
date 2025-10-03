import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Guard } from "@/components/Guard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Sidebar from "@/components/dashboard/sidebar";
import Transactions from "@/components/dashboard/transactions";
import { useOrientationMode } from "@/hooks/useOrientationMode";
import { 
  ArrowRightLeft, 
  MessageSquare, 
  Activity, 
  Building2, 
  SendHorizontal,
  Users,
  FileText,
  TrendingUp
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrencyNoCommas } from "@/lib/number-utils";

interface Transaction {
  date: Date | null;
  id: number;
  type: string;
  currency: string;
  amount: string;
  userId: number;
  description: string | null;
  referenceNumber: string | null;
}

interface Balance {
  [currency: string]: string;
}

interface BalanceData {
  balances: Balance;
}

// Currency icons mapping with responsive sizes
const currencyIcons = (isAndroidAppMode: boolean): Record<string, JSX.Element> => ({
  LYD: <div className={`${isAndroidAppMode ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold`}>ل.د</div>,
  USD: <div className={`${isAndroidAppMode ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold`}>$</div>,
  EUR: <div className={`${isAndroidAppMode ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold`}>€</div>,
  TRY: <div className={`${isAndroidAppMode ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold`}>₺</div>,
  AED: <div className={`${isAndroidAppMode ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold`}>د.إ</div>,
  EGP: <div className={`${isAndroidAppMode ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold`}>ج.م</div>,
  TND: <div className={`${isAndroidAppMode ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold`}>د.ت</div>,
  GBP: <div className={`${isAndroidAppMode ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold`}>£</div>,
});

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <Guard page="dashboard">
      <DashboardContent />
    </Guard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [upgradeCheckDialog, setUpgradeCheckDialog] = useState(false);
  const { isAndroidAppMode } = useOrientationMode();

  // Update document title and check daily login
  useEffect(() => {
    document.title = "لوحة تحكم مكتب الصرافة - منصة الصرافة";
    
    // منح النقاط اليومية عند دخول لوحة التحكم
    const awardDailyPoints = async () => {
      try {
        await apiRequest("/api/rewards/daily-login", "POST");
      } catch (error) {
        // صامت - لا نريد إزعاج المستخدم بأخطاء النقاط
        console.log("Daily login bonus check completed");
      }
    };
    
    if (user) {
      awardDailyPoints();
    }
  }, [user]);

  // Fetch user transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Fetch user balances
  const { data: balances, isLoading: balancesLoading } = useQuery<BalanceData>({
    queryKey: ["/api/balance"],
  });

  // Fetch user upgrade request status
  const { data: upgradeRequest } = useQuery({
    queryKey: ["/api/user/upgrade-request"],
    retry: false,
  });

  const handleNavigation = (path: string) => {
    // التحقق من الوصول للتحويل الدولي
    if (path === "/inter-office-transfer") {
      // إذا كان المستخدم وكيل أو مدير، اسمح بالوصول مباشرة
      if (user?.type === 'agent' || user?.type === 'admin') {
        setLocation(path);
        return;
      }
      
      // إذا كان مستخدم عادي، تحقق من حالة الترقية
      if (!upgradeRequest) {
        // لم يطلب الترقية بعد
        setUpgradeCheckDialog(true);
        return;
      }
      
      if ((upgradeRequest as any)?.status === 'pending') {
        toast({
          title: "طلب قيد المراجعة",
          description: "طلب الترقية الخاص بك قيد المراجعة من قبل الإدارة. يرجى الانتظار.",
          variant: "default",
        });
        return;
      }
      
      if ((upgradeRequest as any)?.status === 'rejected') {
        toast({
          title: "طلب مرفوض",
          description: "تم رفض طلب الترقية الخاص بك. يمكنك تقديم طلب جديد.",
          variant: "destructive",
        });
        return;
      }
      
      if ((upgradeRequest as any)?.status === 'approved') {
        // مسموح بالوصول
        setLocation(path);
        return;
      }
    }
    
    // للمسارات الأخرى، انتقل مباشرة
    setLocation(path);
  };

  if (!user) return null;

  return (
    <div className={`golden-page-bg ${isAndroidAppMode ? 'flex flex-col' : 'flex'}`}>
      {/* Sidebar - only shown on desktop */}
      {!isAndroidAppMode && (
        <div className="w-64 elegant-sidebar p-4 text-center">
          <Sidebar />
        </div>
      )}
      {/* Mobile Sidebar - shown as overlay */}
      {isAndroidAppMode && <Sidebar />}
      <main className="flex-1 px-4 py-6" dir="rtl">
        <div className={`${isAndroidAppMode ? 'w-full' : 'max-w-7xl mx-auto'}`}>
          <div className="elegant-card p-6 md:p-8">
            <h3 className="elegant-text text-2xl mb-6 text-center">
              مرحباً، {user.fullName}! 🌟
            </h3>

            {/* إشعارات حالة طلب الترقية للمستخدمين العاديين */}
            {user.type === 'user' && upgradeRequest ? (
              <div className="mb-6">
                {(upgradeRequest as any)?.status === 'pending' && (
                  <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <AlertDescription className="font-medium">
                        <strong>طلب الترقية قيد المراجعة:</strong> طلب ترقية التحويل بين المدن الخاص بك قيد المراجعة من قبل الإدارة. سيتم الرد عليك خلال 24 ساعة.
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
                
                {(upgradeRequest as any)?.status === 'approved' && (
                  <Alert className="bg-green-50 border-green-200 text-green-800 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <AlertDescription className="font-medium">
                        <strong>تمت الموافقة على طلب الترقية:</strong> تم قبول طلب ترقية التحويل بين المدن. يمكنك الآن الوصول إلى خدمات التحويل المتقدمة.
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
                
                {(upgradeRequest as any)?.status === 'rejected' && (
                  <Alert className="bg-red-50 border-red-200 text-red-800 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <AlertDescription className="font-medium">
                        <strong>تم رفض طلب الترقية:</strong> لم تتم الموافقة على طلب ترقية التحويل بين المدن. يمكنك تقديم طلب جديد بعد مراجعة المتطلبات.
                        {(upgradeRequest as any)?.reviewNotes && (
                          <div className="mt-2 text-sm">
                            <strong>ملاحظات الإدارة:</strong> {(upgradeRequest as any).reviewNotes}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </div>
            ) : null}
            
            {/* Balance Section */}
            <div className={`${isAndroidAppMode ? 'mb-4' : 'mb-6'}`}>
              <h4 className="mb-3 text-[21px] font-extrabold text-[#ffffffff] bg-[#ffd900e6] text-center">رصيدي</h4>
              
              {balancesLoading ? (
                <div className={`grid ${isAndroidAppMode ? 'grid-cols-2 gap-1.5 justify-items-center' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center'}`}>
                  {[1, 2, 3, 4].map((_, index) => (
                    <Card key={index} className="rounded-lg border-0 shadow-sm overflow-hidden">
                      <CardContent className={`${isAndroidAppMode ? 'p-2' : 'p-4'}`}>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Skeleton className={`${isAndroidAppMode ? 'w-5 h-5' : 'w-8 h-8'} rounded-full`} />
                          <div className="space-y-1 flex-1">
                            <Skeleton className={`h-3 ${isAndroidAppMode ? 'w-8' : 'w-20'}`} />
                            <Skeleton className={`h-4 ${isAndroidAppMode ? 'w-12' : 'w-full'}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 justify-items-center ml-[0px] mr-[0px]">
                  {balances?.balances && Object.entries(balances.balances || {}).slice(0, isAndroidAppMode ? 4 : 8).map(([currency, amount]) => (
                    <Card key={currency} className="rounded-lg border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden active:scale-95">
                      <CardContent className={`${isAndroidAppMode ? 'p-2' : 'p-4'}`}>
                        <div className={`flex items-center ${isAndroidAppMode ? 'space-x-2 space-x-reverse' : 'space-x-3 space-x-reverse'}`}>
                          {currencyIcons(isAndroidAppMode)[currency] || (
                            <div className={`${isAndroidAppMode ? 'w-5 h-5 text-xs' : 'w-8 h-8 text-xs'} rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold`}>
                              {currency}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className={`${isAndroidAppMode ? 'text-xs' : 'text-xs'} text-neutral-500`}>{currency}</p>
                            <p className={`${isAndroidAppMode ? 'text-xs' : 'text-lg'} font-bold leading-tight`}>
                              {formatCurrencyNoCommas(Number(amount), currency)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="mb-4 pt-[0px] pb-[0px] ml-[0px] mr-[0px] pl-[0px] pr-[0px]">
              <h4 className="text-xl font-bold mb-3 text-center text-[#ffffffff]">خدمات مكتب الصرافة</h4>
              
              <div className="grid grid-cols-2 gap-2 justify-items-center ml-[0px] mr-[0px] bg-[ffd900e6]">
                <Card className="rounded-lg border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95" onClick={() => handleNavigation("/notifications")}>
                  <CardContent className={`${isAndroidAppMode ? 'p-2' : 'p-4 pt-6'}`}>
                    <div className={`flex ${isAndroidAppMode ? 'flex-row items-center space-x-2 space-x-reverse' : 'flex-col items-center text-center space-y-4'}`}>
                      <div className={`${isAndroidAppMode ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-orange-100 flex items-center justify-center shrink-0`}>
                        <Activity className={`${isAndroidAppMode ? 'h-3.5 w-3.5' : 'h-6 w-6'} text-orange-600`} />
                      </div>
                      <div className={`${isAndroidAppMode ? 'flex-1' : ''}`}>
                        <h5 className={`font-bold ${isAndroidAppMode ? 'text-xs' : ''}`}>الإشعارات</h5>
                        {!isAndroidAppMode && (
                          <p className="text-sm text-neutral-500">تابع آخر الإشعارات والتحديثات</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {!isAndroidAppMode && (
                    <CardFooter className="p-4 pt-0 justify-center">
                      <Button 
                        variant="ghost" 
                        className="text-orange-600 hover:text-orange-800"
                        onClick={() => handleNavigation("/notifications")}
                      >
                        عرض الإشعارات
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                
                <Card className="rounded-lg border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95" onClick={() => handleNavigation("/internal-transfer")}>
                  <CardContent className={`${isAndroidAppMode ? 'p-2' : 'p-4 pt-6'}`}>
                    <div className={`flex ${isAndroidAppMode ? 'flex-row items-center space-x-2 space-x-reverse' : 'flex-col items-center text-center space-y-4'}`}>
                      <div className={`${isAndroidAppMode ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-green-100 flex items-center justify-center shrink-0`}>
                        <SendHorizontal className={`${isAndroidAppMode ? 'h-3.5 w-3.5' : 'h-6 w-6'} text-green-600`} />
                      </div>
                      <div className={`${isAndroidAppMode ? 'flex-1' : ''}`}>
                        <h5 className={`font-bold ${isAndroidAppMode ? 'text-xs' : ''}`}>إرسال حوالة</h5>
                        {!isAndroidAppMode && (
                          <p className="text-sm text-neutral-500">قم بتحويل الأموال بسرعة وأمان</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {!isAndroidAppMode && (
                    <CardFooter className="p-4 pt-0 justify-center">
                      <Button 
                        variant="ghost" 
                        className="text-green-600 hover:text-green-800"
                        onClick={() => handleNavigation("/internal-transfer")}
                      >
                        إرسال حوالة
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                
                <Card className="rounded-lg border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95" onClick={() => handleNavigation("/market")}>
                  <CardContent className={`${isAndroidAppMode ? 'p-2' : 'p-4 pt-6'}`}>
                    <div className={`flex ${isAndroidAppMode ? 'flex-row items-center space-x-2 space-x-reverse' : 'flex-col items-center text-center space-y-4'}`}>
                      <div className={`${isAndroidAppMode ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-blue-100 flex items-center justify-center shrink-0`}>
                        <ArrowRightLeft className={`${isAndroidAppMode ? 'h-3.5 w-3.5' : 'h-6 w-6'} text-blue-600`} />
                      </div>
                      <div className={`${isAndroidAppMode ? 'flex-1' : ''}`}>
                        <h5 className={`font-bold ${isAndroidAppMode ? 'text-xs' : ''}`}>سوق العملات</h5>
                        {!isAndroidAppMode && (
                          <p className="text-sm text-neutral-500">تداول العملات واطلع على أسعار الصرف</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {!isAndroidAppMode && (
                    <CardFooter className="p-4 pt-0 justify-center">
                      <Button 
                        variant="ghost" 
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => handleNavigation("/market")}
                      >
                        الدخول إلى السوق
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                
                
                
                <Card className="rounded-lg border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95" onClick={() => handleNavigation("/chat")}>
                  <CardContent className={`${isAndroidAppMode ? 'p-2' : 'p-4 pt-6'}`}>
                    <div className={`flex ${isAndroidAppMode ? 'flex-row items-center space-x-2 space-x-reverse' : 'flex-col items-center text-center space-y-4'}`}>
                      <div className={`${isAndroidAppMode ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-red-100 flex items-center justify-center shrink-0`}>
                        <MessageSquare className={`${isAndroidAppMode ? 'h-3.5 w-3.5' : 'h-6 w-6'} text-red-600`} />
                      </div>
                      <div className={`${isAndroidAppMode ? 'flex-1' : ''}`}>
                        <h5 className={`font-bold ${isAndroidAppMode ? 'text-xs' : ''}`}>الدردشة العامة</h5>
                        {!isAndroidAppMode && (
                          <p className="text-sm text-neutral-500">تواصل مع فريق الدعم والمستخدمين</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {!isAndroidAppMode && (
                    <CardFooter className="p-4 pt-0 justify-center">
                      <Button 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleNavigation("/chat")}
                      >
                        بدء الدردشة
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                
                <Card className="rounded-lg border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95" onClick={() => handleNavigation("/group-chats")}>
                  <CardContent className="p-2 text-center pt-[8px] pb-[8px] mt-[0px] mb-[0px] ml-[0px] mr-[0px] pl-[24px] pr-[24px]">
                    <div className={`flex ${isAndroidAppMode ? 'flex-row items-center space-x-2 space-x-reverse' : 'flex-col items-center text-center space-y-4'}`}>
                      <div className={`${isAndroidAppMode ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-purple-100 flex items-center justify-center shrink-0`}>
                        <Users className={`${isAndroidAppMode ? 'h-3.5 w-3.5' : 'h-6 w-6'} text-purple-600`} />
                      </div>
                      <div className={`${isAndroidAppMode ? 'flex-1' : ''}`}>
                        <h5 className={`font-bold ${isAndroidAppMode ? 'text-xs' : ''}`}>محادثات المجموعات</h5>
                        {!isAndroidAppMode && (
                          <p className="text-sm text-neutral-500">إنشاء وإدارة مجموعات للمحادثة الجماعية</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {!isAndroidAppMode && (
                    <CardFooter className="p-4 pt-0 justify-center">
                      <Button 
                        variant="ghost" 
                        className="text-purple-600 hover:text-purple-800"
                        onClick={() => handleNavigation("/group-chats")}
                      >
                        إدارة المجموعات
                      </Button>
                    </CardFooter>
                  )}
                </Card>



                {/* إدارة الإيصالات الرقمية - للمسؤولين فقط */}
                {user?.email === 'ss73ss73ss73@gmail.com' && (
                  <Card className="rounded-lg border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95" onClick={() => handleNavigation("/receipts-management")}>
                    <CardContent className={`${isAndroidAppMode ? 'p-2' : 'p-4 pt-6'}`}>
                      <div className={`flex ${isAndroidAppMode ? 'flex-row items-center space-x-2 space-x-reverse' : 'flex-col items-center text-center space-y-4'}`}>
                        <div className={`${isAndroidAppMode ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-green-100 flex items-center justify-center shrink-0`}>
                          <FileText className={`${isAndroidAppMode ? 'h-3.5 w-3.5' : 'h-6 w-6'} text-green-600`} />
                        </div>
                        <div className={`${isAndroidAppMode ? 'flex-1' : ''}`}>
                          <h5 className={`font-bold ${isAndroidAppMode ? 'text-xs' : ''}`}>إدارة الإيصالات</h5>
                          {!isAndroidAppMode && (
                            <p className="text-sm text-neutral-500">إدارة نظام الإيصالات الرقمية والتوقيع الإلكتروني</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    {!isAndroidAppMode && (
                      <CardFooter className="p-4 pt-0 justify-center">
                        <Button 
                          variant="ghost" 
                          className="text-green-600 hover:text-green-800"
                          onClick={() => handleNavigation("/receipts-management")}
                        >
                          إدارة الإيصالات
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                )}
              </div>
            </div>
            
            {/* Recent Transactions */}
            <div className={`${isAndroidAppMode ? 'mb-4' : 'mb-6'}`}>
              <Transactions transactions={transactions || []} isLoading={transactionsLoading} />
            </div>
          </div>
        </div>
      </main>
      {/* نافذة تنبيه طلب الترقية */}
      <Dialog open={upgradeCheckDialog} onOpenChange={setUpgradeCheckDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center">يجب طلب الترقية أولاً</DialogTitle>
            <DialogDescription className="text-center">
              للوصول إلى خدمة التحويل الدولي، يجب عليك طلب ترقية الحساب أولاً.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => {
                setUpgradeCheckDialog(false);
                setLocation('/upgrade-request');
              }}
              className="w-full"
            >
              طلب الترقية الآن
            </Button>
            <Button
              variant="outline"
              onClick={() => setUpgradeCheckDialog(false)}
              className="w-full"
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}