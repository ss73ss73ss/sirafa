import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-ar";
import { Input } from "@/components/ui/input-ar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Copy, 
  Share, 
  CheckCircle, 
  DollarSign, 
  Calendar,
  UserPlus,
  Gift,
  TrendingUp,
  Award,
  ArrowRight
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Guard } from "@/components/Guard";

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalRewards: number;
  pendingRewards: number;
  monthlyReferrals: number;
}

interface ReferralReward {
  id: number;
  amount: number;
  currency: string;
  fromUser: string;
  rewardType: string;
  createdAt: string;
}

interface ReferralBalance {
  currency: string;
  amount: string;
}



interface Referral {
  id: number;
  referredUserName: string;
  referredUserEmail: string;
  joinedAt: string;
  status: string;
}

export default function ReferralsPage() {
  return (
    <Guard page="referrals">
      <ReferralsContent />
    </Guard>
  );
}

function ReferralsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "rewards" | "referrals">("overview");

  // جلب إحصائيات الإحالة
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<ReferralStats>({
    queryKey: ['/api/referral/stats'],
    enabled: !!user,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  // جلب قائمة المكافآت
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<ReferralReward[]>({
    queryKey: ['/api/referral/rewards'],
    enabled: !!user && activeTab === 'rewards',
  });

  // جلب أرصدة مكافآت الإحالة
  const { data: referralBalances = [], isLoading: balancesLoading, refetch: refetchBalances } = useQuery<ReferralBalance[]>({
    queryKey: ['/api/referral/balances'],
    enabled: !!user && activeTab === 'rewards',
  });

  // جلب قائمة الإحالات
  const { data: referrals = [], isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ['/api/referral/my-referrals'],
    enabled: !!user && activeTab === 'referrals',
  });



  // Debug info - تم إزالة logs لتنظيف المكونة

  // نسخ رمز الإحالة
  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      toast({
        title: "تم نسخ الرمز",
        description: "تم نسخ رمز الإحالة إلى الحافظة",
      });
    }
  };

  // نسخ رابط الإحالة
  const copyReferralLink = () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/auth?ref=${stats.referralCode}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط الإحالة إلى الحافظة",
      });
    }
  };

  // مشاركة رابط الإحالة
  const shareReferralLink = async () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/auth?ref=${stats.referralCode}`;
      const text = `انضم إلى صرافة الخليج واحصل على مكافآت مميزة! استخدم رمز الإحالة: ${stats.referralCode}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'دعوة للانضمام إلى صرافة الخليج',
            text: text,
            url: link,
          });
        } catch (error) {
          // Fall back to copying
          copyReferralLink();
        }
      } else {
        copyReferralLink();
      }
    }
  };

  // سحب رصيد مكافآت إلى الرصيد الرئيسي
  const withdrawMutation = useMutation({
    mutationFn: async ({ currency, amount }: { currency: string; amount: number }) => {
      const res = await apiRequest('/api/referral/transfer-balance', 'POST', { currency, amount });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم السحب بنجاح",
        description: "تم إضافة المبلغ لرصيدك الرئيسي"
      });
      refetchBalances();
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ في السحب",
        description: error.message || "حدث خطأ أثناء سحب الرصيد"
      });
    }
  });

  const handleWithdraw = (currency: string, amount: string) => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      toast({
        variant: "destructive",
        title: "مبلغ غير صالح",
        description: "لا يوجد رصيد للسحب"
      });
      return;
    }
    withdrawMutation.mutate({ currency, amount: numAmount });
  };

  // تحديث عنوان الصفحة
  useEffect(() => {
    document.title = "إدارة الإحالات - صرافة الخليج";
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">يجب تسجيل الدخول للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-6">
      {/* زر العودة */}
      <div className="mb-4">
        <BackToDashboardButton />
      </div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">نظام الإحالة</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            احصل على مكافآت عند دعوة أصدقائك للانضمام
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="w-full">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-full sm:w-fit">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("overview")}
            className="flex-1 sm:flex-none px-2 sm:px-4 text-xs sm:text-sm"
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            نظرة عامة
          </Button>
          <Button
            variant={activeTab === "rewards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("rewards")}
            className="flex-1 sm:flex-none px-2 sm:px-4 text-xs sm:text-sm"
          >
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            المكافآت
          </Button>
          <Button
            variant={activeTab === "referrals" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("referrals")}
            className="flex-1 sm:flex-none px-2 sm:px-4 text-xs sm:text-sm"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            إحالاتي
          </Button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-3 sm:space-y-6">
          {/* Referral Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                رمز الإحالة الخاص بك
              </CardTitle>
              <CardDescription>
                شارك هذا الرمز مع أصدقائك للحصول على مكافآت
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              ) : statsError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">خطأ في تحميل البيانات</p>
                  <p className="text-sm text-muted-foreground">جاري المحاولة مرة أخرى...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      value={stats?.referralCode || "لم يتم العثور على الرمز"}
                      readOnly
                      className="font-mono text-center text-sm sm:text-lg bg-primary/5 border-primary/20"
                      placeholder="رمز الإحالة..."
                    />
                    <Button onClick={copyReferralCode} size="sm" variant="outline" className="shrink-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={copyReferralLink} variant="outline" className="flex-1" size="sm">
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                      <span className="text-xs sm:text-sm">نسخ الرابط</span>
                    </Button>
                    <Button onClick={shareReferralLink} className="flex-1" size="sm">
                      <Share className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                      <span className="text-xs sm:text-sm">مشاركة</span>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">إجمالي الإحالات</p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {statsLoading ? "..." : stats?.totalReferrals || 0}
                    </p>
                  </div>
                  <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">إجمالي المكافآت</p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {statsLoading ? "..." : `${stats?.totalRewards || 0} LYD`}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">إحالات هذا الشهر</p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {statsLoading ? "..." : stats?.monthlyReferrals || 0}
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">مكافآت معلقة</p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {statsLoading ? "..." : `${stats?.pendingRewards || 0} LYD`}
                    </p>
                  </div>
                  <Award className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === "rewards" && (
        <div className="space-y-3 sm:space-y-6">
          {/* الأرصدة المتاحة للسحب */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                أرصدة المكافآت المتاحة
              </CardTitle>
              <CardDescription>
                الأرصدة المكتسبة من مكافآت الإحالات
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balancesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : referralBalances.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد أرصدة مكافآت</p>
                  <p className="text-sm text-muted-foreground">
                    ستظهر أرصدة مكافآتك هنا بعد حصولك على مكافآت من الإحالات
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {referralBalances.map((balance) => (
                    <Card key={balance.currency} className="relative">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-base sm:text-xl font-bold text-green-600">
                              {parseFloat(balance.amount).toFixed(2)}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{balance.currency}</p>
                          </div>
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleWithdraw(balance.currency, balance.amount)}
                          disabled={parseFloat(balance.amount) <= 0 || withdrawMutation.isPending}
                          className="w-full text-xs sm:text-sm"
                          size="sm"
                        >
                          {withdrawMutation.isPending ? "جاري السحب..." : "سحب إلى الرصيد الرئيسي"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* سجل المكافآت */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                سجل المكافآت
              </CardTitle>
              <CardDescription>
                جميع المكافآت التي حصلت عليها من الإحالات
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rewardsLoading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              ) : rewards.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد مكافآت بعد</p>
                  <p className="text-sm text-muted-foreground">
                    ادع أصدقائك للانضمام للحصول على مكافآت
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>من المستخدم</TableHead>
                      <TableHead>نوع المكافأة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewards.map((reward) => (
                      <TableRow key={reward.id}>
                        <TableCell className="font-medium">
                          <span className="text-green-600">
                            +{parseFloat(reward.amount.toString()).toFixed(2)} {reward.currency}
                          </span>
                        </TableCell>
                        <TableCell>{reward.fromUser}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {reward.rewardType === 'direct' ? 'إحالة مباشرة' : 'إحالة فرعية'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(reward.createdAt).toLocaleDateString('ar')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}


      {/* Referrals Tab */}
      {activeTab === "referrals" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              الأشخاص الذين أحلتهم
            </CardTitle>
            <CardDescription>
              قائمة بجميع الأشخاص الذين انضموا باستخدام رمز الإحالة الخاص بك
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referralsLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد إحالات بعد</p>
                <p className="text-sm text-muted-foreground">
                  شارك رمز الإحالة مع أصدقائك ليظهروا هنا
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>تاريخ الانضمام</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">
                        {referral.referredUserName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {referral.referredUserEmail}
                      </TableCell>
                      <TableCell>
                        {new Date(referral.joinedAt).toLocaleDateString('ar')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={referral.status === 'active' ? 'default' : 'secondary'}>
                          <CheckCircle className="w-3 h-3 ml-1" />
                          {referral.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}