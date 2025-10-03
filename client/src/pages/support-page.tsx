import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Guard } from "@/components/Guard";
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Users,
  CreditCard,
  Shield,
  Settings,
  MessageCircle
} from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  subject: z.string().min(5, "الموضوع مطلوب"),
  message: z.string().min(20, "الرسالة يجب أن تكون أكثر من 20 حرف"),
  priority: z.enum(["low", "medium", "high"]),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function SupportPage() {
  return (
    <Guard page="support">
      <SupportContent />
    </Guard>
  );
}

function SupportContent() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHelpTopic, setSelectedHelpTopic] = useState<string | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      priority: "medium",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: إرسال طلب الدعم إلى الخادم
      await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة
      
      toast({
        title: "تم إرسال طلب الدعم",
        description: "سنتواصل معك خلال 24 ساعة",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال طلب الدعم",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <BackToDashboardButton />
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">مركز المساعدة والدعم</h1>
          <p className="text-muted-foreground">
            نحن هنا لمساعدتك في جميع استفساراتك ومشاكلك التقنية
          </p>
        </div>
        <div></div>
      </div>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            الأسئلة الشائعة
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            تواصل معنا
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            أدلة الاستخدام
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            حالة النظام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">الأسئلة الأكثر شيوعاً</CardTitle>
              <CardDescription className="text-right">
                إجابات للأسئلة التي يطرحها المستخدمون بكثرة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="account">
                  <AccordionTrigger className="text-right">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      كيف أقوم بإنشاء حساب جديد؟
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-right">
                    <div className="space-y-2">
                      <p>1. اضغط على زر "إنشاء حساب" في الصفحة الرئيسية</p>
                      <p>2. أدخل بياناتك الشخصية (الاسم، البريد الإلكتروني، كلمة المرور)</p>
                      <p>3. تحقق من بريدك الإلكتروني وفعل الحساب</p>
                      <p>4. ابدأ باستخدام جميع خدمات المنصة</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="transfers">
                  <AccordionTrigger className="text-right">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      كيف أقوم بإرسال حوالة؟
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-right">
                    <div className="space-y-2">
                      <p><strong>للتحويل الداخلي:</strong></p>
                      <p>1. اذهب إلى صفحة "التحويل الداخلي"</p>
                      <p>2. أدخل رقم حساب المستلم والمبلغ</p>
                      <p>3. تأكد من البيانات واضغط "إرسال"</p>
                      
                      <p className="mt-4"><strong>لحوالات بين المكاتب:</strong></p>
                      <p>1. اذهب إلى "التحويل بين المكاتب"</p>
                      <p>2. اختر الدولة والمكتب المستلم</p>
                      <p>3. أدخل بيانات المستلم والمبلغ</p>
                      <p>4. احفظ رمز التحويل لإعطائه للمستلم</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="security">
                  <AccordionTrigger className="text-right">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      كيف أضمن أمان حسابي؟
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-right">
                    <div className="space-y-2">
                      <p>• استخدم كلمة مرور قوية ومعقدة</p>
                      <p>• لا تشارك بيانات دخولك مع أي شخص</p>
                      <p>• تأكد من تسجيل الخروج بعد الانتهاء</p>
                      <p>• راقب رصيدك ومعاملاتك بانتظام</p>
                      <p>• تواصل معنا فوراً في حالة أي نشاط مشبوه</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="fees">
                  <AccordionTrigger className="text-right">
                    ما هي رسوم التحويلات؟
                  </AccordionTrigger>
                  <AccordionContent className="text-right">
                    <div className="space-y-2">
                      <p><strong>التحويل الداخلي:</strong> 1% من المبلغ (الحد الأدنى 0.5 د.ل)</p>
                      <p><strong>التحويل بين المدن:</strong> حسب شرائح المبلغ والمسافة</p>
                      <p><strong>التحويل بين المكاتب:</strong> حسب الدولة والمكتب المستلم</p>
                      <p>يتم عرض الرسوم بوضوح قبل تأكيد أي معاملة</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="receive">
                  <AccordionTrigger className="text-right">
                    كيف أستلم حوالة مرسلة إلي؟
                  </AccordionTrigger>
                  <AccordionContent className="text-right">
                    <div className="space-y-2">
                      <p><strong>للتحويل الداخلي:</strong> يتم إضافة المبلغ تلقائياً لرصيدك</p>
                      
                      <p className="mt-4"><strong>لحوالات بين المكاتب:</strong></p>
                      <p>1. اذهب إلى أقرب مكتب معتمد</p>
                      <p>2. اعطِ رمز التحويل المرسل من قبل المرسل</p>
                      <p>3. أظهر هويتك الشخصية</p>
                      <p>4. استلم المبلغ بعد التحقق</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">تواصل معنا</CardTitle>
                <CardDescription className="text-right">
                  أرسل لنا رسالة وسنرد عليك في أقرب وقت
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">الاسم الكامل</FormLabel>
                          <FormControl>
                            <Input {...field} className="text-right" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="text-right" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">أولوية الطلب</FormLabel>
                          <FormControl>
                            <select {...field} className="w-full p-2 border rounded-md text-right">
                              <option value="low">منخفضة</option>
                              <option value="medium">متوسطة</option>
                              <option value="high">عالية</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">الموضوع</FormLabel>
                          <FormControl>
                            <Input {...field} className="text-right" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">الرسالة</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="text-right min-h-[120px]"
                              placeholder="اكتب رسالتك هنا..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">معلومات التواصل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 justify-end">
                    <div className="text-right">
                      <p className="font-medium">الهاتف</p>
                      <p className="text-muted-foreground">+218 91 234 5678</p>
                    </div>
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center gap-3 justify-end">
                    <div className="text-right">
                      <p className="font-medium">البريد الإلكتروني</p>
                      <p className="text-muted-foreground">support@exchange.ly</p>
                    </div>
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center gap-3 justify-end">
                    <div className="text-right">
                      <p className="font-medium">ساعات العمل</p>
                      <p className="text-muted-foreground">الأحد - الخميس: 8:00 - 17:00</p>
                      <p className="text-muted-foreground">الجمعة - السبت: 9:00 - 15:00</p>
                    </div>
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-right">أولوية الاستجابة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive">عالية</Badge>
                    <span className="text-sm">خلال ساعتين</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">متوسطة</Badge>
                    <span className="text-sm">خلال 8 ساعات</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">منخفضة</Badge>
                    <span className="text-sm">خلال 24 ساعة</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="guides" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedHelpTopic('beginner-guide')}
            >
              <CardHeader>
                <div className="flex items-center gap-2 justify-end">
                  <CardTitle className="text-right">دليل المبتدئين</CardTitle>
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-right text-sm text-muted-foreground">
                  تعلم كيفية استخدام المنصة من البداية
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedHelpTopic('transfers')}
            >
              <CardHeader>
                <div className="flex items-center gap-2 justify-end">
                  <CardTitle className="text-right">إدارة التحويلات</CardTitle>
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-right text-sm text-muted-foreground">
                  دليل شامل لجميع أنواع التحويلات
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedHelpTopic('security')}
            >
              <CardHeader>
                <div className="flex items-center gap-2 justify-end">
                  <CardTitle className="text-right">الأمان والحماية</CardTitle>
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-right text-sm text-muted-foreground">
                  كيفية حماية حسابك وبياناتك
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedHelpTopic('account-settings')}
            >
              <CardHeader>
                <div className="flex items-center gap-2 justify-end">
                  <CardTitle className="text-right">إعدادات الحساب</CardTitle>
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-right text-sm text-muted-foreground">
                  تخصيص حسابك وإعداداتك الشخصية
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedHelpTopic('faq')}
            >
              <CardHeader>
                <div className="flex items-center gap-2 justify-end">
                  <CardTitle className="text-right">الأسئلة الشائعة</CardTitle>
                  <HelpCircle className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-right text-sm text-muted-foreground">
                  إجابات للاستفسارات الأكثر شيوعاً
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedHelpTopic('troubleshooting')}
            >
              <CardHeader>
                <div className="flex items-center gap-2 justify-end">
                  <CardTitle className="text-right">استكشاف الأخطاء</CardTitle>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-right text-sm text-muted-foreground">
                  حل المشاكل الشائعة بنفسك
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">حالة أنظمة المنصة</CardTitle>
              <CardDescription className="text-right">
                مراقبة حالة جميع الخدمات في الوقت الفعلي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    يعمل بشكل طبيعي
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-medium">نظام التحويلات</p>
                  <p className="text-sm text-muted-foreground">آخر تحديث: منذ دقيقتين</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    يعمل بشكل طبيعي
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-medium">نظام المصادقة</p>
                  <p className="text-sm text-muted-foreground">آخر تحديث: منذ 5 دقائق</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    يعمل بشكل طبيعي
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-medium">نظام المحادثات</p>
                  <p className="text-sm text-muted-foreground">آخر تحديث: منذ دقيقة</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    يعمل بشكل طبيعي
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-medium">قاعدة البيانات</p>
                  <p className="text-sm text-muted-foreground">آخر تحديث: منذ 3 دقائق</p>
                </div>
              </div>

              <Separator />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  جميع الأنظمة تعمل بكفاءة عالية • آخر فحص: {new Date().toLocaleString('ar-LY')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* محتوى دليل المبتدئين */}
      {selectedHelpTopic === 'beginner-guide' && (
        <Card className="mt-6 border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedHelpTopic(null)}
                className="text-sm"
              >
                ← العودة
              </Button>
              <div className="flex items-center gap-2">
                <CardTitle className="text-right text-xl">دليل المبتدئين</CardTitle>
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 text-right">مرحباً بك في مكتب الصرافة!</h4>
              <p className="text-sm text-blue-800 text-right">
                هذا الدليل سيساعدك على فهم كيفية استخدام المنصة خطوة بخطوة. 
                نحن هنا لنجعل تجربتك سهلة وآمنة.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="getting-started">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>البدء في استخدام المنصة</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">الخطوات الأولى:</h4>
                    <ol className="space-y-1 text-sm text-blue-800">
                      <li>1. تم إنشاء حسابك وحصلت على رقم حساب فريد (يبدأ بـ 33003...)</li>
                      <li>2. تأكد من حفظ رقم حسابك في مكان آمن</li>
                      <li>3. استكشف لوحة التحكم الرئيسية لفهم الخيارات المتاحة</li>
                      <li>4. راجع رصيدك الحالي في العملات المختلفة</li>
                      <li>5. ابدأ بعملية تحويل تجريبية بسيطة</li>
                    </ol>
                    <div className="mt-3 p-2 bg-blue-100 rounded">
                      <p className="text-xs text-blue-700">
                        💡 نصيحة: احتفظ برقم حسابك آمناً - ستحتاجه لاستقبال التحويلات
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="understanding-interface">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>فهم واجهة المستخدم</span>
                    <Settings className="h-4 w-4 text-purple-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">أجزاء الواجهة الرئيسية:</h4>
                    <div className="space-y-2 text-sm text-purple-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">الشريط الجانبي:</span>
                        <span> يحتوي على جميع الصفحات والخدمات</span>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">الرصيد:</span>
                        <span> يعرض أرصدتك في العملات المختلفة</span>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">الإشعارات:</span>
                        <span> تنبهك للمعاملات والأحداث المهمة</span>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">المحادثات:</span>
                        <span> للتواصل مع المستخدمين الآخرين</span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="first-transfer">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>إجراء أول تحويل</span>
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">خطوات التحويل الأول:</h4>
                    <ol className="space-y-1 text-sm text-green-800">
                      <li>1. اذهب إلى "التحويلات الداخلية" للتحويل داخل المنصة</li>
                      <li>2. أدخل رقم حساب الشخص المراد التحويل له</li>
                      <li>3. اختر العملة (LYD, USD, EUR, إلخ)</li>
                      <li>4. أدخل المبلغ المراد تحويله</li>
                      <li>5. اختياري: أضف ملاحظة توضيحية</li>
                      <li>6. راجع التفاصيل بعناية قبل التأكيد</li>
                      <li>7. اضغط "تأكيد التحويل"</li>
                    </ol>
                    <div className="mt-3 p-2 bg-green-100 rounded">
                      <p className="text-xs text-green-700">
                        💡 مهم: تأكد من صحة رقم الحساب قبل التحويل - العملية لا يمكن إلغاؤها
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="understanding-currencies">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>فهم العملات المدعومة</span>
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-indigo-900 mb-2">العملات المتاحة:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-indigo-800">
                      <div className="flex justify-between border-b pb-1">
                        <span>LYD</span>
                        <span>الدينار الليبي</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>USD</span>
                        <span>الدولار الأمريكي</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>EUR</span>
                        <span>اليورو الأوروبي</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>TRY</span>
                        <span>الليرة التركية</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>AED</span>
                        <span>الدرهم الإماراتي</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>EGP</span>
                        <span>الجنيه المصري</span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="safety-tips">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>نصائح الأمان للمبتدئين</span>
                    <Shield className="h-4 w-4 text-red-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">قواعد الأمان الأساسية:</h4>
                    <ul className="space-y-1 text-sm text-red-800">
                      <li>• لا تشارك رقم حسابك إلا مع الأشخاص الذين تريد استقبال تحويلات منهم</li>
                      <li>• لا تشارك كلمة المرور أو بيانات تسجيل الدخول مع أي شخص</li>
                      <li>• تأكد من رقم الحساب قبل إرسال أي تحويل</li>
                      <li>• راجع تاريخ معاملاتك بانتظام</li>
                      <li>• أبلغ عن أي نشاط مشبوه فوراً</li>
                      <li>• استخدم كلمة مرور قوية ومعقدة</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="common-mistakes">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>أخطاء شائعة يجب تجنبها</span>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">تجنب هذه الأخطاء:</h4>
                    <ul className="space-y-1 text-sm text-orange-800">
                      <li>• إدخال رقم حساب خاطئ - تحقق دائماً من الرقم</li>
                      <li>• عدم حفظ أرقام المعاملات للمراجعة</li>
                      <li>• إهمال قراءة الإشعارات المهمة</li>
                      <li>• عدم التحقق من الرصيد قبل التحويل</li>
                      <li>• مشاركة بيانات الحساب مع أشخاص غير موثوقين</li>
                      <li>• عدم قراءة تفاصيل المعاملة قبل التأكيد</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="getting-help">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>كيفية طلب المساعدة</span>
                    <HelpCircle className="h-4 w-4 text-teal-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-teal-900 mb-2">طرق الحصول على المساعدة:</h4>
                    <ul className="space-y-1 text-sm text-teal-800">
                      <li>• استخدم صفحة الدعم للبحث عن إجابات سريعة</li>
                      <li>• راجع قسم الأسئلة الشائعة</li>
                      <li>• استخدم نموذج التواصل لطلب المساعدة</li>
                      <li>• تحقق من حالة الأنظمة إذا واجهت مشاكل تقنية</li>
                      <li>• احتفظ برقم المعاملة عند التبليغ عن مشكلة</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-900">خطوتك التالية</h4>
              </div>
              <p className="text-sm text-yellow-800 text-right">
                الآن بعد قراءة هذا الدليل، ننصحك بتجربة إجراء تحويل تجريبي بمبلغ صغير 
                للتأكد من فهمك لكيفية عمل النظام. لا تتردد في طلب المساعدة إذا احتجت لذلك!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* محتوى إدارة التحويلات */}
      {selectedHelpTopic === 'transfers' && (
        <Card className="mt-6 border-2 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedHelpTopic(null)}
                className="text-sm"
              >
                ← العودة
              </Button>
              <div className="flex items-center gap-2">
                <CardTitle className="text-right text-xl">إدارة التحويلات</CardTitle>
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="internal-transfers">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>التحويلات الداخلية</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">كيفية إجراء تحويل داخلي:</h4>
                    <ol className="space-y-1 text-sm text-blue-800">
                      <li>1. انتقل إلى صفحة "التحويلات الداخلية"</li>
                      <li>2. أدخل رقم حساب المستلم (مثال: 33003002)</li>
                      <li>3. اختر العملة والمبلغ المراد تحويله</li>
                      <li>4. أضف ملاحظة اختيارية</li>
                      <li>5. راجع التفاصيل واضغط "تأكيد التحويل"</li>
                    </ol>
                    <div className="mt-3 p-2 bg-blue-100 rounded">
                      <p className="text-xs text-blue-700">
                        💡 نصيحة: التحويلات الداخلية فورية ولا تحتاج رسوم إضافية
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="city-transfers">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>التحويلات بين المدن</span>
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">خطوات التحويل بين المدن:</h4>
                    <ol className="space-y-1 text-sm text-green-800">
                      <li>1. اذهب إلى "التحويلات بين المدن"</li>
                      <li>2. اختر المدينة المرسل إليها</li>
                      <li>3. أدخل اسم المستلم ورقم هاتفه</li>
                      <li>4. حدد العملة والمبلغ</li>
                      <li>5. ستحصل على رمز تحقق من 6 أرقام</li>
                      <li>6. أرسل الرمز للمستلم لاستلام الحوالة</li>
                    </ol>
                    <div className="mt-3 p-2 bg-green-100 rounded">
                      <p className="text-xs text-green-700">
                        💡 مهم: احتفظ برمز التحقق واحرص على إرساله للمستلم الصحيح
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="commission-system">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>نظام العمولات</span>
                    <Settings className="h-4 w-4 text-purple-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">كيف تعمل العمولات:</h4>
                    <ul className="space-y-1 text-sm text-purple-800">
                      <li>• عمولات التحويلات بين المدن تُحسب تلقائياً</li>
                      <li>• العمولة تُخصم من المرسل عند إرسال الحوالة</li>
                      <li>• يمكن للوكلاء رؤية عمولاتهم في لوحة التحكم</li>
                      <li>• العمولات تُضاف لحساب العمولات عند استلام الحوالة</li>
                      <li>• يمكن سحب العمولات المتاحة في أي وقت</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transfer-status">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>تتبع حالة التحويل</span>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">حالات التحويل:</h4>
                    <div className="space-y-2 text-sm text-orange-800">
                      <div className="flex items-center justify-between border-b pb-1">
                        <span className="font-medium">قيد الانتظار</span>
                        <span>تم إرسال الحوالة ولم يتم استلامها بعد</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-1">
                        <span className="font-medium">مكتملة</span>
                        <span>تم استلام الحوالة بنجاح</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-1">
                        <span className="font-medium">ملغية</span>
                        <span>تم إلغاء الحوالة واسترداد المبلغ</span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transfer-limits">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>حدود التحويل</span>
                    <Info className="h-4 w-4 text-blue-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">الحدود والقيود:</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• الحد الأدنى للتحويل: 10 وحدات من أي عملة</li>
                      <li>• الحد الأقصى للتحويل: يختلف حسب مستوى الحساب</li>
                      <li>• عدد التحويلات اليومية: بدون حد للحسابات المفعلة</li>
                      <li>• التحويلات الداخلية: بدون رسوم إضافية</li>
                      <li>• التحويلات بين المدن: رسوم حسب المسافة والمبلغ</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-900">نصائح مهمة للتحويلات</h4>
              </div>
              <ul className="text-sm text-yellow-800 text-right space-y-1">
                <li>• تأكد من صحة بيانات المستلم قبل الإرسال</li>
                <li>• احتفظ برقم المعاملة لمراجعتها لاحقاً</li>
                <li>• لا تشارك رمز التحقق مع أشخاص غير مخولين</li>
                <li>• راجع رصيدك قبل إجراء أي تحويل</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* محتوى الأمان والحماية */}
      {selectedHelpTopic === 'security' && (
        <Card className="mt-6 border-2 border-red-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedHelpTopic(null)}
                className="text-sm"
              >
                ← العودة
              </Button>
              <div className="flex items-center gap-2">
                <CardTitle className="text-right text-xl">الأمان والحماية</CardTitle>
                <Shield className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="password-security">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>أمان كلمة المرور</span>
                    <Shield className="h-4 w-4 text-red-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">قواعد كلمة المرور الآمنة:</h4>
                    <ul className="space-y-1 text-sm text-red-800">
                      <li>• يجب أن تحتوي على 8 أحرف على الأقل</li>
                      <li>• استخدم مزيج من الأحرف الكبيرة والصغيرة</li>
                      <li>• أضف أرقام ورموز خاصة</li>
                      <li>• لا تستخدم معلومات شخصية</li>
                      <li>• غير كلمة المرور بانتظام</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="account-protection">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>حماية الحساب</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">نصائح حماية الحساب:</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• لا تشارك بيانات تسجيل الدخول مع أحد</li>
                      <li>• تأكد من تسجيل الخروج من الأجهزة العامة</li>
                      <li>• راجع نشاط حسابك بانتظام</li>
                      <li>• احتفظ برقم حسابك في مكان آمن</li>
                      <li>• أبلغ عن أي نشاط مشبوه فوراً</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transaction-security">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>أمان المعاملات</span>
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">إرشادات أمان المعاملات:</h4>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li>• تحقق من تفاصيل المعاملة قبل التأكيد</li>
                      <li>• استخدم شبكة إنترنت آمنة</li>
                      <li>• احتفظ بسجل لجميع معاملاتك</li>
                      <li>• أبلغ عن أي معاملات غير مصرح بها</li>
                      <li>• لا تجري معاملات من أجهزة مشتركة</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="suspicious-activity">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>التبليغ عن النشاط المشبوه</span>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">ماذا تفعل عند الشك:</h4>
                    <ul className="space-y-1 text-sm text-orange-800">
                      <li>• غير كلمة المرور فوراً</li>
                      <li>• تواصل مع فريق الدعم</li>
                      <li>• راجع تاريخ المعاملات</li>
                      <li>• احتفظ بلقطات شاشة للأدلة</li>
                      <li>• لا تشارك هذه المعلومات مع أحد</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-900">تذكير مهم</h4>
              </div>
              <p className="text-sm text-yellow-800 text-right">
                فريق مكتب الصرافة لن يطلب منك أبداً كلمة المرور أو رقم الحساب عبر الهاتف أو البريد الإلكتروني. 
                إذا تلقيت مثل هذا الطلب، فهو محاولة احتيال.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* محتوى استكشاف الأخطاء */}
      {selectedHelpTopic === 'troubleshooting' && (
        <Card className="mt-6 border-2 border-yellow-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedHelpTopic(null)}
                className="text-sm"
              >
                ← العودة
              </Button>
              <div className="flex items-center gap-2">
                <CardTitle className="text-right text-xl">استكشاف الأخطاء</CardTitle>
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2 text-right">حل المشاكل الشائعة</h4>
              <p className="text-sm text-yellow-800 text-right">
                هذا القسم يساعدك على حل المشاكل التقنية الأكثر شيوعاً بنفسك دون الحاجة للتواصل مع الدعم الفني.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="login-issues">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>مشاكل تسجيل الدخول</span>
                    <Shield className="h-4 w-4 text-red-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">الحلول الشائعة:</h4>
                    <div className="space-y-3 text-sm text-red-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">المشكلة: كلمة المرور خاطئة</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تأكد من إدخال كلمة المرور بدقة</li>
                          <li>• تحقق من حالة الأحرف (كبيرة/صغيرة)</li>
                          <li>• تأكد من عدم تفعيل Caps Lock</li>
                          <li>• جرب نسخ ولصق كلمة المرور</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">المشكلة: نسيت كلمة المرور</span>
                        <ul className="mt-1 space-y-1">
                          <li>• استخدم خيار "نسيت كلمة المرور"</li>
                          <li>• تحقق من صندوق الوارد والرسائل المرفوضة</li>
                          <li>• تواصل مع الدعم إذا لم تصلك رسالة الاسترداد</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">المشكلة: رقم الحساب غير صحيح</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تأكد من إدخال رقم الحساب كاملاً (يبدأ بـ 33003)</li>
                          <li>• تحقق من عدم وجود مسافات إضافية</li>
                          <li>• راجع رقم الحساب من الرسائل السابقة</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transfer-problems">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>مشاكل التحويلات</span>
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">أخطاء التحويل الشائعة:</h4>
                    <div className="space-y-3 text-sm text-green-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">المشكلة: رصيد غير كافي</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تحقق من رصيدك في العملة المطلوبة</li>
                          <li>• راجع المبلغ المطلوب تحويله</li>
                          <li>• تأكد من حساب العمولة ضمن المبلغ المتاح</li>
                          <li>• قم بإيداع أو تحويل المبلغ المطلوب</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">المشكلة: رقم حساب المستلم غير موجود</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تأكد من كتابة الرقم بشكل صحيح</li>
                          <li>• تحقق مع المستلم من رقم حسابه</li>
                          <li>• تأكد من أن الحساب مفعل</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">المشكلة: التحويل معلق أو لم يصل</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تحقق من حالة التحويل في تاريخ المعاملات</li>
                          <li>• انتظر بضع دقائق للتحويلات الداخلية</li>
                          <li>• للتحويلات بين المدن، تأكد من استلام رمز التحقق</li>
                          <li>• تواصل مع الدعم مع رقم المعاملة</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="balance-issues">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>مشاكل الرصيد</span>
                    <FileText className="h-4 w-4 text-blue-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">مشاكل عرض الرصيد:</h4>
                    <div className="space-y-3 text-sm text-blue-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">المشكلة: الرصيد لا يظهر أو خاطئ</span>
                        <ul className="mt-1 space-y-1">
                          <li>• حدث الصفحة (F5 أو سحب للأسفل في الهاتف)</li>
                          <li>• تحقق من اتصال الإنترنت</li>
                          <li>• اخرج وادخل مرة أخرى للحساب</li>
                          <li>• امسح ذاكرة التخزين المؤقت للمتصفح</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">المشكلة: تحويل لم ينعكس على الرصيد</span>
                        <ul className="mt-1 space-y-1">
                          <li>• انتظر دقيقتين ثم حدث الصفحة</li>
                          <li>• تحقق من تاريخ المعاملات</li>
                          <li>• تأكد من اكتمال التحويل</li>
                          <li>• راجع حالة المعاملة</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">المشكلة: رصيد ناقص بعد معاملة</span>
                        <ul className="mt-1 space-y-1">
                          <li>• راجع تاريخ المعاملات للعمولات</li>
                          <li>• تحقق من جميع المعاملات الأخيرة</li>
                          <li>• تأكد من عدم وجود تحويلات غير مصرح بها</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="app-performance">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>مشاكل الأداء والتطبيق</span>
                    <Settings className="h-4 w-4 text-purple-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">تحسين الأداء:</h4>
                    <div className="space-y-3 text-sm text-purple-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">المشكلة: التطبيق بطيء</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تحقق من سرعة اتصال الإنترنت</li>
                          <li>• أغلق التطبيقات الأخرى على الجهاز</li>
                          <li>• حدث المتصفح لآخر إصدار</li>
                          <li>• امسح ذاكرة التخزين المؤقت</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">المشكلة: التطبيق لا يحمل</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تحقق من اتصال الإنترنت</li>
                          <li>• جرب مستعرض آخر</li>
                          <li>• أعد تشغيل الجهاز</li>
                          <li>• تحقق من حالة الخدمة في قسم "حالة النظام"</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">المشكلة: أخطاء في العرض</span>
                        <ul className="mt-1 space-y-1">
                          <li>• حدث الصفحة</li>
                          <li>• امسح الكوكيز وذاكرة التخزين</li>
                          <li>• جرب وضع التصفح الخاص</li>
                          <li>• تأكد من دعم المتصفح للتطبيق</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="notifications-messages">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>مشاكل الإشعارات والرسائل</span>
                    <MessageCircle className="h-4 w-4 text-orange-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">مشاكل التواصل:</h4>
                    <div className="space-y-3 text-sm text-orange-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">المشكلة: لا تصل الإشعارات</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تحقق من إعدادات الإشعارات في المتصفح</li>
                          <li>• تأكد من السماح للموقع بإرسال الإشعارات</li>
                          <li>• راجع الإشعارات يدوياً في التطبيق</li>
                          <li>• تحقق من إعدادات عدم الإزعاج في الجهاز</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">المشكلة: الرسائل لا ترسل</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تحقق من اتصال الإنترنت</li>
                          <li>• تأكد من أن المحادثة نشطة</li>
                          <li>• جرب إرسال رسالة أقصر</li>
                          <li>• حدث الصفحة وأعد المحاولة</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">المشكلة: لا يمكن رؤية الرسائل</span>
                        <ul className="mt-1 space-y-1">
                          <li>• حدث المحادثة</li>
                          <li>• تحقق من إعدادات الخصوصية</li>
                          <li>• تأكد من عدم حظر المستخدم</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="general-troubleshooting">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>نصائح عامة لحل المشاكل</span>
                    <HelpCircle className="h-4 w-4 text-teal-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-teal-900 mb-2">خطوات عامة للحل:</h4>
                    <ol className="space-y-1 text-sm text-teal-800">
                      <li>1. حدث الصفحة أو أعد تحميلها</li>
                      <li>2. تحقق من اتصال الإنترنت</li>
                      <li>3. امسح ذاكرة التخزين المؤقت للمتصفح</li>
                      <li>4. جرب مستعرض آخر أو وضع التصفح الخاص</li>
                      <li>5. أعد تسجيل الدخول للحساب</li>
                      <li>6. أعد تشغيل الجهاز إذا لزم الأمر</li>
                      <li>7. تحقق من حالة النظام في صفحة الدعم</li>
                      <li>8. إذا استمرت المشكلة، تواصل مع الدعم الفني</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-red-900">متى تتواصل مع الدعم؟</h4>
              </div>
              <ul className="text-sm text-red-800 text-right space-y-1">
                <li>• إذا لم تحل الحلول المذكورة المشكلة</li>
                <li>• عند فقدان مبالغ أو معاملات مشبوهة</li>
                <li>• مشاكل أمنية أو اختراق محتمل</li>
                <li>• أخطاء تقنية متكررة</li>
                <li>• احتفظ برقم المعاملة ولقطات الشاشة عند التواصل</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">معلومات مفيدة للدعم الفني</h4>
              </div>
              <p className="text-sm text-blue-800 text-right">
                عند التواصل مع الدعم، شارك هذه المعلومات لحل أسرع: نوع المتصفح، نظام التشغيل، 
                رقم المعاملة (إن وجد), وصف تفصيلي للمشكلة, لقطات شاشة للخطأ.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* محتوى الأسئلة الشائعة */}
      {selectedHelpTopic === 'faq' && (
        <Card className="mt-6 border-2 border-orange-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedHelpTopic(null)}
                className="text-sm"
              >
                ← العودة
              </Button>
              <div className="flex items-center gap-2">
                <CardTitle className="text-right text-xl">الأسئلة الشائعة</CardTitle>
                <HelpCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2 text-right">الأسئلة الأكثر شيوعاً</h4>
              <p className="text-sm text-orange-800 text-right">
                هنا تجد إجابات واضحة ومفصلة للأسئلة التي يطرحها المستخدمون بكثرة. 
                إذا لم تجد إجابة لسؤالك، لا تتردد في التواصل معنا.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="account-setup">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>كيف أحصل على رقم حساب؟</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">الحصول على رقم الحساب:</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>يتم إنشاء رقم حساب فريد لك تلقائياً عند التسجيل في المنصة. رقم الحساب يبدأ بـ 33003 ويتكون من 11 رقماً.</p>
                      <p className="font-medium">مثال: 33003001, 33003002, 33003003</p>
                      <div className="bg-blue-100 p-2 rounded mt-2">
                        <p className="text-xs font-medium">مهم جداً:</p>
                        <ul className="text-xs space-y-1 mt-1">
                          <li>• احتفظ برقم حسابك في مكان آمن</li>
                          <li>• شاركه فقط مع الأشخاص الذين تريد استقبال تحويلات منهم</li>
                          <li>• لا يمكن تغيير رقم الحساب بعد إنشائه</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="forgotten-account">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>نسيت رقم حسابي، كيف أعرفه؟</span>
                    <Shield className="h-4 w-4 text-red-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">طرق معرفة رقم الحساب:</h4>
                    <ol className="space-y-1 text-sm text-red-800">
                      <li>1. سجل دخولك للمنصة - رقم الحساب مكتوب في أعلى الصفحة</li>
                      <li>2. راجع إشعاراتك القديمة - رقم الحساب مذكور فيها</li>
                      <li>3. اطلب من شخص أرسل لك تحويلاً سابقاً - لديه رقم حسابك</li>
                      <li>4. تواصل مع الدعم الفني بحسابك المسجل</li>
                    </ol>
                    <div className="bg-red-100 p-2 rounded mt-2">
                      <p className="text-xs text-red-700">
                        💡 نصيحة: احفظ رقم حسابك في هاتفك أو دفتر ملاحظاتك لتجنب نسيانه
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transfer-fees">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>ما هي رسوم التحويل؟</span>
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">هيكل الرسوم:</h4>
                    <div className="space-y-3 text-sm text-green-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">التحويلات الداخلية:</span>
                        <p>مجانية تماماً - بدون أي رسوم إضافية</p>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">التحويلات بين المدن:</span>
                        <p>رسوم متغيرة حسب المدينة والمبلغ</p>
                        <ul className="mt-1 space-y-1">
                          <li>• نفس المحافظة: 0.5% من المبلغ</li>
                          <li>• محافظات مختلفة: 1% من المبلغ</li>
                          <li>• الحد الأدنى: 5 دينار ليبي</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">العمولات للوكلاء:</span>
                        <p>يحصل الوكلاء على نسبة من رسوم التحويلات</p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transfer-time">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>كم من الوقت يستغرق التحويل؟</span>
                    <Clock className="h-4 w-4 text-purple-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">أوقات التحويل:</h4>
                    <div className="space-y-2 text-sm text-purple-800">
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">التحويلات الداخلية</span>
                        <span>فوري (أقل من دقيقة)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">التحويلات بين المدن</span>
                        <span>فوري عند الإرسال، يحتاج استلام من المكتب</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">تحديث الرصيد</span>
                        <span>فوري في جميع الحالات</span>
                      </div>
                    </div>
                    <div className="bg-purple-100 p-2 rounded mt-2">
                      <p className="text-xs text-purple-700">
                        💡 ملاحظة: إذا تأخر التحويل أكثر من 5 دقائق، تواصل مع الدعم الفني
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="verification-code">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>ما هو رمز التحقق وكيف أستخدمه؟</span>
                    <Settings className="h-4 w-4 text-indigo-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-indigo-900 mb-2">عن رمز التحقق:</h4>
                    <div className="space-y-2 text-sm text-indigo-800">
                      <p>رمز التحقق هو رقم من 6 أرقام يُنشأ تلقائياً عند إرسال تحويل بين المدن.</p>
                      <div className="bg-indigo-100 p-3 rounded">
                        <h5 className="font-medium mb-2">كيفية الاستخدام:</h5>
                        <ol className="space-y-1 text-xs">
                          <li>1. أرسل التحويل للمدينة المطلوبة</li>
                          <li>2. احصل على رمز التحقق من 6 أرقام</li>
                          <li>3. أرسل الرمز للمستلم عبر الهاتف أو الرسائل</li>
                          <li>4. المستلم يذهب لأقرب مكتب ويعطي الرمز + بطاقة الهوية</li>
                          <li>5. يستلم المبلغ فوراً</li>
                        </ol>
                      </div>
                      <div className="bg-red-100 p-2 rounded">
                        <p className="text-xs text-red-700 font-medium">
                          تحذير: لا تشارك رمز التحقق مع أشخاص غير مخولين
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cancel-transfer">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>هل يمكن إلغاء التحويل بعد إرساله؟</span>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">سياسة الإلغاء:</h4>
                    <div className="space-y-3 text-sm text-orange-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">التحويلات الداخلية:</span>
                        <p>لا يمكن إلغاؤها - تتم فوراً وتكون نهائية</p>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">التحويلات بين المدن:</span>
                        <p>يمكن إلغاؤها قبل الاستلام فقط</p>
                        <ul className="mt-1 space-y-1">
                          <li>• تواصل مع الدعم فوراً</li>
                          <li>• قدم رقم المعاملة ورمز التحقق</li>
                          <li>• سيتم استرداد المبلغ خلال 24 ساعة</li>
                          <li>• لا يمكن الإلغاء بعد الاستلام</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-orange-100 p-2 rounded">
                      <p className="text-xs text-orange-700">
                        💡 نصيحة: تأكد من صحة البيانات قبل الإرسال لتجنب الحاجة للإلغاء
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="account-security">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>كيف أحمي حسابي من الاختراق؟</span>
                    <Shield className="h-4 w-4 text-red-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">خطوات الحماية:</h4>
                    <ul className="space-y-1 text-sm text-red-800">
                      <li>• استخدم كلمة مرور قوية (أحرف، أرقام، رموز)</li>
                      <li>• لا تشارك بيانات تسجيل الدخول مع أي شخص</li>
                      <li>• لا تستخدم شبكات Wi-Fi العامة للتطبيق</li>
                      <li>• سجل خروج من الحساب بعد كل استخدام</li>
                      <li>• راجع تاريخ المعاملات بانتظام</li>
                      <li>• أبلغ عن أي نشاط مشبوه فوراً</li>
                      <li>• لا تفتح روابط مشبوهة تطلب بيانات الحساب</li>
                    </ul>
                    <div className="bg-red-100 p-2 rounded mt-2">
                      <p className="text-xs text-red-700 font-medium">
                        تذكير: فريق الدعم لن يطلب منك كلمة المرور أبداً
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="supported-currencies">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>ما هي العملات المدعومة؟</span>
                    <FileText className="h-4 w-4 text-blue-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">العملات المتاحة:</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
                      <div className="bg-blue-100 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">LYD</span>
                          <span>الدينار الليبي</span>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">USD</span>
                          <span>الدولار الأمريكي</span>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">EUR</span>
                          <span>اليورو الأوروبي</span>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">TRY</span>
                          <span>الليرة التركية</span>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">AED</span>
                          <span>الدرهم الإماراتي</span>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">EGP</span>
                          <span>الجنيه المصري</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-100 p-2 rounded mt-2">
                      <p className="text-xs text-blue-700">
                        💡 يمكنك التحويل بين أي من هذه العملات داخل المنصة
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="agent-benefits">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>ما هي مزايا أن أصبح وكيلاً؟</span>
                    <Users className="h-4 w-4 text-teal-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-teal-900 mb-2">مزايا الوكلاء:</h4>
                    <ul className="space-y-1 text-sm text-teal-800">
                      <li>• كسب عمولة من التحويلات التي تتم في منطقتك</li>
                      <li>• إمكانية سحب العمولات في أي وقت</li>
                      <li>• لوحة تحكم خاصة لمراقبة العمليات</li>
                      <li>• إشعارات فورية بالتحويلات الجديدة</li>
                      <li>• دعم فني مخصص للوكلاء</li>
                      <li>• إمكانية توسيع نطاق الخدمة</li>
                    </ul>
                    <div className="bg-teal-100 p-2 rounded mt-2">
                      <p className="text-xs text-teal-700">
                        💡 للتقديم كوكيل، تواصل معنا عبر نموذج الاتصال في صفحة الدعم
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="mobile-access">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>هل يمكن استخدام المنصة على الهاتف؟</span>
                    <Settings className="h-4 w-4 text-purple-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">الوصول عبر الهاتف:</h4>
                    <div className="space-y-2 text-sm text-purple-800">
                      <p>نعم! المنصة متوافقة تماماً مع جميع الأجهزة المحمولة.</p>
                      <ul className="space-y-1">
                        <li>• تفتح في متصفح الهاتف بسهولة</li>
                        <li>• تصميم متجاوب يتكيف مع شاشة الهاتف</li>
                        <li>• نفس الميزات المتاحة على الكمبيوتر</li>
                        <li>• سرعة وأمان عاليين</li>
                        <li>• إشعارات فورية</li>
                      </ul>
                      <div className="bg-purple-100 p-2 rounded">
                        <p className="text-xs text-purple-700">
                          💡 نصيحة: أضف المنصة لشاشة الهاتف الرئيسية للوصول السريع
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold text-orange-900">لم تجد إجابة لسؤالك؟</h4>
              </div>
              <div className="text-sm text-orange-800 text-right space-y-2">
                <p>لا تتردد في التواصل معنا! فريق الدعم جاهز لمساعدتك:</p>
                <ul className="space-y-1">
                  <li>• استخدم نموذج التواصل في تبويب "التواصل"</li>
                  <li>• اختر مستوى الأولوية المناسب</li>
                  <li>• قدم أكبر قدر من التفاصيل</li>
                  <li>• احتفظ برقم المعاملة إن وجد</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* محتوى إعدادات الحساب */}
      {selectedHelpTopic === 'account-settings' && (
        <Card className="mt-6 border-2 border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedHelpTopic(null)}
                className="text-sm"
              >
                ← العودة
              </Button>
              <div className="flex items-center gap-2">
                <CardTitle className="text-right text-xl">إعدادات الحساب</CardTitle>
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2 text-right">تخصيص حسابك</h4>
              <p className="text-sm text-purple-800 text-right">
                هذا القسم يساعدك على إدارة وتخصيص إعدادات حسابك الشخصية لتحسين تجربة الاستخدام والأمان.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="profile-management">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>إدارة الملف الشخصي</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">بيانات الملف الشخصي:</h4>
                    <div className="space-y-3 text-sm text-blue-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">الاسم الكامل:</span>
                        <p>يظهر في المعاملات والتحويلات</p>
                        <p className="text-xs">• لا يمكن تعديله إلا عبر الدعم الفني</p>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">البريد الإلكتروني:</span>
                        <p>يُستخدم لاستلام الإشعارات المهمة</p>
                        <p className="text-xs">• تأكد من صحته وإمكانية الوصول إليه</p>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">رقم الهاتف:</span>
                        <p>مطلوب للتحقق من الهوية</p>
                        <p className="text-xs">• يُستخدم في التحويلات بين المدن</p>
                      </div>
                      <div>
                        <span className="font-medium">رقم الحساب:</span>
                        <p>رقم فريد لا يمكن تغييره (مثال: 33003001)</p>
                        <p className="text-xs">• شاركه مع من تريد استقبال تحويلات منهم</p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="security-settings">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>إعدادات الأمان</span>
                    <Shield className="h-4 w-4 text-red-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">إعدادات الحماية:</h4>
                    <div className="space-y-3 text-sm text-red-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">تغيير كلمة المرور:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• استخدم كلمة مرور قوية (8 أحرف على الأقل)</li>
                          <li>• اجمع بين الأحرف والأرقام والرموز</li>
                          <li>• تجنب استخدام معلومات شخصية</li>
                          <li>• غير كلمة المرور كل 6 أشهر</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">مراقبة النشاط:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• راجع تاريخ تسجيل الدخول بانتظام</li>
                          <li>• تحقق من المعاملات غير المألوفة</li>
                          <li>• أبلغ عن أي نشاط مشبوه فوراً</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">الحماية من الاحتيال:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• لا تشارك بيانات تسجيل الدخول مع أحد</li>
                          <li>• تجنب الوصول للحساب من أجهزة عامة</li>
                          <li>• سجل خروج بعد كل استخدام</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="notification-preferences">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>تفضيلات الإشعارات</span>
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">أنواع الإشعارات:</h4>
                    <div className="space-y-3 text-sm text-green-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">إشعارات المعاملات:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تحويلات واردة وصادرة</li>
                          <li>• تأكيد إتمام المعاملات</li>
                          <li>• تحديثات حالة التحويل</li>
                          <li>• رموز التحقق للتحويلات بين المدن</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">إشعارات الأمان:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تسجيل دخول من جهاز جديد</li>
                          <li>• محاولات دخول مشبوهة</li>
                          <li>• تغييرات في إعدادات الحساب</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">إشعارات النظام:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تحديثات المنصة</li>
                          <li>• صيانة مجدولة</li>
                          <li>• إعلانات مهمة</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transfer-settings">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>إعدادات التحويل</span>
                    <CreditCard className="h-4 w-4 text-orange-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">تخصيص التحويلات:</h4>
                    <div className="space-y-3 text-sm text-orange-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">العملة المفضلة:</span>
                        <p>اختر العملة الافتراضية لسهولة التحويل</p>
                        <ul className="mt-1 space-y-1">
                          <li>• تظهر كخيار افتراضي في نماذج التحويل</li>
                          <li>• يمكن تغييرها في أي وقت</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">حدود التحويل الشخصية:</span>
                        <p>ضع حدود إضافية لمزيد من الأمان</p>
                        <ul className="mt-1 space-y-1">
                          <li>• حد أقصى يومي اختياري</li>
                          <li>• تنبيهات عند تجاوز مبالغ معينة</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">قوائم المفضلة:</span>
                        <p>حفظ حسابات متكررة للتحويل السريع</p>
                        <ul className="mt-1 space-y-1">
                          <li>• إضافة أسماء مستعارة للحسابات</li>
                          <li>• وصول سريع للمستلمين المتكررين</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="privacy-settings">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>إعدادات الخصوصية</span>
                    <Info className="h-4 w-4 text-indigo-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-indigo-900 mb-2">حماية خصوصيتك:</h4>
                    <div className="space-y-3 text-sm text-indigo-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">عرض المعلومات:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• التحكم في ظهور اسمك في التحويلات</li>
                          <li>• إخفاء تفاصيل غير ضرورية</li>
                          <li>• عرض الاسم المختصر فقط</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">بيانات المعاملات:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• فترة الاحتفاظ بسجل المعاملات</li>
                          <li>• تحديد المعلومات المحفوظة</li>
                          <li>• طلب حذف البيانات القديمة</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">المشاركة مع الغير:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• عدم مشاركة بياناتك مع أطراف ثالثة</li>
                          <li>• استخدام البيانات لتحسين الخدمة فقط</li>
                          <li>• الحق في طلب نسخة من بياناتك</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="language-region">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>اللغة والمنطقة</span>
                    <Settings className="h-4 w-4 text-teal-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-teal-900 mb-2">تخصيص المظهر:</h4>
                    <div className="space-y-3 text-sm text-teal-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">لغة الواجهة:</span>
                        <p>العربية (افتراضي)</p>
                        <ul className="mt-1 space-y-1">
                          <li>• دعم كامل للغة العربية</li>
                          <li>• تخطيط من اليمين إلى اليسار</li>
                          <li>• أرقام عربية غربية (0-9)</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">المنطقة الزمنية:</span>
                        <p>توقيت ليبيا (UTC+2)</p>
                        <ul className="mt-1 space-y-1">
                          <li>• عرض الأوقات حسب التوقيت المحلي</li>
                          <li>• تواريخ المعاملات بالتوقيت الليبي</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">تنسيق العملة:</span>
                        <p>عرض واضح للمبالغ والأرصدة</p>
                        <ul className="mt-1 space-y-1">
                          <li>• فواصل الآلاف للوضوح</li>
                          <li>• رموز العملات الدولية</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="account-limits">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>حدود ومستوى الحساب</span>
                    <FileText className="h-4 w-4 text-yellow-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">مستوى حسابك:</h4>
                    <div className="space-y-3 text-sm text-yellow-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">الحساب الأساسي:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تحويلات داخلية غير محدودة</li>
                          <li>• تحويلات بين المدن (حسب المتاح)</li>
                          <li>• إشعارات فورية</li>
                          <li>• دعم فني أساسي</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">ترقية الحساب:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تقديم وثائق إضافية للتحقق</li>
                          <li>• زيادة حدود التحويل</li>
                          <li>• ميزات متقدمة إضافية</li>
                          <li>• أولوية في الدعم الفني</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">حسابات الوكلاء:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• إمكانية استلام التحويلات</li>
                          <li>• كسب عمولات من التحويلات</li>
                          <li>• لوحة تحكم متقدمة</li>
                          <li>• تدريب وإرشاد مخصص</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="backup-recovery">
                <AccordionTrigger className="text-right">
                  <span className="flex items-center gap-2">
                    <span>النسخ الاحتياطي والاسترداد</span>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right space-y-3">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">حماية بياناتك:</h4>
                    <div className="space-y-3 text-sm text-red-800">
                      <div className="border-b pb-2">
                        <span className="font-medium">نسخ احتياطية تلقائية:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• حفظ تلقائي لجميع المعاملات</li>
                          <li>• نسخ متعددة في خوادم منفصلة</li>
                          <li>• حماية من فقدان البيانات</li>
                        </ul>
                      </div>
                      <div className="border-b pb-2">
                        <span className="font-medium">استرداد الحساب:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• استرداد كلمة المرور عبر البريد الإلكتروني</li>
                          <li>• تحقق من الهوية للوصول</li>
                          <li>• استرداد البيانات المحفوظة</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">في حالة فقدان الوصول:</span>
                        <ul className="mt-1 space-y-1">
                          <li>• تواصل مع الدعم الفني فوراً</li>
                          <li>• قدم وثائق إثبات الهوية</li>
                          <li>• إجراءات تحقق إضافية للحماية</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">نصائح مهمة لإدارة الحساب</h4>
              </div>
              <div className="text-sm text-purple-800 text-right space-y-2">
                <ul className="space-y-1">
                  <li>• راجع إعداداتك بانتظام للتأكد من صحتها</li>
                  <li>• حدث معلومات الاتصال عند تغييرها</li>
                  <li>• استخدم كلمة مرور قوية وفريدة</li>
                  <li>• فعّل جميع الإشعارات الأمنية</li>
                  <li>• لا تشارك تفاصيل حسابك مع أي شخص</li>
                  <li>• تواصل مع الدعم عند الشك في أي نشاط</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">تحديث الإعدادات</h4>
              </div>
              <p className="text-sm text-blue-800 text-right">
                بعض الإعدادات تتطلب تأكيد إضافي لحماية حسابك. قد تحتاج لإدخال كلمة المرور أو 
                التحقق عبر البريد الإلكتروني لحفظ التغييرات المهمة.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}