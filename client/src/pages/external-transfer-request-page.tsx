import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Clock, Globe, MapPin, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import type { Country, City, ExternalTransferRequest, UpgradeRequest, AgentOffice } from "@shared/schema";
import { externalTransferRequestSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const CURRENCIES = [
  { value: "USD", label: "دولار أمريكي (USD)" },
  { value: "EUR", label: "يورو (EUR)" },
  { value: "GBP", label: "جنيه إسترليني (GBP)" },
  { value: "TRY", label: "ليرة تركية (TRY)" },
  { value: "AED", label: "درهم إماراتي (AED)" },
  { value: "EGP", label: "جنيه مصري (EGP)" },
  { value: "TND", label: "دينار تونسي (TND)" }
];

// Schema for form validation
const formSchema = z.object({
  countryId: z.number().min(1, "اختيار الدولة مطلوب"),
  cityId: z.number().optional(),
  cityNameManual: z.string().optional(),
  message: z.string().optional(),
  requestedLimits: z.object({
    daily: z.number().min(100, "الحد اليومي يجب أن يكون 100 على الأقل").max(100000, "الحد اليومي لا يمكن أن يتجاوز 100,000"),
    monthly: z.number().min(1000, "الحد الشهري يجب أن يكون 1,000 على الأقل").max(1000000, "الحد الشهري لا يمكن أن يتجاوز 1,000,000"),
    currencies: z.array(z.string()).min(1, "يجب اختيار عملة واحدة على الأقل"),
  }),
}).refine(
  (data) => data.cityId || (data.cityNameManual && data.cityNameManual.trim().length > 0),
  {
    message: "يجب اختيار مدينة من القائمة أو إدخال اسم المدينة يدوياً",
    path: ["cityId"]
  }
);

type FormData = z.infer<typeof formSchema>;

function ExternalTransferRequestPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countryId: undefined as any,
      cityId: undefined,
      cityNameManual: "",
      message: "",
      requestedLimits: {
        daily: 5000,
        monthly: 50000,
        currencies: ["USD"],
      },
    },
  });

  // Fetch current user info first
  const { data: currentUser } = useQuery<any>({
    queryKey: ['/api/user'],
  });

  // Set user's country and city when data is loaded
  useEffect(() => {
    if (currentUser?.countryId) {
      form.setValue('countryId', currentUser.countryId);
    }
    if (currentUser?.cityName || currentUser?.city) {
      form.setValue('cityNameManual', currentUser.cityName || currentUser.city);
    }
  }, [currentUser, form]);

  // Fetch user's existing upgrade requests
  const { data: userRequests = [] } = useQuery<UpgradeRequest[]>({
    queryKey: ['/api/upgrade/external-transfer/my-requests'],
  });

  // Fetch available agent offices (all international offices)
  const { data: agentOffices = [] } = useQuery<AgentOffice[]>({
    queryKey: ['/api/agent-offices', 'all'],
    queryFn: async () => {
      const res = await apiRequest('/api/agent-offices?all=true', 'GET');
      return res.json();
    }
  });

  // Check if user has a pending external transfer request
  const hasPendingRequest = userRequests.some(
    req => req.requestType === 'external_transfer' && req.status === 'pending'
  );

  // Check if user already has approved external transfer access
  const hasApprovedRequest = userRequests.some(
    req => req.requestType === 'external_transfer' && req.status === 'approved'
  ) || currentUser?.extTransferEnabled === true;

  // Get the pending request details if exists
  const pendingRequest = userRequests.find(
    req => req.requestType === 'external_transfer' && req.status === 'pending'
  );

  // Auto-enable manual city input when no cities are available for selected country
  useEffect(() => {
    if (currentUser?.countryId) {
      // Auto-set manual city mode since we're using pre-set city
      setIsManualCity(true);
    }
  }, [currentUser]);

  const [isManualCity, setIsManualCity] = useState(true); // Always manual for pre-set data

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('/api/upgrade/external-transfer/request', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تقديم الطلب بنجاح",
        description: "سيتم مراجعة طلبك خلال 24-48 ساعة",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/upgrade/external-transfer/my-requests'] });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تقديم الطلب",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  // If user already has approved access
  if (hasApprovedRequest) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl" dir="rtl">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/Dashboard")}
            className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-700 text-sm sm:text-base"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            العودة للوحة التحكم
          </Button>
        </div>
        
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              التحويل الخارجي مُفعل
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm sm:text-base">
                <strong>تهانينا!</strong>
                <br />
                خدمة التحويل الخارجي مُفعلة في حسابك. يمكنك الآن إجراء تحويلات خارجية بناءً على الحدود المعتمدة لحسابك.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has pending request
  if (hasPendingRequest) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl" dir="rtl">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/Dashboard")}
            className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-700 text-sm sm:text-base"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            العودة للوحة التحكم
          </Button>
        </div>
        
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              طلب قيد المراجعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm sm:text-base">
                <strong>طلبك تحت المراجعة</strong>
                <br />
                سيتم مراجعة طلبك خلال 24-48 ساعة من قبل الإدارة. 
                <br />
                لا يمكنك تقديم طلب جديد حتى يتم البت في الطلب الحالي.
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">تفاصيل الطلب الحالي:</h4>
              <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                <div>📅 <strong>تاريخ التقديم:</strong> {pendingRequest?.createdAt ? new Date(pendingRequest.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}</div>
                <div>🌍 <strong>الموقع المطلوب:</strong> {pendingRequest?.city || 'غير محدد'}</div>
                <div className="flex items-center gap-2">⏳ <strong>الحالة:</strong> <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">قيد المراجعة</Badge></div>
                {pendingRequest?.message && (
                  <div>💬 <strong>الرسالة:</strong> {pendingRequest.message}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0.5 sm:px-4 py-1 sm:py-8 max-w-4xl" dir="rtl">
      {/* زر العودة للوحة التحكم */}
      <div className="mb-1 sm:mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/Dashboard")}
          className="flex items-center gap-0.5 sm:gap-2 hover:bg-blue-50 dark:hover:bg-gray-700 text-[10px] sm:text-base h-5 sm:h-10 px-1.5 sm:px-4"
        >
          <ArrowLeft className="h-2 w-2 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">العودة للوحة التحكم</span>
          <span className="sm:hidden">عودة</span>
        </Button>
      </div>
      
      <Card>
        <CardHeader className="px-1.5 sm:px-6 pt-1.5 sm:pt-6 pb-1.5 sm:pb-4">
          <CardTitle className="flex items-center gap-0.5 sm:gap-2 text-xs sm:text-xl">
            <Globe className="h-2.5 w-2.5 sm:h-6 sm:w-6 text-blue-500" />
            <span className="hidden sm:inline">طلب تفعيل التحويل الخارجي</span>
            <span className="sm:hidden">طلب تحويل خارجي</span>
          </CardTitle>
          <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-2 hidden sm:block">
            قم بتقديم طلب لتفعيل خدمة التحويل الخارجي وتحديد حدود التحويل والدول المسموحة
          </p>
        </CardHeader>
        <CardContent className="px-1.5 sm:px-6 pb-1.5 sm:pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 sm:space-y-6">
              {/* Account Information */}
              <div className="space-y-1 sm:space-y-4">
                <h3 className="text-xs sm:text-lg font-semibold">معلومات الحساب</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-4">
                  <div>
                    <label className="text-[10px] sm:text-xs font-medium text-gray-700">رقم الحساب</label>
                    <Input 
                      value={currentUser?.accountNumber || "لم يتم تحديد رقم الحساب"} 
                      disabled 
                      className="bg-gray-50 text-[10px] sm:text-xs h-6 sm:h-10" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] sm:text-xs font-medium text-gray-700">رقم الهاتف</label>
                    <Input 
                      value={currentUser?.phone || currentUser?.email || "غير محدد"} 
                      disabled 
                      className="bg-gray-50 text-[10px] sm:text-xs h-6 sm:h-10" 
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location Information */}
              <div className="space-y-1 sm:space-y-4">
                <h3 className="text-xs sm:text-lg font-semibold flex items-center gap-0.5 sm:gap-1">
                  <MapPin className="h-2.5 w-2.5 sm:h-5 sm:w-5" />
                  معلومات الموقع
                </h3>
                
                <FormField
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-xs">الدولة المعتمدة</FormLabel>
                      <FormControl>
                        <Input 
                          value={currentUser?.countryName || "لم يتم تحديد الدولة"}
                          disabled 
                          className="bg-gray-50 h-6 sm:h-10 text-[10px] sm:text-xs" 
                        />
                      </FormControl>
                      <FormDescription className="text-xs hidden sm:block">
                        هذه هي الدولة المختارة عند التسجيل
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cityNameManual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-xs">المدينة المعتمدة</FormLabel>
                      <FormControl>
                        <Input 
                          value={currentUser?.cityName || currentUser?.city || "لم يتم تحديد المدينة"}
                          disabled 
                          className="bg-gray-50 h-6 sm:h-10 text-[10px] sm:text-xs" 
                        />
                      </FormControl>
                      <FormDescription className="text-xs hidden sm:block">
                        هذه هي المدينة المختارة عند التسجيل
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Transfer Limits */}
              <div className="space-y-1 sm:space-y-4">
                <h3 className="text-xs sm:text-lg font-semibold">حدود التحويل</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="requestedLimits.daily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] sm:text-xs">الحد اليومي</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="100"
                            max="100000"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="h-6 sm:h-10 text-[10px] sm:text-xs"
                            placeholder="5000"
                          />
                        </FormControl>
                        <FormDescription className="text-xs hidden sm:block">
                          100 - 100,000 دولار
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requestedLimits.monthly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] sm:text-xs">الحد الشهري</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1000"
                            max="1000000"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="h-6 sm:h-10 text-[10px] sm:text-xs"
                            placeholder="50000"
                          />
                        </FormControl>
                        <FormDescription className="text-xs hidden sm:block">
                          1,000 - 1,000,000 دولار
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Currencies */}
              <div className="space-y-1 sm:space-y-4">
                <h3 className="text-xs sm:text-lg font-semibold">العملات</h3>
                <FormField
                  control={form.control}
                  name="requestedLimits.currencies"
                  render={() => (
                    <FormItem>
                      <div className="mb-1 sm:mb-4">
                        <FormLabel className="text-[10px] sm:text-xs">اختر العملات</FormLabel>
                        <FormDescription className="text-[10px] sm:text-xs hidden sm:block">
                          يجب اختيار عملة واحدة على الأقل
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-0.5 sm:gap-4">
                        {CURRENCIES.map((currency) => (
                          <FormField
                            key={currency.value}
                            control={form.control}
                            name="requestedLimits.currencies"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-0.5 space-y-0 py-0.25">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(currency.value)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), currency.value]
                                        : (field.value || []).filter((value) => value !== currency.value);
                                      field.onChange(updatedValue);
                                    }}
                                    className="scale-50 sm:scale-100 h-2 w-2 sm:h-4 sm:w-4"
                                  />
                                </FormControl>
                                <div className="leading-none">
                                  <FormLabel className="cursor-pointer text-[10px] sm:text-xs leading-none">
                                    {currency.value}
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* المكاتب المعتمدة دولياً */}
              <div className="space-y-1 sm:space-y-4">
                <h3 className="text-xs sm:text-lg font-semibold flex items-center gap-0.5 sm:gap-1">
                  <Globe className="h-2.5 w-2.5 sm:h-5 sm:w-5" />
                  المكاتب المعتمدة
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  عرض المكاتب المعتمدة للتحويلات الدولية
                </p>
                
                {agentOffices.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-4">
                    {agentOffices.map((office) => (
                      <Card key={office.id} className="border-gray-200">
                        <CardContent className="p-1.5 sm:p-4">
                          <div className="space-y-0.5 sm:space-y-1">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] sm:text-xs px-0.5 py-0.25 sm:px-1 sm:py-0.5">
                                {office.countryCode}
                              </Badge>
                              <span className="text-[10px] sm:text-xs text-green-600">متاح</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-[10px] sm:text-xs">{office.officeName}</p>
                              <p className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">{office.address}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 sm:py-8 text-gray-500">
                    <Globe className="h-4 w-4 sm:h-12 sm:w-12 mx-auto mb-0.5 sm:mb-3 text-gray-300" />
                    <p className="text-[10px] sm:text-xs">لا توجد مكاتب متاحة حالياً</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Additional Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] sm:text-xs">رسالة إضافية</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="تفاصيل إضافية..."
                        className="resize-none h-12 sm:h-24 text-[10px] sm:text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs hidden sm:block">
                      معلومات إضافية تساعد في المراجعة
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-1 sm:gap-4 pt-1.5 sm:pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="w-full sm:w-auto text-[10px] sm:text-base py-1 h-6 sm:h-10"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-[10px] sm:text-base py-1 h-6 sm:h-10"
                >
                  {submitMutation.isPending ? "جاري التقديم..." : "تقديم الطلب"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExternalTransferRequestPage;