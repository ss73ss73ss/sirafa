import React from "react";
import { useUnreadPublicMessages, getUnreadCountForPublicRoom } from "@/hooks/use-unread-messages";
import { UnreadBadge } from "@/components/unread-badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Room {
  id: number;
  name: string;
  description: string | null;
}

interface ChatListProps {
  activeRoomId?: number;
  onSelectRoom: (roomId: number) => void;
  compact?: boolean;
}

export function ChatListWithUnread({ activeRoomId, onSelectRoom, compact = false }: ChatListProps) {
  // جلب الغرفة العامة
  const { data: room, isLoading: isRoomLoading } = useQuery<Room>({
    queryKey: ['/api/chat/public-room'],
  });

  // جلب عدد الرسائل غير المقروءة
  const { data: unreadCounts } = useUnreadPublicMessages();

  if (compact) {
    // النسخة المصغرة للوضع المضغوط
    return (
      <div className="bg-background border rounded-lg p-2 shadow-sm">
        {isRoomLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : room ? (
          <Button
            variant={activeRoomId === room.id ? "default" : "outline"}
            size="sm"
            className="w-full justify-start h-8 text-sm"
            onClick={() => onSelectRoom(room.id)}
          >
            <MessageSquare className="h-3 w-3 ml-1" />
            <span className="truncate">{room.name}</span>
            <UnreadBadge count={getUnreadCountForPublicRoom(unreadCounts, room.id)} />
          </Button>
        ) : (
          <div className="text-center py-1">
            <p className="text-muted-foreground text-xs">لا توجد غرف</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="text-base font-semibold mb-3">الغرف المتاحة</h3>
        
        {isRoomLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : room ? (
          <Button
            variant={activeRoomId === room.id ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onSelectRoom(room.id)}
          >
            <MessageSquare className="h-4 w-4 ml-2" />
            <span>{room.name}</span>
            <UnreadBadge count={getUnreadCountForPublicRoom(unreadCounts, room.id)} />
          </Button>
        ) : (
          <div className="text-center py-2">
            <p className="text-muted-foreground text-sm">لا توجد غرف متاحة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}