import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Forward, Volume2, VolumeX, Copy, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VoiceMessageProps {
  voiceId: string;
  durationSeconds: number;
  waveformPeaks?: number[];
  transcript?: string;
  transcriptLang?: string;
  senderName?: string;
  createdAt?: string;
  isOwn?: boolean;
  className?: string;
  showTranscript?: boolean;
  onDelete?: (voiceId: string) => void;
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

export function VoiceMessage({
  voiceId,
  durationSeconds,
  waveformPeaks = [],
  transcript,
  transcriptLang = 'ar',
  senderName,
  createdAt,
  isOwn = false,
  className,
  showTranscript = true,
  onDelete
}: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // تنظيف الموارد
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // تحميل وتشغيل الملف الصوتي
  const loadAndPlayAudio = async () => {
    if (audioRef.current) {
      audioRef.current.play();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const audioUrl = `/api/voice/stream/${voiceId}?token=${encodeURIComponent(token || '')}`;
      audioRef.current = new Audio(audioUrl);
      
      // إعداد الصوت
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackSpeed;

      // أحداث الصوت
      audioRef.current.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (audioRef.current) {
          audioRef.current.play();
        }
      });

      audioRef.current.addEventListener('play', () => {
        setIsPlaying(true);
        startProgressTracking();
      });

      audioRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
        stopProgressTracking();
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        stopProgressTracking();
      });

      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });

      audioRef.current.addEventListener('error', (e) => {
        setError('خطأ في تشغيل الملف الصوتي');
        setIsLoading(false);
        setIsPlaying(false);
        console.error('Audio error:', e);
      });

    } catch (error) {
      console.error('خطأ في تحميل الصوت:', error);
      setError('فشل في تحميل الملف الصوتي');
      setIsLoading(false);
      toast({
        title: "خطأ في التشغيل",
        description: "تعذر تحميل الملف الصوتي",
        variant: "destructive",
      });
    }
  };

  // بدء تتبع التقدم
  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 100);
  };

  // إيقاف تتبع التقدم
  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // تشغيل/إيقاف
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    } else {
      loadAndPlayAudio();
    }
  };

  // القفز في الوقت
  const seekTo = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(seconds, durationSeconds));
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // القفز للخلف 10 ثوان
  const skipBackward = () => {
    seekTo(currentTime - 10);
  };

  // القفز للأمام 10 ثوان
  const skipForward = () => {
    seekTo(currentTime + 10);
  };

  // تغيير سرعة التشغيل
  const changePlaybackSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextSpeed = PLAYBACK_SPEEDS[(currentIndex + 1) % PLAYBACK_SPEEDS.length];
    setPlaybackSpeed(nextSpeed);
    
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // تبديل كتم الصوت
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }
  };

  // نسخ النص المنسوخ
  const copyTranscript = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      toast({
        title: "تم النسخ",
        description: "تم نسخ النص المنسوخ للحافظة",
      });
    }
  };

  // حذف الرسالة
  const handleDelete = () => {
    if (onDelete) {
      onDelete(voiceId);
    }
  };

  // تحميل الملف
  const downloadAudio = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/voice/stream/${voiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice_message_${voiceId}.ogg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('خطأ في التحميل:', error);
      toast({
        title: "خطأ في التحميل",
        description: "تعذر تحميل الملف الصوتي",
        variant: "destructive",
      });
    }
  };

  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // النقر على الموجة للقفز
  const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = percentage * durationSeconds;
    
    seekTo(targetTime);
  };

  const progress = durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0;

  return (
    <TooltipProvider>
      <div className={cn(
        "bg-background border rounded-lg p-4 max-w-md space-y-3",
        isOwn ? "ml-auto bg-primary/5" : "mr-auto",
        className
      )}>
        {/* معلومات المرسل والوقت */}
        {(senderName || createdAt) && (
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            {senderName && <span>{senderName}</span>}
            {createdAt && (
              <span>{new Date(createdAt).toLocaleString('ar-EG')}</span>
            )}
          </div>
        )}

        {/* أزرار التحكم الرئيسية */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={togglePlayback}
                disabled={isLoading}
                variant="default"
                size="lg"
                className="h-12 w-12 rounded-full p-0"
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPlaying ? "إيقاف مؤقت" : "تشغيل"}
            </TooltipContent>
          </Tooltip>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-mono">{formatTime(currentTime)}</span>
              <span className="font-mono text-muted-foreground">
                {formatTime(durationSeconds)}
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          <div className="flex items-center gap-1">
            {/* سرعة التشغيل */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={changePlaybackSpeed}
                  variant="ghost"
                  size="sm"
                  className="text-xs px-2 h-7"
                >
                  {playbackSpeed}x
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                تغيير السرعة
              </TooltipContent>
            </Tooltip>

            {/* كتم الصوت */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isMuted ? "إلغاء الكتم" : "كتم الصوت"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* أزرار التنقل */}
        <div className="flex justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={skipBackward}
                variant="ghost"
                size="sm"
                className="gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                10s
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              الرجوع 10 ثواني
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={skipForward}
                variant="ghost"
                size="sm"
                className="gap-1"
              >
                10s
                <Forward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              التقدم 10 ثواني
            </TooltipContent>
          </Tooltip>
        </div>

        {/* الموجة الصوتية التفاعلية */}
        {waveformPeaks.length > 0 && (
          <div className="space-y-2">
            <div
              className="flex items-end gap-1 h-12 bg-muted rounded p-2 cursor-pointer"
              onClick={handleWaveformClick}
            >
              {waveformPeaks.map((peak, index) => (
                <div
                  key={index}
                  className="bg-primary rounded-sm flex-1 min-w-[1px] transition-all duration-200 hover:bg-primary/80"
                  style={{ 
                    height: `${Math.max(peak * 100, 3)}%`,
                    opacity: progress > 0 ? 
                      (index / waveformPeaks.length <= progress / 100 ? 1 : 0.3) : 0.6
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* النص المنسوخ */}
        {transcript && showTranscript && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  نص منسوخ
                </Badge>
                {transcriptLang && (
                  <Badge variant="outline" className="text-xs">
                    {transcriptLang === 'ar' ? 'عربي' : transcriptLang.toUpperCase()}
                  </Badge>
                )}
              </div>
              <Button
                onClick={() => setTranscriptVisible(!transcriptVisible)}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                {transcriptVisible ? "إخفاء" : "عرض"}
              </Button>
            </div>

            {transcriptVisible && (
              <div className="bg-muted/50 rounded p-3 text-sm">
                <p className={cn(
                  "leading-relaxed",
                  transcriptLang === 'ar' ? "text-right" : "text-left"
                )}>
                  {transcript}
                </p>
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={copyTranscript}
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                  >
                    <Copy className="h-3 w-3" />
                    نسخ
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* خطأ في التحميل */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded p-2">
            {error}
          </div>
        )}

        {/* أزرار إضافية للمالك */}
        {isOwn && (
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={downloadAudio}
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                >
                  <Download className="h-4 w-4" />
                  تحميل
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                تحميل الملف الصوتي
              </TooltipContent>
            </Tooltip>

            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleDelete}
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  حذف الرسالة الصوتية
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}