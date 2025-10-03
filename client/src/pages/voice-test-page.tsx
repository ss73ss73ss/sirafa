import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { VoiceMessage } from "@/components/VoiceMessage";
import { VoiceButton } from "@/components/VoiceButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mic, Search, BarChart3, Settings, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceStats {
  totalMessages: number;
  totalDuration: number;
  totalSize: number;
  messagesThisWeek: number;
}

interface VoiceSearchResult {
  id: string;
  transcript: string;
  durationSeconds: number;
  senderName: string;
  createdAt: string;
}

export default function VoiceTestPage() {
  const [showRecorder, setShowRecorder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [testMessages, setTestMessages] = useState<any[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // استعلام إحصائيات الاستخدام
  const { data: stats } = useQuery<VoiceStats>({
    queryKey: ['/api/voice/stats'],
    queryFn: () => apiRequest('/api/voice/stats').then(res => res.json()),
  });

  // استعلام إعدادات الصوت
  const { data: settings } = useQuery({
    queryKey: ['/api/admin/voice/settings'],
    queryFn: () => apiRequest('/api/admin/voice/settings').then(res => res.json()),
  });

  // البحث في الرسائل الصوتية
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest(`/api/voice/search?q=${encodeURIComponent(query)}&limit=10`);
      return response.json();
    },
    onSuccess: (results) => {
      console.log('نتائج البحث:', results);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في البحث",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // اختبار رفع ملف صوتي
  const handleVoiceRecorded = async (audioBlob: Blob, duration: number) => {
    try {
      const formData = new FormData();
      formData.append('voice', audioBlob, 'test-voice.webm');
      formData.append('durationSeconds', duration.toString());
      formData.append('roomId', '1'); // غرفة اختبار

      const token = localStorage.getItem('token');
      const response = await fetch('/api/voice/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "تم الرفع بنجاح",
          description: `تم رفع الرسالة الصوتية: ${result.voiceId}`,
        });
        
        // إضافة الرسالة لقائمة الاختبار
        const newMessage = {
          id: result.voiceId,
          durationSeconds: duration,
          waveformPeaks: Array.from({ length: 50 }, () => Math.random() * 0.8 + 0.1),
          transcript: "هذا اختبار للرسائل الصوتية في النظام",
          senderName: "المستخدم الحالي",
          createdAt: new Date().toISOString(),
          isOwn: true
        };
        
        setTestMessages(prev => [newMessage, ...prev]);
        setShowRecorder(false);
      } else {
        throw new Error(result.message || 'خطأ في الرفع');
      }
    } catch (error) {
      console.error('خطأ في رفع الرسالة الصوتية:', error);
      toast({
        title: "خطأ في الرفع",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    }
  };

  // حذف رسالة صوتية
  const handleDeleteVoice = async (voiceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/voice/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "تم الحذف",
          description: "تم حذف الرسالة الصوتية بنجاح",
        });
        
        setTestMessages(prev => prev.filter(msg => msg.id !== voiceId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطأ في الحذف');
      }
    } catch (error) {
      toast({
        title: "خطأ في الحذف",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    }
  };

  // البحث
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery);
    }
  };

  // تنسيق الحجم
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // تنسيق المدة
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Volume2 className="h-8 w-8 text-primary" />
          اختبار نظام الرسائل الصوتية
        </h1>
        <p className="text-muted-foreground">
          اختبار جميع ميزات الرسائل الصوتية: التسجيل، التشغيل، النسخ النصي، والبحث
        </p>
      </div>

      {/* الإحصائيات */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي الرسائل</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي المدة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي الحجم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSize(stats.totalSize)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>هذا الأسبوع</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.messagesThisWeek}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* الإعدادات الحالية */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">الحد الأقصى للمدة</div>
                <div className="font-semibold">{settings.maxDurationSeconds} ثانية</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">الحد الأقصى للحجم</div>
                <div className="font-semibold">{settings.maxFileSizeMb} MB</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">حالة النظام</div>
                <Badge variant={settings.enabled ? "default" : "secondary"}>
                  {settings.enabled ? "مفعل" : "معطل"}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">النسخ النصي</div>
                <Badge variant={settings.transcriptionEnabled ? "default" : "secondary"}>
                  {settings.transcriptionEnabled ? "مفعل" : "معطل"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* أزرار التحكم */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={() => setShowRecorder(true)}
          size="lg"
          className="gap-2"
        >
          <Mic className="h-5 w-5" />
          تسجيل رسالة جديدة
        </Button>
        
        <VoiceButton
          roomId={1}
          onVoiceSent={(voiceId) => {
            console.log('تم إرسال الرسالة الصوتية:', voiceId);
          }}
          className="gap-2"
        />
      </div>

      {/* البحث */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث في الرسائل الصوتية
          </CardTitle>
          <CardDescription>
            ابحث في النصوص المنسوخة من الرسائل الصوتية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="ابحث في المحتوى الصوتي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button
              onClick={handleSearch}
              disabled={searchMutation.isPending || !searchQuery.trim()}
            >
              {searchMutation.isPending ? "جاري البحث..." : "بحث"}
            </Button>
          </div>
          
          {/* نتائج البحث */}
          {searchMutation.data && searchMutation.data.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">نتائج البحث ({searchMutation.data.length})</h3>
              <div className="space-y-2">
                {searchMutation.data.map((result: VoiceSearchResult) => (
                  <div key={result.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{result.senderName}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(result.durationSeconds)} • {new Date(result.createdAt).toLocaleDateString('ar-EG')}
                        </div>
                        <div className="mt-1 text-sm">"{result.transcript}"</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* مسجل الصوت */}
      {showRecorder && (
        <Card>
          <CardHeader>
            <CardTitle>تسجيل رسالة صوتية</CardTitle>
          </CardHeader>
          <CardContent>
            <VoiceRecorder
              onVoiceRecorded={handleVoiceRecorded}
              onCancel={() => setShowRecorder(false)}
              maxDurationSeconds={120}
            />
          </CardContent>
        </Card>
      )}

      {/* الرسائل الصوتية التجريبية */}
      {testMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الرسائل الصوتية المسجلة</CardTitle>
            <CardDescription>
              الرسائل الصوتية التي تم تسجيلها في هذه الجلسة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testMessages.map((message) => (
                <VoiceMessage
                  key={message.id}
                  voiceId={message.id}
                  durationSeconds={message.durationSeconds}
                  waveformPeaks={message.waveformPeaks}
                  transcript={message.transcript}
                  senderName={message.senderName}
                  createdAt={message.createdAt}
                  isOwn={message.isOwn}
                  onDelete={handleDeleteVoice}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* معلومات تعليمية */}
      <Card>
        <CardHeader>
          <CardTitle>كيفية الاستخدام</CardTitle>
          <CardDescription>
            دليل سريع لاستخدام نظام الرسائل الصوتية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📹 التسجيل</h3>
                <ul className="text-sm space-y-1">
                  <li>• اضغط على زر الميكروفون لبدء التسجيل</li>
                  <li>• الحد الأقصى: 120 ثانية</li>
                  <li>• مراقبة مستوى الصوت أثناء التسجيل</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🎧 التشغيل</h3>
                <ul className="text-sm space-y-1">
                  <li>• تحكم في السرعة (0.5x - 2x)</li>
                  <li>• القفز للأمام/الخلف 10 ثوان</li>
                  <li>• النقر على الموجة للانتقال</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🔍 البحث</h3>
                <ul className="text-sm space-y-1">
                  <li>• البحث في النصوص المنسوخة</li>
                  <li>• فهرسة تلقائية للمحتوى</li>
                  <li>• نتائج سريعة ودقيقة</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📊 الميزات</h3>
                <ul className="text-sm space-y-1">
                  <li>• نسخ نصي تلقائي</li>
                  <li>• موجات صوتية مرئية</li>
                  <li>• إحصائيات الاستخدام</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">ملاحظة هامة</h4>
              <p className="text-blue-700 text-sm">
                لاستخدام ميزة التسجيل الصوتي، يجب منح الموقع إذن الوصول للميكروفون عند الطلب. 
                كما يُفضل استخدام متصفح حديث يدعم HTML5 Audio API للحصول على أفضل تجربة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}