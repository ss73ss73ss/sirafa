import { useQuery } from "@tanstack/react-query";

interface UnreadRoom {
  roomId: number;
  unreadCount: number;
}

interface UnreadPrivateChat {
  chatId: number;
  unreadCount: number;
}

interface UnreadGroupChat {
  groupId: number;
  unreadCount: number;
}

// استخدام مخصص لجلب عدد الرسائل غير المقروءة في الغرف العامة
export function useUnreadPublicMessages() {
  return useQuery<UnreadRoom[]>({
    queryKey: ["/api/chat/unread/public"],
    queryFn: async ({ queryKey }) => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return [];
        
        const response = await fetch(queryKey[0] as string, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          console.warn("غير مصرح بالوصول إلى عدد الرسائل غير المقروءة");
          return [];
        }
        
        if (!response.ok) {
          throw new Error("فشل في جلب عدد الرسائل غير المقروءة");
        }
        
        return await response.json();
      } catch (error) {
        console.error("خطأ في جلب عدد الرسائل غير المقروءة:", error);
        return [];
      }
    },
    refetchInterval: 10000, // إعادة الجلب كل 10 ثواني
    initialData: [],
  });
}

// استخدام مخصص لجلب عدد الرسائل غير المقروءة في المحادثات الخاصة
export function useUnreadPrivateMessages() {
  return useQuery<UnreadPrivateChat[]>({
    queryKey: ["/api/chat/unread/private"],
    queryFn: async ({ queryKey }) => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return [];
        
        const response = await fetch(queryKey[0] as string, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          console.warn("غير مصرح بالوصول إلى عدد الرسائل غير المقروءة الخاصة");
          return [];
        }
        
        if (!response.ok) {
          throw new Error("فشل في جلب عدد الرسائل غير المقروءة الخاصة");
        }
        
        return await response.json();
      } catch (error) {
        console.error("خطأ في جلب عدد الرسائل غير المقروءة الخاصة:", error);
        return [];
      }
    },
    refetchInterval: 10000, // إعادة الجلب كل 10 ثواني
    initialData: [],
  });
}

// استخدام مخصص لجلب عدد الرسائل غير المقروءة في مجموعات الدردشة
export function useUnreadGroupMessages() {
  return useQuery<UnreadGroupChat[]>({
    queryKey: ["/api/chat/unread/groups"],
    queryFn: async ({ queryKey }) => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return [];
        
        const response = await fetch(queryKey[0] as string, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          console.warn("غير مصرح بالوصول إلى عدد الرسائل غير المقروءة في المجموعات");
          return [];
        }
        
        if (!response.ok) {
          throw new Error("فشل في جلب عدد الرسائل غير المقروءة في المجموعات");
        }
        
        return await response.json();
      } catch (error) {
        console.error("خطأ في جلب عدد الرسائل غير المقروءة في المجموعات:", error);
        return [];
      }
    },
    refetchInterval: 10000, // إعادة الجلب كل 10 ثواني
    initialData: [],
  });
}

// دالة مساعدة للحصول على عدد الرسائل غير المقروءة في غرفة عامة محددة
export function getUnreadCountForPublicRoom(
  unreadCounts: UnreadRoom[] | undefined,
  roomId: number
): number {
  if (!unreadCounts || !Array.isArray(unreadCounts)) return 0;
  
  const roomData = unreadCounts.find(item => parseInt(item.roomId as any) === roomId);
  return roomData ? parseInt(roomData.unreadCount as any) : 0;
}

// دالة مساعدة للحصول على عدد الرسائل غير المقروءة في محادثة خاصة محددة
export function getUnreadCountForPrivateChat(
  unreadCounts: UnreadPrivateChat[] | undefined,
  chatId: number
): number {
  if (!unreadCounts || !Array.isArray(unreadCounts)) return 0;
  
  const chatData = unreadCounts.find(item => parseInt(item.chatId as any) === chatId);
  return chatData ? parseInt(chatData.unreadCount as any) : 0;
}

// دالة مساعدة للحصول على عدد الرسائل غير المقروءة في مجموعة محددة
export function getUnreadCountForGroupChat(
  unreadCounts: UnreadGroupChat[] | undefined,
  groupId: number
): number {
  if (!unreadCounts || !Array.isArray(unreadCounts)) return 0;
  
  const groupData = unreadCounts.find(item => parseInt(item.groupId as any) === groupId);
  return groupData ? parseInt(groupData.unreadCount as any) : 0;
}