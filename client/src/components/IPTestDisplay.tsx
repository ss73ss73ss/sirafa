import { usePublicIP, getCacheInfo, clearIPCache } from '@/lib/publicIP';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Clock, Wifi, RefreshCw, Trash2 } from 'lucide-react';

export function IPTestDisplay() {
  const { ip, source, error, loading, timestamp, isStale, fetchIP } = usePublicIP();
  const cacheInfo = getCacheInfo();

  const formatTime = (ms: number) => {
    if (ms < 60000) return `${Math.round(ms / 1000)} ثانية`;
    return `${Math.round(ms / 60000)} دقيقة`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          اختبار IP Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* عرض IP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">IP العام:</span>
            {loading && <Badge variant="secondary">جاري التحميل...</Badge>}
          </div>
          
          {ip ? (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="font-mono text-lg">{ip}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Wifi className="w-3 h-3" />
                المصدر: {source}
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
              <div className="text-muted-foreground text-sm">لم يتم الحصول على IP بعد</div>
            </div>
          )}
        </div>

        {/* معلومات التوقيت */}
        {timestamp && (
          <div className="space-y-2">
            <div className="text-sm font-medium">معلومات التوقيت:</div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                آخر تحديث: {formatTime(Date.now() - timestamp)} مضت
              </div>
              {isStale && (
                <Badge variant="outline" className="text-xs">
                  البيانات قديمة
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* معلومات التخزين المؤقت */}
        <div className="space-y-2">
          <div className="text-sm font-medium">معلومات التخزين المؤقت:</div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-sm">
            {cacheInfo.hasCache ? (
              <div className="space-y-1">
                <div>✅ يوجد تخزين مؤقت</div>
                <div>العمر: {formatTime(cacheInfo.age!)}</div>
                <div>الحالة: {cacheInfo.isExpired ? '⏰ منتهي الصلاحية' : '✅ صالح'}</div>
              </div>
            ) : (
              <div>❌ لا يوجد تخزين مؤقت</div>
            )}
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2">
          <Button 
            onClick={() => fetchIP(true)} 
            disabled={loading}
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
            تحديث IP
          </Button>
          
          <Button 
            onClick={clearIPCache}
            variant="outline"
            size="sm"
          >
            <Trash2 className="w-4 h-4 ml-1" />
            مسح Cache
          </Button>
        </div>

        {/* معلومات إضافية */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>🔄 يتم تجربة 4 خدمات مختلفة</div>
          <div>💾 التخزين المؤقت لمدة 20 دقيقة</div>
          <div>⚡ استدعاء تلقائي عند بدء التطبيق</div>
        </div>
      </CardContent>
    </Card>
  );
}