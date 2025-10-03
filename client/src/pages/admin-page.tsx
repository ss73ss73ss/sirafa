import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, BarChart, Users, CreditCard, MessageSquare, ChevronRight, Shield, Settings } from "lucide-react";
import { Link } from "wouter";
import { Guard } from "@/components/Guard";
import { IPTestDisplay } from "@/components/IPTestDisplay";

export default function AdminPage() {
  return (
    <Guard page="admin">
      <AdminLayout>
      <div className="golden-page-bg container mx-auto px-4 py-8 min-h-screen">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">لوحة التحكم - المشرف</h1>
            <p className="text-neutral-500 mt-1">
              إدارة شاملة للنظام والمستخدمين
            </p>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>لوحة إدارة النظام</CardTitle>
              <CardDescription>
                مرحباً بك في لوحة إدارة النظام. يمكنك الوصول إلى جميع الأقسام من القائمة الجانبية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50/50 text-blue-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>إدارة النظام</AlertTitle>
                <AlertDescription>
                  استخدم القائمة الجانبية للوصول إلى جميع أقسام الإدارة: إدارة المستخدمين، طلبات الترقية، التحقق من الهوية، وغيرها من الخدمات.
                </AlertDescription>
              </Alert>
              
              {/* زر مراقبة الرسائل المميز */}
              <Link href="/admin/message-monitoring">
                <Button 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
                >
                  <MessageSquare className="ml-2 h-6 w-6" />
                  مراقبة الرسائل - ميزة جديدة
                  <ChevronRight className="mr-auto h-5 w-5" />
                </Button>
              </Link>
              
              {/* زر إدارة القيود والأذونات */}
              <Link href="/admin/access-restrictions">
                <Button 
                  size="lg" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold"
                >
                  <Shield className="ml-2 h-6 w-6" />
                  إدارة القيود والأذونات - النظام الأمني
                  <ChevronRight className="mr-auto h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إحصائيات النظام</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">نشط</div>
                <p className="text-xs text-muted-foreground">النظام يعمل بكفاءة</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إدارة المستخدمين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">متاح</div>
                <p className="text-xs text-muted-foreground">جميع الميزات متاحة</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إدارة العمولات</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">محدث</div>
                <p className="text-xs text-muted-foreground">آخر تحديث اليوم</p>
              </CardContent>
            </Card>
            
            <Link href="/admin/message-monitoring">
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 bg-blue-50/30 hover:bg-blue-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">مراقبة الرسائل</CardTitle>
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">جديد</div>
                  <p className="text-xs text-blue-600">اضغط للوصول للصفحة</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* قسم الاختبارات التقنية */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                الاختبارات التقنية
              </CardTitle>
              <CardDescription>
                أدوات اختبار للتحقق من عمل الأنظمة التقنية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <IPTestDisplay />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </AdminLayout>
    </Guard>
  );
}