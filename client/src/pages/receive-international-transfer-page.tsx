import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";
import { Loader2, Receipt, CheckCircle, ArrowDown } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ReceiveTransferResponse {
  message: string;
  transfer: {
    id: number;
    amount: string;
    currencyCode: string;
    senderName: string;
    receiverName: string;
    commissionAmount: string;
    netAmount: string;
    originCountry: string;
  };
}

export default function ReceiveInternationalTransferPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transferCode, setTransferCode] = useState("");
  const [receivedTransfer, setReceivedTransfer] = useState<ReceiveTransferResponse | null>(null);
  
  const isAdmin = user?.type === 'admin';
  const isAgent = user?.type === 'agent';
  
  console.log('User type:', user?.type, 'isAdmin:', isAdmin, 'isAgent:', isAgent);

  const receiveTransferMutation = useMutation({
    mutationFn: async (data: { transferCode: string }) => {
      const response = await apiRequest("/api/receive-international-transfer", "POST", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setReceivedTransfer(data);
      toast({
        title: "نجح الاستلام",
        description: "تم استلام الحوالة الدولية بنجاح",
        variant: "default",
      });
      // إعادة تعيين النموذج
      setTransferCode("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الاستلام",
        description: error.message || "حدث خطأ أثناء محاولة استلام الحوالة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferCode.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: isAdmin ? "يرجى إدخال رمز التحويل" : "يرجى إدخال رمز المستلم",
        variant: "destructive",
      });
      return;
    }

    if (isAgent && transferCode.length !== 6) {
      toast({
        title: "خطأ في رمز المستلم",
        description: "رمز المستلم يجب أن يكون 6 أرقام بالضبط",
        variant: "destructive",
      });
      return;
    }

    if (isAdmin && transferCode.length < 10) {
      toast({
        title: "خطأ في رمز التحويل",
        description: "رمز التحويل يبدو غير صحيح، يرجى التأكد من الرمز",
        variant: "destructive",
      });
      return;
    }

    receiveTransferMutation.mutate({ transferCode });
  };

  const formatNumber = (num: string) => {
    return parseFloat(num).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-right mb-2">استلام حوالة دولية</h1>
        <p className="text-muted-foreground text-right">
          {isAdmin ? 
            "أدخل رمز التحويل الكامل لاستلام الحوالة" : 
            "أدخل رمز المستلم (6 أرقام) لاستلام الحوالة"
          }
        </p>
        
        {/* زر الاستلام السريع للمدراء */}
        {user?.type === 'admin' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-800">استلام سريع للمدراء</h3>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                مدير
              </span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              استخدم الرمز التالي للاختبار السريع
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-blue-300 text-blue-800 hover:bg-blue-100"
              onClick={() => setTransferCode("IOT1751132752991564")}
            >
              استلام حوالة بالرمز: IOT1751132752991564
            </Button>
          </div>
        )}
        
        {/* زر الاستلام السريع للوكلاء */}
        {user?.type === 'agent' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-green-800">استلام سريع للوكلاء</h3>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                وكيل
              </span>
            </div>
            <p className="text-sm text-green-700 mb-3">
              استخدم رمز المستلم التالي للاختبار السريع
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-green-300 text-green-800 hover:bg-green-100"
              onClick={() => setTransferCode("797683")}
            >
              استلام حوالة برمز المستلم: 797683
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* نموذج الاستلام */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              استلام الحوالة
            </CardTitle>
            <CardDescription className="text-right">
              أدخل بيانات الحوالة المطلوب استلامها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transferCode" className="text-right block">
                  {isAdmin ? "رمز التحويل الكامل" : "رمز المستلم"}
                </Label>
                <Input
                  id="transferCode"
                  type="text"
                  value={transferCode}
                  onChange={(e) => setTransferCode(e.target.value)}
                  placeholder={isAdmin ? "IOT1751132752991564" : "797683"}
                  className="text-center font-mono text-lg"
                  maxLength={isAdmin ? undefined : 6}
                  required
                />
              </div>



              <Button
                type="submit"
                className="w-full"
                disabled={receiveTransferMutation.isPending}
              >
                {receiveTransferMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الاستلام...
                  </>
                ) : (
                  "استلام الحوالة"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* عرض تفاصيل الحوالة المستلمة */}
        {receivedTransfer && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                تم الاستلام بنجاح
              </CardTitle>
              <CardDescription className="text-right text-green-600">
                تفاصيل الحوالة المستلمة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-right">
                  <p className="font-semibold text-green-700">رقم الحوالة:</p>
                  <p className="font-mono">{receivedTransfer.transfer.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-700">المرسل:</p>
                  <p>{receivedTransfer.transfer.senderName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-700">المستلم:</p>
                  <p>{receivedTransfer.transfer.receiverName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-700">الدولة المرسلة:</p>
                  <p>{receivedTransfer.transfer.originCountry}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-700">المبلغ الإجمالي:</p>
                  <p className="font-mono text-lg">
                    {formatNumber(receivedTransfer.transfer.amount)} {receivedTransfer.transfer.currencyCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-700">العمولة:</p>
                  <p className="font-mono">
                    {formatNumber(receivedTransfer.transfer.commissionAmount)} {receivedTransfer.transfer.currencyCode}
                  </p>
                </div>
                <div className="text-right col-span-2">
                  <p className="font-semibold text-green-700 text-lg">المبلغ المستلم:</p>
                  <p className="font-mono text-2xl font-bold text-green-800">
                    {formatNumber(receivedTransfer.transfer.netAmount)} {receivedTransfer.transfer.currencyCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* معلومات مساعدة */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-right">معلومات مهمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-right text-sm text-muted-foreground">
              <p>• رمز التحويل مكون من 8 أرقام يحصل عليه المرسل عند إنشاء الحوالة</p>
              <p>• رمز المستلم مكون من 6 أرقام يتم إرساله للمستلم من قبل المرسل</p>
              <p>• يجب التأكد من صحة الرمزين قبل إجراء عملية الاستلام</p>
              <p>• بعد الاستلام الناجح، سيتم إضافة المبلغ إلى رصيد المكتب</p>
              <p>• العمولة محسوبة حسب إعدادات المكتب والنظام</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}