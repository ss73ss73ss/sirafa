import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input-ar";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Camera, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Eye,
  Ban
} from "lucide-react";

export default function SecurityDemoPage() {
  const [demoEmail, setDemoEmail] = useState("");
  const [demoPassword, setDemoPassword] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFailedLogin = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const fingerprint = `demo_test_${Date.now()}`;
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail || 'demo@security-test.com',
          password: demoPassword || 'wrong_password',
          fingerprint,
          userAgent: 'Security Demo Browser',
          ipAddress: '192.168.1.100'
        })
      });

      const result = await response.json();
      
      // Check block status
      const blockResponse = await fetch('/api/security/check-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint })
      });
      
      const blockResult = await blockResponse.json();
      
      setTestResult({
        loginResponse: result,
        blocked: blockResult.blocked,
        fingerprint,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResult({
        error: 'خطأ في الاتصال بالخادم',
        timestamp: new Date().toISOString()
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="text-red-500" />
          عرض توضيحي لنظام الأمان
        </h1>
        <p className="text-muted-foreground">
          تجربة عملية لنظام الأمان الذكي مع التقاط الصور وتسجيل المحاولات المشبوهة
        </p>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demo">تجربة النظام</TabsTrigger>
          <TabsTrigger value="features">المميزات</TabsTrigger>
          <TabsTrigger value="logs">السجلات</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="text-blue-500" />
                اختبار النظام الأمني
              </CardTitle>
              <CardDescription>
                قم بإدخال بيانات خاطئة لتجربة كيفية عمل نظام الأمان في التقاط الصور وتسجيل المحاولات المشبوهة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-email">البريد الإلكتروني</Label>
                  <Input
                    id="demo-email"
                    type="email"
                    placeholder="demo@security-test.com"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-password">كلمة المرور</Label>
                  <Input
                    id="demo-password"
                    type="password"
                    placeholder="wrong_password"
                    value={demoPassword}
                    onChange={(e) => setDemoPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>تحذير</AlertTitle>
                <AlertDescription>
                  هذا اختبار للنظام الأمني. استخدم بيانات وهمية فقط.
                  بعد 3 محاولات فاشلة، سيتم حظر جهازك مؤقتاً.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={testFailedLogin} 
                disabled={loading}
                className="w-full"
                variant="destructive"
              >
                {loading ? 'جارٍ الاختبار...' : 'اختبار محاولة دخول فاشلة'}
              </Button>

              {testResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {testResult.error ? (
                        <>
                          <XCircle className="text-red-500 h-4 w-4" />
                          نتيجة الاختبار - خطأ
                        </>
                      ) : (
                        <>
                          <CheckCircle className="text-green-500 h-4 w-4" />
                          نتيجة الاختبار - نجح
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {testResult.error ? (
                      <Alert variant="destructive">
                        <AlertDescription>{testResult.error}</AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">رد الخادم:</span>
                          <span>{testResult.loginResponse.message}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">حالة الحظر:</span>
                          <span className={testResult.blocked ? "text-red-500" : "text-green-500"}>
                            {testResult.blocked ? "محظور" : "غير محظور"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">بصمة الجهاز:</span>
                          <span className="font-mono text-xs">{testResult.fingerprint.substring(0, 16)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">وقت الاختبار:</span>
                          <span>{new Date(testResult.timestamp).toLocaleString('ar-EG')}</span>
                        </div>
                        
                        <Alert className="mt-3">
                          <Camera className="h-4 w-4" />
                          <AlertTitle>تم تفعيل النظام الأمني</AlertTitle>
                          <AlertDescription>
                            تم تسجيل هذه المحاولة في السجلات الأمنية وتم إنتاج صورة أمنية تلقائياً.
                            يمكن للمسؤولين مراجعة السجلات والصور في لوحة الإدارة.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="text-blue-500" />
                  التقاط الصور التلقائي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• التقاط صور أمنية عند كل محاولة دخول فاشلة</li>
                  <li>• حفظ الصور مع طوابع زمنية وبصمات الأجهزة</li>
                  <li>• إنتاج صور بديلة عند عدم توفر الكاميرا</li>
                  <li>• عرض تحذيرات أمنية في الصور المولدة</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="text-green-500" />
                  الحماية المتقدمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• حظر تلقائي بعد 3 محاولات فاشلة</li>
                  <li>• تتبع بصمات الأجهزة الفريدة</li>
                  <li>• تسجيل عناوين IP والموقع الجغرافي</li>
                  <li>• منع الوصول للأجهزة المحظورة</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="text-purple-500" />
                  المراقبة الذكية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• تسجيل شامل لجميع المحاولات</li>
                  <li>• معلومات تفصيلية عن كل محاولة</li>
                  <li>• تصنيف مستويات الخطر</li>
                  <li>• إشعارات فورية للمسؤولين</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ban className="text-red-500" />
                  إدارة الحظر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• حظر وإلغاء حظر الأجهزة يدوياً</li>
                  <li>• سجلات إلغاء الحظر للتدقيق</li>
                  <li>• واجهة إدارة سهلة الاستخدام</li>
                  <li>• تتبع حالة الحظر في الوقت الفعلي</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>الوصول لسجلات الأمان</CardTitle>
              <CardDescription>
                يمكن للمسؤولين الوصول لسجلات الأمان الكاملة من خلال لوحة الإدارة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>ملاحظة هامة</AlertTitle>
                <AlertDescription>
                  السجلات الأمنية والصور متاحة فقط للمسؤولين المخولين.
                  يتم حفظ جميع الأحداث الأمنية مع تفاصيل كاملة للمراجعة والتدقيق.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}