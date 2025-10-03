import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-ar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { User, Lock, Settings, Eye, EyeOff, Globe, Moon, Sun, Monitor, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Guard } from "@/components/Guard";
import { 
  updateUserProfileSchema, 
  changePasswordSchema, 
  insertUserSettingsSchema,
  type UpdateUserProfile,
  type ChangePassword,
  type InsertUserSettings,
  type UserSettings,
  type User as UserType
} from "@shared/schema";

interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  avatarUrl?: string;
  settings?: UserSettings;
}

export default function UserSettingsPage() {
  return (
    <Guard page="user_settings">
      <UserSettingsContent />
    </Guard>
  );
}

function UserSettingsContent() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch user data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/me'],
    enabled: true
  });

  // Profile form
  const profileForm = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      city: ""
    }
  });

  // Password form
  const passwordForm = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  // Settings form
  const settingsForm = useForm<InsertUserSettings>({
    resolver: zodResolver(insertUserSettingsSchema),
    defaultValues: {
      userId: 0,
      language: "ar",
      theme: "auto",
      timezone: "Africa/Tripoli",
      baseCurrency: "LYD",
      notifications: {
        email: true,
        push: true,
        security: true,
        marketing: false
      }
    }
  });

  // Update forms when data loads
  useEffect(() => {
    if (userData) {
      profileForm.reset({
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        city: userData.city || ""
      });

      if (userData.settings) {
        settingsForm.reset({
          userId: userData.id,
          language: userData.settings.language || "ar",
          theme: userData.settings.theme || "auto",
          timezone: userData.settings.timezone || "Africa/Tripoli",
          baseCurrency: userData.settings.baseCurrency || "LYD",
          notifications: userData.settings.notifications || {
            email: true,
            push: true,
            security: true,
            marketing: false
          }
        });
      }
    }
  }, [userData]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      const response = await apiRequest('/api/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث معلومات الملف الشخصي بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الملف الشخصي",
        variant: "destructive"
      });
    }
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePassword) => {
      const response = await apiRequest('/api/me/password', {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تغيير كلمة المرور بنجاح"
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تغيير كلمة المرور",
        variant: "destructive"
      });
    }
  });

  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: InsertUserSettings) => {
      const response = await apiRequest('/api/me/settings', {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات الحساب بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الإعدادات",
        variant: "destructive"
      });
    }
  });

  const onProfileSubmit = (data: UpdateUserProfile) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: ChangePassword) => {
    changePasswordMutation.mutate(data);
  };

  const onSettingsSubmit = (data: InsertUserSettings) => {
    updateSettingsMutation.mutate(data);
  };

  const handleAvatarUpload = (avatarUrl: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    toast({
      title: "تم التحديث",
      description: "تم تحديث صورتك الشخصية بنجاح"
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Back Button even during loading */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            العودة إلى لوحة التحكم
          </Button>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation('/dashboard')}
          className="flex items-center gap-2 mb-4"
          style={{ 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6',
            padding: '8px 16px',
            borderRadius: '6px'
          }}
        >
          <ArrowRight className="w-4 h-4" />
          العودة إلى لوحة التحكم
        </Button>
        
        <h1 className="text-3xl font-bold">إعدادات الحساب</h1>
        <p className="text-muted-foreground mt-2">
          إدارة معلومات حسابك وتفضيلاتك
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            الأمان وكلمة المرور
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            التفضيلات
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الصورة الشخصية</CardTitle>
              <CardDescription>
                قم بتحديث صورتك الشخصية. يُفضل استخدام صورة مربعة بدقة عالية.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ObjectUploader
                currentImageUrl={userData?.avatarUrl}
                onUploadComplete={handleAvatarUpload}
                maxSize={2 * 1024 * 1024} // 2MB
                accept="image/jpeg,image/png,image/webp"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
              <CardDescription>
                قم بتحديث معلومات ملفك الشخصي هنا.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الكامل</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="أدخل اسمك الكامل" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="أدخل رقم هاتفك" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدينة</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="أدخل مدينتك" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateProfileMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تغيير كلمة المرور</CardTitle>
              <CardDescription>
                تأكد من استخدام كلمة مرور قوية ومعقدة لحماية حسابك.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور الحالية</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showCurrentPassword ? "text" : "password"}
                              placeholder="أدخل كلمة المرور الحالية"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
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
                        <FormLabel>كلمة المرور الجديدة</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showNewPassword ? "text" : "password"}
                              placeholder="أدخل كلمة المرور الجديدة"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
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
                        <FormLabel>تأكيد كلمة المرور</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="أعد إدخال كلمة المرور الجديدة"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={changePasswordMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {changePasswordMutation.isPending ? "جاري التحديث..." : "تغيير كلمة المرور"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تفضيلات العرض</CardTitle>
              <CardDescription>
                قم بتخصيص تجربة الاستخدام وفقاً لتفضيلاتك.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                  <FormField
                    control={settingsForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          اللغة
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر اللغة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ar">العربية</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نمط العرض</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نمط العرض" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">
                              <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4" />
                                فاتح
                              </div>
                            </SelectItem>
                            <SelectItem value="dark">
                              <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4" />
                                مظلم
                              </div>
                            </SelectItem>
                            <SelectItem value="auto">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4" />
                                تلقائي (حسب النظام)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المنطقة الزمنية</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المنطقة الزمنية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Africa/Tripoli">طرابلس، ليبيا</SelectItem>
                            <SelectItem value="Africa/Cairo">القاهرة، مصر</SelectItem>
                            <SelectItem value="Asia/Dubai">دبي، الإمارات</SelectItem>
                            <SelectItem value="Europe/Istanbul">اسطنبول، تركيا</SelectItem>
                            <SelectItem value="Europe/London">لندن، المملكة المتحدة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="baseCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العملة الأساسية</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر العملة الأساسية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LYD">دينار ليبي (LYD)</SelectItem>
                            <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                            <SelectItem value="EUR">يورو (EUR)</SelectItem>
                            <SelectItem value="GBP">جنيه إسترليني (GBP)</SelectItem>
                            <SelectItem value="TRY">ليرة تركية (TRY)</SelectItem>
                            <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                            <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                            <SelectItem value="TND">دينار تونسي (TND)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={updateSettingsMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateSettingsMutation.isPending ? "جاري التحديث..." : "حفظ التفضيلات"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
              <CardDescription>
                قم بإدارة تفضيلات الإشعارات الخاصة بك.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">إشعارات البريد الإلكتروني</Label>
                  <p className="text-sm text-muted-foreground">
                    تلقي إشعارات مهمة عبر البريد الإلكتروني
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settingsForm.watch("notifications.email")}
                  onCheckedChange={(checked) => 
                    settingsForm.setValue("notifications.email", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">الإشعارات الفورية</Label>
                  <p className="text-sm text-muted-foreground">
                    تلقي إشعارات فورية للأنشطة المهمة
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settingsForm.watch("notifications.push")}
                  onCheckedChange={(checked) => 
                    settingsForm.setValue("notifications.push", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="security-notifications">إشعارات الأمان</Label>
                  <p className="text-sm text-muted-foreground">
                    تلقي تنبيهات حول أنشطة الأمان المهمة
                  </p>
                </div>
                <Switch
                  id="security-notifications"
                  checked={settingsForm.watch("notifications.security")}
                  onCheckedChange={(checked) => 
                    settingsForm.setValue("notifications.security", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-notifications">الإشعارات التسويقية</Label>
                  <p className="text-sm text-muted-foreground">
                    تلقي عروض وأخبار المنتج
                  </p>
                </div>
                <Switch
                  id="marketing-notifications"
                  checked={settingsForm.watch("notifications.marketing")}
                  onCheckedChange={(checked) => 
                    settingsForm.setValue("notifications.marketing", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}