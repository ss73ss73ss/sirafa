import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-ar";
import { Input } from "@/components/ui/input-ar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Percent, DollarSign, Users, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReferralSettings {
  referralCommissionPercentage: number;
  referralSignupBonus: number;
  maxReferralLevels: number;
  minReferralAmount: number;
}

export default function ReferralSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);

  // جلب إعدادات الإحالة الحالية
  const { data: settings, isLoading } = useQuery<ReferralSettings>({
    queryKey: ['/api/admin/referral/settings'],
  });

  // تحديث الإعدادات
  const updateSettings = useMutation({
    mutationFn: async (newSettings: ReferralSettings) => {
      console.log('محاولة حفظ الإعدادات:', newSettings);
      const response = await apiRequest('/api/admin/referral/settings', 'POST', newSettings);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('نجح الحفظ:', data);
      toast({
        title: "تم الحفظ",
        description: "تم تحديث إعدادات الإحالة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referral/settings'] });
    },
    onError: (error) => {
      console.error('خطأ في الحفظ:', error);
      toast({
        title: "خطأ",
        description: `فشل في حفظ الإعدادات: ${error.message || 'خطأ غير محدد'}`,
        variant: "destructive",
      });
    }
  });

  // توليد رموز الإحالة للمستخدمين الموجودين
  const generateReferralCodes = async () => {
    setIsGeneratingCodes(true);
    try {
      const response = await apiRequest('/api/admin/referral/generate-codes', 'POST', {});
      const result = await response.json();
      toast({
        title: "تم بنجاح",
        description: `تم توليد ${result.generated} رمز إحالة جديد`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في توليد رموز الإحالة",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newSettings: ReferralSettings = {
      referralCommissionPercentage: Number(formData.get('referralCommissionPercentage')),
      referralSignupBonus: Number(formData.get('referralSignupBonus')),
      maxReferralLevels: Number(formData.get('maxReferralLevels')),
      minReferralAmount: Number(formData.get('minReferralAmount')),
    };

    updateSettings.mutate(newSettings);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">إعدادات نظام الإحالة</h1>
          <p className="text-muted-foreground">إدارة نسب المكافآت وإعدادات الإحالة</p>
        </div>
      </div>

      {/* إعدادات النسب */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            إعدادات المكافآت
          </CardTitle>
          <CardDescription>
            تحديد نسب المكافآت والمبالغ في نظام الإحالة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="referralCommissionPercentage">نسبة مكافأة الإحالة (%)</Label>
                <Input
                  id="referralCommissionPercentage"
                  name="referralCommissionPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={settings?.referralCommissionPercentage || 5}
                  placeholder="5.00"
                />
                <p className="text-xs text-muted-foreground">
                  النسبة من عمولات النظام التي يحصل عليها المُحيل
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralSignupBonus">مكافأة التسجيل (دينار ليبي)</Label>
                <Input
                  id="referralSignupBonus"
                  name="referralSignupBonus"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={settings?.referralSignupBonus || 10}
                  placeholder="10.00"
                />
                <p className="text-xs text-muted-foreground">
                  المكافأة الثابتة عند تسجيل مستخدم جديد بالإحالة
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxReferralLevels">عدد مستويات الإحالة</Label>
                <Input
                  id="maxReferralLevels"
                  name="maxReferralLevels"
                  type="number"
                  min="1"
                  max="5"
                  defaultValue={settings?.maxReferralLevels || 2}
                  placeholder="2"
                />
                <p className="text-xs text-muted-foreground">
                  عدد المستويات في شجرة الإحالة (1 = مباشر فقط)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minReferralAmount">الحد الأدنى للمكافأة (دينار ليبي)</Label>
                <Input
                  id="minReferralAmount"
                  name="minReferralAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={settings?.minReferralAmount || 1}
                  placeholder="1.00"
                />
                <p className="text-xs text-muted-foreground">
                  الحد الأدنى للمعاملة لتحصيل مكافأة الإحالة
                </p>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={updateSettings.isPending}
              className="w-full md:w-auto"
            >
              {updateSettings.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* أدوات إدارية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            أدوات الإدارة
          </CardTitle>
          <CardDescription>
            أدوات لإدارة وصيانة نظام الإحالة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">توليد رموز الإحالة</h3>
              <p className="text-sm text-muted-foreground">
                إنشاء رموز إحالة للمستخدمين الذين لا يملكون رموز بعد
              </p>
            </div>
            <Button 
              onClick={generateReferralCodes}
              disabled={isGeneratingCodes}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingCodes ? 'animate-spin' : ''}`} />
              {isGeneratingCodes ? "جاري التوليد..." : "توليد الرموز"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>كيف يعمل نظام المكافآت؟</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <p className="font-medium">مكافأة التسجيل الثابتة</p>
              <p className="text-sm text-muted-foreground">يحصل المُحيل على مكافأة ثابتة فور تسجيل المستخدم المُحال</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <p className="font-medium">مكافآت العمولة النسبية</p>
              <p className="text-sm text-muted-foreground">يحصل المُحيل على نسبة من عمولات النظام عند استخدام المُحال للخدمات</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <p className="font-medium">مستويات الإحالة المتعددة</p>
              <p className="text-sm text-muted-foreground">يمكن الحصول على مكافآت من عدة مستويات في شجرة الإحالة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}