import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Play, Pause, Send, Trash2, Square, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onVoiceRecorded: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
  maxDurationSeconds?: number;
  className?: string;
  mode?: 'desktop' | 'mobile';
}

export function VoiceRecorder({
  onVoiceRecorded,
  onCancel,
  maxDurationSeconds = 120,
  className,
  mode = 'desktop'
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { toast } = useToast();

  // تنظيف الموارد
  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  // طلب إذن الميكروفون وبدء التسجيل
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // إعداد تحليل الصوت للمقياس البصري
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // إعداد MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus' 
        : 'audio/webm';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // توليد بيانات الموجة الصوتية
        generateWaveform(blob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100); // جمع البيانات كل 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // بدء العداد والمقياس البصري
      startTimer();
      startVolumeMonitoring();

    } catch (error) {
      console.error('خطأ في الوصول للميكروفون:', error);
      toast({
        title: "خطأ في الميكروفون",
        description: "تعذر الوصول للميكروفون. تأكد من منح الإذن.",
        variant: "destructive",
      });
    }
  };

  // إيقاف التسجيل
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // بدء العداد
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= maxDurationSeconds) {
          stopRecording();
          toast({
            title: "انتهت مدة التسجيل",
            description: `تم الوصول للحد الأقصى ${maxDurationSeconds} ثانية`,
          });
          return prev;
        }
        return prev + 0.1;
      });
    }, 100);
  };

  // مراقبة مستوى الصوت
  const startVolumeMonitoring = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      setVolumeLevel(average / 255 * 100);

      requestAnimationFrame(updateVolume);
    };

    updateVolume();
  };

  // توليد بيانات الموجة الصوتية
  const generateWaveform = async (blob: Blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 50; // عدد نقاط الموجة
      const blockSize = Math.floor(channelData.length / samples);
      const peaks = [];

      for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, channelData.length);
        let max = 0;
        
        for (let j = start; j < end; j++) {
          max = Math.max(max, Math.abs(channelData[j]));
        }
        
        peaks.push(max);
      }

      setWaveformData(peaks);
    } catch (error) {
      console.error('خطأ في توليد الموجة الصوتية:', error);
      // استخدام بيانات عشوائية كبديل
      const fallbackPeaks = Array.from({ length: 50 }, () => Math.random() * 0.8 + 0.1);
      setWaveformData(fallbackPeaks);
    }
  };

  // تشغيل التسجيل
  const playRecording = () => {
    if (!audioUrl) return;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    audioElementRef.current = new Audio(audioUrl);
    audioElementRef.current.addEventListener('loadedmetadata', () => {
      if (audioElementRef.current) {
        audioElementRef.current.play();
        setIsPlaying(true);
        startPlaybackTimer();
      }
    });

    audioElementRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setPlaybackTime(0);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    });
  };

  // إيقاف التشغيل
  const pausePlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    }
  };

  // بدء عداد التشغيل
  const startPlaybackTimer = () => {
    playbackTimerRef.current = setInterval(() => {
      if (audioElementRef.current) {
        setPlaybackTime(audioElementRef.current.currentTime);
      }
    }, 100);
  };

  // إرسال التسجيل
  const sendRecording = () => {
    if (audioBlob) {
      onVoiceRecorded(audioBlob, recordingTime);
      resetRecorder();
    }
  };

  // حذف التسجيل
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    resetRecorder();
  };

  // إعادة تعيين المسجل
  const resetRecorder = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setWaveformData([]);
    setRecordingTime(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    setVolumeLevel(0);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
  };

  // إلغاء العملية
  const handleCancel = () => {
    cleanup();
    resetRecorder();
    onCancel?.();
  };

  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("bg-background border rounded-lg p-4 space-y-4", className)}>
      {/* شريط التحكم الرئيسي */}
      <div className="flex items-center gap-4">
        {!audioBlob ? (
          // واجهة التسجيل
          <>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="h-12 w-12 rounded-full p-0"
            >
              {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">
                {isRecording ? "جاري التسجيل..." : "اضغط للتسجيل"}
              </div>
              <div className="text-lg font-mono">
                {formatTime(recordingTime)} / {formatTime(maxDurationSeconds)}
              </div>
            </div>
            
            {isRecording && (
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="sm"
              >
                إلغاء
              </Button>
            )}
          </>
        ) : (
          // واجهة المعاينة
          <>
            <Button
              onClick={isPlaying ? pausePlayback : playRecording}
              variant="default"
              size="lg"
              className="h-12 w-12 rounded-full p-0"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">
                معاينة التسجيل
              </div>
              <div className="text-lg font-mono">
                {formatTime(playbackTime)} / {formatTime(recordingTime)}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={sendRecording}
                variant="default"
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                إرسال
              </Button>
              <Button
                onClick={deleteRecording}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </div>
          </>
        )}
      </div>

      {/* مقياس مستوى الصوت أثناء التسجيل */}
      {isRecording && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Volume2 className="h-4 w-4" />
            مستوى الصوت
          </div>
          <Progress value={volumeLevel} className="h-2" />
        </div>
      )}

      {/* الموجة الصوتية */}
      {waveformData.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">الموجة الصوتية</div>
          <div className="flex items-end gap-1 h-16 bg-muted rounded p-2">
            {waveformData.map((peak, index) => (
              <div
                key={index}
                className="bg-primary rounded-sm flex-1 min-w-[2px] transition-all duration-200"
                style={{ 
                  height: `${Math.max(peak * 100, 5)}%`,
                  opacity: isPlaying && playbackTime > 0 ? 
                    (index / waveformData.length <= playbackTime / recordingTime ? 1 : 0.3) : 1
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* شريط التقدم */}
      {recordingTime > 0 && (
        <Progress
          value={(recordingTime / maxDurationSeconds) * 100}
          className="h-1"
        />
      )}
    </div>
  );
}