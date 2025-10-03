import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input-ar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { security } from '@/lib/security';

export default function SecurityTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastImage, setLastImage] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('sale5mjeddi@gmail.com');

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCameraCapture = async () => {
    setIsCapturing(true);
    addResult('🚨 بدء اختبار التقاط الصورة الأمنية...');

    try {
      // Request camera permission first
      const permission = await security.requestCameraPermission();
      addResult(`📋 إذن الكاميرا: ${permission ? 'مُمنوح' : 'مرفوض'}`);

      if (!permission) {
        addResult('❌ لا يمكن التقاط الصورة بدون إذن الكاميرا');
        setIsCapturing(false);
        return;
      }

      // Capture security image
      const image = await security.captureSecurityImage();
      addResult(`📸 نتيجة التقاط الصورة: ${image ? 'نجح' : 'فشل'}`);

      if (image) {
        setLastImage(image);
        addResult('✅ تم التقاط صورة أمنية بنجاح');
        
        // Test reporting suspicious activity
        await security.reportSuspiciousActivity({
          username: testEmail,
          error: 'اختبار نظام الأمان',
          attempts: 1,
          securityImage: image
        });
        addResult('📝 تم إرسال تقرير النشاط المشبوه');
      } else {
        addResult('❌ فشل في التقاط الصورة الأمنية');
      }
    } catch (error: any) {
      addResult(`❌ خطأ في الاختبار: ${error.message}`);
      console.error('Security test error:', error);
    }

    setIsCapturing(false);
  };

  const testFailedLogin = async () => {
    addResult('🔐 بدء اختبار محاولة دخول فاشلة...');

    try {
      // Get device info
      const deviceInfo = await security.getDeviceInfo();
      addResult(`📱 معلومات الجهاز: بصمة الجهاز مُستخرجة`);

      // Simulate failed login attempt
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'wrong_password_test',
          ...deviceInfo
        }),
      });

      const result = await response.json();
      addResult(`🚫 نتيجة محاولة الدخول: ${result.message}`);

      if (!response.ok) {
        addResult('✅ تم تسجيل محاولة الدخول الفاشلة');
        
        // Try to capture image after failed login
        const attempts = security.incrementAttempts();
        addResult(`🔢 عدد المحاولات: ${attempts}`);

        if (attempts === 1) {
          addResult('📸 بدء التقاط صورة أمنية تلقائية...');
          const image = await security.captureSecurityImage();
          
          if (image) {
            setLastImage(image);
            addResult('✅ تم التقاط صورة أمنية تلقائية');
          }
        }
      }
    } catch (error: any) {
      addResult(`❌ خطأ في اختبار محاولة الدخول: ${error.message}`);
      console.error('Failed login test error:', error);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setLastImage(null);
    security.resetAttempts();
    addResult('🧹 تم مسح النتائج وإعادة تعيين المحاولات');
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">اختبار نظام الأمان</h1>
          <p className="text-muted-foreground">اختبار التقاط الصور والأنظمة الأمنية</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              عناصر التحكم في الاختبار
            </CardTitle>
            <CardDescription>
              اختبار مكونات النظام الأمني المختلفة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">البريد الإلكتروني للاختبار</label>
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="أدخل البريد الإلكتروني"
                className="mb-3"
              />
            </div>

            <div className="space-y-2">
              <Button
                onClick={testCameraCapture}
                disabled={isCapturing}
                className="w-full"
              >
                <Camera className="h-4 w-4 ml-2" />
                {isCapturing ? 'جاري التقاط الصورة...' : 'اختبار التقاط الصورة'}
              </Button>

              <Button
                onClick={testFailedLogin}
                variant="outline"
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 ml-2" />
                اختبار محاولة دخول فاشلة
              </Button>

              <Button
                onClick={clearResults}
                variant="destructive"
                className="w-full"
              >
                مسح النتائج
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Captured Image */}
        <Card>
          <CardHeader>
            <CardTitle>آخر صورة مُلتقطة</CardTitle>
          </CardHeader>
          <CardContent>
            {lastImage ? (
              <div className="space-y-2">
                <img
                  src={lastImage}
                  alt="Security Capture"
                  className="w-full rounded-lg border"
                />
                <p className="text-sm text-muted-foreground">
                  تم التقاط الصورة بنجاح مع الطابع الزمني
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد صور مُلتقطة بعد
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            نتائج الاختبار
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {testResults.length > 0 ? (
              <div className="space-y-1 text-sm font-mono">
                {testResults.map((result, index) => (
                  <div key={index} className="text-right">
                    {result}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">
                لا توجد نتائج اختبار بعد. انقر على أحد أزرار الاختبار أعلاه.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>ملاحظة مهمة</AlertTitle>
        <AlertDescription>
          هذه الصفحة مخصصة للاختبار فقط. نظام التقاط الصور يحتاج إذن الوصول للكاميرا من المتصفح.
          تأكد من السماح بالوصول للكاميرا عندما يطلب المتصفح ذلك.
        </AlertDescription>
      </Alert>
    </div>
  );
}