import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Bell, CheckSquare, BellOff, RefreshCw, Check } from "lucide-react";
import { Helmet } from "react-helmet";
import { useNotifications } from "@/hooks/use-notifications";
import { Guard } from "@/components/Guard";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NotificationItem } from "@/components/notification-item";

export default function NotificationsPage() {
  return (
    <Guard page="notifications">
      <NotificationsContent />
    </Guard>
  );
}

function NotificationsContent() {
  const { notifications, markAsRead, markAllAsRead, isLoading, refetch } = useNotifications();
  const { toast } = useToast();

  // تنسيق التاريخ بالعربية
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ar,
    });
  };

  // تصنيف الإشعارات حسب التاريخ (اليوم، هذا الأسبوع، سابقاً)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  const todayNotifications = notifications.filter(
    (n) => new Date(n.createdAt) >= today
  );
  
  const thisWeekNotifications = notifications.filter(
    (n) => 
      new Date(n.createdAt) < today && 
      new Date(n.createdAt) >= oneWeekAgo
  );
  
  const olderNotifications = notifications.filter(
    (n) => new Date(n.createdAt) < oneWeekAgo
  );

  // الحصول على لون الإشعار حسب النوع
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "system":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // عنصر الإشعار
  const NotificationItem = ({ notification }: { notification: any }) => (
    <div 
      className={cn(
        "flex items-start gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg transition-colors",
        !notification.isRead && "bg-muted/50"
      )}
    >
      <div className="flex-shrink-0 mt-1">
        <div className={cn("h-1.5 w-1.5 sm:h-3 sm:w-3 rounded-full", getNotificationColor(notification.type))} />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn(
            "text-xs sm:text-base font-semibold",
            !notification.isRead && "font-bold"
          )}>
            {notification.title}
          </h3>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1 sm:h-8 sm:px-2 text-xs flex-shrink-0"
              onClick={() => markAsRead(notification.id)}
            >
              <Check className="h-2 w-2 sm:h-4 sm:w-4 ml-0.5" />
              <span className="hidden sm:inline">تعليم كمقروء</span>
              <span className="sm:hidden">تعليم</span>
            </Button>
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{notification.body}</p>
        <div className="text-xs text-muted-foreground mt-1">
          {formatDate(notification.createdAt)}
        </div>
      </div>
    </div>
  );

  // قائمة إشعارات مع عنوان
  const NotificationSection = ({ title, notifications, empty }: { title: string; notifications: any[]; empty: string }) => {
    if (notifications.length === 0) return null;
    
    return (
      <div className="mb-2 sm:mb-8">
        <h2 className="text-xs sm:text-lg font-semibold mb-1 sm:mb-2">{title}</h2>
        <Card>
          {notifications.length === 0 ? (
            <div className="p-3 sm:p-4 text-center text-muted-foreground text-xs sm:text-sm">{empty}</div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>الإشعارات | منصة الصرافة</title>
        <meta name="description" content="عرض كافة الإشعارات والتنبيهات الخاصة بحسابك" />
      </Helmet>
      
      <div className="golden-page-bg container mx-auto px-2 sm:px-6 py-2 sm:py-6 min-h-screen">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-6 gap-2 sm:gap-3">
          <BackToDashboardButton className="self-start" />
          <div className="flex items-center gap-1 sm:gap-2 mx-auto sm:mx-0">
            <Bell className="h-3 w-3 sm:h-5 sm:w-5" />
            <h1 className="text-sm sm:text-2xl font-bold">الإشعارات</h1>
          </div>
          <div className="flex gap-1 sm:gap-2 self-end sm:self-auto">
            <Button onClick={() => refetch()} variant="outline" size="sm" className="h-6 w-6 sm:h-10 sm:w-10" title="تحديث الإشعارات">
              <RefreshCw className="h-2 w-2 sm:h-4 sm:w-4" />
            </Button>
            {notifications.some(n => !n.isRead) && (
              <Button onClick={() => markAllAsRead()} className="text-xs sm:text-sm h-6 sm:h-10 px-1 sm:px-4">
                <CheckSquare className="h-2 w-2 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                <span className="hidden sm:inline">تعليم الكل كمقروء</span>
                <span className="sm:hidden">تعليم الكل</span>
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 sm:space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-2 sm:p-4">
                <div className="flex gap-2 sm:gap-4">
                  <Skeleton className="h-1.5 w-1.5 sm:h-3 sm:w-3 rounded-full" />
                  <div className="flex-1 space-y-1 sm:space-y-2">
                    <Skeleton className="h-3 sm:h-5 w-1/3" />
                    <Skeleton className="h-2 sm:h-4 w-full" />
                    <Skeleton className="h-2 sm:h-3 w-1/4 mt-1 sm:mt-2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-3 sm:p-8 text-center">
            <Bell className="h-6 w-6 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-muted-foreground" />
            <h2 className="text-sm sm:text-xl font-semibold mb-1 sm:mb-2">لا توجد لديك أي إشعارات</h2>
            <p className="text-muted-foreground mb-3 sm:mb-6 text-xs sm:text-sm">ستظهر هنا الإشعارات المتعلقة بحسابك والعمليات التي تقوم بها</p>
            <Button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/test/create-notification', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  const data = await res.json();
                  if (res.ok) {
                    refetch();
                    toast({
                      title: "تم إنشاء إشعار تجريبي",
                      description: "يرجى التحقق من قائمة الإشعارات الخاصة بك",
                      variant: "default"
                    });
                  } else {
                    toast({
                      title: "فشل في إنشاء إشعار",
                      description: data.message || "حدث خطأ أثناء إنشاء الإشعار التجريبي",
                      variant: "destructive"
                    });
                  }
                } catch (error) {
                  console.error("Error creating test notification:", error);
                  toast({
                    title: "فشل في إنشاء إشعار",
                    description: "حدث خطأ أثناء إنشاء الإشعار التجريبي",
                    variant: "destructive"
                  });
                }
              }}
              className="bg-primary text-white hover:bg-primary/90 text-xs sm:text-sm h-6 sm:h-10 px-2 sm:px-4"
            >
              إنشاء إشعار تجريبي
            </Button>
          </Card>
        ) : (
          <>
            <NotificationSection 
              title="اليوم" 
              notifications={todayNotifications}
              empty="لا توجد إشعارات اليوم"
            />
            
            <NotificationSection 
              title="هذا الأسبوع" 
              notifications={thisWeekNotifications}
              empty="لا توجد إشعارات هذا الأسبوع"
            />
            
            <NotificationSection 
              title="سابقاً" 
              notifications={olderNotifications}
              empty="لا توجد إشعارات سابقة"
            />
          </>
        )}
      </div>
    </>
  );
}