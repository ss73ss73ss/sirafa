import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { FileText, Shield, Settings, Activity, Download, Eye, RefreshCw } from "lucide-react";

interface Receipt {
  id: string;
  txnId: string;
  version: number;
  locale: string;
  revoked: boolean;
  createdAt: string;
  hash: string;
}

interface ReceiptStats {
  total: number;
  revoked: number;
  active: number;
  recent24h: number;
}

interface AuditLog {
  id: number;
  receiptId: string;
  action: string;
  userId?: string;
  metadata?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export default function ReceiptsManagement() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stats, setStats] = useState<ReceiptStats>({ total: 0, revoked: 0, active: 0, recent24h: 0 });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<string>("");
  const [settingKey, setSettingKey] = useState("");
  const [settingValue, setSettingValue] = useState("");
  const [loading, setLoading] = useState(false);
  
  // تحقق من صلاحيات المدير
  useEffect(() => {
    if (user && user.type !== 'admin') {
      toast({
        title: "غير مصرح لك",
        description: "يجب تسجيل الدخول كمدير للوصول إلى هذه الصفحة",
        variant: "destructive"
      });
      return;
    }
    
    if (user && user.type === 'admin') {
      loadStats();
      loadReceipts();
    }
  }, [user]);

  // تحميل الإحصائيات
  const loadStats = async () => {
    try {
      const response = await apiRequest("/api/receipts/admin/stats");
      if (!response.ok) {
        const errorData = await response.json();
        console.error("خطأ API في الإحصائيات:", errorData);
        toast({
          title: "خطأ في التحقق من الصلاحيات",
          description: errorData.message || "فشل في تحميل إحصائيات الإيصالات",
          variant: "destructive"
        });
        return;
      }
      const data = await response.json() as ReceiptStats;
      setStats(data);
    } catch (error) {
      console.error("خطأ في تحميل الإحصائيات:", error);
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم لتحميل الإحصائيات",
        variant: "destructive"
      });
    }
  };

  // تحميل قائمة الإيصالات
  const loadReceipts = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("/api/receipts/admin/all?limit=50&offset=0");
      if (!response.ok) {
        const errorData = await response.json();
        console.error("خطأ API في الإيصالات:", errorData);
        toast({
          title: "خطأ في التحقق من الصلاحيات",
          description: errorData.message || "فشل في تحميل قائمة الإيصالات",
          variant: "destructive"
        });
        return;
      }
      const data = await response.json() as Receipt[];
      setReceipts(data);
    } catch (error) {
      console.error("خطأ في تحميل الإيصالات:", error);
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم لتحميل الإيصالات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // تحميل سجل التدقيق
  const loadAuditLogs = async (receiptId: string) => {
    try {
      const response = await apiRequest(`/api/receipts/admin/audit/${receiptId}`);
      const data = await response.json() as AuditLog[];
      setAuditLogs(data);
    } catch (error) {
      console.error("خطأ في تحميل سجل التدقيق:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجل التدقيق",
        variant: "destructive"
      });
    }
  };

  // تحديث إعداد
  const updateSetting = async () => {
    if (!settingKey || settingValue === "") {
      toast({
        title: "خطأ",
        description: "يرجى إدخال المفتاح والقيمة",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest("/api/receipts/admin/settings", "POST", { key: settingKey, value: settingValue });
      
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الإعداد بنجاح"
      });
      
      setSettingKey("");
      setSettingValue("");
    } catch (error) {
      console.error("خطأ في تحديث الإعداد:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإعداد",
        variant: "destructive"
      });
    }
  };

  // تحميل البيانات عند التحميل الأولي
  useEffect(() => {
    loadStats();
    loadReceipts();
  }, []);

  // التحقق من صلاحيات المدير
  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center" dir="rtl">
        <h1 className="text-2xl font-bold mb-4">جاري التحقق من الهوية...</h1>
      </div>
    );
  }

  if (user.type !== 'admin') {
    return (
      <div className="container mx-auto p-6 text-center" dir="rtl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-800 mb-2">غير مصرح لك</h1>
          <p className="text-red-600 mb-4">
            هذه الصفحة متاحة للمديرين فقط. يجب تسجيل الدخول بحساب المدير للوصول إلى إدارة نظام الإيصالات الرقمية.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-medium">حساب المدير المطلوب:</p>
            <p className="text-yellow-700">ss73ss73ss73@gmail.com</p>
          </div>
          <p className="text-sm text-red-500 mt-2">
            المستخدم الحالي: {user.fullName} ({user.type}) - {user.email}
          </p>
          <Button 
            onClick={() => window.location.href = '/login'} 
            className="mt-4"
            variant="outline"
          >
            تسجيل دخول بحساب المدير
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" />
          إدارة نظام الإيصالات الرقمية
        </h1>
        <Button onClick={() => { loadStats(); loadReceipts(); }} variant="outline">
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الإيصالات</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الإيصالات النشطة</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الإيصالات الملغية</p>
                <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
              </div>
              <Activity className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">آخر 24 ساعة</p>
                <p className="text-2xl font-bold text-purple-600">{stats.recent24h}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="receipts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="receipts">قائمة الإيصالات</TabsTrigger>
          <TabsTrigger value="audit">سجل التدقيق</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>قائمة الإيصالات الرقمية</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{receipt.id}</span>
                          <Badge variant={receipt.revoked ? "destructive" : "default"}>
                            {receipt.revoked ? "ملغي" : "نشط"}
                          </Badge>
                          <Badge variant="outline">v{receipt.version}</Badge>
                          <Badge variant="secondary">{receipt.locale}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          المعاملة: {receipt.txnId} | تاريخ الإنشاء: {new Date(receipt.createdAt).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReceipt(receipt.id);
                            loadAuditLogs(receipt.id);
                          }}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض التدقيق
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/api/receipts/${receipt.id}/file`, '_blank')}
                        >
                          <Download className="h-4 w-4 ml-1" />
                          تحميل
                        </Button>
                      </div>
                    </div>
                  ))}
                  {receipts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد إيصالات متاحة
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل التدقيق</CardTitle>
              {selectedReceipt && (
                <p className="text-sm text-gray-600">الإيصال المحدد: {selectedReceipt}</p>
              )}
            </CardHeader>
            <CardContent>
              {!selectedReceipt ? (
                <div className="text-center py-8 text-gray-500">
                  يرجى اختيار إيصال لعرض سجل التدقيق الخاص به
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(log.timestamp).toLocaleString('ar-SA')}
                          </span>
                        </div>
                        {log.userId && (
                          <span className="text-sm text-gray-600">المستخدم: {log.userId}</span>
                        )}
                      </div>
                      {log.metadata && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>تفاصيل إضافية:</strong> {log.metadata}
                        </div>
                      )}
                      {log.ipAddress && (
                        <div className="mt-1 text-xs text-gray-500">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد سجلات تدقيق متاحة
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات نظام الإيصالات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settingKey">مفتاح الإعداد</Label>
                  <Input
                    id="settingKey"
                    value={settingKey}
                    onChange={(e) => setSettingKey(e.target.value)}
                    placeholder="مثال: receipt_template_header"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settingValue">قيمة الإعداد</Label>
                  <Input
                    id="settingValue"
                    value={settingValue}
                    onChange={(e) => setSettingValue(e.target.value)}
                    placeholder="قيمة الإعداد"
                  />
                </div>
              </div>
              <Button onClick={updateSetting} className="w-full">
                <Settings className="h-4 w-4 ml-2" />
                تحديث الإعداد
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}