import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Percent, TrendingDown, Users, Save, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AgentCommission {
  id: number;
  agentId: number;
  agentName: string;
  commission: string;
  isPercentage: boolean;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface CommissionData {
  myCommission: AgentCommission | null;
  otherCommissions: AgentCommission[];
}

export default function InterOfficeCommissionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCommissionRate, setNewCommissionRate] = useState("");

  // جلب بيانات العمولات
  const { data: commissionsData, isLoading } = useQuery<CommissionData>({
    queryKey: ["/api/inter-office-commissions"],
    enabled: user?.type === "agent" || user?.type === "admin"
  });

  // تحديث العمولة
  const updateCommissionMutation = useMutation({
    mutationFn: async (data: { rate: number }) => {
      return await apiRequest("/api/inter-office-commissions", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث العمولة بنجاح",
        description: "تم حفظ نسبة العمولة الجديدة وستظهر للمستخدمين الآخرين",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inter-office-commissions"] });
      setNewCommissionRate("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث العمولة",
        description: error.message || "حدث خطأ أثناء حفظ العمولة",
        variant: "destructive",
      });
    },
  });

  // تعبئة الحقل بالعمولة الحالية عند تحميل البيانات
  useEffect(() => {
    if (commissionsData?.myCommission) {
      setNewCommissionRate(commissionsData.myCommission.commission);
    }
  }, [commissionsData]);

  // دالة حفظ العمولة الجديدة
  const handleSaveCommission = () => {
    const rate = parseFloat(newCommissionRate);
    
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "قيمة غير صحيحة",
        description: "يجب أن تكون نسبة العمولة بين 0% و 100%",
        variant: "destructive",
      });
      return;
    }

    updateCommissionMutation.mutate({ rate });
  };

  // دالة اختيار أقل عمولة
  const handleSelectLowestRate = () => {
    if (!commissionsData?.otherCommissions.length) {
      toast({
        title: "لا توجد عمولات أخرى",
        description: "لا يوجد مكاتب أخرى مسجلة لمقارنة العمولات",
        variant: "destructive",
      });
      return;
    }

    const lowestCommission = commissionsData.otherCommissions.reduce((min, current) => {
      const currentRate = parseFloat(current.commission);
      const minRate = parseFloat(min.commission);
      return currentRate < minRate ? current : min;
    });

    const lowestRate = parseFloat(lowestCommission.commission);
    const competitiveRate = Math.max(0, lowestRate - 0.1); // أقل بـ 0.1%
    
    setNewCommissionRate(competitiveRate.toFixed(1));
    
    toast({
      title: "تم اختيار نسبة تنافسية",
      description: `تم تعيين العمولة على ${competitiveRate.toFixed(1)}% (أقل من أدنى منافس بـ 0.1%)`,
    });
  };

  if (user?.type !== "agent" && user?.type !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">هذه الصفحة مخصصة لمكاتب الصرافة والمديرين فقط</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <Percent className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">إعدادات عمولات التحويلات بين المكاتب</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* قسم إدارة العمولة الخاصة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-green-600" />
              إدارة عمولتي
            </CardTitle>
            <CardDescription>
              قم بتحديد نسبة العمولة التي تريد تحصيلها من التحويلات بين المكاتب
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">جاري التحميل...</p>
              </div>
            ) : (
              <>
                {/* عرض العمولة الحالية */}
                {commissionsData?.myCommission && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">عمولتي الحالية</p>
                        <p className="text-2xl font-bold text-blue-800">
                          {commissionsData.myCommission.commission}%
                        </p>
                        <p className="text-xs text-blue-500">
                          آخر تحديث: {new Date(commissionsData.myCommission.updatedAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        نشط
                      </Badge>
                    </div>
                  </div>
                )}

                {/* حقل تحديث العمولة */}
                <div className="space-y-3">
                  <Label htmlFor="commission-rate">نسبة العمولة الجديدة (%)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="commission-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newCommissionRate}
                      onChange={(e) => setNewCommissionRate(e.target.value)}
                      placeholder="مثال: 1.5"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSaveCommission}
                      disabled={updateCommissionMutation.isPending || !newCommissionRate}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updateCommissionMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 ml-1" />
                          حفظ
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    أدخل نسبة بين 0% و 100%. مثال: 1.5 تعني 1.5%
                  </p>
                </div>

                {/* زر التحديد التلقائي */}
                <Button 
                  onClick={handleSelectLowestRate}
                  variant="outline"
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                  disabled={!commissionsData?.otherCommissions.length}
                >
                  <TrendingDown className="h-4 w-4 ml-1" />
                  اختر نسبة تنافسية (أقل من المنافسين)
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* قسم عمولات المكاتب الأخرى */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              عمولات المكاتب الأخرى
            </CardTitle>
            <CardDescription>
              قارن عمولتك مع عمولات المكاتب الأخرى لتحديد أسعار تنافسية
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">جاري التحميل...</p>
              </div>
            ) : commissionsData?.otherCommissions.length ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                  المكاتب المتاحة: {commissionsData.otherCommissions.length}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المكتب</TableHead>
                      <TableHead>نسبة العمولة</TableHead>
                      <TableHead>العملة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionsData.otherCommissions
                      .sort((a, b) => parseFloat(a.commission) - parseFloat(b.commission))
                      .map((commission, index) => (
                      <TableRow key={commission.id}>
                        <TableCell className="font-medium">
                          {commission.agentName}
                          {index === 0 && (
                            <Badge className="ml-2 bg-green-100 text-green-700 text-xs">
                              الأقل
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-lg">
                            {commission.commission}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {commission.currency}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* إحصائيات سريعة */}
                <div className="bg-gray-50 p-3 rounded-lg mt-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">أقل عمولة</p>
                      <p className="font-bold text-green-600">
                        {Math.min(...commissionsData.otherCommissions.map(c => parseFloat(c.commission))).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">أعلى عمولة</p>
                      <p className="font-bold text-red-600">
                        {Math.max(...commissionsData.otherCommissions.map(c => parseFloat(c.commission))).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد مكاتب أخرى مسجلة حالياً</p>
                <p className="text-xs text-gray-400 mt-1">
                  ستظهر عمولات المكاتب الأخرى هنا عند تسجيلها
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* نصائح وإرشادات */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">نصائح لتحسين المنافسة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700">استراتيجية التسعير:</h4>
              <ul className="space-y-1 text-blue-600">
                <li>• اختر عمولة أقل من المنافسين بـ 0.1-0.2%</li>
                <li>• تجنب الأسعار المنخفضة جداً التي تؤثر على الأرباح</li>
                <li>• راقب تغييرات أسعار المنافسين بانتظام</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-700">نصائح عامة:</h4>
              <ul className="space-y-1 text-purple-600">
                <li>• العمولة المنخفضة تجذب المزيد من العملاء</li>
                <li>• تحديث الأسعار في أوقات الذروة يحسن الأرباح</li>
                <li>• الحفاظ على التوازن بين التنافسية والربحية</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}