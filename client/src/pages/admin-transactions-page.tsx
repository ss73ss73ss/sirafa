import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Printer, 
  FileText, 
  Calendar, 
  Users, 
  DollarSign, 
  Activity, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  ArrowRight,
  Trash2
} from "lucide-react";

// أنواع البيانات
interface AdminTransaction {
  id: string;
  refNo: string;
  type: string;
  status: string;
  createdAt: string;
  amount: string;
  currency: string;
  description?: string;
  userName: string;
  userAccountNumber: string;
  source: 'admin' | 'regular';
}

interface TransactionSummary {
  totalCount: number;
  totalAmount: string;
  byCurrency: { [key: string]: { count: number; amount: string } };
}

interface AdminTransactionsResponse {
  rows: AdminTransaction[];
  summary: TransactionSummary;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// مكون رئيسي لصفحة إدارة المعاملات
export default function AdminTransactionsPage() {
  const { toast } = useToast();
  
  // حالة الفلاتر
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    useExecutedAt: false,
    type: '',
    status: '',
    currency: '',
    amountMin: '',
    amountMax: '',
    ref_no: '',
    user_id: '',
    office_id: '',
    city: '',
    channel: '',
    kyc_level: '',
    risk_min: '',
    risk_max: '',
    q: '',
    page: 1,
    pageSize: 50,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // حالة العرض
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<AdminTransaction | null>(null);

  // دالة لبناء URL مع query parameters
  const buildTransactionsUrl = () => {
    const params = new URLSearchParams();
    
    // إضافة الفلاتر غير الفارغة فقط
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.q) params.append('q', filters.q);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.currency) params.append('currency', filters.currency);
    if (filters.amountMin) params.append('amountMin', filters.amountMin);
    if (filters.amountMax) params.append('amountMax', filters.amountMax);
    if (filters.ref_no) params.append('ref_no', filters.ref_no);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.office_id) params.append('office_id', filters.office_id);
    if (filters.city) params.append('city', filters.city);
    if (filters.channel) params.append('channel', filters.channel);
    if (filters.kyc_level) params.append('kyc_level', filters.kyc_level);
    if (filters.risk_min) params.append('risk_min', filters.risk_min);
    if (filters.risk_max) params.append('risk_max', filters.risk_max);
    
    // إضافة pagination
    params.append('page', filters.page.toString());
    params.append('pageSize', filters.pageSize.toString());
    params.append('sortBy', filters.sortBy);
    params.append('sortOrder', filters.sortOrder);
    
    return `/api/admin/transactions?${params.toString()}`;
  };

  // جلب بيانات المعاملات
  const { data: transactionsData, isLoading, refetch } = useQuery<AdminTransactionsResponse>({
    queryKey: [buildTransactionsUrl()],
    enabled: true
  });

  // جلب إحصائيات سريعة
  const { data: statsData } = useQuery({
    queryKey: ['/api/admin/transactions/stats', 'day']
  });



  // Mutations
  const updateTransactionMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      return apiRequest('PATCH', `/api/admin/transactions/${data.id}`, data.updates);
    },
    onSuccess: () => {
      toast({ title: "تم تحديث المعاملة بنجاح" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث المعاملة",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const exportTransactionsMutation = useMutation({
    mutationFn: async (data: { format: string; filters?: any; selectedIds?: string[] }) => {
      try {
        // جلب التوكن من localStorage بالمفتاح الصحيح
        const token = localStorage.getItem('auth_token');
        console.log('🔑 التوكن المستخدم للتصدير:', token ? 'موجود' : 'غير موجود');
        console.log('🔑 أول 50 حرف من التوكن:', token ? token.substring(0, 50) + '...' : 'N/A');
        
        if (!token) {
          throw new Error('لم يتم العثور على توكن المصادقة. يرجى تسجيل الدخول مرة أخرى.');
        }

        const response = await fetch('/api/admin/transactions/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'فشل في تصدير المعاملات' }));
          console.error('❌ خطأ في الاستجابة:', response.status, errorData);
          throw new Error(errorData.message || `خطأ ${response.status}: فشل في تصدير المعاملات`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `transactions-${Date.now()}.${data.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ تم تصدير المعاملات بنجاح');
      } catch (error) {
        console.error('❌ خطأ في عملية التصدير:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ 
        title: "تم تصدير المعاملات بنجاح",
        description: "تم تحميل الملف على جهازك"
      });
    },
    onError: (error: any) => {
      console.error('❌ خطأ في mutation التصدير:', error);
      toast({
        title: "خطأ في تصدير المعاملات",
        description: error.message || "حدث خطأ غير معروف",
        variant: "destructive"
      });
    }
  });

  const deleteTransactionsMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      return apiRequest('/api/admin/transactions/delete', 'DELETE', {
        transactionIds
      });
    },
    onSuccess: (_, transactionIds) => {
      toast({
        title: "تم حذف المعاملات بنجاح",
        description: `تم حذف ${transactionIds.length} معاملة`,
      });
      // إعادة جلب البيانات وإلغاء التحديد
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      setSelectedTransactions([]);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف المعاملات",
        description: error.message || "حدث خطأ أثناء حذف المعاملات",
        variant: "destructive",
      });
    }
  });

  // دوال مساعدة
  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { label: "مكتملة", variant: "default" as const },
      'pending': { label: "معلقة", variant: "secondary" as const },
      'failed': { label: "فاشلة", variant: "destructive" as const },
      'cancelled': { label: "ملغاة", variant: "outline" as const }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: "outline" as const };
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      'internal_transfer_in': "تحويل داخلي واردة",
      'internal_transfer_out': "تحويل داخلي صادرة", 
      'exchange': "صرافة",
      'market_trade': "سوق العملات",
      'commission_withdrawal': "سحب عمولة",
      'international_transfer': "تحويل دولي",
      'city_transfer': "تحويل بين المدن",
      'office_remit': "حوالة مكتبية",
      'market_trade_buy': "شراء عملة",
      'market_trade_sell': "بيع عملة",
      'external_payment': "دفع خارجي",
      'fee': "عمولة"
    };
    
    return (
      <Badge variant="outline">
        {typeMap[type as keyof typeof typeMap] || type}
      </Badge>
    );
  };

  const formatAmount = (amount: string | number, currency: string) => {
    if (!amount || amount === 'undefined') return '0';
    return `${parseFloat(amount.toString()).toLocaleString('ar-LY')} ${currency}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ar-LY');
  };

  const handleFilterChange = (key: string, value: any) => {
    // تحويل "all" إلى سلسلة فارغة للخادم
    const processedValue = value === "all" ? "" : value;
    setFilters(prev => ({
      ...prev,
      [key]: processedValue,
      page: 1 // إعادة تعيين الصفحة عند تغيير الفلتر
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      useExecutedAt: false,
      type: '',
      status: '',
      currency: '',
      amountMin: '',
      amountMax: '',
      ref_no: '',
      user_id: '',
      office_id: '',
      city: '',
      channel: '',
      kyc_level: '',
      risk_min: '',
      risk_max: '',
      q: '',
      page: 1,
      pageSize: 50,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (selectedTransactions.length > 0) {
      exportTransactionsMutation.mutate({
        format,
        selectedIds: selectedTransactions
      });
    } else {
      exportTransactionsMutation.mutate({
        format,
        filters
      });
    }
  };

  const printReceipt = (transactionId: string) => {
    const receiptUrl = `/api/admin/transactions/${transactionId}/receipt`;
    window.open(receiptUrl, '_blank');
  };

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const toggleAllTransactions = () => {
    if (selectedTransactions.length === transactionsData?.rows.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactionsData?.rows.map(tx => tx.id) || []);
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* زر العودة والعنوان */}
      <div className="flex items-center gap-4 mb-4">
        <Link to="/dashboard">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة إلى لوحة التحكم
          </Button>
        </Link>
      </div>

      {/* العنوان والإحصائيات السريعة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المعاملات الموحدة</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع معاملات النظام في مكان واحد</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => refetch()}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      {transactionsData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المعاملات</p>
                  <p className="text-2xl font-bold">{transactionsData.summary.totalCount.toLocaleString('ar')}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المبالغ</p>
                  <p className="text-2xl font-bold">{parseFloat(transactionsData.summary.totalAmount).toLocaleString('ar-LY')}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">العملات</p>
                  <p className="text-2xl font-bold">{Object.keys(transactionsData.summary.byCurrency).length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الصفحة الحالية</p>
                  <p className="text-2xl font-bold">{transactionsData.pagination.page} / {transactionsData.pagination.totalPages}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* شريط البحث والفلاتر */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">البحث والفلترة</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter className="h-4 w-4 ml-2" />
                فلاتر متقدمة
              </Button>
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* البحث العام */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالرقم المرجعي، اسم المستخدم، رقم الحساب..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="SUCCESS">نجحت</SelectItem>
                <SelectItem value="PENDING">معلقة</SelectItem>
                <SelectItem value="FAILED">فشلت</SelectItem>
                <SelectItem value="CANCELLED">ملغاة</SelectItem>
                <SelectItem value="REVERSED">معكوسة</SelectItem>
                <SelectItem value="ON_HOLD">محجوزة</SelectItem>
                <SelectItem value="COMPLETED">مكتملة</SelectItem>
                <SelectItem value="PROCESSING">قيد المعالجة</SelectItem>
                <SelectItem value="CONFIRMED">مؤكدة</SelectItem>
                <SelectItem value="PAID">مدفوعة</SelectItem>
                <SelectItem value="APPROVED">مقبولة</SelectItem>
                <SelectItem value="REJECTED">مرفوضة</SelectItem>
                <SelectItem value="EXPIRED">منتهية الصلاحية</SelectItem>
                <SelectItem value="DISPUTED">متنازع عليها</SelectItem>
                <SelectItem value="PARTIAL">جزئية</SelectItem>
                <SelectItem value="OPEN">مفتوحة</SelectItem>
                <SelectItem value="FILLED">ممتلئة</SelectItem>
                <SelectItem value="ACTIVE">نشطة</SelectItem>
                <SelectItem value="USED">مُستخدمة</SelectItem>
                <SelectItem value="READY">جاهزة</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type || "all"} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value="INTERNAL_TRANSFER">تحويل داخلي</SelectItem>
                <SelectItem value="SALE">بيع</SelectItem>
                <SelectItem value="PURCHASE">شراء</SelectItem>
                <SelectItem value="EXTERNAL_REMIT">حوالة خارجية</SelectItem>
                <SelectItem value="OFFICE_REMIT">حوالة مكتبية</SelectItem>
                <SelectItem value="DEPOSIT">إيداع</SelectItem>
                <SelectItem value="WITHDRAW">سحب</SelectItem>
                <SelectItem value="FEE">عمولة</SelectItem>
                <SelectItem value="ADJUSTMENT">تسوية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* الفلاتر المتقدمة */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="dateFrom">من تاريخ</Label>
                <Input
                  id="dateFrom"
                  type="datetime-local"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">إلى تاريخ</Label>
                <Input
                  id="dateTo"
                  type="datetime-local"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="currency">العملة</Label>
                <Select value={filters.currency || "all"} onValueChange={(value) => handleFilterChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل العملات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل العملات</SelectItem>
                    <SelectItem value="LYD">دينار ليبي</SelectItem>
                    <SelectItem value="USD">دولار أمريكي</SelectItem>
                    <SelectItem value="EUR">يورو</SelectItem>
                    <SelectItem value="TRY">ليرة تركية</SelectItem>
                    <SelectItem value="AED">درهم إماراتي</SelectItem>
                    <SelectItem value="EGP">جنيه مصري</SelectItem>
                    <SelectItem value="TND">دينار تونسي</SelectItem>
                    <SelectItem value="GBP">جنيه إسترليني</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="channel">القناة</Label>
                <Select value={filters.channel || "all"} onValueChange={(value) => handleFilterChange('channel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل القنوات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل القنوات</SelectItem>
                    <SelectItem value="WEB">ويب</SelectItem>
                    <SelectItem value="MOBILE">موبايل</SelectItem>
                    <SelectItem value="DESKTOP">سطح المكتب</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amountMin">أقل مبلغ</Label>
                <Input
                  id="amountMin"
                  type="number"
                  placeholder="0"
                  value={filters.amountMin}
                  onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="amountMax">أكبر مبلغ</Label>
                <Input
                  id="amountMax"
                  type="number"
                  placeholder="∞"
                  value={filters.amountMax}
                  onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="refNo">الرقم المرجعي</Label>
                <Input
                  id="refNo"
                  placeholder="INT-1234..."
                  value={filters.ref_no}
                  onChange={(e) => handleFilterChange('ref_no', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="userId">معرف المستخدم</Label>
                <Input
                  id="userId"
                  type="number"
                  placeholder="123"
                  value={filters.user_id}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useExecutedAt"
                  checked={filters.useExecutedAt}
                  onCheckedChange={(checked) => handleFilterChange('useExecutedAt', checked)}
                />
                <Label htmlFor="useExecutedAt" className="text-sm">
                  استخدام تاريخ التنفيذ
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* أدوات العمليات */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedTransactions.length > 0 && (
            <>
              <Badge variant="secondary">
                {selectedTransactions.length} معاملة محددة
              </Badge>
              <Button
                onClick={() => setSelectedTransactions([])}
                variant="outline"
                size="sm"
              >
                إلغاء التحديد
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {/* زر حذف المعاملات المحددة - للإدمن فقط */}
          {selectedTransactions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={deleteTransactionsMutation.isPending}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف ({selectedTransactions.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    تأكيد حذف المعاملات
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-right">
                    <div className="space-y-3">
                      <p className="font-medium">
                        هل أنت متأكد من حذف {selectedTransactions.length} معاملة؟
                      </p>
                      <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                          <div className="text-sm space-y-1">
                            <p className="font-medium text-destructive">تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
                            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                              <li>سيتم حذف المعاملات نهائياً من النظام</li>
                              <li>لن يكون بالإمكان استرجاعها مرة أخرى</li>
                              <li>قد يؤثر هذا على التقارير المالية</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        يرجى التأكد من أن هذه المعاملات خاطئة أو غير مرغوب فيها قبل المتابعة.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteTransactionsMutation.mutate(selectedTransactions)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {deleteTransactionsMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button
            onClick={() => handleExport('csv')}
            disabled={exportTransactionsMutation.isPending}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير CSV
          </Button>
          
          <Button
            onClick={() => handleExport('pdf')}
            disabled={exportTransactionsMutation.isPending}
            variant="outline"
            size="sm"
          >
            <FileText className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* جدول المعاملات */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={transactionsData?.rows && transactionsData.rows.length > 0 && selectedTransactions.length === transactionsData.rows.length}
                      onCheckedChange={toggleAllTransactions}
                    />
                  </TableHead>
                  <TableHead>الرقم المرجعي</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>رقم الحساب</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>العملة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      جاري تحميل البيانات...
                    </TableCell>
                  </TableRow>
                ) : transactionsData?.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      لا توجد معاملات مطابقة للفلاتر
                    </TableCell>
                  </TableRow>
                ) : (
                  transactionsData?.rows.map((transaction, index) => (
                    <TableRow key={`${transaction.type}-${transaction.id}-${index}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTransactions.includes(transaction.id)}
                          onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.refNo}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(transaction.type)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.userName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {transaction.userAccountNumber}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {parseFloat(transaction.amount).toLocaleString('ar-LY')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.currency}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString('ar-LY')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => setSelectedTransaction(transaction)}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* التصفح */}
      {transactionsData && transactionsData.pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            عرض {((filters.page - 1) * filters.pageSize) + 1} إلى {Math.min(filters.page * filters.pageSize, transactionsData.pagination.total)} من أصل {transactionsData.pagination.total} معاملة
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleFilterChange('page', filters.page - 1)}
              disabled={filters.page <= 1}
              variant="outline"
              size="sm"
            >
              السابق
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, transactionsData.pagination.totalPages) }, (_, i) => {
                const pageNum = filters.page - 2 + i;
                if (pageNum > 0 && pageNum <= transactionsData.pagination.totalPages) {
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => handleFilterChange('page', pageNum)}
                      variant={pageNum === filters.page ? "default" : "outline"}
                      size="sm"
                    >
                      {pageNum}
                    </Button>
                  );
                }
                return null;
              })}
            </div>
            
            <Button
              onClick={() => handleFilterChange('page', filters.page + 1)}
              disabled={filters.page >= transactionsData.pagination.totalPages}
              variant="outline"
              size="sm"
            >
              التالي
            </Button>
          </div>
        </div>
      )}

      {/* مودال تفاصيل المعاملة */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>تفاصيل المعاملة - {selectedTransaction.refNo}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">الرقم المرجعي:</span>
                      <span className="font-mono">{selectedTransaction.refNo}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">النوع:</span>
                      {getTypeBadge(selectedTransaction.type)}
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">الحالة:</span>
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">المستخدم:</span>
                      <span>{selectedTransaction.userName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">رقم الحساب:</span>
                      <span className="font-mono">{selectedTransaction.userAccountNumber}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">المصدر:</span>
                      <Badge variant={selectedTransaction.source === 'admin' ? 'default' : 'secondary'}>
                        {selectedTransaction.source === 'admin' ? 'إداري' : 'عادي'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">التفاصيل المالية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">المبلغ:</span>
                      <span className="font-mono">{formatAmount(selectedTransaction.amount, selectedTransaction.currency)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">العملة:</span>
                      <Badge variant="outline">{selectedTransaction.currency}</Badge>
                    </div>
                    
                    {selectedTransaction.description && (
                      <div>
                        <span className="font-medium">الوصف:</span>
                        <p className="mt-1 text-sm bg-muted p-2 rounded">{selectedTransaction.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* التوقيت */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">التوقيت</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">تاريخ المعاملة:</span>
                    <span>{formatDate(selectedTransaction.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* أزرار الإجراءات */}
              <div className="flex justify-end gap-2">
                <Button onClick={() => setSelectedTransaction(null)}>
                  إغلاق
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}