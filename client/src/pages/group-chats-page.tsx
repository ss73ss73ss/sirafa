import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Users, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Helmet } from "react-helmet";
import { Guard } from "@/components/Guard";
import { useEffect } from "react";
import { socketManager } from "@/lib/socket";

// نوع مجموعة الدردشة
interface GroupChat {
  id: number;
  name: string;
  description: string | null;
  creatorId: number;
  isPrivate: boolean;
  createdAt: string;
}

export default function GroupChatsPage() {
  return (
    <Guard page="group_chats">
      <GroupChatsContent />
    </Guard>
  );
}

function GroupChatsContent() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });

  // جلب بيانات المستخدم الحالي
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
  });

  // جلب مجموعات المحادثة الخاصة بالمستخدم
  const {
    data: userGroups,
    isLoading: isUserGroupsLoading,
    error: userGroupsError,
  } = useQuery({
    queryKey: ['/api/chat/groups'],
  });

  // إنشاء مجموعة محادثة جديدة
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof newGroup) => {
      const res = await apiRequest("/api/chat/group/create", "POST", groupData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في إنشاء المجموعة");
      }
      return await res.json();
    },
    onSuccess: () => {
      // تحديث قائمة المجموعات
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      
      // إعادة تعيين النموذج
      setNewGroup({
        name: "",
        description: "",
        isPrivate: false,
      });
      
      // إغلاق الحوار
      setCreateDialogOpen(false);
      
      toast({
        title: "تم إنشاء المجموعة بنجاح",
        description: "تم إنشاء مجموعة محادثة جديدة وإضافتك كمسؤول",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء المجموعة",
        description: error.message || "حدث خطأ أثناء إنشاء المجموعة",
      });
    },
  });

  // ترك المجموعة (للأعضاء العاديين)
  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest(`/api/chat/groups/${groupId}/leave`, "DELETE");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في ترك المجموعة");
      }
      return await res.json();
    },
    onSuccess: () => {
      // تحديث قائمة المجموعات
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      
      // إعادة تعيين معرف المجموعة
      setDeleteGroupId(null);
      
      toast({
        title: "تم ترك المجموعة بنجاح",
        description: "تم إزالتك من المجموعة",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ في ترك المجموعة",
        description: error.message || "حدث خطأ أثناء ترك المجموعة",
      });
      setDeleteGroupId(null);
    },
  });

  // حذف المجموعة نهائياً (لمؤسس المجموعة)
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest(`/api/chat/groups/${groupId}`, "DELETE");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في حذف المجموعة");
      }
      return await res.json();
    },
    onSuccess: () => {
      // تحديث قائمة المجموعات
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      
      // إعادة تعيين معرف المجموعة
      setDeleteGroupId(null);
      
      toast({
        title: "تم حذف المجموعة نهائياً",
        description: "تم حذف المجموعة وجميع رسائلها",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ في حذف المجموعة",
        description: error.message || "حدث خطأ أثناء حذف المجموعة",
      });
      setDeleteGroupId(null);
    },
  });

  // معالجة إنشاء مجموعة جديدة
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGroup.name.trim()) {
      toast({
        variant: "destructive",
        title: "حقل مطلوب",
        description: "يرجى إدخال اسم للمجموعة",
      });
      return;
    }
    
    createGroupMutation.mutate(newGroup);
  };

  // الانتقال إلى صفحة المجموعة
  const navigateToGroup = (groupId: number) => {
    // تصحيح المسار ليتماشى مع التعريف الجديد في ملف App.tsx
    navigate(`/group-chats/${groupId}`);
  };

  // التحقق من كون المستخدم مؤسس المجموعة
  const isGroupOwner = (group: GroupChat) => {
    // البيانات تأتي من الخادم بـ snake_case، لذا نتحقق من كلا الحقلين
    const creatorId = (group as any).creator_id || group.creatorId;
    return currentUser && currentUser.id && creatorId === currentUser.id;
  };

  // الحصول على نص الحذف المناسب
  const getDeleteText = (group: GroupChat) => {
    return isGroupOwner(group) ? "حذف المجموعة نهائياً" : "ترك المجموعة";
  };

  // الحصول على وصف الحذف المناسب
  const getDeleteDescription = (group: GroupChat) => {
    return isGroupOwner(group) 
      ? "هل أنت متأكد من حذف المجموعة نهائياً؟ سيتم حذف جميع الرسائل وإخراج جميع الأعضاء. هذا الإجراء لا يمكن التراجع عنه."
      : "هل أنت متأكد من ترك المجموعة؟ سيتم إزالتك من المجموعة ولن تتمكن من الوصول إلى رسائلها. هذا الإجراء لا يمكن التراجع عنه.";
  };

  // معالجة حذف/ترك المجموعة
  const handleDeleteGroup = (group: GroupChat) => {
    console.log(`🗑️ معالجة حذف/ترك المجموعة:`, {
      groupId: group.id,
      groupName: group.name,
      groupCreatorId: group.creatorId,
      currentUserId: currentUser?.id,
      isOwner: isGroupOwner(group),
      action: isGroupOwner(group) ? 'DELETE' : 'LEAVE'
    });
    
    if (isGroupOwner(group)) {
      console.log(`🔥 تنفيذ حذف المجموعة رقم ${group.id}`);
      deleteGroupMutation.mutate(group.id);
    } else {
      console.log(`👋 تنفيذ ترك المجموعة رقم ${group.id}`);
      leaveGroupMutation.mutate(group.id);
    }
  };

  // إعداد Socket.IO للاستماع لأحداث حذف المجموعات
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    // الاستماع لحدث حذف المجموعة
    const handleGroupDeleted = (data: { groupId: number; groupName: string; deletedBy: number }) => {
      console.log("🗑️ تم حذف مجموعة:", data);
      
      // تحديث قائمة المجموعات
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      
      // إظهار إشعار للمستخدم
      toast({
        title: "تم حذف مجموعة",
        description: `تم حذف المجموعة "${data.groupName}" من قبل مؤسسها`,
        variant: "destructive",
      });
    };

    socket.on('groupDeleted', handleGroupDeleted);

    // تنظيف عند إلغاء تركيب المكون
    return () => {
      socket.off('groupDeleted', handleGroupDeleted);
    };
  }, [toast]);

  return (
    <DashboardLayout>
      <Helmet>
        <title>محادثات المجموعات | منصة الصرافة</title>
        <meta name="description" content="محادثات المجموعات وإدارة عضوية المجموعات" />
      </Helmet>

      <div className="container py-6 max-w-screen-xl mx-auto">
        <div className="mb-4">
          <BackToDashboardButton />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">محادثات المجموعات</h1>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={18} className="ml-2" />
                إنشاء مجموعة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إنشاء مجموعة محادثة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل المجموعة الجديدة. سيتم إضافتك تلقائياً كمسؤول للمجموعة.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateGroup}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">اسم المجموعة *</Label>
                    <Input
                      id="name"
                      value={newGroup.name}
                      onChange={(e) =>
                        setNewGroup({ ...newGroup, name: e.target.value })
                      }
                      placeholder="أدخل اسم المجموعة"
                      dir="rtl"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">وصف المجموعة</Label>
                    <Textarea
                      id="description"
                      value={newGroup.description}
                      onChange={(e) =>
                        setNewGroup({ ...newGroup, description: e.target.value })
                      }
                      placeholder="أدخل وصفاً موجزاً للمجموعة"
                      dir="rtl"
                    />
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="isPrivate"
                      checked={newGroup.isPrivate}
                      onCheckedChange={(checked) =>
                        setNewGroup({
                          ...newGroup,
                          isPrivate: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="isPrivate" className="mr-2">
                      مجموعة خاصة (يمكن مشاهدتها من قبل الأعضاء فقط)
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      إلغاء
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={createGroupMutation.isPending}
                  >
                    {createGroupMutation.isPending ? "جاري الإنشاء..." : "إنشاء المجموعة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isUserGroupsLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="loader"></div>
          </div>
        ) : userGroupsError ? (
          <div className="text-center text-red-500 py-8">
            <p>حدث خطأ أثناء تحميل مجموعات المحادثة</p>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] })}
              className="mt-4"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : userGroups && Array.isArray(userGroups) && userGroups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">لا توجد مجموعات محادثة حالياً</h3>
            <p className="text-gray-500 mb-6">
              قم بإنشاء مجموعة جديدة للبدء في الدردشة مع مجموعة من المستخدمين
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus size={18} className="ml-2" />
              إنشاء مجموعة جديدة
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(userGroups) && userGroups.map((group: GroupChat) => (
              <Card key={group.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <div className={`text-xs px-2 py-1 rounded ${
                      group.isPrivate 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {group.isPrivate ? '🔒 خاصة' : '🌐 عامة'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {group.description || "لا يوجد وصف"}
                  </p>
                  
                  {/* نص توضيحي للمجموعات العامة */}
                  {!group.isPrivate && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start space-x-2 space-x-reverse">
                        <div className="text-green-600">ℹ️</div>
                        <div className="text-xs text-green-700 leading-relaxed">
                          <strong>مجموعة عامة:</strong> ستنضم تلقائياً عند زيارة المجموعة وتخرج عند مغادرة الصفحة
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center">
                      <Users size={16} className="ml-2" />
                      <span>عدد الأعضاء: جاري التحميل...</span>
                    </div>
                    {!group.isPrivate && (
                      <span className="text-xs text-green-600 font-medium">
                        الحد الأقصى: 100
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    <span>تم الإنشاء: {new Date(group.createdAt).toLocaleDateString("ar-LY")}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => navigateToGroup(group.id)}
                  >
                    <MessageSquare size={16} className="ml-2" />
                    الانضمام للمحادثة
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-group-${group.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد {getDeleteText(group)}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {getDeleteDescription(group).replace("{groupName}", group.name)}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteGroup(group)}
                          disabled={deleteGroupMutation.isPending || leaveGroupMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {(deleteGroupMutation.isPending || leaveGroupMutation.isPending) 
                            ? (isGroupOwner(group) ? "جاري الحذف..." : "جاري ترك المجموعة...") 
                            : getDeleteText(group)
                          }
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}