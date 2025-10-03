import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Check, Bell, Info, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserNotification } from "@shared/schema";

interface NotificationItemProps {
  notification: UserNotification;
  onMarkAsRead?: (id: number) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // تنسيق التاريخ بالعربية
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ar,
    });
  };

  // الحصول على لون الإشعار حسب النوع
  const getBackgroundColor = (type: string, isRead: boolean) => {
    if (isRead) return "#f3f4f6"; // لون رمادي فاتح للإشعارات المقروءة
    
    switch (type) {
      case "success": 
        return "#dff0d8"; // لون أخضر فاتح
      case "error": 
        return "#f8d7da"; // لون أحمر فاتح
      case "warning": 
        return "#fff3cd"; // لون أصفر فاتح
      case "info":
      default: 
        return "#d1ecf1"; // لون أزرق فاتح
    }
  };

  // الحصول على أيقونة الإشعار حسب النوع
  const getIcon = (type: string) => {
    switch (type) {
      case "success": 
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error": 
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "warning": 
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "info":
      default: 
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div 
      className="relative p-4 transition-all duration-200 hover:bg-gray-50"
      style={{ 
        background: getBackgroundColor(notification.type, notification.isRead),
        borderRight: `4px solid ${notification.isRead ? "#e5e7eb" : getBackgroundColor(notification.type, false)}`,
        opacity: notification.isRead ? 0.8 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className={cn(
              "text-base font-medium", 
              notification.isRead ? "text-gray-600" : "text-gray-900"
            )}>
              {notification.title}
            </h3>
            <span className="text-xs text-gray-500 mt-1 mr-2">
              {formatDate(notification.createdAt)}
            </span>
          </div>
          <p className={cn(
            "text-sm my-1", 
            notification.isRead ? "text-gray-500" : "text-gray-700"
          )}>
            {notification.body}
          </p>
        </div>
      </div>
      
      {!notification.isRead && onMarkAsRead && isHovered && (
        <Button
          size="sm"
          variant="outline"
          className="absolute top-2 left-2 opacity-70 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
        >
          <Check className="h-3 w-3 mr-1" />
          <span className="text-xs">تعليم كمقروء</span>
        </Button>
      )}
    </div>
  );
}