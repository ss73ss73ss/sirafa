import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Shield, X, Upload, Phone, User, MapPin, ArrowRight } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIBYAN_CITIES } from "@shared/constants";
import { useLocation } from "wouter";

type VerificationStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

interface VerificationData {
  status: VerificationStatus;
  userId: number;
  lastUpdate: string;
  notes: string | null;
  message?: string;
}

// تعريف نموذج البيانات للتحقق
const verificationFormSchema = z.object({
  phoneNumber: z.string()
    .min(10, { message: "رقم الهاتف يجب أن يتكون من 10 أرقام على الأقل" })
    .max(15, { message: "رقم الهاتف لا يجب أن يتجاوز 15 رقمًا" }),
  fullName: z.string()
    .min(3, { message: "الاسم يجب أن يتكون من 3 أحرف على الأقل" }),
  city: z.string()
    .min(2, { message: "يرجى اختيار المدينة" }),
  address: z.string()
    .min(5, { message: "العنوان يجب أن يتكون من 5 أحرف على الأقل" }),
  idType: z.string()
    .min(2, { message: "يرجى اختيار نوع الهوية" }),
  notes: z.string().optional(),
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

export default function VerifyAccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [verificationState, setVerificationState] = useState<VerificationStatus>('not_started');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // تعريف نموذج البيانات باستخدام react-hook-form
  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      phoneNumber: user?.phone || "",
      fullName: user?.fullName || "",
      city: user?.cityName || "",
      address: "",
      idType: "",
      notes: "",
    },
  });
  
  // تحديث عنوان الصفحة
  useEffect(() => {
    document.title = "توثيق الحساب - صرافة الخليج";
  }, []);

  // استعلام بيانات التوثيق
  const { data: verificationData, isLoading, refetch } = useQuery<VerificationData>({
    queryKey: ["/api/user/verification"],
    enabled: !!user
  });

  // بمجرد الحصول على البيانات، نقوم بتحديث الحالة
  useEffect(() => {
    if (verificationData) {
      setVerificationState(verificationData.status);
    }
  }, [verificationData]);

  // تحديث القيم عند تحميل بيانات المستخدم
  useEffect(() => {
    if (user) {
      form.setValue('phoneNumber', user.phone || '');
      form.setValue('fullName', user.fullName || '');
      form.setValue('city', user.cityName || '');
    }
  }, [user, form]);

  // التعامل مع اختيار الملف
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // معالجة تقديم النموذج
  const onSubmit = (values: VerificationFormValues) => {
    if (!selectedFile) {
      toast({
        title: "تحميل المستند مطلوب",
        description: "يرجى تحميل صورة للهوية الشخصية",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // في تطبيق حقيقي، هنا سنقوم برفع الملف أولاً ثم إرسال البيانات
    // للتبسيط، سنتجاوز عملية الرفع الفعلية ونرسل البيانات مباشرة

    // محاكاة وقت التحميل
    setTimeout(() => {
      setIsUploading(false);
      submitVerificationMutation.mutate(values);
    }, 1500);
  };

  // mutation لبدء عملية التوثيق مع البيانات
  const submitVerificationMutation = useMutation({
    mutationFn: async (data: VerificationFormValues) => {
      // التحقق من وجود الملفات
      if (!selectedFile) {
        throw new Error("يرجى اختيار ملف الهوية");
      }

      // إنشاء FormData للملفات
      const formData = new FormData();
      formData.append('id_photo', selectedFile);
      formData.append('proof_of_address', selectedFile); // مؤقتاً نفس الملف
      formData.append('fullName', data.fullName);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('city', data.city);
      formData.append('address', data.address);
      formData.append('idType', data.idType);
      formData.append('notes', data.notes || '');

      const response = await fetch('/api/user/verify-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'حدث خطأ أثناء إرسال الطلب');
      }

      return await response.json();
    },
    onSuccess: (data: any) => {
      // تحديث الحالة إلى pending لأن الطلب تم إرساله
      setVerificationState('pending');
      toast({
        title: "تم تقديم طلب التوثيق",
        description: "تم استلام طلبك وسيتم مراجعته قريبًا. سيتم إشعارك عند الانتهاء من المراجعة.",
        variant: "default",
      });
      // تحديث بيانات الاستعلام عن حالة التوثيق
      queryClient.invalidateQueries({ queryKey: ["/api/user/verification"] });
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في تقديم طلب التوثيق، يرجى المحاولة مرة أخرى لاحقًا",
        variant: "destructive",
      });
    }
  });

  const handleStartVerification = () => {
    // عند النقر على الزر، نعرض نموذج التوثيق بدلاً من تحديث الحالة مباشرة
    setVerificationState('not_started'); // نبقي في حالة البدء لعرض النموذج
  };

  // تحديد محتوى البطاقة بناءً على حالة التوثيق
  const renderVerificationContent = () => {
    switch (verificationState) {
      case 'pending':
        return (
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-yellow-600 animate-spin" />
            </div>
            <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-neutral-800">طلب التوثيق قيد المراجعة</h3>
            <p className="text-neutral-600 text-xs sm:text-sm lg:text-base px-2">
              لقد استلمنا طلب التوثيق الخاص بك وهو قيد المراجعة حاليًا. سوف نقوم بإشعارك عند الانتهاء من المراجعة.
            </p>
            <div className="p-2 sm:p-3 lg:p-4 bg-yellow-50 rounded-lg mx-2 sm:mx-0">
              <p className="text-yellow-800 text-xs sm:text-sm">قد تستغرق عملية المراجعة من 24 إلى 48 ساعة عمل.</p>
            </div>
          </div>
        );
      
      case 'verified':
        return (
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-neutral-800">تم توثيق حسابك بنجاح</h3>
            <p className="text-neutral-600 text-sm sm:text-base px-2">
              تهانينا! تم توثيق حسابك بنجاح ويمكنك الآن الاستفادة من كافة المزايا المتاحة للحسابات الموثقة.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 px-2 sm:px-0">
              <div className="p-3 sm:p-4 bg-neutral-50 rounded-lg">
                <h4 className="font-bold text-neutral-800 text-sm sm:text-base">حدود التحويل أعلى</h4>
                <p className="text-neutral-600 text-xs sm:text-sm">يمكنك الآن إجراء تحويلات بمبالغ أكبر</p>
              </div>
              <div className="p-3 sm:p-4 bg-neutral-50 rounded-lg">
                <h4 className="font-bold text-neutral-800 text-sm sm:text-base">رسوم أقل</h4>
                <p className="text-neutral-600 text-xs sm:text-sm">استمتع برسوم مخفضة على كافة المعاملات</p>
              </div>
            </div>
          </div>
        );
      
      case 'rejected':
        return (
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-neutral-800">تم رفض طلب التوثيق</h3>
            <p className="text-neutral-600 text-sm sm:text-base px-2">
              للأسف، تم رفض طلب التوثيق الخاص بك. يرجى التحقق من المستندات المقدمة وإعادة المحاولة.
            </p>
            <div className="p-3 sm:p-4 bg-red-50 rounded-lg mx-2 sm:mx-0">
              <p className="text-red-800 text-xs sm:text-sm">سبب الرفض: المستندات المقدمة غير واضحة أو غير كاملة.</p>
            </div>
            <Button onClick={handleStartVerification} className="mt-3 sm:mt-4 text-sm sm:text-base">
              إعادة تقديم الطلب
            </Button>
          </div>
        );
      
      default: // not_started
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600" />
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-neutral-800 mt-3 sm:mt-4">توثيق الحساب</h3>
              <p className="text-neutral-600 mt-2 text-xs sm:text-sm lg:text-base px-2">
                توثيق حسابك يمنحك العديد من المزايا مثل حدود تحويل أعلى ورسوم مخفضة واستخدام ميزات متقدمة.
              </p>
            </div>
            
            {/* نموذج التوثيق */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  {/* الاسم الكامل */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-xs sm:text-sm lg:text-base">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                          الاسم الكامل
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="أدخل الاسم الكامل كما في الهوية" 
                            {...field} 
                            dir="rtl"
                            readOnly
                            className="bg-muted cursor-not-allowed text-xs sm:text-sm lg:text-base h-8 sm:h-10"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          هذا الاسم مأخوذ من بيانات حسابك المسجل
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* رقم الهاتف */}
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-xs sm:text-sm lg:text-base">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                          رقم الهاتف
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="أدخل رقم الهاتف للتواصل" 
                            {...field} 
                            dir="rtl"
                            readOnly
                            className="bg-muted cursor-not-allowed text-xs sm:text-sm lg:text-base h-8 sm:h-10"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          رقم الهاتف مأخوذ من بيانات حسابك المسجل
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* المدينة */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-xs sm:text-sm lg:text-base">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                          المدينة (من بيانات التسجيل)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            dir="rtl" 
                            readOnly 
                            className="bg-gray-50 cursor-not-allowed text-xs sm:text-sm lg:text-base h-8 sm:h-10"
                            value={user?.cityName || field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* نوع الهوية */}
                  <FormField
                    control={form.control}
                    name="idType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-xs sm:text-sm lg:text-base">
                          <Shield className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                          نوع الهوية
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-xs sm:text-sm lg:text-base h-8 sm:h-10">
                              <SelectValue placeholder="اختر نوع الهوية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="بطاقة هوية شخصية">بطاقة هوية شخصية</SelectItem>
                            <SelectItem value="جواز سفر">جواز سفر</SelectItem>
                            <SelectItem value="رخصة قيادة">رخصة قيادة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* العنوان */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel className="text-xs sm:text-sm lg:text-base">العنوان</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل عنوان المكتب بالتفصيل" {...field} dir="rtl" className="text-xs sm:text-sm lg:text-base h-8 sm:h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ملاحظات */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel className="text-xs sm:text-sm lg:text-base">ملاحظات إضافية (اختياري)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="أي معلومات إضافية ترغب في إضافتها" 
                            {...field} 
                            dir="rtl"
                            className="resize-none h-16 lg:h-20 text-xs sm:text-sm lg:text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* تحميل المستندات */}
                <div className="border border-dashed border-gray-300 rounded-lg p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
                  <h4 className="font-medium text-center text-xs sm:text-sm lg:text-base">تحميل صورة الهوية</h4>
                  <div className="flex items-center justify-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex items-center justify-center space-x-2 space-x-reverse text-xs sm:text-sm lg:text-base h-8 sm:h-10 px-3 sm:px-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                      <span>{selectedFile ? 'تغيير المستند' : 'تحميل المستند'}</span>
                    </Button>
                  </div>
                  {selectedFile && (
                    <div className="text-center text-xs sm:text-sm text-green-600">
                      تم اختيار: {selectedFile.name}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 text-center px-2">
                    يرجى تحميل صورة واضحة للهوية (JPG أو PNG). يجب أن تكون جميع المعلومات مقروءة بوضوح.
                  </p>
                </div>

                <div className="flex justify-center pt-2 sm:pt-3 lg:pt-4">
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 text-sm sm:text-base h-10 sm:h-auto" 
                    disabled={isUploading || submitVerificationMutation.isPending}
                  >
                    {(isUploading || submitVerificationMutation.isPending) && (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 ml-2 animate-spin" />
                    )}
                    إرسال طلب التوثيق
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 bg-white shadow-lg border-r border-gray-200 p-4">
        <Sidebar />
      </div>
      <main className="flex-1 px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl overflow-hidden px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
            {/* Header with back button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-700">
                توثيق الحساب
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-2 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
              >
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                العودة للداش بورد
              </Button>
            </div>
              
              <Card className="border-0 shadow-sm mb-4 sm:mb-6">
                <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-sm sm:text-lg lg:text-xl font-bold">معلومات التوثيق</CardTitle>
                  <CardDescription className="text-xs sm:text-sm lg:text-base">
                    حساب موثق يتيح لك الاستفادة الكاملة من خدمات صرافة الخليج
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  {isLoading ? (
                    <div className="flex justify-center p-3 sm:p-6">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-neutral-400" />
                    </div>
                  ) : (
                    renderVerificationContent()
                  )}
                </CardContent>
                <CardFooter className="bg-neutral-50 text-xs lg:text-sm text-neutral-500 italic px-3 sm:px-6 py-2 sm:py-3">
                  يتم التحقق من المعلومات المقدمة وفقًا للوائح وأنظمة مكافحة غسل الأموال وتمويل الإرهاب.
                </CardFooter>
              </Card>
          </div>
        </div>
      </main>
    </div>
  );
}