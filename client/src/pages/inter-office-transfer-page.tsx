import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCommissionUpdates } from "@/hooks/use-commission-updates";
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
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowRight, Building2, DollarSign, Copy, CheckCircle, History, Download, Percent, TrendingDown, Users, Save, Calculator, Plus, Edit3, Trash2, Info, Receipt, X, Trash } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Guard } from "@/components/Guard";

interface OfficeUser {
  id: number;
  fullName: string;
  officeName: string;
  accountNumber: string;
  city: string;
  type: string;
}

interface Transfer {
  id: number;
  receiverName: string;
  amount: string;
  currency: string;
  commission: string;
  city: string;
  status: string;
  createdAt: string;
}

const transferSchema = z.object({
  destinationCountry: z.string().min(1, "يرجى اختيار دولة الوجهة"),
  receiverOfficeId: z.string().min(1, "يرجى اختيار المكتب المستلم"),
  amount: z.string().min(1, "يرجى إدخال المبلغ").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "يجب أن يكون المبلغ رقماً موجباً"
  ),
  currency: z.string().min(1, "يرجى اختيار العملة"),
  senderName: z.string().min(2, "يجب أن يكون اسم المرسل أكثر من حرفين"),
  senderPhone: z.string().min(8, "يجب أن يكون رقم الهاتف صحيحاً"),
  receiverName: z.string().min(2, "يجب أن يكون اسم المستلم أكثر من حرفين"),
  receiverPhone: z.string().min(8, "يجب أن يكون رقم الهاتف صحيحاً"),
  notes: z.string().optional(),
});

const receiveSchema = z.object({
  transferCode: z.string().min(6, "رمز التحويل يجب أن يكون 6 أرقام"),
  receiverCode: z.string().min(6, "رمز المستلم يجب أن يكون 6 أرقام"),
});

type TransferFormValues = z.infer<typeof transferSchema>;
type ReceiveFormValues = z.infer<typeof receiveSchema>;

interface AgentCommission {
  id: number;
  agentId: number;
  agentName: string;
  commission: string;
  isPercentage: boolean;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface CommissionData {
  myCommission: AgentCommission | null;
  otherCommissions: AgentCommission[];
}

interface AgentCommissionSetting {
  id: number;
  agentId: number;
  currencyCode: string;
  type: 'percentage' | 'fixed';
  value: string;
  createdAt: string;
  updatedAt: string;
}

const commissionSchema = z.object({
  currencyCode: z.string().min(1, "يرجى اختيار العملة"),
  type: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: "يرجى اختيار نوع العمولة" })
  }),
  value: z.string().min(1, "يرجى إدخال قيمة العمولة").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "يجب أن تكون قيمة العمولة رقماً موجباً"
  ),
});

type CommissionFormValues = z.infer<typeof commissionSchema>;



export default function InterOfficeTransferPage() {
  return (
    <Guard page="international">
      <InterOfficeTransferContent />
    </Guard>
  );
}

function InterOfficeTransferContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [selectedCountry, setSelectedCountry] = useState("");
  const [availableOffices, setAvailableOffices] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("send");
  const [transfersList, setTransfersList] = useState<any[]>([]);
  const [officeCommissions, setOfficeCommissions] = useState<Record<string, { value: number; type: string; displayText: string }>>({});
  const [systemCommissionRate, setSystemCommissionRate] = useState<number>(0.01); // 1% افتراضي
  const [editingCommission, setEditingCommission] = useState<AgentCommissionSetting | null>(null);
  const [generatingReceiptId, setGeneratingReceiptId] = useState<number | null>(null);
  const [cancelingTransferId, setCancelingTransferId] = useState<number | null>(null);
  
  // متغيرات حالة الاختيار المتعدد للحذف
  const [selectedTransfers, setSelectedTransfers] = useState<Set<number>>(new Set());
  const [isDeletingTransfers, setIsDeletingTransfers] = useState(false);

  // مراقبة تحديثات العمولة
  useCommissionUpdates();

  // نموذج إعدادات العمولة
  const commissionForm = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      currencyCode: "",
      type: "percentage",
      value: "",
    },
  });

  // جلب العمولات الحالية للوكيل
  const { data: agentCommissions = [], isLoading: agentCommissionsLoading, refetch: refetchCommissions } = useQuery({
    queryKey: ['/api/agent/commissions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/agent/commissions');
      return await res.json();
    },
    enabled: user?.type === 'agent' || user?.type === 'admin',
  });

  // إضافة/تحديث عمولة
  const addCommissionMutation = useMutation({
    mutationFn: async (data: CommissionFormValues) => {
      const res = await apiRequest('POST', '/api/agent/commissions', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ العمولة بنجاح",
        description: "تم إضافة إعدادات العمولة للعملة المحددة",
      });
      commissionForm.reset();
      setEditingCommission(null);
      refetchCommissions();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حفظ العمولة",
        description: error.message || "حدث خطأ أثناء حفظ العمولة",
        variant: "destructive",
      });
    },
  });

  // حذف عمولة
  const deleteCommissionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/agent/commissions/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم حذف العمولة بنجاح",
        description: "تم حذف إعدادات العمولة",
      });
      refetchCommissions();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف العمولة",
        description: error.message || "حدث خطأ أثناء حذف العمولة",
        variant: "destructive",
      });
    },
  });

  // وظيفة تعديل العمولة
  const handleEditCommission = (commission: AgentCommissionSetting) => {
    setEditingCommission(commission);
    commissionForm.setValue('currencyCode', commission.currencyCode);
    commissionForm.setValue('type', commission.type);
    commissionForm.setValue('value', commission.value);
  };

  // وظيفة إلغاء التعديل
  const handleCancelEdit = () => {
    setEditingCommission(null);
    commissionForm.reset();
  };

  // وظيفة إرسال نموذج العمولة
  const onSubmitCommission = (data: CommissionFormValues) => {
    // التحقق إضافي من النسبة المئوية
    if (data.type === 'percentage' && parseFloat(data.value) > 100) {
      toast({
        title: "خطأ في البيانات",
        description: "النسبة المئوية لا يمكن أن تتجاوز 100%",
        variant: "destructive",
      });
      return;
    }
    addCommissionMutation.mutate(data);
  };

  // العملات المتاحة
  const SUPPORTED_CURRENCIES = [
    { code: 'LYD', name: 'دينار ليبي', symbol: 'د.ل' },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$' },
    { code: 'EUR', name: 'يورو', symbol: '€' },
    { code: 'TRY', name: 'ليرة تركية', symbol: '₺' },
    { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ' },
    { code: 'EGP', name: 'جنيه مصري', symbol: '£' },
    { code: 'TND', name: 'دينار تونسي', symbol: 'د.ت' },
    { code: 'GBP', name: 'جنيه إسترليني', symbol: '£' },
  ];

  // العملات المتاحة للإضافة
  const availableCurrencies = SUPPORTED_CURRENCIES.filter(
    currency => !agentCommissions.some((c: AgentCommissionSetting) => c.currencyCode === currency.code) || 
    (editingCommission && editingCommission.currencyCode === currency.code)
  );

  // التحقق من نوع المستخدم ودولة التسجيل
  useEffect(() => {
    if (user && user.type !== 'agent' && user.type !== 'admin') {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة متاحة للمكاتب فقط",
        variant: "destructive",
      });
      setLocation('/dashboard');
      return;
    }

    // التحقق من ترخيص التحويل الدولي
    if (user && !user.extTransferEnabled) {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة متاحة للمكاتب المرخصة للتحويل الدولي فقط.",
        variant: "destructive",
      });
      setLocation('/dashboard');
    }
  }, [user, setLocation, toast]);

  // نموذج الإرسال
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      destinationCountry: "",
      receiverOfficeId: "",
      amount: "",
      currency: "LYD",
      senderName: "",
      senderPhone: "",
      receiverName: "",
      receiverPhone: "",
      notes: "",
    },
  });

  // نموذج الاستلام
  const receiveForm = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      transferCode: "",
      receiverCode: "",
    },
  });

  // جلب نسبة عمولة النظام من إعدادات النظام
  const { data: systemCommissionData, refetch: refetchSystemCommission } = useQuery({
    queryKey: ['/api/commission-rates', 'international', 'USD'], // استخدم USD دائماً للتحويلات الدولية
    queryFn: async () => {
      const currency = 'USD'; // للتحويلات الدولية استخدم USD دائماً
      console.log(`🔍 جلب نسبة عمولة النظام للعملة: ${currency} (international)`);
      const url = `/api/commission-rates?transferType=international&currency=${currency}`;
      console.log(`🌐 الرابط الكامل: ${url}`);
      const res = await apiRequest("GET", url);
      const data = await res.json();
      console.log(`📊 نتيجة نسبة عمولة النظام:`, data);
      return data;
    },
    enabled: true, // دائماً متاح
    refetchInterval: false, // إيقاف التحديث التلقائي  
    refetchOnWindowFocus: false, // إيقاف التحديث عند العودة للصفحة
    staleTime: 0, // البيانات تصبح قديمة فوراً
    gcTime: 0, // عدم تخزين البيانات في الكاش (gcTime في v5)
  });


  // تحديث نسبة عمولة النظام عند تغيير البيانات
  useEffect(() => {
    if (systemCommissionData?.systemCommissionRate) {
      setSystemCommissionRate(systemCommissionData.systemCommissionRate);
      const rateDisplay = systemCommissionData.rateType === 'per_mille' 
        ? `${(systemCommissionData.systemCommissionRate * 1000).toFixed(1)}‰` 
        : `${(systemCommissionData.systemCommissionRate * 100).toFixed(2)}%`;
      console.log(`📊 تم تحديث نسبة عمولة النظام: ${rateDisplay} من ${systemCommissionData.source}`);
    }
  }, [systemCommissionData]);

  // إعادة جلب بيانات العمولة عند تغيير العملة
  const currentCurrency = form.watch("currency");
  useEffect(() => {
    if (currentCurrency) {
      console.log(`🔄 إعادة جلب عمولة النظام للعملة: ${currentCurrency}`);
      refetchSystemCommission();
    }
  }, [currentCurrency, refetchSystemCommission]);


  // جلب الدول المعتمدة للتحويل الدولي فقط
  const { data: countries = [], isLoading: countriesLoading, error: countriesError } = useQuery<any[]>({
    queryKey: ['/api/countries/international'],
    queryFn: async () => {
      try {
        const res = await apiRequest('/api/countries/international', 'GET');
        const data = await res.json();
        console.log('International countries data received:', data);
        return data;
      } catch (error) {
        console.error('Error fetching international countries:', error);
        throw error;
      }
    }
  });

  // جلب مكاتب الوكلاء للدولة المختارة
  useEffect(() => {
    const fetchOfficesForCountry = async () => {
      if (selectedCountry && user?.id) {
        try {
          console.log('Fetching offices for country:', selectedCountry);
          console.log('Current user ID:', user.id);
          
          const res = await apiRequest(`/api/agent-offices?country=${selectedCountry}`, "GET");
          const offices = await res.json();
          console.log('All offices received:', offices);
          
          // تصفية المكاتب المملوكة لنفس المستخدم
          const filteredOffices = offices.filter((office: any) => {
            console.log(`Checking office ${office.id}: agentId=${office.agentId}, currentUser=${user.id}`);
            return office.agentId !== user.id;
          });
          
          console.log('Filtered offices (excluding current user):', filteredOffices);
          setAvailableOffices(Array.isArray(filteredOffices) ? filteredOffices : []);
          
          // جلب عمولات المكاتب
          await fetchOfficeCommissions(filteredOffices);
        } catch (error) {
          console.error('خطأ في جلب المكاتب:', error);
          setAvailableOffices([]);
        }
      } else {
        setAvailableOffices([]);
      }
    };

    fetchOfficesForCountry();
  }, [selectedCountry, user?.id]);

  // دالة جلب عمولات المكاتب
  const fetchOfficeCommissions = async (offices: any[]) => {
    const newCommissions: Record<string, { value: number; type: string; displayText: string }> = {};
    
    // للتحويلات الدولية، استخدم USD دائماً لأن المكاتب الدولية تعمل بالدولار
    const transferCurrency = "USD";
    
    for (const office of offices) {
      try {
        console.log(`🔍 حساب عمولة المكتب ${office.id} بالعملة ${transferCurrency}`);
        const response = await apiRequest('/api/calculate-receiver-commission', 'POST', {
          receiverOfficeId: office.id,
          amount: 100, // مبلغ تجريبي لحساب النسبة
          currency: transferCurrency
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 جلب عمولة المكتب ${office.id}:`, data);
          
          // تحليل نوع العمولة وحساب العرض الصحيح
          if (data.source === 'agent_percentage') {
            // عمولة نسبية - احسب النسبة الصحيحة من النتيجة (1.6 من 100 = 1.6%)
            const commissionAmount = parseFloat(data.commission); // 1.6
            const percentage = (commissionAmount / 100) * 100; // 1.6%
            newCommissions[office.id] = {
              value: percentage,
              type: 'percentage',
              displayText: `${percentage}%`
            };
          } else if (data.source === 'agent_fixed' || data.source === 'tier_fixed') {
            // عمولة ثابتة - عرض القيمة الثابتة
            const fixedAmount = parseFloat(data.commission);
            newCommissions[office.id] = {
              value: fixedAmount,
              type: 'fixed',
              displayText: `${fixedAmount} ${transferCurrency} ثابت`
            };
          } else if (data.source === 'default_percentage') {
            // افتراضي نسبي 1.5%
            newCommissions[office.id] = {
              value: 1.5,
              type: 'percentage',
              displayText: '1.5%'
            };
          } else {
            // افتراضي غير محدد
            newCommissions[office.id] = {
              value: 1.5,
              type: 'percentage',
              displayText: '1.5%'
            };
          }
          
          // حفظ نوع العمولة لكل مكتب
          office.commissionSource = data.source;
        } else {
          newCommissions[office.id] = {
            value: 1.5,
            type: 'percentage',
            displayText: '1.5%'
          };
          office.commissionSource = 'default';
        }
      } catch (error) {
        console.error(`خطأ في جلب عمولة المكتب ${office.id}:`, error);
        newCommissions[office.id] = {
          value: 1.5,
          type: 'percentage',
          displayText: '1.5%'
        };
      }
    }
    
    setOfficeCommissions(newCommissions);
  };

  // جلب الأرصدة
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await apiRequest('GET', '/api/balance');
        const data = await res.json();
        setBalances(data.balances || {});
      } catch (error) {
        console.error('خطأ في جلب الأرصدة:', error);
      }
    };

    if (user) {
      fetchBalances();
    }
  }, [user]);

  const onSubmit = async (data: any) => {
    console.log('🚀 Form submission started!');
    console.log('📝 Form data:', data);
    console.log('🌍 Selected country:', selectedCountry);
    console.log('🏢 Available offices:', availableOffices);
    console.log('👤 Current user:', user);
    
    try {
      setIsSubmitting(true);
      
      // التحقق من البيانات المطلوبة
      const receiverName = data.receiverName?.trim();
      const receiverPhone = data.receiverPhone?.trim();
      const amount = data.amount;
      const receivingOffice = data.receiverOfficeId;
      
      if (!receiverName || !receiverPhone || !amount || !receivingOffice || !selectedCountry) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        return;
      }
      
      const transferData = {
        receiverName,
        receiverPhone,
        amount: parseFloat(amount),
        receivingOffice: parseInt(receivingOffice),
        destinationCountry: selectedCountry,
        notes: data.notes?.trim() || "",
        currency: data.currency || "LYD"
      };
      
      console.log('Sending transfer data:', transferData);
      
      const response = await apiRequest('POST', '/api/inter-office-transfers', transferData);
      const result = await response.json();
      
      if (response.ok) {
        // تحديث cache الرصيد والمعاملات والتحويلات
        queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/inter-office-transfers'] });
        
        toast({
          title: "✅ تم إنشاء التحويل بين المكاتب بنجاح",
          description: `رمز الاستلام: ${result.receiverCode}\nالمبلغ الأصلي: ${result.amountOriginal} ${result.currency}\nعمولة النظام: ${result.commissionSystem} ${result.currency}\nالمجموع المطلوب: ${result.totalRequired} ${result.currency}`,
          duration: 10000,
        });
        
        form.reset();
        setSelectedCountry("");
        setAvailableOffices([]);
        
        // إعادة جلب الأرصدة 
        const fetchBalances = async () => {
          try {
            const res = await apiRequest('GET', '/api/balance');
            const data = await res.json();
            setBalances(data.balances || {});
          } catch (error) {
            console.error('خطأ في جلب الأرصدة:', error);
          }
        };
        fetchBalances();
      } else {
        toast({
          title: "خطأ في التحويل",
          description: result.message || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      
      // التحقق من وجود رسالة خطأ محددة من الخادم
      let errorMessage = "تعذر الاتصال بالخادم";
      let errorTitle = "خطأ في الاتصال";
      
      if (error?.message) {
        // التحقق من رسائل الخطأ المحددة
        if (error.message.includes("تجاوز الحد اليومي")) {
          errorTitle = "🚫 تجاوز السقف اليومي";
          errorMessage = "لقد تجاوزت الحد الأقصى المسموح به للتحويلات اليوم. يرجى المحاولة غداً أو التواصل مع الإدارة لرفع السقف.";
        } else if (error.message.includes("تجاوز الحد الشهري")) {
          errorTitle = "🚫 تجاوز السقف الشهري";
          errorMessage = "لقد تجاوزت الحد الأقصى المسموح به للتحويلات هذا الشهر. يرجى انتظار الشهر القادم أو التواصل مع الإدارة لرفع السقف.";
        } else if (error.message.includes("403")) {
          errorTitle = "❌ غير مصرح";
          errorMessage = error.message.replace(/^403:\s*/, ""); // إزالة كود الخطأ من بداية الرسالة
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 8000, // عرض لفترة أطول للرسائل المهمة
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // جلب سجل التحويلات بين المكاتب
  const { data: transfersData = [] } = useQuery<any[]>({
    queryKey: ['/api/inter-office-transfers', user?.id],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/inter-office-transfers');
      return await res.json();
    },
    enabled: !!user?.id, // تأكد من أن المستخدم مُحدد قبل البحث
  });

  // جلب بيانات العمولات للوكلاء والمدراء
  const { data: commissionsData, isLoading: commissionsLoading } = useQuery<CommissionData>({
    queryKey: ["/api/inter-office-commissions"],
    queryFn: async () => {
      const res = await apiRequest("/api/inter-office-commissions", "GET");
      return await res.json();
    },
    enabled: (user?.type === "agent" || user?.type === "admin") && !!user?.id
  });

  // State لإدارة العمولات
  const [newCommissionRate, setNewCommissionRate] = useState("");

  // تحديث العمولة
  const updateCommissionMutation = useMutation({
    mutationFn: async (data: { rate: number }) => {
      return await apiRequest("/api/inter-office-commissions", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث العمولة بنجاح",
        description: "تم حفظ نسبة العمولة الجديدة وستظهر للمستخدمين الآخرين",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inter-office-commissions"] });
      setNewCommissionRate("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث العمولة",
        description: error.message || "حدث خطأ أثناء حفظ العمولة",
        variant: "destructive",
      });
    },
  });

  // دالة حفظ العمولة الجديدة
  const handleSaveCommission = () => {
    const rate = parseFloat(newCommissionRate);
    
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "قيمة غير صحيحة",
        description: "يجب أن تكون نسبة العمولة بين 0% و 100%",
        variant: "destructive",
      });
      return;
    }

    updateCommissionMutation.mutate({ rate });
  };

  // دالة اختيار أقل عمولة
  const handleSelectLowestRate = () => {
    if (!commissionsData?.otherCommissions?.length) {
      toast({
        title: "لا توجد عمولات أخرى",
        description: "لا يوجد مكاتب أخرى مسجلة لمقارنة العمولات",
        variant: "destructive",
      });
      return;
    }

    const lowestCommission = commissionsData.otherCommissions.reduce((min: any, current: any) => {
      const currentRate = parseFloat(current.commission);
      const minRate = parseFloat(min.commission);
      return currentRate < minRate ? current : min;
    });

    const lowestRate = parseFloat(lowestCommission.commission);
    const competitiveRate = Math.max(0, lowestRate - 0.1); // أقل بـ 0.1%
    
    setNewCommissionRate(competitiveRate.toFixed(1));
    
    toast({
      title: "تم اختيار نسبة تنافسية",
      description: `تم تعيين العمولة على ${competitiveRate.toFixed(1)}% (أقل من أدنى منافس بـ 0.1%)`,
    });
  };

  // إلغاء الحوالة (للمرسل فقط)
  const cancelTransfer = async (transferId: number, transferCode: string) => {
    if (!confirm(`هل أنت متأكد من إلغاء الحوالة رقم ${transferCode}؟\nسيتم إرجاع المبلغ إلى رصيدك وإشعار المستلم بالإلغاء.`)) {
      return;
    }

    setCancelingTransferId(transferId);

    try {
      const response = await apiRequest('POST', `/api/inter-office-transfers/${transferId}/cancel`);

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "✅ تم إلغاء الحوالة بنجاح",
          description: `تم إلغاء الحوالة رقم ${result.transferCode} وإرجاع ${result.refundAmount || 'المبلغ'} إلى رصيدك`,
          duration: 5000,
        });

        // تحديث البيانات فوراً
        queryClient.invalidateQueries({ queryKey: ['/api/inter-office-transfers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      } else {
        const error = await response.json();
        toast({
          title: "خطأ في إلغاء الحوالة",
          description: error.message || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error canceling transfer:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setCancelingTransferId(null);
    }
  };

  // إنشاء إيصال التحويل الدولي
  const generateReceipt = async (receiverCode: string, transferId: number) => {
    if (!receiverCode) {
      toast({
        title: "خطأ",
        description: "كود الاستلام غير متوفر",
        variant: "destructive",
      });
      return;
    }

    setGeneratingReceiptId(transferId);

    try {
      const response = await apiRequest('POST', '/api/receipts/international-transfer', {
        transferCode: receiverCode,
        locale: 'ar'
      });

      if (response.ok) {
        const result = await response.json();
        
        // فتح صفحة الطباعة في نافذة جديدة
        window.open(
          `/api/receipts/${result.receiptId}/print`,
          '_blank',
          'width=800,height=900,toolbar=no,menubar=no,scrollbars=yes,resizable=yes'
        );

        toast({
          title: "✅ تم إنشاء الإيصال بنجاح",
          description: `تم فتح الإيصال في نافذة جديدة للطباعة - كود الاستلام: ${result.transferCode}`,
          duration: 5000,
        });
      } else {
        const error = await response.json();
        toast({
          title: "خطأ في إنشاء الإيصال",
          description: error.message || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setGeneratingReceiptId(null);
    }
  };

  // دوال الاختيار المتعدد والحذف
  const handleSelectTransfer = (transferId: number, checked: boolean) => {
    const newSelected = new Set(selectedTransfers);
    if (checked) {
      newSelected.add(transferId);
    } else {
      newSelected.delete(transferId);
    }
    setSelectedTransfers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allTransferIds = new Set(transfersData.map((t: any) => t.id));
      setSelectedTransfers(allTransferIds);
    } else {
      setSelectedTransfers(new Set());
    }
  };

  const deleteSelectedTransfers = async () => {
    if (selectedTransfers.size === 0) {
      toast({
        title: "لا يوجد عناصر محددة",
        description: "يرجى اختيار التحويلات المراد حذفها",
        variant: "destructive",
      });
      return;
    }

    const confirmMessage = selectedTransfers.size === 1 
      ? "هل أنت متأكد من إخفاء هذا التحويل من عرضك؟" 
      : `هل أنت متأكد من إخفاء ${selectedTransfers.size} تحويل من عرضك؟`;
    
    if (!confirm(confirmMessage + "\n\nملاحظة: التحويل سيختفي من عرضك فقط ولن يؤثر على المستخدم الآخر.")) {
      return;
    }

    setIsDeletingTransfers(true);

    try {
      const transferIds = Array.from(selectedTransfers);
      console.log('🚀 إرسال طلب حذف للتحويلات:', transferIds);
      console.log('👤 المستخدم الحالي:', user?.id, 'نوع:', user?.type);
      
      const response = await apiRequest('DELETE', '/api/inter-office-transfers/bulk', {
        transferIds: transferIds
      });
      
      console.log('📦 رد الخادم:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "✅ تم إخفاء التحويلات بنجاح",
          description: `تم إخفاء ${result.deletedCount} تحويل من عرضك`,
          duration: 5000,
        });

        // تحديث البيانات
        queryClient.invalidateQueries({ queryKey: ['/api/inter-office-transfers'] });
        setSelectedTransfers(new Set());
      } else {
        const error = await response.json();
        toast({
          title: "خطأ في حذف التحويلات",
          description: error.message || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting transfers:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setIsDeletingTransfers(false);
    }
  };

  // تعبئة الحقل بالعمولة الحالية عند تحميل البيانات
  useEffect(() => {
    if (commissionsData?.myCommission) {
      setNewCommissionRate(commissionsData.myCommission.commission);
    }
  }, [commissionsData]);

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="mb-4">
        <BackToDashboardButton />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التحويل بين الدولي</h1>
          <p className="text-muted-foreground mt-2">
            تحويل الأموال إلى مكاتب الصرافة المعتمدة مع نظام خصم العمولات المتقدم
          </p>
        </div>
      </div>
      {/* محتوى الصفحة الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* نموذج التحويل */}
        <div className="space-y-6">
            {/* نموذج التحويل */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  إجراء تحويل جديد
                </CardTitle>
                <CardDescription>
                  تحويل الأموال مع خصم العمولات مباشرة وحفظ المبلغ للاستلام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">الدولة المقصودة</label>
                  <p className="text-xs text-gray-600 mb-2">
                    الدول المعروضة هي المعتمدة للتحويل الدولي والتي لديها مكاتب نشطة
                  </p>
                  <Select
                    onValueChange={(value) => {
                      setSelectedCountry(value);
                      setAvailableOffices([]);
                      form.setValue("receiverOfficeId", "");
                      form.setValue("destinationCountry", value); // ربط الدولة بالنموذج
                    }}
                    value={selectedCountry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدولة المقصودة" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name} ({country.office_count} مكتب)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  control={form.control}
                  name="receiverOfficeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اختر المكتب المستلم</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedCountry ? "اختر المكتب" : "اختر الدولة أولاً"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {!selectedCountry ? (
                            <SelectItem value="none" disabled>
                              يرجى اختيار الدولة أولاً
                            </SelectItem>
                          ) : availableOffices.length === 0 ? (
                            <SelectItem value="none" disabled>
                              لا توجد مكاتب متاحة في هذه الدولة
                            </SelectItem>
                          ) : (
                            availableOffices.map((office: any) => (
                              <SelectItem key={office.id} value={office.id.toString()}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{office.officeName} - {office.city}</span>
                                  <span className="text-sm text-green-600 font-semibold">
                                    {officeCommissions[office.id]?.displayText || '1.5%'}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المرسل</FormLabel>
                        <FormControl>
                          <Input placeholder="الاسم الكامل" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم هاتف المرسل</FormLabel>
                        <FormControl>
                          <Input placeholder="+218..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="receiverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستلم</FormLabel>
                        <FormControl>
                          <Input placeholder="الاسم الكامل" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiverPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم هاتف المستلم</FormLabel>
                        <FormControl>
                          <Input placeholder="رقم الهاتف المحلي" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المبلغ</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العملة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LYD">دينار ليبي (LYD)</SelectItem>
                            <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                            <SelectItem value="EUR">يورو (EUR)</SelectItem>
                            <SelectItem value="GBP">جنيه إسترليني (GBP)</SelectItem>
                            <SelectItem value="TRY">ليرة تركية (TRY)</SelectItem>
                            <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                            <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* عرض الرصيد المتاح */}
                {form.watch("currency") && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      الرصيد المتاح: {parseFloat(balances[form.watch("currency")] || "0").toFixed(2)} {form.watch("currency")}
                    </p>
                  </div>
                )}

                {/* ملخص التكاليف */}
                {form.watch("amount") && form.watch("receiverOfficeId") && form.watch("currency") && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      ملخص التكاليف
                    </h4>
                    {(() => {
                      const amount = parseFloat(form.watch("amount") || "0");
                      const currency = form.watch("currency");
                      const officeId = form.watch("receiverOfficeId");
                      
                      // حساب عمولة النظام حسب النوع - FORCE CORRECT VALUES
                      console.log(`🔍 بيانات عمولة النظام الواردة:`, systemCommissionData);
                      console.log(`🔍 معدل عمولة النظام الحالي:`, systemCommissionRate);
                      
                      let systemCommission = 0;
                      let systemCommissionDisplay = 'غير محدد';
                      
                      // استخدام البيانات من النظام مباشرة
                      if (systemCommissionData && systemCommissionData.length > 0) {
                        const internationalRate = systemCommissionData.find((rate: any) => 
                          rate.transferType === 'international' && rate.currency === 'USD' // البحث بـ USD دائماً للتحويلات الدولية
                        );
                        
                        if (internationalRate) {
                          if (internationalRate.fixedAmount && parseFloat(internationalRate.fixedAmount) > 0) {
                            // تحويل العمولة من USD إلى العملة المطلوبة إذا لزم الأمر
                            const baseCommission = parseFloat(internationalRate.fixedAmount);
                            if (currency === 'USD') {
                              systemCommission = baseCommission;
                            } else if (currency === 'LYD') {
                              // تحويل تقريبي 1 USD = 4.85 LYD
                              systemCommission = baseCommission * 4.85;
                            } else {
                              // للعملات الأخرى، استخدم USD كقاعدة
                              systemCommission = baseCommission;
                            }
                            systemCommissionDisplay = `${systemCommission.toFixed(2)} ${currency} ثابت`;
                            console.log(`✅ استخدام قيمة ثابتة للنظام: ${systemCommission} ${currency} (أساس: ${baseCommission} USD)`);
                          } else if (internationalRate.perMilleRate && parseFloat(internationalRate.perMilleRate) > 0) {
                            systemCommission = amount * (parseFloat(internationalRate.perMilleRate) / 1000);
                            systemCommissionDisplay = `${parseFloat(internationalRate.perMilleRate)}‰`;
                            console.log(`✅ استخدام نسبة في الألف للنظام: ${systemCommission} ${currency}`);
                          } else if (internationalRate.commissionRate && parseFloat(internationalRate.commissionRate) > 0) {
                            systemCommission = amount * parseFloat(internationalRate.commissionRate);
                            systemCommissionDisplay = `${(parseFloat(internationalRate.commissionRate) * 100).toFixed(1)}%`;
                            console.log(`✅ استخدام نسبة مئوية للنظام: ${systemCommission} ${currency}`);
                          }
                        } else {
                          console.log(`⚠️ لم توجد إعدادات للنوع الدولي مع عملة USD`);
                        }
                      } else {
                        console.log(`⚠️ لا توجد بيانات عمولة النظام`);
                      }
                      
                      // Fallback للقيم القديمة إذا لم تكن البيانات الجديدة متاحة
                      if (systemCommission === 0) {
                        if (systemCommissionData?.rateType === 'fixed') {
                          systemCommission = systemCommissionRate;
                          systemCommissionDisplay = `${systemCommissionRate.toFixed(2)} ${currency} ثابت`;
                        } else if (systemCommissionData?.rateType === 'per_mille') {
                          systemCommission = amount * (systemCommissionRate / 1000);
                          systemCommissionDisplay = `${systemCommissionRate.toFixed(1)}‰`;
                        } else {
                          systemCommission = amount * systemCommissionRate;
                          systemCommissionDisplay = `${(systemCommissionRate * 100).toFixed(1)}%`;
                        }
                        console.log(`🔄 استخدام القيم الاحتياطية: ${systemCommission} ${currency}`);
                      }
                      
                      // تحديد نوع عمولة المكتب - استخدام البيانات الفعلية من API
                      const officeCommissionData = officeCommissions[officeId];
                      const selectedOffice = availableOffices.find(office => office.id === officeId);
                      
                      console.log(`🔍 بيانات عمولة المكتب ${officeId}:`, officeCommissionData);
                      console.log(`🔍 المكتب المحدد:`, selectedOffice);
                      
                      let officeCommission = 0;
                      let officeCommissionDisplay = 'غير محدد';
                      
                      // استخدام البيانات المحفوظة مباشرة
                      if (officeCommissionData) {
                        console.log(`🎯 استخدام بيانات المكتب المحفوظة للمكتب ${officeId}:`, officeCommissionData);
                        
                        if (officeCommissionData.type === 'fixed') {
                          // عمولة ثابتة - تحويل من USD إلى العملة المطلوبة إذا لزم الأمر
                          const baseCommission = parseFloat(String(officeCommissionData.value));
                          if (currency === 'USD') {
                            officeCommission = baseCommission;
                          } else if (currency === 'LYD') {
                            // تحويل تقريبي 1 USD = 4.85 LYD
                            officeCommission = baseCommission * 4.85;
                          } else {
                            // للعملات الأخرى، استخدم USD كقاعدة
                            officeCommission = baseCommission;
                          }
                          officeCommissionDisplay = `${officeCommission.toFixed(2)} ${currency} ثابت`;
                          console.log(`✅ عمولة ثابتة: ${officeCommission} ${currency} (أساس: ${baseCommission} USD)`);
                        } else {
                          // عمولة نسبية - احسب النسبة من المبلغ
                          officeCommission = amount * (parseFloat(String(officeCommissionData.value)) / 100);
                          officeCommissionDisplay = officeCommissionData.displayText;
                          console.log(`✅ عمولة نسبية: ${officeCommission} ${currency} (${officeCommissionData.value}%)`);
                        }
                      } else {
                        // افتراضي (نسبي 1.5%) عند عدم وجود بيانات
                        officeCommission = amount * 0.015;
                        officeCommissionDisplay = '1.5% (افتراضي)';
                        console.log(`⚠️ لا توجد بيانات عمولة للمكتب ${officeId}, استخدام القيمة الافتراضية: ${officeCommission} ${currency}`);
                      }
                      const totalRequired = amount + systemCommission + officeCommission;
                      const receiverAmount = amount + officeCommission;
                      
                      return (
                        <div className="space-y-4">
                          {/* المبلغ الأصلي */}
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-blue-800">المبلغ الأصلي المطلوب إرساله:</span>
                              <span className="font-bold text-blue-900">{amount.toFixed(2)} {currency}</span>
                            </div>
                          </div>
                          
                          {/* العمولات */}
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-700 border-b pb-1 text-sm">العمولات المطلوبة:</h5>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">• عمولة النظام ({systemCommissionDisplay}):</span>
                              <span className="font-medium text-red-600">{systemCommission.toFixed(2)} {currency}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">• عمولة مكتب الاستقبال ({officeCommissionDisplay}):</span>
                              <span className="font-medium text-green-600">{officeCommission.toFixed(2)} {currency}</span>
                            </div>
                            
                            <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                              <p><strong>ملاحظة:</strong> عمولة النظام يدفعها المرسل - عمولة المكتب تُضاف لرصيد المستلم</p>
                            </div>
                          </div>
                          
                          <hr className="border-blue-300" />
                          
                          {/* الحسابات النهائية */}
                          <div className="space-y-3">
                            <h5 className="font-semibold text-gray-700 border-b pb-1 text-sm">الحساب النهائي:</h5>
                            
                            {/* رصيد المستلم */}
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-green-800">المبلغ الذي سيحصل عليه المستلم:</span>
                                <span className="font-bold text-green-900">{receiverAmount.toFixed(2)} {currency}</span>
                              </div>
                              <div className="text-xs text-green-700 mt-1">
                                المبلغ الأصلي ({amount.toFixed(2)}) + عمولة المكتب ({officeCommission.toFixed(2)}) = {receiverAmount.toFixed(2)}
                              </div>
                            </div>
                            
                            {/* المطلوب من المرسل */}
                            <div className="bg-orange-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-orange-800">إجمالي المبلغ المطلوب منك:</span>
                                <span className="font-bold text-orange-900">{totalRequired.toFixed(2)} {currency}</span>
                              </div>
                              <div className="text-xs text-orange-700 mt-1">
                                المبلغ الأصلي ({amount.toFixed(2)}) + عمولة النظام ({systemCommission.toFixed(2)}) + عمولة المكتب ({officeCommission.toFixed(2)})
                              </div>
                            </div>
                          </div>
                          
                          {parseFloat(balances[currency] || "0") < totalRequired && (
                            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-center">
                              <p className="font-medium">⚠️ رصيدك غير كافي</p>
                              <p className="text-sm">تحتاج {totalRequired.toFixed(2)} {currency} ولديك {parseFloat(balances[currency] || "0").toFixed(2)} {currency}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات (اختياري)</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل أي ملاحظات..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                  disabled={isSubmitting || !selectedCountry}
                  onClick={() => {
                    console.log('🔘 Button clicked!');
                    console.log('Form errors:', form.formState.errors);
                    console.log('Form values:', form.getValues());
                    console.log('Form is valid:', form.formState.isValid);
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري إنشاء التحويل...
                    </>
                  ) : (
                    "إنشاء التحويل الدولي"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <div className="space-y-6">
          {/* الأرصدة المتاحة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                الأرصدة المتاحة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(balances).map(([currency, amount]) => (
                  <div key={currency} className="flex justify-between items-center">
                    <span className="font-medium">{currency}</span>
                    <Badge variant="outline">
                      {parseFloat(amount).toFixed(2)} {currency}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* المكاتب المعتمدة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                المكاتب المعتمدة دولياً
              </CardTitle>
              <CardDescription>
                {selectedCountry ? `المكاتب المتاحة في ${countries.find(c => c.code === selectedCountry)?.name || selectedCountry}` : 'اختر دولة لعرض المكاتب المعتمدة'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {!selectedCountry ? (
                  <p className="text-muted-foreground text-center py-4">
                    يرجى اختيار دولة الوجهة لعرض المكاتب المعتمدة
                  </p>
                ) : availableOffices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    لا توجد مكاتب معتمدة في هذه الدولة
                  </p>
                ) : (
                  availableOffices.map((office: any) => (
                    <div key={office.id} className="p-2 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{office.officeName}</div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {officeCommissions[office.id]?.displayText || '1.5%'} عمولة
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {office.city} • {office.officeCode}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {office.address}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* سجل التحويلات */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل التحويلات الدولية
              </CardTitle>
              <CardDescription>
                جميع التحويلات التي قمت بإجرائها بين المكاتب
              </CardDescription>
              {transfersData.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedTransfers.size === transfersData.length && transfersData.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="اختيار الكل"
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedTransfers.size > 0 ? `تم اختيار ${selectedTransfers.size} من ${transfersData.length}` : 'اختيار الكل'}
                    </span>
                  </div>
                  {selectedTransfers.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedTransfers}
                      disabled={isDeletingTransfers}
                      className="flex items-center gap-2"
                    >
                      {isDeletingTransfers ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                      {isDeletingTransfers ? 'جاري الإخفاء...' : `إخفاء المحدد (${selectedTransfers.size})`}
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {transfersData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد تحويلات مسجلة بعد</p>
                  <p className="text-sm">ابدأ بإجراء تحويل جديد</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedTransfers.size === transfersData.length && transfersData.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="اختيار الكل"
                        />
                      </TableHead>
                      <TableHead>المستلم</TableHead>
                      <TableHead>الدولة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>رمز التحويل</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfersData.map((transfer: any) => (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedTransfers.has(transfer.id)}
                            onCheckedChange={(checked) => handleSelectTransfer(transfer.id, checked as boolean)}
                            aria-label={`اختيار تحويل ${transfer.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{transfer.receiverName}</TableCell>
                        <TableCell>{transfer.destinationCountry}</TableCell>
                        <TableCell>
                          {parseFloat(transfer.amount).toFixed(2)} {transfer.currency || 'LYD'}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {transfer.senderId === user?.id 
                              ? transfer.transferCode 
                              : (transfer.destinationAgentId === user?.id && (transfer.status === 'completed' || transfer.status === 'canceled')
                                  ? transfer.transferCode 
                                  : "***")
                            }
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            transfer.status === 'completed' 
                              ? 'default' 
                              : transfer.status === 'canceled' 
                                ? 'destructive' 
                                : 'secondary'
                          }>
                            {transfer.status === 'completed' 
                              ? 'مكتمل' 
                              : transfer.status === 'canceled' 
                                ? 'ملغي' 
                                : 'معلق'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(transfer.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {/* زر الإيصال */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateReceipt(transfer.receiverCode, transfer.id)}
                              disabled={
                                generatingReceiptId === transfer.id || 
                                !transfer.receiverCode || 
                                (transfer.senderId !== user?.id && 
                                 !(transfer.destinationAgentId === user?.id && transfer.status === 'completed'))
                              }
                              className="flex items-center gap-1"
                            >
                              {generatingReceiptId === transfer.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Receipt className="h-3 w-3" />
                              )}
                              {generatingReceiptId === transfer.id ? "إنشاء..." : "إيصال"}
                            </Button>

                            {/* زر الإلغاء - للمرسل فقط والحوالات المعلقة */}
                            {transfer.senderId === user?.id && transfer.status === 'pending' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelTransfer(transfer.id, transfer.transferCode)}
                                disabled={cancelingTransferId === transfer.id}
                                className="flex items-center gap-1"
                              >
                                {cancelingTransferId === transfer.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                {cancelingTransferId === transfer.id ? "إلغاء..." : "إلغاء"}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* إعدادات العمولة للوكلاء والمدراء */}
          {(user?.type === "agent" || user?.type === "admin") && (
            <div className="space-y-6">
              {/* معلومات توضيحية */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  يمكنك تحديد نسبة عمولة مختلفة لكل عملة في التحويلات بين المكاتب. العمولة تُضاف لرصيدك عند استلام الحوالات.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* نموذج إضافة/تعديل العمولة */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      إضافة عمولة لعملة جديدة
                    </CardTitle>
                    <CardDescription>
                      حدد العملة ونوع العمولة المطلوبة للتحويلات بين المكاتب
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...commissionForm}>
                      <form onSubmit={commissionForm.handleSubmit(onSubmitCommission)} className="space-y-4">
                        {/* اختيار العملة */}
                        <FormField
                          control={commissionForm.control}
                          name="currencyCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>العملة</FormLabel>
                              <FormControl>
                                <Select 
                                  onValueChange={field.onChange} 
                                  value={field.value}
                                  disabled={!!editingCommission}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر العملة" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableCurrencies.map((currency) => (
                                      <SelectItem key={currency.code} value={currency.code}>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{currency.symbol}</span>
                                          <span>{currency.name}</span>
                                          <span className="text-sm text-muted-foreground">({currency.code})</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* نوع العمولة */}
                        <FormField
                          control={commissionForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نوع العمولة</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-col space-y-2"
                                >
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <RadioGroupItem value="percentage" id="percentage" />
                                    <Label htmlFor="percentage" className="flex items-center gap-2 cursor-pointer">
                                      <Percent className="h-4 w-4" />
                                      نسبة مئوية (%)
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <RadioGroupItem value="fixed" id="fixed" />
                                    <Label htmlFor="fixed" className="flex items-center gap-2 cursor-pointer">
                                      <DollarSign className="h-4 w-4" />
                                      مبلغ ثابت
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* قيمة العمولة */}
                        <FormField
                          control={commissionForm.control}
                          name="value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {commissionForm.watch("type") === 'percentage' ? 'النسبة المئوية' : 'المبلغ الثابت'}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={commissionForm.watch("type") === 'percentage' ? "100" : undefined}
                                  placeholder={commissionForm.watch("type") === 'percentage' ? "مثال: 4.0" : "مثال: 10"}
                                />
                              </FormControl>
                              <p className="text-sm text-muted-foreground">
                                {commissionForm.watch("type") === 'percentage' 
                                  ? 'أدخل النسبة المئوية (من 0 إلى 100)' 
                                  : 'أدخل المبلغ الثابت بالعملة المحددة'
                                }
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* أزرار التحكم */}
                        <div className="flex gap-2 pt-4">
                          {editingCommission ? (
                            <>
                              <Button 
                                type="submit" 
                                className="flex-1"
                                disabled={addCommissionMutation.isPending}
                              >
                                {addCommissionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                                تحديث العمولة
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleCancelEdit}
                              >
                                إلغاء
                              </Button>
                            </>
                          ) : (
                            <Button 
                              type="submit" 
                              className="flex-1"
                              disabled={addCommissionMutation.isPending || availableCurrencies.length === 0}
                            >
                              {addCommissionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                              إضافة العمولة
                            </Button>
                          )}
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* عرض العمولات الحالية */}
                <Card>
                  <CardHeader>
                    <CardTitle>عمولات العملات المحددة</CardTitle>
                    <CardDescription>
                      العمولات المحددة حاليًا لكل عملة في التحويلات بين المكاتب
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {agentCommissionsLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-muted-foreground">جاري تحميل العمولات...</p>
                      </div>
                    ) : agentCommissions.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">لم يتم تحديد أي عمولات بعد</p>
                        <p className="text-sm text-muted-foreground">قم بإضافة إعدادات العمولة للعملات المختلفة</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {agentCommissions.map((commission: AgentCommissionSetting) => (
                          <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-lg">
                                  {SUPPORTED_CURRENCIES.find(c => c.code === commission.currencyCode)?.symbol}
                                </span>
                                <div>
                                  <p className="font-medium">
                                    {SUPPORTED_CURRENCIES.find(c => c.code === commission.currencyCode)?.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {commission.currencyCode}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-medium">
                                  {commission.type === 'percentage' 
                                    ? `${commission.value}%`
                                    : `${commission.value} ${SUPPORTED_CURRENCIES.find(c => c.code === commission.currencyCode)?.symbol}`
                                  }
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {commission.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditCommission(commission)}
                                  disabled={addCommissionMutation.isPending}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteCommissionMutation.mutate(commission.id)}
                                  disabled={deleteCommissionMutation.isPending}
                                >
                                  {deleteCommissionMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* رسالة توضيحية */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Calculator className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">مثال على كيفية عمل العمولة</p>
                    <p className="text-sm mt-2">
                      إذا حددت عمولة 4% للدولار الأمريكي، فعند استلام حوالة 1000 دولار ستحصل على 40 دولار كعمولة
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}