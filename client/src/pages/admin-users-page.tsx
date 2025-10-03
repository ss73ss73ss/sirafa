import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { convertToWesternNumerals } from "@/lib/number-utils";
import AdminLayout from "@/components/admin-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Edit, Bell, Trash, Ban, Wallet, BarChart, RefreshCw, CheckCircle, XCircle, Trash2, MessageSquare, Eye, Printer } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// شيمات المدخلات للنماذج
const editUserSchema = z.object({
  fullName: z.string().min(3, "الاسم يجب أن يكون أطول من 3 أحرف"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().min(10, "رقم الهاتف يجب أن يتكون من 10 أرقام على الأقل"),
  city: z.string().optional(),
  type: z.enum(["user", "agent", "admin"]),
  adminLevel: z.number().optional(),
  // الصلاحيات التفصيلية
  canManageUsers: z.boolean().optional(),
  canManageMarket: z.boolean().optional(),
  canManageChat: z.boolean().optional(),
  canManageInternalTransfers: z.boolean().optional(),
  canManageExternalTransfers: z.boolean().optional(),
  canManageNewAccounts: z.boolean().optional(),
  canManageSecurity: z.boolean().optional(),
  canManageSupport: z.boolean().optional(),
  canManageReports: z.boolean().optional(),
  canManageSettings: z.boolean().optional(),
});

const notifyUserSchema = z.object({
  subject: z.string().min(3, "العنوان يجب أن يكون أطول من 3 أحرف"),
  message: z.string().min(5, "الرسالة يجب أن تكون أطول من 5 أحرف"),
});

const topupSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "الرجاء إدخال قيمة صحيحة أكبر من صفر",
  }),
  currency: z.string().min(1, "الرجاء اختيار العملة"),
});

const accountSearchSchema = z.object({
  account_number: z.string().min(5, "رقم الحساب يجب أن يتكون من 5 أرقام على الأقل"),
});

const externalTransferLimitSchema = z.object({
  extDailyLimit: z.string().min(1, "يجب إدخال الحد اليومي"),
  extMonthlyLimit: z.string().min(1, "يجب إدخال الحد الشهري"),
  extAllowedCurrencies: z.array(z.string()).min(1, "يجب اختيار عملة واحدة على الأقل"),
});

