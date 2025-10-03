import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Smartphone, AlertCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function PushNotificationsSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
  } = usePushNotifications();

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await subscribe();
    } catch (error: any) {
      toast({
        title: "خطأ في تفعيل الإشعارات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribe();
    } catch (error: any) {
      toast({
        title: "خطأ في إلغاء الإشعارات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("/api/notifications/test", "POST");
      if (response.ok) {
        toast({
          title: "تم إرسال الإشعار التجريبي",
          description: "تحقق من إشعارات هاتفك",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال الإشعار التجريبي",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500">مُسموح</Badge>;
      case 'denied':
        return <Badge variant="destructive">مرفوض</Badge>;
      default:
        return <Badge variant="secondary">غير محدد</Badge>;
    }
  };

  const getSubscriptionBadge = () => {
    if (isSubscribed) {
      return <Badge variant="default" className="bg-blue-500">مُفعّل</Badge>;
    }
    return <Badge variant="outline">غير مُفعّل</Badge>;
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            إشعارات الهاتف المحمول
          </CardTitle>
          <CardDescription>
            إعدادات الإشعارات المحمولة للمنصة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              متصفحك لا يدعم إشعارات الهاتف المحمول
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          إشعارات الهاتف المحمول
        </CardTitle>
        <CardDescription>
          احصل على إشعارات فورية على هاتفك المحمول عند وصول رسائل أو إشعارات جديدة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* معلومات الحالة */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">حالة الإذن</div>
            {getPermissionBadge()}
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">حالة الاشتراك</div>
            {getSubscriptionBadge()}
          </div>
        </div>

        {/* الأزرار */}
        <div className="space-y-2">
          {permission === 'default' && (
            <Button
              onClick={requestPermission}
              disabled={isLoading}
              className="w-full"
            >
              <Smartphone className="h-4 w-4 ml-2" />
              طلب إذن الإشعارات
            </Button>
          )}

          {permission === 'granted' && !isSubscribed && (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full"
            >
              <Bell className="h-4 w-4 ml-2" />
              تفعيل الإشعارات المحمولة
            </Button>
          )}

          {permission === 'granted' && isSubscribed && (
            <>
              <Button
                onClick={handleUnsubscribe}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <BellOff className="h-4 w-4 ml-2" />
                إلغاء الإشعارات المحمولة
              </Button>

              <Button
                onClick={handleTestNotification}
                disabled={isLoading}
                variant="secondary"
                className="w-full"
              >
                <Smartphone className="h-4 w-4 ml-2" />
                اختبار إشعار تجريبي
              </Button>
            </>
          )}

          {permission === 'denied' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                تم رفض إذن الإشعارات. يمكنك تفعيلها من إعدادات المتصفح:
              </p>
              <ul className="text-xs text-red-600 mt-2 list-disc list-inside">
                <li>انقر على أيقونة القفل بجانب عنوان الموقع</li>
                <li>اختر "السماح" للإشعارات</li>
                <li>أعد تحميل الصفحة</li>
              </ul>
            </div>
          )}
        </div>

        {/* معلومات إضافية */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <p>• ستصل الإشعارات حتى لو كان التطبيق مغلقاً</p>
          <p>• يمكنك إلغاء الاشتراك في أي وقت</p>
          <p>• الإشعارات آمنة ومشفرة</p>
        </div>
      </CardContent>
    </Card>
  );
}