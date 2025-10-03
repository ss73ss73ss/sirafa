import { useEffect, useState, useRef, FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePageRestriction } from "@/hooks/use-access-control";
import { Link } from "wouter";
import { Guard } from "@/components/Guard";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, MessageSquare, Send, MessageCircle, Smile, Paperclip, Image, File, CheckSquare, Square, Trash2, X, Mic, ChevronDown, ChevronUp, Users, Heart, Edit3, MoreHorizontal, Copy, Share, Info, Flag, Star } from "lucide-react";
import { useOrientationMode } from "@/hooks/useOrientationMode";
import { VoiceButton } from "@/components/VoiceButton";
import { VoiceMessage } from "@/components/VoiceMessage";
import { WhatsAppVoiceRecorder } from "@/components/WhatsAppVoiceRecorder";
import { useToast } from "@/hooks/use-toast";
import io, { Socket } from "socket.io-client";
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChatListWithUnread } from "@/components/chat/chat-list-with-unread";
import { EmojiReactionPicker } from "@/components/EmojiReactionPicker";

// تحديد واجهة الرسالة
interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  createdAt: string;
  senderName: string;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedBy?: number;
  deletedAt?: string;
  fileUrl?: string | null;
  fileType?: string | null;
  voiceId?: string | null;
  voiceDuration?: number | null;
  likesCount?: number;
  likedByMe?: boolean;
}

