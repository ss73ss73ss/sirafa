import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type PushNotificationsContextType = {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
};

const PushNotificationsContext = createContext<PushNotificationsContextType | null>(null);

// VAPID keys - في الإنتاج يجب أن تكون مخفية في متغيرات البيئة
const VAPID_PUBLIC_KEY = 'BIOBQqLPWUKpu_E8ZEjqdDY4HyaJ5AeE2URlnHyam3ZSFe-BmodrswOM5-mCrwmQrAkIHOPkrubKcBWTBE2_Gr0';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // فحص دعم المتصفح للإشعارات
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async (): Promise<void> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('خطأ في فحص الاشتراك:', error);
    }
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('الإشعارات غير مدعومة في هذا المتصفح');
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    
    if (permission === 'granted') {
      toast({
        title: "تم منح الإذن",
        description: "سيتم إرسال الإشعارات إليك الآن",
      });
    } else if (permission === 'denied') {
      toast({
        title: "تم رفض الإذن",
        description: "لن تتلقى إشعارات الهاتف المحمول",
        variant: "destructive",
      });
    }

    return permission;
  };

  const subscribe = async (): Promise<void> => {
    if (!isSupported) {
      throw new Error('الإشعارات غير مدعومة في هذا المتصفح');
    }

    if (permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        throw new Error('تم رفض إذن الإشعارات');
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // إرسال الاشتراك إلى الخادم
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('فشل في حفظ الاشتراك على الخادم');
      }

      setIsSubscribed(true);
      toast({
        title: "تم تفعيل الإشعارات",
        description: "ستتلقى الآن إشعارات على هاتفك المحمول",
      });

    } catch (error: any) {
      console.error('خطأ في الاشتراك:', error);
      toast({
        title: "خطأ في تفعيل الإشعارات",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const unsubscribe = async (): Promise<void> => {
    if (!isSupported) {
      throw new Error('الإشعارات غير مدعومة في هذا المتصفح');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // إلغاء الاشتراك من المتصفح
        await subscription.unsubscribe();
        
        // إخبار الخادم بإلغاء الاشتراك
        const token = localStorage.getItem('auth_token');
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(subscription)
        });
      }

      setIsSubscribed(false);
      toast({
        title: "تم إلغاء الإشعارات",
        description: "لن تتلقى المزيد من الإشعارات على هاتفك",
      });

    } catch (error: any) {
      console.error('خطأ في إلغاء الاشتراك:', error);
      toast({
        title: "خطأ في إلغاء الإشعارات",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <PushNotificationsContext.Provider
      value={{
        isSupported,
        isSubscribed,
        permission,
        subscribe,
        unsubscribe,
        requestPermission,
      }}
    >
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  const context = useContext(PushNotificationsContext);
  if (!context) {
    throw new Error(
      "usePushNotifications must be used within a PushNotificationsProvider"
    );
  }
  return context;
}