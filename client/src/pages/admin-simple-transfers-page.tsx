import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/dashboard/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// تعريف أنواع البيانات
interface GenericTransfer {
  id: number;
  amount: string;
  currency: string;
  createdAt: string;
  sender_name?: string;
  receiver_name?: string;
  status?: string;
  code?: string;
  commission?: string;
  commission_for_system?: string;
  [key: string]: any;
}

export default function AdminSimpleTransfersPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeType, setActiveType] = useState("internal");
  const [transfers, setTransfers] = useState<GenericTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // حماية الصفحة - يجب أن يكون المستخدم مشرف
  useEffect(() => {
    if (user && user.type !== 'admin') {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);
  
  // جلب الحوالات عند تغيير نوع الحوالة
  useEffect(() => {
    loadTransfers(activeType);
  }, [activeType]);
  
  // وظيفة جلب الحوالات
  const loadTransfers = async (type: string) => {
    setIsLoading(true);
    
    try {
      let endpoint = '';
      if (type === 'internal') endpoint = '/api/admin/internal-transfers';
      if (type === 'city') endpoint = '/api/admin/city-transfers';
      if (type === 'international') endpoint = '/api/admin/inter-office-transfers';
      
      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      
      // تحويل البيانات إلى تنسيق موحد
      const formattedData = Array.isArray(data) 
        ? data.map(item => ({
            id: item.id,
            amount: item.amount,
            currency: item.currency || 'LYD',
            sender_name: item.sender_name || item.senderName,
            receiver_name: item.receiver_name || item.receiverName,
            commission: item.commission || item.commission_for_system || item.commissionForSystem,
            status: item.status || 'completed',
            code: item.code || '-',
            createdAt: item.created_at || item.createdAt
          })) 
        : [];
      
      setTransfers(formattedData);
    } catch (error) {
      console.error("خطأ في جلب الحوالات:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات الحوالات"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // عرض حالة الحوالة
  const renderStatus = (status?: string) => {
    if (!status || status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">تم</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">قيد الانتظار</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">ملغاة</Badge>;
    }
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-LY');
  };
  
  // عرض العمولة
  const getCommission = (transfer: GenericTransfer) => {
    if (transfer.commission) return transfer.commission;
    if (transfer.commission_for_system) return transfer.commission_for_system;
    return '0';
  };
  
  if (!user || user.type !== 'admin') {
    return null;
  }
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 p-4">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">سجل الحوالات - لوحة تحكم المشرف</h1>
            <Button 
              onClick={() => loadTransfers(activeType)} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>عرض جميع الحوالات</CardTitle>
              <CardDescription>اختر نوع الحوالات التي ترغب في عرضها</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeType} onValueChange={setActiveType} className="mb-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="internal">الحوالات الداخلية</TabsTrigger>
                  <TabsTrigger value="city">حوالات بين المدن</TabsTrigger>
                  <TabsTrigger value="international">حوالات دولية</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {isLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>النوع</TableHead>
                        <TableHead>من</TableHead>
                        <TableHead>إلى</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>العملة</TableHead>
                        <TableHead>العمولة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الكود</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center">
                            لا توجد حوالات لعرضها
                          </TableCell>
                        </TableRow>
                      ) : (
                        transfers.map((transfer) => (
                          <TableRow key={transfer.id}>
                            <TableCell>
                              {activeType === "internal" ? "داخلية" : 
                               activeType === "city" ? "مدينية" : "دولية"}
                            </TableCell>
                            <TableCell>{transfer.sender_name}</TableCell>
                            <TableCell>{transfer.receiver_name}</TableCell>
                            <TableCell>{transfer.amount}</TableCell>
                            <TableCell>{transfer.currency || "LYD"}</TableCell>
                            <TableCell>{getCommission(transfer)}</TableCell>
                            <TableCell>{renderStatus(transfer.status)}</TableCell>
                            <TableCell>{transfer.code || "-"}</TableCell>
                            <TableCell>{formatDate(transfer.createdAt || transfer.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}