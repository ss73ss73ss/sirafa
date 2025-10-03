import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function BlockedPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // استخراج المعاملات من الـ URL
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason') || 'تم تقييد وصولك لهذه الصفحة';
  const page = urlParams.get('page') || 'غير محدد';

  // ترجمة أسماء الصفحات للعربية
  const getPageName = (pageKey: string) => {
    const pageNames: Record<string, string> = {
      'market': 'السوق',
      'send': 'الإرسال',
      'receive': 'الاستقبال',
      'wallet': 'المحفظة',
      'dashboard': 'لوحة التحكم',
      'kyc': 'التوثيق',
      'chat': 'المحادثات',
      'inter_office': 'التحويل بين المكاتب',
      'international': 'التحويل الدولي',
      'reports': 'التقارير',
      'settings': 'الإعدادات',
      'admin': 'الإدارة',
      'all': 'جميع الصفحات'
    };
    return pageNames[pageKey] || pageKey;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl text-red-800 dark:text-red-200">
              تم تقييد الوصول
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-300">
              لا يمكنك الوصول إلى هذه الصفحة حالياً
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                تفاصيل القيد:
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">الصفحة المقيدة:</span>{' '}
                  <span className="text-red-700 dark:text-red-300">{getPageName(page)}</span>
                </div>
                <div>
                  <span className="font-medium">السبب:</span>{' '}
                  <span className="text-red-700 dark:text-red-300">{reason}</span>
                </div>
                {user && (
                  <div>
                    <span className="font-medium">رقم الحساب:</span>{' '}
                    <span className="text-red-700 dark:text-red-300">{user.accountNumber || user.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                ماذا يمكنني فعله؟
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• تواصل مع فريق الدعم لمراجعة حالة حسابك</li>
                <li>• تأكد من التزامك بشروط وأحكام الخدمة</li>
                <li>• يمكنك الوصول للصفحات الأخرى غير المقيدة</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setLocation('/')}
                className="flex-1"
                variant="outline"
              >
                <Home className="w-4 h-4 mr-2" />
                العودة للرئيسية
              </Button>
              
              <Button 
                onClick={() => setLocation('/support')}
                className="flex-1"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                تواصل مع الدعم
              </Button>
            </div>

            <div className="text-xs text-center text-muted-foreground">
              إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع فريق الدعم
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}