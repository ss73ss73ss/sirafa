import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowRight, Building2, DollarSign, History, Download, CheckCircle } from "lucide-react";

// Schema للإرسال
const sendSchema = z.object({
  destinationCountry: z.string().min(1, "يرجى اختيار دولة الوجهة"),
  receiverOfficeId: z.string().min(1, "يرجى اختيار المكتب المستلم"),
  amount: z.string().min(1, "يرجى إدخال المبلغ").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "يجب أن يكون المبلغ رقماً موجباً"
  ),
  currency: z.string().min(1, "يرجى اختيار العملة"),
  senderName: z.string().min(2, "يجب أن يكون اسم المرسل أكثر من حرفين"),
  senderPhone: z.string().min(8, "يجب أن يكون رقم الهاتف صحيحاً"),
  receiverName: z.string().min(2, "يجب أن يكون اسم المستلم أكثر من حرفين"),
  receiverPhone: z.string().min(8, "يجب أن يكون رقم الهاتف صحيحاً"),
  notes: z.string().optional(),
});

// Schema للاستلام
const receiveSchema = z.object({
  transferCode: z.string().min(6, "رمز الاستلام يجب أن يكون 6 أرقام"),
});

type SendFormValues = z.infer<typeof sendSchema>;
type ReceiveFormValues = z.infer<typeof receiveSchema>;

export default function InterOfficeTransferCompletePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [availableOffices, setAvailableOffices] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);

  // التحقق من نوع المستخدم
  useEffect(() => {
    if (user && user.type !== 'agent' && user.type !== 'admin') {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة متاحة للمكاتب فقط",
        variant: "destructive",
      });
      setLocation('/dashboard');
    }
  }, [user, setLocation, toast]);

  // نموذج الإرسال
  const sendForm = useForm<SendFormValues>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      destinationCountry: "",
      receiverOfficeId: "",
      amount: "",
      currency: "LYD",
      senderName: "",
      senderPhone: "",
      receiverName: "",
      receiverPhone: "",
      notes: "",
    },
  });

  // نموذج الاستلام
  const receiveForm = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      transferCode: "",
    },
  });

  // جلب الدول المتاحة
  const { data: countries = [] } = useQuery<any[]>({
    queryKey: ['/api/countries'],
    queryFn: async () => {
      const res = await fetch('/api/countries');
      if (!res.ok) throw new Error('Failed to fetch countries');
      return res.json();
    },
  });

  // جلب سجل التحويلات
  const { data: transfers = [], refetch: refetchTransfers } = useQuery<any[]>({
    queryKey: ['/api/inter-office-transfers', user?.id],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/inter-office-transfers');
      return res.json();
    },
    enabled: !!user?.id, // تأكد من أن المستخدم مُحدد قبل البحث
  });

  // التعامل مع تغيير الدولة
  useEffect(() => {
    if (selectedCountry) {
      apiRequest('GET', `/api/agent-offices?country=${selectedCountry}`)
        .then(res => res.json())
        .then(data => {
          console.log('Offices data:', data);
          setAvailableOffices(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error('Error fetching offices:', err);
          setAvailableOffices([]);
        });
    } else {
      setAvailableOffices([]);
    }
  }, [selectedCountry]);

  // إرسال حوالة
  const onSendSubmit = async (data: SendFormValues) => {
    setIsSubmitting(true);
    try {
      const transferCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const transferData = {
        agentId: user?.id,
        destinationCountry: data.destinationCountry,
        receivingOffice: parseInt(data.receiverOfficeId),
        amount: parseFloat(data.amount),
        currency: data.currency,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        notes: data.notes,
        transferCode
      };

      const response = await apiRequest('POST', '/api/inter-office-transfers', transferData);
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "نجح التحويل الدولي",
          description: `رمز التحويل: ${result.transferCode}\nرمز المستلم: ${result.receiverCode}`,
          duration: 10000,
        });
        
        sendForm.reset();
        setSelectedCountry("");
        setAvailableOffices([]);
        refetchTransfers();
      } else {
        throw new Error(result.message || 'فشل في إرسال الحوالة');
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الإرسال",
        description: error.message || "حدث خطأ أثناء إرسال الحوالة",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // استلام حوالة
  const onReceiveSubmit = async (data: ReceiveFormValues) => {
    setIsReceiving(true);
    try {
      const response = await apiRequest('POST', '/api/receive-international-transfer', {
        transferCode: data.transferCode,
        agentId: user?.id
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "تم استلام الحوالة بنجاح",
          description: `تم استلام ${result.amount} ${result.currency} من ${result.senderName}`,
        });
        
        receiveForm.reset();
        refetchTransfers();
      } else {
        throw new Error(result.message || 'فشل في استلام الحوالة');
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الاستلام",
        description: error.message || "حدث خطأ أثناء استلام الحوالة",
        variant: "destructive",
      });
    } finally {
      setIsReceiving(false);
    }
  };

  if (!user || (user.type !== 'agent' && user.type !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-l from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              التحويلات بين المكاتب
            </CardTitle>
            <CardDescription className="text-blue-100">
              إرسال واستلام الحوالات الدولية بين المكاتب
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <Tabs defaultValue="send" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="send" className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  إرسال حوالة
                </TabsTrigger>
                <TabsTrigger value="receive" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  استلام حوالة
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  سجل العمليات
                </TabsTrigger>
              </TabsList>

              {/* تبويب الإرسال */}
              <TabsContent value="send" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">إرسال حوالة دولية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...sendForm}>
                      <form onSubmit={sendForm.handleSubmit(onSendSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* دولة الوجهة */}
                          <FormField
                            control={sendForm.control}
                            name="destinationCountry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>دولة الوجهة</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    setSelectedCountry(value);
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر دولة الوجهة" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {countries.map((country: any) => (
                                      <SelectItem key={country.code} value={country.code}>
                                        {country.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* المكتب المستلم */}
                          <FormField
                            control={sendForm.control}
                            name="receiverOfficeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>المكتب المستلم</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر المكتب المستلم" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Array.isArray(availableOffices) && availableOffices.length > 0 ? (
                                      availableOffices.map((office: any) => (
                                        <SelectItem key={office.id} value={office.id.toString()}>
                                          {office.name} - {office.city}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="p-2 text-center text-muted-foreground">
                                        {selectedCountry ? "لا توجد مكاتب متاحة" : "اختر دولة أولاً"}
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* المبلغ */}
                          <FormField
                            control={sendForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>المبلغ</FormLabel>
                                <FormControl>
                                  <Input placeholder="أدخل المبلغ" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* العملة */}
                          <FormField
                            control={sendForm.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>العملة</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر العملة" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="LYD">دينار ليبي (LYD)</SelectItem>
                                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                                    <SelectItem value="EUR">يورو (EUR)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* اسم المرسل */}
                          <FormField
                            control={sendForm.control}
                            name="senderName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>اسم المرسل</FormLabel>
                                <FormControl>
                                  <Input placeholder="أدخل اسم المرسل" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* هاتف المرسل */}
                          <FormField
                            control={sendForm.control}
                            name="senderPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>هاتف المرسل</FormLabel>
                                <FormControl>
                                  <Input placeholder="أدخل رقم الهاتف" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* اسم المستلم */}
                          <FormField
                            control={sendForm.control}
                            name="receiverName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>اسم المستلم</FormLabel>
                                <FormControl>
                                  <Input placeholder="أدخل اسم المستلم" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* هاتف المستلم */}
                          <FormField
                            control={sendForm.control}
                            name="receiverPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>هاتف المستلم</FormLabel>
                                <FormControl>
                                  <Input placeholder="أدخل رقم الهاتف" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* ملاحظات */}
                        <FormField
                          control={sendForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ملاحظات (اختيارية)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="أضف أي ملاحظات..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              جاري الإرسال...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              إرسال الحوالة
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* تبويب الاستلام */}
              <TabsContent value="receive" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">استلام حوالة دولية</CardTitle>
                    <CardDescription>
                      أدخل رمز التحويل ورمز المستلم لاستلام الحوالة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...receiveForm}>
                      <form onSubmit={receiveForm.handleSubmit(onReceiveSubmit)} className="space-y-4">
                        <div className="space-y-4">
                          {/* رمز الاستلام الموحد */}
                          <FormField
                            control={receiveForm.control}
                            name="transferCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>رمز الاستلام</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="أدخل رمز الاستلام (6 أرقام)" 
                                    maxLength={6}
                                    {...field} 
                                    className="text-center font-mono text-lg"
                                  />
                                </FormControl>
                                <div className="text-sm text-muted-foreground">
                                  الرمز الذي تم إعطاؤه للعميل عند إرسال الحوالة
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button type="submit" disabled={isReceiving} className="w-full">
                          {isReceiving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              جاري الاستلام...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              استلام الحوالة
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* تبويب السجل */}
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5" />
                      سجل التحويلات
                    </CardTitle>
                    <CardDescription>
                      عرض جميع التحويلات الدولية المرسلة والمستلمة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">رمز التحويل</TableHead>
                            <TableHead className="text-right">رمز المستلم</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">المستلم</TableHead>
                            <TableHead className="text-right">دولة الوجهة</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transfers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                لا توجد تحويلات متاحة
                              </TableCell>
                            </TableRow>
                          ) : (
                            transfers.map((transfer: any) => (
                              <TableRow key={transfer.id}>
                                <TableCell className="font-mono font-bold text-blue-600">
                                  {/* عرض رمز التحويل فقط إذا كان المستخدم الحالي هو المرسل */}
                                  {transfer.senderId === user?.id ? transfer.transferCode : "***"}
                                </TableCell>
                                <TableCell className="font-mono font-bold text-green-600">
                                  {/* عرض رمز المستلم فقط إذا كان المستخدم الحالي هو المرسل */}
                                  {transfer.senderId === user?.id ? transfer.receiverCode : "***"}
                                </TableCell>
                                <TableCell>
                                  {transfer.amount} {transfer.currency}
                                </TableCell>
                                <TableCell>{transfer.receiverName}</TableCell>
                                <TableCell>{transfer.destinationCountry}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={transfer.status === 'completed' ? 'default' : 'secondary'}
                                  >
                                    {transfer.status === 'completed' ? 'مكتمل' : 'معلق'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(transfer.createdAt).toLocaleDateString('ar-EG')}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}