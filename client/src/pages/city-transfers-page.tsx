import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, MapPin, Building2, Clock, CheckCircle2, XCircle, Send, Banknote, Download, Settings, Plus, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, generateTransferCode } from "@/lib/utils";
import { formatCurrency as formatCurrencyWestern, formatDateWithWesternNumbers, formatNumber } from "@/lib/number-utils";
import { z } from "zod";
import { Guard } from "@/components/Guard";
import { useOrientationMode } from "@/hooks/useOrientationMode";

// واجهة لتمثيل استجابة استلام الحوالة
interface ReceiveTransferResponse {
  message: string;
  amount: number;
  commission: number;
  total: number;
  currency: string;
}

// واجهة البيانات للحوالات بين المدن
interface Agent {
  id: number;
  fullName: string;
  city: string;
  commissionRate: string;
}

interface Transfer {
  id: number;
  code: string;
  amount: number;
  currency: string;
  receiverOfficeName: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

// نموذج إرسال الحوالة
const sendTransferSchema = z.object({
  receiverOfficeId: z.number({
    required_error: "يرجى اختيار مكتب الصرافة المستلم"
  }),
  amount: z.number({
    required_error: "يرجى إدخال المبلغ"
  }).positive("يجب أن يكون المبلغ أكبر من صفر"),
  currency: z.string().default("LYD"),
  customCommission: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "العمولة يجب أن تكون رقماً موجباً أو صفر"),
});

type SendTransferData = z.infer<typeof sendTransferSchema>;



// واجهة الحوالات بين المدن
export default function CityTransfersPage() {
  return (
    <Guard page="city_transfers">
      <CityTransfersContent />
    </Guard>
  );
}

function CityTransfersContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAndroidAppMode } = useOrientationMode();
  const [activeTab, setActiveTab] = useState("send");
  
  // متغيرات استلام الحوالة
  const [receiveCode, setReceiveCode] = useState("");
  
  // متغيرات إعدادات العمولة
  const [showAddTierForm, setShowAddTierForm] = useState(false);
  const [editingTier, setEditingTier] = useState<any>(null);
  const [tierFormData, setTierFormData] = useState({
    originCity: "",
    destinationCity: "",
    minAmount: "",
    maxAmount: "",
    commission: "",
    perMilleRate: "",
    currencyCode: "LYD"
  });
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveResult, setReceiveResult] = useState<ReceiveTransferResponse | null>(null);
  const isAdmin = user?.type === 'admin';
  
  // متغيرات الإدخال
  const [receiverOfficeId, setReceiverOfficeId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("LYD");

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [customCommission, setCustomCommission] = useState<string>("");
  
  // جلب قائمة مكاتب الصرافة
  const { data: agents, isLoading: isLoadingAgents, error: agentsError } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await apiRequest('/api/agents', 'GET');
      const data = await res.json();
      return data;
    },
  });

  // جلب رصيد المستخدم
  const { data: balances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ['/api/balance'],
    queryFn: async () => {
      const res = await apiRequest('/api/balance', 'GET');
      return await res.json();
    },
  });

  // جلب سجل الحوالات المدينية
  const { data: transfers, isLoading: isLoadingTransfers, refetch: refetchTransfers } = useQuery<Transfer[]>({
    queryKey: ['/api/city-transfers'],
    queryFn: async () => {
      const res = await apiRequest('/api/city-transfers', 'GET');
      return await res.json();
    },
  });

  // جلب شرائح العمولة للوكيل والمدير
  const { data: commissionTiers, isLoading: isLoadingTiers, refetch: refetchTiers } = useQuery({
    queryKey: ['/api/city-commission-tiers'],
    queryFn: async () => {
      const res = await apiRequest('/api/city-commission-tiers', 'GET');
      return await res.json();
    },
    enabled: user?.type === "agent" || user?.type === "admin"
  });

  // دالة حفظ شريحة العمولة
  const handleSaveTier = async () => {
    try {
      
      if (!tierFormData.minAmount) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "يرجى إدخال المبلغ الأدنى"
        });
        return;
      }

      if (!tierFormData.commission && !tierFormData.perMilleRate) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "يرجى إدخال إما العمولة الثابتة أو النسبة في الألف"
        });
        return;
      }

      if (tierFormData.commission && tierFormData.perMilleRate) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "لا يمكن تحديد العمولة الثابتة والنسبة في الألف معاً"
        });
        return;
      }

      const tierData = {
        originCity: tierFormData.originCity || null,
        destinationCity: tierFormData.destinationCity || null,
        minAmount: parseFloat(tierFormData.minAmount),
        maxAmount: tierFormData.maxAmount ? parseFloat(tierFormData.maxAmount) : null,
        commission: tierFormData.commission ? parseFloat(tierFormData.commission) : null,
        perMilleRate: tierFormData.perMilleRate ? parseFloat(tierFormData.perMilleRate) : null,
        currencyCode: tierFormData.currencyCode
      };


      if (editingTier) {
        // تحديث شريحة موجودة
        await apiRequest(`/api/city-commission-tiers/${editingTier.id}`, 'PUT', tierData);
        toast({
          title: "تم التحديث",
          description: "تم تحديث شريحة العمولة بنجاح"
        });
      } else {
        // إضافة شريحة جديدة
        const response = await apiRequest('/api/city-commission-tiers', 'POST', tierData);
        const responseData = await response.json();
        toast({
          title: "تم الحفظ",
          description: "تم إضافة شريحة العمولة الجديدة بنجاح"
        });
      }

      // إعادة تحميل البيانات وإغلاق النموذج
      await queryClient.invalidateQueries({ queryKey: ['/api/city-commission-tiers'] });
      setShowAddTierForm(false);
      setEditingTier(null);
      setTierFormData({
        originCity: "",
        destinationCity: "",
        minAmount: "",
        maxAmount: "",
        commission: "",
        perMilleRate: "",
        currencyCode: "LYD"
      });
    } catch (error: any) {
      console.error("خطأ في حفظ شريحة العمولة:", error);
      toast({
        variant: "destructive",
        title: "خطأ في حفظ الشريحة",
        description: error.message || "حدث خطأ أثناء حفظ شريحة العمولة"
      });
    }
  };

  // دالة حذف شريحة العمولة
  const handleDeleteTier = async (tierId: number) => {
    try {
      await apiRequest(`/api/city-commission-tiers/${tierId}`, 'DELETE');
      toast({
        title: "تم الحذف",
        description: "تم حذف شريحة العمولة بنجاح"
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/city-commission-tiers'] });
    } catch (error: any) {
      console.error("خطأ في حذف شريحة العمولة:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء حذف شريحة العمولة"
      });
    }
  };

  // دالة استلام الحوالة
  const handleReceiveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receiveCode.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال رمز الحوالة"
      });
      return;
    }
    
    try {
      setIsReceiving(true);
      const response = await apiRequest("/api/agent/receive-city-transfer", "POST", { code: receiveCode });
      const data = await response.json();
      
      setReceiveResult(data);
      setReceiveCode("");
      
      toast({
        title: "تم استلام الحوالة",
        description: "تم استلام الحوالة وإضافة المبلغ إلى رصيدك بنجاح",
      });
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      refetchTransfers();
    } catch (error: any) {
      console.error("خطأ في استلام الحوالة:", error);
      let errorMessage = "حدث خطأ أثناء استلام الحوالة";
      
      if (error.response) {
        try {
          const errorData = await error.response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // لم نتمكن من قراءة رسالة الخطأ
        }
      }
      
      toast({
        variant: "destructive",
        title: "خطأ في استلام الحوالة",
        description: errorMessage
      });
    } finally {
      setIsReceiving(false);
    }
  };

  // تنفيذ إرسال حوالة
  const sendTransferMutation = useMutation({
    mutationFn: async (data: SendTransferData) => {
      const res = await apiRequest('/api/city-transfers/send', 'POST', data);
      const result = await res.json();
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء الحوالة بنجاح",
        description: `رمز الحوالة: ${data.transferCode}`,
      });
      // إعادة ضبط النموذج والانتقال إلى تبويب السجل
      setReceiverOfficeId(null);
      setAmount("");
      setCurrency("LYD");
      setActiveTab("history");
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      refetchTransfers();
    },
    onError: (error: Error) => {
      toast({
        title: "فشل إنشاء الحوالة",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  // وظائف المعالجة
  const handleSendTransfer = () => {
    if (!receiverOfficeId) {
      toast({
        title: "خطأ في النموذج",
        description: "يرجى اختيار مكتب الصرافة المستلم",
        variant: "destructive",
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "خطأ في النموذج",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    sendTransferMutation.mutate({
      receiverOfficeId,
      amount: Number(amount),
      currency,
    });
  };



  // حساب العمولات
  const amountValue = Number(amount) || 0;
  const systemCommissionRate = 0.01; // 1% نسبة عمولة النظام
  const systemCommission = amountValue * systemCommissionRate;
  const selectedOffice = agents?.find(agent => agent.id === receiverOfficeId);
  
  // حساب عمولة المكتب المستلم حسب الشرائح
  const [receiverCommission, setReceiverCommission] = useState<number>(0);
  const [commissionSource, setCommissionSource] = useState<string>('');
  
  useEffect(() => {
    if (receiverOfficeId && amountValue > 0 && currency) {
      const calculateCommission = async () => {
        try {
          const response = await apiRequest('POST', '/api/calculate-receiver-commission', {
            receiverOfficeId,
            amount: amountValue,
            currency,
            senderCity: user?.city,
            receiverCity: selectedOffice?.city
          });
          const data = await response.json();
          setReceiverCommission(Number(data.commission));
          setCommissionSource(data.source);
        } catch (error) {
          console.error('خطأ في حساب عمولة المكتب:', error);
          // استخدام العمولة الافتراضية
          setReceiverCommission(amountValue * 0.015);
          setCommissionSource('default');
        }
      };
      calculateCommission();
    } else {
      setReceiverCommission(0);
      setCommissionSource('');
    }
  }, [receiverOfficeId, amountValue, currency, selectedOffice?.city, user?.city]);
  
  // المجموع المطلوب من المرسل = المبلغ الأساسي + عمولة النظام + عمولة المكتب المستلم
  const totalAmount = amountValue + systemCommission + receiverCommission;
  
  // التحقق من أن المستخدم مسجل في ليبيا
  if (user && user.countryId !== 1) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar />
        <main className="flex-1 p-6">
          <Card className="w-full max-w-4xl mx-auto mt-8 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
              <CardTitle className="text-xl text-red-800">الحوالات بين المدن</CardTitle>
              <CardDescription className="text-red-700">
                هذه الخدمة متاحة للمستخدمين المسجلين في ليبيا فقط
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🇱🇾</div>
              <p className="text-lg text-slate-600 mb-6">
                التحويل بين المدن متاح للمكاتب المسجلة في ليبيا فقط. للتحويلات الدولية، يرجى استخدام خدمة التحويل الدولي.
              </p>
              <Button asChild variant="outline" size="lg">
                <a href="/inter-office-transfer" className="text-primary">
                  التحويل الدولي
                </a>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // التحقق من أن المستخدم مكتب صرافة أو مدير
  if (user?.type !== "agent" && user?.type !== "admin") {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar />
        <main className="flex-1 p-6">
          <Card className="w-full max-w-4xl mx-auto mt-8 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle className="text-xl text-amber-800">الحوالات بين المدن</CardTitle>
              <CardDescription className="text-amber-700">
                هذه الخدمة متاحة فقط لمكاتب الصرافة والإدارة
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <p className="text-lg text-slate-600 mb-6">
                يجب أن تكون مسجلاً كمكتب صرافة للوصول إلى هذه الخدمة.
              </p>
              <Button asChild variant="outline" size="lg">
                <a href="/upgrade-request" className="text-primary">
                  طلب ترقية الحساب
                </a>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ${isAndroidAppMode ? 'pb-20' : 'flex'}`}>
      {!isAndroidAppMode && (
        <div className="w-64 bg-white shadow-lg border-r border-gray-200 p-4">
          <Sidebar />
        </div>
      )}
      <main className={`flex-1 ${isAndroidAppMode ? 'p-3' : 'p-6'}`}>
        <div className={`${isAndroidAppMode ? 'w-full' : 'max-w-7xl mx-auto'}`}>
          {!isAndroidAppMode && (
            <div className="mb-4">
              <BackToDashboardButton />
            </div>
          )}
          <div className="mb-3 sm:mb-6 lg:mb-8 text-center">
            <h1 className="text-lg sm:text-2xl lg:text-4xl font-bold text-slate-800 mb-1 sm:mb-2 bg-gradient-to-l from-blue-600 to-blue-400 bg-clip-text text-transparent">
              الحوالات بين المدن
            </h1>
            <p className="text-xs sm:text-sm lg:text-lg text-slate-600 px-2">
              إرسال الحوالات بين مكاتب الصرافة في المدن المختلفة
            </p>
          </div>
          
          <Card className={`shadow-xl border-0 bg-white/90 backdrop-blur-sm ${isAndroidAppMode ? 'rounded-lg' : ''}`}>
            {!isAndroidAppMode && (
              <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-800">إدارة الحوالات</CardTitle>
                    <CardDescription className="text-slate-600">
                      نظام متقدم لإرسال الحوالات المالية بين المدن بأمان وسهولة
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            )}
            
            <CardContent className="p-2 sm:p-4 lg:p-8">
              <Tabs
                defaultValue="send"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4 h-8 sm:h-10 lg:h-12 gap-0.5 sm:gap-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1">
                  <TabsTrigger 
                    value="send" 
                    className="flex items-center justify-center font-semibold text-xs sm:text-sm lg:text-base data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                  >
                    <Send className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ml-1" />
                    <span className="sm:hidden">إرسال</span>
                    <span className="hidden sm:block lg:hidden">إرسال حوالة</span>
                    <span className="hidden lg:block">إرسال حوالة</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="receive" 
                    className="flex items-center justify-center font-semibold text-xs sm:text-sm lg:text-base data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ml-1" />
                    <span className="sm:hidden">استلام</span>
                    <span className="hidden sm:block lg:hidden">استلام حوالة</span>
                    <span className="hidden lg:block">استلام حوالة</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="flex items-center justify-center font-semibold text-xs sm:text-sm lg:text-base data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                  >
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ml-1" />
                    <span className="sm:hidden">السجل</span>
                    <span className="hidden sm:block lg:hidden">سجل الحوالات</span>
                    <span className="hidden lg:block">سجل الحوالات</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="commission-settings" 
                    className="flex items-center justify-center font-semibold text-xs sm:text-sm lg:text-base data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ml-1" />
                    <span className="sm:hidden">العمولة</span>
                    <span className="hidden sm:block lg:hidden">إعدادات العمولة</span>
                    <span className="hidden lg:block">إعدادات العمولة</span>
                  </TabsTrigger>
                </TabsList>

              
                <TabsContent value="send" className="mt-3 sm:mt-6 lg:mt-8">
                  <div className="space-y-3 sm:space-y-4 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
                    {/* قسم النموذج */}
                    <div className="space-y-3 sm:space-y-4 lg:col-span-2 lg:space-y-6">
                      <div className="hidden lg:block bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border-l-4 border-blue-500">
                        <h3 className="text-xl font-bold text-blue-800 mb-2 flex items-center gap-2">
                          <Send className="h-5 w-5" />
                          إرسال حوالة جديدة
                        </h3>
                        <p className="text-blue-700">
                          أرسل الأموال بأمان إلى أي مكتب صرافة في المدن المختلفة عبر نظامنا المتقدم
                        </p>
                      </div>
                      
                      {isLoadingBalances ? (
                        <div className="flex justify-center py-3 sm:py-6 lg:py-8">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin text-blue-600" />
                            <span className="text-blue-600 font-medium text-xs sm:text-sm lg:text-base">جاري تحميل بيانات الرصيد...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm lg:text-base text-green-700 font-medium mb-1">الرصيد المتاح</p>
                              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-800">
                                {balances?.balances?.[currency] 
                                  ? formatCurrencyWestern(Number(balances?.balances?.[currency] || 0), currency) 
                                  : '0 ' + currency}
                              </p>
                            </div>
                            <div className="text-2xl sm:text-4xl lg:text-5xl">💰</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4 lg:space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="receiverOffice" className="text-xs sm:text-sm lg:text-base font-semibold text-slate-700">
                            مكتب الصرافة المستلم
                          </Label>
                          {isLoadingAgents ? (
                            <div className="flex justify-center py-3 sm:py-4">
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-600" />
                              <span className="mr-2 text-xs sm:text-sm">جاري تحميل المكاتب...</span>
                            </div>
                          ) : agentsError ? (
                            <div className="text-red-600 text-center py-3 sm:py-4 text-xs sm:text-sm">
                              خطأ في تحميل المكاتب: {String(agentsError)}
                            </div>
                          ) : (
                            <Select
                              value={receiverOfficeId?.toString() || ""}
                              onValueChange={(value) => setReceiverOfficeId(Number(value))}
                            >
                              <SelectTrigger id="receiverOffice" className="h-8 sm:h-10 lg:h-12 text-xs sm:text-sm lg:text-base">
                                <SelectValue placeholder="اختر مكتب الصرافة" />
                              </SelectTrigger>
                              <SelectContent>
                                {agents?.length ? (
                                  agents.map((agent) => (
                                    <SelectItem key={agent.id} value={agent.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-slate-500" />
                                        {agent.fullName} - {agent.city}
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="none" disabled>
                                    لا توجد مكاتب صرافة محلية متاحة للحوالات بين المدن
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="amount" className="text-xs sm:text-sm lg:text-base font-semibold text-slate-700">
                              المبلغ
                            </Label>
                            <Input
                              id="amount"
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="أدخل المبلغ"
                              className="h-8 sm:h-10 lg:h-12 text-xs sm:text-sm lg:text-base"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="currency" className="text-xs sm:text-sm lg:text-base font-semibold text-slate-700">
                              العملة
                            </Label>
                            <Select value={currency} onValueChange={setCurrency}>
                              <SelectTrigger id="currency" className="h-8 sm:h-10 lg:h-12 text-xs sm:text-sm lg:text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LYD">دينار ليبي (LYD)</SelectItem>
                                <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                                <SelectItem value="EUR">يورو (EUR)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button
                          onClick={handleSendTransfer}
                          disabled={sendTransferMutation.isPending}
                          className="w-full h-9 sm:h-10 lg:h-12 text-xs sm:text-sm lg:text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg"
                        >
                          {sendTransferMutation.isPending ? (
                            <>
                              <Loader2 className="ml-2 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 animate-spin" />
                              جاري الإرسال...
                            </>
                          ) : (
                            <>
                              <Send className="ml-2 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                              <span className="lg:hidden">إرسال</span>
                              <span className="hidden lg:inline">إرسال الحوالة</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* قسم ملخص التكاليف */}
                    <div className="hidden lg:block space-y-6">
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                          <h4 className="text-lg font-bold text-slate-800 mb-4">ملخص التكاليف</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">المبلغ الأساسي:</span>
                            <span className="font-medium">{formatCurrencyWestern(amountValue, currency)}</span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">عمولة النظام:</span>
                            <span className="font-medium text-blue-600">{formatCurrencyWestern(systemCommission, currency)}</span>
                          </div>
                          
                          {receiverCommission > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">عمولة المكتب المستلم:</span>
                              <span className="font-medium text-orange-600">
                                {formatCurrencyWestern(receiverCommission, currency)}
                                {commissionSource === 'tier_permille' ? (
                                  <span className="text-xs text-purple-600 mr-1">(نسبة في الألف)</span>
                                ) : commissionSource === 'tier_fixed' ? (
                                  <span className="text-xs text-green-600 mr-1">(ثابتة)</span>
                                ) : commissionSource === 'agent_percentage' ? (
                                  <span className="text-xs text-blue-600 mr-1">(نسبة إدارية)</span>
                                ) : commissionSource === 'agent_fixed' ? (
                                  <span className="text-xs text-green-600 mr-1">(ثابتة إدارية)</span>
                                ) : commissionSource === 'default' ? (
                                  <span className="text-xs text-blue-600 mr-1">(افتراضي 1.5%)</span>
                                ) : null}
                              </span>
                            </div>
                          )}
                          
                          <Separator />
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-slate-800">المجموع المطلوب:</span>
                            <span className="text-blue-600">{formatCurrencyWestern(totalAmount, currency)}</span>
                          </div>
                          
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-700">
                              📋 المجموع = المبلغ + عمولة النظام + عمولة المكتب المستلم
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              💰 {formatCurrencyWestern(amountValue, currency)} + {formatCurrencyWestern(systemCommission, currency)} + {formatCurrencyWestern(receiverCommission, currency)} = {formatCurrencyWestern(totalAmount, currency)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedOffice && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                          <h4 className="text-lg font-bold text-amber-800 mb-3">تفاصيل المكتب المستلم</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-amber-600" />
                              <span className="font-medium">{selectedOffice.fullName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-amber-600" />
                              <span>{selectedOffice.city}</span>
                            </div>
                            <div className="text-amber-700 text-sm">
                              العمولة: {formatCurrencyWestern(receiverCommission, currency)}
                              {commissionSource === 'tier_permille' ? (
                                <span className="text-purple-600 text-xs mr-1">(نسبة في الألف)</span>
                              ) : commissionSource === 'tier_fixed' ? (
                                <span className="text-green-600 text-xs mr-1">(ثابتة)</span>
                              ) : commissionSource === 'agent_percentage' ? (
                                <span className="text-blue-600 text-xs mr-1">(نسبة إدارية)</span>
                              ) : commissionSource === 'agent_fixed' ? (
                                <span className="text-green-600 text-xs mr-1">(ثابتة إدارية)</span>
                              ) : commissionSource === 'default' ? (
                                <span className="text-blue-600 text-xs mr-1">(افتراضي 1.5%)</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="receive" className="mt-3 sm:mt-6 lg:mt-8">
                  <div className="w-full lg:max-w-2xl lg:mx-auto">
                    <div className="hidden lg:block bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border-l-4 border-green-500 mb-8">
                      <h3 className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        استلام حوالة بين المدن
                      </h3>
                      <p className="text-green-700">
                        أدخل رمز الحوالة المكون من 6 أرقام لاستلام المبلغ وإضافته إلى رصيدك
                      </p>
                    </div>

                    <form onSubmit={handleReceiveTransfer} className="space-y-3 sm:space-y-4 lg:space-y-6">
                      <Card className="shadow-lg">
                        <CardHeader className="hidden lg:block">
                          <CardTitle className="text-xl text-slate-800">استلام حوالة جديدة</CardTitle>
                          <CardDescription>
                            أدخل رمز الحوالة الذي تلقيته من المرسل
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 lg:space-y-4">
                          <div className="space-y-2 lg:space-y-3">
                            <Label htmlFor="receive-code" className="text-xs sm:text-sm lg:text-base font-semibold text-slate-700">
                              رمز الحوالة
                            </Label>
                            <Input
                              id="receive-code"
                              type="text"
                              value={receiveCode}
                              onChange={(e) => setReceiveCode(e.target.value)}
                              placeholder="أدخل رمز الحوالة المكون من 6 أرقام"
                              disabled={isReceiving}
                              className="h-9 sm:h-10 lg:h-12 text-sm sm:text-base lg:text-lg font-medium text-center"
                              maxLength={6}
                            />
                          </div>
                        </CardContent>
                        <CardFooter className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-6">
                          <Button
                            type="submit"
                            disabled={isReceiving}
                            className="w-full h-9 sm:h-10 lg:h-12 text-xs sm:text-sm lg:text-base bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-lg"
                          >
                            {isReceiving ? (
                              <>
                                <Loader2 className="ml-2 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 animate-spin" />
                                جاري الاستلام...
                              </>
                            ) : (
                              <>
                                <Download className="ml-2 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                                <span className="lg:hidden">استلام</span>
                                <span className="hidden lg:inline">استلام الحوالة</span>
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    </form>

                    {receiveResult && (
                      <Card className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            تم استلام الحوالة بنجاح
                          </CardTitle>
                          <CardDescription className="text-green-700">
                            تفاصيل الحوالة المستلمة
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <span className="text-slate-600">المبلغ المستلم:</span>
                              <span className="font-bold text-green-800">
                                {formatCurrencyWestern(receiveResult.amount, receiveResult.currency)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <span className="text-slate-600">العمولة:</span>
                              <span className="font-bold text-orange-600">
                                {formatCurrencyWestern(receiveResult.commission, receiveResult.currency)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border border-green-300">
                              <span className="text-green-700 font-semibold">إجمالي المبلغ المضاف لرصيدك:</span>
                              <span className="font-bold text-green-800 text-lg">
                                {formatCurrencyWestern(receiveResult.total, receiveResult.currency)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* معلومات توضيحية */}
                    <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="text-sm text-blue-800 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0"></div>
                            <p>يتكون رمز الحوالة من 6 أرقام يقوم المرسل بتقديمه لك</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0"></div>
                            <p>سيتم إضافة المبلغ المستلم إلى رصيدك فوراً بعد استلام الحوالة</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0"></div>
                            <p>يمكنك عرض سجل جميع الحوالات المستلمة في تبويب "سجل الحوالات"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-3 sm:mt-6 lg:mt-8">
                  <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 lg:gap-0">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">سجل الحوالات</h3>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-48 h-8 sm:h-9 lg:h-10 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الحوالات</SelectItem>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="completed">مكتملة</SelectItem>
                          <SelectItem value="failed">فاشلة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isLoadingTransfers ? (
                      <div className="flex justify-center py-6 sm:py-8">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-purple-600" />
                          <span className="text-purple-600 font-medium text-sm sm:text-base">جاري تحميل سجل الحوالات...</span>
                        </div>
                      </div>
                    ) : !transfers?.length ? (
                      <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-xl">
                        <div className="text-4xl sm:text-6xl mb-4">📋</div>
                        <p className="text-slate-500 text-sm sm:text-lg">لا توجد حوالات في السجل</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {transfers
                          ?.filter(transfer => filterStatus === "all" || transfer.status === filterStatus)
                          .map((transfer) => (
                            <Card key={transfer.id} className="overflow-hidden hover:shadow-md transition-shadow">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-4 sm:p-6">
                                <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
                                  <div className={`p-2 sm:p-3 rounded-full ${
                                    transfer.status === "completed" 
                                      ? "bg-green-100 text-green-600" 
                                      : transfer.status === "pending"
                                      ? "bg-yellow-100 text-yellow-600"
                                      : "bg-red-100 text-red-600"
                                  }`}>
                                    {transfer.status === "completed" 
                                      ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                      : transfer.status === "pending"
                                      ? <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                                      : <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                    }
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800 text-sm sm:text-base">{transfer.receiverOfficeName}</p>
                                    <p className="text-xs sm:text-sm text-slate-500">كود: {transfer.code}</p>
                                  </div>
                                </div>
                                <div className="text-left sm:text-right">
                                  <div className="text-lg sm:text-xl font-bold text-slate-800">
                                    {formatCurrencyWestern(transfer.amount, transfer.currency)}
                                  </div>
                                  <Badge variant={
                                    transfer.status === "completed" 
                                      ? "default" 
                                      : transfer.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                  }>
                                    {transfer.status === "completed" 
                                      ? "مكتملة" 
                                      : transfer.status === "pending"
                                      ? "قيد الانتظار"
                                      : "فاشلة"
                                    }
                                  </Badge>
                                </div>
                              </div>
                              <div className="px-4 sm:px-6 pb-3 sm:pb-4 text-xs sm:text-sm text-slate-500">
                                <div className="flex flex-col sm:flex-row sm:gap-4">
                                  <span>تاريخ الإنشاء: {formatDateWithWesternNumbers(new Date(transfer.createdAt))}</span>
                                  {transfer.completedAt && (
                                    <span>
                                      تاريخ الاستلام: {formatDateWithWesternNumbers(new Date(transfer.completedAt))}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="commission-settings" className="mt-3 sm:mt-6 lg:mt-8">
                  <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                    <div className="hidden lg:block bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border-l-4 border-orange-500">
                      <h3 className="text-xl font-bold text-orange-800 mb-2 flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        إعدادات عمولة المكتب
                      </h3>
                      <p className="text-orange-700">
                        قم بإعداد شرائح العمولة حسب المدن ومقادير المبالغ
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 lg:gap-0">
                      <h4 className="text-lg sm:text-xl font-bold text-slate-800">شرائح العمولة</h4>
                      <Button
                        onClick={() => setShowAddTierForm(true)}
                        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 h-8 sm:h-9 lg:h-10 text-xs sm:text-sm px-3 sm:px-4"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                        <span className="hidden sm:inline">إضافة شريحة جديدة</span>
                        <span className="sm:hidden">إضافة</span>
                      </Button>
                    </div>

                    {isLoadingTiers ? (
                      <div className="flex justify-center py-6 sm:py-8">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-orange-600" />
                          <span className="text-orange-600 font-medium text-sm sm:text-base">جاري تحميل شرائح العمولة...</span>
                        </div>
                      </div>
                    ) : !commissionTiers?.length ? (
                      <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-xl">
                        <div className="text-4xl sm:text-6xl mb-4">📊</div>
                        <p className="text-slate-500 text-sm sm:text-lg">لا توجد شرائح عمولة محددة</p>
                        <p className="text-slate-400 text-xs sm:text-sm mt-2">سيتم استخدام العمولة الافتراضية 1.5%</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {commissionTiers.map((tier: any) => (
                          <Card key={tier.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-4 sm:p-6">
                              <div className="flex-1 space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                  <Badge variant="outline" className="font-medium text-xs sm:text-sm w-fit">
                                    {tier.currencyCode}
                                  </Badge>
                                  <span className="font-semibold text-slate-800 text-sm sm:text-base">
                                    {tier.originCity || "جميع المدن"} → {tier.destinationCity || "جميع المدن"}
                                  </span>
                                </div>
                                <div className="text-xs sm:text-sm text-slate-600">
                                  <span>المبلغ: </span>
                                  <span className="font-medium">
                                    {tier.minAmount} - {tier.maxAmount || "بدون حد أقصى"}
                                  </span>
                                </div>
                                <div className="text-xs sm:text-sm">
                                  {tier.perMilleRate ? (
                                    <span className="text-purple-600 font-medium">
                                      نسبة في الألف: {tier.perMilleRate}‰
                                    </span>
                                  ) : (
                                    <span className="text-green-600 font-medium">
                                      عمولة ثابتة: {tier.commission} {tier.currencyCode}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 sm:h-9 px-2 sm:px-3"
                                  onClick={() => {
                                    setEditingTier(tier);
                                    setTierFormData({
                                      originCity: tier.originCity || "",
                                      destinationCity: tier.destinationCity || "",
                                      minAmount: tier.minAmount || "",
                                      maxAmount: tier.maxAmount || "",
                                      commission: tier.commission || "",
                                      perMilleRate: tier.perMilleRate || "",
                                      currencyCode: tier.currencyCode || "LYD"
                                    });
                                    setShowAddTierForm(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 sm:h-9 px-2 sm:px-3"
                                  onClick={() => handleDeleteTier(tier.id)}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* نموذج إضافة/تحرير شريحة العمولة */}
                    {showAddTierForm && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardHeader>
                          <CardTitle className="text-orange-800">
                            {editingTier ? "تحرير شريحة العمولة" : "إضافة شريحة عمولة جديدة"}
                          </CardTitle>
                          <CardDescription className="text-orange-700">
                            حدد المدن والمبالغ ونوع العمولة
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="originCity">المدينة المرسلة (اختياري)</Label>
                              <Input
                                id="originCity"
                                value={tierFormData.originCity}
                                onChange={(e) => setTierFormData({...tierFormData, originCity: e.target.value})}
                                placeholder="اتركه فارغاً لجميع المدن"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="destinationCity">المدينة المستقبلة (اختياري)</Label>
                              <Input
                                id="destinationCity"
                                value={tierFormData.destinationCity}
                                onChange={(e) => setTierFormData({...tierFormData, destinationCity: e.target.value})}
                                placeholder="اتركه فارغاً لجميع المدن"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="minAmount">المبلغ الأدنى</Label>
                              <Input
                                id="minAmount"
                                type="number"
                                value={tierFormData.minAmount}
                                onChange={(e) => setTierFormData({...tierFormData, minAmount: e.target.value})}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="maxAmount">المبلغ الأقصى (اختياري)</Label>
                              <Input
                                id="maxAmount"
                                type="number"
                                value={tierFormData.maxAmount}
                                onChange={(e) => setTierFormData({...tierFormData, maxAmount: e.target.value})}
                                placeholder="بدون حد أقصى"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="currencyCode">العملة</Label>
                              <Select value={tierFormData.currencyCode} onValueChange={(value) => setTierFormData({...tierFormData, currencyCode: value})}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LYD">دينار ليبي (LYD)</SelectItem>
                                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                                  <SelectItem value="EUR">يورو (EUR)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="commission">عمولة ثابتة</Label>
                              <Input
                                id="commission"
                                type="number"
                                step="0.01"
                                value={tierFormData.commission}
                                onChange={(e) => setTierFormData({...tierFormData, commission: e.target.value, perMilleRate: ""})}
                                placeholder="مبلغ ثابت"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="perMilleRate">نسبة في الألف (‰)</Label>
                              <Input
                                id="perMilleRate"
                                type="number"
                                step="0.1"
                                value={tierFormData.perMilleRate}
                                onChange={(e) => setTierFormData({...tierFormData, perMilleRate: e.target.value, commission: ""})}
                                placeholder="نسبة في الألف"
                              />
                            </div>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>ملاحظة:</strong> يمكنك تحديد إما عمولة ثابتة أو نسبة في الألف، ولكن ليس كلاهما معاً.
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAddTierForm(false);
                              setEditingTier(null);
                              setTierFormData({
                                originCity: "",
                                destinationCity: "",
                                minAmount: "",
                                maxAmount: "",
                                commission: "",
                                perMilleRate: "",
                                currencyCode: "LYD"
                              });
                            }}
                          >
                            إلغاء
                          </Button>
                          <Button 
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                            onClick={handleSaveTier}
                          >
                            {editingTier ? "تحديث الشريحة" : "إضافة الشريحة"}
                          </Button>
                        </CardFooter>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}