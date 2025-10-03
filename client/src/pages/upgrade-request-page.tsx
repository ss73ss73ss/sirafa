import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UpgradeRequestInput, UpgradeRequest } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ar";
import { Input } from "@/components/ui/input-ar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  ArrowLeft, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  X,
  ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LIBYAN_CITIES } from "@shared/constants";

// Form schema from shared schema
const formSchema = z.object({
  fullName: z.string().min(3, { message: "يجب أن يكون الاسم أكثر من 3 أحرف" }),
  phone: z.string().min(10, { message: "يجب أن يكون رقم الهاتف صحيحًا" }),
  city: z.string().min(2, { message: "يرجى إدخال اسم المدينة" }),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function UpgradeRequestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Update document title
  useEffect(() => {
    document.title = "طلب ترقية للتحويل بين المدن - صرافة الخليج";
  }, []);

  // التحقق من دولة تسجيل المستخدم
  useEffect(() => {
    if (user && user.countryId !== 1) {
      toast({
        title: "غير متاح",
        description: "طلب الترقية للتحويل بين المدن متاح للمستخدمين المسجلين في ليبيا فقط.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);

  // Fetch user's existing upgrade requests
  const { 
    data: requests, 
    isLoading: requestsLoading,
    refetch: refetchRequests
  } = useQuery<UpgradeRequest[]>({
    queryKey: ["/api/user/upgrade-requests"],
    enabled: !!user,
  });

  // Check if there's a pending request
  const pendingRequest = requests?.find(req => req.status === "pending");
  const approvedRequest = requests?.find(req => req.status === "approved");
  const rejectedRequests = requests?.filter(req => req.status === "rejected") || [];

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      city: user?.cityName || "",
      message: "",
    },
  });

  // تحديث القيم عند تحميل بيانات المستخدم
  useEffect(() => {
    if (user) {
      form.setValue('fullName', user.fullName || '');
      form.setValue('phone', user.phone || '');
      // تعبئة المدينة من بيانات إنشاء الحساب
      if (user.cityName) {
        form.setValue('city', user.cityName);
      }
    }
  }, [user, form]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("/api/upgrade-requests", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال طلب ترقية التحويل بين المدن بنجاح",
        description: "سيتم مراجعة طلبك من قبل الإدارة في أقرب وقت",
      });
      
      // Refetch requests to show the new pending request
      refetchRequests();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "فشل إرسال طلب الترقية",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    submitMutation.mutate(values);
  };

  // Go back handler
  const handleGoBack = () => {
    navigate("/dashboard");
  };

  if (!user) return null;

  // Don't show the form if user is already an office or has a pending request
  const showForm = user.type !== "office" && !pendingRequest && !approvedRequest;

  // Get badge for request status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-0 ml-1" />
            قيد المراجعة
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-0 ml-1" />
            تمت الموافقة
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <X className="h-3 w-3 mr-0 ml-1" />
            مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8" dir="rtl">
        <Button
          variant="ghost"
          className="mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base"
          onClick={handleGoBack}
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          العودة إلى لوحة التحكم
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">طلب ترقية للتحويل بين المدن</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  قم بترقية حسابك لتفعيل خدمة التحويل بين المدن
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {user.type === "office" ? (
                  <Alert className="bg-green-50 text-green-800 border border-green-200">
                    <CheckCircle2 className="h-5 w-5" />
                    <AlertTitle className="text-green-800 mb-1">تم ترقية حسابك</AlertTitle>
                    <AlertDescription className="text-green-700">
                      حسابك مرقى بالفعل ويمكنك إجراء التحويلات بين المدن.
                    </AlertDescription>
                  </Alert>
                ) : pendingRequest ? (
                  <Alert className="bg-yellow-50 text-yellow-800 border border-yellow-200">
                    <Clock className="h-5 w-5" />
                    <AlertTitle className="text-yellow-800 mb-1">طلب قيد المراجعة</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      لديك طلب ترقية قيد المراجعة حالياً. سيتم إخطارك فور مراجعته من قبل الإدارة.
                    </AlertDescription>
                  </Alert>
                ) : approvedRequest ? (
                  <Alert className="bg-green-50 text-green-800 border border-green-200">
                    <CheckCircle2 className="h-5 w-5" />
                    <AlertTitle className="text-green-800 mb-1">تمت الموافقة على طلبك</AlertTitle>
                    <AlertDescription className="text-green-700">
                      تمت الموافقة على طلب الترقية الخاص بك. قم بتسجيل الخروج وإعادة تسجيل الدخول لتفعيل الميزات الجديدة.
                    </AlertDescription>
                  </Alert>
                ) : showForm ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                      {/* Account Number Field - Auto-filled and disabled */}
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">رقم الحساب</FormLabel>
                        <FormControl>
                          <Input 
                            value={user?.accountNumber || ''}
                            disabled
                            className="bg-gray-50 text-gray-600 text-sm sm:text-base"
                          />
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm">
                          رقم حسابك الحالي في النظام
                        </FormDescription>
                      </FormItem>

                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="أدخل الاسم الكامل" 
                                {...field}
                                readOnly
                                className="bg-muted cursor-not-allowed"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              هذا الاسم مأخوذ من بيانات حسابك المسجل
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="أدخل رقم الهاتف"
                                type="tel"
                                {...field}
                                readOnly
                                className="bg-muted cursor-not-allowed"
                              />
                            </FormControl>
                            <FormDescription>
                              سيتم استخدام رقم الهاتف للتواصل معك بخصوص طلب الترقية
                            </FormDescription>
                            <p className="text-xs text-muted-foreground">
                              رقم الهاتف مأخوذ من بيانات حسابك المسجل
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المدينة</FormLabel>
                            <FormControl>
                              <Input 
                                value={user?.cityName || ''}
                                readOnly
                                className="bg-muted cursor-not-allowed"
                                dir="rtl"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              المدينة من بيانات إنشاء الحساب
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base">رسالة توضيحية (اختياري)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="اكتب أي معلومات إضافية ترغب في إضافتها لطلبك"
                                className="resize-none h-24 sm:h-32 text-sm sm:text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full text-sm sm:text-base py-2 sm:py-3"
                        disabled={submitMutation.isPending}
                      >
                        {submitMutation.isPending ? (
                          <>
                            <Loader2 className="ml-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            جارٍ الإرسال...
                          </>
                        ) : (
                          <>
                            <Building2 className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            إرسال طلب الترقية للتحويل بين المدن
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : null}

                {/* Previous Requests */}
                {rejectedRequests.length > 0 && (
                  <div className="mt-6 sm:mt-8">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">الطلبات السابقة</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {rejectedRequests.map((request) => (
                        <div
                          key={request.id}
                          className="border border-red-200 rounded-lg p-3 sm:p-4 bg-red-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-red-800">
                              طلب مرفوض
                              <div className="text-sm text-neutral-500 mt-1">
                                {request.createdAt ? new Date(request.createdAt).toLocaleDateString('ar-LY') : ''}
                              </div>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          {request.reviewNotes && (
                            <div className="mt-2 text-sm border-t border-red-200 pt-2 text-red-700">
                              <strong>ملاحظات المراجعة:</strong> {request.reviewNotes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-lg sm:text-xl">مزايا التحويل بين المدن</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full p-2 bg-green-100 text-green-700 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">تحويلات بين المدن</h4>
                      <p className="text-sm text-neutral-600">إمكانية إجراء تحويلات بين المدن الليبية المختلفة</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="rounded-full p-2 bg-green-100 text-green-700 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">عمولات مخفضة</h4>
                      <p className="text-sm text-neutral-600">الحصول على عمولات مخفضة للتحويلات بين المدن</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="rounded-full p-2 bg-green-100 text-green-700 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">سرعة في التحويل</h4>
                      <p className="text-sm text-neutral-600">تحويلات فورية بين المدن المختلفة</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="rounded-full p-2 bg-green-100 text-green-700 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">تغطية شاملة</h4>
                      <p className="text-sm text-neutral-600">تحويل إلى جميع المدن الليبية المدعومة</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-sm bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-blue-800 mb-2">متطلبات الترقية:</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    <li>تقديم معلومات صحيحة وكاملة</li>
                    <li>توثيق الحساب مسبقاً</li>
                    <li>الالتزام بسياسات المنصة وشروط الاستخدام</li>
                    <li>قد تستغرق مراجعة الطلب ما بين 24-48 ساعة</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}