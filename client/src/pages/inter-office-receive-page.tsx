import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Wallet, User, Phone, Building2, DollarSign, ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Guard } from "@/components/Guard";

const receiveSchema = z.object({
  transferCode: z.string().min(6, "رمز الاستلام يجب أن يكون 6 أرقام على الأقل")
});

type ReceiveData = z.infer<typeof receiveSchema>;

interface TransferDetails {
  id: number;
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  amountOriginal: number;
  systemCommission: number;
  recipientCommission: number;
  recipientCredit: number;
  totalDeduction: number;
  currency: string;
  status: string;
  transferCode: string;
  receiverCode: string;
  note?: string;
  country: string;
  city: string;
  createdAt: string;
}

export default function InterOfficeReceivePage() {
  return (
    <Guard page="inter_office_receive">
      <InterOfficeReceiveContent />
    </Guard>
  );
}

function InterOfficeReceiveContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferDetails, setTransferDetails] = useState<TransferDetails | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const form = useForm<ReceiveData>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      transferCode: ""
    }
  });

  const onSearch = async (data: ReceiveData) => {
    setIsLoading(true);
    setTransferDetails(null);
    setShowConfirmation(false);
    setIsCompleted(false);

    try {
      const response = await apiRequest(`/api/inter-office-transfers/${data.transferCode}/details`, 'GET');

      if (response.ok) {
        const transferData = await response.json();
        console.log('🔍 تفاصيل الحوالة من الخادم:', transferData);
        
        setTransferDetails(transferData);
        setShowConfirmation(true);
        toast({
          title: "تم العثور على الحوالة",
          description: "تحقق من البيانات ثم أكد الاستلام",
        });
      } else {
        const error = await response.json();
        toast({
          title: "خطأ",
          description: error.message || "لم يتم العثور على الحوالة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ خطأ في البحث:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء البحث عن الحوالة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirmReceive = async () => {
    if (!transferDetails) return;

    setIsSubmitting(true);

    try {
      console.log('🔄 إرسال طلب استلام الحوالة:', transferDetails.transferCode);
      
      const response = await apiRequest('/api/inter-office-transfers/receive', 'POST', {
        transferCode: transferDetails.transferCode
      });

      console.log('📝 استجابة الخادم:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText 
      });

      // محاولة قراءة النتيجة بغض النظر عن response.ok
      const result = await response.json();
      console.log('📋 محتوى الاستجابة:', result);

      // التحقق من وجود رسالة نجاح في المحتوى
      if (response.ok || (result && (result.message === "تم استلام الحوالة بنجاح" || result.amount))) {
        console.log('✅ تم استلام الحوالة بنجاح');
        setIsCompleted(true);
        setShowConfirmation(false);
        
        // تحديث cache الرصيد والمعاملات
        queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/inter-office-transfers'] });
        
        toast({
          title: "تم الاستلام بنجاح",
          description: `تم إضافة ${result.amount || transferDetails.recipientCredit} ${result.currency || transferDetails.currency} إلى رصيدك`,
        });
        
        // إعادة تعيين النموذج بعد النجاح
        form.reset();
        setTimeout(() => {
          setTransferDetails(null);
          setIsCompleted(false);
        }, 5000);
      } else {
        console.log('❌ فشل استلام الحوالة:', result);
        toast({
          title: "فشل الاستلام",
          description: result.message || "حدث خطأ أثناء استلام الحوالة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ خطأ في استلام الحوالة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء استلام الحوالة",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // التحقق من أن المستخدم مكتب صرافة
  if (user && user.type !== 'agent' && user.type !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            هذه الصفحة متاحة فقط لمكاتب الصرافة والإدارة
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-4 flex gap-3">
        <BackToDashboardButton />
        <Link href="/referrals">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة للإحالات
          </Button>
        </Link>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">استلام حوالة بين المكاتب</h1>
        <p className="text-muted-foreground">
          أدخل رمز الاستلام لاستلام الحوالة
        </p>
      </div>

      {/* نموذج البحث */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            البحث عن الحوالة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                <FormField
                  control={form.control}
                  name="transferCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رمز الاستلام</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="903088"
                          className="text-center text-lg font-mono"
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || isSubmitting}
              >
                {isLoading ? "جاري البحث..." : "البحث عن الحوالة"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* تفاصيل الحوالة */}
      {transferDetails && showConfirmation && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              تفاصيل الحوالة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* معلومات المرسل والمستلم */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  معلومات الأطراف
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">المرسل:</span>
                    <p className="font-medium">{transferDetails.senderName}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">المستلم:</span>
                    <p className="font-medium">{transferDetails.recipientName}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{transferDetails.recipientPhone}</span>
                  </div>
                </div>
              </div>

              {/* المعلومات المالية */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  التفاصيل المالية
                </div>
                
                <div className="space-y-4">
                  {/* المبلغ الأصلي */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800">المبلغ الأصلي المطلوب إرساله:</span>
                      <span className="font-bold text-blue-900">{transferDetails.amountOriginal} {transferDetails.currency}</span>
                    </div>
                  </div>
                  
                  {/* العمولات */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700 border-b pb-1">تفاصيل العمولات:</h4>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">• عمولة النظام (يدفعها المرسل):</span>
                      <span className="font-medium text-red-600">{transferDetails.systemCommission} {transferDetails.currency}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">• عمولة المكتب المستلم:</span>
                      <span className="font-medium text-green-600">{transferDetails.recipientCommission} {transferDetails.currency}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* الحسابات النهائية */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 border-b pb-1">الحساب النهائي:</h4>
                    
                    {/* رصيد المستلم */}
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">رصيد المستلم (المبلغ الأصلي + عمولة المكتب):</span>
                        <span className="font-bold text-green-900">
                          {transferDetails.recipientCredit.toFixed(2)} {transferDetails.currency}
                        </span>
                      </div>
                      <div className="text-xs text-green-700 mt-1">
                        {transferDetails.amountOriginal} + {transferDetails.recipientCommission} = {transferDetails.recipientCredit.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* المخصوم من المرسل */}
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-orange-800">إجمالي المخصوم من المرسل:</span>
                        <span className="font-bold text-orange-900">
                          {transferDetails.totalDeduction.toFixed(2)} {transferDetails.currency}
                        </span>
                      </div>
                      <div className="text-xs text-orange-700 mt-1">
                        المبلغ الأصلي ({transferDetails.amountOriginal}) + عمولة النظام ({transferDetails.systemCommission}) + عمولة المكتب ({transferDetails.recipientCommission})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* معلومات إضافية */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <span className="text-sm text-muted-foreground">الموقع:</span>
                <p className="font-medium">{transferDetails.city}, {transferDetails.country}</p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">تاريخ الإرسال:</span>
                <p className="font-medium">
                  {new Date(transferDetails.createdAt).toLocaleDateString('ar-EG')}
                </p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">الحالة:</span>
                <Badge variant={transferDetails.status === 'pending' ? 'default' : 'secondary'}>
                  {transferDetails.status === 'pending' ? 'معلق' : 'مكتمل'}
                </Badge>
              </div>
            </div>

            {transferDetails.note && (
              <div className="pt-4 border-t">
                <span className="text-sm text-muted-foreground">ملاحظة:</span>
                <p className="font-medium mt-1">{transferDetails.note}</p>
              </div>
            )}

            {/* أزرار التحكم */}
            <div className="flex gap-4 pt-6">
              <Button
                onClick={onConfirmReceive}
                disabled={isSubmitting || transferDetails.status !== 'pending'}
                className="flex-1"
                size="lg"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {isSubmitting ? "جاري الاستلام..." : "تأكيد الاستلام"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setTransferDetails(null);
                  form.reset();
                }}
                disabled={isSubmitting}
                size="lg"
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* رسالة النجاح */}
      {isCompleted && transferDetails && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h3 className="text-xl font-bold text-green-800">تم الاستلام بنجاح!</h3>
              <p className="text-green-700">
                تم إضافة <span className="font-bold">
                  {transferDetails.recipientCredit.toFixed(2)} {transferDetails.currency}
                </span> إلى رصيدك
              </p>
              <div className="text-sm text-green-600">
                <p>رمز الاستلام: {transferDetails.receiverCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}