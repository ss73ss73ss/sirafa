import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function VerificationUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user already has a verification request
  const { data: existingRequest, isLoading: isCheckingRequest } = useQuery({
    queryKey: ["/api/verification-requests/my"],
    queryFn: async () => {
      const res = await fetch("/api/verification-requests/my");
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("فشل في جلب طلب التوثيق");
      }
      return await res.json();
    }
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      
      // Check if files are selected
      const idPhoto = formData.get('id_photo') as File;
      const proofOfAddress = formData.get('proof_of_address') as File;
      
      if (!idPhoto || idPhoto.size === 0) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار صورة الهوية",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!proofOfAddress || proofOfAddress.size === 0) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار إثبات العنوان",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Send the form data directly
      const response = await fetch('/api/user/verify-account', {
        method: 'POST',
        body: formData,
        // No need to set Content-Type header, browser will do it automatically with boundary
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في رفع المستندات");
      }
      
      const result = await response.json();
      
      toast({
        title: "تم بنجاح",
        description: "تم إرسال طلب التوثيق بنجاح وسيتم مراجعته من قبل الإدارة",
      });
      
      // Invalidate the query to refresh the verification status
      queryClient.invalidateQueries({ queryKey: ["/api/verification-requests/my"] });
      
      // Navigate to the dashboard after successful submission
      navigate("/");
      
    } catch (error) {
      console.error("Error submitting verification request:", error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء رفع المستندات",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If user is already verified, redirect to dashboard
  if (user?.verified) {
    navigate("/");
    return null;
  }
  
  // Show existing request if any
  if (existingRequest) {
    return (
      <div className="container mx-auto p-4 mt-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">حالة طلب التوثيق</CardTitle>
            <CardDescription className="text-center">لديك طلب توثيق قيد المراجعة حالياً</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                <AlertCircle className="text-yellow-500" />
                <h3 className="text-lg font-medium">حالة الطلب: {
                  existingRequest.status === 'pending' ? 'قيد المراجعة' :
                  existingRequest.status === 'approved' ? 'مقبول' : 'مرفوض'
                }</h3>
              </div>
              {existingRequest.status === 'rejected' && existingRequest.notes && (
                <div className="mt-2">
                  <p className="font-semibold">سبب الرفض:</p>
                  <p className="text-destructive">{existingRequest.notes}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                تاريخ التقديم: {new Date(existingRequest.createdAt).toLocaleDateString('ar-LY')}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate("/")}
              className="w-full"
            >
              العودة إلى لوحة التحكم
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Loading state
  if (isCheckingRequest) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  // Show verification form
  return (
    <div className="container mx-auto p-4 mt-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">توثيق الحساب</CardTitle>
          <CardDescription className="text-center">
            يرجى تقديم المستندات التالية لتوثيق حسابك. سيتم مراجعتها من قبل الإدارة.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium">
                صورة الهوية الشخصية *
                <p className="text-xs text-muted-foreground mt-1">
                  يجب أن تكون صورة واضحة للهوية الشخصية (بطاقة الهوية، جواز السفر، رخصة القيادة)
                </p>
              </label>
              <Input
                type="file"
                name="id_photo"
                accept="image/jpeg,image/png,image/gif,application/pdf"
                required
                className="p-2"
              />
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium">
                إثبات العنوان *
                <p className="text-xs text-muted-foreground mt-1">
                  يمكن أن يكون فاتورة مرافق (كهرباء، ماء، إنترنت) أو أي مستند رسمي يظهر عنوانك
                </p>
              </label>
              <Input
                type="file"
                name="proof_of_address"
                accept="image/jpeg,image/png,image/gif,application/pdf"
                required
                className="p-2"
              />
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <CheckCircle className="text-primary" />
                <h3 className="text-sm font-medium">ملاحظات هامة:</h3>
              </div>
              <ul className="list-disc list-inside text-xs space-y-1 mt-2 pr-6">
                <li>يجب أن تكون جميع المستندات حديثة (لا تزيد عن 3 أشهر)</li>
                <li>الصور يجب أن تكون واضحة وكاملة ويمكن قراءة جميع المعلومات</li>
                <li>يتم قبول الملفات بصيغة JPG أو PNG أو PDF</li>
                <li>الحد الأقصى لحجم الملف: 5 ميغابايت</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/")}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال طلب التوثيق"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}