import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Search, 
  Download, 
  Filter, 
  Users, 
  Clock,
  Eye,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ShieldAlert
} from "lucide-react";
import { useLocation } from "wouter";

interface Message {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  senderEmail: string;
  receiverId?: number;
  receiverName?: string;
  receiverEmail?: string;
  roomId?: number;
  roomName?: string;
  createdAt: string;
  type: 'private' | 'group';
  isEdited?: boolean;
  isDeleted?: boolean;
}

export default function AdminMessageMonitoringPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "private" | "group">("all");
  const [selectedTab, setSelectedTab] = useState("private");

  // التحقق من صلاحيات المشرف العام
  if (!user || user.email !== "ss73ss73ss73@gmail.com") {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center" dir="rtl">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <CardTitle className="text-2xl text-red-600">
                غير مصرح بالوصول
              </CardTitle>
              <CardDescription>
                هذه الصفحة مخصصة للمشرف العام فقط
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => navigate("/")}
                className="w-full"
                variant="outline"
              >
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة إلى لوحة التحكم
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // جلب الرسائل الخاصة الحقيقية من قاعدة البيانات
  const { data: privateMessages, isLoading: loadingPrivate, refetch: refetchPrivate } = useQuery({
    queryKey: ['/api/chat/private-messages-all'],
    refetchInterval: 10000, // تحديث كل 10 ثواني
  });

  // جلب رسائل الدردشة العامة الحقيقية
  const { data: groupMessages, isLoading: loadingGroup, refetch: refetchGroup } = useQuery({
    queryKey: ['/api/chat/messages'],
    refetchInterval: 10000, // تحديث كل 10 ثواني
  });

  // تصدير البيانات كـ CSV
  const handleExportCSV = async (type: 'private' | 'group') => {
    try {
      const response = await fetch(`/api/admin/export-messages?type=${type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${type}-messages-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ar-SA', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // فلترة الرسائل
  const filterMessages = (messages: any[] | undefined, searchTerm: string) => {
    if (!messages || !Array.isArray(messages)) return [];
    
    return messages.filter(message => {
      const matchesSearch = 
        (message.content && message.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (message.senderName && message.senderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (message.senderEmail && message.senderEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (message.receiverName && message.receiverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (message.receiverEmail && message.receiverEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (message.roomName && message.roomName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  };

  const filteredPrivateMessages = filterMessages(privateMessages as any[], searchTerm);
  const filteredGroupMessages = filterMessages(groupMessages as any[], searchTerm);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-neutral-100" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* الهيدر */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold">مراقبة الرسائل</h1>
                  <p className="text-muted-foreground">
                    نظام مراقبة شامل للمحادثات الخاصة والعامة
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    refetchPrivate();
                    refetchGroup();
                  }}
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  تحديث
                </Button>
                <Button 
                  onClick={() => navigate("/")}
                  variant="outline"
                >
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  العودة للوحة التحكم
                </Button>
              </div>
            </div>

            {/* شريط البحث والفلترة */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث في الرسائل، أسماء المرسلين، البريد الإلكتروني..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExportCSV('private')}
                    >
                      <Download className="h-4 w-4 ml-2" />
                      تصدير الخاصة
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExportCSV('group')}
                    >
                      <Download className="h-4 w-4 ml-2" />
                      تصدير العامة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الرسائل الخاصة</p>
                      <p className="text-2xl font-bold">{Array.isArray(privateMessages) ? privateMessages.length : 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">رسائل المجموعات</p>
                      <p className="text-2xl font-bold">{Array.isArray(groupMessages) ? groupMessages.length : 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Eye className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
                      <p className="text-2xl font-bold">{(Array.isArray(privateMessages) ? privateMessages.length : 0) + (Array.isArray(groupMessages) ? groupMessages.length : 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* التبويبات الرئيسية */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="private">المحادثات الخاصة</TabsTrigger>
                <TabsTrigger value="group">المجموعات العامة</TabsTrigger>
              </TabsList>

              {/* المحادثات الخاصة */}
              <TabsContent value="private" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      المحادثات الخاصة ({filteredPrivateMessages.length})
                    </CardTitle>
                    <CardDescription>
                      مراقبة الرسائل الخاصة بين المستخدمين
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPrivate ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>جاري تحميل الرسائل...</p>
                      </div>
                    ) : filteredPrivateMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p>لا توجد رسائل خاصة{searchTerm && ' مطابقة للبحث'}</p>
                        {searchTerm && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSearchTerm("")}
                            className="mt-2"
                          >
                            مسح البحث
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredPrivateMessages.map((message: any) => (
                          <div key={message.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary">#{message.id}</Badge>
                                <span className="font-medium">{message.senderName || 'مستخدم'}</span>
                                <span className="text-sm text-muted-foreground">({message.senderEmail || 'غير محدد'})</span>
                                <span className="text-sm">←</span>
                                <span className="font-medium">{message.receiverName || 'مستخدم'}</span>
                                <span className="text-sm text-muted-foreground">({message.receiverEmail || 'غير محدد'})</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatDate(message.createdAt)}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                              <p className="text-sm">{message.content || 'محتوى محذوف'}</p>
                              {message.fileUrl && (
                                <p className="text-xs text-blue-600 mt-1">📎 مرفق: {message.fileType}</p>
                              )}
                            </div>
                            {(message.isEdited || message.isDeleted) && (
                              <div className="flex gap-2">
                                {message.isEdited && <Badge variant="outline">معدلة</Badge>}
                                {message.isDeleted && <Badge variant="destructive">محذوفة</Badge>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* المجموعات العامة */}
              <TabsContent value="group" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      المجموعات العامة ({filteredGroupMessages.length})
                    </CardTitle>
                    <CardDescription>
                      مراقبة رسائل المجموعات والغرف العامة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingGroup ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>جاري تحميل الرسائل...</p>
                      </div>
                    ) : filteredGroupMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p>لا توجد رسائل في المجموعات{searchTerm && ' مطابقة للبحث'}</p>
                        {searchTerm && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSearchTerm("")}
                            className="mt-2"
                          >
                            مسح البحث
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredGroupMessages.map((message: any) => (
                          <div key={message.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary">#{message.id}</Badge>
                                <span className="font-medium">{message.senderName || 'مستخدم'}</span>
                                <span className="text-sm text-muted-foreground">({message.senderEmail || 'غير محدد'})</span>
                                <span className="text-sm">في</span>
                                <Badge variant="outline">الغرفة العامة</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatDate(message.createdAt)}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                              <p className="text-sm">{message.content || 'محتوى محذوف'}</p>
                              {message.fileUrl && (
                                <p className="text-xs text-blue-600 mt-1">📎 مرفق: {message.fileType}</p>
                              )}
                            </div>
                            {(message.isEdited || message.isDeleted) && (
                              <div className="flex gap-2">
                                {message.isEdited && <Badge variant="outline">معدلة</Badge>}
                                {message.isDeleted && <Badge variant="destructive">محذوفة</Badge>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}