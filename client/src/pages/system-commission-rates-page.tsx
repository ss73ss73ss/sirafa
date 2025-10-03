import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { notifyCommissionUpdate } from "@/hooks/use-commission-updates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Percent, 
  ArrowLeft,
  Loader2
} from "lucide-react";

interface SystemCommissionRate {
  id: number;
  transferType: string;
  currency: string;
  commissionRate: string;
  perMilleRate?: string;
  fixedAmount?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommissionRateForm {
  transferType: string;
  currency: string;
  commissionRate: string;
  perMilleRate: string;
  fixedAmount: string;
}

export default function SystemCommissionRatesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<SystemCommissionRate | null>(null);
  const [formData, setFormData] = useState<CommissionRateForm>({
    transferType: "",
    currency: "",
    commissionRate: "",
    perMilleRate: "",
    fixedAmount: ""
  });

  // التحقق من صلاحية المدير
  useEffect(() => {
    if (user && user.type !== 'admin') {
      toast({
        variant: "destructive",
        title: "غير مصرح",
        description: "هذه الصفحة متاحة فقط للمدراء"
      });
      setLocation('/dashboard');
    }
  }, [user, setLocation, toast]);

  // جلب نسب العمولة
  const { data: commissionRates = [], isLoading, refetch } = useQuery<SystemCommissionRate[]>({
    queryKey: ['/api/admin/system-commission-rates'],
    queryFn: async () => {
      try {
        const res = await apiRequest('/api/admin/system-commission-rates', 'GET');
        const data = await res.json();
        console.log("🔍 بيانات نسب العمولة من الخادم:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("❌ خطأ في جلب نسب العمولة:", error);
        return [];
      }
    },
    enabled: !!user && user.type === 'admin',
  });

  // إضافة أو تحديث نسبة عمولة
  const saveRateMutation = useMutation({
    mutationFn: async (data: CommissionRateForm & { id?: number }) => {
      console.log("البيانات في النموذج:", data);
      
      // تحويل النسب من قيم العرض إلى قيم قاعدة البيانات
      const requestData = {
        transferType: data.transferType,
        currency: data.currency,
        commissionRate: data.commissionRate ? (parseFloat(data.commissionRate) / 100).toString() : "0",
        perMilleRate: data.perMilleRate ? (parseFloat(data.perMilleRate) / 1000).toString() : "",
        fixedAmount: data.fixedAmount ? parseFloat(data.fixedAmount).toString() : ""
      };
      
      console.log("البيانات المرسلة:", requestData);
      
      const url = data.id 
        ? `/api/admin/system-commission-rates/${data.id}`
        : '/api/admin/system-commission-rates';
      const method = data.id ? 'PUT' : 'POST';
      
      const res = await apiRequest(url, method, requestData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: editingRate ? "تم التحديث بنجاح" : "تم الإضافة بنجاح",
        description: editingRate ? "تم تحديث نسبة العمولة" : "تم إضافة نسبة عمولة جديدة"
      });
      setIsDialogOpen(false);
      setEditingRate(null);
      setFormData({ transferType: "", currency: "", commissionRate: "", perMilleRate: "", fixedAmount: "" });
      
      // تحديث البيانات فوراً
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-commission-rates'] });
      refetch();
    },
    onError: (error: any) => {
      console.error("خطأ في الحفظ:", error);
      let errorMessage = "حدث خطأ أثناء الحفظ";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        variant: "destructive",
        title: "خطأ",
        description: errorMessage
      });
    }
  });

  // حذف نسبة عمولة
  const deleteRateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/admin/system-commission-rates/${id}`, 'DELETE');
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف نسبة العمولة"
      });
      
      // تحديث البيانات فوراً بعد الحذف
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-commission-rates'] });
      refetch();
      
      // تحديث cache جميع الصفحات المتعلقة بالعمولات
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-commission-rates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commission-rates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inter-office-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      
      // إشعار لتحديث جميع الصفحات النشطة
      notifyCommissionUpdate();
      console.log("🔄 تم حذف نسبة العمولة - سيتم تطبيق التغييرات على النظام كله");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء الحذف"
      });
    }
  });

  const handleSave = () => {
    console.log("البيانات في النموذج:", formData);
    
    if (!formData.transferType || !formData.currency || (!formData.commissionRate && !formData.perMilleRate && !formData.fixedAmount)) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة (نسبة العمولة أو نسبة في الألف أو مبلغ ثابت)"
      });
      return;
    }

    if (formData.commissionRate) {
      const rate = parseFloat(formData.commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "نسبة العمولة يجب أن تكون رقماً بين 0 و 100"
        });
        return;
      }
    }

    if (formData.perMilleRate) {
      const rate = parseFloat(formData.perMilleRate);
      if (isNaN(rate) || rate < 0 || rate > 1000) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "نسبة في الألف يجب أن تكون رقماً بين 0 و 1000"
        });
        return;
      }
    }

    if (formData.fixedAmount) {
      const amount = parseFloat(formData.fixedAmount);
      if (isNaN(amount) || amount < 0) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "المبلغ الثابت يجب أن يكون رقماً موجباً"
        });
        return;
      }
    }

    saveRateMutation.mutate({
      ...formData,
      id: editingRate?.id
    });
  };

  const handleEdit = (rate: SystemCommissionRate) => {
    setEditingRate(rate);
    setFormData({
      transferType: rate.transferType,
      currency: rate.currency,
      commissionRate: (parseFloat(rate.commissionRate) * 100).toString(), // تحويل إلى نسبة مئوية للعرض
      perMilleRate: rate.perMilleRate ? (parseFloat(rate.perMilleRate) * 1000).toString() : "",
      fixedAmount: rate.fixedAmount ? parseFloat(rate.fixedAmount).toString() : ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف نسبة العمولة هذه؟")) {
      deleteRateMutation.mutate(id);
    }
  };

  const getTransferTypeLabel = (type: string) => {
    switch (type) {
      case 'internal': return 'التحويل الداخلي';
      case 'city': return 'الحوالات بين المدن';
      case 'inter-office': return 'التحويل بين المكاتب';
      case 'international': return 'الحوالات الدولية';
      case 'market': return 'عمولات السوق';
      default: return type;
    }
  };

  if (user?.type !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* العنوان الرئيسي */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للوحة التحكم
            </Button>
          </div>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">إدارة نسب العمولة</h1>
              <p className="text-slate-600 mt-1">تحديد نسب العمولة الافتراضية للنظام</p>
            </div>
          </div>
        </div>

        {/* بطاقة إدارة النسب */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Percent className="h-5 w-5 text-blue-600" />
                  نسب العمولة الحالية
                </CardTitle>
                <CardDescription className="mt-1">
                  إدارة نسب العمولة الافتراضية لجميع أنواع التحويلات
                </CardDescription>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingRate(null);
                      setFormData({ transferType: "", currency: "", commissionRate: "", perMilleRate: "", fixedAmount: "" });
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة نسبة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" dir="rtl" aria-describedby="dialog-description">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRate ? "تعديل نسبة العمولة" : "إضافة نسبة عمولة"}
                    </DialogTitle>
                    <DialogDescription id="dialog-description">
                      {editingRate ? "تحديث نسبة العمولة الموجودة" : "إضافة نسبة عمولة جديدة للنظام"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="transferType">نوع التحويل</Label>
                      <Select
                        value={formData.transferType}
                        onValueChange={(value) => setFormData({...formData, transferType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع التحويل" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">التحويل الداخلي</SelectItem>
                          <SelectItem value="city">الحوالات بين المدن</SelectItem>
                          <SelectItem value="inter-office">التحويل بين المكاتب</SelectItem>
                          <SelectItem value="international">الحوالات الدولية</SelectItem>
                          <SelectItem value="market">عمولات السوق</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">العملة</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({...formData, currency: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العملة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LYD">دينار ليبي (LYD)</SelectItem>
                          <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                          <SelectItem value="EUR">يورو (EUR)</SelectItem>
                          <SelectItem value="TRY">ليرة تركية (TRY)</SelectItem>
                          <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                          <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                          <SelectItem value="TND">دينار تونسي (TND)</SelectItem>
                          <SelectItem value="GBP">جنيه إسترليني (GBP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="commissionRate">نسبة العمولة (%)</Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                        placeholder="مثال: 1.5 للحصول على 1.5%"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="perMilleRate">نسبة في الألف (‰) - اختيارية</Label>
                      <Input
                        id="perMilleRate"
                        type="number"
                        step="0.001"
                        min="0"
                        max="1000"
                        value={formData.perMilleRate}
                        onChange={(e) => setFormData({...formData, perMilleRate: e.target.value})}
                        placeholder="مثال: 15 للحصول على 15‰"
                      />
                      <p className="text-xs text-gray-500">
                        إذا تم تحديدها، ستُحسب العمولة كنسبة في الألف بدلاً من النسبة المئوية
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fixedAmount">مبلغ ثابت - اختيارية</Label>
                      <Input
                        id="fixedAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.fixedAmount}
                        onChange={(e) => setFormData({...formData, fixedAmount: e.target.value})}
                        placeholder="مثال: 7 للحصول على 7 دولار ثابت"
                      />
                      <p className="text-xs text-gray-500">
                        إذا تم تحديدها، ستُحسب العمولة كمبلغ ثابت بدلاً من النسبة المئوية أو في الألف
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saveRateMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      {saveRateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        editingRate ? "تحديث" : "إضافة"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 text-center">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                  <p className="text-slate-600">جاري تحميل البيانات...</p>
                </div>
              </div>
            ) : !commissionRates || commissionRates.length === 0 ? (
              <div className="text-center py-12">
                <Percent className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-600 mb-2">لا توجد نسب عمولة</h3>
                <p className="text-slate-500 mb-4">لم يتم تحديد أي نسب عمولة للنظام بعد</p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة نسبة عمولة
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">نوع التحويل</TableHead>
                      <TableHead className="text-center">العملة</TableHead>
                      <TableHead className="text-center">نسبة العمولة</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-center">تاريخ الإنشاء</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">
                          {getTransferTypeLabel(rate.transferType)}
                        </TableCell>
                        <TableCell>{rate.currency}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {rate.fixedAmount && parseFloat(rate.fixedAmount) > 0 ? (
                              <>
                                <span className="text-green-600 font-mono">💰</span>
                                <span className="text-green-600">
                                  {parseFloat(rate.fixedAmount).toFixed(2)} {rate.currency} ثابت
                                </span>
                              </>
                            ) : rate.perMilleRate && parseFloat(rate.perMilleRate) > 0 ? (
                              <>
                                <span className="text-purple-600 font-mono">‰</span>
                                <span className="text-purple-600">
                                  {(parseFloat(rate.perMilleRate) * 1000).toFixed(1)}‰
                                </span>
                              </>
                            ) : (
                              <>
                                <Percent className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-600">
                                  {(parseFloat(rate.commissionRate) * 100).toFixed(2)}%
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rate.isActive ? "default" : "secondary"}>
                            {rate.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(rate.createdAt).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(rate)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(rate.id)}
                              disabled={deleteRateMutation.isPending}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
    </div>
  );
}