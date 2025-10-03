import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { PageRestrictionGuard } from "@/components/PageRestrictionGuard";
import { 
  Building2, 
  Percent, 
  ClipboardCheck,
  Globe,
  ArrowRight
} from "lucide-react";

export default function InternationalPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const isAgent = user?.type === "agent";
  const isAdmin = user?.type === "admin";

  // صفحة الخدمات الدولية
  const internationalServices = [
    {
      title: "التحويل الدولي",
      description: "إدارة التحويلات الدولية بين المكاتب مع تتبع العمولات والأرصدة",
      icon: <Building2 className="h-8 w-8 text-blue-600" />,
      path: "/office-management",
      available: isAgent || isAdmin,
      color: "border-blue-200 hover:border-blue-300"
    },
    {
      title: "إعدادات العمولة",
      description: "إدارة معدلات العمولة للتحويلات الدولية والمحلية",
      icon: <Percent className="h-8 w-8 text-green-600" />,
      path: "/agent/commission-settings",
      available: isAgent,
      color: "border-green-200 hover:border-green-300"
    },
    {
      title: "استلام حوالة مكتب",
      description: "استلام وتأكيد الحوالات الواردة من المكاتب الأخرى",
      icon: <ClipboardCheck className="h-8 w-8 text-purple-600" />,
      path: "/inter-office-receive",
      available: isAgent,
      color: "border-purple-200 hover:border-purple-300"
    }
  ];

  const availableServices = internationalServices.filter(service => service.available);

  return (
    <PageRestrictionGuard pageKey="international" pageName="الخدمات الدولية">
      <div className="container mx-auto p-6 max-w-6xl" dir="rtl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الخدمات الدولية</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">إدارة شاملة للتحويلات والخدمات الدولية</p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableServices.map((service, index) => (
            <Card key={index} className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${service.color}`}>
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {service.icon}
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => setLocation(service.path)}
                  className="w-full group hover:bg-blue-600 hover:text-white transition-colors"
                  variant="outline"
                >
                  الدخول إلى الخدمة
                  <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        {!isAgent && !isAdmin && (
          <Card className="mt-8 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <CardHeader>
              <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                معلومة هامة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 dark:text-amber-300">
                الخدمات الدولية متاحة للوكلاء المعتمدين فقط. 
                يرجى طلب ترقية الحساب للوصول إلى هذه الخدمات.
              </p>
            </CardContent>
          </Card>
        )}

        {availableServices.length === 0 && (isAgent || isAdmin) && (
          <Card className="mt-8 border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-gray-600 dark:text-gray-400">
                لا توجد خدمات متاحة حالياً
              </CardTitle>
              <CardDescription>
                يتم تحديث الخدمات المتاحة بناءً على نوع الحساب والصلاحيات
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </PageRestrictionGuard>
  );
}