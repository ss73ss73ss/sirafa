import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-ar";
import { Input } from "@/components/ui/input-ar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Search, FileText, Eye, Calendar, Users, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface InternalTransferLog {
  id: number;
  transferId: number;
  senderName: string;
  senderAccountNumber: string;
  receiverName: string;
  receiverAccountNumber: string;
  amount: string;
  commission: string;
  currency: string;
  note: string | null;
  status: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface LogDetail extends InternalTransferLog {
  originalTransferNote: string | null;
  originalTransferCreatedAt: string;
}

interface LogsResponse {
  logs: InternalTransferLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  statistics: {
    totalAmount: string;
    totalCommission: string;
    totalTransfers: number;
  };
}

export default function AdminInternalTransferLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  // Update document title
  useEffect(() => {
    document.title = "سجلات التحويلات الداخلية - لوحة تحكم المدير";
  }, []);

  // جلب سجلات التحويلات الداخلية
  const { data: logsData, isLoading, refetch } = useQuery<LogsResponse>({
    queryKey: [
      "/api/admin/internal-transfer-logs",
      currentPage,
      searchTerm,
      currencyFilter,
      statusFilter,
      dateFromFilter,
      dateToFilter
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
        ...(searchTerm && { search: searchTerm }),
        ...(currencyFilter && currencyFilter !== "all" && { currency: currencyFilter }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter })
      });

      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/admin/internal-transfer-logs?${params}`, {
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        }
      });
      
      if (response.status === 401) {
        // Token منتهي الصلاحية - إعادة توجيه لتسجيل الدخول
        localStorage.removeItem("auth_token");
        window.location.href = "/auth";
        return;
      }
      
      if (!response.ok) {
        throw new Error('فشل في جلب سجلات التحويلات');
      }
      return response.json();
    }
  });

  // جلب تفاصيل سجل محدد
  const { data: logDetail } = useQuery<LogDetail>({
    queryKey: ["/api/admin/internal-transfer-logs", selectedLogId],
    queryFn: async () => {
      if (!selectedLogId) return null;
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/admin/internal-transfer-logs/${selectedLogId}`, {
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        window.location.href = "/auth";
        return;
      }
      
      if (!response.ok) {
        throw new Error('فشل في جلب تفاصيل السجل');
      }
      return response.json();
    },
    enabled: !!selectedLogId
  });

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCurrencyFilter("all");
    setStatusFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
    setCurrentPage(1);
    refetch();
  };

  const formatCurrency = (amount: string, currency: string) => {
    return `${parseFloat(amount).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ${currency}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'failed':
        return <Badge variant="destructive">فاشل</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">سجلات التحويلات الداخلية</h1>
          <p className="text-muted-foreground mt-2">
            مراقبة جميع التحويلات الداخلية بين المستخدمين
          </p>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      {logsData?.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التحويلات</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logsData.statistics.totalTransfers.toLocaleString('ar-EG')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المبالغ</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {parseFloat(logsData.statistics.totalAmount).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي العمولات</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {parseFloat(logsData.statistics.totalCommission).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* أدوات البحث والترشيح */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث والترشيح
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">البحث</label>
              <Input
                placeholder="ابحث بالاسم أو رقم الحساب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">العملة</label>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العملات</SelectItem>
                  <SelectItem value="LYD">دينار ليبي</SelectItem>
                  <SelectItem value="USD">دولار أمريكي</SelectItem>
                  <SelectItem value="EUR">يورو</SelectItem>
                  <SelectItem value="TRY">ليرة تركية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">الحالة</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="failed">فاشل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">من تاريخ</label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">إلى تاريخ</label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 ml-2" />
              بحث
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول السجلات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            سجلات التحويلات
          </CardTitle>
          {logsData?.pagination && (
            <CardDescription>
              عرض {logsData.logs.length} من {logsData.pagination.totalCount} سجل
              (الصفحة {logsData.pagination.currentPage} من {logsData.pagination.totalPages})
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : !logsData?.logs?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سجلات متاحة
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم السجل</TableHead>
                    <TableHead>المرسل</TableHead>
                    <TableHead>المستلم</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>العمولة</TableHead>
                    <TableHead>العملة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsData.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">#{log.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.senderName}</div>
                          <div className="text-sm text-muted-foreground">
                            {log.senderAccountNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.receiverName}</div>
                          <div className="text-sm text-muted-foreground">
                            {log.receiverAccountNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(log.amount, log.currency)}</TableCell>
                      <TableCell>{formatCurrency(log.commission, log.currency)}</TableCell>
                      <TableCell>{log.currency}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLogId(log.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>تفاصيل التحويل #{log.id}</DialogTitle>
                            </DialogHeader>
                            {logDetail && (
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-6">
                                  {/* معلومات أساسية */}
                                  <div>
                                    <h3 className="text-lg font-semibold mb-3">المعلومات الأساسية</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">رقم السجل</label>
                                        <p className="text-sm">#{logDetail.id}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">رقم التحويل الأصلي</label>
                                        <p className="text-sm">#{logDetail.transferId}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">المبلغ</label>
                                        <p className="text-sm">{formatCurrency(logDetail.amount, logDetail.currency)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">العمولة</label>
                                        <p className="text-sm">{formatCurrency(logDetail.commission, logDetail.currency)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                                        <p className="text-sm">{getStatusBadge(logDetail.status)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">التاريخ</label>
                                        <p className="text-sm">
                                          {format(new Date(logDetail.createdAt), "dd MMM yyyy HH:mm:ss", { locale: ar })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* معلومات المرسل والمستلم */}
                                  <div>
                                    <h3 className="text-lg font-semibold mb-3">أطراف التحويل</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                      <div>
                                        <h4 className="font-medium mb-2">المرسل</h4>
                                        <div className="space-y-1">
                                          <p className="text-sm"><strong>الاسم:</strong> {logDetail.senderName}</p>
                                          <p className="text-sm"><strong>رقم الحساب:</strong> {logDetail.senderAccountNumber}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">المستلم</h4>
                                        <div className="space-y-1">
                                          <p className="text-sm"><strong>الاسم:</strong> {logDetail.receiverName}</p>
                                          <p className="text-sm"><strong>رقم الحساب:</strong> {logDetail.receiverAccountNumber}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* الملاحظات */}
                                  {(logDetail.note || logDetail.originalTransferNote) && (
                                    <>
                                      <Separator />
                                      <div>
                                        <h3 className="text-lg font-semibold mb-3">الملاحظات</h3>
                                        {logDetail.note && (
                                          <div className="mb-2">
                                            <label className="text-sm font-medium text-muted-foreground">ملاحظة السجل</label>
                                            <p className="text-sm bg-muted p-2 rounded">{logDetail.note}</p>
                                          </div>
                                        )}
                                        {logDetail.originalTransferNote && (
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">ملاحظة التحويل الأصلي</label>
                                            <p className="text-sm bg-muted p-2 rounded">{logDetail.originalTransferNote}</p>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}

                                  <Separator />

                                  {/* معلومات تقنية */}
                                  <div>
                                    <h3 className="text-lg font-semibold mb-3">المعلومات التقنية</h3>
                                    <div className="space-y-2">
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">عنوان IP</label>
                                        <p className="text-sm font-mono">{logDetail.ipAddress}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">معرف المتصفح</label>
                                        <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                                          {logDetail.userAgent}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </ScrollArea>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* التصفح */}
          {logsData?.pagination && logsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                الصفحة {logsData.pagination.currentPage} من {logsData.pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(logsData.pagination.totalPages, currentPage + 1))}
                  disabled={currentPage >= logsData.pagination.totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}