import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle, Settings, Save, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FixedRewardSettings {
  lydReward: { amount: number };
  usdReward: { amount: number };
  marketReward: { amount: number };
  systemFeeRate: { rate: number }; // نسبة رسوم النظام على المكافآت (0.0 - 1.0)
}

export default function AdminFixedRewardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<FixedRewardSettings>({
    lydReward: { amount: 1.00 },
    usdReward: { amount: 0.50 },
    marketReward: { amount: 0.005 },
    systemFeeRate: { rate: 0.10 } // افتراضي 10%
  });

  // جلب الإعدادات الحالية
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['/api/admin/referral/fixed-rewards'],
    enabled: true
  });

  // تحديث الحالة المحلية عند تحميل البيانات
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  // طفرة تحديث الإعدادات
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: FixedRewardSettings) => {
      const response = await apiRequest('/api/admin/referral/fixed-rewards', 'PUT', newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referral/fixed-rewards'] });
      toast({
        title: "تم التحديث",
        description: "تم حفظ إعدادات المكافآت الثابتة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof FixedRewardSettings, value: number | { rate: number }) => {
    setSettings(prev => ({
      ...prev,
      [field]: typeof value === 'number' ? { amount: value } : value
    }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">إعدادات المكافآت الثابتة</h1>
          <p className="text-muted-foreground">
            إدارة مبالغ المكافآت الثابتة لنظام الإحالة
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>تنبيه مهم:</strong> هذه المبالغ تُخصم من عمولة النظام لكل عملية. 
          إذا كانت عمولة النظام أقل من المكافأة المحددة، سيتم صرف المتاح فقط.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* مكافأة تحويل الدينار الليبي */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              تحويل الدينار الليبي
            </CardTitle>
            <CardDescription>
              مكافأة ثابتة لكل تحويل داخلي بعملة LYD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lyd-reward">المبلغ (دينار ليبي)</Label>
              <Input
                id="lyd-reward"
                type="number"
                step="0.01"
                min="0"
                value={settings.lydReward.amount}
                onChange={(e) => handleInputChange('lydReward', parseFloat(e.target.value) || 0)}
                placeholder="1.00"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              المبلغ الافتراضي: 1.00 LYD
            </div>
          </CardContent>
        </Card>

        {/* مكافأة تحويل الدولار الأمريكي */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              تحويل الدولار الأمريكي
            </CardTitle>
            <CardDescription>
              مكافأة ثابتة لكل تحويل داخلي بعملة USD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usd-reward">المبلغ (دولار أمريكي)</Label>
              <Input
                id="usd-reward"
                type="number"
                step="0.01"
                min="0"
                value={settings.usdReward.amount}
                onChange={(e) => handleInputChange('usdReward', parseFloat(e.target.value) || 0)}
                placeholder="0.50"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              المبلغ الافتراضي: 0.50 USD
            </div>
          </CardContent>
        </Card>

        {/* مكافأة بيع السوق */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              بيع السوق
            </CardTitle>
            <CardDescription>
              مكافأة ثابتة لكل عملية بيع منفذة في سوق العملة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="market-reward">المبلغ (دولار أمريكي)</Label>
              <Input
                id="market-reward"
                type="number"
                step="0.001"
                min="0"
                value={settings.marketReward.amount}
                onChange={(e) => handleInputChange('marketReward', parseFloat(e.target.value) || 0)}
                placeholder="0.005"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              المبلغ الافتراضي: 0.005 USD (نصف سنت)
            </div>
          </CardContent>
        </Card>

        {/* إعداد نسبة رسوم النظام */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              رسوم النظام على المكافآت
            </CardTitle>
            <CardDescription>
              نسبة الرسوم التي يخصمها النظام من كل مكافأة إحالة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system-fee-rate">النسبة المئوية (%)</Label>
              <Input
                id="system-fee-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.systemFeeRate.rate * 100}
                onChange={(e) => handleInputChange('systemFeeRate', { rate: (parseFloat(e.target.value) || 0) / 100 })}
                placeholder="10.00"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              النسبة الافتراضية: 10% (يتم خصم 10% من كل مكافأة كرسوم نظام)
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          سيتم تطبيق هذه الإعدادات على جميع العمليات الجديدة فوراً
        </div>
        <Button 
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {updateSettingsMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>كيف يعمل النظام؟</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-green-600 mb-2">تحويل LYD</h4>
              <p className="text-sm text-muted-foreground">
                عند كل تحويل داخلي بالدينار الليبي، يحصل المُحيل على {settings.lydReward.amount} LYD
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-blue-600 mb-2">تحويل USD</h4>
              <p className="text-sm text-muted-foreground">
                عند كل تحويل داخلي بالدولار الأمريكي، يحصل المُحيل على {settings.usdReward.amount} USD
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-purple-600 mb-2">بيع السوق</h4>
              <p className="text-sm text-muted-foreground">
                عند كل عملية بيع منفذة في السوق، يحصل المُحيل على {settings.marketReward.amount} USD
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
              <h4 className="font-semibold text-orange-600 mb-2">رسوم النظام</h4>
              <p className="text-sm text-muted-foreground">
                يتم خصم {(settings.systemFeeRate.rate * 100).toFixed(1)}% من كل مكافأة إحالة كرسوم نظام
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}