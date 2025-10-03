import { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card,
  Button,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import {
  BarChart,
  CreditCard,
  LogOut,
  MessageSquare,
  Settings,
  User,
  Users,
  Wallet,
  FileCheck,
  ArrowLeftRight,
  Globe,
  Banknote,
  ChevronRight,
  ChevronLeft,
  Bell,
  Activity,
  DollarSign,
  Shield,
  Code
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const sidebarNavItems = [
  {
    title: "لوحة التحكم",
    href: "/admin",
    icon: <BarChart className="h-5 w-5" />,
  },
  {
    title: "مراقبة الرسائل",
    href: "/admin/message-monitoring",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    title: "إدارة القيود والأذونات",
    href: "/admin/access-restrictions",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    title: "Dev Studio",
    href: "/admin/dev-studio",
    icon: <Code className="h-5 w-5" />,
  },
  {
    title: "إدارة المعاملات",
    href: "/admin-transactions",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    title: "التحويلات",
    href: "/admin-transfers-dashboard",
    icon: <ArrowLeftRight className="h-5 w-5" />,
  },
  {
    title: "طلبات التوثيق",
    href: "/admin-verification",
    icon: <FileCheck className="h-5 w-5" />,
  },
  {
    title: "إرسال إشعارات",
    href: "/admin-notifications",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    title: "إدارة المستخدمين",
    href: "/admin-users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "حوالات بسيطة",
    href: "/admin-simple-transfers",
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    title: "إعدادات عمولة متعددة العملات",
    href: "/admin/multi-currency-commission-settings",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    title: "نظام العمولة المحسن - معاينة فورية",
    href: "/admin/enhanced-commission-settings",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    title: "إعدادات المكافآت الثابتة",
    href: "/admin/fixed-rewards",
    icon: <DollarSign className="h-5 w-5" />,
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // التحقق من صلاحيات المشرف
  if (user?.type !== "admin") {
    navigate("/");
    return null;
  }
  
  // تحديد المستخدم المخول لإدارة القيود
  const canManageRestrictions = user?.email === "ss73ss73ss73@gmail.com";
  
  // فلترة عناصر القائمة الجانبية بناءً على الصلاحيات
  const filteredSidebarItems = sidebarNavItems.filter(item => {
    if (item.href === "/admin/access-restrictions" || item.href === "/admin/dev-studio") {
      return canManageRestrictions;
    }
    return true;
  });
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* الهيدر */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
        <div className="flex justify-between items-center w-full">
          <Link href="/admin">
            <a className="text-xl font-bold">
              لوحة المشرف
            </a>
          </Link>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.fullName?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 dir-rtl" align="end" forceMount>
              <DropdownMenuItem>
                <User className="ml-2 h-4 w-4" />
                <span>الملف الشخصي</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="ml-2 h-4 w-4" />
                <span>الاشتراكات</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="ml-2 h-4 w-4" />
                <span>الإعدادات</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                <LogOut className="ml-2 h-4 w-4" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* المحتوى الرئيسي */}
      <div className="flex flex-1">
        {/* الشريط الجانبي */}
        <aside className="hidden lg:flex border-l bg-background bg-opacity-90 w-64 flex-col p-4 shadow">
          <nav className="flex flex-col gap-2">
            {filteredSidebarItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <a
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent ${
                    location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  } ${
                    item.title === "مراقبة الرسائل" ? "border border-blue-200 bg-blue-50/50 text-blue-800 font-medium" : ""
                  }`}
                >
                  {item.icon}
                  <span>{item.title}</span>
                  {location === item.href && <ChevronLeft className="mr-auto h-4 w-4" />}
                </a>
              </Link>
            ))}
          </nav>
        </aside>
        
        {/* محتوى الصفحة */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}