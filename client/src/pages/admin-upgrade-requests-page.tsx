import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, X, Search, Filter, Loader2, AlertCircle, Globe, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertToWesternNumerals } from "@/lib/number-utils";

interface UpgradeRequest {
  id: number;
  userId: number;
  fullName: string;
  userEmail: string;
  phone: string;
  city: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  commissionRate?: number;
  businessLicenseNumber?: string;
  documents?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface ExternalTransferRequest {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  userType: string;
  phone: string;
  city: string;
  requestedLimits: {
    daily: number;
    monthly: number;
    currencies: string[];
    countries: string[];
  };
  message?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt?: string;
  decidedBy?: number;
  reviewNotes?: string;
}

export default function AdminUpgradeRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  
  // External transfer request states
  const [extDialogOpen, setExtDialogOpen] = useState(false);
  const [selectedExtRequest, setSelectedExtRequest] = useState<ExternalTransferRequest | null>(null);
  const [extDialogAction, setExtDialogAction] = useState<"approve" | "reject">("approve");
  const [extReviewNotes, setExtReviewNotes] = useState("");
  const [extLimits, setExtLimits] = useState({
    daily: 50000,
    monthly: 200000,
    currencies: ['USD', 'EUR', 'LYD'] as string[],
    countries: [] as string[] // جميع البلدان مسموحة تلقائياً
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch upgrade requests
  const { data: requests, isLoading: isLoadingRequests } = useQuery<UpgradeRequest[]>({
    queryKey: ["/api/admin/upgrade-requests"],
  });

  // Fetch external transfer requests
  const { data: extRequests, isLoading: isLoadingExtRequests } = useQuery<ExternalTransferRequest[]>({
    queryKey: ["/api/admin/upgrade/external-transfer/requests"],
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      await apiRequest(`/api/admin/upgrade-requests/${id}`, "PATCH", { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrade-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // تنعش بيانات المستخدم
      setDialogOpen(false);
      setReviewNotes("");
      toast({
        title: "نجح التحديث",
        description: "تم تحديث حالة الطلب بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الطلب",
        variant: "destructive",
      });
    },
  });

  // External transfer approve mutation
  const extApproveMutation = useMutation({
    mutationFn: async ({ id, daily, monthly, currencies, countries }: { 
      id: number; 
      daily: number; 
      monthly: number; 
      currencies: string[]; 
      countries: string[]; 
    }) => {
      await apiRequest(`/api/admin/upgrade/external-transfer/requests/${id}/approve`, "POST", {
        daily,
        monthly,
        currencies,
        countries
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrade/external-transfer/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // تنعش بيانات المستخدم
      setExtDialogOpen(false);
      setExtReviewNotes("");
      toast({
        title: "تمت الموافقة",
        description: "تم قبول طلب التحويل الخارجي وتفعيل الصلاحية",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء موافقة الطلب",
        variant: "destructive",
      });
    },
  });

  // External transfer reject mutation
  const extRejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      await apiRequest(`/api/admin/upgrade/external-transfer/requests/${id}/reject`, "POST", {
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrade/external-transfer/requests"] });
      setExtDialogOpen(false);
      setExtReviewNotes("");
      toast({
        title: "تم الرفض",
        description: "تم رفض طلب التحويل الخارجي",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء رفض الطلب",
        variant: "destructive",
      });
    },
  });

  // Filter requests
  const filteredRequests = (requests || []).filter((request: UpgradeRequest) => {
    const matchesSearch = request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter external transfer requests
  const filteredExtRequests = (extRequests || []).filter((request: ExternalTransferRequest) => {
    const matchesSearch = request.userFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openDialog = (request: UpgradeRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setDialogAction(action);
    setDialogOpen(true);
  };

  const openExtDialog = (request: ExternalTransferRequest, action: "approve" | "reject") => {
    setSelectedExtRequest(request);
    setExtDialogAction(action);
    setExtLimits({
      daily: request.requestedLimits.daily,
      monthly: request.requestedLimits.monthly,
      currencies: request.requestedLimits.currencies,
      countries: request.requestedLimits.countries
    });
    setExtDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (!selectedRequest) return;
    
    const status = dialogAction === "approve" ? "approved" : "rejected";
    statusMutation.mutate({
      id: selectedRequest.id,
      status,
      notes: reviewNotes
    });
  };

  const handleExtStatusUpdate = () => {
    if (!selectedExtRequest) return;
    
    if (extDialogAction === "approve") {
      // التحقق من صحة البيانات قبل الإرسال
      const requestData = {
        id: selectedExtRequest.id,
        daily: Number(extLimits.daily) || 50000,
        monthly: Number(extLimits.monthly) || 200000,
        currencies: Array.isArray(extLimits.currencies) && extLimits.currencies.length > 0 
          ? extLimits.currencies 
          : ['USD', 'EUR', 'LYD'],
        countries: [] // جميع البلدان مسموحة تلقائياً
      };
      
      console.log('إرسال بيانات الموافقة:', requestData);
      
      extApproveMutation.mutate(requestData);
    } else {
      extRejectMutation.mutate({
        id: selectedExtRequest.id,
        reason: extReviewNotes
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">قيد المراجعة</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800">تمت الموافقة</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      numberingSystem: 'latn'
    });
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">إدارة الطلبات</h1>
            <p className="text-muted-foreground">إدارة طلبات ترقية المستخدمين وطلبات التحويل الخارجي</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              placeholder="البحث عن طلبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-md px-2 py-1.5 text-sm"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">تمت الموافقة</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="upgrade" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upgrade" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              طلبات التحويل بين المدن
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              طلبات التحويل الخارجي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upgrade" className="mt-6">

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>إدارة طلبات ترقية المستخدمين</CardTitle>
            <CardDescription>
              عرض وإدارة طلبات ترقية المستخدمين إلى وكلاء صرافة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
              </div>
            ) : !requests?.length ? (
              <Alert className="border-blue-200 bg-blue-50/50 text-blue-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>لا توجد طلبات</AlertTitle>
                <AlertDescription>
                  لا توجد طلبات ترقية مستخدمين في الوقت الحالي.
                </AlertDescription>
              </Alert>
            ) : !filteredRequests?.length ? (
              <Alert className="border-amber-200 bg-amber-50/50 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>لا توجد نتائج</AlertTitle>
                <AlertDescription>
                  لا توجد طلبات تطابق معايير البحث الحالية.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>قائمة طلبات ترقية المستخدمين</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">الاسم</TableHead>
                      <TableHead className="text-left">البريد الإلكتروني</TableHead>
                      <TableHead className="text-left">الهاتف</TableHead>
                      <TableHead className="text-left">المدينة</TableHead>
                      <TableHead className="text-left">العمولة</TableHead>
                      <TableHead className="text-left">الحالة</TableHead>
                      <TableHead className="text-left">تاريخ الطلب</TableHead>
                      <TableHead className="text-left">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests?.map((request: UpgradeRequest) => (
                      <TableRow key={request.id} className="group">
                        <TableCell className="font-medium text-left">{request.fullName}</TableCell>
                        <TableCell className="text-left">{request.userEmail}</TableCell>
                        <TableCell className="text-left">{request.phone}</TableCell>
                        <TableCell className="text-left">{request.city}</TableCell>
                        <TableCell className="text-left">
                          {request.commissionRate ? `${request.commissionRate}%` : "—"}
                        </TableCell>
                        <TableCell className="text-left">{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-left">
                          {formatDate(request.createdAt)}
                        </TableCell>
                        <TableCell className="text-left">
                          {request.status === "pending" ? (
                            <div className="flex space-x-2 space-x-reverse">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-green-500 text-green-500 hover:bg-green-50"
                                onClick={() => openDialog(request, "approve")}
                              >
                                <CheckCircle className="h-4 w-4 ml-1" />
                                قبول
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() => openDialog(request, "reject")}
                              >
                                <X className="h-4 w-4 ml-1" />
                                رفض
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-500">
                              {request.status === "approved" ? "تمت الموافقة" : "تم الرفض"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="external" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-col space-y-1.5 p-6 pl-[575px] pr-[575px] pt-[16px] pb-[16px]">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  إدارة طلبات التحويل الخارجي
                </CardTitle>
                <CardDescription className="text-center">
                  عرض وإدارة طلبات تفعيل التحويل الخارجي
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingExtRequests ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                  </div>
                ) : !extRequests?.length ? (
                  <Alert className="border-blue-200 bg-blue-50/50 text-blue-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>لا توجد طلبات</AlertTitle>
                    <AlertDescription>
                      لا توجد طلبات تحويل خارجي في الوقت الحالي.
                    </AlertDescription>
                  </Alert>
                ) : !filteredExtRequests?.length ? (
                  <Alert className="border-amber-200 bg-amber-50/50 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>لا توجد نتائج</AlertTitle>
                    <AlertDescription>
                      لا توجد طلبات تطابق معايير البحث الحالية.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption className="text-right">
                        عدد الطلبات: {filteredExtRequests.length}
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">الإجراءات</TableHead>
                          <TableHead className="text-center">البريد الإلكتروني</TableHead>
                          <TableHead className="text-center">نوع الحساب</TableHead>
                          <TableHead className="text-center">الحدود المطلوبة</TableHead>
                          <TableHead className="text-center">العملات</TableHead>
                          <TableHead className="text-center">الدولة</TableHead>
                          <TableHead className="text-center">تاريخ الطلب</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                          <TableHead className="text-center">الاسم</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExtRequests.map((request) => (
                          <TableRow key={request.id} className="hover:bg-gray-50/50">
                            {/* 1. الإجراءات - أقصى اليمين */}
                            <TableCell className="text-right">
                              {request.status === "pending" ? (
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-green-500 text-green-500 hover:bg-green-50"
                                    onClick={() => openExtDialog(request, "approve")}
                                  >
                                    <CheckCircle className="h-4 w-4 ml-1" />
                                    قبول
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-red-500 text-red-500 hover:bg-red-50"
                                    onClick={() => openExtDialog(request, "reject")}
                                  >
                                    <X className="h-4 w-4 ml-1" />
                                    رفض
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-neutral-500">
                                  {request.status === "approved" ? "تمت الموافقة" : "تم الرفض"}
                                </span>
                              )}
                            </TableCell>
                            {/* 2. البريد الإلكتروني */}
                            <TableCell className="text-center">
                              {request.userEmail}
                            </TableCell>
                            {/* 3. نوع الحساب */}
                            <TableCell className="text-center">
                              <Badge variant="outline">{request.userType}</Badge>
                            </TableCell>
                            {/* 4. الحدود المطلوبة */}
                            <TableCell className="text-center">
                              <div className="space-y-1 text-sm">
                                <div>يومي: {request.requestedLimits?.daily ? convertToWesternNumerals(request.requestedLimits.daily.toString()) : "غير محدد"}</div>
                                <div>شهري: {request.requestedLimits?.monthly ? convertToWesternNumerals(request.requestedLimits.monthly.toString()) : "غير محدد"}</div>
                              </div>
                            </TableCell>
                            {/* 5. العملات */}
                            <TableCell className="text-center">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {request.requestedLimits?.currencies?.map(currency => (
                                  <Badge key={currency} variant="secondary" className="text-xs">
                                    {currency}
                                  </Badge>
                                )) || <span className="text-sm text-muted-foreground">غير محدد</span>}
                              </div>
                            </TableCell>
                            {/* 6. الدولة */}
                            <TableCell className="text-center">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {request.requestedLimits?.countries?.slice(0, 3).map(country => (
                                  <Badge key={country} variant="secondary" className="text-xs">
                                    {country}
                                  </Badge>
                                )) || <span className="text-sm text-muted-foreground">غير محدد</span>}
                                {request.requestedLimits?.countries?.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{request.requestedLimits.countries.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            {/* 7. تاريخ الطلب */}
                            <TableCell className="text-xs text-center">
                              {formatDate(request.createdAt)}
                            </TableCell>
                            {/* 8. الحالة */}
                            <TableCell className="text-center">
                              {getStatusBadge(request.status)}
                            </TableCell>
                            {/* 9. الاسم - أقصى اليسار */}
                            <TableCell className="font-medium text-center">
                              {request.userFullName}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Upgrade Requests Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "الموافقة على طلب ترقية التحويل بين المدن" : "رفض طلب ترقية التحويل بين المدن"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve"
                ? "هل أنت متأكد من الموافقة على طلب ترقية هذا الحساب؟"
                : "هل أنت متأكد من رفض طلب ترقية هذا الحساب؟"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-bold">الاسم: </span>
                  <span>{selectedRequest.fullName}</span>
                </div>
                <div>
                  <span className="font-bold">البريد الإلكتروني: </span>
                  <span>{selectedRequest.userEmail}</span>
                </div>
                <div>
                  <span className="font-bold">الهاتف: </span>
                  <span>{selectedRequest.phone}</span>
                </div>
                <div>
                  <span className="font-bold">المدينة: </span>
                  <span>{selectedRequest.city}</span>
                </div>
                <div>
                  <span className="font-bold">نسبة العمولة: </span>
                  <span>{selectedRequest.commissionRate ? `${selectedRequest.commissionRate}%` : "غير محدد"}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ملاحظات المراجعة (اختياري):
                </label>
                <Textarea
                  placeholder="أضف ملاحظات حول قرار الموافقة أو الرفض..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="resize-none h-24"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant={dialogAction === "approve" ? "default" : "destructive"}
              onClick={handleStatusUpdate}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جارٍ التنفيذ...
                </>
              ) : dialogAction === "approve" ? (
                "موافقة"
              ) : (
                "رفض"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={statusMutation.isPending}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* External Transfer Requests Dialog */}
      <Dialog open={extDialogOpen} onOpenChange={setExtDialogOpen}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {extDialogAction === "approve" ? "الموافقة على طلب التحويل الخارجي" : "رفض طلب التحويل الخارجي"}
            </DialogTitle>
            <DialogDescription>
              {extDialogAction === "approve"
                ? "راجع التفاصيل وحدد الحدود النهائية للموافقة على الطلب"
                : "هل أنت متأكد من رفض طلب التحويل الخارجي؟"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedExtRequest && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-bold">اسم المستخدم: </span>
                  <span>{selectedExtRequest.userFullName}</span>
                </div>
                <div>
                  <span className="font-bold">البريد الإلكتروني: </span>
                  <span>{selectedExtRequest.userEmail}</span>
                </div>
                <div>
                  <span className="font-bold">نوع الحساب: </span>
                  <span>{selectedExtRequest.userType}</span>
                </div>
                <div>
                  <span className="font-bold">تاريخ الطلب: </span>
                  <span>{formatDate(selectedExtRequest.createdAt)}</span>
                </div>
              </div>

              {selectedExtRequest.message && (
                <div>
                  <span className="font-bold block mb-2">رسالة المستخدم:</span>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedExtRequest.message}</p>
                </div>
              )}

              {extDialogAction === "approve" ? (
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">تحديد الحدود والعملات المسموحة:</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">الحد اليومي:</label>
                      <Input
                        type="number"
                        value={extLimits.daily}
                        onChange={(e) => setExtLimits(prev => ({ ...prev, daily: parseInt(e.target.value) || 0 }))}
                        min="100"
                        max="50000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">الحد الشهري:</label>
                      <Input
                        type="number"
                        value={extLimits.monthly}
                        onChange={(e) => setExtLimits(prev => ({ ...prev, monthly: parseInt(e.target.value) || 0 }))}
                        min="1000"
                        max="200000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">العملات المسموحة:</label>
                    <div className="flex flex-wrap gap-2">
                      {['USD', 'EUR', 'TRY', 'EGP', 'TND', 'AED', 'SAR', 'GBP'].map(currency => (
                        <Badge
                          key={currency}
                          variant={extLimits.currencies?.includes(currency) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            setExtLimits(prev => ({
                              ...prev,
                              currencies: (prev.currencies || []).includes(currency)
                                ? (prev.currencies || []).filter(c => c !== currency)
                                : [...(prev.currencies || []), currency]
                            }));
                          }}
                        >
                          {currency}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <label className="block text-sm font-medium mb-2 text-green-800">الدول المسموحة:</label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        جميع البلدان المتاحة في النظام ✓
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      الوكيل الدولي سيتمكن من إجراء التحويلات إلى جميع البلدان المدعومة في المنصة
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    سبب الرفض:
                  </label>
                  <Textarea
                    placeholder="أدخل سبب رفض الطلب..."
                    value={extReviewNotes}
                    onChange={(e) => setExtReviewNotes(e.target.value)}
                    className="resize-none h-24"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant={extDialogAction === "approve" ? "default" : "destructive"}
              onClick={handleExtStatusUpdate}
              disabled={extApproveMutation.isPending || extRejectMutation.isPending}
            >
              {(extApproveMutation.isPending || extRejectMutation.isPending) ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جارٍ التنفيذ...
                </>
              ) : extDialogAction === "approve" ? (
                "موافقة وتفعيل"
              ) : (
                "رفض الطلب"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExtDialogOpen(false)}
              disabled={extApproveMutation.isPending || extRejectMutation.isPending}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}