import { useEffect, useState, useRef, FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Check, 
  Clock, 
  Search,
  RefreshCw,
  Users,
  MessageCircle,
  Smile,
  Paperclip,
  File as FileIcon,
  X,
  Image,
  Upload,
  Download,
  Loader2,
  Video,
  Music,
  FileText,
  Trash2,
  CheckSquare,
  Square,
  MoreHorizontal,
  Copy,
  Share,
  Info,
  Flag,
  Star
} from "lucide-react";
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import io, { Socket } from "socket.io-client";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Guard } from "@/components/Guard";

// تحديد واجهات البيانات
interface PrivateMessage {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName: string;
  isEdited?: boolean;
  editedAt?: string;
  fileUrl?: string | null;
  fileType?: string | null;
  isForwarded?: boolean;
  originalSenderId?: number;
  forwardedFromSender?: string;
}

interface PrivateChat {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageAt: string;
  createdAt: string;
  otherUser: {
    id: number;
    fullName: string;
  };
  unreadCount: number;
}

// واجهة الدردشات الخاصة
export default function PrivateChatPage() {
  return (
    <Guard page="private_chat">
      <PrivateChatContent />
    </Guard>
  );
}

function PrivateChatContent() {
  const { user } = useAuth();
  
  // إدراج معرف المستخدم مباشرة في HTML للاستمرارية
  useEffect(() => {
    if (user?.id) {
      // حفظ في عدة أماكن للتأكد
      sessionStorage.setItem('currentUserId', user.id.toString());
      document.body.setAttribute('data-current-user-id', user.id.toString());
      console.log('✓ تم حفظ معرف المستخدم:', user.id);
    }
  }, [user?.id]);

  // الحصول على معرف المستخدم بطرق متعددة
  const getCurrentUserId = () => {
    // أولاً من auth
    if (user?.id) {
      console.log('🟢 getCurrentUserId من auth:', user.id);
      return user.id;
    }
    
    // ثانياً من sessionStorage
    const stored = sessionStorage.getItem('currentUserId');
    if (stored) {
      console.log('🟡 getCurrentUserId من sessionStorage:', stored);
      return parseInt(stored);
    }
    
    // ثالثاً من body attribute
    const bodyAttr = document.body.getAttribute('data-current-user-id');
    if (bodyAttr) {
      console.log('🟠 getCurrentUserId من body:', bodyAttr);
      return parseInt(bodyAttr);
    }
    
    console.log('🔴 getCurrentUserId فشل في العثور على المعرف!');
    return null;
  };
  
  // تسجيل معلومات المستخدم الحالي
  console.log(`=== معلومات المستخدم الحالي ===`);
  console.log(`المستخدم:`, user);
  console.log(`معرف المستخدم: ${user?.id} (نوع: ${typeof user?.id})`);
  const { toast } = useToast();
  const params = useParams<{ userId: string }>();
  const targetUserId = params.userId ? parseInt(params.userId) : null;
  const [chatId, setChatId] = useState<number | null>(null);
  const [otherUser, setOtherUser] = useState<{ id: number; fullName: string } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatViewing, setChatViewing] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [usersTyping, setUsersTyping] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  // متغيرات اختيار الرسائل للحذف
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  // متغيرات المرفقات
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{fileUrl: string, fileType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // حالة قائمة خيارات المزيد
  const [showMoreOptions, setShowMoreOptions] = useState<number | null>(null);
  const moreOptionsRef = useRef<HTMLDivElement>(null);
  
  // حالة القائمة المنسدلة للدردشات
  const [selectedChatValue, setSelectedChatValue] = useState<string>("");
  
  // حالة إعادة التوجيه
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<PrivateMessage | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // جلب قائمة الدردشات الخاصة للمستخدم
  const { data: privateChats, isLoading: isLoadingChats, refetch: refetchChats } = useQuery({
    queryKey: ['/api/chat/private'],
    enabled: !!user,
  });
  
  // إنشاء اتصال Socket.IO عند تحميل الصفحة
  useEffect(() => {
    if (!user) return;
    
    // تحديد عنوان الخادم
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;
    
    // الحصول على JWT token من localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ لا يوجد token للاتصال بـ Socket.IO');
      return;
    }
    
    // إنشاء اتصال Socket.IO بالمسار الصحيح مع JWT token
    const newSocket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: {
        token: token
      }
    });
    
    // الاستماع لأحداث الاتصال
    newSocket.on('connect', () => {
      console.log('تم الاتصال بخادم الدردشة');
      
      // جلب المحادثات الخاصة للمستخدم (الآن آمن - userId يأتي من JWT في الخادم)
      newSocket.emit('getPrivateChats');
      
      // إذا كان المستخدم في محادثة حالية، انضم تلقائياً للغرفة (آمن - userId يأتي من JWT)
      if (chatId && otherUser) {
        newSocket.emit('joinPrivateChat', {
          otherUserId: otherUser.id
        });
      }
    });
    
    // الاستماع لأحداث قطع الاتصال
    newSocket.on('disconnect', () => {
      console.log('انقطع الاتصال بخادم الدردشة');
    });
    
    // الاستماع للدردشات الخاصة
    newSocket.on('privateChats', (chats: PrivateChat[]) => {
      // تحديث البيانات في ذاكرة التخزين المؤقت
      queryClient.setQueryData(['/api/chat/private'], chats);
    });
    
    // الاستماع لتفاصيل المحادثة الخاصة
    newSocket.on('privateChat', (data: { chat: PrivateChat; otherUser: { id: number; fullName: string }; messages: PrivateMessage[] }) => {
      console.log('🔍 استلام بيانات المحادثة الخاصة:', {
        'معرف المحادثة': data.chat.id,
        'المستخدم الآخر': data.otherUser ? `${data.otherUser.fullName} (${data.otherUser.id})` : 'null',
        'المستخدم الحالي': user.id,
        'عدد الرسائل': data.messages.length,
        'chat.user1Id': data.chat.user1Id,
        'chat.user2Id': data.chat.user2Id
      });
      
      setChatId(data.chat.id);
      setOtherUser(data.otherUser);
      setMessages(data.messages);
      setChatViewing(true);
      setTimeout(scrollToBottom, 100);
    });
    
    // الاستماع للرسائل الجديدة
    newSocket.on('newPrivateMessage', (message: PrivateMessage) => {
      console.log("تم استلام رسالة خاصة جديدة:", message);
      
      // تحديث قائمة الرسائل
      setMessages(prev => {
        // تجنب الرسائل المكررة
        const messageExists = prev.some(m => m.id === message.id);
        if (messageExists) {
          return prev;
        }
        return [...prev, message];
      });
      
      setTimeout(scrollToBottom, 100);
      
      // إذا كانت من المستخدم الآخر، نعلمها كمقروءة
      if (message.senderId !== user.id && chatId) {
        console.log("تعليم الرسائل كمقروءة");
        newSocket.emit('markMessagesAsRead', { chatId, userId: user.id });
        
        // تحديث قائمة المحادثات لإزالة علامة الرسائل غير المقروءة
        // تحديث المحادثة في قائمة المحادثات الخاصة بكاش TanStack Query
        const currentChats = queryClient.getQueryData<PrivateChat[]>(['/api/chat/private']) || [];
        const updatedChats = currentChats.map(chat => {
          if (chat.id === message.chatId) {
            return {
              ...chat,
              lastMessageAt: message.createdAt,
              unreadCount: message.senderId !== user.id ? chat.unreadCount + 1 : chat.unreadCount
            };
          }
          return chat;
        });
        
        // ترتيب المحادثات بحيث تظهر المحادثة النشطة في الأعلى
        updatedChats.sort((a, b) => 
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
        
        // تحديث كاش المحادثات
        queryClient.setQueryData(['/api/chat/private'], updatedChats);
      }
    });
    
    // الاستماع لإنشاء محادثة جديدة (لعرضها عند الطرف الثاني)
    newSocket.on('newChatCreated', (data: { chat: PrivateChat }) => {
      console.log('تم إنشاء محادثة جديدة:', data);
      
      // إضافة المحادثة الجديدة إلى قائمة المحادثات
      const currentChats = queryClient.getQueryData<PrivateChat[]>(['/api/chat/private']) || [];
      
      // التحقق مما إذا كانت المحادثة موجودة بالفعل
      const chatExists = currentChats.some(chat => chat.id === data.chat.id);
      
      if (!chatExists) {
        // إضافة المحادثة الجديدة إلى الكاش
        queryClient.setQueryData(['/api/chat/private'], [data.chat, ...currentChats]);
      }
      
      // تشغيل صوت تنبيه (يمكن إضافة ذلك في المستقبل)
      // new Audio('/assets/notification.mp3').play().catch(e => console.log('Could not play notification sound'));
    });
    
    // الاستماع للرسائل المعدلة
    newSocket.on('updatedPrivateMessage', (updatedMessage: PrivateMessage) => {
      console.log('تم استلام رسالة معدلة:', updatedMessage);
      
      // تحديث الرسالة في المصفوفة إذا كانت تنتمي إلى المحادثة الحالية
      if (chatId === updatedMessage.chatId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        );
      }
    });

    // الاستماع لحذف الرسائل الفردي
    newSocket.on('messageDeletedForUser', (data: { 
      messageId: number; 
      chatId: number; 
      deletedBy: number;
      deletedForUser: number;
    }) => {
      console.log("تم استلام حدث حذف رسالة فردي:", data);
      
      // إزالة الرسالة من جهة المستخدم الذي حذفها فقط
      if (data.deletedForUser === user.id) {
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== data.messageId);
          console.log(`تم إزالة الرسالة ${data.messageId} من جهة المستخدم ${user.id}. عدد الرسائل قبل: ${prev.length}, بعد: ${filtered.length}`);
          return filtered;
        });
        
        toast({
          title: "تم حذف الرسالة",
          description: "تم حذف رسالتك من محادثتك",
          variant: "default",
        });
      }
    });
    
    // الاستماع للأخطاء
    newSocket.on('error', (error) => {
      console.error('خطأ في الاتصال بالدردشة:', error);
      toast({
        title: "❌ خطأ",
        description: error.message || "حدث خطأ في الاتصال",
        variant: "destructive",
      });
    });
    
    // الاستماع لنجاح إعادة التوجيه
    newSocket.on('forwardSuccess', (data: { message: string }) => {
      console.log('نجح إعادة التوجيه:', data);
      toast({
        title: "✅ تم إعادة التوجيه",
        description: data.message,
      });
      
      // تحديث قائمة المحادثات
      refetchChats();
    });
    
    // الاستماع لأحداث الكتابة
    newSocket.on('userTyping', (data: { userId: number; userName: string }) => {
      console.log("المستخدم يكتب الآن:", data);
      if (data.userId !== user.id) {
        setUsersTyping(prev => {
          if (!prev.includes(data.userName)) {
            console.log("إضافة مستخدم يكتب الآن:", data.userName);
            return [...prev, data.userName];
          }
          return prev;
        });
      }
    });
    
    // الاستماع لأحداث التوقف عن الكتابة
    newSocket.on('userStoppedTyping', (data: { userId: number; userName: string }) => {
      console.log("المستخدم توقف عن الكتابة:", data);
      if (data.userId !== user.id) {
        setUsersTyping(prev => {
          console.log("إزالة مستخدم توقف عن الكتابة:", data.userName);
          return prev.filter(name => name !== data.userName);
        });
      }
    });
    
    // جلب الدردشات الخاصة
    newSocket.emit('getPrivateChats', { userId: user.id });
    
    // تسجيل المستخدم في غرفة خاصة به لتلقي الإشعارات
    newSocket.emit('register_user', { userId: user.id });
    
    // تخزين الاتصال في الحالة
    setSocket(newSocket);
    
    // إغلاق الاتصال عند مغادرة الصفحة
    return () => {
      newSocket.disconnect();
    };
  }, [user, queryClient, chatId, refetchChats]);

  // تهيئة المحادثة تلقائياً عند تمرير معرف المستخدم في المسار
  useEffect(() => {
    const initializeChat = async () => {
      if (!user || !targetUserId || chatViewing) return;
      
      console.log('بدء تهيئة محادثة مع المستخدم:', targetUserId);
      
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch('/api/chat/private/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ otherUserId: targetUserId })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('تم إنشاء/جلب المحادثة:', data);
          
          // تعيين بيانات المحادثة
          if (data.chat) {
            setChatId(data.chat.id);
            setOtherUser(data.otherUser);
            setChatViewing(true);
            
            // جلب الرسائل
            const messagesResponse = await fetch(`/api/chat/private/${data.chat.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              setMessages(messagesData.messages || []);
            }
            
            // الانضمام للمحادثة عبر Socket (آمن - userId يأتي من JWT)
            if (socket) {
              socket.emit('joinPrivateChat', {
                otherUserId: targetUserId
              });
            }
          }
        }
      } catch (error) {
        console.error('خطأ في تهيئة المحادثة:', error);
      }
    };
    
    initializeChat();
  }, [user, targetUserId, socket]);
  
  // التمرير إلى أسفل عند إضافة رسائل جديدة
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // معالجة حدث الكتابة
  useEffect(() => {
    if (!socket || !user || !chatId || !otherUser) return;
    
    if (inputMessage.trim()) {
      // إرسال حدث "يكتب الآن"
      socket.emit('typing', { 
        roomType: 'private', 
        roomId: chatId, 
        userId: user.id, 
        userName: user.fullName 
      });
      
      // إلغاء المؤقت السابق إذا وجد
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // إعداد مؤقت جديد للتوقف عن الكتابة بعد ثانيتين
      const newTimeout = setTimeout(() => {
        socket.emit('stopTyping', { 
          roomType: 'private', 
          roomId: chatId, 
          userId: user.id,
          userName: user.fullName 
        });
      }, 2000);
      
      setTypingTimeout(newTimeout);
    } else {
      // إرسال حدث التوقف عن الكتابة فورا عند مسح النص
      socket.emit('stopTyping', { 
        roomType: 'private', 
        roomId: chatId, 
        userId: user.id,
        userName: user.fullName 
      });
    }
    
    // تنظيف المؤقت عند إلغاء تحميل المكون
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [inputMessage, socket, user, chatId, otherUser, typingTimeout]);
  
  // معالج النقر خارج قائمة خيارات المزيد
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreOptions !== null && moreOptionsRef.current) {
        const target = event.target as Node;
        const moreButton = document.querySelector(`[data-more-button="${showMoreOptions}"]`);
        
        // تحقق من أن النقر ليس على الزر نفسه أو داخل القائمة
        if (!moreOptionsRef.current.contains(target) && !moreButton?.contains(target)) {
          setShowMoreOptions(null);
        }
      }
    };

    if (showMoreOptions !== null) {
      // استخدم setTimeout قصير لتجنب التضارب مع onClick على الزر
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true); // استخدم capture phase
      }, 10);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside, true);
      };
    }
  }, [showMoreOptions]);
  
  // دوال خيارات المزيد
  const copyMessageText = (message: PrivateMessage) => {
    // التحقق من وجود نص للنسخ
    if (!message.content || message.content.trim() === '') {
      toast({
        title: "⚠️ تحذير",
        description: "لا يوجد نص لنسخه في هذه الرسالة",
        variant: "destructive",
      });
      setShowMoreOptions(null);
      return;
    }

    const textToCopy = message.content.trim();
    
    // طريقة حديثة للنسخ
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('✅ تم نسخ النص بنجاح:', textToCopy.substring(0, 50));
        toast({
          title: "✅ تم النسخ",
          description: `تم نسخ نص الرسالة إلى الحافظة (${textToCopy.length} حرف)`,
        });
      }).catch((error) => {
        console.error('❌ خطأ في النسخ:', error);
        // جرب الطريقة البديلة
        fallbackCopyTextToClipboard(textToCopy);
      });
    } else {
      // الطريقة البديلة للمتصفحات القديمة أو غير الآمنة
      fallbackCopyTextToClipboard(textToCopy);
    }
    
    function fallbackCopyTextToClipboard(text: string) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          console.log('✅ تم نسخ النص بالطريقة البديلة:', text.substring(0, 50));
          toast({
            title: "✅ تم النسخ",
            description: `تم نسخ نص الرسالة إلى الحافظة (${text.length} حرف)`,
          });
        } else {
          throw new Error('فشل الأمر execCommand');
        }
      } catch (err) {
        console.error('❌ خطأ في النسخ البديل:', err);
        toast({
          title: "❌ خطأ في النسخ",
          description: "لم يتمكن من نسخ النص. جرب تحديد النص ونسخه يدوياً",
          variant: "destructive",
        });
      } finally {
        document.body.removeChild(textArea);
      }
    }
    
    setShowMoreOptions(null);
  };

  const forwardMessage = (message: PrivateMessage) => {
    setMessageToForward(message);
    setShowForwardModal(true);
    setShowMoreOptions(null);
  };

  const handleForwardToChat = async (targetChatId: number, targetUserName: string) => {
    if (!messageToForward || !user || !socket) return;

    try {
      // إرسال طلب إعادة التوجيه عبر WebSocket (آمن - forwarderId يأتي من JWT في الخادم)
      socket.emit('forwardPrivateMessage', {
        originalMessageId: messageToForward.id,
        targetChatIds: [targetChatId]
      });

      // إغلاق النافذة وإعادة تعيين المتغيرات
      setShowForwardModal(false);
      setMessageToForward(null);
      
      console.log(`🔄 تم إرسال طلب إعادة توجيه الرسالة ${messageToForward.id} إلى المحادثة ${targetChatId}`);
      
    } catch (error) {
      console.error('خطأ في إعادة التوجيه:', error);
      toast({
        title: "❌ خطأ في إعادة التوجيه",
        description: "حدث خطأ أثناء إعادة توجيه الرسالة",
        variant: "destructive",
      });
    }
  };

  const showMessageInfo = (message: PrivateMessage) => {
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

    alert(infoText);
    setShowMoreOptions(null);
  };

  const reportMessage = (message: PrivateMessage) => {
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

  const addToFavorites = (message: PrivateMessage) => {
    // حفظ في localStorage مؤقتاً
    const favorites = JSON.parse(localStorage.getItem('favoriteMessages') || '[]');
    const messageData = {
      id: message.id,
      content: message.content,
      senderName: message.senderName,
      createdAt: message.createdAt,
      chatId: message.chatId
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
  
  // معالج تغيير القائمة المنسدلة للدردشات
  const handleChatSelect = (chatIdStr: string) => {
    if (!chatIdStr || !privateChats || !Array.isArray(privateChats)) return;
    
    const selectedChat = privateChats.find((chat: any) => chat.id.toString() === chatIdStr);
    if (selectedChat) {
      joinChat(selectedChat);
    }
  };
  
  // الانضمام إلى محادثة معينة
  const joinChat = (chat: PrivateChat) => {
    setChatId(chat.id);
    setMessages([]);
    setOtherUser(chat.otherUser);
    setChatViewing(true);
    setSelectedChatValue(chat.id.toString());
    
    if (!socket || !user) return;
    
    // الانضمام إلى غرفة المحادثة (آمن - userId يأتي من JWT)
    socket.emit('joinPrivateChat', {
      otherUserId: chat.otherUser.id
    });
    
    // يمكن استخدام API كبديل للـ WebSocket
    /*
    const fetchChat = async () => {
      try {
        const res = await apiRequest("GET", `/api/chat/private/${chat.id}`);
        const data = await res.json();
        
        setChatId(chat.id);
        setOtherUser(data.otherUser);
        setMessages(data.messages);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("خطأ في جلب المحادثة:", error);
      }
    };
    
    fetchChat();
    */
  };
  
  // إنشاء محادثة جديدة
  const createChat = async (otherUserId: number) => {
    try {
      const res = await apiRequest("/api/chat/private/create", "POST", { otherUserId });
      const data = await res.json();
      
      // تحديث قائمة الدردشات
      refetchChats();
      
      // الانضمام إلى المحادثة الجديدة (آمن - userId يأتي من JWT)
      if (socket && user) {
        socket.emit('joinPrivateChat', {
          otherUserId
        });
      }
    } catch (error) {
      console.error("خطأ في إنشاء محادثة جديدة:", error);
    }
  };
  
  // بدء تعديل رسالة
  const startEditing = (message: PrivateMessage) => {
    if (message.senderId !== user?.id) return; // لا يمكن تعديل رسائل الآخرين
    
    // التحقق من وقت الرسالة (مسموح التعديل خلال 5 دقائق فقط)
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = new Date().getTime();
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 دقائق بالمللي ثانية
    
    if (currentTime - messageTime > FIVE_MINUTES) {
      toast({
        title: "لا يمكن تعديل الرسالة",
        description: "انتهى وقت التعديل المسموح به (5 دقائق)",
        variant: "destructive",
      });
      return;
    }
    
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };
  
  // إلغاء تعديل رسالة
  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent("");
  };
  
  // حفظ التعديلات على الرسالة
  const saveMessageEdit = async () => {
    if (!editingMessageId || !chatId || !user || !editContent.trim()) return;
    
    try {
      const response = await apiRequest(
        "PUT", 
        `/api/chat/private/${chatId}/messages/${editingMessageId}`, 
        { content: editContent.trim() }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل تعديل الرسالة");
      }
      
      // مسح حالة التعديل
      setEditingMessageId(null);
      setEditContent("");
      
    } catch (error) {
      console.error("خطأ في تعديل الرسالة:", error);
      toast({
        title: "فشل تعديل الرسالة",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    }
  };

  // معالجة اختيار الملف للرفع
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // رفع الملف إلى السيرفر
  const handleFileUpload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!selectedFile || !user) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const authToken = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('فشل تحميل الملف');
      }
      
      const data = await response.json();
      
      setUploadedFileInfo({
        fileUrl: data.fileUrl,
        fileType: data.fileType
      });
      
      toast({
        title: "تم تحميل الملف",
        description: "تم تحميل الملف بنجاح",
        variant: "default",
      });
      
    } catch (error) {
      console.error("خطأ في تحميل الملف:", error);
      toast({
        title: "فشل تحميل الملف",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      
      // إعادة تعيين حقل الملف ليتمكن المستخدم من تحميل نفس الملف مرة أخرى إذا أراد
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // إلغاء اختيار الملف
  const handleCancelFileSelection = () => {
    setSelectedFile(null);
    setUploadedFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // حذف رسالة
  const handleDeleteMessage = async (messageId: number) => {
    if (!chatId || !user) return;
    
    console.log(`بدء عملية حذف الرسالة ${messageId} من المحادثة ${chatId}`);
    
    try {
      const response = await apiRequest("DELETE", `/api/chat/private/${chatId}/messages/${messageId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل حذف الرسالة");
      }
      
      console.log(`تم حذف الرسالة ${messageId} بنجاح عبر API`);
      
      // إزالة الرسالة فوريا من الواجهة (كنسخة احتياطية)
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== messageId);
        console.log(`إزالة فورية للرسالة ${messageId}. عدد الرسائل قبل: ${prev.length}, بعد: ${filtered.length}`);
        return filtered;
      });
      
      toast({
        title: "تم حذف الرسالة",
        description: "تم حذف الرسالة بنجاح",
        variant: "default",
      });
      
    } catch (error) {
      console.error("خطأ في حذف الرسالة:", error);
      toast({
        title: "فشل حذف الرسالة",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    }
  };

  // وظائف اختيار الرسائل للحذف المتعدد
  const toggleMessageSelection = (messageId: number) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const selectAllMessages = () => {
    const userMessages = messages.filter(msg => msg.senderId === user?.id);
    const allMessageIds = new Set(userMessages.map(msg => msg.id));
    setSelectedMessages(allMessageIds);
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
    setIsSelectionMode(false);
  };

  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0 || !user || !chatId) return;
    
    try {
      const messageIds = Array.from(selectedMessages);
      
      // حذف كل رسالة منفردة
      for (const messageId of messageIds) {
        const response = await apiRequest("DELETE", `/api/chat/private/${chatId}/messages/${messageId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "فشل حذف إحدى الرسائل");
        }
      }
      
      // إزالة الرسائل المحذوفة من الواجهة
      setMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
      
      // إعادة تعيين الاختيار
      clearSelection();
      
      toast({
        title: "تم حذف الرسائل",
        description: `تم حذف ${messageIds.length} رسالة من جهتك`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("خطأ في حذف الرسائل:", error);
      toast({
        title: "فشل حذف الرسائل",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    }
  };

  // تنظيف المحادثة (حذف جميع الرسائل من جهة المستخدم فقط)
  const handleClearChat = async () => {
    if (!chatId || !user || !window.confirm("هل أنت متأكد من تنظيف المحادثة؟ سيتم حذف جميع الرسائل من جهتك فقط.")) {
      return;
    }
    
    try {
      const response = await apiRequest("DELETE", `/api/chat/private/${chatId}/clear`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل تنظيف المحادثة");
      }
      
      // إزالة جميع الرسائل من الواجهة
      setMessages([]);
      
      toast({
        title: "تم تنظيف المحادثة",
        description: "تم حذف جميع الرسائل من جهتك بنجاح",
        variant: "default",
      });
      
    } catch (error) {
      console.error("خطأ في تنظيف المحادثة:", error);
      toast({
        title: "فشل تنظيف المحادثة",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    }
  };

  // إرسال رسالة جديدة
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    
    // إذا كنا في وضع التعديل، نحفظ التعديلات بدلاً من إرسال رسالة جديدة
    if (editingMessageId) {
      saveMessageEdit();
      return;
    }
    
    // لا ترسل رسائل فارغة إلا إذا كان هناك ملف مرفق
    if ((inputMessage.trim() === "" && !uploadedFileInfo) || !socket || !user || !chatId) {
      return;
    }
    
    const content = inputMessage.trim();
    
    // إرسال الرسالة عبر WebSocket مباشرة بدون رسالة مؤقتة
    socket.emit('sendPrivateMessage', {
      chatId,
      senderId: user.id,
      content,
      receiverId: otherUser?.id,
      fileUrl: uploadedFileInfo?.fileUrl || null,
      fileType: uploadedFileInfo?.fileType || null
    });
    
    // إعادة تعيين الإدخال والملفات المرفقة
    setInputMessage("");
    setSelectedFile(null);
    setUploadedFileInfo(null);
    
    // تحديث قائمة المحادثات لتعكس آخر نشاط
    const currentChats = queryClient.getQueryData<PrivateChat[]>(['/api/chat/private']) || [];
    const updatedChats = currentChats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          lastMessageAt: new Date().toISOString()
        };
      }
      return chat;
    });
    
    // ترتيب المحادثات بحيث تظهر المحادثة النشطة في الأعلى
    updatedChats.sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
    
    // تحديث كاش المحادثات
    queryClient.setQueryData(['/api/chat/private'], updatedChats);
    
    // مسح حقل الإدخال
    setInputMessage("");
  };
  
  // البحث عن المستخدمين الآخرين
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['/api/search/users', searchQuery],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/search/users?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        return [];
      }
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });
  
  // بدء محادثة جديدة مع مستخدم
  const startChatMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch('/api/chat/private/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId: userId })
      });
      
      if (!res.ok) {
        throw new Error('فشل إنشاء المحادثة');
      }
      
      return res.json();
    },
    onSuccess: async (data) => {
      // استخدام المحادثة التي تم إرجاعها من الخادم
      if (data && data.chat) {
        setChatViewing(true);
        
        try {
          // تعيين معرف المحادثة والمستخدم الآخر فورًا
          setChatId(data.chat.id);
          setOtherUser(data.otherUser);
          setMessages([]); // تفريغ الرسائل لتجنب ظهور رسائل قديمة
          
          // إضافة المحادثة الجديدة مباشرة إلى الكاش
          const currentChats = queryClient.getQueryData<PrivateChat[]>(['/api/chat/private']) || [];
          
          // التحقق مما إذا كانت المحادثة موجودة بالفعل
          const existingChatIndex = currentChats.findIndex(chat => chat.id === data.chat.id);
          
          // تنسيق المحادثة بالشكل المتوقع في قائمة المحادثات
          const formattedChat: PrivateChat = {
            id: data.chat.id,
            user1Id: data.chat.user1Id,
            user2Id: data.chat.user2Id,
            lastMessageAt: data.chat.lastMessageAt || new Date().toISOString(),
            createdAt: data.chat.createdAt || new Date().toISOString(),
            otherUser: data.otherUser,
            unreadCount: 0
          };
          
          // تحديث أو إضافة المحادثة إلى الكاش
          let updatedChats = [...currentChats];
          if (existingChatIndex >= 0) {
            // تحديث المحادثة الموجودة
            updatedChats[existingChatIndex] = formattedChat;
          } else {
            // إضافة المحادثة الجديدة في المقدمة
            updatedChats = [formattedChat, ...currentChats];
          }
          
          // ترتيب المحادثات حسب آخر نشاط
          updatedChats.sort((a, b) => 
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
          
          // تحديث كاش المحادثات
          queryClient.setQueryData(['/api/chat/private'], updatedChats);
          
          // جلب الرسائل للمحادثة الجديدة
          const messagesRes = await fetch(`/api/chat/private/${data.chat.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem("auth_token")}`
            }
          });
          
          if (messagesRes.ok) {
            const messagesData = await messagesRes.json();
            setMessages(messagesData.messages || []);
          }
          
          // الانضمام إلى المحادثة عبر الويب سوكت (آمن - userId يأتي من JWT)
          if (socket && user) {
            socket.emit('joinPrivateChat', {
              otherUserId: data.otherUser.id
            });
          }
        } catch (error) {
          console.error("خطأ في تحديث قائمة الدردشات:", error);
        }
      }
    }
  });
  
  // تصفية الدردشات حسب البحث
  const filteredChats = Array.isArray(privateChats) 
    ? privateChats.filter((chat: any) => 
        chat.otherUser && chat.otherUser.fullName && 
        chat.otherUser.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      ) 
    : [];
  
  // تنسيق التاريخ بشكل إنساني
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'غير محدد';
    try {
      // تحويل التوقيت من الخادم إلى تاريخ صحيح
      const serverDate = (dateString && typeof dateString === 'string' && dateString.includes && dateString.includes('T')) 
        ? dateString 
        : (typeof dateString === 'string' ? dateString.replace(' ', 'T') + 'Z' : dateString);
      const date = new Date(serverDate);
      const now = new Date();
      const diffMs = Math.abs(now.getTime() - date.getTime()); // استخدام القيمة المطلقة
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      
      console.log('تشخيص التوقيت:', {
        original: dateString,
        parsed: serverDate,
        date: date.toISOString(),
        now: now.toISOString(),
        diffMs,
        diffSeconds,
        diffMinutes,
        diffHours
      });
      
      if (diffSeconds < 10) {
        return "الآن";
      } else if (diffSeconds < 60) {
        return `منذ ${diffSeconds} ثانية`;
      } else if (diffMinutes < 60) {
        return `منذ ${diffMinutes} دقيقة`;
      } else if (diffHours < 24) {
        return `منذ ${diffHours} ساعة`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `منذ ${diffDays} يوم`;
      }
    } catch (error) {
      console.error('خطأ في تحليل التوقيت:', error, dateString);
      return dateString;
    }
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-0.5 sm:px-4 py-0.5 sm:py-4 rtl">
        <div className="flex justify-between items-center mb-1 sm:mb-4">
          <BackToDashboardButton />
          <h1 className="text-xs sm:text-2xl font-bold text-primary">المحادثات الخاصة</h1>
          <Button onClick={() => refetchChats()} variant="outline" size="sm" className="h-6 sm:h-8 px-1 sm:px-3">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
            تحديث
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-1 sm:gap-4">
          {/* قائمة المحادثات */}
          <Card className="lg:col-span-1 order-1 lg:order-1 min-h-fit">
            <CardHeader className="px-2 sm:px-6 py-2 sm:py-6 bg-primary/5">
              <CardTitle className="flex items-center justify-between text-sm sm:text-lg font-bold">
                <span className="text-primary">المحادثات</span>
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </CardTitle>
              <div className="relative">
                <Search className="h-3 w-3 sm:h-4 sm:w-4 absolute right-2 sm:right-3 top-2 sm:top-3 text-muted-foreground" />
                <Input
                  placeholder="البحث عن محادثة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-10 pr-2 sm:pr-3 text-right h-6 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="h-[200px] sm:h-[250px] lg:h-[250px] overflow-y-auto px-2 sm:px-6 py-1 sm:py-6">
              {/* نتائج البحث عن المستخدمين */}
              {searchQuery.length >= 2 && Array.isArray(searchResults) && searchResults.length > 0 && (
                <div className="mb-4 border-b pb-4">
                  <h3 className="font-bold mb-1 sm:mb-2 text-xs sm:text-sm text-primary">نتائج البحث</h3>
                  <div className="space-y-1 sm:space-y-2">
                    {(searchResults as any[]).map((user: any) => (
                      <div 
                        key={user.id}
                        className="p-1 sm:p-2 rounded-lg hover:bg-accent flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 ml-1 sm:ml-2">
                            <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium text-xs sm:text-sm">{user.fullName}</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-[10px] sm:text-xs h-6 sm:h-8 px-1 sm:px-3"
                          onClick={() => startChatMutation.mutate(user.id)}
                          disabled={startChatMutation.isPending}
                        >
                          {startChatMutation.isPending ? (
                            <RefreshCw className="h-2 w-2 sm:h-3 sm:w-3 animate-spin ml-1 sm:ml-2" />
                          ) : (
                            <MessageCircle className="h-2 w-2 sm:h-3 sm:w-3 ml-1 sm:ml-2" />
                          )}
                          بدء محادثة
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* قائمة الدردشات الحالية */}
              <h3 className="font-bold mb-2 sm:mb-2 text-sm sm:text-sm text-primary border-b pb-1">الدردشات الحالية</h3>
              {isLoadingChats ? (
                <div className="flex justify-center items-center h-full">
                  <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                </div>
              ) : filteredChats?.length ? (
                <Select value={selectedChatValue} onValueChange={handleChatSelect} dir="rtl">
                  <SelectTrigger className="w-full text-sm sm:text-sm h-10 sm:h-10 border-2 border-primary/20 hover:border-primary/40 bg-white">
                    <SelectValue placeholder="اختر محادثة">
                      {selectedChatValue && filteredChats.find((chat: any) => chat.id.toString() === selectedChatValue) ? (
                        <div className="flex items-center">
                          <Avatar className="h-5 w-5 sm:h-6 sm:w-6 ml-1 sm:ml-2">
                            <AvatarFallback className="text-[8px] sm:text-xs">
                              {filteredChats.find((chat: any) => chat.id.toString() === selectedChatValue)?.otherUser?.fullName?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs sm:text-sm">
                            {filteredChats.find((chat: any) => chat.id.toString() === selectedChatValue)?.otherUser?.fullName || 'مستخدم'}
                          </span>
                        </div>
                      ) : "اختر محادثة"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-[300px] z-50">
                    {filteredChats.map((chat: any) => (
                      <SelectItem key={chat.id} value={chat.id.toString()} className="text-sm sm:text-sm py-3 px-2 cursor-pointer">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <Avatar className="h-5 w-5 sm:h-6 sm:w-6 ml-1 sm:ml-2">
                              <AvatarFallback className="text-[8px] sm:text-xs">
                                {chat.otherUser?.fullName?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-xs sm:text-sm">{chat.otherUser?.fullName || 'مستخدم'}</div>
                              <div className="text-[9px] sm:text-xs text-muted-foreground">
                                {String(formatDate(chat.lastMessageAt))}
                              </div>
                            </div>
                          </div>
                          {chat.unreadCount > 0 && (
                            <Badge variant="secondary" className="bg-primary text-white text-[7px] sm:text-[9px] h-3 sm:h-4 px-1 sm:px-1.5 mr-1">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center text-muted-foreground py-6 sm:py-8 text-sm sm:text-sm border-2 border-dashed border-muted rounded-lg bg-muted/20">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">لا توجد محادثات</p>
                  <p className="text-xs mt-1">ابحث عن مستخدم لبدء محادثة جديدة</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* محتوى المحادثة */}
          <Card className="lg:col-span-3 order-2 lg:order-2">
            {chatId && otherUser ? (
              <>
                <CardHeader className="border-b px-2 sm:px-6 py-1 sm:py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        className="ml-1 sm:ml-2 p-0 h-6 w-6 sm:h-8 sm:w-8" 
                        onClick={() => {
                          setChatId(null);
                          setOtherUser(null);
                          setMessages([]);
                        }}
                      >
                        <ArrowLeft className="h-3 w-3 sm:h-5 sm:w-5" />
                      </Button>
                      <Avatar className="h-6 w-6 sm:h-8 sm:w-8 ml-1 sm:ml-2">
                        <AvatarFallback>{otherUser.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-sm sm:text-lg">{otherUser.fullName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {isSelectionMode ? (
                        // أزرار وضع التحديد
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={selectAllMessages}
                            title="تحديد جميع رسائلي"
                            disabled={messages.length === 0}
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
                            disabled={messages.length === 0}
                          >
                            <CheckSquare className="h-4 w-4 ml-1" />
                            اختيار
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleClearChat()}
                            title="تنظيف المحادثة (حذف جميع الرسائل من جهتك فقط)"
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            تنظيف
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[400px] sm:h-[600px] overflow-y-auto py-1 sm:py-4 px-1 sm:px-6">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm">ابدأ المحادثة مع {otherUser.fullName}</p>
                    </div>
                  ) : (
                    <div className="chat-container">
                      {messages.map((message) => {
                        // الحصول على معرف المستخدم الحالي بطريقة موثوقة
                        const currentUserId = getCurrentUserId();
                        if (!currentUserId) {
                          console.warn('⚠️ لم يتم العثور على معرف المستخدم');
                          return null;
                        }
                        
                        console.log('🔍 معرفات رئيسية قبل كل رسالة:', {
                          'المستخدم الحالي (currentUserId)': currentUserId,
                          'المستخدم الآخر (otherUser)': otherUser ? `${otherUser.fullName} (${otherUser.id})` : 'null',
                          'معرف المحادثة (chatId)': chatId,
                          'user.id': user?.id,
                          'user.fullName': user?.fullName,
                          '🚨 هل currentUserId == otherUser.id؟': currentUserId === otherUser?.id,
                          '🔍 رقم الرسالة الحالية': message.id
                        });
                        
                        const messageSenderId = Number(message.senderId);
                        const isUserMessage = messageSenderId === currentUserId;
                        
                        // تحقق إضافي للتأكد من صحة التحديد
                        if (messageSenderId === currentUserId && currentUserId === otherUser?.id) {
                          console.error('🚨 خطأ: currentUserId يساوي otherUser.id!', { currentUserId, otherUserId: otherUser?.id });
                        }
                        
                        // فحص إضافي لمشكلة معكوسة الهويات
                        if (currentUserId === otherUser?.id) {
                          console.error('🚨 خطأ خطير: currentUserId == otherUser.id! يجب أن يكونا مختلفين');
                          console.error('🚨 معلومات:', { 
                            currentUserId, 
                            'otherUser.id': otherUser?.id,
                            'otherUser.fullName': otherUser?.fullName,
                            'user.id': user?.id,
                            'user.fullName': user?.fullName
                          });
                        }
                        
                        // Debug مفصل مع تشخيص المشكلة
                        console.log(`📝 رسالة ${message.id}:`, {
                          'معرف الرسالة': message.id,
                          'مرسل الرسالة (senderId)': message.senderId,
                          'مرسل الرسالة (number)': messageSenderId,
                          'المستخدم الحالي': currentUserId,
                          'من المستخدم؟': isUserMessage,
                          'نص الرسالة': message.content.substring(0, 30) + '...',
                          'user object': user ? `موجود (${user.id})` : 'غير موجود',
                          'sessionStorage': sessionStorage.getItem('currentUserId'),
                          'body attribute': document.body.getAttribute('data-current-user-id'),
                          'otherUser': otherUser ? `${otherUser.fullName} (${otherUser.id})` : 'غير موجود',
                          'المقارنة': `${messageSenderId} === ${currentUserId} = ${messageSenderId === currentUserId}`
                        });
                        
                        if (!isUserMessage && !messageSenderId) {
                          console.warn('تحذير: senderId غير موجود في الرسالة', message);
                        }
                        const isEditing = editingMessageId === message.id;
                        
                        // تحقق من إمكانية تعديل الرسالة (رسائل المستخدم فقط وخلال 5 دقائق)
                        const messageTime = new Date(message.createdAt).getTime();
                        const currentTime = new Date().getTime();
                        const FIVE_MINUTES = 5 * 60 * 1000;
                        const canEdit = isUserMessage && (currentTime - messageTime <= FIVE_MINUTES);
                        
                        // يمكن اختيار جميع الرسائل (المرسلة والمستقبلة) للحذف بغض النظر عن العمر
                        const canSelect = true;
                        
                        // تسجيل للتشخيص
                        if (isSelectionMode) {
                          console.log(`رسالة قابلة للاختيار - ID: ${message.id}, محتوى: ${message.content.substring(0, 20)}, مختارة: ${selectedMessages.has(message.id)}, مرسل: ${isUserMessage ? 'نعم' : 'لا'}`);
                        }
                        
                        return (
                          <div
                            key={message.id}
                            className={`msg ${isUserMessage ? 'msg--out' : 'msg--in'} ${isSelectionMode ? 'items-center gap-2' : ''}`}
                            data-mine={isUserMessage ? "true" : "false"}
                            style={{
                              display: 'flex',
                              justifyContent: isUserMessage ? 'flex-end' : 'flex-start',
                              marginBottom: '8px'
                            }}
                          >
                            {/* checkbox للاختيار في وضع التحديد */}
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
                            
                            <div
                              className={`msg__bubble ${isSelectionMode && selectedMessages.has(message.id) ? 'ring-2 ring-primary' : ''}`}
                              style={{
                                backgroundColor: isUserMessage ? '#dcf8c6' : '#ffffff',
                                color: '#000000',
                                border: isUserMessage ? 'none' : '1px solid #e5e7eb',
                                borderRadius: '18px',
                                padding: '8px 12px',
                                maxWidth: '80%',
                                wordWrap: 'break-word',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                              }}
                              data-message-sender={messageSenderId}
                              data-current-user={currentUserId}
                              data-is-mine={isUserMessage}
                            >

                              {isEditing ? (
                                // وضع التعديل
                                <div className="mb-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className={`text-sm mb-2 w-full min-h-[80px] border-2 ${
                                      isUserMessage 
                                        ? 'bg-green-400 text-white placeholder:text-green-100 border-green-600' 
                                        : 'bg-yellow-300 text-black placeholder:text-yellow-700 border-yellow-600'
                                    }`}
                                    placeholder="أدخل رسالتك هنا..."
                                    dir="rtl"
                                  />
                                  <div className="flex justify-end space-x-2 space-x-reverse">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditing}
                                      className="text-xs h-7 border-gray-300 text-gray-300 hover:bg-gray-300/10"
                                    >
                                      إلغاء
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={saveMessageEdit}
                                      className="text-xs h-7 bg-green-600 hover:bg-green-700"
                                      disabled={!editContent.trim()}
                                    >
                                      حفظ التعديل
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // عرض عادي للمحتوى والمرفقات
                                <div>
                                  {/* عرض اسم المرسل */}
                                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #e5e7eb', paddingBottom: '2px' }}>
                                    {isUserMessage 
                                      ? `أنت (معرف: ${currentUserId}) - مرسل` 
                                      : `${otherUser?.fullName || 'مجهول'} (معرف: ${messageSenderId}) - مستقبل`
                                    }
                                    <span style={{ fontSize: '10px', marginLeft: '8px', color: isUserMessage ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                                      {isUserMessage ? '[✓ مرسل]' : '[← مستقبل]'}
                                    </span>
                                    <br />
                                    <span style={{ fontSize: '9px', color: '#9ca3af' }}>
                                      Debug: senderId={messageSenderId}, currentUserId={currentUserId}, isUser={isUserMessage ? 'true' : 'false'}
                                      {currentUserId === otherUser?.id && (
                                        <><br /><span style={{ color: '#dc2626', fontWeight: 'bold' }}>🚨 خطأ: currentUserId == otherUser.id!</span></>
                                      )}
                                    </span>
                                  </div>
                                  
                                  {/* مؤشر إعادة التوجيه */}
                                  {message.isForwarded && message.forwardedFromSender && (
                                    <div className="flex items-center mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-r-2 border-blue-400">
                                      <Share className="h-3 w-3 ml-2 text-blue-500" />
                                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                        🔄 إعادة توجيه من {message.forwardedFromSender}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* عرض محتوى الرسالة النصي */}
                                  {message.content && (
                                    <div className="text-sm mb-1">{message.content}</div>
                                  )}
                                  
                                  {/* عرض المرفقات إذا وجدت */}
                                  {message.fileUrl && (
                                    <div className="mt-1 mb-2">
                                      {message.fileType?.startsWith('image/') ? (
                                        // عرض الصور
                                        <div className="relative">
                                          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                            <img 
                                              src={message.fileUrl} 
                                              alt="صورة مرفقة" 
                                              className="max-w-full max-h-64 rounded-md object-cover" 
                                            />
                                          </a>
                                        </div>
                                      ) : message.fileType?.startsWith('video/') ? (
                                        // عرض الفيديو
                                        <div className="relative">
                                          <video controls className="max-w-full max-h-64 rounded-md">
                                            <source src={message.fileUrl} type={message.fileType} />
                                            المتصفح الخاص بك لا يدعم تشغيل الفيديو
                                          </video>
                                        </div>
                                      ) : message.fileType?.startsWith('audio/') ? (
                                        // عرض الصوت
                                        <div className="relative">
                                          <audio controls className="max-w-full">
                                            <source src={message.fileUrl} type={message.fileType} />
                                            المتصفح الخاص بك لا يدعم تشغيل الصوت
                                          </audio>
                                        </div>
                                      ) : (
                                        // عرض رابط تحميل للملفات الأخرى
                                        <a 
                                          href={message.fileUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center p-2 bg-muted rounded-md hover:bg-muted/80 text-primary"
                                        >
                                          {message.fileType?.includes('pdf') ? (
                                            <FileText className="h-4 w-4 ml-2" />
                                          ) : message.fileType?.includes('word') || message.fileType?.includes('document') ? (
                                            <FileText className="h-4 w-4 ml-2" />
                                          ) : message.fileType?.includes('spreadsheet') || message.fileType?.includes('excel') ? (
                                            <FileText className="h-4 w-4 ml-2" />
                                          ) : (
                                            <FileIcon className="h-4 w-4 ml-2" />
                                          )}
                                          <span className="text-xs">تحميل المرفق</span>
                                          <Download className="h-3 w-3 mr-1" />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="text-xs opacity-70 flex items-center justify-between">
                                <div className="flex items-center">
                                  {!isEditing && canEdit && isUserMessage && (
                                    <button
                                      onClick={() => startEditing(message)}
                                      className="text-xs hover:text-gray-300 ml-2 opacity-70 hover:opacity-100"
                                    >
                                      تعديل
                                    </button>
                                  )}
                                  
                                  {/* عرض زر الحذف للمرسل فقط */}
                                  {isUserMessage && (
                                    <button
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="text-xs hover:text-red-400 ml-2 opacity-70 hover:opacity-100 text-red-300"
                                      title="حذف الرسالة (سيتم حذفها للجميع)"
                                    >
                                      حذف
                                    </button>
                                  )}
                                  
                                  {/* زر المزيد */}
                                  <div className="relative">
                                    <button
                                      data-more-button={message.id}
                                      data-testid={`button-more-options-${message.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMoreOptions(showMoreOptions === message.id ? null : message.id);
                                      }}
                                      className="text-xs hover:text-gray-300 ml-2 opacity-70 hover:opacity-100 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                      title="المزيد من الخيارات"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>

                                    {/* قائمة خيارات المزيد */}
                                    {showMoreOptions === message.id && (
                                      <>
                                        {/* خلفية شفافة للهاتف المحمول */}
                                        <div 
                                          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] sm:hidden"
                                          onClick={() => setShowMoreOptions(null)}
                                        />
                                        <div 
                                          ref={moreOptionsRef}
                                          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-2 z-[9999] w-[250px] animate-in fade-in duration-200 sm:absolute sm:top-full sm:left-0 sm:transform-none sm:translate-x-0 sm:translate-y-0 sm:mt-1 sm:w-auto sm:min-w-[180px]"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                        {/* نسخ النص */}
                                        {message.content && (
                                          <button
                                            data-testid={`button-copy-text-${message.id}`}
                                            className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                                            onClick={() => copyMessageText(message)}
                                          >
                                            <Copy className="h-3 w-3 ml-2" />
                                            نسخ النص
                                          </button>
                                        )}
                                        
                                        {/* إعادة التوجيه */}
                                        <button
                                          data-testid={`button-forward-message-${message.id}`}
                                          className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                                          onClick={() => forwardMessage(message)}
                                        >
                                          <Share className="h-3 w-3 ml-2" />
                                          إعادة توجيه
                                        </button>
                                        
                                        {/* معلومات الرسالة */}
                                        <button
                                          data-testid={`button-message-info-${message.id}`}
                                          className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                                          onClick={() => showMessageInfo(message)}
                                        >
                                          <Info className="h-3 w-3 ml-2" />
                                          معلومات الرسالة
                                        </button>
                                        
                                        {/* إضافة للمفضلة */}
                                        <button
                                          data-testid={`button-add-favorites-${message.id}`}
                                          className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                                          onClick={() => addToFavorites(message)}
                                        >
                                          <Star className="h-3 w-3 ml-2" />
                                          إضافة للمفضلة
                                        </button>
                                        
                                        {/* الإبلاغ عن الرسالة - للرسائل من الآخرين فقط */}
                                        {!isUserMessage && (
                                          <button
                                            data-testid={`button-report-message-${message.id}`}
                                            className="w-full text-left px-2 py-1 text-xs hover:bg-red-50 hover:text-red-700 text-red-600 rounded flex items-center"
                                            onClick={() => reportMessage(message)}
                                          >
                                            <Flag className="h-3 w-3 ml-2" />
                                            إبلاغ
                                          </button>
                                        )}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                </div>
                                
                                <div className="msg__meta">
                                  <time>
                                    {message.isEdited && message.editedAt 
                                      ? `تم التعديل ${formatDate(message.editedAt || new Date().toISOString())}`
                                      : String(formatDate(message.createdAt || new Date().toISOString()))
                                    }
                                  </time>
                                  {isUserMessage && (
                                    <span title={message.isRead ? 'تمت القراءة' : 'تم الإرسال'}>
                                      {message.isRead ? '✓✓' : '✓'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t p-1 sm:p-2 flex-col">
                  {usersTyping.length > 0 && (
                    <div className="text-sm text-primary mb-2 bg-muted p-1 rounded-md text-right font-medium">
                      <span className="animate-pulse inline-block">⌨️</span> {usersTyping.join(", ")} {usersTyping.length === 1 ? "يكتب الآن..." : "يكتبون الآن..."}
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="w-full flex flex-col relative">
                    {/* عرض معلومات الملف المحدد */}
                    {selectedFile && (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md mb-2 w-full">
                        <div className="flex items-center">
                          <FileIcon className="h-4 w-4 ml-2" />
                          <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground mr-2">({Math.round(selectedFile.size / 1024)} كيلوبايت)</span>
                        </div>
                        <div className="flex">
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : uploadedFileInfo ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <>
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 px-2 ml-1" 
                                onClick={handleFileUpload}
                              >
                                <Upload className="h-3 w-3 ml-1" />
                                رفع
                              </Button>
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 px-2" 
                                onClick={handleCancelFileSelection}
                              >
                                <X className="h-3 w-3 ml-1" />
                                إلغاء
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* عرض معلومات الملف المرفوع */}
                    {!selectedFile && uploadedFileInfo && (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md mb-2 w-full">
                        <div className="flex items-center">
                          <Paperclip className="h-4 w-4 ml-2 text-primary" />
                          <span className="text-sm">تم تحميل الملف بنجاح</span>
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2" 
                          onClick={handleCancelFileSelection}
                        >
                          <X className="h-3 w-3 ml-1" />
                          إلغاء المرفق
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex w-full">
                      <div className="relative flex-1 ml-2">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="اكتب رسالتك هنا..."
                          className="pr-10 text-right"
                        />
                        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 flex">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0 ml-1"
                            onClick={() => setShowEmoji(!showEmoji)}
                          >
                            <Smile className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,video/mp4,audio/mp3"
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        disabled={(!inputMessage.trim() && !uploadedFileInfo) || isUploading}
                      >
                        <Send className="h-4 w-4 ml-2" />
                        إرسال
                      </Button>
                    </div>
                    
                    {showEmoji && (
                      <div 
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white rounded-md shadow-lg border-2 border-primary"
                        style={{ maxWidth: '95vw', maxHeight: '90vh' }}
                      >
                        <div className="flex justify-between items-center p-2 border-b bg-muted">
                          <h3 className="font-semibold text-primary">اختر رمزًا تعبيريًا</h3>
                          <button 
                            className="p-1 hover:bg-gray-200 rounded-full" 
                            onClick={() => setShowEmoji(false)}
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ padding: '8px' }}>
                          <EmojiPicker
                            theme={Theme.LIGHT}
                            onEmojiClick={(emojiData: EmojiClickData) => {
                              console.log("تم اختيار الإيموجي:", emojiData);
                              setInputMessage(prev => prev + emojiData.emoji);
                              setShowEmoji(false);
                            }}
                            lazyLoadEmojis={true}
                            searchPlaceHolder="ابحث عن رمز تعبيري..."
                            width={300}
                            height={400}
                            previewConfig={{ showPreview: false }}
                          />
                        </div>
                      </div>
                    )}
                  </form>
                </CardFooter>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 text-primary" />
                <h3 className="text-xl font-medium mb-2">لا توجد محادثة مفتوحة</h3>
                <p className="mb-4">اختر محادثة من القائمة للبدء</p>
              </div>
            )}
          </Card>
          
          {/* نافذة إعادة التوجيه */}
          {showForwardModal && messageToForward && (
            <>
              {/* خلفية شفافة */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
                onClick={() => setShowForwardModal(false)}
              />
              
              {/* نافذة الاختيار */}
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border z-[9999] w-[90vw] max-w-md max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b bg-muted">
                  <h3 className="font-semibold text-lg">إعادة توجيه الرسالة</h3>
                  <p className="text-sm text-muted-foreground mt-1">اختر محادثة لإعادة التوجيه إليها</p>
                </div>
                
                <div className="p-2 border-b bg-gray-50 dark:bg-gray-700">
                  <div className="bg-white dark:bg-gray-600 p-3 rounded border text-sm">
                    <div className="flex items-center mb-2">
                      <Share className="h-4 w-4 ml-2 text-blue-500" />
                      <span className="font-medium">معاينة الرسالة المراد توجيهها:</span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">
                      <strong>{messageToForward.senderName}:</strong>
                      <div className="mt-1">{messageToForward.content || (messageToForward.fileUrl ? "مرفق" : "رسالة فارغة")}</div>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-y-auto max-h-96">
                  {isLoadingChats ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin ml-2" />
                      <span>جاري تحميل المحادثات...</span>
                    </div>
                  ) : privateChats && privateChats.length > 0 ? (
                    privateChats
                      .filter((chat: PrivateChat) => chat.id !== chatId) // استبعاد المحادثة الحالية
                      .map((chat: PrivateChat) => (
                        <button
                          key={chat.id}
                          data-testid={`forward-chat-${chat.id}`}
                          className="w-full text-right px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 transition-colors"
                          onClick={() => handleForwardToChat(chat.id, chat.otherUser.fullName)}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center ml-3">
                              <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{chat.otherUser.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                آخر رسالة: {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true, locale: ar })}
                              </div>
                            </div>
                            {chat.unreadCount > 0 && (
                              <div className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {chat.unreadCount}
                              </div>
                            )}
                          </div>
                        </button>
                      ))
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد محادثات أخرى متاحة</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t bg-muted">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowForwardModal(false)}
                    data-testid="button-cancel-forward"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}