import React from "react";
import { useUnreadPublicMessages, getUnreadCountForPublicRoom } from "@/hooks/use-unread-messages";
import { UnreadBadge } from "@/components/unread-badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Room {
  id: number;
  name: string;
  description: string | null;
}

interface ChatRoomsListProps {
  activeRoomId?: number;
  onSelectRoom: (roomId: number) => void;
}

export function ChatRoomsList({ activeRoomId, onSelectRoom }: ChatRoomsListProps) {
  // جلب قائمة الغرف العامة
  const { data: rooms, isLoading: isRoomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/chat/rooms"],
  });

  // جلب عدد الرسائل غير المقروءة
  const { data: unreadCounts } = useUnreadPublicMessages();

  // طلب تعيين الرسائل كمقروءة عند اختيار غرفة
  const markRoomAsReadMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await apiRequest(`/api/chat/mark-read/${roomId}`, "POST");
      return await response.json();
    },
    onSuccess: () => {
      // إعادة تحميل بيانات الرسائل غير المقروءة
      queryClient.invalidateQueries({ queryKey: ["/api/chat/unread/public"] });
    },
  });

  // التعامل مع اختيار غرفة
  const handleRoomSelect = (roomId: number) => {
    onSelectRoom(roomId);
    
    // تعيين الرسائل كمقروءة
    markRoomAsReadMutation.mutate(roomId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">الغرف المتاحة</CardTitle>
        <CardDescription>اختر غرفة للدردشة</CardDescription>
      </CardHeader>
      <CardContent>
        {isRoomsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div className="space-y-2">
            {rooms.map((room) => (
              <Button
                key={room.id}
                variant={activeRoomId === room.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleRoomSelect(room.id)}
              >
                <MessageSquare className="h-4 w-4 ml-2" />
                <span>{room.name}</span>
                <UnreadBadge count={getUnreadCountForPublicRoom(unreadCounts, room.id)} />
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-muted-foreground">لا توجد غرف متاحة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}