import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

// نموذج لتمثيل عمولة مكتب
interface OfficeCommission {
  city: string;
  commission_rate: string;
}

export default function SimpleCommissionsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<OfficeCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [city, setCity] = useState("");
  const [commissionRate, setCommissionRate] = useState("");

  // حماية الصفحة - يجب أن يكون المستخدم من نوع مكتب صرافة
  useEffect(() => {
    if (user && user.type !== 'agent') {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  // تحميل العمولات عند تحميل الصفحة
  useEffect(() => {
    loadCommissions();
  }, []);

  // جلب عمولات المكتب
  const loadCommissions = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("/api/agent/my-commissions", "GET");
      const data = await response.json();
      setCommissions(data.commissions);
    } catch (error) {
      console.error("خطأ في تحميل العمولات:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل بيانات العمولات"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة أو تحديث عمولة
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!city || !commissionRate) {
      toast({
        variant: "destructive",
        title: "خطأ في البيانات",
        description: "يرجى تحديد المدينة ونسبة العمولة"
      });
      return;
    }
    
    try {
      const rate = parseFloat(commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 10) {
        toast({
          variant: "destructive",
          title: "خطأ في البيانات",
          description: "يجب أن تكون نسبة العمولة رقماً موجباً بين 0 و 10"
        });
        return;
      }
      
      await apiRequest("/api/agent/set-commission", "POST", {
        city,
        commission_rate: rate
      });
      
      toast({
        title: "تم بنجاح",
        description: "تم حفظ نسبة العمولة للمدينة بنجاح"
      });
      
      // إعادة تحميل العمولات وتفريغ الحقول
      loadCommissions();
      setCity("");
      setCommissionRate("");
    } catch (error) {
      console.error("خطأ في حفظ العمولة:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ العمولة"
      });
    }
  };

  if (!user || user.type !== 'agent') {
    return null;
  }

  return (
    <div className="container mx-auto p-4 rtl">
      <h1 className="text-3xl font-bold mb-6">إدارة عمولات الحوالات حسب المدينة</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* نموذج إضافة/تعديل عمولة */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>إضافة عمولة جديدة</CardTitle>
            <CardDescription>
              حدد المدينة ونسبة العمولة التي تريد تطبيقها على الحوالات
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">المدينة</label>
                <Input
                  id="city"
                  placeholder="أدخل اسم المدينة"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="commission_rate" className="text-sm font-medium">نسبة العمولة (%)</label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="أدخل نسبة العمولة"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">يجب أن تكون القيمة بين 0 و 10</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
                حفظ العمولة
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* قائمة العمولات الحالية */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>العمولات الحالية</CardTitle>
            <CardDescription>
              قائمة بجميع العمولات المخصصة للمدن المختلفة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-4 text-center">جاري التحميل...</div>
            ) : commissions.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                لم يتم تحديد أي عمولات خاصة للمدن حتى الآن
              </div>
            ) : (
              <ul className="divide-y">
                {commissions.map((comm, index) => (
                  <li key={index} className="py-3 flex justify-between items-center">
                    <span className="font-medium">{comm.city}</span>
                    <span className="text-sm px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
                      {comm.commission_rate}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <Button
          onClick={() => setLocation('/dashboard')}
          variant="outline"
          className="bg-gray-100 hover:bg-gray-200 text-gray-800"
        >
          العودة للوحة التحكم
        </Button>
        
        <Button
          onClick={() => setLocation('/office-commission')}
          variant="outline"
          className="text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          الانتقال إلى الإدارة المتقدمة
        </Button>
      </div>
    </div>
  );
}