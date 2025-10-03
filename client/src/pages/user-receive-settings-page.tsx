import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Edit, Globe, Percent } from "lucide-react";

interface Country {
  id: number;
  name: string;
  code: string;
  currency: string;
}

interface UserReceiveSetting {
  id: number;
  userId: number;
  countryId: number;
  commissionRate: string;
  isActive: boolean;
  createdAt: string;
  countryName?: string;
  countryCurrency?: string;
}

const settingsSchema = z.object({
  countryId: z.string().min(1, "يرجى اختيار الدولة"),
  commissionRate: z.string()
    .min(1, "يرجى إدخال نسبة العمولة")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, "نسبة العمولة يجب أن تكون بين 0 و 100"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function UserReceiveSettingsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // حماية الصفحة - يجب أن يكون المستخدم مسجل دخول
  useEffect(() => {
    if (!user) {
      setLocation('/auth');
    }
  }, [user, setLocation]);

  // جلب الدول المتاحة
  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ['/api/countries'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/countries');
      return await response.json();
    },
  });

  // جلب إعدادات المستخدم الحالية
  const { data: settings = [], isLoading } = useQuery<UserReceiveSetting[]>({
    queryKey: ['/api/user-receive-settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user-receive-settings');
      return await response.json();
    },
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      countryId: "",
      commissionRate: "",
    },
  });

  // إضافة أو تحديث الإعدادات
  const settingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData & { id?: number }) => {
      const endpoint = data.id 
        ? `/api/user-receive-settings/${data.id}`
        : '/api/user-receive-settings';
      const method = data.id ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, endpoint, {
        countryId: parseInt(data.countryId),
        commissionRate: parseFloat(data.commissionRate),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-receive-settings'] });
      toast({
        title: "نجح الحفظ",
        description: editingId ? "تم تحديث الإعدادات بنجاح" : "تم إضافة الإعدادات بنجاح",
      });
      form.reset();
      setEditingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  // حذف الإعدادات
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/user-receive-settings/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-receive-settings'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الإعدادات بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف الإعدادات",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    setIsSubmitting(true);
    try {
      await settingsMutation.mutateAsync({
        ...data,
        ...(editingId && { id: editingId }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (setting: UserReceiveSetting) => {
    setEditingId(setting.id);
    form.setValue("countryId", setting.countryId.toString());
    form.setValue("commissionRate", setting.commissionRate);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const getCountryName = (countryId: number) => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : "غير محدد";
  };

  const getCountryCurrency = (countryId: number) => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.currency : "";
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إعدادات استقبال الحوالات</h1>
        <p className="text-gray-600">
          قم بإعداد الدول التي تستقبل فيها الحوالات ونسب العمولة الخاصة بك
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* نموذج الإضافة/التعديل */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {editingId ? "تعديل الإعدادات" : "إضافة إعدادات جديدة"}
            </CardTitle>
            <CardDescription>
              اختر الدولة وحدد نسبة العمولة التي تريد استلامها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدولة</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الدولة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id.toString()}>
                              {country.name} ({country.currency})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نسبة العمولة (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="مثال: 2.5"
                            className="pr-8"
                          />
                          <Percent className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : editingId ? (
                      <Edit className="h-4 w-4 ml-2" />
                    ) : (
                      <Plus className="h-4 w-4 ml-2" />
                    )}
                    {editingId ? "تحديث" : "إضافة"}
                  </Button>
                  
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      إلغاء
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* قائمة الإعدادات الحالية */}
        <Card>
          <CardHeader>
            <CardTitle>الإعدادات الحالية</CardTitle>
            <CardDescription>
              الدول ونسب العمولة المحددة حالياً
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : settings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لم تقم بإضافة أي إعدادات بعد
              </div>
            ) : (
              <div className="space-y-3">
                {settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {getCountryName(setting.countryId)}
                      </div>
                      <div className="text-sm text-gray-500">
                        العمولة: {setting.commissionRate}% • العملة: {getCountryCurrency(setting.countryId)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={setting.isActive ? "default" : "secondary"}>
                        {setting.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(setting)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف إعدادات {getCountryName(setting.countryId)}؟
                              لن تتمكن من التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(setting.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* معلومات إضافية */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ملاحظات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• نسبة العمولة هي النسبة المئوية التي ستحصل عليها من كل حوالة تستلمها</p>
          <p>• يمكنك إضافة عدة دول مختلفة بنسب عمولة مختلفة</p>
          <p>• سيتم عرض إعداداتك في صفحة التحويل بين المكاتب للمرسلين</p>
          <p>• يمكنك تعديل أو حذف الإعدادات في أي وقت</p>
        </CardContent>
      </Card>
    </div>
  );
}