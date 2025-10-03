import { useState, useRef } from "react";
import { Button } from "@/components/ui/button-ar";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxSize?: number;
  accept?: string;
  onUploadStart?: () => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  currentImageUrl?: string;
  children?: React.ReactNode;
}

export function ObjectUploader({
  maxSize = 2 * 1024 * 1024, // 2MB default
  accept = "image/jpeg,image/png,image/webp",
  onUploadStart,
  onUploadComplete,
  onUploadError,
  className = "",
  currentImageUrl,
  children
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    // Validate file
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const errorMsg = `حجم الملف كبير جداً. الحد الأقصى ${maxSizeMB}MB`;
      onUploadError?.(errorMsg);
      toast({ title: "خطأ", description: errorMsg, variant: "destructive" });
      return;
    }

    const allowedTypes = accept.split(',').map(type => type.trim());
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = "نوع الملف غير مدعوم. استخدم صور بصيغة JPEG أو PNG أو WebP";
      onUploadError?.(errorMsg);
      toast({ title: "خطأ", description: errorMsg, variant: "destructive" });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);
      onUploadStart?.();

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setUploadProgress(30);

      // Get upload URL
      const response = await fetch('/api/me/avatar/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          mime: file.type,
          size: file.size
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في الحصول على رابط الرفع');
      }

      const { uploadUrl, storageKey } = await response.json();
      setUploadProgress(50);

      // Convert and compress image
      const processedFile = await processImage(file);
      setUploadProgress(70);

      // Upload file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: processedFile,
        headers: {
          'Content-Type': processedFile.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('فشل في رفع الملف');
      }

      setUploadProgress(90);

      // Finalize upload
      const finalizeResponse = await fetch('/api/me/avatar/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ storageKey })
      });

      if (!finalizeResponse.ok) {
        const errorData = await finalizeResponse.json();
        throw new Error(errorData.message || 'فشل في حفظ الملف');
      }

      const { avatarUrl } = await finalizeResponse.json();
      setUploadProgress(100);

      toast({
        title: "نجح الرفع",
        description: "تم تحديث صورتك الشخصية بنجاح"
      });

      onUploadComplete?.(avatarUrl);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الملف';
      onUploadError?.(errorMsg);
      toast({
        title: "فشل الرفع",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const processImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas size for square crop
        const size = Math.min(img.width, img.height);
        canvas.width = 400; // Target size
        canvas.height = 400;

        if (!ctx) {
          reject(new Error('فشل في معالجة الصورة'));
          return;
        }

        // Calculate crop area (center crop)
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        // Draw cropped and resized image
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('فشل في ضغط الصورة'));
            return;
          }
          
          const processedFile = new File([blob], 'avatar.webp', {
            type: 'image/webp'
          });
          resolve(processedFile);
        }, 'image/webp', 0.8); // 80% quality
      };

      img.onerror = () => reject(new Error('فشل في تحميل الصورة'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={accept}
        className="hidden"
      />

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {previewUrl || currentImageUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl || currentImageUrl}
                alt="معاينة الصورة"
                className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-white shadow-lg"
              />
              {previewUrl && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 rounded-full p-1 w-8 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearPreview();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {!previewUrl && (
              <p className="text-sm text-muted-foreground">
                انقر لتغيير الصورة أو اسحب صورة جديدة هنا
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            
            <div>
              <p className="text-lg font-medium">اختر صورة شخصية</p>
              <p className="text-sm text-muted-foreground mt-1">
                اسحب وأفلت أو انقر لاختيار صورة
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                أنواع مدعومة: JPEG, PNG, WebP • الحد الأقصى: {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </div>
          </div>
        )}

        {children}
      </div>

      {isUploading && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>جاري رفع الصورة...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}
    </Card>
  );
}