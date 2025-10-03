import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";

// واجهة لتمثيل استجابة استلام الحوالة
interface ReceiveTransferResponse {
  message: string;
  amount: number;
  commission: number;
  total: number;
  currency: string;
}

export default function ReceiveCityTransferPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ReceiveTransferResponse | null>(null);
  
  // التحقق من أن المستخدم من نوع مكتب صرافة
  if (!user || user.type !== "agent") {
    setTimeout(() => setLocation("/dashboard"), 100);
    return null;
  }
  
  // استلام الحوالة باستخدام الكود
  const handleReceiveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال رمز الحوالة"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await apiRequest("/api/agent/receive-city-transfer", "POST", { code });
      const data = await response.json();
      
      setResult(data);
      setCode("");
      
      toast({
        title: "تم استلام الحوالة",
        description: "تم استلام الحوالة وإضافة المبلغ إلى رصيدك بنجاح",
      });
    } catch (error: any) {
      console.error("خطأ في استلام الحوالة:", error);
      let errorMessage = "حدث خطأ أثناء استلام الحوالة";
      
      if (error.response) {
        try {
          const errorData = await error.response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // لم نتمكن من قراءة رسالة الخطأ
        }
      }
      
      toast({
        variant: "destructive",
        title: "خطأ في استلام الحوالة",
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 p-4">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto" dir="rtl">
          <h1 className="text-3xl font-bold mb-6">استلام حوالة بين المدن</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* بطاقة إدخال كود الحوالة */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>استلام حوالة جديدة</CardTitle>
                <CardDescription>
                  أدخل كود الحوالة المكون من 6 أرقام لاستلام المبلغ
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleReceiveTransfer}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transfer-code">كود الحوالة</Label>
                    <Input
                      id="transfer-code"
                      placeholder="أدخل كود الحوالة المكون من 6 أرقام"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={isSubmitting}
                      className="text-lg font-medium"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري التحقق...
                      </>
                    ) : (
                      "استلام الحوالة"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
            
            {/* بطاقة نتيجة استلام الحوالة */}
            <Card className={`shadow-lg ${result ? 'border-green-500' : ''}`}>
              <CardHeader>
                <CardTitle>تفاصيل الحوالة</CardTitle>
                <CardDescription>
                  معلومات الحوالة التي تم استلامها
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg">
                      <div className="font-bold text-lg mb-2">{result.message}</div>
                      <p className="text-sm">تم إضافة المبلغ والعمولة إلى رصيدك</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">مبلغ الحوالة:</span>
                        <span className="text-lg font-bold">
                          {result.amount.toLocaleString()} {result.currency}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">عمولة المكتب:</span>
                        <span className="text-lg font-bold text-green-600">
                          + {result.commission.toLocaleString()} {result.currency}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-lg">المجموع:</span>
                        <span className="text-xl font-bold text-green-700">
                          {result.total.toLocaleString()} {result.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>قم بإدخال كود الحوالة لعرض التفاصيل هنا</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation('/city-transfers')}
                >
                  عرض سجل الحوالات
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-8">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg rtl">
              <h3 className="font-bold text-yellow-800 mb-2">ملاحظات هامة</h3>
              <ul className="space-y-2 text-sm text-yellow-700 list-disc list-inside">
                <li>تأكد من أن الحوالة موجهة إلى مكتبك قبل إدخال الكود</li>
                <li>الحوالات المستلمة لا يمكن استرجاعها</li>
                <li>سيتم إضافة المبلغ مع العمولة إلى رصيدك مباشرة بعد الاستلام</li>
                <li>في حالة وجود أي مشكلة في استلام الحوالة، يرجى التواصل مع الإدارة</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}