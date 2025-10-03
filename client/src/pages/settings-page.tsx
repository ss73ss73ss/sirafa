import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User, Settings, Bell, Shield, Globe, Palette, ArrowRight, Lock, Smartphone, Copy, Check, AlertTriangle } from "lucide-react";
import { PushNotificationsSettings } from "@/components/push-notifications-settings";
import { useLocation } from "wouter";
import { Guard } from "@/components/Guard";

const profileSchema = z.object({
  fullName: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقتين",
  path: ["confirmPassword"],
});

const enable2FASchema = z.object({
  token: z.string().length(6, "رمز التحقق يجب أن يكون 6 أرقام"),
});

const disable2FASchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  token: z.string().length(6, "رمز التحقق يجب أن يكون 6 أرقام"),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type Enable2FAFormData = z.infer<typeof enable2FASchema>;
type Disable2FAFormData = z.infer<typeof disable2FASchema>;

export default function SettingsPage() {
  return (
    <Guard page="settings">
      <SettingsContent />
    </Guard>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // حالات المصادقة الثنائية
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [is2FASetupDialogOpen, setIs2FASetupDialogOpen] = useState(false);
  const [is2FADisableDialogOpen, setIs2FADisableDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [manualEntryKey, setManualEntryKey] = useState<string>("");
  const [copiedCodes, setCopiedCodes] = useState<boolean[]>([]);
  
  // حالات جلسات تسجيل الدخول
  const [isLoginSessionsDialogOpen, setIsLoginSessionsDialogOpen] = useState(false);
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    transfers: true,
    marketing: false,
  });

  // التحقق من صلاحية التعديل - المدير العام فقط
  const canEditProfile = user?.type === "admin";
  
  // كل المستخدمين يمكنهم تغيير كلمة المرور
  const canChangePassword = true;

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const enable2FAForm = useForm<Enable2FAFormData>({
    resolver: zodResolver(enable2FASchema),
    defaultValues: {
      token: "",
    },
  });

  const disable2FAForm = useForm<Disable2FAFormData>({
    resolver: zodResolver(disable2FASchema),
    defaultValues: {
      currentPassword: "",
      token: "",
    },
  });

  // الحصول على حالة المصادقة الثنائية
  const { data: twoFAStatus, refetch: refetch2FAStatus } = useQuery({
    queryKey: ['/api/2fa/status'],
    queryFn: async () => {
      const response = await apiRequest('/api/2fa/status');
      if (!response.ok) throw new Error('فشل في الحصول على حالة المصادقة الثنائية');
      return response.json();
    },
  });

  // الحصول على جلسات تسجيل الدخول
  const { data: loginSessions, isLoading: isLoadingLoginSessions } = useQuery({
    queryKey: ['/api/user/login-sessions'],
    queryFn: async () => {
      const response = await apiRequest('/api/user/login-sessions');
      if (!response.ok) throw new Error('فشل في جلب جلسات تسجيل الدخول');
      return response.json();
    },
    enabled: isLoginSessionsDialogOpen, // جلب البيانات عند فتح النافذة فقط
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest('PUT', '/api/user/profile', data);
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      // تحديث بيانات المستخدم في cache
      queryClient.setQueryData(['/api/user'], updatedUser);
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث الملف الشخصي بنجاح",
      });
      
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء التحديث",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await apiRequest('/api/user/change-password', 'PUT', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      
      setIsChangingPassword(false);
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
      
      setIsChangingPassword(false);
    },
  });

  // إعداد المصادقة الثنائية
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/2fa/setup', 'POST');
      if (!response.ok) throw new Error('فشل في إعداد المصادقة الثنائية');
      return response.json();
    },
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setManualEntryKey(data.manualEntryKey);
      setCopiedCodes(new Array(data.backupCodes.length).fill(false));
      setIs2FASetupDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إعداد المصادقة الثنائية",
        variant: "destructive",
      });
    },
  });

  // تفعيل المصادقة الثنائية
  const enable2FAMutation = useMutation({
    mutationFn: async (data: Enable2FAFormData) => {
      const response = await apiRequest('/api/2fa/enable', 'POST', data);
      if (!response.ok) throw new Error('رمز التحقق غير صحيح');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التفعيل",
        description: "تم تفعيل المصادقة الثنائية بنجاح",
      });
      
      setIs2FASetupDialogOpen(false);
      enable2FAForm.reset();
      refetch2FAStatus();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "رمز التحقق غير صحيح",
        variant: "destructive",
      });
    },
  });

  // إلغاء تفعيل المصادقة الثنائية
  const disable2FAMutation = useMutation({
    mutationFn: async (data: Disable2FAFormData) => {
      const response = await apiRequest('/api/2fa/disable', 'POST', data);
      if (!response.ok) throw new Error('فشل في إلغاء تفعيل المصادقة الثنائية');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء تفعيل المصادقة الثنائية بنجاح",
      });
      
      setIs2FADisableDialogOpen(false);
      disable2FAForm.reset();
      refetch2FAStatus();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إلغاء تفعيل المصادقة الثنائية",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!canEditProfile) {
      toast({
        title: "غير مصرح",
        description: "لا يمكنك تعديل المعلومات الشخصية. فقط المدير العام يمكنه ذلك.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!canChangePassword) {
      toast({
        title: "غير مصرح",
        description: "لا يمكنك تغيير كلمة المرور",
        variant: "destructive",
      });
      return;
    }
    setIsChangingPassword(true);
    changePasswordMutation.mutate(data);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // معالجات المصادقة الثنائية
  const handle2FASetup = () => {
    setup2FAMutation.mutate();
  };

  const handle2FAEnable = (data: Enable2FAFormData) => {
    enable2FAMutation.mutate(data);
  };

  const handle2FADisable = (data: Disable2FAFormData) => {
    disable2FAMutation.mutate(data);
  };

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      // محاولة استخدام Clipboard API الحديث
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback للمتصفحات القديمة أو HTTP
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!result) {
          throw new Error('فشل في النسخ باستخدام execCommand');
        }
      }
      
      if (index !== undefined) {
        setCopiedCodes(prev => {
          const newCopied = [...prev];
          newCopied[index] = true;
          setTimeout(() => {
            setCopiedCodes(current => {
              const resetCopied = [...current];
              resetCopied[index] = false;
              return resetCopied;
            });
          }, 2000);
          return newCopied;
        });
      }
      
      toast({
        title: "تم النسخ",
        description: "تم نسخ النص إلى الحافظة",
      });
    } catch (error) {
      console.error('خطأ في النسخ:', error);
      toast({
        title: "خطأ في النسخ",
        description: "لم نتمكن من نسخ النص تلقائياً. انسخ النص يدوياً من الحقل",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-3 sm:mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation('/dashboard')}
          className="flex items-center gap-2 mb-2 sm:mb-4 text-xs sm:text-sm h-8 sm:h-10"
          style={{ 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6',
            padding: '6px 12px',
            borderRadius: '6px'
          }}
        >
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          العودة إلى لوحة التحكم
        </Button>
      </div>
      
      <div className="text-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">الإعدادات</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          إدارة معلومات الحساب والتفضيلات
        </p>
      </div>

      <div className="space-y-3 sm:space-y-6">
        {/* معلومات الحساب */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              <CardTitle className="text-sm sm:text-base">معلومات الحساب</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              تحديث معلومات الملف الشخصي
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {!canEditProfile && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-600" />
                  <p className="text-xs sm:text-sm text-yellow-800">
                    يمكن للمدير العام فقط تعديل المعلومات الشخصية
                  </p>
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">الاسم الكامل</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSubmitting || !canEditProfile} className="text-xs sm:text-sm h-8 sm:h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" disabled={isSubmitting || !canEditProfile} className="text-xs sm:text-sm h-8 sm:h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting || !canEditProfile} className="text-xs sm:text-sm h-8 sm:h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !canEditProfile} 
                    className="text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
                  >
                    {isSubmitting ? "جاري التحديث..." : "تحديث المعلومات"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* معلومات الحساب الحالية */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              <CardTitle className="text-sm sm:text-base">معلومات الحساب</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm">رقم الحساب</Label>
                <Badge variant="outline" className="text-xs px-2 py-1">{user?.accountNumber}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm">نوع الحساب</Label>
                <Badge variant={user?.type === "admin" ? "default" : user?.type === "agent" ? "secondary" : "outline"} className="text-xs px-2 py-1">
                  {user?.type === "admin" ? "مدير" : user?.type === "agent" ? "وكيل" : "مستخدم"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm">حالة التوثيق</Label>
                <Badge variant={user?.verified ? "default" : "destructive"} className="text-xs px-2 py-1">
                  {user?.verified ? "موثق" : "غير موثق"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إعدادات الإشعارات */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <CardTitle className="text-sm sm:text-base">إعدادات الإشعارات</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              تخصيص تفضيلات الإشعارات
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="email-notifications" className="text-xs sm:text-sm">إشعارات البريد الإلكتروني</Label>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    تلقي الإشعارات عبر البريد الإلكتروني
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(value) => handleNotificationChange('email', value)}
                  className="scale-75 sm:scale-100"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="push-notifications" className="text-xs sm:text-sm">إشعارات فورية</Label>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    تلقي الإشعارات الفورية في المتصفح
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notifications.push}
                  onCheckedChange={(value) => handleNotificationChange('push', value)}
                  className="scale-75 sm:scale-100"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="transfer-notifications" className="text-xs sm:text-sm">إشعارات التحويلات</Label>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    تلقي إشعارات عند التحويلات المالية
                  </p>
                </div>
                <Switch
                  id="transfer-notifications"
                  checked={notifications.transfers}
                  onCheckedChange={(value) => handleNotificationChange('transfers', value)}
                  className="scale-75 sm:scale-100"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="marketing-notifications" className="text-xs sm:text-sm">إشعارات تسويقية</Label>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    تلقي إشعارات حول العروض والخدمات الجديدة
                  </p>
                </div>
                <Switch
                  id="marketing-notifications"
                  checked={notifications.marketing}
                  onCheckedChange={(value) => handleNotificationChange('marketing', value)}
                  className="scale-75 sm:scale-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إعدادات الإشعارات المحمولة */}
        <PushNotificationsSettings />

        {/* إعدادات التطبيق */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              <CardTitle className="text-sm sm:text-base">إعدادات التطبيق</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label className="text-xs sm:text-sm">اللغة</Label>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    لغة واجهة التطبيق
                  </p>
                </div>
                <Badge variant="outline" className="text-xs px-2 py-1">العربية</Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label className="text-xs sm:text-sm">المنطقة الزمنية</Label>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    المنطقة الزمنية المحلية
                  </p>
                </div>
                <Badge variant="outline" className="text-xs px-2 py-1">طرابلس (GMT+2)</Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label className="text-xs sm:text-sm">العملة الافتراضية</Label>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    العملة المعروضة افتراضياً
                  </p>
                </div>
                <Badge variant="outline" className="text-xs px-2 py-1">الدينار الليبي (LYD)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الأمان */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              <CardTitle className="text-sm sm:text-base">الأمان والخصوصية</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-xs sm:text-sm h-8 sm:h-10">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                    تغيير كلمة المرور
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>تغيير كلمة المرور</DialogTitle>
                    <DialogDescription>
                      أدخل كلمة المرور الحالية وكلمة المرور الجديدة
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">كلمة المرور الحالية</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                disabled={isChangingPassword || !canChangePassword}
                                className="text-sm"
                                data-testid="input-current-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">كلمة المرور الجديدة</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                disabled={isChangingPassword || !canChangePassword}
                                className="text-sm"
                                data-testid="input-new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">تأكيد كلمة المرور الجديدة</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                disabled={isChangingPassword || !canChangePassword}
                                className="text-sm"
                                data-testid="input-confirm-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsPasswordDialogOpen(false);
                            passwordForm.reset();
                          }}
                          className="flex-1"
                          disabled={isChangingPassword || !canChangePassword}
                          data-testid="button-cancel-password"
                        >
                          إلغاء
                        </Button>
                        <Button
                          type="submit"
                          disabled={isChangingPassword || !canChangePassword}
                          className="flex-1"
                          data-testid="button-submit-password"
                        >
                          {isChangingPassword ? "جاري التحديث..." : "تغيير كلمة المرور"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* المصادقة الثنائية */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <Label className="text-xs sm:text-sm font-medium">المصادقة الثنائية</Label>
                  </div>
                  <Badge variant={twoFAStatus?.isEnabled ? "default" : "outline"} className="text-xs">
                    {twoFAStatus?.isEnabled ? "مفعلة" : "معطلة"}
                  </Badge>
                </div>
                
                {twoFAStatus?.isEnabled ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIs2FADisableDialogOpen(true)}
                    className="w-full justify-start text-xs sm:text-sm h-8 sm:h-10"
                    data-testid="button-disable-2fa"
                  >
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                    إلغاء تفعيل المصادقة الثنائية
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handle2FASetup}
                    disabled={setup2FAMutation.isPending}
                    className="w-full justify-start text-xs sm:text-sm h-8 sm:h-10"
                    data-testid="button-setup-2fa"
                  >
                    <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                    {setup2FAMutation.isPending ? "جاري الإعداد..." : "تفعيل المصادقة الثنائية"}
                  </Button>
                )}
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setIsLoginSessionsDialogOpen(true)}
                className="w-full justify-start text-xs sm:text-sm h-8 sm:h-10"
                data-testid="button-view-login-sessions"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                عرض جلسات تسجيل الدخول
              </Button>
              
              <Separator />
              
              <Button variant="destructive" className="w-full text-xs sm:text-sm h-8 sm:h-10">
                حذف الحساب
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نافذة إعداد المصادقة الثنائية */}
      <Dialog open={is2FASetupDialogOpen} onOpenChange={setIs2FASetupDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              إعداد المصادقة الثنائية
            </DialogTitle>
            <DialogDescription>
              اتبع الخطوات التالية لتفعيل المصادقة الثنائية على حسابك
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* الخطوة 1: مسح QR Code */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <h3 className="font-semibold">امسح رمز QR باستخدام تطبيق المصادقة</h3>
              </div>
              
              {qrCode && (
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-white p-4 rounded-lg border">
                    <img src={qrCode} alt="QR Code للمصادقة الثنائية" className="w-48 h-48" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      أو أدخل المفتاح يدوياً:
                    </p>
                    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded font-mono text-sm">
                      <span className="break-all">{manualEntryKey}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(manualEntryKey)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* الخطوة 2: التحقق من الرمز */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <h3 className="font-semibold">أدخل رمز التحقق من التطبيق</h3>
              </div>
              
              <Form {...enable2FAForm}>
                <form onSubmit={enable2FAForm.handleSubmit(handle2FAEnable)} className="space-y-4">
                  <FormField
                    control={enable2FAForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رمز التحقق (6 أرقام)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="123456"
                            maxLength={6}
                            className="text-center font-mono text-lg tracking-widest"
                            disabled={enable2FAMutation.isPending}
                            data-testid="input-2fa-token"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIs2FASetupDialogOpen(false);
                        enable2FAForm.reset();
                      }}
                      className="flex-1"
                      disabled={enable2FAMutation.isPending}
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={enable2FAMutation.isPending}
                      className="flex-1"
                      data-testid="button-confirm-2fa"
                    >
                      {enable2FAMutation.isPending ? "جاري التفعيل..." : "تفعيل المصادقة الثنائية"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* رموز النسخ الاحتياطي */}
            {backupCodes.length > 0 && (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>رموز النسخ الاحتياطي</AlertTitle>
                  <AlertDescription>
                    احفظ هذه الرموز في مكان آمن. يمكنك استخدامها للدخول إذا فقدت هاتفك.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-100 p-2 rounded font-mono text-sm">
                      <span className="flex-1">{code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code, index)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedCodes[index] ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة إلغاء تفعيل المصادقة الثنائية */}
      <Dialog open={is2FADisableDialogOpen} onOpenChange={setIs2FADisableDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              إلغاء تفعيل المصادقة الثنائية
            </DialogTitle>
            <DialogDescription>
              أدخل كلمة المرور الحالية ورمز التحقق لإلغاء تفعيل المصادقة الثنائية
            </DialogDescription>
          </DialogHeader>

          <Form {...disable2FAForm}>
            <form onSubmit={disable2FAForm.handleSubmit(handle2FADisable)} className="space-y-4">
              <FormField
                control={disable2FAForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور الحالية</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        disabled={disable2FAMutation.isPending}
                        data-testid="input-2fa-disable-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={disable2FAForm.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز التحقق من التطبيق أو رمز النسخ الاحتياطي</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123456"
                        className="text-center font-mono"
                        disabled={disable2FAMutation.isPending}
                        data-testid="input-2fa-disable-token"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIs2FADisableDialogOpen(false);
                    disable2FAForm.reset();
                  }}
                  className="flex-1"
                  disabled={disable2FAMutation.isPending}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={disable2FAMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-disable-2fa"
                >
                  {disable2FAMutation.isPending ? "جاري الإلغاء..." : "إلغاء التفعيل"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* نافذة جلسات تسجيل الدخول */}
      <Dialog open={isLoginSessionsDialogOpen} onOpenChange={setIsLoginSessionsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              جلسات تسجيل الدخول
            </DialogTitle>
            <DialogDescription>
              عرض آخر محاولات تسجيل الدخول لحسابك
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingLoginSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">جاري تحميل جلسات تسجيل الدخول...</p>
              </div>
            ) : loginSessions && loginSessions.sessions && loginSessions.sessions.length > 0 ? (
              <>
                {/* ملخص الإحصائيات */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{loginSessions.successfulLogins}</div>
                    <div className="text-sm text-muted-foreground">نجح</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{loginSessions.failedAttempts}</div>
                    <div className="text-sm text-muted-foreground">فشل</div>
                  </div>
                  <div className="text-center md:col-span-1 col-span-2">
                    <div className="text-2xl font-bold text-blue-600">{loginSessions.totalCount}</div>
                    <div className="text-sm text-muted-foreground">إجمالي المحاولات</div>
                  </div>
                </div>

                {/* قائمة الجلسات */}
                <div className="space-y-2">
                  {loginSessions.sessions.map((session: any, index: number) => (
                    <div key={session.id || index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${session.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="font-medium text-sm">
                            {session.success ? '✅ تسجيل دخول ناجح' : '❌ محاولة فاشلة'}
                          </span>
                          {session.isCurrent && (
                            <Badge variant="default" className="text-xs">الجلسة الحالية</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.timestamp).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <strong>الموقع:</strong> {session.location.city}, {session.location.country}
                        </div>
                        <div>
                          <strong>عنوان IP:</strong> {session.ipAddress}
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <strong>الجهاز:</strong> {session.device.platform || 'غير معروف'}
                        </div>
                        <div className="col-span-1 md:col-span-2 truncate">
                          <strong>المتصفح:</strong> 
                          <span className="text-xs ml-1">
                            {session.device.userAgent.length > 100 
                              ? session.device.userAgent.substring(0, 100) + '...' 
                              : session.device.userAgent}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {loginSessions.lastLogin && (
                  <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                    آخر تسجيل دخول ناجح: {new Date(loginSessions.lastLogin).toLocaleString('ar-EG')}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">لا توجد جلسات تسجيل دخول بعد</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsLoginSessionsDialogOpen(false)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}