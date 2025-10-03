import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Upload, CheckCircle, AlertCircle, X, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// النموذج الأولي بدون محتوى فعلي للملفات المحملة
const VerificationPage = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [idPhotoUrl, setIdPhotoUrl] = useState('');
  const [proofOfAddressUrl, setProofOfAddressUrl] = useState('');
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // التحقق من وجود الطلب الحالي
  const { 
    data: request, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/user/verification'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/verification');
        if (response.status === 404) {
          return null; // لا يوجد طلب للمستخدم
        }
        if (!response.ok) {
          throw new Error('فشل في جلب طلب التوثيق');
        }
        const data = await response.json();
        // إذا كانت الحالة not_started، فلا يوجد طلب
        if (data.status === 'not_started') {
          return null;
        }
        return data;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  });

  // إرسال طلب التوثيق
  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      
      // تحويل Data URLs إلى ملفات
      if (idPhotoUrl) {
        const idResponse = await fetch(idPhotoUrl);
        const idBlob = await idResponse.blob();
        formData.append('id_photo', idBlob, 'id_photo.png');
      }
      
      if (proofOfAddressUrl) {
        const proofResponse = await fetch(proofOfAddressUrl);
        const proofBlob = await proofResponse.blob();
        formData.append('proof_of_address', proofBlob, 'proof_of_address.png');
      }

      const response = await fetch('/api/user/verify-account', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في إرسال طلب التوثيق');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الطلب بنجاح",
        description: "سيتم مراجعة طلبك من قبل الإدارة",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/verification'] });
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في إرسال طلب التوثيق",
        variant: "destructive",
      });
    }
  });

  // محاكاة تحميل الصور (في تطبيق حقيقي، سيتم رفع الصور إلى خدمة تخزين)
  const handleFileUpload = (fileType: 'id' | 'proof', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف (يسمح فقط بـ JPG، PNG، PDF)
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "نوع ملف غير مدعوم",
        description: "يرجى تحميل ملف بتنسيق JPG أو PNG أو PDF فقط",
        variant: "destructive",
      });
      return;
    }

    // التحقق من حجم الملف (أقل من 5 ميغابايت)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جدًا",
        description: "يجب أن يكون حجم الملف أقل من 5 ميغابايت",
        variant: "destructive",
      });
      return;
    }

    // محاكاة تحميل الملف
    if (fileType === 'id') {
      setIsUploadingId(true);
      
      // قراءة الملف كـ Data URL لعرضه في الواجهة
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPhotoUrl(reader.result as string);
        setIsUploadingId(false);
        
        toast({
          title: "تم تحميل صورة الهوية",
          variant: "default",
        });
      };
      reader.readAsDataURL(file);
    } else {
      setIsUploadingProof(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofOfAddressUrl(reader.result as string);
        setIsUploadingProof(false);
        
        toast({
          title: "تم تحميل إثبات العنوان",
          variant: "default",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // معاينة الصور المحملة
  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  // إعادة التوجيه إذا لم يكن المستخدم مسجل الدخول
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // إذا كان المستخدم موثقًا بالفعل، قم بتوجيهه إلى لوحة التحكم
    if (user.verified) {
      toast({
        title: "حسابك موثق بالفعل",
        description: "لقد تم توثيق حسابك بنجاح. تم توجيهك إلى لوحة التحكم.",
        variant: "default",
      });
      navigate('/');
    }
  }, [user, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // عرض صفحة معلومات الطلب إذا كان المستخدم قدم طلبًا بالفعل
  if (request) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold mb-2">حالة توثيق الحساب</CardTitle>
            <CardDescription>يمكنك متابعة حالة طلب توثيق حسابك هنا</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 p-4 rounded-lg border">
                {request.status === 'pending' && (
                  <div className="flex items-center text-yellow-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="font-medium">قيد المراجعة</span>
                  </div>
                )}
                
                {request.status === 'approved' && (
                  <div className="flex items-center text-green-500">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span className="font-medium">تم التوثيق بنجاح</span>
                  </div>
                )}
                
                {request.status === 'rejected' && (
                  <div className="flex items-center text-red-500">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    <span className="font-medium">تم رفض الطلب</span>
                  </div>
                )}
              </div>
              
              {request.status === 'rejected' && request.notes && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                  <h3 className="font-semibold mb-2">سبب الرفض:</h3>
                  <p>{request.notes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">صورة الهوية</h3>
                  <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                    {/* هنا سيتم عرض معاينة للصورة */}
                    <img 
                      src={request.idPhotoUrl} 
                      alt="صورة الهوية" 
                      className="w-full h-full object-contain"
                      onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=صورة+الهوية'}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 bg-black/30 hover:bg-black/50 text-white rounded-full"
                      onClick={() => handlePreview(request.idPhotoUrl)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">إثبات العنوان</h3>
                  <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                    <img 
                      src={request.proofOfAddressUrl} 
                      alt="إثبات العنوان" 
                      className="w-full h-full object-contain"
                      onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=إثبات+العنوان'}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 bg-black/30 hover:bg-black/50 text-white rounded-full"
                      onClick={() => handlePreview(request.proofOfAddressUrl)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h3 className="font-semibold mb-2">معلومات هامة:</h3>
                <p>
                  {request.status === 'pending' && 'سيتم مراجعة طلبك من قبل الإدارة في أقرب وقت ممكن. يرجى الانتظار.'}
                  {request.status === 'approved' && 'تم توثيق حسابك بنجاح! يمكنك الآن الاستفادة من جميع ميزات الحساب الموثق.'}
                  {request.status === 'rejected' && 'يمكنك تقديم طلب توثيق جديد بعد معالجة أسباب الرفض المذكورة.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض نموذج إرسال طلب التوثيق الجديد
  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-2">توثيق الحساب</CardTitle>
          <CardDescription>قم بتقديم المستندات المطلوبة لتوثيق حسابك وتفعيل جميع الميزات</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="font-semibold mb-2">معلومات هامة:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>يجب تقديم مستندات واضحة وحديثة لضمان قبول طلبك</li>
                <li>يسمح برفع ملفات بتنسيق JPG أو PNG أو PDF فقط</li>
                <li>الحد الأقصى لحجم كل ملف هو 5 ميغابايت</li>
                <li>سيتم مراجعة طلبك خلال 24-48 ساعة عمل</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">صورة الهوية الشخصية</h3>
                
                {idPhotoUrl ? (
                  <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden mb-4">
                    <img 
                      src={idPhotoUrl} 
                      alt="صورة الهوية" 
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 bg-black/30 hover:bg-black/50 text-white rounded-full"
                      onClick={() => handlePreview(idPhotoUrl)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center border-2 border-dashed rounded-md mb-4 bg-gray-50">
                    <div className="text-center">
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">اضغط هنا لرفع صورة الهوية</p>
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <input
                    type="file"
                    id="id-photo"
                    className="sr-only"
                    onChange={(e) => handleFileUpload('id', e)}
                    accept="image/jpeg,image/png,application/pdf"
                  />
                  <label
                    htmlFor="id-photo"
                    className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    {isUploadingId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الرفع...
                      </>
                    ) : idPhotoUrl ? (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        تغيير الصورة
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        اختر ملف
                      </>
                    )}
                  </label>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">إثبات العنوان</h3>
                
                {proofOfAddressUrl ? (
                  <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden mb-4">
                    <img 
                      src={proofOfAddressUrl} 
                      alt="إثبات العنوان" 
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 bg-black/30 hover:bg-black/50 text-white rounded-full"
                      onClick={() => handlePreview(proofOfAddressUrl)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center border-2 border-dashed rounded-md mb-4 bg-gray-50">
                    <div className="text-center">
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">اضغط هنا لرفع إثبات العنوان</p>
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <input
                    type="file"
                    id="proof-of-address"
                    className="sr-only"
                    onChange={(e) => handleFileUpload('proof', e)}
                    accept="image/jpeg,image/png,application/pdf"
                  />
                  <label
                    htmlFor="proof-of-address"
                    className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    {isUploadingProof ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الرفع...
                      </>
                    ) : proofOfAddressUrl ? (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        تغيير الملف
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        اختر ملف
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 border">
              <h3 className="font-semibold mb-2">ملاحظات حول المستندات المطلوبة:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>
                  <strong>صورة الهوية:</strong> يجب أن تكون واضحة وسارية المفعول (بطاقة شخصية، جواز سفر، رخصة قيادة)
                </li>
                <li>
                  <strong>إثبات العنوان:</strong> يمكن أن يكون فاتورة مرافق حديثة (كهرباء، ماء، إنترنت) أو كشف حساب بنكي أو عقد إيجار
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!idPhotoUrl || !proofOfAddressUrl || submitMutation.isPending || isUploadingId || isUploadingProof}
            className="w-full md:w-auto"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري إرسال الطلب...
              </>
            ) : (
              'إرسال طلب التوثيق'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* معاينة الصور بحجم أكبر */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>معاينة المستند</DialogTitle>
            <DialogDescription>
              اضغط خارج هذه النافذة للإغلاق
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[70vh] overflow-auto">
            {previewImage && (
              <img 
                src={previewImage} 
                alt="معاينة المستند" 
                className="w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationPage;