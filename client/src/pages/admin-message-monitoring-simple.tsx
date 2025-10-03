import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShieldAlert, ArrowLeft } from "lucide-react";
import AdminLayout from "@/components/admin-layout";

export default function AdminMessageMonitoringPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Check access permission
  if (!user || user.email !== "ss73ss73ss73@gmail.com") {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center" dir="rtl">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <CardTitle className="text-2xl text-red-600">
                غير مصرح بالوصول
              </CardTitle>
              <CardDescription>
                هذه الصفحة مخصصة للمشرف العام فقط
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => navigate("/admin")}
                className="w-full"
                variant="outline"
              >
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة إلى لوحة الإدارة
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-neutral-100" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">مراقبة الرسائل</h1>
                <p className="text-gray-600">نظام مراقبة شامل للمحادثات الخاصة والعامة</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/admin")}
              variant="outline"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة للإدارة
            </Button>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>صفحة مراقبة الرسائل</CardTitle>
              <CardDescription>
                تم إنشاء الصفحة بنجاح - سيتم إضافة الميزات التفاعلية قريباً
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">مرحباً بك في نظام مراقبة الرسائل</h3>
                <p className="text-gray-600 mb-4">
                  هذه الصفحة مخصصة لمراقبة جميع المحادثات في النظام
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">المحادثات الخاصة</h4>
                    <p className="text-sm text-gray-600">مراقبة الرسائل بين المستخدمين</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">الغرف العامة</h4>
                    <p className="text-sm text-gray-600">مراقبة المجموعات والغرف</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}