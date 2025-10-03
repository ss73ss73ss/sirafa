import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, UserX, Shield, Clock, Trash2, Plus, AlertTriangle, Globe, Users, UserPlus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const PAGE_OPTIONS = [
  { value: 'market', label: 'السوق' },
  { value: 'send', label: 'الإرسال' },
  { value: 'receive', label: 'الاستقبال' },
  { value: 'wallet', label: 'المحفظة' },
  { value: 'balance', label: 'الأرصدة' },
  { value: 'transfers', label: 'التحويلات' },
  { value: 'statement', label: 'كشف الحساب' },
  { value: 'notifications', label: 'الإشعارات' },
  { value: 'dashboard', label: 'لوحة التحكم' },
  { value: 'kyc', label: 'التوثيق' },
  { value: 'chat', label: 'الدردشة العامة' },
  { value: 'private_chat', label: 'الدردشة الخاصة' },
  { value: 'group_chats', label: 'مجموعات الدردشة' },
  { value: 'referrals', label: 'الإحالات' },
  { value: 'agent_dashboard', label: 'لوحة الوكيل' },
  { value: 'city_transfers', label: 'التحويلات بين المدن' },
  { value: 'office_management', label: 'دولي فقط' },
  { value: 'inter_office_receive', label: 'استلام الحوالات' },
  { value: 'inter_office', label: 'التحويل بين المكاتب' },
  { value: 'international', label: 'التحويل الدولي' },
  { value: 'user_settings', label: 'إعدادات المستخدم' },
  { value: 'support', label: 'الدعم' },
  { value: 'reports', label: 'التقارير' },
  { value: 'settings', label: 'الإعدادات' },
  { value: 'all', label: 'تعطيل شامل' },
];

