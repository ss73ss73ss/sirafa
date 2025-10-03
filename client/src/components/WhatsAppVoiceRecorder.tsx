import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Trash2, Play, Pause, Square } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WhatsAppVoiceRecorderProps {
  onVoiceRecorded: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
  maxDuration?: number;
  className?: string;
}

export function WhatsAppVoiceRecorder({ 
  onVoiceRecorded, 
  onCancel, 
  maxDuration = 120,
  className 
}: WhatsAppVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();

  // تنظيف الموارد
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  // بدء التسجيل
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // إعداد تحليل الصوت للمقياس البصري
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // إعداد MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setDuration(0);

      // بدء العد التصاعدي
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

      // بدء تحليل الصوت للمقياس البصري
      animateWaveform();

    } catch (error) {
      console.error('خطأ في بدء التسجيل:', error);
      toast({
        title: "خطأ في التسجيل",
        description: "تعذر الوصول للميكروفون",
        variant: "destructive",
      });
    }
  };

  // إيقاف التسجيل
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRecording(false);
  };

  // تحريك المقياس البصري
  const animateWaveform = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // حساب مستوى الصوت
    const volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setVolumeLevel(volume);

    // إنشاء بيانات الموجة
    const newWaveform = Array.from(dataArray.slice(0, 32)).map(value => value / 255);
    setWaveform(prev => [...prev.slice(-31), newWaveform[0] || 0]);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(animateWaveform);
    }
  };

  // تشغيل/إيقاف الصوت
  const togglePlayback = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          setPlaybackTime(0);
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
          }
        });
      }

      audioRef.current.play();
      setIsPlaying(true);

      // تتبع وقت التشغيل
      playbackIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setPlaybackTime(audioRef.current.currentTime);
        }
      }, 100);
    }
  };

  // إرسال التسجيل
  const sendRecording = () => {
    if (audioBlob && duration > 0) {
      onVoiceRecorded(audioBlob, duration);
      cleanup();
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);
      setPlaybackTime(0);
      setWaveform([]);
    }
  };

  // إلغاء التسجيل
  const cancelRecording = () => {
    cleanup();
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setPlaybackTime(0);
    setWaveform([]);
    onCancel?.();
  };

  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // عرض المقياس البصري
  const renderWaveform = () => {
    if (isRecording) {
      return (
        <div className="flex items-center gap-1 px-4">
          {Array.from({ length: 32 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 bg-green-500 rounded-full transition-all duration-75",
                i < waveform.length ? "opacity-100" : "opacity-30"
              )}
              style={{
                height: `${Math.max(4, (waveform[i] || 0) * 20 + 4)}px`
              }}
            />
          ))}
        </div>
      );
    }

    if (audioBlob) {
      const progress = duration > 0 ? (playbackTime / duration) * 100 : 0;
      return (
        <div className="flex items-center gap-2 px-4">
          <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isRecording && !audioBlob) {
    return (
      <Button
        onClick={startRecording}
        className={cn(
          "rounded-full p-3 bg-green-600 hover:bg-green-700 text-white",
          className
        )}
      >
        <Mic className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full border shadow-lg p-2 min-w-[280px]",
      className
    )}>
      {/* زر الإلغاء/الحذف */}
      <Button
        onClick={cancelRecording}
        variant="ghost"
        size="sm"
        className="rounded-full p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* المقياس البصري أو شريط التقدم */}
      <div className="flex-1">
        {renderWaveform()}
      </div>

      {/* عرض الوقت */}
      <span className="text-sm font-mono text-gray-600 dark:text-gray-400 min-w-[40px]">
        {formatTime(isPlaying ? playbackTime : duration)}
      </span>

      {/* زر التشغيل/الإيقاف (فقط عند وجود تسجيل) */}
      {audioBlob && (
        <Button
          onClick={togglePlayback}
          variant="ghost"
          size="sm"
          className="rounded-full p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
      )}

      {/* زر الإيقاف (أثناء التسجيل) */}
      {isRecording && (
        <Button
          onClick={stopRecording}
          variant="ghost"
          size="sm"
          className="rounded-full p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Square className="w-4 h-4" />
        </Button>
      )}

      {/* زر الإرسال */}
      {audioBlob && (
        <Button
          onClick={sendRecording}
          className="rounded-full p-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}