import { useEffect, useState, useRef, FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Send, Users, UserPlus, Smile, Pencil, Check, X, Paperclip, Trash2, CheckSquare, Square, UserMinus, Volume2, VolumeX, MoreVertical, UserCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Helmet } from "react-helmet";
import { io, Socket } from "socket.io-client";
import { useCustomToast } from "@/components/ui/custom-toast";
import { useDebugUser } from "@/hooks/use-debug-user";
import { useToast } from "@/hooks/use-toast";

// نوع رسالة المجموعة
interface GroupMessage {
  id: number;
  groupId: number;
  senderId: number;
  content: string;
  createdAt: string;
  senderName: string;
  isEdited?: boolean;
  editedAt?: string;
  fileUrl?: string | null;
  fileType?: string | null;
}

// Import types from shared schema
import type { GroupMember as SchemaGroupMember, GroupChat } from "@shared/schema";

// Extend GroupMember to include fullName from join
interface GroupMember extends SchemaGroupMember {
  fullName: string;
}

// نوع المستخدم المتاح للإضافة
interface AvailableUser {
  id: number;
  fullName: string;
}

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [_, navigate] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const { showMessage } = useCustomToast();
  const { toast } = useToast();
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [usersTyping, setUsersTyping] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editedMessageContent, setEditedMessageContent] = useState("");
  
  // متغيرات اختيار الرسائل للحذف
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // متغيرات للتعامل مع الملفات المرفقة
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{fileUrl: string, fileType: string} | null>(null);
  
  // حالة محلية للرسائل للتعامل مع التحديثات المحلية
  const [localMessages, setLocalMessages] = useState<GroupMessage[]>([]);
  
  // متابعة حالة الدخول التلقائي للمجموعات العامة
  const [hasJoinedAutomatically, setHasJoinedAutomatically] = useState(false);
  
  // تتبع الأعضاء المتصلين حالياً عبر Socket.IO
  const [onlineMembers, setOnlineMembers] = useState<{userId: number, fullName: string}[]>([]);
  
  // وظائف اختيار الرسائل للحذف المتعدد
  const toggleMessageSelection = (messageId: number) => {
    console.log("تبديل اختيار الرسالة (مجموعة):", messageId);
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
        console.log("تم إلغاء اختيار الرسالة (مجموعة):", messageId);
      } else {
        newSet.add(messageId);
        console.log("تم اختيار الرسالة (مجموعة):", messageId);
      }
      console.log("الرسائل المختارة حالياً (مجموعة):", Array.from(newSet));
      return newSet;
    });
  };

  const selectAllMessages = () => {
    // يمكن اختيار جميع الرسائل (المرسلة والمستقبلة)
    console.log("جميع الرسائل المتاحة للاختيار (مجموعة):", messages.length, messages.map(m => ({id: m.id, content: m.content.substring(0, 20), createdAt: m.createdAt, senderId: m.senderId})));
    const allMessageIds = new Set(messages.map(msg => msg.id));
    console.log("تحديد جميع الرسائل (مجموعة):", Array.from(allMessageIds));
    setSelectedMessages(allMessageIds);
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
    setIsSelectionMode(false);
  };

  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0 || !currentUserId || !groupId) return;
    
    const confirmed = window.confirm(`هل أنت متأكد من حذف ${selectedMessages.size} رسالة؟ سيتم حذفها نهائياً للجميع.`);
    if (!confirmed) return;
    
    try {
      const messageIds = Array.from(selectedMessages);
      
      for (const messageId of messageIds) {
        const authToken = localStorage.getItem('auth_token');
        const response = await fetch(`/api/chat/groups/${groupId}/messages/${messageId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("خطأ في حذف الرسالة:", errorData);
          throw new Error(errorData.message || "فشل حذف إحدى الرسائل");
        }
      }
      
      // إزالة الرسائل من الواجهة
      setLocalMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
      clearSelection();
      
      toast({
        title: "تم حذف الرسائل",
        description: `تم حذف ${messageIds.length} رسالة`,
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

  // دالة حذف الرسالة
  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟ سيتم حذفها نهائياً لجميع الأعضاء.")) {
      return;
    }
    
    try {
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chat/groups/${groupId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل حذف الرسالة");
      }
      
      toast({
        title: "تم حذف الرسالة",
        description: "تم حذف الرسالة بنجاح",
        variant: "default",
      });
      
      setLocalMessages(prev => prev.filter(msg => msg.id !== messageId));
      
    } catch (error) {
      console.error("خطأ في حذف الرسالة:", error);
      toast({
        title: "فشل حذف الرسالة",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    }
  };

  // إضافة وظيفة تحديث الرسائل
  const updateMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: number, content: string }) => {
      if (!groupId || !messageId || !content.trim()) {
        throw new Error("بيانات غير كاملة لتعديل الرسالة");
      }
      
      console.log("بدء تعديل الرسالة:", { messageId, content, groupId });
      
      try {
        // التأكد من أن المعرف رقم وليس سلسلة نصية
        const parsedGroupId = parseInt(groupId);
        
        const res = await apiRequest(
          "PUT", 
          `/api/chat/groups/${parsedGroupId}/messages/${messageId}`, 
          { content }
        );
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("رد الخطأ من الخادم:", errorData);
          throw new Error(errorData.message || "فشل تعديل الرسالة");
        }
        
        console.log("استجابة تعديل الرسالة:", res.status);
        const responseData = await res.json();
        console.log("بيانات الاستجابة:", responseData);
        return responseData;
      } catch (err) {
        console.error("استثناء أثناء تعديل الرسالة:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("تم تعديل الرسالة بنجاح:", data);
      setEditingMessageId(null); // إغلاق حالة التعديل
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/messages`] });
      showMessage("تم تحديث الرسالة بنجاح");
    },
    onError: (error: any) => {
      console.error("خطأ في تحديث الرسالة:", error);
      showMessage(error.message || "حدث خطأ أثناء تحديث الرسالة");
    }
  });
  
  // استخدام أداة تشخيص بيانات المستخدم
  useDebugUser();

  // الحصول على معرف المستخدم الحالي
  const getUserId = () => {
    try {
      // محاولة الحصول على المعرف من الرمز المميز (JWT) أولاً
      const token = localStorage.getItem("auth_token");
      if (token) {
        // استخراج الجزء الأوسط من JWT وفك تشفيره
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = parts[1];
          try {
            const decodedPayload = JSON.parse(atob(payload));
            if (decodedPayload && (decodedPayload.id || decodedPayload.userId)) {
              return Number(decodedPayload.id || decodedPayload.userId) || null;
            }
          } catch (decodeError) {
            console.error("خطأ في فك تشفير JWT payload:", decodeError);
          }
        }
      }
      
      // كبديل، حاول localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        return Number(parsedUser.id) || null;
      }
      
      return null;
    } catch (error) {
      console.error("خطأ في الحصول على معرف المستخدم:", error);
      return null;
    }
  };
  
  // جلب بيانات المستخدم من الـ API
  const {
    data: userData,
    isLoading: isUserLoading,
  } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  // الحصول على اسم المستخدم الحالي
  const getUserName = () => {
    try {
      // أولاً، محاولة الحصول على الاسم من بيانات الـ API
      if (userData && userData.fullName) {
        return userData.fullName;
      }
      
      // ثانياً، محاولة الحصول على الاسم من الرمز المميز (JWT)
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            const payload = parts[1];
            const decodedPayload = JSON.parse(atob(payload));
            if (decodedPayload && decodedPayload.fullName) {
              return decodedPayload.fullName;
            }
          }
        } catch (jwtError) {
          console.error("خطأ في فك تشفير JWT لجلب الاسم:", jwtError);
        }
      }
      
      // محاولة الحصول على البيانات من localStorage
      const localUserData = localStorage.getItem("user");
      if (localUserData) {
        const parsedUserData = JSON.parse(localUserData);
        if (parsedUserData && parsedUserData.fullName) {
          return parsedUserData.fullName;
        }
      }
      
      // قيمة افتراضية
      return "مستخدم غير معرف";
    } catch (error) {
      console.error("خطأ في الحصول على اسم المستخدم:", error);
      return "مستخدم غير معرف";
    }
  };
  
  const currentUserId = getUserId();

  // جلب معلومات المجموعة
  const {
    data: group,
    isLoading: isGroupLoading,
    error: groupError,
  } = useQuery({
    queryKey: ['/api/chat/groups', groupId],
    enabled: !!groupId,
    retry: false,
  });

  // جلب رسائل المجموعة
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: [`/api/chat/groups/${groupId}/messages`],
    enabled: !!groupId,
    refetchOnWindowFocus: false,
  });

  // تحديث الرسائل المحلية عند تحديث البيانات من الخادم
  useEffect(() => {
    if (messagesData && Array.isArray(messagesData)) {
      setLocalMessages(messagesData);
    }
  }, [messagesData]);

  // استخدام الرسائل المحلية بدلاً من البيانات المباشرة
  const messages = localMessages;

  // جلب أعضاء المجموعة
  const {
    data: members,
    isLoading: isMembersLoading,
    error: membersError,
  } = useQuery({
    queryKey: [`/api/chat/groups/${groupId}/members`],
    enabled: !!groupId,
    refetchOnWindowFocus: false,
  });

  // جلب المستخدمين المتاحين للإضافة
  const {
    data: availableUsers,
    isLoading: isAvailableUsersLoading,
  } = useQuery({
    queryKey: ['/api/users/available'],
    enabled: addMemberDialogOpen,
  });

  // تم إزالة الكود المكرر تفاديًا للتعارض
  
  // تمرير للأسفل عند إضافة رسائل جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // دخول تلقائي للمجموعات العامة + خروج تلقائي عند المغادرة
  useEffect(() => {
    if (!group || !groupId || !currentUserId || group.isPrivate) return;


    // دخول تلقائي للمجموعة العامة
    const autoJoinPublicGroup = async () => {
      try {
        console.log(`🌐 محاولة الدخول التلقائي للمجموعة العامة ${groupId}`);
        
        const response = await apiRequest(
          `/api/chat/groups/${groupId}/auto-join`,
          "POST",
          {}
        );

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ نتيجة الدخول التلقائي:`, result);
          
          if (result.joined) {
            setHasJoinedAutomatically(true);
            showMessage(`تم الانضمام للمجموعة تلقائياً (${result.memberCount} عضو)`, false);
            
            // تحديث قائمة الأعضاء
            queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
          } else if (result.memberCount !== undefined) {
            // المستخدم بالفعل عضو في المجموعة العامة، يجب الخروج التلقائي عند المغادرة
            setHasJoinedAutomatically(true);
            console.log(`📝 المستخدم بالفعل عضو في المجموعة العامة - سيتم الخروج التلقائي عند المغادرة`);
          }
        } else {
          const error = await response.json();
          if (error.memberCount !== undefined) {
            console.log(`⚠️ المجموعة ممتلئة: ${error.memberCount} عضو`);
          }
        }
      } catch (error: any) {
        console.error("خطأ في الدخول التلقائي:", error);
      }
    };


    // تنفيذ الدخول التلقائي
    autoJoinPublicGroup();

    // cleanup function للخروج التلقائي عند مغادرة الصفحة
    return () => {
      console.log(`🧹 تشغيل cleanup function - hasJoinedAutomatically: ${hasJoinedAutomatically}, groupId: ${groupId}, currentUserId: ${currentUserId}`);
      
      if (!hasJoinedAutomatically) {
        console.log(`⏹️ لا يوجد انضمام تلقائي للخروج منه`);
        return;
      }
      
      console.log(`👋 بدء الخروج التلقائي من المجموعة العامة ${groupId}`);
      
      (async () => {
        try {
          await apiRequest(
            `/api/chat/groups/${groupId}/members/${currentUserId}`,
            "DELETE"
          );
          
          console.log(`✅ تم الخروج التلقائي بنجاح من المجموعة ${groupId}`);
          // لا نستطيع استدعاء setHasJoinedAutomatically هنا لأن المكون قد يكون unmounted
        } catch (error: any) {
          console.error("❌ خطأ في الخروج التلقائي:", error);
        }
      })();
    };
  }, [group, groupId, currentUserId]);
  
  // إغلاق محرر الرسالة عند النقر خارجه
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingMessageId !== null) {
        // تحقق مما إذا كان النقر خارج منطقة التحرير
        const isClickOnEditor = (event.target as Element).closest('.message-editor');
        const isClickOnEditButton = (event.target as Element).closest('.edit-button');
        const isClickOnActionButton = (event.target as Element).closest('.message-actions');
        
        console.log('حالة النقر:', { 
          isEditor: !!isClickOnEditor, 
          isEditBtn: !!isClickOnEditButton,
          isActionBtn: !!isClickOnActionButton,
          target: (event.target as HTMLElement).tagName,
          clickedElement: (event.target as HTMLElement).className
        });
        
        if (!isClickOnEditor && !isClickOnEditButton && !isClickOnActionButton) {
          console.log('إغلاق محرر الرسالة لأن النقر كان خارج المناطق المسموح بها');
          setEditingMessageId(null);
        }
      }
    };
    
    console.log(`تسجيل مستمع النقر خارج المحرر ${editingMessageId ? 'مفعل' : 'غير مفعل'}`);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingMessageId]);

  // إعداد اتصال Socket.IO لتلقي التحديثات
  useEffect(() => {
    if (!groupId) return;

    console.log("محاولة إعداد Socket.IO للتحديثات...");
    
    // الحصول على JWT token من localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ لا يوجد token للاتصال بـ Socket.IO');
      return;
    }
    
    const newSocket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      auth: {
        token: token
      }
    });
    
    const joinGroup = () => {
      const normalizedGroupId = Number(groupId);
      console.log("📥 طلب الانضمام لغرفة المجموعة:", normalizedGroupId);
      
      newSocket.emit('joinGroupChat', normalizedGroupId, (ack?: unknown) => {
        console.log("✅ تأكيد انضمام للمجموعة:", ack);
      });
    };

    const leaveGroup = () => {
      const normalizedGroupId = Number(groupId);
      console.log("📤 طلب مغادرة غرفة المجموعة:", normalizedGroupId);
      newSocket.emit('leaveGroupChat', normalizedGroupId);
    };

    newSocket.on('connect', () => {
      console.log("✅ تم الاتصال بخادم Socket.IO للتحديثات:", newSocket.id);
      setIsConnected(true);
      
      // انتظار قليل للتأكد من تأسيس الاتصال ثم الانضمام
      setTimeout(() => {
        joinGroup();
      }, 100);
    });

    newSocket.on('disconnect', (reason) => {
      console.log("❌ انقطع الاتصال بخادم التحديثات، السبب:", reason);
      setIsConnected(false);
      
      // محاولة إعادة الاتصال التلقائي
      setTimeout(() => {
        if (!newSocket.connected) {
          console.log("🔄 محاولة إعادة الاتصال التلقائي...");
          newSocket.connect();
        }
      }, 2000);
    });

    // عند إعادة الاتصال
    newSocket.on('reconnect', () => {
      console.log("🔄 تم إعادة الاتصال - الانضمام مرة أخرى للمجموعة");
      setTimeout(() => {
        joinGroup();
      }, 100);
    });
    
    newSocket.on('newGroupMessage', (data: any) => {
      console.log("تم استلام رسالة جديدة:", data);
      
      if (data && data.groupId === parseInt(groupId)) {
        queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/messages`] });
      }
    });

    // الاستماع لتحديثات الأعضاء المتصلين
    newSocket.on('groupJoined', (data: { success: boolean; roomSize: number; groupId: number }) => {
      console.log("✅ تأكيد انضمام للمجموعة:", data);
      
      if (data.groupId === parseInt(groupId)) {
        // طلب قائمة الأعضاء المتصلين الحالية
        newSocket.emit('getOnlineMembers', { groupId: parseInt(groupId) });
      }
    });

    // استقبال قائمة الأعضاء المتصلين
    newSocket.on('onlineMembers', (data: { groupId: number; members: {userId: number, fullName: string}[] }) => {
      console.log("📋 استلام قائمة الأعضاء المتصلين:", data);
      
      if (data.groupId === parseInt(groupId)) {
        setOnlineMembers(data.members);
      }
    });

    // عندما ينضم عضو جديد
    newSocket.on('memberJoinedGroup', (data: { groupId: number; userId: number; fullName: string }) => {
      console.log("👋 عضو جديد انضم:", data);
      
      if (data.groupId === parseInt(groupId)) {
        setOnlineMembers(prev => {
          const isAlreadyOnline = prev.some(member => member.userId === data.userId);
          if (!isAlreadyOnline) {
            return [...prev, { userId: data.userId, fullName: data.fullName }];
          }
          return prev;
        });
      }
    });

    // عندما يغادر عضو
    newSocket.on('memberLeftGroup', (data: { groupId: number; userId: number }) => {
      console.log("👋 عضو غادر:", data);
      
      if (data.groupId === parseInt(groupId)) {
        setOnlineMembers(prev => prev.filter(member => member.userId !== data.userId));
      }
    });

    // استقبال تحديثات قائمة الأعضاء المتصلين (التحديث الشامل)
    newSocket.on('onlineMembersUpdate', (data: { groupId: number; members: {userId: number, fullName: string}[] }) => {
      console.log("📋 تحديث شامل لقائمة الأعضاء المتصلين:", data);
      
      if (data.groupId === parseInt(groupId)) {
        setOnlineMembers(data.members);
      }
    });
    
    // الاستماع لأحداث الرسائل المعدلة
    newSocket.on('updatedGroupMessage', (data: any) => {
      console.log("تم استلام رسالة معدلة:", data);
      
      if (data && data.groupId === parseInt(groupId)) {
        // إذا كنا نقوم بتعديل هذه الرسالة حاليًا، قم بإغلاق وضع التعديل
        if (editingMessageId === data.id) {
          setEditingMessageId(null);
        }
        
        // تحديث البيانات
        queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/messages`] });
        
        // عرض رسالة تأكيد إذا كان المستخدم هو من قام بالتعديل
        if (data.senderId === currentUserId) {
          showMessage("تم تحديث الرسالة بنجاح");
        }
      }
    });
    
    // الاستماع لأحداث الكتابة مع تشخيص مكثف
    console.log("🎧 تسجيل مستمع userTyping...");
    newSocket.on('userTyping', (data: { userId: number; userName: string; roomType: string; roomId: number }) => {
      console.log("🔥🔥🔥 تم استلام حدث userTyping:", data);
      console.log("📍 Socket.IO ID:", newSocket.id);
      console.log("🌐 Socket connected?", newSocket.connected);
      console.log("معرف المجموعة الحالي:", groupId, typeof groupId);
      console.log("معرف المستخدم الحالي:", currentUserId, typeof currentUserId);
      console.log("شروط التحقق التفصيلية:", {
        "Number(data.userId)": Number(data.userId),
        "Number(currentUserId)": Number(currentUserId),
        "مقارنة المعرفات": Number(data.userId) !== Number(currentUserId),
        "roomType === 'group'": data.roomType === 'group', 
        "data.roomId": data.roomId,
        "parseInt(groupId)": parseInt(groupId),
        "مقارنة الغرف": data.roomId === parseInt(groupId),
        "النتيجة النهائية": Number(data.userId) !== Number(currentUserId) && data.roomType === 'group' && data.roomId === parseInt(groupId)
      });
      
      // تحقق من الشروط مع تطبيع الأرقام
      if (Number(data.userId) !== Number(currentUserId) && data.roomType === 'group' && data.roomId === parseInt(groupId)) {
        console.log("✅ تم استيفاء شروط إضافة مستخدم للكتابة");
        setUsersTyping(prev => {
          console.log("📊 القائمة الحالية قبل الإضافة:", prev);
          if (!prev.includes(data.userName)) {
            console.log("✅ إضافة مستخدم يكتب الآن:", data.userName);
            const newArray = [...prev, data.userName];
            console.log("✅ القائمة الجديدة للكتابة:", newArray);
            return newArray;
          } else {
            console.log("⚠️ المستخدم موجود بالفعل في قائمة الكتابة:", data.userName);
            console.log("⚠️ القائمة الحالية:", prev);
            // تأكد من إضافة المستخدم حتى لو كان موجود (لمعالجة أخطاء التزامن)
            const newArray = Array.from(new Set([...prev, data.userName]));
            console.log("🔄 القائمة المحدثة بعد إزالة التكرار:", newArray);
            return newArray;
          }
        });
      } else {
        console.log("❌ لم يتم استيفاء شروط إضافة مستخدم للكتابة");
      }
    });
    
    // الاستماع لأحداث التوقف عن الكتابة مع تشخيص مكثف
    console.log("🎧 تسجيل مستمع userStoppedTyping...");
    newSocket.on('userStoppedTyping', (data: { userId: number; userName: string; roomType: string; roomId: number }) => {
      console.log("🔥🔥🔥 تم استلام حدث userStoppedTyping:", data);
      
      // تحقق من الشروط مع تطبيع الأرقام (مطابق للتغيير في حدث الكتابة)
      if (Number(data.userId) !== Number(currentUserId) && data.roomType === 'group' && data.roomId === parseInt(groupId)) {
        console.log("✅ تم استيفاء شروط إزالة مستخدم من الكتابة");
        setUsersTyping(prev => {
          console.log("✅ إزالة مستخدم توقف عن الكتابة:", data.userName);
          const newArray = prev.filter(name => name !== data.userName);
          console.log("✅ القائمة الجديدة بعد الإزالة:", newArray);
          return newArray;
        });
      } else {
        console.log("❌ لم يتم استيفاء شروط إزالة مستخدم من الكتابة");
      }
    });

    // === Socket.IO Event Handlers للإدارة ===
    
    // الاستماع لأحداث كتم الأعضاء
    newSocket.on('memberMuted', (data: { groupId: number; userId: number; mutedBy: number; mutedUntil: Date | null; reason?: string }) => {
      console.log("🔇 تم كتم عضو:", data);
      
      if (data.groupId === parseInt(groupId)) {
        // تحديث قائمة الأعضاء
        queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
        
        // إظهار رسالة للمستخدم المكتوم
        if (data.userId === currentUserId) {
          showMessage("تم كتمك في هذه المجموعة", true);
        }
      }
    });

    // الاستماع لأحداث إلغاء كتم الأعضاء
    newSocket.on('memberUnmuted', (data: { groupId: number; userId: number; unmutedBy: number }) => {
      console.log("🔊 تم إلغاء كتم عضو:", data);
      
      if (data.groupId === parseInt(groupId)) {
        // تحديث قائمة الأعضاء
        queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
        
        // إظهار رسالة للمستخدم الذي تم إلغاء كتمه
        if (data.userId === currentUserId) {
          showMessage("تم إلغاء كتمك في هذه المجموعة", false);
        }
      }
    });

    // الاستماع لأحداث حظر الأعضاء
    newSocket.on('memberBanned', (data: { groupId: number; userId: number; bannedBy: number; reason?: string }) => {
      console.log("🚫 تم حظر عضو:", data);
      
      if (data.groupId === parseInt(groupId)) {
        // تحديث قائمة الأعضاء
        queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
        
        // إظهار رسالة للمستخدم المحظور
        if (data.userId === currentUserId) {
          showMessage("تم حظرك من هذه المجموعة نهائياً", true);
        }
      }
    });

    // الاستماع لأحداث إلغاء حظر الأعضاء
    newSocket.on('memberUnbanned', (data: { groupId: number; userId: number; unbannedBy: number }) => {
      console.log("✅ تم إلغاء حظر عضو:", data);
      
      if (data.groupId === parseInt(groupId)) {
        // تحديث قائمة الأعضاء
        queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
        
        // إظهار رسالة للمستخدم الذي تم إلغاء حظره
        if (data.userId === currentUserId) {
          showMessage("تم إلغاء حظرك من هذه المجموعة", false);
        }
      }
    });

    // الاستماع لحدث حذف المجموعة نهائياً
    newSocket.on('groupDeleted', (data: { groupId: number; groupName: string; deletedBy: number }) => {
      console.log("🗑️ تم حذف المجموعة نهائياً:", data);
      
      if (data.groupId === parseInt(groupId)) {
        showMessage(`تم حذف هذه المجموعة نهائياً من قبل مؤسسها`, true);
        
        // توجيه المستخدم لصفحة المجموعات بعد ثانيتين
        setTimeout(() => {
          navigate("/group-chats");
        }, 2000);
      }
    });

    // الاستماع لأحداث حذف الأعضاء
    newSocket.on('memberRemoved', (data: { groupId: number; userId: number; removedBy: number }) => {
      console.log("👋 تم حذف عضو:", data);
      
      if (data.groupId === parseInt(groupId)) {
        // تحديث قائمة الأعضاء
        queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
      }
    });

    // الاستماع لحدث الحذف الشخصي من المجموعة
    newSocket.on('removedFromGroup', (data: { groupId: number; removedBy: number }) => {
      console.log("🚫 تم حذفك من المجموعة:", data);
      
      if (data.groupId === parseInt(groupId)) {
        showMessage("تم حذفك من هذه المجموعة", true);
        // توجيه المستخدم للصفحة الرئيسية
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    });

    // الاستماع لأحداث فشل إرسال الرسائل للمكتومين
    newSocket.on('messageSendFailed', (data: { error: string; groupId: number; isMuted?: boolean }) => {
      console.log("❌ فشل إرسال الرسالة:", data);
      
      if (data.groupId === parseInt(groupId)) {
        showMessage(data.error, true);
        
        // إذا كان المستخدم مكتوماً، تحديث واجهة المستخدم
        if (data.isMuted) {
          queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
        }
      }
    });

    setSocket(newSocket);

    return () => {
      // إرسال حدث توقف الكتابة قبل قطع الاتصال
      newSocket.emit('stopTyping', { 
        roomType: 'group', 
        roomId: parseInt(groupId), 
        userId: currentUserId,
        userName: getUserName() 
      });
      newSocket.disconnect();
    };
  }, [groupId, queryClient, currentUserId]);

  // معالج إغلاق المتصفح أو مغادرة الصفحة
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket && socket.connected && groupId) {
        // مغادرة المجموعة قبل إغلاق المتصفح
        socket.emit('leaveGroupChat', parseInt(groupId));
        
        // إرسال حدث توقف الكتابة
        socket.emit('stopTyping', { 
          roomType: 'group', 
          roomId: parseInt(groupId), 
          userId: currentUserId,
          userName: getUserName() 
        });
        
        console.log("🚪 تم إرسال طلب مغادرة المجموعة قبل إغلاق المتصفح");
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socket, groupId, currentUserId]);

  // معالجة أحداث الكتابة
  useEffect(() => {
    if (!socket || !groupId || !currentUserId) return;
    
    // إلغاء المؤقت السابق أولاً
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    
    if (newMessage.trim()) {
      // إرسال حدث "يكتب الآن"
      socket.emit('typing', { 
        roomType: 'group', 
        roomId: parseInt(groupId), 
        userId: currentUserId, 
        userName: getUserName() 
      });
      
      // إعداد مؤقت جديد للتوقف عن الكتابة بعد 3 ثوانٍ
      const newTimeout = setTimeout(() => {
        if (socket && socket.connected) {
          socket.emit('stopTyping', { 
            roomType: 'group', 
            roomId: parseInt(groupId), 
            userId: currentUserId,
            userName: getUserName()
          });
        }
        setTypingTimeout(null);
      }, 3000);
      
      setTypingTimeout(newTimeout);
    } else {
      // إرسال حدث التوقف عن الكتابة فورا عند مسح النص
      if (socket && socket.connected) {
        socket.emit('stopTyping', { 
          roomType: 'group', 
          roomId: parseInt(groupId), 
          userId: currentUserId,
          userName: getUserName()
        });
      }
    }
  }, [newMessage, socket, groupId, currentUserId]);

  // معالجة اختيار الملف
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // رفع الملف إلى السيرفر
  const handleFileUpload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!selectedFile) {
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

  // إرسال رسالة جديدة باستخدام HTTP API
  const sendMessage = async () => {
    // التأكد من وجود النص والمعرفات
    const messageText = newMessage.trim();
    if (messageText === "" && !uploadedFileInfo) {
      showMessage("لا يمكن إرسال رسالة فارغة", true);
      return;
    }
    
    // التحقق من وجود معرف المجموعة
    if (!groupId) {
      showMessage("معرف المجموعة غير متوفر", true);
      return;
    }
    
    // عدم الحاجة للتحقق من معرف المستخدم هنا لأن الخادم سيستخدم توكن المصادقة للتعرف على المستخدم

    console.log("محاولة إرسال رسالة:", messageText);

    try {
      // الطريقة المباشرة باستخدام fetch بدلاً من apiRequest للتشخيص
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.log("❌ توكن المصادقة غير موجود، يرجى تسجيل الدخول مرة أخرى");
        showMessage("خطأ في المصادقة - يرجى تسجيل الدخول مرة أخرى", true);
        return;
      } else {
        console.log("✅ توكن المصادقة موجود:", token.substring(0, 15) + "...");
      }
      
      // إنشاء بيانات الرسالة مع المرفقات إن وجدت
      const messageData = {
        content: messageText,
        fileUrl: uploadedFileInfo?.fileUrl || null,
        fileType: uploadedFileInfo?.fileType || null
      };
      
      // إرسال الرسالة باستخدام fetch مباشرة مع إضافة التوكن
      console.log("🔄 جاري إرسال الرسالة عبر API...");
      console.log("🔶 بيانات الرسالة:", messageData);
      
      const response = await fetch(`/api/chat/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });
      
      console.log("✅ تم استلام استجابة الخادم:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في إرسال الرسالة");
      }
      
      console.log("✅ تم إرسال الرسالة بنجاح");
      
      // مسح حقل الإدخال والمرفقات
      setNewMessage("");
      setSelectedFile(null);
      setUploadedFileInfo(null);
      
      // تحديث قائمة الرسائل
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/messages`] });
      
      // التمرير للأسفل
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error: any) {
      // تسجيل الخطأ في وحدة التحكم
      console.error("خطأ أثناء إرسال الرسالة:", error);
      
      // استخدام نسخة مبسطة من toast لتجنب المشكلة
      const errorMessage = error.message || "حدث خطأ أثناء محاولة إرسال الرسالة";
      console.log("رسالة الخطأ:", errorMessage);
      
      // استخدام showMessage بدلاً من toast لتجنب المشكلة
      showMessage("فشل إرسال الرسالة: " + errorMessage, true);
    }
  };

  // معالجة إضافة عضو جديد
  const handleAddMember = async () => {
    if (!selectedUserId || !groupId) {
      showMessage("يرجى اختيار مستخدم لإضافته", true);
      return;
    }

    try {
      const res = await apiRequest(
        `/api/chat/groups/${groupId}/members`,
        "POST",
        { memberId: selectedUserId, role: "member" }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في إضافة العضو");
      }

      // تحديث قائمة الأعضاء
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
      
      showMessage("تمت إضافة العضو الجديد إلى المجموعة بنجاح", false);
      
      setAddMemberDialogOpen(false);
      setSelectedUserId(null);
    } catch (error: any) {
      showMessage(error.message || "حدث خطأ أثناء إضافة العضو", true);
    }
  };

  // دوال إدارة الأعضاء (الكتم والحذف)
  const handleMuteMember = async (memberId: number, memberName: string) => {
    if (!groupId) return;

    const durationMinutes = prompt(
      `لكم دقيقة تريد كتم ${memberName}؟\n(اترك فارغاً للكتم نهائياً)`, 
      "60"
    );

    if (durationMinutes === null) return; // المستخدم ألغى العملية

    const duration = durationMinutes === "" ? null : parseInt(durationMinutes);

    try {
      const res = await apiRequest(
        `/api/chat/groups/${groupId}/members/${memberId}/mute`,
        "POST",
        { 
          durationMinutes: duration,
          reason: `كتم من قبل مدير المجموعة`
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في كتم العضو");
      }

      showMessage(`تم كتم ${memberName} بنجاح`, false);
      
      // تحديث قائمة الأعضاء
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
      
    } catch (error: any) {
      showMessage(error.message || "حدث خطأ أثناء كتم العضو", true);
    }
  };

  const handleUnmuteMember = async (memberId: number, memberName: string) => {
    if (!groupId) return;

    try {
      const res = await apiRequest(
        `/api/chat/groups/${groupId}/members/${memberId}/unmute`,
        "POST",
        {}
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في إلغاء كتم العضو");
      }

      showMessage(`تم إلغاء كتم ${memberName} بنجاح`, false);
      
      // تحديث قائمة الأعضاء
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
      
    } catch (error: any) {
      showMessage(error.message || "حدث خطأ أثناء إلغاء كتم العضو", true);
    }
  };

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!groupId) return;

    if (!confirm(`هل أنت متأكد من حذف ${memberName} من المجموعة؟`)) {
      return;
    }

    try {
      const res = await apiRequest(
        `/api/chat/groups/${groupId}/members/${memberId}`,
        "DELETE"
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في حذف العضو");
      }

      showMessage(`تم حذف ${memberName} من المجموعة بنجاح`, false);
      
      // تحديث قائمة الأعضاء
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
      
    } catch (error: any) {
      showMessage(error.message || "حدث خطأ أثناء حذف العضو", true);
    }
  };

  // دوال الحظر
  const handleBanMember = async (memberId: number, memberName: string) => {
    if (!groupId) return;

    const reason = prompt(
      `سبب حظر ${memberName}؟\n(اختياري)`,
      "انتهاك قوانين المجموعة"
    );

    if (reason === null) return; // المستخدم ألغى العملية

    if (!confirm(`هل أنت متأكد من حظر ${memberName}؟\nالحظر يمنع العضو نهائياً من المشاركة في المجموعة.`)) {
      return;
    }

    try {
      const res = await apiRequest(
        `/api/chat/groups/${groupId}/members/${memberId}/ban`,
        "POST",
        { reason: reason || "غير محدد" }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في حظر العضو");
      }

      showMessage(`تم حظر ${memberName} بنجاح`, false);
      
      // تحديث قائمة الأعضاء
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
      
    } catch (error: any) {
      showMessage(error.message || "حدث خطأ أثناء حظر العضو", true);
    }
  };

  const handleUnbanMember = async (memberId: number, memberName: string) => {
    if (!groupId) return;

    if (!confirm(`هل أنت متأكد من إلغاء حظر ${memberName}؟`)) {
      return;
    }

    try {
      const res = await apiRequest(
        `/api/chat/groups/${groupId}/members/${memberId}/unban`,
        "POST",
        {}
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في إلغاء حظر العضو");
      }

      showMessage(`تم إلغاء حظر ${memberName} بنجاح`, false);
      
      // تحديث قائمة الأعضاء
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
      
    } catch (error: any) {
      showMessage(error.message || "حدث خطأ أثناء إلغاء حظر العضو", true);
    }
  };

  // التحقق مما إذا كان المستخدم الحالي هو مسؤول المجموعة (مالك أو مدير)
  const isAdmin = Array.isArray(members) && members.some(
    (member: GroupMember) => 
      ((member as any).user_id === currentUserId || member.userId === currentUserId) && 
      (member.role === "admin" || member.role === "owner")
  );
  

  // تنسيق رسائل المجموعة (الأحدث في الأسفل) مع تحويل أسماء الحقول من snake_case إلى camelCase
  const formattedMessages = Array.isArray(messages) 
    ? [...messages].reverse().map(msg => ({
        id: msg.id,
        groupId: msg.group_id !== undefined ? msg.group_id : msg.groupId,
        senderId: msg.sender_id !== undefined ? msg.sender_id : msg.senderId,
        content: msg.content,
        createdAt: msg.created_at !== undefined ? msg.created_at : msg.createdAt,
        senderName: msg.sender_name !== undefined ? msg.sender_name : msg.senderName,
        isEdited: msg.is_edited !== undefined ? msg.is_edited : (msg.isEdited || false),
        editedAt: msg.edited_at !== undefined ? msg.edited_at : msg.editedAt,
        fileUrl: msg.file_url !== undefined ? msg.file_url : msg.fileUrl,
        fileType: msg.file_type !== undefined ? msg.file_type : msg.fileType
      }))
    : [];

  if (isGroupLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="loader"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>{group?.name || "مجموعة محادثة"} | منصة الصرافة</title>
        <meta name="description" content={`محادثة جماعية - ${group?.name || ""}`} />
      </Helmet>

      <div className="container py-6 max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* معلومات المجموعة وقائمة الأعضاء */}
          <div className="lg:col-span-1">
            <Card className="p-4 mb-4">
              <h2 className="text-xl font-bold mb-2">{group?.name || "مجموعة"}</h2>
              {group?.description && (
                <p className="text-gray-600 mb-4">{group.description}</p>
              )}
              <div className="flex items-center space-x-2 mb-2">
                <Users size={18} />
                <span className="text-sm mr-2">
                  {Array.isArray(members) ? members.length : 0} عضو
                </span>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={() => navigate("/")}
                >
                  العودة إلى لوحة التحكم
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">الأعضاء</h3>
                {isAdmin && (
                  <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <UserPlus size={16} className="ml-2" />
                        إضافة عضو
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>إضافة عضو جديد</DialogTitle>
                        <DialogDescription>
                          اختر مستخدماً لإضافته إلى المجموعة
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Select
                          value={selectedUserId?.toString() || ""}
                          onValueChange={(value) => setSelectedUserId(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مستخدماً" />
                          </SelectTrigger>
                          <SelectContent>
                            {isAvailableUsersLoading ? (
                              <SelectItem value="loading" disabled>
                                جاري التحميل...
                              </SelectItem>
                            ) : (
                              availableUsers && Array.isArray(availableUsers) && availableUsers
                                .filter((user: AvailableUser) => 
                                  !members?.some((member: GroupMember) => member.userId === user.id)
                                )
                                .map((user: AvailableUser) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.fullName}
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-3">
                        <DialogClose asChild>
                          <Button variant="outline">إلغاء</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleAddMember}>
                          إضافة
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* قسم الموجودين الآن */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  الموجودين الآن ({onlineMembers.length})
                </h4>
                {onlineMembers.length > 0 ? (
                  <div className="space-y-1">
                    {onlineMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-2 p-1 text-sm"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-700">{member.fullName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">لا يوجد أعضاء متصلين حالياً</p>
                )}
              </div>

              <hr className="my-3" />

              {isMembersLoading ? (
                <div className="flex justify-center p-4">
                  <div className="loader"></div>
                </div>
              ) : (
                <ScrollArea className="h-[250px] pr-4">
                  <div className="space-y-2">
                    {Array.isArray(members) && members.map((member: GroupMember) => {
                      const memberUserId = member.userId || (member as any).user_id;
                      const canManageMember = isAdmin && memberUserId !== currentUserId && member.role !== "owner";
                      const isMuted = member.mutedUntil && new Date(member.mutedUntil) > new Date();
                      
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <span>{member.fullName}</span>
                            {member.role === "admin" && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                مدير
                              </span>
                            )}
                            {member.role === "owner" && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                مالك
                              </span>
                            )}
                            {isMuted && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex items-center gap-1">
                                <VolumeX className="h-3 w-3" />
                                مكتوم
                              </span>
                            )}
                          </div>
                          
                          {canManageMember && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  data-testid={`member-actions-${memberUserId}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                {isMuted ? (
                                  <DropdownMenuItem 
                                    onClick={() => handleUnmuteMember(memberUserId, member.fullName)}
                                    className="text-green-600 hover:text-green-700"
                                    data-testid={`unmute-member-${memberUserId}`}
                                  >
                                    <Volume2 className="h-4 w-4 ml-2" />
                                    إلغاء الكتم
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleMuteMember(memberUserId, member.fullName)}
                                    className="text-orange-600 hover:text-orange-700"
                                    data-testid={`mute-member-${memberUserId}`}
                                  >
                                    <VolumeX className="h-4 w-4 ml-2" />
                                    كتم العضو
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {/* أزرار الحظر */}
                                {(member as any).is_banned ? (
                                  <DropdownMenuItem 
                                    onClick={() => handleUnbanMember(memberUserId, member.fullName)}
                                    className="text-blue-600 hover:text-blue-700"
                                    data-testid={`unban-member-${memberUserId}`}
                                  >
                                    <UserCheck className="h-4 w-4 ml-2" />
                                    إلغاء الحظر
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleBanMember(memberUserId, member.fullName)}
                                    className="text-purple-600 hover:text-purple-700"
                                    data-testid={`ban-member-${memberUserId}`}
                                  >
                                    <ShieldOff className="h-4 w-4 ml-2" />
                                    حظر العضو نهائياً
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveMember(memberUserId, member.fullName)}
                                  className="text-red-600 hover:text-red-700"
                                  data-testid={`remove-member-${memberUserId}`}
                                >
                                  <UserMinus className="h-4 w-4 ml-2" />
                                  حذف من المجموعة
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </Card>
          </div>

          {/* منطقة المحادثة */}
          <div className="lg:col-span-3 flex flex-col h-[calc(100vh-220px)]">
            {/* رأس المحادثة مع أزرار التحكم */}
            <div className="border-b bg-white rounded-t-lg">
              <div className="flex items-center justify-between p-4">
                <h3 className="font-bold text-lg">{group?.name || "محادثة المجموعة"}</h3>
              <div className="flex items-center gap-2">
                {isSelectionMode ? (
                  // أزرار وضع التحديد
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllMessages}
                      title="تحديد جميع رسائلي"
                      disabled={formattedMessages.filter(msg => msg.senderId === currentUserId).length === 0}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSelectionMode(true)}
                    title="اختيار رسائل للحذف"
                    disabled={formattedMessages.filter(msg => msg.senderId === currentUserId).length === 0}
                  >
                    <CheckSquare className="h-4 w-4 ml-1" />
                    اختيار
                  </Button>
                )}
              </div>
              </div>
              
              {/* مؤشر الانضمام التلقائي للمجموعات العامة */}
              {group && !group.isPrivate && (
                <div className="px-4 py-3 bg-green-50 border-t border-green-200">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-green-700">
                    <div className="flex-shrink-0">🌐</div>
                    <div>
                      <strong>مجموعة عامة:</strong> تم انضمامك تلقائياً إلى هذه المجموعة. 
                      ستخرج منها تلقائياً عند مغادرة هذه الصفحة.
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Card className="flex-1 mb-4 p-4 overflow-hidden border-t-0 rounded-t-none">
              {isMessagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="loader"></div>
                </div>
              ) : formattedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="mb-2">لا توجد رسائل بعد</p>
                  <p>كن أول من يبدأ المحادثة في هذه المجموعة</p>
                </div>
              ) : (
                <ScrollArea className="h-full pr-4">
                  <div className="chat-container">
                    {formattedMessages.map((message: GroupMessage) => {
                      // تأكد من أن الرسائل المرسلة من المستخدم الحالي تظهر على اليمين دائماً
                      const userIdNum = Number(currentUserId);
                      const senderIdNum = Number(message.senderId);
                      const isCurrentUserMessage = senderIdNum === userIdNum;
                      console.log(`معرف المرسل (مجموعة): ${senderIdNum}, معرف المستخدم: ${userIdNum}, هل رسالة المستخدم: ${isCurrentUserMessage}`);
                      
                      return (
                      <div
                        key={message.id}
                        className={`msg ${isCurrentUserMessage ? 'msg--out' : 'msg--in'} ${isSelectionMode ? 'items-center gap-2' : ''} group`}
                        data-mine={isCurrentUserMessage}
                      >
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
                        
                        <div
                          className={`msg__bubble ${isSelectionMode && selectedMessages.has(message.id) ? 'ring-2 ring-primary' : ''}`}
                        >
                          {message.senderId !== currentUserId && (
                            <div className="font-bold text-sm text-gray-600 mb-1">
                              {message.senderName}
                            </div>
                          )}
                          
                          {editingMessageId === message.id ? (
                            <div className="flex flex-col gap-2 message-editor">
                              <Input
                                value={editedMessageContent}
                                onChange={(e) => setEditedMessageContent(e.target.value)}
                                className={`text-sm border ${
                                  message.senderId === currentUserId
                                    ? "bg-blue-400 text-white placeholder-blue-100"
                                    : "bg-white text-gray-900"
                                }`}
                                dir="rtl"
                              />
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={`h-6 w-6 ${
                                    message.senderId === currentUserId
                                      ? "text-white hover:bg-blue-400"
                                      : "text-gray-600 hover:bg-gray-200"
                                  }`}
                                  onClick={() => {
                                    if (editedMessageContent.trim()) {
                                      updateMessageMutation.mutate({
                                        messageId: message.id,
                                        content: editedMessageContent
                                      });
                                      setEditingMessageId(null);
                                    }
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={`h-6 w-6 ${
                                    message.senderId === currentUserId
                                      ? "text-white hover:bg-blue-400"
                                      : "text-gray-600 hover:bg-gray-200"
                                  }`}
                                  onClick={() => {
                                    setEditingMessageId(null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm relative">
                              {message.content}

                              
                              {/* عرض الملفات المرفقة */}
                              {message.fileUrl && (
                                <div className="mt-2 p-2 border rounded-md bg-gray-50">
                                  {message.fileType?.startsWith('image/') ? (
                                    <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                      <img 
                                        src={message.fileUrl} 
                                        alt="صورة مرفقة" 
                                        className="max-w-full h-auto max-h-40 rounded-md" 
                                      />
                                    </a>
                                  ) : message.fileType?.startsWith('video/') ? (
                                    <video 
                                      controls 
                                      className="max-w-full h-auto max-h-40 rounded-md">
                                      <source src={message.fileUrl} type={message.fileType} />
                                      متصفحك لا يدعم تشغيل الفيديو
                                    </video>
                                  ) : (
                                    <a 
                                      href={message.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                    >
                                      <Paperclip className="h-4 w-4" />
                                      <span>تنزيل الملف المرفق</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="msg__meta">
                            <time>
                              {message.isEdited && message.editedAt ? (
                                `تم التعديل ${new Date(message.editedAt).toLocaleTimeString("ar-LY", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              ) : (
                                new Date(message.createdAt).toLocaleTimeString("ar-LY", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              )}
                            </time>
                            
                            {message.senderId === currentUserId && !editingMessageId && (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={`h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity edit-button ${
                                    message.senderId === currentUserId
                                      ? "text-white hover:bg-blue-400"
                                      : "text-gray-600 hover:bg-gray-200"
                                  }`}
                                  onClick={() => {
                                    setEditingMessageId(message.id);
                                    setEditedMessageContent(message.content);
                                  }}
                                  title="تعديل الرسالة"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-400"
                                  onClick={() => handleDeleteMessage(message.id)}
                                  title="حذف الرسالة (سيتم حذفها للجميع)"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )})}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </Card>

            <div className="flex flex-col gap-2">
              {/* عرض المستخدمين الذين يكتبون حاليا */}
              <div className="px-4 mb-1">
                {usersTyping.length > 0 ? (
                  <div className="text-sm text-primary p-2 rounded-md text-right font-medium bg-blue-100 border border-blue-200">
                    <span className="animate-pulse inline-block">⌨️</span> {usersTyping.join(", ")} {usersTyping.length === 1 ? "يكتب الآن..." : "يكتبون الآن..."}
                  </div>
                ) : (
                  <div className="h-8 text-xs opacity-60 flex items-center justify-end px-2">
                    {console.log("حالة usersTyping:", JSON.stringify(usersTyping))}
                    لا يوجد أحد يكتب حالياً
                  </div>
                )}
              </div>
              
              {/* منطقة اختيار وعرض الملف المرفق */}
              {selectedFile && !uploadedFileInfo && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md mb-2">
                  <div className="flex-1 truncate">
                    <span className="font-semibold text-sm">الملف المحدد: </span>
                    <span className="text-sm">{selectedFile.name}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleFileUpload}
                      disabled={isUploading}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isUploading ? 'جارٍ التحميل...' : 'تحميل الملف'}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCancelFileSelection}
                      disabled={isUploading}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
              
              {/* عرض معلومات الملف الذي تم تحميله */}
              {uploadedFileInfo && (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md mb-2">
                  <div className="flex-1 truncate">
                    <span className="font-semibold text-sm">تم تحميل الملف بنجاح</span>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCancelFileSelection}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    إلغاء المرفق
                  </Button>
                </div>
              )}

              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <Input
                    placeholder="اكتب رسالتك هنا..."
                    value={newMessage}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewMessage(value);
                      
                      // إرسال حدث الكتابة إذا كان المستخدم يكتب
                      if (socket && value.trim().length > 0) {
                        // إلغاء المؤقت السابق إن وجد
                        if (typingTimeout) {
                          clearTimeout(typingTimeout);
                        }
                        
                        // إرسال حدث أن المستخدم يكتب
                        socket.emit('typing', {
                          userId: getUserId(),
                          userName: getUserName(),
                          roomType: 'group',
                          roomId: parseInt(groupId)
                        });
                        
                        // تعيين مؤقت جديد للتوقف عن الكتابة بعد 2 ثانية
                        const timeout = setTimeout(() => {
                          if (socket) {
                            socket.emit('stopTyping', {
                              userId: getUserId(),
                              userName: getUserName(),
                              roomType: 'group',
                              roomId: parseInt(groupId)
                            });
                          }
                        }, 2000);
                        
                        setTypingTimeout(timeout);
                      } else if (socket && value.trim().length === 0) {
                        // إذا كان النص فارغاً، إرسال حدث التوقف عن الكتابة
                        socket.emit('stopTyping', {
                          userId: getUserId(),
                          userName: getUserName(),
                          roomType: 'group',
                          roomId: parseInt(groupId)
                        });
                        
                        if (typingTimeout) {
                          clearTimeout(typingTimeout);
                          setTypingTimeout(null);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    dir="rtl"
                    className="pl-10"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-1 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowEmoji(!showEmoji)}
                  >
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
                
                {/* زر إضافة الملفات */}
                <Button 
                  type="button"
                  size="icon"
                  variant="outline"
                  className="mr-1"
                  title="إرفاق ملف"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip size={18} />
                </Button>
                
                {/* حقل إدخال الملف (مخفي) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                <Button 
                  onClick={() => sendMessage()} 
                  size="icon"
                  title="إرسال"
                >
                  <Send size={18} />
                </Button>
              </div>
              
              {/* منتقي الرموز التعبيرية */}
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
                        setNewMessage(prev => prev + emojiData.emoji);
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
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}