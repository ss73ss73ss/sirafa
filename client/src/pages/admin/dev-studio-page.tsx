import { useEffect } from "react";
import { useLocation } from "wouter";
import { Code, Layout, Palette, Settings, Database, Eye, GitBranch, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

const AUTHORIZED_EMAIL = "ss73ss73ss73@gmail.com";

export default function DevStudioPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // حماية مزدوجة - إعادة توجيه فوري إذا لم يكن المستخدم مصرحاً له
  useEffect(() => {
    if (user && user.email !== AUTHORIZED_EMAIL) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);

  // لا تعرض أي شيء إذا لم يكن المستخدم مصرحاً له
  if (!user || user.email !== AUTHORIZED_EMAIL) {
    return null;
  }

  const sections = [
    {
      id: "pages",
      title: "الصفحات",
      description: "إنشاء وتحرير صفحات جديدة",
      icon: Layout,
      color: "bg-blue-500",
      route: "/admin/dev-studio/pages"
    },
    {
      id: "components", 
      title: "المكونات",
      description: "مكتبة المكونات القابلة للإعادة",
      icon: Code,
      color: "bg-green-500",
      route: "/admin/dev-studio/components"
    },
    {
      id: "functions",
      title: "الدوال",
      description: "دوال قاعدة البيانات والمنطق",
      icon: Database,
      color: "bg-purple-500",
      route: "/admin/dev-studio/functions"
    },
    {
      id: "themes",
      title: "السمات",
      description: "الألوان والأشكال والخطوط",
      icon: Palette,
      color: "bg-pink-500",
      route: "/admin/dev-studio/themes"
    },
    {
      id: "features",
      title: "الميزات",
      description: "تفعيل/تعطيل ميزات النظام",
      icon: Settings,
      color: "bg-orange-500",
      route: "/admin/dev-studio/features"
    },
    {
      id: "preview",
      title: "المعاينة",
      description: "معاينة التغييرات قبل النشر",
      icon: Eye,
      color: "bg-teal-500",
      route: "/admin/dev-studio/preview"
    },
    {
      id: "releases",
      title: "الإصدارات",
      description: "إدارة النشر والتراجع",
      icon: GitBranch,
      color: "bg-indigo-500",
      route: "/admin/dev-studio/releases"
    },
    {
      id: "audit",
      title: "السجلات",
      description: "سجل جميع العمليات",
      icon: Activity,
      color: "bg-red-500",
      route: "/admin/dev-studio/audit"
    }
  ];

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dev Studio</h1>
          <p className="text-muted-foreground mt-2">
            بيئة التطوير المتكاملة - حصرية للمطور الرئيسي
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          نشط
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Layout className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">الصفحات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Code className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">المكونات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Database className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">الدوال</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Settings className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">الميزات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="tools">الأدوات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أحدث النشاطات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                لا توجد نشاطات حديثة
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Card 
                  key={section.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(section.route)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className={`p-2 rounded-lg ${section.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {section.description}
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      فتح
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">!</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-amber-800">تنبيه أمني</h4>
              <p className="text-sm text-amber-700 mt-1">
                هذه البيئة محمية بمستوى أمان عالي. جميع العمليات مُسجلة ومُراقبة.
                الوصول محصور على البريد الإلكتروني المصرح له فقط.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}