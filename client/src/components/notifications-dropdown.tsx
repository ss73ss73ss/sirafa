import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, refetch } = useNotifications();
  
  // تحديث الإشعارات عند فتح القائمة المنسدلة
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  // تنسيق التاريخ بالعربية
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ar,
    });
  };

  // الحصول على الأيقونة المناسبة لنوع الإشعار
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
      case "error":
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
      case "warning":
        return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
      case "system":
        return <div className="h-2 w-2 rounded-full bg-blue-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="فتح الإشعارات"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between py-2 px-4">
          <div className="flex items-center gap-2">
            <div className="font-semibold">الإشعارات</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => refetch()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>تحديث الإشعارات</TooltipContent>
            </Tooltip>
          </div>
          {unreadCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => markAllAsRead()}
                >
                  <CheckCheck className="h-4 w-4 ml-1" />
                  تعليم الكل كمقروء
                </Button>
              </TooltipTrigger>
              <TooltipContent>تعليم جميع الإشعارات كمقروءة</TooltipContent>
            </Tooltip>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">
              جاري تحميل الإشعارات...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              لا توجد إشعارات
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start py-2 px-4 focus:bg-muted hover:bg-muted transition-colors",
                    !notification.isRead && "bg-muted/50"
                  )}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex w-full items-start gap-2">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between w-full">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            !notification.isRead && "font-bold"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}