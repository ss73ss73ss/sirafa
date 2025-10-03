import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePageRestriction } from "@/hooks/use-access-control";
import { Guard } from "@/components/Guard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useMarketSocket, useBalanceSocket, useSocket } from "@/hooks/use-socket";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { marketOfferSchema, type MarketOfferInput, type MarketOfferEnhanced, type MarketOfferChat } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { formatCurrency as formatCurrencyWestern, formatNumber } from "@/lib/number-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CircleDollarSign, 
  RefreshCw, 
  ArrowLeftRight, 
  Plus, 
  Check, 
  X, 
  ShoppingCart,
  ChevronRight,
  MessageSquare,
  ArrowUpDown,
  ArrowRight,
  CheckCircle,
  Send,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";


const currencies = ["LYD", "USD", "EUR", "TRY", "AED", "EGP", "TND", "GBP"];

interface ExecuteOfferFormData {
  amount: string;
}

interface MarketMessage {
  id: number;
  userId: number;
  userFullName: string;
  content: string;
  messageType: string;
  createdAt: string;
}

export default function MarketPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 🚀 تفعيل الأحداث اللحظية للسوق
  const socket = useSocket();
  const marketSocket = useMarketSocket();
  const balanceSocket = useBalanceSocket();

  // State hooks - يجب أن تكون في المقدمة قبل أي return
  const [activeTab, setActiveTab] = useState("market");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<MarketOfferEnhanced | null>(null);
  const [filters, setFilters] = useState({
    offerType: "",
    fromCurrency: "",
    toCurrency: "",
  });

  // Chat states
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showInlineTrade, setShowInlineTrade] = useState<number | null>(null);
  const [selectedChatOffer, setSelectedChatOffer] = useState<MarketOfferChat | null>(null);
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeNotes, setTradeNotes] = useState("");

  // Market offers query - يحدث تلقائياً عبر الأحداث اللحظية
  const {
    data: marketOffers = [],
    isLoading: isLoadingOffers,
    refetch: refetchOffers,
  } = useQuery<MarketOfferEnhanced[]>({
    queryKey: ["/api/market"],
    queryFn: getQueryFn({ on401: "throw" }),
    staleTime: 30 * 1000, // 30 ثانية حتى نتأكد من عمل الأحداث اللحظية
    refetchInterval: 10000, // كإجراء احتياطي حتى نتأكد من الأحداث اللحظية
  });

  // User's market offers query
  const {
    data: myOffers = [],
    isLoading: isLoadingMyOffers,
    refetch: refetchMyOffers,
  } = useQuery<MarketOfferEnhanced[]>({
    queryKey: ["/api/market/my-offers"],
    queryFn: getQueryFn({ on401: "throw" }),
  });


  // User's balances query
  const {
    data: balances,
    isLoading: isLoadingBalances,
  } = useQuery<{ balances: Record<string, string | number> }>({
    queryKey: ["/api/balance"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Commission earnings query
  const { data: commissionData } = useQuery<{earnings: any[], totals: Record<string, number>}>({
    queryKey: ['/api/commission/earnings'],
  });

  // Chat messages query - يحدث تلقائياً عبر WebSocket
  const { data: marketMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/market/messages'],
    staleTime: 30 * 1000, // 30 ثانية حتى نتأكد من عمل الأحداث اللحظية
    refetchInterval: 10000, // كإجراء احتياطي حتى نتأكد من الأحداث اللحظية
  });

  // Market offers for chat query - يحدث تلقائياً عبر الأحداث اللحظية
  const { data: chatOffers, isLoading: chatOffersLoading } = useQuery({
    queryKey: ['/api/market/offers'],
    staleTime: 30 * 1000, // 30 ثانية حتى نتأكد من عمل الأحداث اللحظية
    refetchInterval: 10000, // كإجراء احتياطي حتى نتأكد من الأحداث اللحظية
  });

  // فحص القيود للصفحة - بعد جميع hooks
  const { data: restrictionData, isLoading: isCheckingRestriction } = usePageRestriction('market');

  // 🔌 تهيئة اتصال Socket.IO والانضمام لغرف السوق
  useEffect(() => {
    console.log('🔧 تهيئة Socket.IO في صفحة السوق...');
    const token = localStorage.getItem('token');
    
    if (token) {
      console.log('🔑 رمز المصادقة موجود، بدء الاتصال...');
      socket.connect(token);
      
      // الانتظار للاتصال ثم الانضمام للغرف
      setTimeout(() => {
        if (socket.isConnected) {
          socket.joinRoom('market-general');
          socket.joinRoom('market-USD-LYD');
          console.log('🏠 انضم لغرف السوق: market-general, market-USD-LYD');
        } else {
          console.warn('⚠️ Socket.IO غير متصل بعد المهلة الزمنية');
        }
      }, 2000);
    } else {
      console.error('❌ لا يوجد رمز مصادقة في localStorage');
    }
    
    return () => {
      if (socket.isConnected) {
        socket.leaveRoom('market-general');
        socket.leaveRoom('market-USD-LYD');
        console.log('🚪 غادر غرف السوق');
      }
    };
  }, [socket]);

  // مراقبة حالة الاتصال
  useEffect(() => {
    console.log(`🔗 حالة Socket.IO: متصل=${socket.isConnected}, مصادق=${socket.isAuthenticated}`);
  }, [socket.isConnected, socket.isAuthenticated]);

  // Create offer form
  const createOfferForm = useForm({
    resolver: zodResolver(marketOfferSchema),
    defaultValues: {
      side: "sell",
      baseCurrency: "",
      quoteCurrency: "",
      minAmount: "",
      maxAmount: "",
      price: "",
      expirationMinutes: 1440, // يوم واحد افتراضياً (24 ساعة × 60 دقيقة)
    },
  } as const);

  // Execute offer form
  const executeOfferForm = useForm<ExecuteOfferFormData>({
    defaultValues: {
      amount: "",
    },
  });

  // Create offer mutation
  const createOfferMutation = useMutation({
    mutationFn: async (data: MarketOfferInput) => {
      const res = await apiRequest("/api/market", "POST", data);
      return await res.json();
    },
    onSuccess: async (result, variables) => {
      toast({
        title: "تم إنشاء العرض",
        description: "تم إنشاء عرض السوق بنجاح.",
        variant: "default",
      });
      setCreateDialogOpen(false);
      createOfferForm.reset();
      
      // إرسال رسالة تلقائية إلى دردشة السوق المباشر
      const offerMessage = `🚀 عرض جديد في السوق!\n\n` +
        `📊 النوع: ${variables.side === 'sell' ? 'بيع' : 'شراء'}\n` +
        `💰 ${variables.baseCurrency} → ${variables.quoteCurrency}\n` +
        `📈 السعر: ${variables.price} ${variables.quoteCurrency}\n` +
        `📦 الكمية: ${variables.minAmount} - ${variables.maxAmount} ${variables.baseCurrency}\n\n` +
        `✨ متاح الآن للتداول المباشر!`;
      
      try {
        await apiRequest('/api/market/messages', 'POST', { content: offerMessage });
        console.log('✅ تم إرسال العرض إلى دردشة السوق بنجاح');
      } catch (error) {
        console.log('⚠️ فشل في إرسال رسالة العرض للدردشة:', error);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      queryClient.invalidateQueries({ queryKey: ["/api/market/my-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ['/api/market/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market/offers'] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل إنشاء العرض",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel offer mutation
  const cancelOfferMutation = useMutation({
    mutationFn: async (offerId: number) => {
      console.log('📤 إرسال طلب إلغاء العرض:', offerId);
      const res = await apiRequest(`/api/market/${offerId}/cancel`, "DELETE", {});
      const result = await res.json();
      console.log('📥 استجابة الخادم:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ تم إلغاء العرض بنجاح:', data);
      toast({
        title: "تم إلغاء العرض",
        description: "تم إلغاء عرض السوق بنجاح وإعادة الأموال إلى رصيدك.",
        variant: "default",
      });
      // تنظيف شامل للكاش لضمان التحديث الصحيح
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      queryClient.invalidateQueries({ queryKey: ["/api/market/my-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/market/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      // إعادة جلب فورية لضمان التحديث
      refetchOffers();
    },
    onError: (error: Error) => {
      console.error('❌ خطأ في إلغاء العرض:', error);
      toast({
        title: "فشل إلغاء العرض",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Execute offer mutation
  const executeOfferMutation = useMutation({
    mutationFn: async ({ offerId, amount }: { offerId: number; amount: string }) => {
      const res = await apiRequest(`/api/market/${offerId}/execute`, "POST", { amount });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم تنفيذ العملية",
        description: `تم شراء ${data.exchange.received} بنجاح.`,
        variant: "default",
      });
      setExecuteDialogOpen(false);
      executeOfferForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تنفيذ العملية",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // إرسال رسالة
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string }) => {
      console.log('📤 إرسال رسالة:', messageData.content);
      const response = await apiRequest('/api/market/messages', 'POST', messageData);
      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ['/api/market/messages'] });
      
      // التمرير لأسفل بعد إرسال الرسالة
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (error: any) => {
      console.error('خطأ في إرسال الرسالة:', error);
      toast({
        title: "فشل في إرسال الرسالة",
        description: error?.response?.data?.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  });

  // تنفيذ الصفقة المدمجة
  const executeInlineTradeMutation = useMutation({
    mutationFn: async (tradeData: {
      offerId: number;
      amount: number;
      notes?: string;
    }) => {
      const response = await apiRequest(`/api/market/${tradeData.offerId}/execute`, 'POST', {
        amount: tradeData.amount,
        notes: tradeData.notes
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تمت الصفقة بنجاح! ✅",
        description: `تم تنفيذ الصفقة رقم ${data.referenceNumber}`,
        variant: "default",
      });
      
      // إخفاء النموذج وتنظيف البيانات
      setShowInlineTrade(null);
      setSelectedChatOffer(null);
      setTradeAmount("");
      setTradeNotes("");
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ['/api/market/offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: any) => {
      console.error('خطأ في تنفيذ الصفقة:', error);
      const errorMessage = error?.response?.data?.message || error.message || "حدث خطأ غير متوقع";
      toast({
        title: "فشل في تنفيذ الصفقة ❌",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Handle create offer form submission
  const onCreateOfferSubmit = (formData: any) => {
    // Convert string values to numbers where needed
    const data = {
      ...formData,
      minAmount: Number(formData.minAmount),
      maxAmount: Number(formData.maxAmount),
      price: Number(formData.price)
    };
    createOfferMutation.mutate(data);
  };

  // Handle execute offer form submission
  const onExecuteOfferSubmit = (data: ExecuteOfferFormData) => {
    if (!selectedOffer) return;
    
    executeOfferMutation.mutate({
      offerId: selectedOffer.id,
      amount: data.amount,
    });
  };

  // Handle offer cancellation
  const handleCancelOffer = (offerId: number) => {
    console.log('🔄 محاولة إلغاء العرض رقم:', offerId);
    
    // منع الضغط المتعدد أثناء المعالجة
    if (cancelOfferMutation.isPending) {
      console.log('⏳ عملية الإلغاء جارية بالفعل، يُرجى الانتظار...');
      toast({
        title: "عملية جارية",
        description: "يُرجى الانتظار حتى انتهاء العملية الحالية",
        variant: "default",
      });
      return;
    }
    
    if (confirm("هل أنت متأكد من رغبتك في إلغاء هذا العرض؟")) {
      console.log('✅ تأكيد إلغاء العرض، جاري الإرسال...');
      cancelOfferMutation.mutate(offerId);
    } else {
      console.log('❌ تم إلغاء العملية من قبل المستخدم');
    }
  };

  // Handle opening execute offer dialog
  const handleExecuteOffer = (offer: MarketOfferEnhanced) => {
    setSelectedOffer(offer);
    executeOfferForm.setValue("amount", (offer.available || offer.remainingAmount || offer.maxAmount || "0").toString());
    setExecuteDialogOpen(true);
  };

  // Chat handlers
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate({ content: messageInput.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBidOffer = (offerId: number) => {
    console.log('🎯 بدء التداول للعرض:', offerId);
    
    // تنظيف النموذج
    setTradeAmount("");
    setTradeNotes("");
    
    // عرض نموذج التداول المدمج في الدردشة بالعرض الجديد
    const offerData = (chatOffers as MarketOfferChat[])?.find(o => o.id === offerId);
    if (offerData) {
      setTimeout(() => {
        setSelectedChatOffer(offerData);
        setTradeAmount(offerData.minAmount.toString());
        setShowInlineTrade(offerId);
      }, 100);
    }
  };

  const handleViewOfferDetails = (offerId: number) => {
    console.log('عرض تفاصيل العرض:', offerId);
  };

  const handleExecuteInlineTrade = () => {
    if (!selectedChatOffer || !tradeAmount) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تحديد الكمية",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(tradeAmount);
    const maxAllowed = Math.min(Number(selectedChatOffer.maxAmount), Number(selectedChatOffer.remainingAmount));
    
    if (amount < Number(selectedChatOffer.minAmount) || amount > maxAllowed) {
      toast({
        title: "كمية غير صالحة",
        description: `يجب أن تكون الكمية بين ${selectedChatOffer.minAmount} و ${maxAllowed}`,
        variant: "destructive",
      });
      return;
    }
    
    executeInlineTradeMutation.mutate({
      offerId: selectedChatOffer.id,
      amount: amount,
      notes: tradeNotes || "",
    });
  };

  // تحديث العرض المختار عند تحديث البيانات
  useEffect(() => {
    if (showInlineTrade && chatOffers) {
      const freshOffer = (chatOffers as MarketOfferChat[])?.find(o => o.id === showInlineTrade);
      if (freshOffer) {
        setSelectedChatOffer(freshOffer);
        
        const currentAmount = parseFloat(tradeAmount || "0");
        if (currentAmount < Number(freshOffer.minAmount) || currentAmount > Math.min(Number(freshOffer.maxAmount), Number(freshOffer.remainingAmount))) {
          setTradeAmount(freshOffer.minAmount.toString());
        }
      }
    }
  }, [chatOffers, showInlineTrade]);

  // التمرير لأسفل عند تحديث الرسائل
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [marketMessages]);

  // Filter market offers with unique IDs to prevent duplicates
  const filteredOffers = useMemo(() => {
    console.log('🔍 معالجة العروض:', marketOffers.length, 'عروض مستلمة');
    
    // إزالة التكرار الكامل باستخدام Map بناءً على ID
    const uniqueOffers = new Map();
    marketOffers.forEach((offer) => {
      // استخدام ID كمفتاح فريد - يحل مشكلة التكرار
      uniqueOffers.set(offer.id, offer);
    });
    
    const uniqueArray = Array.from(uniqueOffers.values());
    console.log('✅ العروض الفريدة بعد إزالة التكرار:', uniqueArray.length);
    
    // تطبيق الفلاتر على العروض الفريدة
    const filtered = uniqueArray.filter((offer) => {
      if (filters.offerType && offer.offerType !== filters.offerType) return false;
      if (filters.fromCurrency && offer.fromCurrency !== filters.fromCurrency) return false;
      if (filters.toCurrency && offer.toCurrency !== filters.toCurrency) return false;
      return true;
    });
    
    console.log('📋 العروض النهائية بعد الفلترة:', filtered.length);
    return filtered;
  }, [marketOffers, filters]);

  return (
    <Guard page="market">
      <div className="golden-page-bg container mx-auto px-1 sm:px-4 py-2 sm:py-4 rtl min-h-screen">
      <div className="flex justify-between items-center mb-2 sm:mb-6">
        <BackToDashboardButton />
        <Button variant="outline" size="sm" onClick={() => refetchOffers()} className="h-6 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm">
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
          <span className="hidden sm:inline">تحديث</span>
        </Button>
        <h1 className="text-lg sm:text-3xl font-bold text-center bg-gradient-to-l from-primary to-primary/70 text-transparent bg-clip-text">
          سوق العملات <CircleDollarSign className="inline-block ml-1 sm:ml-2 h-4 w-4 sm:h-6 sm:w-6" />
        </h1>
        <div></div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-6 sm:h-10 p-0.5 sm:p-1 bg-slate-100 sm:bg-muted border sm:border-0 rounded-md sm:rounded-lg">
          <TabsTrigger value="market" className="flex items-center justify-center text-sm sm:text-base px-1 sm:px-3 py-0.5 sm:py-2 h-6 sm:h-8 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm font-bold !text-black dark:!text-white">
            عروض السوق
          </TabsTrigger>
          <TabsTrigger value="my-offers" className="flex items-center justify-center text-base sm:text-lg px-1 sm:px-3 py-0.5 sm:py-2 h-6 sm:h-8 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm font-black !text-gray-900 dark:!text-gray-100" style={{color: '#1f2937', fontSize: '16px'}}>
            عروضي
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center justify-center text-sm sm:text-base px-1 sm:px-3 py-0.5 sm:py-2 h-6 sm:h-8 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-sm font-bold !text-black dark:!text-white">
            دردشة السوق
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 my-2 sm:my-4">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* عرض العمولات المكتسبة */}
            {commissionData && Object.keys(commissionData.totals).length > 0 && (
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-green-50 dark:bg-green-950 rounded-md border border-green-200">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                <span className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium">
                  عمولات مكتسبة: {Object.entries(commissionData.totals).map(([currency, total]) => 
                    `${total.toFixed(2)} ${currency}`
                  ).join(" + ")}
                </span>
              </div>
            )}
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="h-6 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm mt-2 sm:mt-0">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
            <span className="hidden sm:inline">إضافة عرض جديد</span>
            <span className="sm:hidden">إضافة</span>
          </Button>
        </div>

        {activeTab === "market" && (
          <div className="mb-2 sm:mb-4 flex flex-wrap gap-1 sm:gap-2">
            <Select
              value={filters.offerType === "" ? "all" : filters.offerType}
              onValueChange={(value) => setFilters({ ...filters, offerType: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[100px] sm:w-[150px] h-6 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="نوع العرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل العروض</SelectItem>
                <SelectItem value="sell">بيع</SelectItem>
                <SelectItem value="buy">شراء</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.fromCurrency}
              onValueChange={(value) => setFilters({ ...filters, fromCurrency: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[100px] sm:w-[150px] h-6 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="العملة المصدر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل العملات</SelectItem>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.toCurrency === "" ? "all" : filters.toCurrency}
              onValueChange={(value) => setFilters({ ...filters, toCurrency: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[100px] sm:w-[150px] h-6 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="العملة الهدف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل العملات</SelectItem>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filters.offerType || filters.fromCurrency || filters.toCurrency) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ offerType: "", fromCurrency: "", toCurrency: "" })}
                className="h-6 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">مسح الفلاتر</span>
                <span className="sm:hidden">مسح</span>
              </Button>
            )}
          </div>
        )}

        <TabsContent value="market">
          {isLoadingOffers ? (
            <div className="text-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>جاري تحميل عروض السوق...</p>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">لا توجد عروض متاحة حالياً.</p>
              <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                إنشاء أول عرض
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => (
                <Card key={`market-offer-${offer.id}-${offer.createdAt}`} className="overflow-hidden">
                  <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-6">
                    <div className="flex justify-between items-center">
                      <Badge variant={(offer.side || offer.offerType) === "sell" ? "default" : "outline"}>
                        {(offer.side || offer.offerType) === "sell" ? "بيع" : "شراء"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          offer.userFullName?.includes("مكتب")
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : ""
                        }
                      >
                        {offer.userFullName?.includes("مكتب") ? "مكتب صرافة" : "مستخدم عادي"}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm sm:text-lg mt-1 sm:mt-2 flex items-center justify-between">
                      <span className="font-bold">
                        {offer.baseCurrency || offer.fromCurrency} <ArrowLeftRight className="inline-block mx-1 h-3 w-3 sm:h-4 sm:w-4" />{" "}
                        {offer.quoteCurrency || offer.toCurrency}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">{offer.userFullName}</span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-lg font-medium">
                      السعر المعلن: {formatCurrencyWestern(Number(offer.price || offer.rate || 0), offer.quoteCurrency || offer.toCurrency)}
                      {(offer.side || offer.offerType) === "sell" && offer.userId === user?.id && (
                        <div className="text-xs sm:text-sm text-orange-600 mt-1">
                          * تم خصم عمولة النظام من رصيدك عند النشر
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">الكمية المتاحة:</span>
                        <span className="text-xs sm:text-sm font-medium">
                          {formatCurrencyWestern(Number(offer.available || offer.remainingAmount || 0), offer.baseCurrency || offer.fromCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">الكمية الإجمالية:</span>
                        <span className="text-xs sm:text-sm">{formatCurrencyWestern(Number(offer.amount || offer.maxAmount || 0), offer.baseCurrency || offer.fromCurrency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">تاريخ العرض:</span>
                        <span className="text-xs sm:text-sm">
                          {offer.createdAt ? format(new Date(offer.createdAt), "dd MMMM yyyy", { locale: ar }) : "غير معروف"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-1 sm:pt-2 p-2 sm:p-6 flex justify-between">
                    {offer.userId === user?.id ? (
                      <Badge variant="outline" className="border-0 text-xs sm:text-sm">
                        هذا عرضك
                      </Badge>
                    ) : (
                      <Button onClick={() => handleExecuteOffer(offer)} className="w-full h-6 sm:h-10 text-xs sm:text-sm">
                        <ShoppingCart className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">تنفيذ الصفقة</span>
                        <span className="sm:hidden">تنفيذ</span>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-offers">
          {isLoadingMyOffers ? (
            <div className="text-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>جاري تحميل عروضك...</p>
            </div>
          ) : myOffers.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">لم تقم بإنشاء أي عروض حتى الآن.</p>
              <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                إنشاء أول عرض
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs sm:text-sm text-amber-800 font-medium">💡 ملاحظة حول العمولات:</p>
                <p className="text-xs sm:text-sm text-amber-700 mt-1">
                  • عند إنشاء عرض بيع، يتم خصم المبلغ + العمولة من رصيدك فوراً
                </p>
                <p className="text-xs sm:text-sm text-amber-700">
                  • العمولة تُحول لحساب النظام فقط عند إتمام الشراء
                </p>
                <p className="text-xs sm:text-sm text-amber-700">
                  • إذا ألغيت العرض، ستُرد العمولة لرصيدك
                </p>
              </div>
              {/* جدول للشاشات الكبيرة */}
              <div className="hidden sm:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-2 bg-gray-50 dark:bg-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">عدد العروض: {myOffers.length}</p>
                </div>
                <Table>
                  <TableCaption className="text-gray-700 dark:text-gray-300">قائمة عروضك في السوق</TableCaption>
                  <TableHeader className="bg-gray-100 dark:bg-gray-700">
                    <TableRow>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">التاريخ</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">نوع العرض</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">العملات</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">المبلغ</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">السعر</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">المتاح</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">الحالة</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myOffers.map((offer) => (
                      <TableRow key={offer.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <TableCell className="text-gray-900 dark:text-gray-100 font-medium">
                          {offer.createdAt ? format(new Date(offer.createdAt), "dd/MM/yyyy", { locale: ar }) : "غير معروف"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={(offer.side || offer.offerType) === "sell" ? "default" : "outline"} className="font-medium">
                            {(offer.side || offer.offerType) === "sell" ? "بيع" : "شراء"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100 font-medium">
                          <span className="font-bold text-blue-600 dark:text-blue-400">{offer.baseCurrency || offer.fromCurrency}</span>
                          <ChevronRight className="inline-block h-4 w-4 mx-1" />
                          <span className="font-bold text-green-600 dark:text-green-400">{offer.quoteCurrency || offer.toCurrency}</span>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100 font-bold">
                          {formatCurrencyWestern(Number(offer.maxAmount || offer.amount || 0), offer.baseCurrency || offer.fromCurrency)}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100 font-bold text-green-600 dark:text-green-400">
                          {formatCurrencyWestern(Number(offer.price || offer.rate || 0), offer.quoteCurrency || offer.toCurrency)}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100 font-bold">
                          {formatCurrencyWestern(Number(offer.remainingAmount || offer.available || 0), offer.baseCurrency || offer.fromCurrency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (offer.status === "open" || offer.status === "active")
                                ? "default"
                                : offer.status === "completed"
                                ? "secondary"
                                : "destructive"
                            }
                            className="font-medium"
                          >
                            {(offer.status === "open" || offer.status === "active")
                              ? "نشط"
                              : offer.status === "completed"
                              ? "مكتمل"
                              : "ملغي"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(offer.status === "open" || offer.status === "active") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelOffer(offer.id)}
                              disabled={cancelOfferMutation.isPending}
                              className="font-medium"
                            >
                              {cancelOfferMutation.isPending ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <X className="mr-2 h-4 w-4" />
                              )}
                              {cancelOfferMutation.isPending ? "جاري الإلغاء..." : "إلغاء"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* بطاقات للهواتف المحمولة */}
              <div className="sm:hidden space-y-1">
                {myOffers.map((offer) => (
                  <Card key={offer.id} className="p-1.5">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant={(offer.side || offer.offerType) === "sell" ? "default" : "outline"} className="text-xs px-1 py-0.5">
                        {(offer.side || offer.offerType) === "sell" ? "بيع" : "شراء"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {offer.createdAt ? format(new Date(offer.createdAt), "dd/MM", { locale: ar }) : "غير معروف"}
                      </span>
                    </div>
                    
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">العملات:</span>
                        <span className="font-medium">
                          {offer.baseCurrency || offer.fromCurrency} → {offer.quoteCurrency || offer.toCurrency}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">المبلغ:</span>
                        <span>{formatCurrencyWestern(Number(offer.maxAmount || offer.amount || 0), offer.baseCurrency || offer.fromCurrency)}</span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">السعر:</span>
                        <span>{formatCurrencyWestern(Number(offer.price || offer.rate || 0), offer.quoteCurrency || offer.toCurrency)}</span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">المتاح:</span>
                        <span>{formatCurrencyWestern(Number(offer.remainingAmount || offer.available || 0), offer.baseCurrency || offer.fromCurrency)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1.5">
                      <Badge
                        variant={
                          (offer.status === "open" || offer.status === "active")
                            ? "default"
                            : offer.status === "completed"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs px-1 py-0.5"
                      >
                        {(offer.status === "open" || offer.status === "active")
                          ? "نشط"
                          : offer.status === "completed"
                          ? "مكتمل"
                          : "ملغي"}
                      </Badge>
                      
                      {(offer.status === "open" || offer.status === "active") && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelOffer(offer.id)}
                          disabled={cancelOfferMutation.isPending}
                          className="h-5 text-xs px-1.5"
                        >
                          {cancelOfferMutation.isPending ? (
                            <RefreshCw className="mr-0.5 h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <X className="mr-0.5 h-2.5 w-2.5" />
                          )}
                          {cancelOfferMutation.isPending ? "..." : "إلغاء"}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat">
          <div className="flex flex-col h-[500px] sm:h-[700px] border rounded-lg">
            {/* شريط علوي للدردشة */}
            <div className="bg-muted p-2 sm:p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-lg">دردشة السوق المباشر 💬</h3>
                <div className="flex gap-1 sm:gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {Array.isArray(chatOffers) ? chatOffers.length : 0} عرض نشط
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {Array.isArray(marketMessages) ? marketMessages.length : 0} رسالة
                  </Badge>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                تفاعل مع العروض المباشرة وابدأ التداول فوراً ✅
              </p>
            </div>

            {/* منطقة الرسائل */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4"
            >
              {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>جاري تحميل الرسائل...</p>
                  </div>
                </div>
              ) : (!marketMessages || !Array.isArray(marketMessages) || marketMessages.length === 0) && (!chatOffers || !Array.isArray(chatOffers) || chatOffers.length === 0) ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">لا توجد رسائل بعد...</p>
                    <p className="text-sm text-muted-foreground mt-2">ابدأ المحادثة الآن!</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* دمج الرسائل والعروض في ترتيب زمني */}
                  {(() => {
                    // دمج الرسائل والعروض في مصفوفة واحدة
                    const allItems: Array<{ type: 'message' | 'offer', data: any, createdAt: number }> = [];
                    
                    // إضافة الرسائل
                    if (Array.isArray(marketMessages)) {
                      marketMessages.forEach((message: any) => {
                        allItems.push({ 
                          type: 'message', 
                          data: message, 
                          createdAt: new Date(message.createdAt).getTime() 
                        });
                      });
                    }
                    
                    // إضافة العروض
                    if (Array.isArray(chatOffers)) {
                      chatOffers.forEach((offer: any) => {
                        allItems.push({ 
                          type: 'offer', 
                          data: offer, 
                          createdAt: new Date(offer.createdAt).getTime() 
                        });
                      });
                    }
                    
                    // ترتيب حسب التاريخ
                    allItems.sort((a, b) => a.createdAt - b.createdAt);
                    
                    return allItems.map((item, index) => {
                      if (item.type === 'message') {
                        const message = item.data;
                        return (
                          <div
                            key={`message-${message.id}`}
                            className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] sm:max-w-[70%] ${
                              message.userId === user?.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            } rounded-lg p-1.5 sm:p-3`}>
                              {message.userId !== user?.id && (
                                <div className="text-xs font-medium mb-0.5 sm:mb-1 opacity-75">
                                  {message.userFullName}
                                </div>
                              )}
                              <div className="text-xs sm:text-sm">{message.content}</div>
                              <div className="text-xs opacity-75 mt-0.5 sm:mt-1">
                                {new Date(message.createdAt).toLocaleTimeString('ar-LY')}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        const offer = item.data;
                        return (
                          <div key={`offer-${offer.id}`} className="bg-blue-50 border border-blue-200 rounded-lg p-1.5 sm:p-4 pt-1 sm:pt-[5px] pb-1 sm:pb-[5px] pl-2 sm:pl-[20px] pr-2 sm:pr-[20px] mt-1 sm:mt-[8px] mb-1 sm:mb-[8px] max-w-[95%] sm:max-w-md">
                            <div className="flex items-center justify-between mb-1 sm:mb-3">
                              <h4 className="font-semibold text-blue-800 flex items-center text-xs">
                                <TrendingUp className="h-2.5 w-2.5 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                                <span className="hidden sm:inline">عرض {offer.side === 'sell' ? 'بيع' : 'شراء'} جديد</span>
                                <span className="sm:hidden">{offer.side === 'sell' ? 'بيع' : 'شراء'}</span>
                              </h4>
                              <div className="text-xs text-muted-foreground">
                                {new Date(offer.createdAt).toLocaleTimeString('ar-LY')}
                              </div>
                            </div>
                            <div className="bg-white border rounded-lg p-1.5 sm:p-3">
                              <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Badge variant={offer.side === 'sell' ? 'default' : 'outline'} className="text-xs px-1 py-0.5">
                                    {offer.side === 'sell' ? 'بيع' : 'شراء'}
                                  </Badge>
                                  <span className="font-medium text-xs">
                                    {offer.baseCurrency} → {offer.quoteCurrency}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground hidden sm:block">{offer.userFullName}</span>
                              </div>
                              
                              <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                                <div className="text-xs">
                                  <span className="font-medium text-green-600">{offer.price}</span>
                                  <span className="text-muted-foreground"> {offer.quoteCurrency}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  متاح: {offer.remainingAmount} {offer.baseCurrency}
                                </div>
                              </div>

                              {offer.userId !== user?.id && offer.status === 'open' && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="flex-1 h-5 sm:h-8 text-xs px-1 sm:px-3"
                                    onClick={() => handleBidOffer(offer.id)}
                                    disabled={executeInlineTradeMutation.isPending}
                                  >
                                    <ShoppingCart className="h-2 w-2 sm:h-3 sm:w-3 ml-1" />
                                    <span className="hidden sm:inline">{offer.side === 'sell' ? 'شراء' : 'بيع'} مباشر</span>
                                    <span className="sm:hidden">{offer.side === 'sell' ? 'شراء' : 'بيع'}</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 sm:h-8 px-1.5 sm:px-2"
                                    onClick={() => handleViewOfferDetails(offer.id)}
                                  >
                                    <Search className="h-2 w-2 sm:h-3 sm:w-3" />
                                  </Button>
                                </div>
                              )}

                              {offer.userId === user?.id && (
                                <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
                                  📢 <span className="hidden sm:inline">هذا عرضك الشخصي</span><span className="sm:hidden">عرضك</span>
                                </div>
                              )}
                            </div>
                            {/* نموذج التداول المدمج - مصغر */}
                            {showInlineTrade === offer.id && selectedChatOffer && (
                              <div className="mt-1 bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-yellow-800">💱 تنفيذ مباشر</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowInlineTrade(null)}
                                    className="h-4 w-4 p-0 text-yellow-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>

                                <div className="space-y-1">
                                  {/* إدخال الكمية مع الأزرار في سطر واحد */}
                                  <div className="flex gap-1">
                                    <Input
                                      type="number"
                                      value={tradeAmount}
                                      onChange={(e) => setTradeAmount(e.target.value)}
                                      placeholder={`${selectedChatOffer.minAmount}-${Math.min(Number(selectedChatOffer.maxAmount), Number(selectedChatOffer.remainingAmount))}`}
                                      min={Number(selectedChatOffer.minAmount)}
                                      max={Math.min(Number(selectedChatOffer.maxAmount), Number(selectedChatOffer.remainingAmount))}
                                      step="0.01"
                                      className="h-6 text-xs flex-1"
                                    />
                                    <Button
                                      onClick={handleExecuteInlineTrade}
                                      disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || executeInlineTradeMutation.isPending}
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 h-6 px-2 text-xs"
                                    >
                                      {executeInlineTradeMutation.isPending ? "..." : "✓"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setShowInlineTrade(null)}
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                    >
                                      ✕
                                    </Button>
                                  </div>

                                  {/* إجمالي مبسط */}
                                  {tradeAmount && parseFloat(tradeAmount) > 0 && (
                                    <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                      الإجمالي: {(parseFloat(tradeAmount) * Number(selectedChatOffer.price)).toFixed(2)} {selectedChatOffer.quoteCurrency}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    });
                  })()}
                </>
              )}
            </div>

            {/* حقل إدخال الرسالة */}
            <div className="border-t p-2 sm:p-4">
              <div className="flex gap-1 sm:gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب رسالتك هنا..."
                  className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  {sendMessageMutation.isPending ? (
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
                اضغط Enter للإرسال • Shift+Enter لسطر جديد
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      {/* Create Offer Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء عرض جديد</DialogTitle>
            <DialogDescription>
              قم بإدخال تفاصيل العرض الذي ترغب في نشره في السوق.
            </DialogDescription>
          </DialogHeader>
          <Form {...createOfferForm}>
            <form onSubmit={createOfferForm.handleSubmit((data) => onCreateOfferSubmit(data))} className="space-y-2 sm:space-y-4">
              <FormField
                control={createOfferForm.control}
                name="side"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع العرض</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع العرض" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sell">بيع</SelectItem>
                        <SelectItem value="buy">شراء</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOfferForm.control}
                name="baseCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العملة المصدر</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العملة المصدر" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOfferForm.control}
                name="quoteCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العملة الهدف</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العملة الهدف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOfferForm.control}
                name="minAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحد الأدنى للمبلغ</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      {createOfferForm.watch("side") === "sell" &&
                        createOfferForm.watch("baseCurrency") && (
                          <span>
                            رصيدك الحالي:{" "}
                            {isLoadingBalances
                              ? "جاري التحميل..."
                              : formatCurrency(
                                  Number(
                                    balances?.balances[createOfferForm.watch("baseCurrency")] || 0
                                  ),
                                  createOfferForm.watch("baseCurrency")
                                )}
                          </span>
                        )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOfferForm.control}
                name="maxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحد الأقصى للمبلغ</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOfferForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر الصرف</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      1 {createOfferForm.watch("baseCurrency")} ={" "}
                      {createOfferForm.watch("price") || "?"} {createOfferForm.watch("quoteCurrency")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOfferForm.control}
                name="expirationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدة انتهاء العرض (بالدقائق)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="5" 
                        max="43200" 
                        placeholder="1440 (يوم واحد)"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      أدخل عدد الدقائق (أقل: 5 دقائق، أكثر: 43200 دقيقة = 30 يوماً). سيتم إلغاء العرض تلقائياً عند انتهاء المدة.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createOfferMutation.isPending}
                  className="w-full mt-2 sm:mt-4 h-8 sm:h-10 text-xs sm:text-sm"
                >
                  {createOfferMutation.isPending ? (
                    <>
                      <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Plus className="ml-2 h-4 w-4" />
                      إنشاء العرض
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {/* Execute Offer Dialog */}
      {selectedOffer && (
        <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تنفيذ عرض</DialogTitle>
              <DialogDescription>
                أنت على وشك شراء {selectedOffer.fromCurrency} من {selectedOffer.userFullName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={executeOfferForm.handleSubmit(onExecuteOfferSubmit)} className="space-y-2 sm:space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نوع العرض:</span>
                  <Badge variant={selectedOffer.offerType === "sell" ? "default" : "outline"}>
                    {selectedOffer.offerType === "sell" ? "بيع" : "شراء"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العملة:</span>
                  <span className="font-medium">
                    {selectedOffer.fromCurrency} <ArrowLeftRight className="inline-block mx-1 h-4 w-4" />{" "}
                    {selectedOffer.toCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">سعر الصرف:</span>
                  <span className="font-medium">
                    1 {selectedOffer.fromCurrency} = {selectedOffer.rate} {selectedOffer.toCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الكمية المتاحة:</span>
                  <span className="font-medium">
                    {formatCurrency(Number(selectedOffer.available), selectedOffer.fromCurrency)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رصيدك الحالي:</span>
                  <span className="font-medium">
                    {isLoadingBalances
                      ? "جاري التحميل..."
                      : formatCurrency(
                          Number(balances?.balances[selectedOffer.toCurrency] || 0),
                          selectedOffer.toCurrency
                        )}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium mb-1">
                  المبلغ المراد شراؤه:
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  max={Number(selectedOffer.available)}
                  {...executeOfferForm.register("amount", {
                    required: "يرجى تحديد المبلغ",
                    min: {
                      value: 0.01,
                      message: "يجب أن يكون المبلغ أكبر من صفر",
                    },
                    max: {
                      value: Number(selectedOffer.available),
                      message: "المبلغ أكبر من المتاح",
                    },
                  })}
                />
                {executeOfferForm.formState.errors.amount && (
                  <p className="text-sm text-destructive mt-1">
                    {executeOfferForm.formState.errors.amount.message}
                  </p>
                )}
              </div>

              {executeOfferForm.watch("amount") && (
                <div className="bg-muted p-2 sm:p-3 rounded-md">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">ملخص الصفقة:</h4>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>المبلغ المراد شراؤه:</span>
                      <span>
                        {formatCurrency(
                          Number(executeOfferForm.watch("amount")),
                          selectedOffer.fromCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>سعر الصرف:</span>
                      <span>
                        {selectedOffer.rate} {selectedOffer.toCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-medium">
                      <span>المبلغ المطلوب دفعه:</span>
                      <span className="text-green-600">
                        {formatCurrency(
                          Number(executeOfferForm.watch("amount")) * Number(selectedOffer.rate),
                          selectedOffer.toCurrency
                        )}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-2 p-2 sm:p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium">ملاحظة للمشتري:</p>
                      <p>• العمولة مدفوعة بواسطة البائع عند نشر العرض</p>
                      <p>• أنت تدفع فقط المبلغ المعروض - لا توجد عمولة إضافية</p>
                      <p>• المبلغ المعروض نهائي بدون أي خصومات</p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={executeOfferMutation.isPending}
                  className="w-full mt-2 sm:mt-4 h-8 sm:h-10 text-xs sm:text-sm"
                >
                  {executeOfferMutation.isPending ? (
                    <>
                      <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                      جاري التنفيذ...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="ml-2 h-4 w-4" />
                      تنفيذ الصفقة
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </Guard>
  );
}