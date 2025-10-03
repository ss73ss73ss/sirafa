import { useEffect } from "react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Bell, Check, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserNotification } from "@shared/schema";

export default function NotificationsMobilePage() {
  const { notifications, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [location, setLocation] = useLocation();

  // تنسيق التاريخ بالعربية
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ar,
    });
  };

  // إظهار لون حسب نوع الإشعار
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

  // تمييز الإشعارات كمقروءة عند الضغط عليها
  const handleNotificationClick = (notification: UserNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  return (
    <>
      <Helmet>
        <title>الإشعارات | منصة الصرافة</title>
        <meta name="description" content="عرض كافة الإشعارات والتنبيهات الخاصة بحسابك" />
      </Helmet>

      <div className="p-4">
        {/* رأس الصفحة */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">الإشعارات</h1>
          </div>
          {notifications.some(n => !n.isRead) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => markAllAsRead()}
            >
              <Check className="h-4 w-4 ml-1" />
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        <Separator className="mb-4" />

        {/* قائمة الإشعارات */}
        {isLoading ? (
          // حالة التحميل
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                <Skeleton className="h-2 w-2 rounded-full mt-2" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          // حالة عدم وجود إشعارات
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h2 className="text-lg font-semibold">لا توجد لديك إشعارات</h2>
            <p className="text-sm text-muted-foreground mt-2">
              ستظهر هنا الإشعارات المتعلقة بحسابك والعمليات التي تقوم بها
            </p>
          </div>
        ) : (
          // قائمة الإشعارات
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={cn(
                  "flex gap-3 p-3 rounded-lg border transition-colors",
                  !notification.isRead && "bg-muted/50 border-primary/20"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 mt-1.5">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    getNotificationColor(notification.type)
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "text-sm font-medium",
                    !notification.isRead && "font-bold"
                  )}>
                    {notification.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}