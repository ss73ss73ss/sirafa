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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Globe, Trash2, Edit, Building2 } from "lucide-react";

interface Country {
  id: number;
  name: string;
  code: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

interface AgentOffice {
  id: number;
  agentId: number;
  countryCode: string;
  city: string;
  officeCode: string;
  officeName: string;
  contactInfo: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

// قائمة الدول المتاحة
const availableCountries = [
  { name: "الولايات المتحدة الأمريكية", code: "US" },
  { name: "المملكة المتحدة", code: "GB" },
  { name: "ألمانيا", code: "DE" },
  { name: "فرنسا", code: "FR" },
  { name: "إيطاليا", code: "IT" },
  { name: "إسبانيا", code: "ES" },
  { name: "تركيا", code: "TR" },
  { name: "مصر", code: "EG" },
  { name: "تونس", code: "TN" },
  { name: "الإمارات العربية المتحدة", code: "AE" },
  { name: "السعودية", code: "SA" },
  { name: "الكويت", code: "KW" },
  { name: "قطر", code: "QA" },
  { name: "البحرين", code: "BH" },
  { name: "عمان", code: "OM" },
  { name: "الأردن", code: "JO" },
  { name: "لبنان", code: "LB" },
  { name: "سوريا", code: "SY" },
  { name: "العراق", code: "IQ" },
  { name: "المغرب", code: "MA" },
  { name: "الجزائر", code: "DZ" },
  { name: "السودان", code: "SD" },
  { name: "كندا", code: "CA" },
  { name: "أستراليا", code: "AU" },
  { name: "اليابان", code: "JP" },
  { name: "الصين", code: "CN" },
  { name: "الهند", code: "IN" },
  { name: "روسيا", code: "RU" },
  { name: "البرازيل", code: "BR" },
  { name: "المكسيك", code: "MX" }
];

// قائمة العملات المتاحة
const availableCurrencies = [
  { name: "الدولار الأمريكي", code: "USD" },
  { name: "الجنيه الإسترليني", code: "GBP" },
  { name: "اليورو", code: "EUR" },
  { name: "الليرة التركية", code: "TRY" },
  { name: "الجنيه المصري", code: "EGP" },
  { name: "الدينار التونسي", code: "TND" },
  { name: "الدرهم الإماراتي", code: "AED" },
  { name: "الريال السعودي", code: "SAR" },
  { name: "الدينار الكويتي", code: "KWD" },
  { name: "الريال القطري", code: "QAR" },
  { name: "الدينار البحريني", code: "BHD" },
  { name: "الريال العماني", code: "OMR" },
  { name: "الدينار الأردني", code: "JOD" },
  { name: "الليرة اللبنانية", code: "LBP" },
  { name: "الدرهم المغربي", code: "MAD" },
  { name: "الدينار الجزائري", code: "DZD" },
  { name: "الجنيه السوداني", code: "SDG" },
  { name: "الدولار الكندي", code: "CAD" },
  { name: "الدولار الأسترالي", code: "AUD" },
  { name: "الين الياباني", code: "JPY" },
  { name: "اليوان الصيني", code: "CNY" },
  { name: "الروبية الهندية", code: "INR" },
  { name: "الروبل الروسي", code: "RUB" },
  { name: "الريال البرازيلي", code: "BRL" },
  { name: "البيزو المكسيكي", code: "MXN" }
];

const countrySchema = z.object({
  name: z.string().min(1, "يرجى اختيار الدولة"),
  code: z.string().min(1, "يرجى اختيار الدولة"),
  currency: z.string().min(1, "يرجى اختيار العملة"),
});

const officeSchema = z.object({
  agentId: z.string().min(1, "يجب اختيار مستخدم"),
  countryCode: z.string().min(2, "يرجى اختيار الدولة"),
  city: z.string().min(2, "يرجى إدخال اسم المدينة"),
  officeCode: z.string().min(3, "يجب أن يكون رمز المكتب 3 أحرف على الأقل"),
  officeName: z.string().min(3, "يرجى إدخال اسم المكتب"),
  contactInfo: z.string().min(5, "يرجى إدخال معلومات الاتصال"),
  address: z.string().min(10, "يرجى إدخال العنوان الكامل"),
});

type CountryFormValues = z.infer<typeof countrySchema>;
type OfficeFormValues = z.infer<typeof officeSchema>;

export default function AdminCountriesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false);
  const [isOfficeDialogOpen, setIsOfficeDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"countries" | "offices">("countries");

  // التحقق من صلاحيات الإدارة
  useEffect(() => {
    if (user && user.type !== 'admin') {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة متاحة للمدراء فقط",
        variant: "destructive",
      });
      setLocation('/dashboard');
    }
  }, [user, setLocation, toast]);

  // نماذج البيانات
  const countryForm = useForm<CountryFormValues>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: "",
      code: "",
      currency: "",
    },
  });

  const [selectedCountry, setSelectedCountry] = useState("");

  const officeForm = useForm<OfficeFormValues>({
    resolver: zodResolver(officeSchema),
    defaultValues: {
      agentId: "",
      countryCode: "",
      city: "",
      officeCode: "",
      officeName: "",
      contactInfo: "",
      address: "",
    },
  });

  // جلب الدول
  const { data: countries = [], isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ['/api/admin/countries'],
    queryFn: async () => {
      const res = await apiRequest('/api/admin/countries');
      return await res.json();
    }
  });

  // جلب مكاتب الوكلاء
  const { data: offices = [], isLoading: officesLoading } = useQuery<AgentOffice[]>({
    queryKey: ['/api/admin/agent-offices'],
    queryFn: async () => {
      const res = await apiRequest('/api/admin/agent-offices');
      return await res.json();
    }
  });

  // جلب قائمة المستخدمين الذين لديهم حسابات مكاتب صرافة
  const { data: exchangeUsers = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/users/exchange-office-users"],
    queryFn: async () => {
      console.log("Fetching exchange office users...");
      try {
        const res = await apiRequest("/api/users/exchange-office-users");
        const data = await res.json();
        console.log("Exchange office users data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching exchange users:", error);
        throw error;
      }
    },
  });

  // طباعة معلومات المستخدمين للتشخيص
  console.log("Exchange users state:", { exchangeUsers, usersLoading, usersError });

  // إضافة دولة جديدة
  const addCountryMutation = useMutation({
    mutationFn: async (data: CountryFormValues) => {
      const res = await apiRequest('/api/admin/countries', 'POST', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/countries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/countries'] });
      setIsCountryDialogOpen(false);
      countryForm.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الدولة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة الدولة",
        variant: "destructive",
      });
    },
  });

  // إضافة مكتب وكيل جديد
  const addOfficeMutation = useMutation({
    mutationFn: async (data: OfficeFormValues) => {
      const res = await apiRequest('/api/admin/agent-offices', 'POST', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agent-offices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agent-offices'] });
      setIsOfficeDialogOpen(false);
      officeForm.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة مكتب الوكيل بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة مكتب الوكيل",
        variant: "destructive",
      });
    },
  });

  // حذف دولة
  const deleteCountryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/admin/countries/${id}`, 'DELETE');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/countries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/countries'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الدولة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف الدولة",
        variant: "destructive",
      });
    },
  });

  // حذف مكتب وكيل
  const deleteOfficeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/admin/agent-offices/${id}`, 'DELETE');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agent-offices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agent-offices'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف مكتب الوكيل بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف مكتب الوكيل",
        variant: "destructive",
      });
    },
  });

  const onSubmitCountry = (data: CountryFormValues) => {
    addCountryMutation.mutate(data);
  };

  const onSubmitOffice = (data: OfficeFormValues) => {
    addOfficeMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الدول ومكاتب الوكلاء</h1>
          <p className="text-muted-foreground mt-2">
            إضافة وإدارة الدول المتاحة للتحويلات الدولية ومكاتب الوكلاء
          </p>
        </div>
      </div>

      {/* تبويبات */}
      <div className="flex space-x-2 space-x-reverse border-b">
        <Button
          variant={selectedTab === "countries" ? "default" : "ghost"}
          onClick={() => setSelectedTab("countries")}
        >
          <Globe className="h-4 w-4 ml-2" />
          الدول
        </Button>
        <Button
          variant={selectedTab === "offices" ? "default" : "ghost"}
          onClick={() => setSelectedTab("offices")}
        >
          <Building2 className="h-4 w-4 ml-2" />
          مكاتب الوكلاء
        </Button>
      </div>

      {/* تبويب الدول */}
      {selectedTab === "countries" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>إدارة الدول</CardTitle>
                <CardDescription>
                  الدول المتاحة للتحويلات الدولية
                </CardDescription>
              </div>
              <Dialog open={isCountryDialogOpen} onOpenChange={setIsCountryDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة دولة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة دولة جديدة</DialogTitle>
                    <DialogDescription>
                      أضف دولة جديدة لتصبح متاحة للتحويلات الدولية
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...countryForm}>
                    <form onSubmit={countryForm.handleSubmit(onSubmitCountry)} className="space-y-4">
                      <FormField
                        control={countryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اختر الدولة</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                const country = availableCountries.find(c => c.name === value);
                                if (country) {
                                  field.onChange(value);
                                  countryForm.setValue("code", country.code);
                                  setSelectedCountry(country.code);
                                }
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الدولة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCountries.map((country) => (
                                  <SelectItem key={country.code} value={country.name}>
                                    {country.name} ({country.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={countryForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اختر العملة</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر العملة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCurrencies.map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.name} ({currency.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2 space-x-reverse">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCountryDialogOpen(false)}
                        >
                          إلغاء
                        </Button>
                        <Button type="submit" disabled={addCountryMutation.isPending}>
                          {addCountryMutation.isPending && (
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          )}
                          إضافة
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {countriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الدولة</TableHead>
                    <TableHead>الرمز</TableHead>
                    <TableHead>العملة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإضافة</TableHead>
                    <TableHead>العمليات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countries.map((country) => (
                    <TableRow key={country.id}>
                      <TableCell className="font-medium">{country.name}</TableCell>
                      <TableCell>{country.code}</TableCell>
                      <TableCell>{country.currency}</TableCell>
                      <TableCell>
                        <Badge variant={country.isActive ? "default" : "secondary"}>
                          {country.isActive ? "نشطة" : "غير نشطة"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(country.createdAt).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCountryMutation.mutate(country.id)}
                          disabled={deleteCountryMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* تبويب مكاتب الوكلاء */}
      {selectedTab === "offices" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>إدارة مكاتب الوكلاء</CardTitle>
                <CardDescription>
                  مكاتب الوكلاء المتاحة لاستقبال التحويلات الدولية
                </CardDescription>
              </div>
              <Dialog open={isOfficeDialogOpen} onOpenChange={setIsOfficeDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مكتب
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>إضافة مكتب وكيل جديد</DialogTitle>
                    <DialogDescription>
                      أضف مكتب وكيل جديد لاستقبال التحويلات الدولية
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...officeForm}>
                    <form onSubmit={officeForm.handleSubmit(onSubmitOffice)} className="space-y-4">
                      <FormField
                        control={officeForm.control}
                        name="agentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المستخدم صاحب المكتب</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر المستخدم" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {exchangeUsers && exchangeUsers.length > 0 ? (
                                  exchangeUsers.map((user: any) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      {user.fullName} - {user.accountNumber} ({user.type === 'agent' ? 'وكيل' : 'مدير'})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-users" disabled>
                                    لا توجد مستخدمين متاحين
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={officeForm.control}
                          name="countryCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اختر الدولة</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر الدولة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableCountries.map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                                      {country.name} ({country.code})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={officeForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المدينة</FormLabel>
                              <FormControl>
                                <Input placeholder="مثال: نيويورك" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={officeForm.control}
                          name="officeCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رمز المكتب</FormLabel>
                              <FormControl>
                                <Input placeholder="مثال: NYC001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={officeForm.control}
                          name="officeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم المكتب</FormLabel>
                              <FormControl>
                                <Input placeholder="مثال: مكتب نيويورك للصرافة" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={officeForm.control}
                        name="contactInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>معلومات الاتصال</FormLabel>
                            <FormControl>
                              <Input placeholder="مثال: +1-555-0123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={officeForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان</FormLabel>
                            <FormControl>
                              <Input placeholder="مثال: 123 Main St, New York, NY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2 space-x-reverse">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsOfficeDialogOpen(false)}
                        >
                          إلغاء
                        </Button>
                        <Button type="submit" disabled={addOfficeMutation.isPending}>
                          {addOfficeMutation.isPending && (
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          )}
                          إضافة
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {officesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم المكتب</TableHead>
                    <TableHead>رمز المكتب</TableHead>
                    <TableHead>الدولة</TableHead>
                    <TableHead>المدينة</TableHead>
                    <TableHead>الاتصال</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>العمليات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offices.map((office) => (
                    <TableRow key={office.id}>
                      <TableCell className="font-medium">{office.officeName}</TableCell>
                      <TableCell>{office.officeCode}</TableCell>
                      <TableCell>{office.countryCode}</TableCell>
                      <TableCell>{office.city}</TableCell>
                      <TableCell>{office.contactInfo}</TableCell>
                      <TableCell>
                        <Badge variant={office.isActive ? "default" : "secondary"}>
                          {office.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteOfficeMutation.mutate(office.id)}
                          disabled={deleteOfficeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}