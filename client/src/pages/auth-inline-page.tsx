import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button-ar";
import { Input } from "@/components/ui/input-ar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form-ar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, Mail, Lock, User, Phone, MapPin, Globe, Users, CheckCircle, XCircle, Shield, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Country, City } from "@shared/schema";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل يجب أن يكون على الأقل 3 أحرف"),
  officeName: z.string().min(3, "اسم المكتب يجب أن يكون على الأقل 3 أحرف"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(10, "رقم الهاتف مطلوب ويجب أن يكون على الأقل 10 أرقام"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف"),
  countryId: z.number().min(1, "اختيار الدولة مطلوب"),
  cityId: z.number().optional(),
  cityNameManual: z.string().optional(),
  referralCode: z.string().optional(), // رمز الإحالة (اختياري)
}).refine(
  (data) => data.cityId || (data.cityNameManual && data.cityNameManual.trim().length > 0),
  {
    message: "يجب اختيار مدينة من القائمة أو إدخال اسم المدينة يدوياً",
    path: ["cityId"]
  }
);

const twoFASchema = z.object({
  code: z.string().min(6, "الرمز يجب أن يكون 6 أرقام").max(6, "الرمز يجب أن يكون 6 أرقام"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type TwoFAFormValues = z.infer<typeof twoFASchema>;

export default function AuthInlinePage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isManualCity, setIsManualCity] = useState(false);
  const { loginMutation, registerMutation, user, verify2FAMutation } = useAuth();
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string>("");
  const [loginData, setLoginData] = useState<LoginFormValues | null>(null);
  const [, setLocation] = useLocation();

  // تحديث عنوان الصفحة
  useEffect(() => {
    document.title = activeTab === "login" ? "تسجيل الدخول - صرافة الخليج" : "إنشاء حساب - صرافة الخليج";
  }, [activeTab]);

  // إعادة توجيه إلى لوحة التحكم إذا كان المستخدم مسجل الدخول
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  // مراقبة نتيجة تسجيل الدخول للمصادقة الثنائية
  useEffect(() => {
    // التحقق من حالة المصادقة الثنائية عندما تكون mutation ناجحة
    if (loginMutation.isSuccess && loginMutation.data && !loginMutation.isPending) {
      console.log('🔍 [2FA INLINE DEBUG] بيانات نجاح تسجيل الدخول:', {
        data: loginMutation.data,
        requires2FA: loginMutation.data.requires2FA,
        tempToken: loginMutation.data.tempToken
      });
      
      // إذا كانت المصادقة الثنائية مطلوبة
      if (loginMutation.data.requires2FA && loginMutation.data.tempToken) {
        console.log('🔐 [2FA INLINE] المصادقة الثنائية مطلوبة، عرض الواجهة');
        setShow2FA(true);
        setTempToken(loginMutation.data.tempToken);
        setLoginData(loginForm.getValues());
        return;
      }
    }
  }, [loginMutation.isSuccess, loginMutation.data, loginMutation.isPending, setShow2FA, setTempToken, setLoginData]);

  // سيتم نقل هذا useEffect بعد تعريف registerForm

  // وظيفة للتحقق من صحة رمز الإحالة
  const validateReferralCode = async (code: string) => {
    if (!code || code.trim().length === 0) {
      setReferralCodeStatus({
        isValid: null,
        isChecking: false,
      });
      return;
    }

    setReferralCodeStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const response = await fetch(`/api/referral/validate/${code.trim()}`);
      const result = await response.json();

      if (result.valid && result.referrerId) {
        // جلب اسم المُحيل
        const userResponse = await fetch(`/api/users/${result.referrerId}`);
        const userInfo = userResponse.ok ? await userResponse.json() : null;

        setReferralCodeStatus({
          isValid: true,
          isChecking: false,
          referrerName: userInfo?.fullName || 'مستخدم مجهول',
        });
      } else {
        setReferralCodeStatus({
          isValid: false,
          isChecking: false,
        });
      }
    } catch (error) {
      console.error('خطأ في التحقق من رمز الإحالة:', error);
      setReferralCodeStatus({
        isValid: false,
        isChecking: false,
      });
    }
  };

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // حالة للتحقق من رمز الإحالة
  const [referralCodeStatus, setReferralCodeStatus] = useState<{
    isValid: boolean | null;
    isChecking: boolean;
    referrerName?: string;
  }>({
    isValid: null,
    isChecking: false,
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      officeName: "",
      email: "",
      phone: "",
      password: "",
      countryId: undefined as any,
      cityId: undefined,
      cityNameManual: "",
      referralCode: "",
    },
  });

  // تحديد رمز الإحالة من URL إذا كان موجوداً
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      registerForm.setValue('referralCode', refCode);
      // التبديل تلقائياً لتبويب التسجيل
      setActiveTab('register');
    }
  }, []);

  // مراقبة تغيير رمز الإحالة للتحقق منه
  const referralCode = registerForm.watch('referralCode');
  useEffect(() => {
    if (!referralCode) return;
    
    const debounceTimer = setTimeout(() => {
      validateReferralCode(referralCode);
    }, 500); // انتظار 500ms بعد التوقف عن الكتابة

    return () => clearTimeout(debounceTimer);
  }, [referralCode]);

  // Fetch countries
  const { data: countries = [], isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ['/api/geo/countries'],
    enabled: activeTab === 'register',
  });

  // Watch the selected country from form
  const selectedCountryId = registerForm.watch('countryId');
  const selectedCountry = countries.find(country => country.id === selectedCountryId);

  // Fetch cities based on selected country
  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ['/api/geo/cities', selectedCountryId],
    queryFn: async () => {
      const response = await fetch(`/api/geo/cities?country_id=${selectedCountryId}`);
      if (!response.ok) throw new Error('فشل في تحميل المدن');
      return response.json();
    },
    enabled: !!selectedCountryId && activeTab === 'register',
  });

  // Reset city selection and manual mode when country changes
  useEffect(() => {
    if (selectedCountryId) {
      registerForm.setValue('cityId', undefined);
      registerForm.setValue('cityNameManual', '');
      // Reset manual city mode to allow checking for cities in the new country
      setIsManualCity(false);
      
      // Update phone field with country code if it exists
      const country = countries.find(c => c.id === selectedCountryId);
      if (country?.phoneCode) {
        const currentPhone = registerForm.getValues('phone');
        // Only update if phone is empty or starts with a different country code
        if (!currentPhone || currentPhone.startsWith('+')) {
          registerForm.setValue('phone', country.phoneCode + ' ');
        } else if (!currentPhone.includes(country.phoneCode)) {
          registerForm.setValue('phone', country.phoneCode + ' ' + currentPhone);
        }
      }
    }
  }, [selectedCountryId, registerForm, countries]);

  // Auto-enable manual city input when no cities are available for selected country
  useEffect(() => {
    if (selectedCountryId && !citiesLoading) {
      if (cities.length === 0) {
        setIsManualCity(true);
      } else {
        setIsManualCity(false);
      }
    }
  }, [selectedCountryId, cities.length, citiesLoading]);

  // نموذج المصادقة الثنائية
  const twoFAForm = useForm<TwoFAFormValues>({
    resolver: zodResolver(twoFASchema),
    defaultValues: {
      code: "",
    },
  });

  const onLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const on2FASubmit = async (data: TwoFAFormValues) => {
    if (!tempToken) {
      console.error('لا يوجد temp token للمصادقة الثنائية');
      return;
    }

    verify2FAMutation.mutate({
      tempToken,
      token: data.code
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
    // إعداد البيانات قبل الإرسال
    const selectedCountry = countries.find(country => country.id === data.countryId);
    const selectedCity = isManualCity ? null : cities.find(city => city.id === data.cityId);
    
    const submissionData = {
      fullName: data.fullName,
      officeName: data.officeName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      countryId: data.countryId,
      cityId: isManualCity ? undefined : data.cityId,
      countryName: selectedCountry?.name || "",
      cityName: isManualCity ? (data.cityNameManual || "") : (selectedCity?.nameAr || ""),
      referralCode: data.referralCode?.trim() || undefined, // إضافة رمز الإحالة
    };
    
    registerMutation.mutate(submissionData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* شعار الموقع */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-xl mb-4 hover:bg-primary/90 transition-colors">
              صرافة الخليج
            </div>
          </Link>
          <p className="text-muted-foreground">
            {activeTab === "login" ? "مرحباً بعودتك" : "انضم إلينا اليوم"}
          </p>
        </div>

        {/* كارت المصادقة */}
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {show2FA ? "المصادقة الثنائية" : (activeTab === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد")}
            </CardTitle>
            <CardDescription>
              {show2FA ? "أدخل الرمز المكون من 6 أرقام من تطبيق Google Authenticator" 
                : (activeTab === "login" 
                  ? "أدخل بياناتك للوصول إلى حسابك" 
                  : "أنشئ حساباً جديداً للبدء"
                )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {show2FA ? (
              // واجهة المصادقة الثنائية
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Shield className="w-12 h-12 mx-auto text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">
                    أدخل الرمز المكون من 6 أرقام من تطبيق Google Authenticator الخاص بك
                  </p>
                </div>
                
                <Form {...twoFAForm}>
                  <form onSubmit={twoFAForm.handleSubmit(on2FASubmit)} className="space-y-4">
                    <FormField
                      control={twoFAForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 justify-center">
                            <Lock className="w-4 h-4" />
                            رمز التحقق (6 أرقام)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              placeholder="123456"
                              className="bg-background text-center text-xl tracking-widest"
                              autoComplete="one-time-code"
                              dir="ltr"
                              data-testid="input-2fa-code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={verify2FAMutation.isPending}
                      data-testid="button-verify-2fa"
                    >
                      {verify2FAMutation.isPending ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري التحقق...
                        </>
                      ) : (
                        <>
                          <Shield className="ml-2 h-4 w-4" />
                          تحقق من الرمز
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    إذا لم يكن لديك الرمز، يمكنك استخدام أحد رموز النسخ الاحتياطية
                  </p>
                </div>
              </div>
            ) : (
              // الواجهة العادية
              <>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login" className="text-sm">تسجيل الدخول</TabsTrigger>
                    <TabsTrigger value="register" className="text-sm">إنشاء حساب</TabsTrigger>
                  </TabsList>

              {/* تبويب تسجيل الدخول */}
              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            البريد الإلكتروني
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="أدخل بريدك الإلكتروني"
                              autoComplete="email"
                              className="bg-background"
                            />
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
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            كلمة المرور
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="أدخل كلمة المرور"
                              autoComplete="current-password"
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 text-primary hover:text-primary/80"
                      >
                        نسيت كلمة المرور؟
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري تسجيل الدخول...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="ml-2 h-4 w-4" />
                          تسجيل الدخول
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* تبويب إنشاء الحساب */}
              <TabsContent value="register" className="space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            الاسم الكامل
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="أدخل اسمك الكامل"
                              autoComplete="name"
                              className="bg-background"
                            />
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
                          <FormLabel className="flex items-center gap-2 text-red-600 font-bold">
                            <MapPin className="w-4 h-4" />
                            اسم المكتب* (مطلوب)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="أدخل اسم مكتب الصرافة"
                              className="bg-background border-2 border-red-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            البريد الإلكتروني
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="أدخل بريدك الإلكتروني"
                              autoComplete="email"
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* حقل الدولة */}
                    <FormField
                      control={registerForm.control}
                      name="countryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            الدولة *
                          </FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const countryId = parseInt(value);
                              field.onChange(countryId);
                            }}
                            value={field.value ? field.value.toString() : ""}
                            disabled={countriesLoading}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="🌍 اختر دولتك" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.id} value={country.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span>{country.name}</span>
                                    <span className="text-xs text-gray-500">({country.code})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* حقل المدينة */}
                    {selectedCountryId && (
                      <FormField
                        control={registerForm.control}
                        name={isManualCity ? "cityNameManual" : "cityId"}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              المدينة *
                            </FormLabel>
                            {isManualCity ? (
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="أدخل اسم مدينتك"
                                  className="bg-background"
                                />
                              </FormControl>
                            ) : (
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value ? field.value.toString() : ""}
                                disabled={citiesLoading}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder={citiesLoading ? "جاري التحميل..." : "اختر مدينتك"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {cities.map((city) => (
                                    <SelectItem key={city.id} value={city.id.toString()}>
                                      {city.nameAr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {cities.length === 0 && selectedCountryId && !citiesLoading && (
                              <p className="text-xs text-amber-600">
                                لا توجد مدن متاحة - سيتم إدخال اسم المدينة يدوياً
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            رقم الهاتف (اختياري)
                            {selectedCountry?.phoneCode && (
                              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                                {selectedCountry.phoneCode}
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder={selectedCountry?.phoneCode 
                                ? `مثال: ${selectedCountry.phoneCode} 912345678` 
                                : "أدخل رقم هاتفك"
                              }
                              autoComplete="tel"
                              className="bg-background"
                              dir="ltr"
                            />
                          </FormControl>
                          {selectedCountry?.phoneCode && (
                            <p className="text-xs text-muted-foreground">
                              سيتم إضافة مفتاح الدولة ({selectedCountry.phoneCode}) تلقائياً
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* حقل رمز الإحالة */}
                    <FormField
                      control={registerForm.control}
                      name="referralCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            رمز الإحالة (اختياري)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                placeholder="أدخل رمز الإحالة إذا كان لديك أحد"
                                className="bg-background pr-10"
                              />
                              {referralCodeStatus.isChecking && (
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              {!referralCodeStatus.isChecking && referralCodeStatus.isValid === true && (
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </div>
                              )}
                              {!referralCodeStatus.isChecking && referralCodeStatus.isValid === false && (
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          {referralCodeStatus.isValid === true && referralCodeStatus.referrerName && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              الرمز صحيح
                            </p>
                          )}
                          {referralCodeStatus.isValid === false && field.value && field.value.trim().length > 0 && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              رمز الإحالة غير صحيح
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            كلمة المرور
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="أدخل كلمة مرور قوية"
                              autoComplete="new-password"
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري إنشاء الحساب...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="ml-2 h-4 w-4" />
                          إنشاء حساب
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            </>
            )}
          </CardContent>
        </Card>

        {/* رابط العودة للصفحة الرئيسية */}
        <div className="text-center mt-6">
          <Link href="/" className="text-muted-foreground hover:text-primary text-sm transition-colors">
            ← العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}