// تحديد واجهة غرفة الدردشة
interface ChatRoom {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAndroidAppMode } = useOrientationMode();

  // فحص القيود للصفحة
  const { data: restrictionData, isLoading: isCheckingRestriction } = usePageRestriction('chats');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{fileUrl: string, fileType: string} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [usersTyping, setUsersTyping] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [isUsersListOpen, setIsUsersListOpen] = useState(!isAndroidAppMode);
  const [showInlineVoiceRecorder, setShowInlineVoiceRecorder] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [showEmojiReaction, setShowEmojiReaction] = useState<number | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // إضافة معالج النقر خارج منتقي الرموز التعبيرية وقائمة المزيد
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiReaction !== null) {
        setShowEmojiReaction(null);
      }
      if (showMoreOptions !== null) {
        setShowMoreOptions(null);
      }
    };

    if (showEmojiReaction !== null || showMoreOptions !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiReaction, showMoreOptions]);

  
  // جلب الغرفة العامة
  const { data: publicRoom } = useQuery<ChatRoom>({
    queryKey: ['/api/chat/public-room'],
  });

  // جلب الرسائل الأولية
  const { data: initialMessages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/messages'],
  });

  // جلب المستخدمين المتاحين
  const { data: availableUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users/available'],
  });

  // تعديل رسالة
  const startEditing = (message: ChatMessage) => {
    if (message.senderId !== user?.id) return; // لا يمكن تعديل رسائل الآخرين
    
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  // إلغاء التعديل
  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  // دوال خيارات المزيد
  const copyMessageText = (message: ChatMessage) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content).then(() => {
        toast({
          title: "✅ تم النسخ",
          description: "تم نسخ نص الرسالة إلى الحافظة",
        });
      }).catch(() => {
        toast({
          title: "❌ خطأ",
          description: "لم يتمكن من نسخ النص",
          variant: "destructive",
        });
      });
    } else {
      // fallback للمتصفحات القديمة
      const textArea = document.createElement("textarea");
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          title: "✅ تم النسخ",
          description: "تم نسخ نص الرسالة إلى الحافظة",
        });
      } catch (err) {
        toast({
          title: "❌ خطأ",
          description: "لم يتمكن من نسخ النص",
          variant: "destructive",
        });
      }
      document.body.removeChild(textArea);
    }
    setShowMoreOptions(null);
  };

  const forwardMessage = (message: ChatMessage) => {
    // إضافة النص إلى مربع الإدخال مع علامة "إعادة توجيه"
    const forwardText = `🔄 إعادة توجيه من ${message.senderName}:\n${message.content}`;
    setInputMessage(forwardText);
    setShowMoreOptions(null);
    toast({
      title: "📨 إعادة توجيه",
      description: "تم إضافة الرسالة لمربع الإدخال",
    });
  };

  const showMessageInfo = (message: ChatMessage) => {
    const messageDate = new Date(message.createdAt);
    const formattedDate = messageDate.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    let infoText = `📋 معلومات الرسالة:\n`;
    infoText += `👤 المرسل: ${message.senderName}\n`;
    infoText += `📅 التاريخ: ${formattedDate}\n`;
    infoText += `🆔 رقم الرسالة: ${message.id}\n`;
    
    if (message.isEdited) {
      const editedDate = new Date(message.editedAt || '').toLocaleString('ar-EG');
      infoText += `✏️ تم التعديل: ${editedDate}\n`;
    }
    
    if (message.fileUrl) {
      infoText += `📎 يحتوي على مرفق: ${message.fileType}\n`;
    }
    
    if (message.voiceId) {
      infoText += `🎤 رسالة صوتية: ${message.voiceDuration}s\n`;
    }
    
    if (message.likesCount && message.likesCount > 0) {
      infoText += `❤️ عدد الإعجابات: ${message.likesCount}\n`;
    }

    alert(infoText);
    setShowMoreOptions(null);
  };

  const reportMessage = (message: ChatMessage) => {
    const confirmed = window.confirm(`هل تريد الإبلاغ عن هذه الرسالة من ${message.senderName}؟\n\nسيتم إرسال تقرير للإدارة.`);
    if (confirmed) {
      // يمكن إضافة API call هنا للإبلاغ
      toast({
        title: "🚨 تم الإبلاغ",
        description: "تم إرسال بلاغك للإدارة، سيتم المراجعة قريباً",
      });
      console.log('تم الإبلاغ عن الرسالة:', message.id, 'من المستخدم:', message.senderName);
    }
    setShowMoreOptions(null);
  };

  const addToFavorites = (message: ChatMessage) => {
    // حفظ في localStorage مؤقتاً
    const favorites = JSON.parse(localStorage.getItem('favoriteMessages') || '[]');
    const messageData = {
      id: message.id,
      content: message.content,
      senderName: message.senderName,
      createdAt: message.createdAt,
      roomId: message.roomId
    };
    
    if (!favorites.find((fav: any) => fav.id === message.id)) {
      favorites.push(messageData);
      localStorage.setItem('favoriteMessages', JSON.stringify(favorites));
      toast({
        title: "⭐ تمت الإضافة",
        description: "تم إضافة الرسالة للمفضلة",
      });
    } else {
      toast({
        title: "ℹ️ معلومة",
        description: "الرسالة موجودة بالفعل في المفضلة",
      });
    }
    setShowMoreOptions(null);
  };

  // وظائف اختيار الرسائل للحذف المتعدد
  const toggleMessageSelection = (messageId: number) => {
    console.log("تبديل اختيار الرسالة (عامة):", messageId);
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
        console.log("تم إلغاء اختيار الرسالة (عامة):", messageId);
      } else {
        newSet.add(messageId);
        console.log("تم اختيار الرسالة (عامة):", messageId);
      }
      console.log("الرسائل المختارة حالياً (عامة):", Array.from(newSet));
      return newSet;
    });
  };

  const selectAllMessages = () => {
    // يمكن اختيار جميع الرسائل (المرسلة والمستقبلة)
    console.log("جميع الرسائل المتاحة للاختيار (عامة):", messages.length, messages.map(m => ({id: m.id, content: m.content.substring(0, 20), createdAt: m.createdAt, senderId: m.senderId})));
    const allMessageIds = new Set(messages.map(msg => msg.id));
    console.log("تحديد جميع الرسائل (عامة):", Array.from(allMessageIds));
    setSelectedMessages(allMessageIds);
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
    setIsSelectionMode(false);
  };

  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0 || !user?.id || !publicRoom?.id) return;
    
    const confirmed = window.confirm(`هل أنت متأكد من حذف ${selectedMessages.size} رسالة؟ سيتم حذفها نهائياً للجميع.`);
    if (!confirmed) return;
    
    try {
      const messageIds = Array.from(selectedMessages);
      
      for (const messageId of messageIds) {
        const response = await apiRequest(`/api/chat/messages/${messageId}`, "DELETE");
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("خطأ في حذف الرسالة:", errorData);
          throw new Error(errorData.message || "فشل حذف إحدى الرسائل");
        }
      }
      
      // إزالة الرسائل من الواجهة
      setMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
      clearSelection();
      
      toast({
        title: "تم حذف الرسائل",
        description: `تم حذف ${messageIds.length} رسالة`,
      });
      
    } catch (error) {
      console.error("خطأ في حذف الرسائل:", error);
      toast({
        title: "فشل حذف الرسائل",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حذف الرسائل",
        variant: "destructive",
      });
    }
  };

  // حفظ التعديل
  const saveEdit = async () => {
    if (!editingMessageId || !publicRoom || !user || !editContent.trim()) return;
    
    try {
      const response = await apiRequest(`/api/chat/messages/${editingMessageId}`, "PUT", {
        content: editContent,
        roomId: publicRoom.id,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في تحديث الرسالة');
      }
      
      const updatedMessage = await response.json();
      
      // تحديث الرسالة في الحالة المحلية
      setMessages(prevMessages => 
        prevMessages.map(message => 
          message.id === editingMessageId ? updatedMessage : message
        )
      );
      
      // إعادة تعيين حالة التعديل
      setEditingMessageId(null);
      setEditContent("");
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث الرسالة بنجاح",
      });
    } catch (error: any) {
      let errorMessage = "فشل في تحديث الرسالة";
      
      // التحقق من نوع الخطأ لإعطاء رسالة مناسبة
      if (error?.message?.includes("انتهى وقت التعديل") || error?.message?.includes("edit time")) {
        errorMessage = "⏰ انتهى الوقت المسموح للتعديل (5 دقائق). لا يمكن تعديل الرسائل القديمة.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // إعادة تعيين حالة التعديل في حالة الخطأ
      setEditingMessageId(null);
      setEditContent("");
      
      toast({
        title: "خطأ في التعديل",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // حذف رسالة
  const deleteMessage = async (messageId: number) => {
    if (!publicRoom || !user) return;
    
    console.log('🗑️ محاولة حذف الرسالة رقم:', messageId);
    
    // تأكيد الحذف
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه الرسالة؟ سيتم حذفها نهائياً.');
    if (!confirmed) {
      console.log('❌ تم إلغاء الحذف من قبل المستخدم');
      return;
    }
    
    try {
      console.log('📡 إرسال طلب الحذف للخادم...');
      const response = await apiRequest(`/api/chat/messages/${messageId}`, "DELETE");
      
      if (response.ok) {
        console.log('✅ تم حذف الرسالة بنجاح من الخادم');
        
        // إزالة الرسالة من القائمة محلياً
        setMessages(prevMessages => 
          prevMessages.filter(message => message.id !== messageId)
        );
        
        toast({
          title: "✅ تم الحذف",
          description: "تم حذف الرسالة بنجاح",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في حذف الرسالة');
      }
    } catch (error) {
      console.error("❌ خطأ في حذف الرسالة:", error);
      toast({
        title: "❌ خطأ في الحذف",
        description: error instanceof Error ? error.message : "فشل في حذف الرسالة",
        variant: "destructive",
      });
    }
  };

  // دالة التعامل مع إرسال الرسائل الصوتية المباشرة
  const handleInlineVoiceRecorded = async (audioBlob: Blob, duration: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: "خطأ في المصادقة",
          description: "يرجى تسجيل الدخول مرة أخرى",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('voice', audioBlob, 'voice-message.ogg');
      formData.append('durationSeconds', duration.toString());
      formData.append('roomId', publicRoom?.id?.toString() || '');

      const response = await fetch('/api/voice/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('فشل في رفع الرسالة الصوتية');
      }

      const result = await response.json();
      console.log('تم رفع الرسالة الصوتية بنجاح:', result);
      
      setShowInlineVoiceRecorder(false);
      
      toast({
        title: "نجح الإرسال",
        description: "تم إرسال الرسالة الصوتية بنجاح",
      });

    } catch (error) {
      console.error('خطأ في رفع الرسالة الصوتية:', error);
      toast({
        title: "خطأ في الإرسال",
        description: "فشل في إرسال الرسالة الصوتية",
        variant: "destructive",
      });
    }
  };

  // تمرير للأسفل عند استلام رسائل جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // إغلاق قائمة أزرار التفاعل عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // إغلاق القائمة إذا تم النقر خارج الرسالة وخارج قائمة الأزرار
      if (!target.closest('.msg') && !target.closest('[data-reaction-menu]')) {
        setSelectedMessageId(null);
      }
    };

    if (selectedMessageId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [selectedMessageId]);

  // إتصال بخادم الويب سوكيت
  useEffect(() => {
    if (!user) return;
    
    // تحديد البروتوكول بناءً على بروتوكول الصفحة
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;
    
    // إنشاء اتصال Socket.IO مع المعلومات الكاملة
    const newSocket = io(wsUrl, {
      path: '/socket.io',
      auth: {
        token: localStorage.getItem('auth_token')
      },
      transports: ['websocket']
    });
    
    setSocket(newSocket);
    
    // استماع إلى الأحداث
    newSocket.on('connect', () => {
      console.log('تم الاتصال بخادم الويب سوكيت');
    });
    
    newSocket.on('newMessage', (message: ChatMessage) => {
      // إضافة الرسالة الجديدة في نهاية المصفوفة (الأسفل)
      setMessages(prevMessages => [...prevMessages, message]);
      
      // إعادة تحميل بيانات الرسائل غير المقروءة
      queryClient.invalidateQueries({ queryKey: ["/api/chat/unread/public"] });
      
      // التمرير لأسفل لرؤية الرسالة الجديدة
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
    
    newSocket.on('messageUpdated', (updatedMessage: ChatMessage) => {
      setMessages(prevMessages => 
        prevMessages.map(message => 
          message.id === updatedMessage.id ? updatedMessage : message
        )
      );
    });
    
    newSocket.on('messageDeleted', (deletedInfo: { id: number; roomId: number; deletedBy: number }) => {
      setMessages(prevMessages => 
        prevMessages.filter(message => message.id !== deletedInfo.id)
      );
    });
    
    newSocket.on('userTyping', (data: { userName: string; roomType: string; roomId: number }) => {
      if (data.roomType === 'room' && room?.id === data.roomId && data.userName) {
        setUsersTyping(prev => {
          if (!prev.includes(data.userName)) {
            return [...prev, data.userName];
          }
          return prev;
        });
      }
    });
    
    newSocket.on('userStopTyping', (data: { userName: string; roomType: string; roomId: number }) => {
      if (data.roomType === 'room' && room?.id === data.roomId && data.userName) {
        setUsersTyping(prev => prev.filter(name => name !== data.userName));
      }
    });

    // معالج تحديث الإعجابات والتفاعلات
    newSocket.on('messageLikeUpdate', (data: { messageId: number; liked: boolean; count: number; userId: number; userName: string }) => {
      console.log('تحديث إعجاب:', data);
      
      // تحديث الرسالة بحالة الإعجاب الجديدة
      setMessages(prevMessages => 
        prevMessages.map(message => {
          if (message.id === data.messageId) {
            return {
              ...message,
              likesCount: data.count,
              likedByMe: data.userId === user?.id ? data.liked : (message.likedByMe || false)
            };
          }
          return message;
        })
      );
      
      // عرض إشعار للتفاعل الجديد (للآخرين فقط)
      if (data.userId !== user?.id) {
        toast({
          title: data.liked ? "❤️ إعجاب جديد" : "💔 تم إلغاء الإعجاب",
          description: `${data.userName} ${data.liked ? 'أعجب' : 'ألغى إعجابه'} برسالة`,
          duration: 3000,
        });
      }
    });
    
    // تنظيف عند إلغاء التركيب
    return () => {
      newSocket.disconnect();
    };
  }, [user]);
  
  // تحديث الغرفة عند جلب البيانات
  useEffect(() => {
    if (publicRoom && publicRoom.id) {
      setRoom(publicRoom);
      setActiveRoomId(publicRoom.id);
    }
  }, [publicRoom]);
  
  // تحديث الرسائل عند جلب البيانات الأولية
  useEffect(() => {
    if (initialMessages && Array.isArray(initialMessages)) {
      // ترتيب الرسائل تصاعديا حسب وقت الإنشاء (القديم للجديد)
      const sortedMessages = [...initialMessages].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;  // ترتيب تصاعدي من الأقدم (فوق) إلى الأحدث (تحت)
      });
      setMessages(sortedMessages);
    }
  }, [initialMessages]);
  
  // الانضمام إلى غرفة بعد اتصال الويب سوكيت
  useEffect(() => {
    if (!socket || !user || !room) return;
    
    // الانضمام إلى الغرفة
    socket.emit('joinRoom', { roomId: room.id, roomType: 'room' });
    
    // تعيين الرسائل كمقروءة
    if (room.id) {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      fetch(`/api/chat/mark-read/${room.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // إرسال جسم فارغ للطلب
      }).then(response => {
        if (response.ok) {
          // إعادة تحميل بيانات الرسائل غير المقروءة
          queryClient.invalidateQueries({ queryKey: ["/api/chat/unread/public"] });
          console.log("تم تعيين الرسائل كمقروءة بنجاح للغرفة:", room.id);
        } else {
          console.warn("لم يتم تعيين الرسائل كمقروءة، رمز الحالة:", response.status);
        }
      }).catch(err => {
        console.error("خطأ في تعيين الرسائل كمقروءة:", err);
      });
    }
  }, [socket, user, room]);
  
  // معالجة الكتابة
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    
    if (socket && user && room) {
      // إرسال حدث الكتابة مع معلومات المستخدم
      socket.emit('typing', { 
        roomId: room.id, 
        roomType: 'room',
        userId: user.id,
        userName: user.fullName
      });
      
      // إلغاء المؤقت السابق إن وجد
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // إنشاء مؤقت جديد
      const timeout = setTimeout(() => {
        socket.emit('stopTyping', { 
          roomId: room.id, 
          roomType: 'room',
          userId: user.id,
          userName: user.fullName
        });
      }, 1000);
      
      setTypingTimeout(timeout);
    }
  };
  
  // معالجة تحميل الملفات
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // عرض رسالة تحميل الملف
    toast({
      title: "جاري تحميل الملف",
      description: "يرجى الانتظار...",
    });
    
    try {
      setIsUploading(true);
      
      // إنشاء نموذج FormData لإرسال الملف
      const formData = new FormData();
      formData.append('file', file);
      
      // إرسال الملف إلى السيرفر
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحميل الملف');
      }
      
      const data = await response.json();
      
      // تخزين معلومات الملف المحمل
      setUploadedFileInfo({
        fileUrl: data.fileUrl,
        fileType: data.fileType
      });
      
      // عرض رسالة نجاح
      toast({
        title: "تم تحميل الملف بنجاح",
        description: "يمكنك الآن إرسال رسالتك مع الملف المرفق",
      });
      
    } catch (error) {
      toast({
        title: "خطأ في تحميل الملف",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
      
      // إعادة تعيين حالة الملف
      setSelectedFile(null);
      setUploadedFileInfo(null);
    } finally {
      setIsUploading(false);
      
      // إعادة تعيين حقل الملف ليتمكن المستخدم من تحميل نفس الملف مرة أخرى إذا أراد
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // دالة التفاعل بالرموز التعبيرية
  const handleEmojiReaction = async (messageId: number, emoji: string) => {
    console.log('🎯 handleEmojiReaction called:', { messageId, emoji, user: user?.id, socket: !!socket });
    
    if (!user || !socket) {
      console.log('❌ User or socket not available');
      return;
    }
    
    try {
      console.log('📡 Emitting toggleMessageLike for messageId:', messageId);
      // استخدام نظام الإعجاب الموجود حالياً مع عرض الرمز التعبيري المختار
      socket.emit('toggleMessageLike', { messageId, userId: user.id });
      
      // عرض رسالة تأكيد مع الرمز التعبيري المختار
      toast({
        title: `${emoji} تفاعل`,
        description: "تم إضافة تفاعلك بالرسالة",
        duration: 2000,
      });
      
      console.log('✅ Successfully handled emoji reaction');
    } catch (error) {
      console.error("❌ خطأ في التفاعل:", error);
      toast({
        title: "❌ خطأ",
        description: "حدث خطأ أثناء التفاعل مع الرسالة",
        variant: "destructive",
      });
    }
  };

  // إرسال رسالة
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    
    // لا ترسل رسائل فارغة إلا إذا كان هناك ملف مرفق
    if ((inputMessage.trim() === "" && !uploadedFileInfo) || !user || !room || !socket) {
      return;
    }
    
    // إرسال الرسالة من خلال الويب سوكيت
    socket.emit('sendMessage', {
      roomId: room.id,
      roomType: 'room',
      content: inputMessage,
      userId: user.id,
      userName: user.fullName,
      fileUrl: uploadedFileInfo?.fileUrl || null,
      fileType: uploadedFileInfo?.fileType || null
    });
    
    console.log('جاري إرسال رسالة:', {
      roomId: room.id,
      roomType: 'room',
      content: inputMessage,
      userId: user.id,
      userName: user.fullName,
      fileUrl: uploadedFileInfo?.fileUrl,
      fileType: uploadedFileInfo?.fileType
    });
    
    // إعادة تعيين الإدخال والملفات
    setInputMessage('');
    setSelectedFile(null);
    setUploadedFileInfo(null);
    
    // إرسال حدث التوقف عن الكتابة
    if (socket && user && room) {
      socket.emit('stopTyping', { 
        roomId: room.id, 
        roomType: 'room',
        userId: user.id,
        userName: user.fullName
      });
    }
  };
  
  // تنسيق الوقت
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  // بدء محادثة خاصة مع مستخدم
  const startPrivateChat = (userId: number) => {
    console.log('Debug - startPrivateChat called with userId:', userId);
    // توجيه إلى صفحة المحادثة الخاصة مع معرف المستخدم
    setLocation(`/private-chat/${userId}`);
    console.log('Debug - Navigation to /private-chat/' + userId);
  };
  
  // دالة للتعامل مع اختيار غرفة
  const handleSelectRoom = (roomId: number) => {
    setActiveRoomId(roomId);
    if (roomId) {
      // طلب تعيين الرسائل كمقروءة عند اختيار غرفة
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      fetch(`/api/chat/mark-read/${roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(response => {
        if (response.ok) {
          // إعادة تحميل بيانات الرسائل غير المقروءة
          queryClient.invalidateQueries({ queryKey: ["/api/chat/unread/public"] });
        } else {
          console.warn("لم يتم تعيين الرسائل كمقروءة، رمز الحالة:", response.status);
        }
      }).catch(err => {
        console.error("خطأ في تعيين الرسائل كمقروءة:", err);
      });
    }
  };

  return (
    <Guard page="chat">
      <div className="golden-page-bg w-full max-w-7xl mx-auto mt-8 p-2 min-h-screen">
      <div className="flex items-center justify-between mb-4 gap-4">
        <BackToDashboardButton />
        
        {/* قائمة الغرف المصغرة */}
        <div className={`${isAndroidAppMode ? 'flex-1 max-w-[200px]' : 'max-w-[250px]'}`}>
          <ChatListWithUnread
            activeRoomId={activeRoomId || undefined}
            onSelectRoom={handleSelectRoom}
            compact={true}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 space-y-4">
        
        {/* قائمة المستخدمين المتاحين */}
        <Card className={`h-fit transition-all duration-300 ${isAndroidAppMode ? 'rounded-lg shadow-md' : ''}`}>
          <CardHeader 
            className={`pb-2 cursor-pointer hover:bg-muted/50 transition-colors ${isAndroidAppMode ? 'p-3' : ''}`}
            onClick={() => isAndroidAppMode && setIsUsersListOpen(!isUsersListOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className={`${isAndroidAppMode ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
                <CardTitle className={`${isAndroidAppMode ? 'text-base' : 'text-lg'}`}>المستخدمين</CardTitle>
{isAndroidAppMode && availableUsers && Array.isArray(availableUsers) ? (
                  <Badge variant="secondary" className="text-xs">
                    {availableUsers.filter((otherUser: any) => otherUser.id !== user?.id).length}
                  </Badge>
                ) : null}
              </div>
              {isAndroidAppMode && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isUsersListOpen ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            {(!isAndroidAppMode || isUsersListOpen) && (
              <CardDescription className={`${isAndroidAppMode ? 'text-sm' : ''}`}>
                ابدأ محادثة خاصة مع أحد المستخدمين
              </CardDescription>
            )}
          </CardHeader>
        
          {isUsersListOpen && (
          <CardContent className={`${isAndroidAppMode ? 'max-h-[300px] p-3' : 'max-h-[500px]'} overflow-y-auto py-0 transition-all duration-300`}>
            {isLoadingUsers ? (
              <div className={`${isAndroidAppMode ? 'space-y-2 py-1' : 'space-y-3 py-2'}`}>
                {Array.from({ length: isAndroidAppMode ? 3 : 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 space-x-reverse">
                    <Skeleton className={`${isAndroidAppMode ? 'h-8 w-8' : 'h-10 w-10'} rounded-full`} />
                    <div className="space-y-2">
                      <Skeleton className={`h-4 ${isAndroidAppMode ? 'w-[120px]' : 'w-[150px]'}`} />
                      <Skeleton className={`h-4 ${isAndroidAppMode ? 'w-[80px]' : 'w-[100px]'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${isAndroidAppMode ? 'space-y-2 py-1' : 'space-y-3 py-2'}`}>
                {availableUsers && Array.isArray(availableUsers) ? (
                  availableUsers
                    .filter((otherUser: any) => otherUser.id !== user?.id)
                    .map((otherUser: any) => (
                      <div 
                        key={otherUser.id} 
                        className={`flex items-center justify-between ${isAndroidAppMode ? 'p-2 rounded-lg hover:bg-muted/50 active:bg-muted/70' : ''} transition-colors cursor-pointer`}
                        onClick={() => isAndroidAppMode && startPrivateChat(otherUser.id)}
                      >
                        <div className="flex items-center">
                          <Avatar className={`${isAndroidAppMode ? 'h-8 w-8 ml-2' : 'h-10 w-10 ml-3'}`}>
                            <AvatarFallback className={`${isAndroidAppMode ? 'text-xs' : ''}`}>
                              {otherUser.fullName?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={`${isAndroidAppMode ? 'text-xs' : 'text-sm'} font-medium truncate max-w-[120px]`}>
                              {otherUser.fullName}
                            </p>
                            <p className={`${isAndroidAppMode ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                              {otherUser.type === 'agent' ? 'وكيل' : 'مستخدم'}
                            </p>
                          </div>
                        </div>
                        {!isAndroidAppMode && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => startPrivateChat(otherUser.id)}
                          >
                            <MessageCircle className="h-4 w-4 ml-1" />
                            محادثة
                          </Button>
                        )}
                        {isAndroidAppMode && (
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))
                ) : (
                  <p className={`text-center ${isAndroidAppMode ? 'text-xs' : 'text-sm'} text-muted-foreground py-4`}>
                    لا يوجد مستخدمين متاحين حالياً
                  </p>
                )}
              </div>
            )}
          </CardContent>
          )}
        </Card>
        </div>

        {/* غرفة المحادثة العامة */}
        <div className="md:col-span-3">
        <Card>
        <CardHeader className={`${isAndroidAppMode ? 'p-2 pb-1' : 'p-3 pb-2'}`}>
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-2 space-x-reverse">
              {isSelectionMode ? (
                // أزرار وضع التحديد
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllMessages}
                    title="تحديد جميع رسائلي"
                    disabled={messages.filter(msg => msg.senderId === user?.id).length === 0}
                  >
                    <CheckSquare className="h-4 w-4 ml-1" />
                    تحديد الكل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={deleteSelectedMessages}
                    disabled={selectedMessages.size === 0}
                    title="حذف الرسائل المختارة"
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    حذف ({selectedMessages.size})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                  >
                    <X className="h-4 w-4 ml-1" />
                    إلغاء
                  </Button>
                </>
              ) : (
                // أزرار الوضع العادي
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSelectionMode(true)}
                    title="اختيار رسائل للحذف"
                    disabled={messages.filter(msg => msg.senderId === user?.id).length === 0}
                  >
                    <CheckSquare className="h-4 w-4 ml-1" />
                    اختيار
                  </Button>
                  <Badge variant={usersTyping.length > 0 ? "secondary" : "outline"} className="px-3">
                    {usersTyping.length > 0
                      ? usersTyping.length === 1
                        ? `${usersTyping[0]} يكتب الآن...`
                        : `${usersTyping.length} أشخاص يكتبون...`
                      : "متصل"}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className={`border-t border-b ${isAndroidAppMode ? 'h-[400px]' : 'h-[500px]'} overflow-y-auto ${isAndroidAppMode ? 'p-2' : 'p-4'}`}>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start max-w-[80%] gap-2">
                      {i % 2 !== 0 && <Skeleton className="h-10 w-10 rounded-full" />}
                      <div>
                        <Skeleton className="h-4 w-[150px] mb-2" />
                        <Skeleton className="h-20 w-[250px] rounded-md" />
                      </div>
                      {i % 2 === 0 && <Skeleton className="h-10 w-10 rounded-full" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className={`text-muted-foreground ${isAndroidAppMode ? 'text-sm text-center px-4' : ''}`}>لا توجد رسائل. كن أول من يبدأ المحادثة!</p>
                  </div>
                ) : (
                  <div className="chat-container">
                    {messages.map((message) => {
                      const currentUserId = Number(user?.id);
                      const messageSenderId = Number(message.senderId);
                      const isOwnMessage = messageSenderId === currentUserId;
                      console.log(`معرف المرسل (عامة): ${messageSenderId}, معرف المستخدم: ${currentUserId}, هل رسالة المستخدم: ${isOwnMessage}`);
                      const isDeleted = message.isDeleted;
                      
                      if (isSelectionMode) {
                        console.log(`رسالة قابلة للاختيار (عامة) - ID: ${message.id}, محتوى: ${message.content.substring(0, 20)}, مختارة: ${selectedMessages.has(message.id)}, مرسل: ${isOwnMessage ? 'نعم' : 'لا'}`);
                      }
                      
                      return (
                        <div key={message.id} className={`msg ${isOwnMessage ? 'msg--out' : 'msg--in'} ${isSelectionMode ? 'items-center gap-2' : ''} group relative`} data-mine={isOwnMessage}>
                          {/* checkbox للاختيار في وضع التحديد - جميع الرسائل */}
                          {isSelectionMode && (
                            <div 
                              className="cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => toggleMessageSelection(message.id)}
                              title={selectedMessages.has(message.id) ? "إلغاء اختيار الرسالة" : "اختيار الرسالة"}
                            >
                              {selectedMessages.has(message.id) ? (
                                <CheckSquare className="h-5 w-5 text-primary hover:text-primary/80" />
                              ) : (
                                <Square className="h-5 w-5 text-muted-foreground hover:text-primary/60" />
                              )}
                            </div>
                          )}
                          
                          <div className="msg__bubble">
                            {!isOwnMessage && (
                              <div className={`font-semibold ${isAndroidAppMode ? 'text-xs' : 'text-sm'} mb-1 text-gray-600`}>{message.senderName}</div>
                            )}
                              
                            {editingMessageId === message.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className={`${isAndroidAppMode ? 'min-h-[50px] text-sm' : 'min-h-[60px]'}`}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={cancelEditing} className={isAndroidAppMode ? 'text-xs px-2 py-1' : ''}>إلغاء</Button>
                                    <Button size="sm" onClick={saveEdit} className={isAndroidAppMode ? 'text-xs px-2 py-1' : ''}>حفظ</Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className={`${isSelectionMode && selectedMessages.has(message.id) ? 'ring-2 ring-primary rounded-lg' : ''} ${selectedMessageId === message.id ? 'selected' : ''} cursor-pointer select-none`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMessageId(selectedMessageId === message.id ? null : message.id);
                                  }}
                                >
                                  {isDeleted ? (
                                    <span className="text-muted-foreground italic">تم حذف هذه الرسالة</span>
                                  ) : (
                                    <>
                                      {message.content && (
                                        <p className={`whitespace-pre-wrap break-words mb-2 ${isAndroidAppMode ? 'text-sm' : ''}`}>{message.content}</p>
                                      )}
                                      
                                      {message.voiceId && (
                                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                          <VoiceMessage
                                            voiceId={message.voiceId}
                                            durationSeconds={message.voiceDuration || 0}
                                            senderName={message.senderName}
                                            createdAt={message.createdAt}
                                            isOwn={message.senderId === user?.id}
                                          />
                                        </div>
                                      )}
                                      
                                      {message.fileUrl && (
                                        <div className="mt-2">
                                          {message.fileType?.startsWith('image/') ? (
                                            // عرض الصور مع إمكانية التفاعل
                                            <div className={`rounded overflow-hidden ${isAndroidAppMode ? 'max-w-[180px]' : 'max-w-[250px]'} relative group`}>
                                              <img 
                                                src={message.fileUrl} 
                                                alt="صورة مرفقة" 
                                                className="max-w-full h-auto cursor-pointer transition-all duration-200 group-hover:brightness-90"
                                                onError={(e) => {
                                                  console.log('خطأ في تحميل الصورة:', message.fileUrl);
                                                  e.currentTarget.onerror = null;
                                                  e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                                                }}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  console.log('🖼️ تم النقر على الصورة للرسالة:', message.id);
                                                  // فتح قائمة التفاعل عند النقر على الصورة
                                                  setSelectedMessageId(selectedMessageId === message.id ? null : message.id);
                                                }}
                                              />
                                              {/* مؤشر التفاعل مع الصورة */}
                                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                                  انقر للتفاعل مع الرسالة
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            // عرض رابط للملفات الأخرى
                                            <a 
                                              href={message.fileUrl} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className={`flex items-center gap-2 bg-secondary/30 ${isAndroidAppMode ? 'p-1.5' : 'p-2'} rounded hover:bg-secondary/50 transition-colors`}
                                            >
                                              {message.fileType?.includes('pdf') ? (
                                                <File className={`${isAndroidAppMode ? 'h-4 w-4' : 'h-5 w-5'}`} />
                                              ) : (
                                                <Paperclip className={`${isAndroidAppMode ? 'h-4 w-4' : 'h-5 w-5'}`} />
                                              )}
                                              <span className={`${isAndroidAppMode ? 'text-xs' : 'text-sm'}`}>فتح الملف المرفق</span>
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                  
                                  {/* عرض الإعجابات مثل WhatsApp */}
                                  {(message.likesCount || 0) > 0 && (
                                    <div className="flex items-center gap-1 mt-1 mb-1">
                                      <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-sm border">
                                        <Heart className="h-3 w-3 text-red-500 fill-current" />
                                        <span className="text-xs text-gray-600 mr-1">{message.likesCount}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="msg__meta">
                                <time>
                                  {message.isEdited ? (
                                    `تم التعديل ${formatTime(message.editedAt || message.createdAt)}`
                                  ) : (
                                    formatTime(message.createdAt)
                                  )}
                                </time>
                              </div>
                              
                              {/* أزرار التفاعل مثل WhatsApp */}
                              {selectedMessageId === message.id && !isDeleted && !editingMessageId && (
                                <div 
                                  className={`absolute ${isOwnMessage ? 'left-[-140px]' : 'right-[-140px]'} top-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-3 flex gap-2 z-[9999] min-w-[220px] animate-in slide-in-from-top-2 duration-200`}
                                  data-reaction-menu
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* زر الإعجاب - للجميع */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`h-8 w-8 p-0 transition-all duration-200 ${
                                      message.likedByMe 
                                        ? 'bg-red-50 text-red-500 scale-110' 
                                        : 'hover:bg-red-50 hover:text-red-500'
                                    }`}
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('❤️ تم النقر على زر الإعجاب للرسالة:', message.id);
                                      
                                      try {
                                        const response = await apiRequest(`/api/chat/messages/${message.id}/like`, "POST");
                                        
                                        if (response.ok) {
                                          const result = await response.json();
                                          console.log('✅ نتيجة الإعجاب:', result);
                                          
                                          // تحديث الرسائل في الحالة المحلية
                                          setMessages(prevMessages => 
                                            prevMessages.map(msg => 
                                              msg.id === message.id 
                                                ? { ...msg, likedByMe: result.liked, likesCount: result.count }
                                                : msg
                                            )
                                          );
                                          
                                          toast({
                                            title: result.liked ? "❤️ إعجاب" : "💔 تم إلغاء الإعجاب",
                                            description: result.liked 
                                              ? (isOwnMessage ? "أعجبت برسالتك الخاصة" : "أعجبت بهذه الرسالة")
                                              : (isOwnMessage ? "تم إلغاء إعجابك برسالتك" : "تم إلغاء إعجابك بهذه الرسالة"),
                                          });
                                        } else {
                                          const errorData = await response.json();
                                          throw new Error(errorData.message || 'فشل في معالجة الإعجاب');
                                        }
                                      } catch (error) {
                                        console.error("❌ خطأ في الإعجاب:", error);
                                        toast({
                                          title: "❌ خطأ",
                                          description: error instanceof Error ? error.message : "حدث خطأ أثناء معالجة الإعجاب",
                                          variant: "destructive",
                                        });
                                      }
                                      
                                      setSelectedMessageId(null);
                                    }}
                                    title={isOwnMessage ? (message.likedByMe ? "إلغاء الإعجاب برسالتك" : "إعجاب برسالتك") : (message.likedByMe ? "إلغاء الإعجاب" : "إعجاب بهذه الرسالة")}
                                  >
                                    <Heart className={`h-4 w-4 transition-all duration-200 ${
                                      message.likedByMe ? 'fill-current' : ''
                                    }`} />
                                  </Button>
                                  
                                  {/* زر الرموز التعبيرية - للآخرين فقط */}
                                  {!isOwnMessage && (
                                    <div className="relative">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-500"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('تم النقر على الرموز التعبيرية للرسالة:', message.id);
                                          setShowEmojiReaction(showEmojiReaction === message.id ? null : message.id);
                                          setSelectedMessageId(null);
                                        }}
                                        title="رموز تعبيرية"
                                      >
                                        <Smile className="h-4 w-4" />
                                      </Button>
                                      
                                      {/* منتقي الرموز التعبيرية */}
                                      {showEmojiReaction === message.id && (
                                        <div className="absolute top-full right-0 mt-2 z-[9999]">
                                          <EmojiReactionPicker
                                            onEmojiSelect={(emoji) => handleEmojiReaction(message.id, emoji)}
                                            onClose={() => setShowEmojiReaction(null)}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* أزرار المالك فقط */}
                                  {isOwnMessage && (
                                    <>
                                      {/* زر التعديل - يظهر فقط للرسائل الجديدة (أقل من 5 دقائق) */}
                                      {(() => {
                                        const messageTime = new Date(message.createdAt).getTime();
                                        const currentTime = new Date().getTime();
                                        const timeDiff = currentTime - messageTime;
                                        const fiveMinutes = 5 * 60 * 1000; // 5 دقائق بالميلي ثانية
                                        
                                        return timeDiff < fiveMinutes ? (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-500"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditing(message);
                                              setSelectedMessageId(null);
                                            }}
                                            title="تعديل (متاح لمدة 5 دقائق فقط)"
                                          >
                                            <Edit3 className="h-4 w-4" />
                                          </Button>
                                        ) : null;
                                      })()}
                                      
                                      {/* زر الحذف */}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500 transition-colors"
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log('🔴 تم النقر على زر الحذف للرسالة:', message.id);
                                          setSelectedMessageId(null);
                                          await deleteMessage(message.id);
                                        }}
                                        title="حذف هذه الرسالة نهائياً"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  
                                  {/* زر المزيد */}
                                  <div className="relative">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('🔧 تم النقر على المزيد للرسالة:', message.id);
                                        setShowMoreOptions(showMoreOptions === message.id ? null : message.id);
                                        setSelectedMessageId(null);
                                      }}
                                      title="المزيد من الخيارات"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>

                                    {/* قائمة خيارات المزيد */}
                                    {showMoreOptions === message.id && (
                                      <div 
                                        className={`absolute ${isOwnMessage ? 'left-0' : 'right-0'} top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-1 z-[9999] min-w-[180px] animate-in slide-in-from-top-2 duration-200`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {/* نسخ النص */}
                                        {message.content && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full justify-start text-xs h-8 px-2"
                                            onClick={() => copyMessageText(message)}
                                          >
                                            <Copy className="h-3 w-3 ml-2" />
                                            نسخ النص
                                          </Button>
                                        )}
                                        
                                        {/* إعادة التوجيه */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="w-full justify-start text-xs h-8 px-2"
                                          onClick={() => forwardMessage(message)}
                                        >
                                          <Share className="h-3 w-3 ml-2" />
                                          إعادة توجيه
                                        </Button>
                                        
                                        {/* معلومات الرسالة */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="w-full justify-start text-xs h-8 px-2"
                                          onClick={() => showMessageInfo(message)}
                                        >
                                          <Info className="h-3 w-3 ml-2" />
                                          معلومات الرسالة
                                        </Button>
                                        
                                        {/* إضافة للمفضلة */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="w-full justify-start text-xs h-8 px-2"
                                          onClick={() => addToFavorites(message)}
                                        >
                                          <Star className="h-3 w-3 ml-2" />
                                          إضافة للمفضلة
                                        </Button>
                                        
                                        {/* الإبلاغ عن الرسالة - للرسائل من الآخرين فقط */}
                                        {!isOwnMessage && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full justify-start text-xs h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => reportMessage(message)}
                                          >
                                            <Flag className="h-3 w-3 ml-2" />
                                            إبلاغ
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className={`${isAndroidAppMode ? 'p-2' : 'p-4'} relative`}>
          {usersTyping.length > 0 && (
            <div className={`${isAndroidAppMode ? 'text-xs' : 'text-sm'} text-primary mb-2 bg-muted ${isAndroidAppMode ? 'p-1.5' : 'p-2'} rounded-md text-right font-medium w-full`}>
              <span className="animate-pulse inline-block">⌨️</span> {usersTyping.join(", ")} {usersTyping.length === 1 ? "يكتب الآن..." : "يكتبون الآن..."}
            </div>
          )}
          
          {showInlineVoiceRecorder ? (
            <div className="w-full flex items-center justify-center py-2">
              <WhatsAppVoiceRecorder
                onVoiceRecorded={handleInlineVoiceRecorded}
                onCancel={() => setShowInlineVoiceRecorder(false)}
                maxDuration={120}
                className="flex-1 max-w-lg"
              />
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className={`w-full flex items-center ${isAndroidAppMode ? 'gap-0.5 flex-wrap' : 'gap-2'}`}>
              <Button
                type="button"
                size={isAndroidAppMode ? "sm" : "icon"}
                variant="ghost"
                onClick={() => setShowEmoji(!showEmoji)}
                className={`flex-shrink-0 ${isAndroidAppMode ? 'px-2 py-1.5' : ''}`}
              >
                <Smile className={`${isAndroidAppMode ? 'h-3.5 w-3.5' : 'h-5 w-5'}`} />
              </Button>
              
              <Button
                type="button"
                size={isAndroidAppMode ? "sm" : "icon"}
                variant="ghost"
                onClick={() => document.getElementById('file-upload')?.click()}
                className={`flex-shrink-0 relative ${isAndroidAppMode ? 'px-2 py-1.5' : ''}`}
                title="إرفاق ملف"
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="animate-spin text-sm">⌛</span>
                ) : (
                  <Paperclip className={`${isAndroidAppMode ? 'h-3.5 w-3.5' : 'h-5 w-5'}`} />
                )}
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-rar-compressed"
                />
              </Button>

            {uploadedFileInfo && (
              <div className={`${isAndroidAppMode ? 'w-full order-first mb-2' : ''} flex items-center bg-secondary/20 px-2 py-1 rounded text-xs gap-1`}>
                <span className={`truncate ${isAndroidAppMode ? 'max-w-[200px]' : 'max-w-[100px]'}`}>تم تحميل الملف</span>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  className="h-4 w-4 rounded-full hover:bg-destructive/20"
                  onClick={() => setUploadedFileInfo(null)}
                >
                  <span className="sr-only">إلغاء</span>
                  <span className="text-destructive">×</span>
                </Button>
              </div>
            )}
            
            <Input
              value={inputMessage}
              onChange={handleInputChange}
              placeholder={uploadedFileInfo ? (isAndroidAppMode ? "وصف..." : "أضف وصفاً للملف (اختياري)...") : (isAndroidAppMode ? "اكتب رسالتك..." : "اكتب رسالتك هنا...")}
              className={`${isAndroidAppMode ? 'flex-[2] min-w-0 text-sm py-2.5 px-3' : 'flex-1'}`}
              disabled={isUploading}
            />
            
            {(inputMessage.trim() || uploadedFileInfo) ? (
              <Button 
                type="submit" 
                size={isAndroidAppMode ? "sm" : "icon"} 
                className={`flex-shrink-0 ${isAndroidAppMode ? 'px-3 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90' : ''}`} 
                disabled={isUploading}
                title="إرسال"
              >
                <Send className={`${isAndroidAppMode ? 'h-3.5 w-3.5' : 'h-5 w-5'}`} />
              </Button>
            ) : (
              <Button
                type="button"
                size={isAndroidAppMode ? "sm" : "icon"}
                variant="ghost"
                onClick={() => setShowInlineVoiceRecorder(true)}
                className={`flex-shrink-0 ${isAndroidAppMode ? 'px-2 py-1.5' : ''}`}
                title="تسجيل رسالة صوتية"
                disabled={isUploading}
              >
                <Mic className={`${isAndroidAppMode ? 'h-3.5 w-3.5' : 'h-5 w-5'}`} />
              </Button>
            )}
            </form>
          )}
          
          {showEmoji && (
            <div className={`absolute ${isAndroidAppMode ? 'bottom-[65px] right-0 left-0 mx-2' : 'bottom-[70px] left-0'} z-20 bg-white rounded-md shadow-lg border`}>
              <div className={`${isAndroidAppMode ? 'relative' : ''}`} style={{ padding: isAndroidAppMode ? '4px' : '8px' }}>
                {isAndroidAppMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmoji(false)}
                    className="absolute top-1 right-1 h-6 w-6 p-0 z-10"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <EmojiPicker
                  theme={Theme.LIGHT}
                  onEmojiClick={(emojiData: EmojiClickData) => {
                    console.log("تم اختيار الإيموجي:", emojiData);
                    setInputMessage(prev => prev + emojiData.emoji);
                    setShowEmoji(false);
                  }}
                  lazyLoadEmojis={true}
                  searchPlaceHolder="ابحث عن رمز تعبيري..."
                  width={isAndroidAppMode ? '100%' : 300}
                  height={isAndroidAppMode ? 300 : 400}
                  previewConfig={{ showPreview: false }}
                />
              </div>
            </div>
          )}
        </CardFooter>
        </Card>
        </div>
      </div>
      </div>
    </Guard>
  );
}