export default function AdminUsersPageNew() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // التحقق من أن المستخدم الحالي هو مدير عام
  const isSuperAdmin = currentUser?.type === 'admin' && (currentUser as any)?.adminLevel === 2;
  
  // التحقق من الصلاحيات التفصيلية
  const canManageUsers = (currentUser as any)?.canManageUsers || false;
  
  // التحقق من صلاحية الوصول لهذه الصفحة
  if (currentUser && currentUser.type === 'admin' && !isSuperAdmin && !canManageUsers) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50" dir="rtl">
          <div className="text-center space-y-4">
            <div className="text-6xl">🚫</div>
            <h1 className="text-2xl font-bold text-gray-800">ليس لديك صلاحية للوصول لهذه الصفحة</h1>
            <p className="text-gray-600">تحتاج لصلاحية إدارة المستخدمين للوصول لهذا القسم</p>
            <BackToDashboardButton />
          </div>
        </div>
      </AdminLayout>
    );
  }


  
  // حالات للنوافذ المنبثقة والبيانات
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; userId?: number }>({ show: false });
  const [userToEdit, setUserToEdit] = useState<any | null>(null);
  const [userToNotify, setUserToNotify] = useState<any | null>(null);
  const [userToAction, setUserToAction] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"topup" | "withdraw" | null>(null);
  const [userToViewLogs, setUserToViewLogs] = useState<any | null>(null);
  const [userToRaiseExternalLimit, setUserToRaiseExternalLimit] = useState<any | null>(null);
  const [topupData, setTopupData] = useState<{ amount: string; currency: string }>({ amount: "", currency: "LYD" });
  const [searchTerm, setSearchTerm] = useState("");
  
  // حالات البحث والحذف للأنشطة
  const [activitiesSearchTerm, setActivitiesSearchTerm] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [selectAllActivities, setSelectAllActivities] = useState(false);

  // تنظيف التحديد عند تغيير البحث
  useEffect(() => {
    setSelectedActivities([]);
    setSelectAllActivities(false);
  }, [activitiesSearchTerm]);
  
  // استعلام لجلب قائمة المستخدمين
  const {
    data: usersData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/users", 'GET');
      return await res.json();
    },
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });
  
  // التأكد من وجود البيانات
  const users = usersData?.users || [];
  
  // نموذج تحرير بيانات المستخدم
  const editForm = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      city: "",
      type: "user",
    },
  });
  
  // نموذج إشعار المستخدم
  const notifyForm = useForm<z.infer<typeof notifyUserSchema>>({
    resolver: zodResolver(notifyUserSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  // نموذج للبحث برقم الحساب
  const accountSearchForm = useForm<z.infer<typeof accountSearchSchema>>({
    resolver: zodResolver(accountSearchSchema),
    defaultValues: {
      account_number: "",
    },
  });
  
  // نموذج الإيداع/سحب
  const topupForm = useForm<z.infer<typeof topupSchema>>({
    resolver: zodResolver(topupSchema),
    defaultValues: {
      amount: "",
      currency: "LYD",
    },
  });

  // نموذج رفع سقف التحويل الخارجي
  const externalTransferLimitForm = useForm<z.infer<typeof externalTransferLimitSchema>>({
    resolver: zodResolver(externalTransferLimitSchema),
    defaultValues: {
      extDailyLimit: "",
      extMonthlyLimit: "",
      extAllowedCurrencies: ["USD", "EUR", "LYD"],
    },
  });
  
  // تحديث بيانات النموذج عند اختيار مستخدم للتحرير
  useEffect(() => {
    if (userToEdit) {
      editForm.reset({
        fullName: userToEdit.fullName || "",
        email: userToEdit.email || "",
        phone: userToEdit.phone || "",
        city: userToEdit.city || "",
        type: userToEdit.type || "user",
        adminLevel: userToEdit.adminLevel || 1,
        // الصلاحيات التفصيلية
        canManageUsers: userToEdit.canManageUsers || false,
        canManageMarket: userToEdit.canManageMarket || false,
        canManageChat: userToEdit.canManageChat || false,
        canManageInternalTransfers: userToEdit.canManageInternalTransfers || false,
        canManageExternalTransfers: userToEdit.canManageExternalTransfers || false,
        canManageNewAccounts: userToEdit.canManageNewAccounts || false,
        canManageSecurity: userToEdit.canManageSecurity || false,
        canManageSupport: userToEdit.canManageSupport || false,
        canManageReports: userToEdit.canManageReports || false,
        canManageSettings: userToEdit.canManageSettings || false,
      });
    }
  }, [userToEdit, editForm]);
  
  // حالة الاستعلام لجلب سجل أنشطة المستخدم
  const {
    data: userActivities,
    isLoading: isLoadingActivities,
    refetch: refetchActivities
  } = useQuery({
    queryKey: userToViewLogs?.id ? [`/api/admin/users/${userToViewLogs.id}/activities`] : ['activities-disabled'],
    enabled: !!userToViewLogs?.id,
    staleTime: 0, // تعطيل cache
    gcTime: 0, // تعطيل cache (TanStack Query v5)
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
  
  // تغيير حالة المستخدم (تفعيل/تعطيل)
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: number; active: boolean }) => {
      const response = await apiRequest(`/api/admin/users/${userId}/toggle-status`, 'POST', { isActive: active });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "فشل في تحديث حالة المستخدم");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التحديث",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // حذف مستخدم
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, 'DELETE');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "فشل في حذف المستخدم");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم الحذف",
        description: data.message,
      });
      setConfirmDelete({ show: false });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // تحديث بيانات المستخدم
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number; userData: any }) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, 'PUT', userData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "فشل في تحديث بيانات المستخدم");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التحديث",
        description: data.message,
      });
      setUserToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // إرسال إشعار للمستخدم
  const notifyUserMutation = useMutation({
    mutationFn: async ({ userId, notification, accountNumber }: { userId?: number; notification: any; accountNumber?: string }) => {
      let response;
      
      if (accountNumber) {
        response = await apiRequest("/api/admin/notify-by-account", "POST", {
          account_number: accountNumber,
          subject: notification.subject,
          message: notification.message
        });
      } else if (userId) {
        response = await apiRequest(`/api/admin/users/${userId}/notify`, 'POST', notification);
      } else {
        throw new Error("لم يتم تحديد معرف المستخدم أو رقم الحساب");
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "فشل في إرسال الإشعار");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم الإرسال",
        description: data.message,
      });
      setUserToNotify(null);
      notifyForm.reset();
      accountSearchForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // إيداع رصيد للمستخدم
  const topupMutation = useMutation({
    mutationFn: async ({ userId, amount, currency }: { userId: number; amount: string; currency: string }) => {
      const response = await apiRequest("/api/admin/topup", "POST", {
        account_number: userId.toString(),  // استخدام معرف المستخدم كرقم حساب
        amount, 
        currency 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "فشل في إيداع الرصيد");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم الإيداع",
        description: data.message,
      });
      setUserToAction(null);
      setActionType(null);
      topupForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // سحب رصيد من المستخدم
  const withdrawMutation = useMutation({
    mutationFn: async ({ userId, amount, currency }: { userId: number; amount: string; currency: string }) => {
      const response = await apiRequest("/api/admin/withdraw", "POST", {
        user_id: userId, 
        amount, 
        currency 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "فشل في سحب الرصيد");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم السحب",
        description: data.message,
      });
      setUserToAction(null);
      setActionType(null);
      topupForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // رفع سقف التحويل الخارجي للوكلاء
  const raiseExternalTransferLimitMutation = useMutation({
    mutationFn: async ({ userId, limits }: { userId: number; limits: z.infer<typeof externalTransferLimitSchema> }) => {
      const response = await apiRequest(`/api/admin/users/${userId}/raise-external-transfer-limit`, "PATCH", limits);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "فشل في رفع سقف التحويل الخارجي");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم تحديث السقف",
        description: data.message,
      });
      setUserToRaiseExternalLimit(null);
      externalTransferLimitForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("غير مصرح به") || error.message.includes("401") 
        ? "يجب تسجيل الدخول كمدير للوصول لهذه الميزة. يرجى إعادة تسجيل الدخول بحساب مدير."
        : error.message;
        
      toast({
        title: "خطأ في تحديث سقف التحويل",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  // تصفية المستخدمين حسب البحث
  const filteredUsers = users.filter((user: any) => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(searchTermLower) ||
      user.email?.toLowerCase().includes(searchTermLower) ||
      user.phone?.toLowerCase().includes(searchTermLower) ||
      user.accountNumber?.toLowerCase().includes(searchTermLower) ||
      user.city?.toLowerCase().includes(searchTermLower) ||
      user.type?.toLowerCase().includes(searchTermLower)
    );
  });
  
  // التعامل مع تقديم نموذج التحرير
  const handleEditSubmit = (values: z.infer<typeof editUserSchema>) => {
    if (!userToEdit?.id) return;
    
    updateUserMutation.mutate({
      userId: userToEdit.id,
      userData: values
    });
  };

  // التعامل مع تقديم نموذج رفع سقف التحويل الخارجي
  const handleRaiseExternalLimitSubmit = (values: z.infer<typeof externalTransferLimitSchema>) => {
    if (!userToRaiseExternalLimit?.id) return;
    
    raiseExternalTransferLimitMutation.mutate({ 
      userId: userToRaiseExternalLimit.id, 
      limits: values 
    });
  };
  
  // التعامل مع تقديم نموذج الإشعار
  const handleNotifySubmit = (values: z.infer<typeof notifyUserSchema>) => {
    if (userToNotify?.id) {
      notifyUserMutation.mutate({
        userId: userToNotify.id,
        notification: values
      });
    } else if (userToNotify?.phone) {
      notifyUserMutation.mutate({
        accountNumber: userToNotify.phone,
        notification: values
      });
    }
  };
  
  // التعامل مع تقديم نموذج البحث برقم الحساب
  const handleAccountSearchSubmit = (values: z.infer<typeof accountSearchSchema>) => {
    setUserToNotify({ phone: values.account_number });
  };
  
  // التعامل مع تقديم نموذج الإيداع/السحب
  const handleTopupSubmit = (values: z.infer<typeof topupSchema>) => {
    if (!userToAction?.id || !actionType) return;
    
    if (actionType === "topup") {
      topupMutation.mutate({
        userId: userToAction.id,
        amount: values.amount,
        currency: values.currency
      });
    } else if (actionType === "withdraw") {
      withdrawMutation.mutate({
        userId: userToAction.id,
        amount: values.amount,
        currency: values.currency
      });
    }
  };

  // دالة فلترة الأنشطة حسب البحث
  const getFilteredActivities = () => {
    if (!(userActivities as any)?.activities) return [];
    
    if (!activitiesSearchTerm.trim()) {
      return (userActivities as any).activities;
    }

    return (userActivities as any).activities.filter((activity: any) => {
      const searchTerm = activitiesSearchTerm.toLowerCase();
      
      // البحث في نوع المعاملة
      const type = activity.type === "transaction" 
        ? (activity.data.type === "deposit" ? "إيداع" : "سحب")
        : "تحويل";
      
      if (type.toLowerCase().includes(searchTerm)) return true;
      
      // البحث في المبلغ
      if (activity.data.amount?.toString().includes(searchTerm)) return true;
      
      // البحث في العملة
      if (activity.data.currency?.toLowerCase().includes(searchTerm)) return true;
      
      // البحث في التفاصيل
      if (activity.data.description?.toLowerCase().includes(searchTerm)) return true;
      
      // البحث في الرقم المرجعي
      if (activity.data.referenceNumber?.toLowerCase().includes(searchTerm)) return true;
      
      // البحث في أسماء المرسل/المستقبل للتحويلات
      if (activity.type === "transfer") {
        if (activity.data.senderName?.toLowerCase().includes(searchTerm)) return true;
        if (activity.data.receiverName?.toLowerCase().includes(searchTerm)) return true;
        if (activity.data.senderAccountNumber?.includes(searchTerm)) return true;
        if (activity.data.receiverAccountNumber?.includes(searchTerm)) return true;
      }
      
      return false;
    });
  };

  // دالة حذف الأنشطة المحددة
  const handleDeleteSelectedActivities = async () => {
    if (selectedActivities.length === 0) {
      toast({
        title: "تحذير",
        description: "الرجاء تحديد العناصر المراد حذفها",
        variant: "destructive"
      });
      return;
    }

    // استخراج الأنشطة المحددة
    const filteredActivities = getFilteredActivities();
    const activitiesToDelete = selectedActivities.map(index => filteredActivities[index]);
    
    // استخراج معرفات المعاملات والتحويلات
    const transactionIds = activitiesToDelete
      .filter(activity => activity.type === "transaction")
      .map(activity => activity.data.id);
    
    const transferIds = activitiesToDelete
      .filter(activity => activity.type === "transfer") 
      .map(activity => activity.data.id);

    try {
      if (transactionIds.length > 0) {
        const response = await apiRequest("/api/admin/transactions/delete", "DELETE", {
          transactionIds
        });
        if (!response.ok) {
          throw new Error("فشل في حذف المعاملات");
        }
      }

      if (transferIds.length > 0) {
        const response = await apiRequest("/api/admin/transfers/delete", "DELETE", {
          transferIds
        });
        if (!response.ok) {
          throw new Error("فشل في حذف التحويلات");
        }
      }

      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userToViewLogs?.id}/activities`] });
      
      // إعادة تعيين التحديد
      setSelectedActivities([]);
      setSelectAllActivities(false);
      
      toast({
        title: "نجح الحذف",
        description: `تم حذف ${selectedActivities.length} عنصر بنجاح`,
        variant: "default"
      });
      
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف العناصر",
        variant: "destructive"
      });
    }
  };

  // دالة الطباعة الحرارية لمعاملة واحدة
  const handleSingleActivityPrint = (activity: any) => {
    // إنشاء محتوى HTML للطباعة الحرارية للمعاملة الواحدة
    const thermalContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إيصال معاملة</title>
        <style>
          @media print {
            body { 
              margin: 0; 
              padding: 8px; 
              width: 72mm; 
              font-family: Arial, sans-serif; 
              font-size: 11px; 
              line-height: 1.3;
              color: #000;
              background: #fff;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px dashed #000; 
              padding-bottom: 8px; 
              margin-bottom: 10px; 
            }
            .activity { 
              padding: 8px 0; 
            }
            .type { 
              font-weight: bold; 
              font-size: 14px;
              text-align: center;
              margin-bottom: 8px; 
              border: 1px solid #000;
              padding: 4px;
            }
            .amount { 
              font-weight: bold; 
              font-size: 16px; 
              text-align: center;
              border: 1px dashed #000;
              padding: 6px;
              margin: 8px 0;
            }
            .details { 
              font-size: 10px; 
              margin: 3px 0; 
              padding: 2px 0;
            }
            .date { 
              font-size: 9px; 
              text-align: center;
              margin-top: 8px;
              border-top: 1px dotted #000;
              padding-top: 6px;
            }
            .footer { 
              text-align: center; 
              margin-top: 15px; 
              font-size: 8px; 
              border-top: 2px dashed #000; 
              padding-top: 8px; 
            }
          }
          body { 
            margin: 0; 
            padding: 8px; 
            width: 72mm; 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.3;
            direction: rtl;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px dashed #000; 
            padding-bottom: 8px; 
            margin-bottom: 10px; 
          }
          .activity { 
            padding: 8px 0; 
          }
          .type { 
            font-weight: bold; 
            font-size: 14px;
            text-align: center;
            margin-bottom: 8px; 
            border: 1px solid #000;
            padding: 4px;
          }
          .amount { 
            font-weight: bold; 
            font-size: 16px; 
            text-align: center;
            border: 1px dashed #000;
            padding: 6px;
            margin: 8px 0;
          }
          .details { 
            font-size: 10px; 
            margin: 3px 0; 
            padding: 2px 0;
          }
          .date { 
            font-size: 9px; 
            text-align: center;
            margin-top: 8px;
            border-top: 1px dotted #000;
            padding-top: 6px;
          }
          .footer { 
            text-align: center; 
            margin-top: 15px; 
            font-size: 8px; 
            border-top: 2px dashed #000; 
            padding-top: 8px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>منصة الصرافة</h2>
          <p>إيصال معاملة</p>
          <p>المستخدم: ${userToViewLogs?.fullName}</p>
        </div>
        
        <div class="activity">
          <div class="type">
            ${activity.type === "transaction" 
              ? activity.data.type === "deposit" 
                ? "إيداع" 
                : activity.data.type === "withdrawal" 
                  ? "سحب" 
                  : "صرافة"
              : "تحويل"}
          </div>
          
          ${activity.type === "transfer" ? `
            <div class="details">
              <strong>${activity.data.transferKind === "external" ? "تحويل خارجي" : "تحويل داخلي"}</strong>
            </div>
            <div class="details">
              من: ${activity.data.senderName || 'غير محدد'} ${activity.data.senderAccountNumber ? `(${activity.data.senderAccountNumber})` : ''}
            </div>
            <div class="details">
              إلى: ${activity.data.receiverName || 'غير محدد'} ${activity.data.receiverAccountNumber ? `(${activity.data.receiverAccountNumber})` : ''}
            </div>
            ${activity.data.commission && Number(activity.data.commission) > 0 ? `
              <div class="details"><strong>العمولة: ${activity.data.commission} ${activity.data.currency}</strong></div>
            ` : ''}
            ${activity.data.referenceNumber ? `
              <div class="details">المرجع: ${activity.data.referenceNumber}</div>
            ` : ''}
            ${activity.data.destinationCountry ? `
              <div class="details">الوجهة: ${activity.data.destinationCountry}</div>
            ` : ''}
            ${activity.data.note ? `
              <div class="details">الملاحظة: ${activity.data.note}</div>
            ` : ''}
          ` : `
            ${activity.data.description ? `
              <div class="details">${activity.data.description}</div>
            ` : ''}
            ${activity.data.referenceNumber ? `
              <div class="details">المرجع: ${activity.data.referenceNumber}</div>
            ` : ''}
          `}
          
          <div class="amount">
            ${activity.data.amount} ${activity.data.currency}
          </div>
          
          <div class="date">
            ${new Date(activity.createdAt || activity.data.createdAt || activity.data.date).toLocaleString("ar-LY")}
          </div>
        </div>
        
        <div class="footer">
          <p>شكراً لكم لاستخدام خدماتنا</p>
          <p>تم الطباعة: ${new Date().toLocaleString('ar-LY')}</p>
        </div>
      </body>
      </html>
    `;

    // فتح نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank', 'width=300,height=600,scrollbars=yes');
    if (printWindow) {
      printWindow.document.write(thermalContent);
      printWindow.document.close();
      
      // انتظار تحميل المحتوى ثم الطباعة
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // إغلاق النافذة بعد الطباعة
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };
    } else {
      toast({
        title: "خطأ",
        description: "تعذر فتح نافذة الطباعة. يرجى التأكد من أن النوافذ المنبثقة مسموحة.",
        variant: "destructive"
      });
    }
  };

  // دالة الطباعة الحرارية
  const handleThermalPrint = () => {
    if (!(userActivities as any)?.activities || (userActivities as any).activities.length === 0) {
      toast({
        title: "تحذير",
        description: "لا توجد أنشطة للطباعة",
        variant: "destructive"
      });
      return;
    }

    // إنشاء محتوى HTML للطباعة الحرارية
    const thermalContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير أنشطة المستخدم</title>
        <style>
          @media print {
            body { 
              margin: 0; 
              padding: 8px; 
              width: 72mm; 
              font-family: Arial, sans-serif; 
              font-size: 10px; 
              line-height: 1.2;
              color: #000;
              background: #fff;
            }
            .header { 
              text-align: center; 
              border-bottom: 1px dashed #000; 
              padding-bottom: 5px; 
              margin-bottom: 8px; 
            }
            .activity { 
              border-bottom: 1px dotted #ccc; 
              padding: 4px 0; 
              margin-bottom: 4px; 
            }
            .activity:last-child { border-bottom: none; }
            .type { 
              font-weight: bold; 
              margin-bottom: 2px; 
            }
            .amount { 
              font-weight: bold; 
              font-size: 11px; 
            }
            .date { 
              font-size: 8px; 
              color: #666; 
            }
            .details { 
              font-size: 9px; 
              margin: 2px 0; 
            }
            .footer { 
              text-align: center; 
              margin-top: 10px; 
              font-size: 8px; 
              border-top: 1px dashed #000; 
              padding-top: 5px; 
            }
          }
          body { 
            margin: 0; 
            padding: 8px; 
            width: 72mm; 
            font-family: Arial, sans-serif; 
            font-size: 10px; 
            line-height: 1.2;
            direction: rtl;
          }
          .header { 
            text-align: center; 
            border-bottom: 1px dashed #000; 
            padding-bottom: 5px; 
            margin-bottom: 8px; 
          }
          .activity { 
            border-bottom: 1px dotted #ccc; 
            padding: 4px 0; 
            margin-bottom: 4px; 
          }
          .activity:last-child { border-bottom: none; }
          .type { 
            font-weight: bold; 
            margin-bottom: 2px; 
          }
          .amount { 
            font-weight: bold; 
            font-size: 11px; 
          }
          .date { 
            font-size: 8px; 
            color: #666; 
          }
          .details { 
            font-size: 9px; 
            margin: 2px 0; 
          }
          .footer { 
            text-align: center; 
            margin-top: 10px; 
            font-size: 8px; 
            border-top: 1px dashed #000; 
            padding-top: 5px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>تقرير أنشطة المستخدم</h2>
          <p>${userToViewLogs?.fullName}</p>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-LY')}</p>
        </div>
        
        ${(userActivities as any).activities.map((activity: any, index: number) => `
          <div class="activity">
            <div class="type">
              ${activity.type === "transaction" 
                ? activity.data.type === "deposit" 
                  ? "إيداع" 
                  : activity.data.type === "withdrawal" 
                    ? "سحب" 
                    : "صرافة"
                : "تحويل"}
            </div>
            
            ${activity.type === "transfer" ? `
              <div class="details">
                ${activity.data.transferKind === "external" ? "تحويل خارجي" : "تحويل داخلي"}
              </div>
              <div class="details">
                من: ${activity.data.senderName || 'غير محدد'} ${activity.data.senderAccountNumber ? `(${activity.data.senderAccountNumber})` : ''}
              </div>
              <div class="details">
                إلى: ${activity.data.receiverName || 'غير محدد'} ${activity.data.receiverAccountNumber ? `(${activity.data.receiverAccountNumber})` : ''}
              </div>
              ${activity.data.commission && Number(activity.data.commission) > 0 ? `
                <div class="details">العمولة: ${activity.data.commission} ${activity.data.currency}</div>
              ` : ''}
              ${activity.data.referenceNumber ? `
                <div class="details">المرجع: ${activity.data.referenceNumber}</div>
              ` : ''}
              ${activity.data.destinationCountry ? `
                <div class="details">الوجهة: ${activity.data.destinationCountry}</div>
              ` : ''}
              ${activity.data.note ? `
                <div class="details">الملاحظة: ${activity.data.note}</div>
              ` : ''}
            ` : `
              ${activity.data.description ? `
                <div class="details">${activity.data.description}</div>
              ` : ''}
              ${activity.data.referenceNumber ? `
                <div class="details">المرجع: ${activity.data.referenceNumber}</div>
              ` : ''}
            `}
            
            <div class="amount">
              ${activity.data.amount} ${activity.data.currency}
            </div>
            <div class="date">
              ${new Date(activity.createdAt || activity.data.createdAt || activity.data.date).toLocaleString("ar-LY")}
            </div>
          </div>
        `).join('')}
        
        <div class="footer">
          <p>منصة الصرافة</p>
          <p>تم الطباعة: ${new Date().toLocaleString('ar-LY')}</p>
        </div>
      </body>
      </html>
    `;

    // فتح نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank', 'width=300,height=600,scrollbars=yes');
    if (printWindow) {
      printWindow.document.write(thermalContent);
      printWindow.document.close();
      
      // انتظار تحميل المحتوى ثم الطباعة
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // إغلاق النافذة بعد الطباعة
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };
    } else {
      toast({
        title: "خطأ",
        description: "تعذر فتح نافذة الطباعة. يرجى التأكد من أن النوافذ المنبثقة مسموحة.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-4">
          <BackToDashboardButton />
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">إدارة المستخدمين</h1>
        </div>
        
        <div className="bg-white shadow rounded p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن مستخدم..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="default" 
              className="flex items-center bg-blue-600 hover:bg-blue-700" 
              onClick={() => setUserToNotify({ phone: '' })}
            >
              <Bell className="h-4 w-4 ml-2" />
              إرسال إشعار برقم الحساب
            </Button>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : isError ? (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">خطأ في تحميل البيانات</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{(error as Error).message}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الأرصدة</TableHead>
                      <TableHead className="text-right">سقف التحويل الخارجي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6">
                          لا توجد بيانات للعرض
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>{convertToWesternNumerals(user.phone || (user.id === 4 ? 1 : user.id))}</TableCell>
                          <TableCell>
                            {user.email === "ss73ss73ss73@gmail.com" && user.id === 4 
                              ? "مدير النظام" 
                              : user.fullName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>
                            {user.type === "admin" ? (
                              <Badge variant="destructive">
                                مدير {user.adminLevel === 2 ? "عام" : "محدود"}
                              </Badge>
                            ) : user.type === "agent" ? (
                              user.hasExternalTransferAccess ? (
                                <Badge className="bg-green-600 text-white hover:bg-green-700">وكيل دولي</Badge>
                              ) : user.hasAgentAccess ? (
                                <Badge className="bg-blue-600 text-white hover:bg-blue-700">وكيل</Badge>
                              ) : (
                                <Badge variant="outline">وكيل (بانتظار الموافقة)</Badge>
                              )
                            ) : (
                              <Badge variant="secondary">مستخدم</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              {Object.entries(user.balances || {}).map(([currency, amount]: [string, any]) => (
                                <div key={currency}>
                                  <Badge variant="outline">
                                    {amount} {currency}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.hasExternalTransferAccess ? (
                              <div className="text-xs space-y-1">
                                <div className="font-medium text-green-600">مفعل</div>
                                {user.extDailyLimit && (
                                  <div>يومي: <span className="font-mono">{user.extDailyLimit}</span></div>
                                )}
                                {user.extMonthlyLimit && (
                                  <div>شهري: <span className="font-mono">{user.extMonthlyLimit}</span></div>
                                )}
                                {user.extAllowedCurrencies && user.extAllowedCurrencies.length > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">العملات:</span> {user.extAllowedCurrencies.join(', ')}
                                  </div>
                                )}
                              </div>
                            ) : user.type === "agent" ? (
                              <div className="text-xs text-muted-foreground">غير مفعل</div>
                            ) : (
                              <div className="text-xs text-muted-foreground">-</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.active === false ? "destructive" : "default"}>
                              {user.active === false ? "معطل" : "مفعل"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setUserToAction(user);
                                  setActionType("topup");
                                  topupForm.reset({ amount: "", currency: "LYD" });
                                }}
                                title="إيداع رصيد"
                              >
                                <Wallet className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setUserToAction(user);
                                  setActionType("withdraw");
                                  topupForm.reset({ amount: "", currency: "LYD" });
                                }}
                                title="سحب رصيد"
                              >
                                <Wallet className="h-4 w-4 rotate-180" />
                              </Button>
                              
                              {(user.type !== "admin" || isSuperAdmin) && user.id !== currentUser?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setUserToEdit(user)}
                                  title="تعديل البيانات"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {(user.type !== "admin" || isSuperAdmin) && user.id !== currentUser?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    toggleUserStatusMutation.mutate({
                                      userId: user.id,
                                      active: user.active === false,
                                    });
                                  }}
                                  title={user.active === false ? "تفعيل الحساب" : "تعطيل الحساب"}
                                  className={user.active === false ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
                                >
                                  {user.active === false ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setUserToNotify(user)}
                                title="إرسال إشعار"
                              >
                                <Bell className="h-4 w-4" />
                              </Button>

                              {/* زر إدارة سقف التحويل الخارجي للوكلاء فقط */}
                              {user.type === "agent" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setUserToRaiseExternalLimit(user);
                                    // تحديث النموذج بالقيم الحالية للمستخدم
                                    externalTransferLimitForm.reset({
                                      extDailyLimit: user.extDailyLimit || "",
                                      extMonthlyLimit: user.extMonthlyLimit || "",
                                      extAllowedCurrencies: user.extAllowedCurrencies || ["USD"],
                                    });
                                  }}
                                  title="إدارة سقف التحويل الخارجي"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Wallet className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setUserToViewLogs(user);
                                  refetchActivities();
                                }}
                                title="سجل الأنشطة"
                              >
                                <BarChart className="h-4 w-4" />
                              </Button>
                              
                              {(user.type !== "admin" || isSuperAdmin) && user.id !== currentUser?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setConfirmDelete({ show: true, userId: user.id })}
                                  title="حذف المستخدم"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <div className="text-center text-sm text-muted-foreground mt-4">
              عدد المستخدمين: {filteredUsers?.length || 0} (من أصل {users?.length || 0})
            </div>
          </>
        )}
      </div>
      
      {/* نافذة حذف المستخدم */}
      <AlertDialog open={confirmDelete.show} onOpenChange={(open) => setConfirmDelete({ show: open })}>
        <AlertDialogContent className="dir-rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا المستخدم؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المستخدم وجميع بياناته بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteUserMutation.mutate(confirmDelete.userId!)}
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : "حذف المستخدم"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* نافذة تحرير المستخدم */}
      <Dialog open={!!userToEdit} onOpenChange={(open) => !open && setUserToEdit(null)}>
        <DialogContent className="dir-rtl max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
            <DialogDescription>
              يمكنك تعديل بيانات المستخدم من هنا.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الحساب</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الحساب" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">مستخدم عادي</SelectItem>
                        <SelectItem value="agent">وكيل</SelectItem>
                        {/* المدير العام فقط يمكنه رؤية أو إضافة مدراء */}
                        {isSuperAdmin && (
                          <SelectItem value="admin">مدير</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* مستوى الإدارة - يظهر فقط للمدير العام عند تعديل مدراء */}
              {isSuperAdmin && (userToEdit?.type === "admin" || editForm.watch("type") === "admin") && (
                <FormField
                  control={editForm.control}
                  name="adminLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مستوى الإدارة</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مستوى الإدارة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">مدير نظام محدود</SelectItem>
                          {/* المدير العام فقط يمكنه رؤية خيار المدير العام */}
                          {userToEdit?.adminLevel === 2 && (
                            <SelectItem value="2">مدير عام</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        {field.value === 1 && "مدير نظام محدود: يمكنه إدارة المستخدمين والعمليات الأساسية"}
                        {field.value === 2 && "مدير عام: صلاحيات كاملة بما في ذلك إدارة نظام الأمان"}
                      </p>
                    </FormItem>
                  )}
                />
              )}

              {/* الصلاحيات التفصيلية - تظهر للمدراء فقط */}
              {isSuperAdmin && (userToEdit?.type === "admin" || editForm.watch("type") === "admin") && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">الصلاحيات التفصيلية</h3>
                    <div className="grid grid-cols-1 gap-4">
                      
                      <FormField
                        control={editForm.control}
                        name="canManageUsers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">إدارة المستخدمين</FormLabel>
                              <p className="text-sm text-muted-foreground">إضافة وتعديل وحذف المستخدمين</p>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="canManageMarket"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">مراقبة صفحة السوق</FormLabel>
                              <p className="text-sm text-muted-foreground">مراقبة عروض البيع والشراء والتداول</p>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="canManageChat"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">مراقبة الدردشة</FormLabel>
                              <p className="text-sm text-muted-foreground">مراقبة الرسائل والمحادثات</p>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="canManageInternalTransfers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">إدارة التحويل الداخلي</FormLabel>
                              <p className="text-sm text-muted-foreground">مراقبة التحويلات بين المستخدمين</p>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="canManageExternalTransfers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">إدارة التحويل الخارجي</FormLabel>
                              <p className="text-sm text-muted-foreground">مراقبة الحوالات الدولية والخارجية</p>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="canManageNewAccounts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">إدارة الحسابات الجديدة</FormLabel>
                              <p className="text-sm text-muted-foreground">مراجعة وقبول طلبات التسجيل الجديدة</p>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="canManageSecurity"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">إدارة نظام الأمان</FormLabel>
                              <p className="text-sm text-muted-foreground">مراقبة الدخول المشبوه والأنشطة الأمنية</p>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="canManageSupport"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">الرد على الاستفسارات</FormLabel>
                              <p className="text-sm text-muted-foreground">الرد على استفسارات المستخدمين والدعم الفني</p>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="canManageReports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">التقارير والإحصائيات</FormLabel>
                              <p className="text-sm text-muted-foreground">الوصول للتقارير وإحصائيات النظام</p>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="canManageSettings"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">إعدادات النظام</FormLabel>
                              <p className="text-sm text-muted-foreground">تعديل إعدادات النظام العامة</p>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : null}
                  حفظ التغييرات
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* نافذة إرسال إشعار للمستخدم */}
      <Dialog 
        open={!!userToNotify} 
        onOpenChange={(open) => {
          if (!open) {
            setUserToNotify(null);
            notifyForm.reset();
            accountSearchForm.reset();
          }
        }}
      >
        <DialogContent className="dir-rtl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {userToNotify?.id 
                ? `إرسال إشعار إلى ${userToNotify.fullName}` 
                : "إرسال إشعار برقم الحساب"}
            </DialogTitle>
            <DialogDescription>
              {userToNotify?.id 
                ? "سيتم إرسال إشعار إلى المستخدم المحدد." 
                : "أدخل رقم حساب المستخدم لإرسال إشعار له."}
            </DialogDescription>
          </DialogHeader>
          
          {!userToNotify?.id && userToNotify?.phone === "" && (
            <Form {...accountSearchForm}>
              <form onSubmit={accountSearchForm.handleSubmit(handleAccountSearchSubmit)} className="space-y-4">
                <FormField
                  control={accountSearchForm.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الحساب</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="أدخل رقم الحساب" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">بحث</Button>
              </form>
            </Form>
          )}
          
          {(userToNotify?.id || userToNotify?.phone?.length > 0) && (
            <Form {...notifyForm}>
              <form onSubmit={notifyForm.handleSubmit(handleNotifySubmit)} className="space-y-4">
                <FormField
                  control={notifyForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان الإشعار</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="أدخل عنوان الإشعار" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={notifyForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نص الإشعار</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="أدخل نص الإشعار" 
                          className="min-h-32"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={notifyUserMutation.isPending}>
                    {notifyUserMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : null}
                    إرسال الإشعار
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* نافذة إيداع/سحب رصيد */}
      <Dialog 
        open={!!userToAction && !!actionType} 
        onOpenChange={(open) => {
          if (!open) {
            setUserToAction(null);
            setActionType(null);
            topupForm.reset();
          }
        }}
      >
        <DialogContent className="dir-rtl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "topup" 
                ? `إيداع رصيد في حساب ${userToAction?.fullName}` 
                : `سحب رصيد من حساب ${userToAction?.fullName}`}
            </DialogTitle>
            <DialogDescription>
              {actionType === "topup" 
                ? "أدخل المبلغ والعملة لإيداعها في حساب المستخدم" 
                : "أدخل المبلغ والعملة لسحبها من حساب المستخدم"}
            </DialogDescription>
          </DialogHeader>
          <Form {...topupForm}>
            <form onSubmit={topupForm.handleSubmit(handleTopupSubmit)} className="space-y-4">
              <FormField
                control={topupForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="0.01" placeholder="أدخل المبلغ" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={topupForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العملة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العملة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LYD">دينار ليبي (LYD)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        <SelectItem value="EUR">يورو (EUR)</SelectItem>
                        <SelectItem value="GBP">جنيه إسترليني (GBP)</SelectItem>
                        <SelectItem value="TRY">ليرة تركية (TRY)</SelectItem>
                        <SelectItem value="TND">دينار تونسي (TND)</SelectItem>
                        <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                        <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={actionType === "topup" ? topupMutation.isPending : withdrawMutation.isPending}
                  variant={actionType === "topup" ? "default" : "destructive"}
                >
                  {(actionType === "topup" ? topupMutation.isPending : withdrawMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : null}
                  {actionType === "topup" ? "إيداع" : "سحب"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* نافذة عرض سجل الأنشطة */}
      <Dialog 
        open={!!userToViewLogs} 
        onOpenChange={(open) => !open && setUserToViewLogs(null)}
      >
        <DialogContent className="dir-rtl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>سجل أنشطة المستخدم {userToViewLogs?.fullName}</DialogTitle>
                <DialogDescription>
                  عرض جميع الأنشطة والمعاملات المالية للمستخدم.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleThermalPrint()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  data-testid="button-thermal-print"
                >
                  <Printer className="h-4 w-4" />
                  طباعة حرارية
                </Button>
                {selectedActivities.length > 0 && (
                  <Button
                    onClick={() => handleDeleteSelectedActivities()}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                    data-testid="button-delete-activities"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف المحدد ({selectedActivities.length})
                  </Button>
                )}
              </div>
            </div>
            
            {/* شريط البحث */}
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الأنشطة..."
                  value={activitiesSearchTerm}
                  onChange={(e) => setActivitiesSearchTerm(e.target.value)}
                  className="pr-10"
                  data-testid="input-search-activities"
                />
              </div>
              <Button
                onClick={() => {
                  setActivitiesSearchTerm("");
                  setSelectedActivities([]);
                  setSelectAllActivities(false);
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-clear-search"
              >
                <RefreshCw className="h-4 w-4" />
                مسح
              </Button>
            </div>
          </DialogHeader>
          
          {isLoadingActivities ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (userActivities as any)?.activities?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد أنشطة مسجلة لهذا المستخدم.
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-12">
                        <input
                          type="checkbox"
                          checked={selectAllActivities}
                          onChange={(e) => {
                            setSelectAllActivities(e.target.checked);
                            if (e.target.checked) {
                              const filteredActivities = getFilteredActivities();
                              setSelectedActivities(filteredActivities.map((_: any, index: number) => index));
                            } else {
                              setSelectedActivities([]);
                            }
                          }}
                          className="rounded"
                          data-testid="checkbox-select-all-activities"
                        />
                      </TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">التفاصيل</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-center">طباعة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredActivities().map((activity: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={selectedActivities.includes(index)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedActivities(prev => [...prev, index]);
                              } else {
                                setSelectedActivities(prev => prev.filter(i => i !== index));
                                setSelectAllActivities(false);
                              }
                            }}
                            className="rounded"
                            data-testid={`checkbox-activity-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              activity.type === "transaction" 
                                ? activity.data.type === "deposit" 
                                  ? "default" 
                                  : "destructive"
                                : "outline"
                            }
                          >
                            {activity.type === "transaction" 
                              ? activity.data.type === "deposit" 
                                ? "إيداع" 
                                : "سحب"
                              : "تحويل"
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {activity.type === "transfer" ? (
                              <>
                                <div className="text-sm font-medium">
                                  {activity.data.transferKind === "external" ? "تحويل خارجي" : "تحويل داخلي"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  من: {activity.data.senderName} {activity.data.senderAccountNumber ? `(${activity.data.senderAccountNumber})` : ''}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  إلى: {activity.data.receiverName} {activity.data.receiverAccountNumber ? `(${activity.data.receiverAccountNumber})` : ''}
                                </div>
                                {activity.data.commission && Number(activity.data.commission) > 0 && (
                                  <div className="text-xs text-orange-600">
                                    العمولة: {activity.data.commission} {activity.data.currency}
                                  </div>
                                )}
                                {activity.data.referenceNumber && (
                                  <div className="text-xs text-gray-500">
                                    المرجع: {activity.data.referenceNumber}
                                  </div>
                                )}
                                {activity.data.destinationCountry && (
                                  <div className="text-xs text-blue-600">
                                    الوجهة: {activity.data.destinationCountry}
                                  </div>
                                )}
                                {activity.data.note && (
                                  <div className="text-xs text-gray-700">
                                    الملاحظة: {activity.data.note}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-medium">
                                  {activity.data.type === "deposit" ? "إيداع" : 
                                   activity.data.type === "withdrawal" ? "سحب" : 
                                   activity.data.type === "exchange" ? "صرافة" : "معاملة"}
                                </div>
                                {activity.data.description && (
                                  <div className="text-xs text-gray-700">
                                    {activity.data.description}
                                  </div>
                                )}
                                {activity.data.referenceNumber && (
                                  <div className="text-xs text-gray-500">
                                    المرجع: {activity.data.referenceNumber}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="ml-1">{activity.data.amount}</span>
                            <span>{activity.data.currency}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(activity.createdAt || activity.data.createdAt || activity.data.date).toLocaleString("ar-LY")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            onClick={() => handleSingleActivityPrint(activity)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 px-2 py-1"
                            data-testid={`button-print-activity-${index}`}
                          >
                            <Printer className="h-3 w-3" />
                            طباعة
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
      
      {/* نافذة رفع سقف التحويل الخارجي */}
      <Dialog 
        open={!!userToRaiseExternalLimit} 
        onOpenChange={(open) => {
          if (!open) {
            setUserToRaiseExternalLimit(null);
            externalTransferLimitForm.reset();
          }
        }}
      >
        <DialogContent className="dir-rtl max-w-lg">
          <DialogHeader>
            <DialogTitle>إدارة سقف التحويل الخارجي للوكيل {userToRaiseExternalLimit?.fullName}</DialogTitle>
            <DialogDescription>
              يمكنك تعديل حدود التحويل الخارجي والعملات المسموحة للوكيل.
            </DialogDescription>
          </DialogHeader>
          <Form {...externalTransferLimitForm}>
            <form onSubmit={externalTransferLimitForm.handleSubmit(handleRaiseExternalLimitSubmit)} className="space-y-4">
              <FormField
                control={externalTransferLimitForm.control}
                name="extDailyLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحد اليومي (USD)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="1" placeholder="10000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={externalTransferLimitForm.control}
                name="extMonthlyLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحد الشهري (USD)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="1" placeholder="50000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={externalTransferLimitForm.control}
                name="extAllowedCurrencies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العملات المسموحة</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2">
                        {["LYD", "USD", "EUR", "GBP", "TRY", "TND", "EGP", "AED"].map((currency) => (
                          <label key={currency} className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="checkbox"
                              checked={field.value.includes(currency)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, currency]);
                                } else {
                                  field.onChange(field.value.filter((c: string) => c !== currency));
                                }
                              }}
                            />
                            <span className="text-sm">{currency}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={raiseExternalTransferLimitMutation.isPending}>
                  {raiseExternalTransferLimitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : null}
                  تحديث السقف
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}