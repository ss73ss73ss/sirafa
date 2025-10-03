import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CheckCircle, XCircle, Eye, Filter } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackToDashboardButton } from '@/components/ui/back-to-dashboard-button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const AdminVerificationPage = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // حالة لفلترة الطلبات
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  
  // حالات لعرض تفاصيل الطلب والموافقة/الرفض
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // استعلام لجلب طلبات التوثيق
  const { 
    data: requests, 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/admin/verification-requests', filter !== 'all' ? filter : undefined],
    queryFn: async () => {
      const queryParams = filter !== 'all' ? `?status=${filter}` : '';
      try {
        // استخدام الرمز المخزن في localStorage مباشرة
        const token = localStorage.getItem("auth_token");
        
        if (!token) {
          throw new Error("لم يتم العثور على رمز التوثيق");
        }
        
        const res = await fetch(`/api/admin/verification-requests${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('خطأ في جلب طلبات التوثيق:', errorText);
          throw new Error(`فشل في جلب طلبات التوثيق: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('تم استلام البيانات:', data);
        return data;
      } catch (error) {
        console.error('خطأ عند محاولة جلب طلبات التوثيق:', error);
        throw error;
      }
    }
  });
  
  // تنفيذ عملية تحديث حالة الطلب (موافقة/رفض)
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRequest) return;
      
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        throw new Error("لم يتم العثور على رمز التوثيق");
      }
      
      const res = await fetch(`/api/admin/verification-requests/${selectedRequest.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          notes: notes.trim() || undefined
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`فشل في تحديث حالة الطلب: ${errorText}`);
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: actionType === 'approve' ? "تمت الموافقة على الطلب" : "تم رفض الطلب",
        description: "تم تحديث حالة طلب التوثيق بنجاح",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verification-requests'] });
      setShowActionDialog(false);
      setNotes('');
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    }
  });
  
  // التحقق من أن المستخدم مسؤول
  useEffect(() => {
    if (user && user.type !== 'admin') {
      navigate('/');
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة متاحة للمسؤولين فقط",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);
  
  // فتح نافذة تفاصيل الطلب
  const openRequestDetails = (request: any) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };
  
  // فتح نافذة اتخاذ الإجراء (موافقة/رفض)
  const openActionDialog = (request: any, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setNotes('');
    setShowActionDialog(true);
  };
  
  // عرض الطلبات المفلترة
  const filteredRequests = requests || [];
  
  // حالة التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // حالة الخطأ
  if (isError) {
    return (
      <div className="container py-10">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <XCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">خطأ في جلب البيانات</h3>
              <p className="mb-4">حدث خطأ أثناء محاولة جلب طلبات التوثيق</p>
              <Button onClick={() => refetch()} variant="outline">
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="mb-4">
        <BackToDashboardButton />
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">إدارة طلبات التوثيق</CardTitle>
              <CardDescription>مراجعة وإدارة طلبات توثيق حسابات المستخدمين</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الطلبات</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="approved">تمت الموافقة</SelectItem>
                  <SelectItem value="rejected">تم الرفض</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => refetch()}>
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <div className="mb-4">لا توجد طلبات {filter !== 'all' ? 'في هذه الحالة' : ''}</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* عرض عدد الطلبات حسب الفلتر */}
              <div className="text-sm text-gray-500 mb-4">
                إجمالي الطلبات: {filteredRequests.length}
              </div>
              
              {/* قائمة الطلبات */}
              <div className="divide-y">
                {filteredRequests.map((request: any) => (
                  <div key={request.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {request.user?.fullName || `المستخدم #${request.userId}`}
                          </h3>
                          <StatusBadge status={request.status} />
                        </div>
                        
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="inline-block ml-4">
                            البريد: {request.user?.email || 'غير متوفر'}
                          </span>
                          <span className="inline-block">
                            الهاتف: {request.user?.phone || 'غير متوفر'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          تاريخ الطلب: {new Date(request.createdAt).toLocaleDateString('ar-LY')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => openRequestDetails(request)}
                        >
                          عرض التفاصيل
                        </Button>
                        
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openActionDialog(request, 'approve')}
                            >
                              موافقة
                            </Button>
                            
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => openActionDialog(request, 'reject')}
                            >
                              رفض
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* نافذة عرض تفاصيل الطلب */}
      {selectedRequest && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>تفاصيل طلب التوثيق</DialogTitle>
              <DialogDescription>
                معلومات المستخدم والوثائق المقدمة
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* معلومات المستخدم */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">الاسم الكامل</h3>
                  <p>{selectedRequest.user?.fullName || 'غير متوفر'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">البريد الإلكتروني</h3>
                  <p>{selectedRequest.user?.email || 'غير متوفر'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">رقم الهاتف</h3>
                  <p>{selectedRequest.user?.phone || 'غير متوفر'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">حالة الطلب</h3>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">تاريخ الطلب</h3>
                  <p>{new Date(selectedRequest.createdAt).toLocaleString('ar-LY')}</p>
                </div>
                
                {selectedRequest.updatedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">تاريخ المراجعة</h3>
                    <p>{new Date(selectedRequest.updatedAt).toLocaleString('ar-LY')}</p>
                  </div>
                )}
              </div>
              
              {/* ملاحظات الرفض (إذا وجدت) */}
              {selectedRequest.status === 'rejected' && selectedRequest.notes && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h3 className="font-semibold mb-1">سبب الرفض:</h3>
                  <p>{selectedRequest.notes}</p>
                </div>
              )}
              
              {/* المستندات */}
              <div>
                <h3 className="font-semibold mb-4">المستندات المقدمة</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">صورة الهوية</h4>
                    <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={selectedRequest.idPhotoUrl} 
                        alt="صورة الهوية" 
                        className="w-full h-full object-contain"
                        onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=هوية+غير+متوفرة'}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 bg-black/30 hover:bg-black/50 text-white rounded-full"
                        onClick={() => setPreviewImage(selectedRequest.idPhotoUrl)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">إثبات العنوان</h4>
                    <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={selectedRequest.proofOfAddressUrl} 
                        alt="إثبات العنوان" 
                        className="w-full h-full object-contain"
                        onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=إثبات+غير+متوفر'}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 bg-black/30 hover:bg-black/50 text-white rounded-full"
                        onClick={() => setPreviewImage(selectedRequest.proofOfAddressUrl)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                إغلاق
              </Button>
              
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      openActionDialog(selectedRequest, 'approve');
                    }}
                  >
                    موافقة
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      openActionDialog(selectedRequest, 'reject');
                    }}
                  >
                    رفض
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* نافذة الموافقة/الرفض */}
      {selectedRequest && (
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'الموافقة على طلب التوثيق' : 'رفض طلب التوثيق'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' 
                  ? 'الموافقة على طلب التوثيق سيؤدي إلى تفعيل الحساب الموثق للمستخدم' 
                  : 'يرجى توضيح سبب رفض الطلب للمستخدم'}
              </DialogDescription>
            </DialogHeader>
            
            {actionType === 'reject' && (
              <div className="py-4">
                <Textarea
                  placeholder="أدخل سبب الرفض هنا..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            )}
            
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                إلغاء
              </Button>
              
              <Button 
                variant={actionType === 'approve' ? 'default' : 'destructive'}
                className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => updateStatusMutation.mutate()}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التنفيذ...
                  </>
                ) : actionType === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* معاينة الصور بحجم أكبر */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>معاينة المستند</DialogTitle>
            <DialogDescription>
              اضغط خارج هذه النافذة للإغلاق
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[70vh] overflow-auto">
            {previewImage && (
              <img 
                src={previewImage} 
                alt="معاينة المستند" 
                className="w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// مكون شارة الحالة
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">قيد المراجعة</Badge>;
    case 'approved':
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">تمت الموافقة</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">تم الرفض</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default AdminVerificationPage;