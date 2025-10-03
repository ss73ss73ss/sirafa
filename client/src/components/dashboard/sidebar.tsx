import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { getInitials } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { convertToWesternNumerals } from "@/lib/number-utils";
import { useTheme } from "@/components/theme-provider";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSidebarTrigger } from "@/components/mobile-sidebar-trigger";
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Settings, 
  LifeBuoy, 
  LogOut,
  BadgeCheck,
  Building2,
  ArrowLeftRight,
  ClipboardCheck,
  ExternalLink,
  Bell,
  HelpCircle,
  Percent,
  Send,
  ListOrdered,
  MessageSquare,
  MessageCircle,
  ShoppingCart,
  Users,
  Shield,
  FileText,
  Wallet,
  Globe,
  Download,
  CreditCard,
  Activity,
  Zap,
  Sun,
  Moon,
  Code
} from "lucide-react";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [upgradeCheckDialog, setUpgradeCheckDialog] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Fetch user upgrade request status (for city transfers)
  const { data: upgradeRequest } = useQuery({
    queryKey: ["/api/user/upgrade-request"],
    retry: false,
  });

  // Fetch all user upgrade requests to check for external transfer requests - مع منع الاستعلامات المكررة
  const { data: allUpgradeRequests = [] } = useQuery({
    queryKey: ["/api/user/upgrade-requests"],
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 دقائق
    gcTime: 30 * 60 * 1000, // 30 دقيقة
    refetchOnMount: false, // منع إعادة التحميل عند mount في وضع StrictMode
    refetchOnWindowFocus: false, // منع إعادة التحميل عند العودة للنافذة
  });

  if (!user) return null;

  // فحص بيانات المستخدم بشكل دوري للتأكد من تحديث الحالة
  console.log('حالة التحويل الدولي للمستخدم:', {
    userId: user.id,
    extTransferEnabled: user.extTransferEnabled,
    type: user.type
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleTheme = () => {
    // التبديل البسيط بين الفاتح والداكن
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  // دالة prefetching لتحميل بيانات التحويل الدولي مسبقاً
  const prefetchOfficeManagementData = () => {
    if (!user || (user.type !== 'agent' && user.type !== 'admin')) return;

    // تحميل البيانات الأساسية مسبقاً
    const queries = [
      { queryKey: ['/api/agent/commissions'], queryFn: () => apiRequest('/api/agent/commissions', 'GET').then(res => res.json()) },
      { queryKey: ['/api/agent/commission-stats'], queryFn: () => apiRequest('/api/agent/commission-stats', 'GET').then(res => res.json()) },
      { queryKey: ['/api/countries/international'], queryFn: () => apiRequest('/api/countries/international', 'GET').then(res => res.json()) },
      { queryKey: ['/api/balance'], queryFn: () => apiRequest('/api/balance', 'GET').then(res => res.json()) },
      { queryKey: ['/api/commission-rates', 'international', 'USD'], queryFn: () => apiRequest('/api/commission-rates?transferType=international&currency=USD', 'GET').then(res => res.json()) },
    ];

    // تشغيل prefetch لكل query
    queries.forEach(({ queryKey, queryFn }) => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5 دقائق
      });
    });
  };

  const handleNavigation = (path: string) => {
    // إغلاق القائمة الجانبية على الهاتف عند التنقل
    if (isMobile) {
      setMobileOpen(false);
    }
    
    // التحقق من الوصول للتحويل الدولي
    if (path === "/inter-office-transfer") {
      // إذا كان المستخدم وكيل أو مدير، اسمح بالوصول مباشرة
      if (user?.type === 'agent' || user?.type === 'admin') {
        setLocation(path);
        return;
      }
      
      // إذا كان مستخدم عادي، تحقق من حالة الترقية
      if (!upgradeRequest) {
        // لم يطلب الترقية بعد
        setUpgradeCheckDialog(true);
        return;
      }
      
      if ((upgradeRequest as any)?.status === 'pending') {
        toast({
          title: "طلب قيد المراجعة",
          description: "طلب الترقية الخاص بك قيد المراجعة من قبل الإدارة. يرجى الانتظار.",
          variant: "default",
        });
        return;
      }
      
      if ((upgradeRequest as any)?.status === 'rejected') {
        toast({
          title: "طلب مرفوض",
          description: "تم رفض طلب الترقية الخاص بك. يمكنك تقديم طلب جديد.",
          variant: "destructive",
        });
        return;
      }
      
      if ((upgradeRequest as any)?.status === 'approved') {
        // مسموح بالوصول
        setLocation(path);
        return;
      }
    }
    
    // للمسارات الأخرى، انتقل مباشرة
    setLocation(path);
  };

  // Menu items - قائمة كاملة شاملة من dashboard-layout
  const isAgent = user.type === "agent";
  const isAdmin = user.type === "admin";
  
  // الصلاحيات التفصيلية للمدراء
  const userPermissions = {
    canManageUsers: (user as any).canManageUsers || false,
    canManageMarket: (user as any).canManageMarket || false,
    canManageChat: (user as any).canManageChat || false,
    canManageInternalTransfers: (user as any).canManageInternalTransfers || false,
    canManageExternalTransfers: (user as any).canManageExternalTransfers || false,
    canManageNewAccounts: (user as any).canManageNewAccounts || false,
    canManageSecurity: (user as any).canManageSecurity || false,
    canManageSupport: (user as any).canManageSupport || false,
    canManageReports: (user as any).canManageReports || false,
    canManageSettings: (user as any).canManageSettings || false,
  };
  
  // للمدير العام فقط (adminLevel = 2) - صلاحية كاملة
  const isSuperAdmin = isAdmin && (user as any).adminLevel === 2;
  
  const menuItems = [
    { 
      label: "الرئيسية", 
      icon: <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />, 
      path: "/dashboard",
      active: location === "/dashboard"
    },
    { 
      label: "الرصيد", 
      icon: <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />, 
      path: "/balance",
      active: location === "/balance"
    },
    ...(user.countryId === 1 ? [{ 
      label: "حوالة داخلية", 
      icon: <Send className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />, 
      path: "/internal-transfer",
      active: location === "/internal-transfer"
    }] : []),
    { 
      label: "التحويلات", 
      icon: <ArrowLeftRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />, 
      path: "/transfers",
      active: location === "/transfers"
    },
    { 
      label: "كشف الحساب", 
      icon: <FileText className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />, 
      path: "/statement",
      active: location === "/statement"
    },
    { 
      label: "الدولية", 
      icon: <Globe className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />, 
      path: "/international",
      active: location === "/international"
    },
    { 
      label: "الإشعارات", 
      icon: <Bell className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />, 
      path: "/notifications",
      active: location === "/notifications"
    },
    { 
      label: "الدردشة العامة", 
      icon: <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />, 
      path: "/chat",
      active: location === "/chat"
    },
    { 
      label: "الرسائل الخاصة", 
      icon: <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />, 
      path: "/private-chat",
      active: location === "/private-chat"
    },
    { 
      label: "محادثات المجموعات", 
      icon: <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />, 
      path: "/group-chats",
      active: location === "/group-chats"
    },
    { 
      label: "سوق العملات", 
      icon: <ShoppingCart className="h-5 w-5 ml-2" />, 
      path: "/market",
      active: location === "/market"
    },
    { 
      label: "نظام الإحالة", 
      icon: <Users className="h-5 w-5 ml-2" />, 
      path: "/referrals",
      active: location === "/referrals"
    },
    ...(!isAdmin ? [
      ...((() => {
        // فحص طلبات التحويل الدولي بشكل منفصل عن طلبات ترقية التحويل بين المدن
        // يظهر للمستخدمين العاديين والوكلاء، ولكن ليس للمدراء
        const externalTransferRequest = (allUpgradeRequests as any[])?.find((req: any) => req.requestType === 'external_transfer');
        
        // إذا لم يكن هناك طلب تحويل دولي أو كان مرفوضاً، اعرض الزر
        if (!externalTransferRequest || externalTransferRequest.status === 'rejected') {
          return [{ 
            label: "طلب التحويل الدولي", 
            icon: <Globe className="h-5 w-5 ml-2" />, 
            path: "/external-transfer-request",
            active: location === "/external-transfer-request"
          }];
        }
        
        // إذا كان الطلب قيد المراجعة أو معتمد، لا تعرض الزر (الصفحة ستتعامل مع العرض)
        return [];
      })())
    ] : []),
    ...(isAgent ? [
      ...(user.countryId === 1 ? [{ 
        label: "الحوالات بين المدن", 
        icon: <ArrowLeftRight className="h-5 w-5 ml-2" />, 
        path: "/city-transfers",
        active: location === "/city-transfers"
      }] : []),
    ] : []),
    ...(!isAgent && !isAdmin && user.countryId === 1 ? [
      ...((() => {
        // تحقق من حالة طلب الترقية
        if (!upgradeRequest) {
          // لا يوجد طلب - اعرض زر طلب الترقية
          return [{
            label: "طلب ترقية", 
            icon: <BadgeCheck className="h-5 w-5 ml-2" />, 
            path: "/upgrade-request",
            active: location === "/upgrade-request"
          }];
        }
        
        if ((upgradeRequest as any)?.status === 'pending') {
          // طلب قيد المراجعة - لا تعرض الزر
          return [];
        }
        
        if ((upgradeRequest as any)?.status === 'approved') {
          // تمت الموافقة - لا تعرض الزر
          return [];
        }
        
        if ((upgradeRequest as any)?.status === 'rejected') {
          // تم الرفض - اعرض الزر للإعادة التقديم
          return [{
            label: "طلب ترقية", 
            icon: <BadgeCheck className="h-5 w-5 ml-2" />, 
            path: "/upgrade-request",
            active: location === "/upgrade-request"
          }];
        }
        
        // حالة افتراضية
        return [{
          label: "طلب ترقية", 
          icon: <BadgeCheck className="h-5 w-5 ml-2" />, 
          path: "/upgrade-request",
          active: location === "/upgrade-request"
        }];
      })())
    ] : []),
    ...(!user.verified && !isAdmin ? [
      { 
        label: "توثيق الحساب", 
        icon: <BadgeCheck className="h-5 w-5 ml-2" />, 
        path: "/verify-account",
        active: location === "/verify-account"
      }
    ] : []),
    // قسم الإدارة - بصلاحيات تفصيلية
    ...(isAdmin ? [
      // مراقبة الدردشات - للمدير العام أو من لديه صلاحية إدارة الدردشة
      ...(isSuperAdmin || userPermissions.canManageChat ? [{
        label: "لوحة الإدارة", 
        icon: <Shield className="h-5 w-5 ml-2" />, 
        path: "/admin/message-monitoring",
        active: location === "/admin/message-monitoring"
      }] : []),
      
      // إدارة القيود والأذونات - للمستخدم المخول فقط
      ...(user?.email === "ss73ss73ss73@gmail.com" ? [{
        label: "إدارة القيود والأذونات", 
        icon: <Shield className="h-5 w-5 ml-2" />, 
        path: "/admin/access-restrictions",
        active: location === "/admin/access-restrictions"
      }] : []),
      
      // Dev Studio - للمستخدم المخول فقط
      ...(user?.email === "ss73ss73ss73@gmail.com" ? [{
        label: "Dev Studio", 
        icon: <Code className="h-5 w-5 ml-2" />, 
        path: "/admin/dev-studio",
        active: location === "/admin/dev-studio"
      }] : []),
      
      // إدارة المعاملات - للمدير العام أو من لديه صلاحية إدارة التحويلات
      ...(isSuperAdmin || userPermissions.canManageInternalTransfers || userPermissions.canManageExternalTransfers ? [{
        label: "إدارة المعاملات", 
        icon: <Activity className="h-5 w-5 ml-2" />, 
        path: "/admin-transactions",
        active: location === "/admin-transactions"
      }] : []),
      
      // إدارة المستخدمين - للمدير العام أو من لديه صلاحية إدارة المستخدمين
      ...(isSuperAdmin || userPermissions.canManageUsers ? [{
        label: "إدارة المستخدمين", 
        icon: <Users className="h-5 w-5 ml-2" />, 
        path: "/admin-users",
        active: location === "/admin-users"
      }] : []),
      
      // إدارة التحويلات - للمدير العام أو من لديه صلاحية إدارة التحويلات
      ...(isSuperAdmin || userPermissions.canManageInternalTransfers || userPermissions.canManageExternalTransfers ? [{
        label: "إدارة التحويلات", 
        icon: <ArrowLeftRight className="h-5 w-5 ml-2" />, 
        path: "/admin-transfers-dashboard",
        active: location === "/admin-transfers-dashboard"
      }] : []),
      
      // الإشعارات - للمدير العام أو من لديه صلاحية الدعم
      ...(isSuperAdmin || userPermissions.canManageSupport ? [{
        label: "الإشعارات", 
        icon: <Bell className="h-5 w-5 ml-2" />, 
        path: "/admin-notifications",
        active: location === "/admin-notifications"
      }] : []),
      
      // طلبات التحقق من الهوية - للمدير العام أو من لديه صلاحية إدارة الحسابات الجديدة
      ...(isSuperAdmin || userPermissions.canManageNewAccounts ? [{
        label: "طلبات التحقق من الهوية", 
        icon: <BadgeCheck className="h-5 w-5 ml-2" />, 
        path: "/admin-verification",
        active: location === "/admin-verification"
      }] : []),
      
      // طلبات الترقية - للمدير العام أو من لديه صلاحية إدارة الحسابات الجديدة
      ...(isSuperAdmin || userPermissions.canManageNewAccounts ? [{
        label: "طلبات الترقية", 
        icon: <BadgeCheck className="h-5 w-5 ml-2" />, 
        path: "/admin-upgrade-requests",
        active: location === "/admin-upgrade-requests"
      }] : []),
      
      // حساب العمولات - للمدير العام أو من لديه صلاحية إدارة التقارير
      ...(isSuperAdmin || userPermissions.canManageReports ? [{
        label: "حساب العمولات", 
        icon: <Wallet className="h-5 w-5 ml-2" />, 
        path: "/commission-pool",
        active: location === "/commission-pool"
      }] : []),
      
      // نسب العمولة - للمدير العام أو من لديه صلاحية إدارة الإعدادات
      ...(isSuperAdmin || userPermissions.canManageSettings ? [{
        label: "نسب العمولة", 
        icon: <Settings className="h-5 w-5 ml-2" />, 
        path: "/system-commission-rates",
        active: location === "/system-commission-rates"
      }] : []),
      
      
      // إعدادات المكافآت الثابتة - للمدير العام أو من لديه صلاحية إدارة الإعدادات
      ...(isSuperAdmin || userPermissions.canManageSettings ? [{
        label: "إعدادات المكافآت الثابتة", 
        icon: <Wallet className="h-5 w-5 ml-2" />, 
        path: "/admin/fixed-rewards",
        active: location === "/admin/fixed-rewards"
      }] : []),
      
      // سجلات العمولة - للمدير العام أو من لديه صلاحية إدارة التقارير
      ...(isSuperAdmin || userPermissions.canManageReports ? [{
        label: "سجلات العمولة", 
        icon: <FileText className="h-5 w-5 ml-2" />, 
        path: "/admin/commission-logs",
        active: location === "/admin/commission-logs"
      }] : []),
      
      // نظام الأمان - للمدير العام أو من لديه صلاحية إدارة الأمان
      ...(isSuperAdmin || userPermissions.canManageSecurity ? [{
        label: "نظام الأمان", 
        icon: <Shield className="h-5 w-5 ml-2" />, 
        path: "/security-admin",
        active: location === "/security-admin"
      }] : []),
      
      // إدارة الدول - للمدير العام أو من لديه صلاحية إدارة الإعدادات
      ...(isSuperAdmin || userPermissions.canManageSettings ? [{
        label: "إدارة الدول", 
        icon: <Globe className="h-5 w-5 ml-2" />, 
        path: "/admin-countries",
        active: location === "/admin-countries"
      }] : [])
    ] : []),
    { 
      label: "إعدادات الحساب", 
      icon: <Settings className="h-5 w-5 ml-2" />, 
      path: "/user-settings",
      active: location === "/user-settings" || location === "/dashboard/settings"
    },
    { 
      label: "المساعدة والدعم", 
      icon: <HelpCircle className="h-5 w-5 ml-2" />, 
      path: "/support",
      active: location === "/support"
    }
  ];

  // مكون المحتوى المشترك للسايدبار
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 lg:p-4 border-b bg-gradient-to-l from-primary/5 to-transparent">
        <h2 className="text-lg lg:text-xl font-bold text-primary">مكتب الصرافة</h2>
        <p className="text-xs text-muted-foreground mt-1">نظام التحويلات المصرفية</p>
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-1 sm:space-y-2 p-2 sm:p-3">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={() => {
                  // prefetch بيانات صفحة التحويل الدولي عند hover
                  if (item.path === "/inter-office-transfer") {
                    prefetchOfficeManagementData();
                  }
                }}
                className={`w-full justify-start space-x-2 sm:space-x-3 space-x-reverse rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:scale-[1.01] hover:shadow-sm"
                }`}
                variant="ghost"
              >
                {item.icon}
                <span className="text-right">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="p-3 sm:p-4 border-t mt-auto space-y-2 sm:space-y-3 bg-gradient-to-l from-muted/30 to-transparent">
        <div className="space-y-1">
          <p className="font-bold text-[#476b3d] text-xs sm:text-sm truncate">
            {user.fullName}
          </p>
          <p className="text-[#476b3d] text-xs sm:text-sm font-bold truncate">
            رقم الحساب {convertToWesternNumerals((user as any).account_number || user.accountNumber || `20000000${user.id.toString().padStart(2, '0')}`)}
          </p>
          <p className="text-xs font-bold text-[#f50000]">
            {user.type === "user" ? "مستخدم عادي" : 
             user.type === "agent" ? "مكتب صرافة" : 
             user.type === "admin" ? "مشرف النظام" : user.type}
          </p>
        </div>

        {/* زر تبديل الوضع الداكن */}
        <Button
          onClick={toggleTheme}
          variant="outline"
          className="w-full justify-start space-x-2 sm:space-x-3 space-x-reverse rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium"
        >
          {theme === "dark" ? (
            <Sun className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
          ) : (
            <Moon className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
          )}
          <span className="truncate">{theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</span>
        </Button>
        
        <Button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full justify-start space-x-2 sm:space-x-3 space-x-reverse rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-red-500 hover:bg-red-600 text-white"
          variant="default"
        >
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
          <span className="truncate">{logoutMutation.isPending ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}</span>
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* زر فتح القائمة للهاتف المحمول */}
        <MobileSidebarTrigger 
          onClick={() => setMobileOpen(!mobileOpen)}
          isOpen={mobileOpen}
        />

        {/* Sheet القائمة الجانبية للهاتف المحمول */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent 
            side="right" 
            className="w-64 sm:w-72 lg:w-80 p-0 bg-white border-l border-gray-200 shadow-2xl"
            dir="rtl"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>القائمة الجانبية</SheetTitle>
              <SheetDescription>قائمة التنقل الرئيسية</SheetDescription>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* نافذة تنبيه طلب الترقية */}
        <Dialog open={upgradeCheckDialog} onOpenChange={setUpgradeCheckDialog}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-center">يجب طلب الترقية أولاً</DialogTitle>
              <DialogDescription className="text-center">
                للوصول إلى خدمة التحويل الدولي، يجب عليك طلب ترقية الحساب أولاً.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => {
                  setUpgradeCheckDialog(false);
                  setLocation('/upgrade-request');
                }}
                className="w-full"
              >
                طلب الترقية الآن
              </Button>
              <Button
                variant="outline"
                onClick={() => setUpgradeCheckDialog(false)}
                className="w-full"
              >
                إلغاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop sidebar
  return (
    <>
      <aside className="flex flex-col w-64 border-l overflow-y-auto bg-card">
        <SidebarContent />
      </aside>

      {/* نافذة تنبيه طلب الترقية */}
      <Dialog open={upgradeCheckDialog} onOpenChange={setUpgradeCheckDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center">يجب طلب الترقية أولاً</DialogTitle>
            <DialogDescription className="text-center">
              للوصول إلى خدمة التحويل الدولي، يجب عليك طلب ترقية الحساب أولاً.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => {
                setUpgradeCheckDialog(false);
                setLocation('/upgrade-request');
              }}
              className="w-full"
            >
              طلب الترقية الآن
            </Button>
            <Button
              variant="outline"
              onClick={() => setUpgradeCheckDialog(false)}
              className="w-full"
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}