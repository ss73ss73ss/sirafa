import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { formatCurrency } from "@/lib/number-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  DollarSign
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CommissionLog {
  id: number;
  userId: number;
  userName: string;
  offerType: string;
  commissionAmount: string;
  commissionCurrency: string;
  sourceId: number;
  sourceType: string;
  action: string;
  description: string;
  createdAt: string;
}

interface CommissionLogsResponse {
  logs: CommissionLog[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CommissionLogsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  // التحقق من صلاحية المدير
  if (user && user.type !== 'admin') {
    toast({
      title: "غير مصرح",
      description: "هذه الصفحة متاحة للمدراء فقط",
      variant: "destructive",
    });
    setLocation("/");
  }

  const { data: logsData, isLoading, error } = useQuery<CommissionLogsResponse>({
    queryKey: [`/api/admin/commission-logs`, currentPage],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.type === 'admin'
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'deduct':
        return <Badge variant="destructive">خصم</Badge>;
      case 'refund':
        return <Badge variant="secondary">استرداد</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getOfferTypeBadge = (offerType: string) => {
    switch (offerType) {
      case 'sell':
        return <Badge variant="default" className="bg-red-500">بيع</Badge>;
      case 'buy':
        return <Badge variant="default" className="bg-green-500">شراء</Badge>;
      default:
        return <Badge variant="outline">{offerType}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mr-2">جاري تحميل سجلات العمولة...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 rtl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p>حدث خطأ في تحميل سجلات العمولة</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 rtl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/admin")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للإدارة
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-l from-primary to-primary/70 text-transparent bg-clip-text">
              سجلات العمولة <FileText className="inline-block ml-2" />
            </h1>
            <p className="text-muted-foreground mt-1">
              عرض جميع عمليات خصم واسترداد العمولة في سوق العملة
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            سجل عمليات العمولة
          </CardTitle>
          <CardDescription>
            عرض تفصيلي لجميع عمليات خصم واسترداد العمولة
            {logsData && (
              <span className="text-primary font-medium">
                {" "}({logsData.total} عملية إجمالي)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsData && logsData.logs.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المستخدم</TableHead>
                      <TableHead className="text-right">نوع العرض</TableHead>
                      <TableHead className="text-right">مبلغ العمولة</TableHead>
                      <TableHead className="text-right">العملة</TableHead>
                      <TableHead className="text-right">العملية</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.userName}
                          <div className="text-sm text-muted-foreground">
                            ID: {log.userId}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getOfferTypeBadge(log.offerType)}
                        </TableCell>
                        <TableCell className="font-mono">
                          <span className={log.action === 'deduct' ? 'text-red-600' : 'text-green-600'}>
                            {log.action === 'deduct' ? '-' : '+'}
                            {formatCurrency(parseFloat(log.commissionAmount), 'LYD')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.commissionCurrency}</Badge>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ar })}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm text-muted-foreground" title={log.description}>
                            {log.description}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            عرض #{log.sourceId}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {logsData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    عرض {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, logsData.total)} من {logsData.total} سجل
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, logsData.totalPages) }, (_, i) => {
                        let pageNum;
                        if (logsData.totalPages <= 5) {
                          pageNum = i + 1;
                        } else {
                          if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= logsData.totalPages - 2) {
                            pageNum = logsData.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(logsData.totalPages, currentPage + 1))}
                      disabled={currentPage >= logsData.totalPages}
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد سجلات عمولة</h3>
              <p className="text-muted-foreground">
                لم يتم العثور على أي سجلات عمولة حتى الآن
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}