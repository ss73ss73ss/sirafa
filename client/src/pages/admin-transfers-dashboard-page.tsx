import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Sidebar from "@/components/dashboard/sidebar";
import { ArrowLeft, RefreshCw, Clock, CheckCircle, AlertCircle, DollarSign, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transfer {
  id: number;
  senderId: number;
  senderName: string;
  receiverId?: number;
  receiverName?: string;
  receiverOfficeId?: number;
  receiverOfficeName?: string;
  recipientName?: string;
  amount: string;
  commission: string;
  currency: string;
  status: string;
  verificationCode?: string;
  referenceNumber?: string;
  type: 'internal' | 'city' | 'international';
  createdAt: string;
  completedAt?: string;
  note?: string;
  country?: string;
}

export default function AdminTransfersDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTransfers, setSelectedTransfers] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // حماية الصفحة - يجب أن يكون المستخدم مشرف
  useEffect(() => {
    if (user && user.type !== 'admin') {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  // جلب جميع أنواع التحويلات
  const { data: allTransfers = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/all-transfers'],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch('/api/admin/all-transfers', {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('فشل في جلب بيانات التحويلات');
      }
      return res.json();
    },
    enabled: !!user && user.type === 'admin'
  });

  // تصفية التحويلات
  const filteredTransfers = allTransfers.filter((transfer: Transfer) => {
    const matchesSearch = transfer.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.receiverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.receiverOfficeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.verificationCode?.includes(searchTerm) ||
                         transfer.referenceNumber?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    const matchesType = typeFilter === 'all' || transfer.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // حساب الإحصائيات
  const stats = {
    total: allTransfers.length,
    pending: allTransfers.filter((t: Transfer) => t.status === 'pending').length,
    completed: allTransfers.filter((t: Transfer) => t.status === 'completed').length,
    internal: allTransfers.filter((t: Transfer) => t.type === 'internal').length,
    city: allTransfers.filter((t: Transfer) => t.type === 'city').length,
    international: allTransfers.filter((t: Transfer) => t.type === 'international').length,
    totalAmount: allTransfers.reduce((sum: number, t: Transfer) => sum + parseFloat(t.amount || '0'), 0),
    totalCommission: allTransfers.reduce((sum: number, t: Transfer) => sum + parseFloat(t.commission || '0'), 0)
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // تنسيق الأرقام
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // حذف التحويلات
  const deleteMutation = useMutation({
    mutationFn: async (transferIds: string[]) => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch('/api/admin/transfers/delete', {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ transferIds })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'حدث خطأ في حذف التحويلات');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف التحويلات المحددة بنجاح",
      });
      setSelectedTransfers([]);
      setShowDeleteDialog(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all-transfers'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف التحويلات",
        variant: "destructive",
      });
    }
  });

  // التعامل مع تحديد التحويلات
  const handleSelectTransfer = (transferId: string, type: string) => {
    const fullId = `${type}-${transferId}`;
    setSelectedTransfers(prev => 
      prev.includes(fullId) 
        ? prev.filter(id => id !== fullId)
        : [...prev, fullId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransfers.length === filteredTransfers.length) {
      setSelectedTransfers([]);
    } else {
      setSelectedTransfers(filteredTransfers.map((t: Transfer) => `${t.type}-${t.id}`));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTransfers.length === 0) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(selectedTransfers);
  };

  if (!user || user.type !== 'admin') {
    return null;
  }
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 p-4">
        <Sidebar />
      </div>
      <main className="flex-1 p-6">
        <div className="container mx-auto">
          {/* الهيدر */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">لوحة إدارة التحويلات</h1>
            <div className="flex gap-2">
              {selectedTransfers.length > 0 && (
                <Button 
                  onClick={handleDeleteSelected} 
                  variant="destructive" 
                  size="sm"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف المحدد ({selectedTransfers.length})
                </Button>
              )}
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
              <Button onClick={() => setLocation('/dashboard')} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة للوحة التحكم
              </Button>
            </div>
          </div>

          {/* بطاقات الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium">إجمالي التحويلات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatNumber(stats.total)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium">داخلية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">{formatNumber(stats.internal)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium">بين المدن</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-purple-600">{formatNumber(stats.city)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium">دولية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-orange-600">{formatNumber(stats.international)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium">قيد الانتظار</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-amber-600">{formatNumber(stats.pending)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium">مكتملة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">{formatNumber(stats.completed)}</div>
              </CardContent>
            </Card>
          </div>

          {/* أدوات البحث والفلترة */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="البحث باسم المرسل، المستلم، المكتب، رمز التحقق، أو الرقم المرجعي..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="نوع التحويل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="internal">داخلية</SelectItem>
                    <SelectItem value="city">مدينية</SelectItem>
                    <SelectItem value="international">دولية</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="completed">مكتملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* جدول التحويلات */}
          <Card>
            <CardHeader>
              <CardTitle>جميع التحويلات</CardTitle>
              <CardDescription>
                التحويلات الداخلية والمدينية والدولية المسجلة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredTransfers.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  {allTransfers.length === 0 ? 'لا توجد تحويلات مسجلة بعد' : 'لا توجد تحويلات تطابق البحث'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectedTransfers.length === filteredTransfers.length && filteredTransfers.length > 0}
                            onCheckedChange={handleSelectAll}
                            data-testid="select-all-transfers"
                          />
                        </TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>المرسل</TableHead>
                        <TableHead>المستلم</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>العمولة</TableHead>
                        <TableHead>الكود/المرجع</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ الإرسال</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransfers.map((transfer: Transfer) => {
                        const getTransferTypeBadge = (type: string) => {
                          const configs = {
                            internal: { color: 'bg-blue-100 text-blue-800', label: 'داخلية' },
                            city: { color: 'bg-purple-100 text-purple-800', label: 'مدينية' },
                            international: { color: 'bg-orange-100 text-orange-800', label: 'دولية' }
                          };
                          const config = configs[type as keyof typeof configs] || { color: 'bg-gray-100 text-gray-800', label: type };
                          return <Badge className={config.color}>{config.label}</Badge>;
                        };

                        const getReceiverName = () => {
                          if (transfer.type === 'internal') {
                            return transfer.receiverName || 'غير محدد';
                          } else if (transfer.type === 'city' || transfer.type === 'international') {
                            return transfer.recipientName || 'غير محدد';
                          }
                          return 'غير محدد';
                        };

                        const transferFullId = `${transfer.type}-${transfer.id}`;
                        const isSelected = selectedTransfers.includes(transferFullId);

                        return (
                          <TableRow key={transferFullId}>
                            <TableCell className="w-12">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => handleSelectTransfer(transfer.id.toString(), transfer.type)}
                                data-testid={`select-transfer-${transferFullId}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{transfer.id}</TableCell>
                            <TableCell>{getTransferTypeBadge(transfer.type)}</TableCell>
                            <TableCell>{transfer.senderName}</TableCell>
                            <TableCell>{getReceiverName()}</TableCell>
                            <TableCell className="font-mono">
                              {formatNumber(parseFloat(transfer.amount))} {transfer.currency}
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatNumber(parseFloat(transfer.commission))} {transfer.currency}
                            </TableCell>
                            <TableCell className="font-mono">
                              {transfer.verificationCode || transfer.referenceNumber || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={transfer.status === 'completed' ? 'default' : 'secondary'}
                                className={transfer.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}
                              >
                                {transfer.status === 'completed' ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 ml-1" />
                                    مكتملة
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 ml-1" />
                                    قيد الانتظار
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(transfer.createdAt)}</TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedTransfers([transferFullId]);
                                  setShowDeleteDialog(true);
                                }}
                                disabled={deleteMutation.isPending}
                                data-testid={`delete-transfer-${transferFullId}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* مربع حوار تأكيد الحذف */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {selectedTransfers.length} تحويل؟ 
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}