export default function AccessRestrictionsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // التحقق من الصلاحية
  if (!user || user.email !== 'ss73ss73ss73@gmail.com') {
    setLocation('/');
    return null;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRestrictionForm, setShowRestrictionForm] = useState(false);
  const [activeTab, setActiveTab] = useState('individual');
  const [showGlobalForm, setShowGlobalForm] = useState(false);
  const [selectedGlobalPage, setSelectedGlobalPage] = useState('');

  // بيانات النموذج
  const [formData, setFormData] = useState({
    pageKey: '',
    scope: 'page',
    reason: '',
    isActive: true,
    duration: '',
    durationType: 'hours'
  });

  // بيانات نموذج القيود الشاملة
  const [globalFormData, setGlobalFormData] = useState({
    pageKey: '',
    reason: '',
    isActive: true, // دائماً مفعل عند البداية
    duration: '',
    durationType: 'hours',
    allowedUsers: [] as string[]
  });

  const [newAllowedUser, setNewAllowedUser] = useState('');
  
  // حالات الإضافة المتعددة للاستثناءات
  const [showBulkExceptionsDialog, setShowBulkExceptionsDialog] = useState(false);
  const [selectedPageForBulk, setSelectedPageForBulk] = useState('');
  const [bulkIdentifiers, setBulkIdentifiers] = useState('');
  const [bulkResults, setBulkResults] = useState<any>(null);

  // البحث عن المستخدم
  const searchUser = useMutation({
    mutationFn: async (identifier: string) => {
      try {
        const response = await apiRequest(`/api/restrictions/${identifier}`, 'GET');
        const data = await response.json();
        return data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      setSelectedUser(data);
      setShowRestrictionForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في البحث",
        description: error.message || "لم يتم العثور على المستخدم",
        variant: "destructive",
      });
      setSelectedUser(null);
    }
  });

  // إضافة قيد
  const addRestriction = useMutation({
    mutationFn: async (restrictionData: any) => {
      // التحقق من البيانات المطلوبة
      if (!restrictionData.pageKey) {
        throw new Error('يجب تحديد نوع الصفحة');
      }
      if (!restrictionData.scope) {
        throw new Error('يجب تحديد النطاق');
      }
      if (!selectedUser?.user) {
        throw new Error('لا يوجد مستخدم محدد');
      }

      let expiresAt = null;
      if (restrictionData.duration && restrictionData.durationType) {
        const duration = parseInt(restrictionData.duration);
        if (isNaN(duration) || duration <= 0) {
          throw new Error('مدة القيد يجب أن تكون رقماً موجباً');
        }
        const now = new Date();
        if (restrictionData.durationType === 'hours') {
          expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000).toISOString();
        } else if (restrictionData.durationType === 'days') {
          expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000).toISOString();
        }
      }


      return apiRequest('/api/restrictions', 'POST', {
        userIdentifier: selectedUser.user.accountNumber || selectedUser.user.email,
        pageKey: restrictionData.pageKey,
        scope: restrictionData.scope,
        reason: restrictionData.reason || '',
        isActive: restrictionData.isActive,
        expiresAt
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ القيد",
        description: "تم تطبيق القيد بنجاح",
      });
      setFormData({
        pageKey: '',
        scope: 'page',
        reason: '',
        isActive: true,
        duration: '',
        durationType: 'hours'
      });
      setShowRestrictionForm(false);
      // إعادة جلب بيانات المستخدم
      if (selectedUser?.user) {
        searchUser.mutate(selectedUser.user.accountNumber || selectedUser.user.email);
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حفظ القيد",
        description: error.message || "حدث خطأ أثناء حفظ القيد",
        variant: "destructive",
      });
    }
  });

  // إزالة قيد
  const removeRestriction = useMutation({
    mutationFn: async (restrictionId: number) => {
      return apiRequest(`/api/restrictions/${restrictionId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "تم إزالة القيد",
        description: "تم إزالة القيد بنجاح",
      });
      // إعادة جلب بيانات المستخدم
      if (selectedUser?.user) {
        searchUser.mutate(selectedUser.user.accountNumber || selectedUser.user.email);
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إزالة القيد",
        description: error.message || "حدث خطأ أثناء إزالة القيد",
        variant: "destructive",
      });
    }
  });

  // جلب القيود الشاملة
  const { data: globalRestrictions, refetch: refetchGlobalRestrictions } = useQuery({
    queryKey: ['/api/restrictions/global'],
    staleTime: 30 * 1000,
  });

  // إضافة قيد شامل
  const addGlobalRestriction = useMutation({
    mutationFn: async (restrictionData: any) => {
      if (!restrictionData.pageKey) {
        throw new Error('يجب تحديد نوع الصفحة');
      }

      let expiresAt = null;
      if (restrictionData.duration && restrictionData.durationType) {
        const duration = parseInt(restrictionData.duration);
        if (isNaN(duration) || duration <= 0) {
          throw new Error('مدة القيد يجب أن تكون رقماً موجباً');
        }
        const now = new Date();
        if (restrictionData.durationType === 'hours') {
          expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000).toISOString();
        } else if (restrictionData.durationType === 'days') {
          expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      return apiRequest('/api/restrictions/global', 'POST', {
        pageKey: restrictionData.pageKey,
        reason: restrictionData.reason || '',
        isActive: restrictionData.isActive,
        expiresAt,
        allowedUsers: restrictionData.allowedUsers || []
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء القيد الشامل",
        description: "تم تطبيق القيد على جميع المستخدمين بنجاح",
      });
      setGlobalFormData({
        pageKey: '',
        reason: '',
        isActive: true, // دائماً مفعل عند إعادة التعيين
        duration: '',
        durationType: 'hours',
        allowedUsers: []
      });
      setShowGlobalForm(false);
      refetchGlobalRestrictions();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء القيد الشامل",
        description: error.message || "حدث خطأ أثناء إنشاء القيد الشامل",
        variant: "destructive",
      });
    }
  });

  // إزالة قيد شامل
  const removeGlobalRestriction = useMutation({
    mutationFn: async (pageKey: string) => {
      return apiRequest(`/api/restrictions/global/${pageKey}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "تم إزالة القيد الشامل",
        description: "تم إزالة القيد الشامل وجميع استثناءاته بنجاح",
      });
      refetchGlobalRestrictions();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إزالة القيد الشامل",
        description: error.message || "حدث خطأ أثناء إزالة القيد الشامل",
        variant: "destructive",
      });
    }
  });

  // إضافة استثناء
  const addException = useMutation({
    mutationFn: async ({ pageKey, userIdentifier }: { pageKey: string; userIdentifier: string }) => {
      return apiRequest(`/api/restrictions/global/${pageKey}/exceptions`, 'POST', {
        userIdentifier
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة الاستثناء",
        description: "تم إضافة الاستثناء بنجاح",
      });
      setNewAllowedUser('');
      refetchGlobalRestrictions();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة الاستثناء",
        description: error.message || "حدث خطأ أثناء إضافة الاستثناء",
        variant: "destructive",
      });
    }
  });

  // إزالة استثناء
  const removeException = useMutation({
    mutationFn: async ({ pageKey, userId }: { pageKey: string; userId: number }) => {
      return apiRequest(`/api/restrictions/global/${pageKey}/exceptions/${userId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "تم إزالة الاستثناء",
        description: "تم إزالة الاستثناء بنجاح",
      });
      refetchGlobalRestrictions();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إزالة الاستثناء",
        description: error.message || "حدث خطأ أثناء إزالة الاستثناء",
        variant: "destructive",
      });
    }
  });

  // إضافة عدة استثناءات دفعة واحدة
  const addBulkExceptions = useMutation({
    mutationFn: async ({ pageKey, identifiers }: { pageKey: string; identifiers: string[] }) => {
      const response = await apiRequest(`/api/restrictions/global/${pageKey}/exceptions/bulk`, 'POST', {
        identifiers,
        reason: "استثناء إدخال متعدد"
      });
      return response.json();
    },
    onSuccess: (data) => {
      setBulkResults(data);
      toast({
        title: "تمت معالجة العملية",
        description: data.message || "تم إضافة الاستثناءات بنجاح",
      });
      refetchGlobalRestrictions();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة الاستثناءات",
        description: error.message || "حدث خطأ أثناء إضافة الاستثناءات المتعددة",
        variant: "destructive",
      });
    }
  });

  // جلب سجل التدقيق
  const { data: auditLogs } = useQuery({
    queryKey: ['/api/audit-logs'],
    staleTime: 30 * 1000,
  });

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الحساب أو البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }
    searchUser.mutate(searchTerm.trim());
  };

  const handleQuickAction = (action: string) => {
    if (!selectedUser) return;

    const quickActions: Record<string, any> = {
      'disable_market': { pageKey: 'market', reason: 'تعطيل مؤقت للسوق' },
      'disable_all': { pageKey: 'all', reason: 'تعطيل شامل للحساب' },
      'remove_all': 'remove_all'
    };

    const actionData = quickActions[action];
    
    if (action === 'remove_all') {
      // إزالة جميع القيود النشطة
      selectedUser.restrictions?.filter((r: any) => r.isActive).forEach((r: any) => {
        removeRestriction.mutate(r.id);
      });
    } else {
      setFormData({
        pageKey: actionData.pageKey,
        scope: 'page',
        reason: actionData.reason,
        isActive: true,
        duration: '',
        durationType: 'hours'
      });
      setShowRestrictionForm(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // معالجة إضافة مستخدم للاستثناءات
  const handleAddAllowedUser = () => {
    if (!newAllowedUser.trim()) return;
    
    if (!globalFormData.allowedUsers.includes(newAllowedUser.trim())) {
      setGlobalFormData({
        ...globalFormData,
        allowedUsers: [...globalFormData.allowedUsers, newAllowedUser.trim()]
      });
      setNewAllowedUser('');
    }
  };

  const handleRemoveAllowedUser = (user: string) => {
    setGlobalFormData({
      ...globalFormData,
      allowedUsers: globalFormData.allowedUsers.filter(u => u !== user)
    });
  };

  // معالجة النص المدخل للإضافة المتعددة
  const parseBulkIdentifiers = (text: string): string[] => {
    if (!text.trim()) return [];
    
    // تنظيف النص وتقسيمه باستخدام فواصل مختلفة
    return text
      .split(/[\n,;،؛\s]+/) // فواصل مختلفة: سطر جديد، فاصلة، فاصلة منقوطة، مسافات
      .map(id => id.trim())
      .filter(id => id.length > 0);
  };

  // إعادة تعيين نموذج الإضافة المتعددة
  const resetBulkForm = () => {
    setBulkIdentifiers('');
    setBulkResults(null);
    setShowBulkExceptionsDialog(false);
    setSelectedPageForBulk('');
  };

  // معالج إرسال الإضافة المتعددة
  const handleBulkSubmit = () => {
    const identifiers = parseBulkIdentifiers(bulkIdentifiers);
    if (identifiers.length === 0) {
      toast({
        title: "لا يوجد معرفات",
        description: "يرجى إدخال أرقام حساب أو عناوين بريد إلكتروني",
        variant: "destructive",
      });
      return;
    }

    if (identifiers.length > 100) {
      toast({
        title: "عدد كبير جداً",
        description: "يمكن إضافة حد أقصى 100 حساب في المرة الواحدة",
        variant: "destructive",
      });
      return;
    }

    addBulkExceptions.mutate({
      pageKey: selectedPageForBulk,
      identifiers
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">إدارة قيود الوصول</h1>
          <p className="text-muted-foreground">
            تحكم في وصول المستخدمين للصفحات والميزات المختلفة
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <UserX className="w-4 h-4" />
            قيود المستخدمين
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            قيود شاملة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
      {/* شريط البحث */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            البحث عن مستخدم
          </CardTitle>
          <CardDescription>
            ابحث برقم الحساب (مثل: 33003002) أو البريد الإلكتروني
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="رقم الحساب أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={searchUser.isPending}
            >
              {searchUser.isPending ? 'جاري البحث...' : 'بحث'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* معلومات المستخدم */}
      {selectedUser && selectedUser.user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5" />
                معلومات المستخدم
              </div>
              {selectedUser.restrictions?.some((r: any) => r.pageKey === 'all' && r.isActive) && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  تعطيل شامل
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">الاسم</Label>
                <p className="font-medium">{selectedUser.user.fullName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</Label>
                <p className="font-medium">{selectedUser.user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">رقم الحساب</Label>
                <p className="font-medium font-mono text-lg bg-muted px-2 py-1 rounded">
                  {selectedUser.user.accountNumber}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">حالة الحساب</Label>
                <Badge variant={selectedUser.user.active ? "default" : "destructive"}>
                  {selectedUser.user.active ? 'نشط' : 'معطل'}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* أزرار سريعة */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAction('disable_market')}
              >
                تعطيل السوق
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleQuickAction('disable_all')}
              >
                تعطيل شامل
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => handleQuickAction('remove_all')}
              >
                إلغاء كل القيود
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowRestrictionForm(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                إضافة قيد جديد
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نموذج إضافة قيد */}
      {showRestrictionForm && selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>إضافة قيد جديد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pageKey">الصفحة أو الميزة</Label>
                <Select value={formData.pageKey} onValueChange={(value) => setFormData({...formData, pageKey: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصفحة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scope">نطاق القيد</Label>
                <Select value={formData.scope} onValueChange={(value) => setFormData({...formData, scope: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">صفحة</SelectItem>
                    <SelectItem value="section">قسم</SelectItem>
                    <SelectItem value="global">شامل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="reason">سبب القيد</Label>
              <Textarea
                placeholder="اكتب سبب تطبيق هذا القيد..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">مدة القيد (اختياري)</Label>
                <Input
                  type="number"
                  placeholder="عدد..."
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="durationType">نوع المدة</Label>
                <Select value={formData.durationType} onValueChange={(value) => setFormData({...formData, durationType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">ساعات</SelectItem>
                    <SelectItem value="days">أيام</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label className={formData.isActive ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {formData.isActive ? '🚫 حظر المستخدم' : '✅ السماح للمستخدم'}
                </Label>
              </div>
            </div>

            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={!formData.pageKey || !formData.scope || addRestriction.isPending}>
                    {addRestriction.isPending ? 'جاري الحفظ...' : 'حفظ القيد'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد تطبيق القيد</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من تطبيق هذا القيد على المستخدم؟ 
                      سيتم منعه فوراً من الوصول للصفحة المحددة.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={() => addRestriction.mutate(formData)}>
                      تأكيد
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button variant="outline" onClick={() => setShowRestrictionForm(false)}>
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة القيود الحالية */}
      {selectedUser && selectedUser.restrictions && selectedUser.restrictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>القيود الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedUser.restrictions.map((restriction: any) => (
                <div key={restriction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={restriction.isActive ? "destructive" : "secondary"}>
                        {PAGE_OPTIONS.find(p => p.value === restriction.pageKey)?.label || restriction.pageKey}
                      </Badge>
                      <Badge variant="outline">{restriction.scope}</Badge>
                      {restriction.expiresAt && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ينتهي {formatDate(restriction.expiresAt)}
                        </Badge>
                      )}
                    </div>
                    {restriction.reason && (
                      <p className="text-sm text-muted-foreground">{restriction.reason}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      أضيف بواسطة: {restriction.createdByName} • {formatDate(restriction.createdAt)}
                    </p>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد إزالة القيد</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من إزالة هذا القيد؟ سيتمكن المستخدم من الوصول للصفحة فوراً.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeRestriction.mutate(restriction.id)}>
                          إزالة
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* سجل التدقيق */}
      {auditLogs && Array.isArray(auditLogs) && auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>سجل التدقيق (آخر 100 عملية)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.isArray(auditLogs) && auditLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-2 border-b text-sm">
                  <div>
                    <span className="font-medium">{log.actorName}</span>
                    {' '}
                    <span>{log.action === 'upsert_restriction' ? 'أضاف/حدث قيد' : 'أزال قيد'}</span>
                    {log.data?.pageKey && (
                      <span> على صفحة <Badge variant="outline" className="text-xs">{log.data.pageKey}</Badge></span>
                    )}
                  </div>
                  <span className="text-muted-foreground">{formatDate(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="global" className="space-y-6">
          {/* إضافة قيد شامل جديد */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                إضافة قيد شامل جديد
              </CardTitle>
              <CardDescription>
                القيود الشاملة تطبق على جميع المستخدمين بشكل افتراضي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowGlobalForm(!showGlobalForm)}>
                {showGlobalForm ? 'إلغاء' : 'إضافة قيد شامل'}
              </Button>
              
              {showGlobalForm && (
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="globalPageKey">نوع الصفحة</Label>
                    <Select value={globalFormData.pageKey} onValueChange={(value) => setGlobalFormData({...globalFormData, pageKey: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الصفحة" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_OPTIONS.map(page => (
                          <SelectItem key={page.value} value={page.value}>
                            {page.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="globalReason">سبب القيد</Label>
                    <Textarea
                      placeholder="اكتب سبب تطبيق هذا القيد الشامل..."
                      value={globalFormData.reason}
                      onChange={(e) => setGlobalFormData({...globalFormData, reason: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="globalDuration">مدة القيد (اختياري)</Label>
                      <Input
                        type="number"
                        placeholder="عدد..."
                        value={globalFormData.duration}
                        onChange={(e) => setGlobalFormData({...globalFormData, duration: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="globalDurationType">نوع المدة</Label>
                      <Select value={globalFormData.durationType} onValueChange={(value) => setGlobalFormData({...globalFormData, durationType: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">ساعات</SelectItem>
                          <SelectItem value="days">أيام</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={globalFormData.isActive}
                        onCheckedChange={(checked) => setGlobalFormData({...globalFormData, isActive: checked})}
                      />
                      <Label>مفعل</Label>
                    </div>
                  </div>

                  {/* إدارة الاستثناءات */}
                  <div>
                    <Label>المستخدمون المستثنون من هذا القيد</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="رقم الحساب أو البريد الإلكتروني..."
                        value={newAllowedUser}
                        onChange={(e) => setNewAllowedUser(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddAllowedUser()}
                      />
                      <Button onClick={handleAddAllowedUser}>إضافة</Button>
                    </div>
                    
                    {globalFormData.allowedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {globalFormData.allowedUsers.map((user, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {user}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => handleRemoveAllowedUser(user)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button disabled={!globalFormData.pageKey || addGlobalRestriction.isPending}>
                          {addGlobalRestriction.isPending ? 'جاري الحفظ...' : 'حفظ القيد الشامل'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد تطبيق القيد الشامل</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من تطبيق هذا القيد على جميع المستخدمين؟ 
                            سيتم منعهم فوراً من الوصول للصفحة المحددة.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => addGlobalRestriction.mutate(globalFormData)}>
                            تأكيد
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button variant="outline" onClick={() => setShowGlobalForm(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* قائمة القيود الشاملة الحالية */}
          {globalRestrictions && Array.isArray(globalRestrictions) && globalRestrictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>القيود الشاملة الحالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {globalRestrictions.map((restriction: any) => (
                    <div key={restriction.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={restriction.isActive ? "destructive" : "secondary"}>
                            {PAGE_OPTIONS.find(p => p.value === restriction.pageKey)?.label || restriction.pageKey}
                          </Badge>
                          {restriction.expiresAt && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ينتهي {formatDate(restriction.expiresAt)}
                            </Badge>
                          )}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد إزالة القيد الشامل</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من إزالة هذا القيد الشامل؟ سيتمكن جميع المستخدمين من الوصول للصفحة فوراً.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeGlobalRestriction.mutate(restriction.pageKey)}>
                                إزالة
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      
                      {restriction.reason && (
                        <p className="text-sm text-muted-foreground mb-2">{restriction.reason}</p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mb-3">
                        أضيف بواسطة: {restriction.createdByName} • {formatDate(restriction.createdAt)}
                      </p>

                      {/* قائمة المستخدمين المستثنين مع أزرار الإضافة */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium">المستخدمون المستثنون:</h5>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setSelectedPageForBulk(restriction.pageKey);
                                setShowBulkExceptionsDialog(true);
                              }}
                              data-testid="button-add-multiple-exceptions"
                            >
                              <UserPlus className="w-3 h-3 ml-1" />
                              إضافة عدة حسابات
                            </Button>
                          </div>
                        </div>
                        {restriction.exceptions && restriction.exceptions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {restriction.exceptions.map((exception: any) => (
                              <Badge key={exception.id} variant="outline" className="flex items-center gap-1">
                                <div className="flex flex-col items-start">
                                  <span className="text-xs font-medium">
                                    {exception.fullName || 'مستخدم غير معروف'}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {exception.accountNumber || exception.email}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-transparent"
                                  onClick={() => removeException.mutate({ 
                                    pageKey: restriction.pageKey, 
                                    userId: exception.userId
                                  })}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">لا يوجد مستخدمون مستثنون</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog إضافة عدة استثناءات */}
      <Dialog open={showBulkExceptionsDialog} onOpenChange={(open) => {
        if (!open) resetBulkForm();
      }}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة عدة حسابات للاستثناءات</DialogTitle>
            <DialogDescription>
              يمكنك إضافة عدة أرقام حساب أو عناوين بريد إلكتروني مفصولة بفواصل أو أسطر جديدة
              <br />
              الصفحة المحددة: <strong>{PAGE_OPTIONS.find(p => p.value === selectedPageForBulk)?.label}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* منطقة إدخال النص */}
            <div>
              <Label htmlFor="bulk-identifiers">أرقام الحساب أو عناوين البريد الإلكتروني</Label>
              <Textarea
                id="bulk-identifiers"
                placeholder="مثال:
33003001
33003002
user@example.com
أو
33003001, 33003002, user@example.com"
                value={bulkIdentifiers}
                onChange={(e) => setBulkIdentifiers(e.target.value)}
                className="min-h-32 text-left font-mono text-sm"
                data-testid="textarea-bulk-identifiers"
                disabled={addBulkExceptions.isPending}
              />
            </div>

            {/* معاينة المعرفات المدخلة */}
            {bulkIdentifiers.trim() && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">المعرفات المُعتَبَرة:</Label>
                  <Badge variant="secondary">
                    {parseBulkIdentifiers(bulkIdentifiers).length} معرف
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {parseBulkIdentifiers(bulkIdentifiers).map((identifier, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {identifier}
                    </Badge>
                  ))}
                </div>
                {parseBulkIdentifiers(bulkIdentifiers).length > 100 && (
                  <p className="text-xs text-destructive mt-1">
                    تحذير: العدد أكبر من الحد الأقصى (100)
                  </p>
                )}
              </div>
            )}

            {/* عرض النتائج */}
            {bulkResults && (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">نتائج العملية</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBulkResults(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* ملخص سريع */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {bulkResults.summary?.addedCount || 0}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">تم إضافتها</div>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {bulkResults.summary?.existsCount || 0}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">موجودة مسبقاً</div>
                  </div>
                  <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {bulkResults.summary?.notFoundCount || 0}
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">غير موجودة</div>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {bulkResults.summary?.errorCount || 0}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400">أخطاء</div>
                  </div>
                </div>

                {/* تفاصيل مفصلة (قابلة للطي) */}
                {bulkResults.results && bulkResults.results.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium hover:text-primary">
                      عرض التفاصيل المفصلة ({bulkResults.results.length} عنصر)
                    </summary>
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {bulkResults.results.map((result: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-xs p-2 rounded bg-background">
                          <span className="font-mono">{result.identifier}</span>
                          <Badge 
                            variant={
                              result.status === 'added' ? 'default' :
                              result.status === 'exists' ? 'secondary' :
                              result.status === 'not_found' ? 'outline' : 'destructive'
                            }
                            className="text-[10px]"
                          >
                            {result.status === 'added' && '✅ تم إضافته'}
                            {result.status === 'exists' && '🔄 موجود مسبقاً'}
                            {result.status === 'not_found' && '❌ غير موجود'}
                            {result.status === 'error' && '⚠️ خطأ'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetBulkForm} disabled={addBulkExceptions.isPending}>
              إلغاء
            </Button>
            <Button 
              onClick={handleBulkSubmit}
              disabled={
                addBulkExceptions.isPending || 
                !bulkIdentifiers.trim() || 
                parseBulkIdentifiers(bulkIdentifiers).length === 0 ||
                parseBulkIdentifiers(bulkIdentifiers).length > 100
              }
              data-testid="button-submit-bulk-exceptions"
            >
              {addBulkExceptions.isPending ? "جاري المعالجة..." : `إضافة ${parseBulkIdentifiers(bulkIdentifiers).length} حساب`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}