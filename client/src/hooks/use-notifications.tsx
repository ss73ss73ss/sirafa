import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserNotification } from "@shared/schema";

type NotificationsContextType = {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  refetch: () => void;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // جلب الإشعارات
  const {
    data: notifications = [],
    error,
    isLoading,
    refetch,
  } = useQuery<UserNotification[], Error>({
    queryKey: ["/api/notifications"],
    refetchInterval: 10000, // إعادة الطلب كل 10 ثوانٍ للحصول على الإشعارات الجديدة
    staleTime: 0, // اعتبار البيانات قديمة فوراً للحصول على أحدث الإشعارات
  });

  // حساب عدد الإشعارات غير المقروءة
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // تعليم إشعار واحد كمقروء
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/notifications/${notificationId}/read`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // تعليم جميع الإشعارات كمقروءة
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/notifications/read-all", "POST");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "تم تعليم جميع الإشعارات كمقروءة",
        description: "تم تعليم جميع الإشعارات كمقروءة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        refetch,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}