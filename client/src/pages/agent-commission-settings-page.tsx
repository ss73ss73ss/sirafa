import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Trash2, Settings, Percent, DollarSign, Edit3, Plus, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AgentCommission } from "@shared/schema";

// العملات المدعومة
const SUPPORTED_CURRENCIES = [
  { code: 'LYD', name: 'دينار ليبي', symbol: 'د.ل' },
  { code: 'USD', name: 'دولار أمريكي', symbol: '$' },
  { code: 'EUR', name: 'يورو', symbol: '€' },
  { code: 'TRY', name: 'ليرة تركية', symbol: '₺' },
  { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ' },
  { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م' },
  { code: 'TND', name: 'دينار تونسي', symbol: 'د.ت' },
  { code: 'GBP', name: 'جنيه إسترليني', symbol: '£' }
];

interface CommissionForm {
  currencyCode: string;
  type: 'percentage' | 'fixed';
  value: string;
}

export default function AgentCommissionSettingsPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<CommissionForm>({
    currencyCode: '',
    type: 'percentage',
    value: ''
  });
  const [editingCommission, setEditingCommission] = useState<AgentCommission | null>(null);

  // جلب العمولات الحالية
  const { data: commissions = [], isLoading } = useQuery<AgentCommission[]>({
    queryKey: ['/api/agent/commissions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/agent/commissions');
      return res.json();
    }
  });

  // حفظ أو تحديث العمولة
  const saveMutation = useMutation({
    mutationFn: async (data: CommissionForm) => {
      const res = await apiRequest('POST', '/api/agent/commissions', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent/commissions'] });
      setForm({ currencyCode: '', type: 'percentage', value: '' });
      setEditingCommission(null);
      toast({
        title: "تم الحفظ بنجاح",
        description: editingCommission ? "تم تحديث عمولة الاستلام بنجاح" : "تم إضافة عمولة الاستلام بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء حفظ العمولة",
        variant: "destructive",
      });
    },
  });

  // حذف العمولة
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/agent/commissions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent/commissions'] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف إعداد العمولة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف العمولة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.currencyCode || !form.value) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const value = parseFloat(form.value);
    if (isNaN(value) || value < 0) {
      toast({
        title: "قيمة غير صحيحة",
        description: "يرجى إدخال قيمة عمولة صحيحة",
        variant: "destructive",
      });
      return;
    }

    if (form.type === 'percentage' && value > 100) {
      toast({
        title: "نسبة عالية",
        description: "النسبة المئوية لا يمكن أن تتجاوز 100%",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(form);
  };

  const handleEdit = (commission: AgentCommission) => {
    setEditingCommission(commission);
    setForm({
      currencyCode: commission.currencyCode,
      type: commission.type,
      value: commission.value
    });
  };

  const handleCancelEdit = () => {
    setEditingCommission(null);
    setForm({ currencyCode: '', type: 'percentage', value: '' });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعداد؟')) {
      deleteMutation.mutate(id);
    }
  };

  const getCurrencyName = (code: string) => {
    return SUPPORTED_CURRENCIES.find(c => c.code === code)?.name || code;
  };

  const getCurrencySymbol = (code: string) => {
    return SUPPORTED_CURRENCIES.find(c => c.code === code)?.symbol || code;
  };

  const formatCommissionValue = (commission: AgentCommission) => {
    if (commission.type === 'percentage') {
      return `${commission.value}%`;
    } else {
      return `${commission.value} ${getCurrencySymbol(commission.currencyCode)}`;
    }
  };

  // العملات المتاحة للإضافة (التي لم يتم تعيين عمولة لها بعد)
  const availableCurrencies = SUPPORTED_CURRENCIES.filter(
    currency => !commissions.some(c => c.currencyCode === currency.code) || 
    (editingCommission && editingCommission.currencyCode === currency.code)
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-4">
        <BackToDashboardButton />
      </div>
      {/* العنوان والوصف */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          إعدادات عمولة المكتب
        </h1>
        <p className="text-lg text-muted-foreground">
          حدد نسبة العمولة التي يتقاضاها مكتبك من التحويلات الواردة لكل عملة
        </p>
      </div>

      {/* معلومات توضيحية */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          يمكنك تحديد نسبة عمولة مختلفة لكل عملة. العمولة تُضاف لرصيدك عند استلام الحوالات من مكاتب أخرى.
          يمكن استخدام نسبة مئوية أو مبلغ ثابت لكل عملة.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* نموذج إضافة/تعديل العمولة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingCommission ? (
                <>
                  <Edit3 className="h-5 w-5" />
                  تعديل إعدادات العمولة
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  إضافة إعدادات عمولة جديدة
                </>
              )}
            </CardTitle>
            <CardDescription>
              {editingCommission 
                ? "تعديل إعدادات العمولة للعملة المحددة"
                : "حدد العملة ونوع العمولة المطلوبة"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* اختيار العملة */}
              <div className="space-y-2">
                <Label htmlFor="currency">العملة</Label>
                <Select
                  value={form.currencyCode}
                  onValueChange={(value) => setForm(prev => ({ ...prev, currencyCode: value }))}
                  disabled={!!editingCommission}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العملة" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currency.symbol}</span>
                          <span>{currency.name}</span>
                          <span className="text-sm text-muted-foreground">({currency.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* نوع العمولة */}
              <div className="space-y-3">
                <Label>نوع العمولة</Label>
                <RadioGroup
                  value={form.type}
                  onValueChange={(value: 'percentage' | 'fixed') => setForm(prev => ({ ...prev, type: value }))}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="flex items-center gap-2 cursor-pointer">
                      <Percent className="h-4 w-4" />
                      نسبة مئوية (%)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="flex items-center gap-2 cursor-pointer">
                      <DollarSign className="h-4 w-4" />
                      مبلغ ثابت
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* قيمة العمولة */}
              <div className="space-y-2">
                <Label htmlFor="value">
                  {form.type === 'percentage' ? 'النسبة المئوية' : 'المبلغ الثابت'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  max={form.type === 'percentage' ? "100" : undefined}
                  placeholder={form.type === 'percentage' ? "مثال: 2.5" : "مثال: 10"}
                  value={form.value}
                  onChange={(e) => setForm(prev => ({ ...prev, value: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  {form.type === 'percentage' 
                    ? 'أدخل النسبة المئوية (من 0 إلى 100)'
                    : `أدخل المبلغ الثابت ${form.currencyCode ? `بالـ${getCurrencyName(form.currencyCode)}` : ''}`
                  }
                </p>
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className="flex-1"
                >
                  {saveMutation.isPending 
                    ? "جاري الحفظ..." 
                    : editingCommission ? "تحديث العمولة" : "إضافة العمولة"
                  }
                </Button>
                
                {editingCommission && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* عرض العمولات الحالية */}
        <Card>
          <CardHeader>
            <CardTitle>العمولات المحددة</CardTitle>
            <CardDescription>
              العمولات المحددة حاليًا لكل عملة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">لم يتم تحديد أي عمولات بعد</p>
                <p className="text-sm text-muted-foreground">قم بإضافة إعدادات العمولة للعملات المختلفة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {getCurrencySymbol(commission.currencyCode)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">
                          {getCurrencyName(commission.currencyCode)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {commission.currencyCode}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-lg font-bold">
                        {formatCommissionValue(commission)}
                      </Badge>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(commission)}
                          disabled={editingCommission?.id === commission.id}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(commission.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* إحصائيات سريعة */}
      {commissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ملخص العمولات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{commissions.length}</div>
                <div className="text-sm text-muted-foreground">عملة محددة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {commissions.filter(c => c.type === 'percentage').length}
                </div>
                <div className="text-sm text-muted-foreground">نسبة مئوية</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {commissions.filter(c => c.type === 'fixed').length}
                </div>
                <div className="text-sm text-muted-foreground">مبلغ ثابت</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {SUPPORTED_CURRENCIES.length - commissions.length}
                </div>
                <div className="text-sm text-muted-foreground">عملة متاحة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}