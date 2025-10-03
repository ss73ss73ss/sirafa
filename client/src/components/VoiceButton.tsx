import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, Send } from "lucide-react";
import { WhatsAppVoiceRecorder } from "./WhatsAppVoiceRecorder";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface VoiceButtonProps {
  roomId?: number;
  privateRoomId?: number;
  messageId?: number;
  privateMessageId?: number;
  onVoiceSent?: (voiceId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceButton({
  roomId,
  privateRoomId,
  messageId,
  privateMessageId,
  onVoiceSent,
  disabled = false,
  className
}: VoiceButtonProps) {
  const [showRecorder, setShowRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadVoiceMutation = useMutation({
    mutationFn: async ({ audioBlob, duration }: { audioBlob: Blob; duration: number }) => {
      const formData = new FormData();
      formData.append('voice', audioBlob, 'voice-message.webm');
      formData.append('durationSeconds', duration.toString());
      
      if (roomId) formData.append('roomId', roomId.toString());
      if (privateRoomId) formData.append('privateRoomId', privateRoomId.toString());
      if (messageId) formData.append('messageId', messageId.toString());
      if (privateMessageId) formData.append('privateMessageId', privateMessageId.toString());

      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/voice/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في رفع الرسالة الصوتية');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرسالة الصوتية بنجاح",
      });
      
      setShowRecorder(false);
      setIsUploading(false);
      
      // إشعار المكون الأب
      if (onVoiceSent) {
        onVoiceSent(data.voiceId);
      }
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/private/messages'] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الإرسال",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number) => {
    setIsUploading(true);
    uploadVoiceMutation.mutate({ audioBlob, duration });
  };

  const handleCancel = () => {
    setShowRecorder(false);
    setIsUploading(false);
  };

  return (
    <>
      <Button
        onClick={() => setShowRecorder(true)}
        disabled={disabled || isUploading}
        variant="ghost"
        size="sm"
        className={className}
      >
        <Mic className="h-4 w-4" />
      </Button>

      <Dialog open={showRecorder} onOpenChange={setShowRecorder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              تسجيل رسالة صوتية
            </DialogTitle>
          </DialogHeader>
          
          <WhatsAppVoiceRecorder
            onVoiceRecorded={handleVoiceRecorded}
            onCancel={handleCancel}
            maxDuration={120}
            className="border-0"
          />
          
          {isUploading && (
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                جاري رفع الرسالة الصوتية...
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}