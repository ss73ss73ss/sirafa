import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/dashboard/sidebar";
import { Trash2, PlusCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// نموذج البيانات
interface CountryCommission {
  id: number;
  officeId: number;
  country: string;
  commissionRate: number | string;
}

// مخطط التحقق من صحة النموذج
const commissionSchema = z.object({
  country: z.string().min(2, { message: "يرجى إدخال اسم الدولة" }),
  commissionRate: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 10, { 
      message: "يجب أن تكون نسبة العمولة رقماً موجباً بين 0 و 10" 
    })
});

type CommissionFormValues = z.infer<typeof commissionSchema>;

export default function CountryCommissionsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<CountryCommission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      country: "",
      commissionRate: "",
    },
  });

  // حماية الصفحة - يجب أن يكون المستخدم من نوع مكتب صرافة
  useEffect(() => {
    if (user && user.type !== 'agent') {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  // تحميل العمولات عند تحميل الصفحة
  useEffect(() => {
    loadCommissions();
  }, []);

  // جلب عمولات المكتب حسب الدول
  const loadCommissions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("/api/office-country-commissions", "GET");
      const data = await response.json();
      setCommissions(data);
    } catch (error) {
      console.error("خطأ في تحميل بيانات العمولات:", error);
      setError("حدث خطأ أثناء تحميل بيانات العمولات");
    } finally {
      setIsLoading(false);
    }
  };

  // حفظ عمولة جديدة أو تحديث عمولة موجودة
  const onSubmit = async (values: CommissionFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await apiRequest("/api/office-country-commissions", "POST", values);
      const data = await response.json();
      
      toast({
        title: "تم بنجاح",
        description: "تم تحديث عمولة المكتب للدولة المحددة",
      });
      
      setIsDialogOpen(false);
      form.reset();
      loadCommissions();
      
    } catch (error) {
      console.error("خطأ في إضافة/تحديث العمولة:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ العمولة، يرجى المحاولة مرة أخرى",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // حذف عمولة دولة
  const handleDelete = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/office-country-commissions/${id}`);
      
      toast({
        title: "تم بنجاح",
        description: "تم حذف عمولة الدولة",
      });
      
      loadCommissions();
      
    } catch (error) {
      console.error("خطأ في حذف العمولة:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء حذف العمولة، يرجى المحاولة مرة أخرى",
      });
    }
  };

  if (!user || user.type !== 'agent') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 p-4">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-8">إدارة عمولات المكتب حسب الدول</h1>
          
          <div className="grid gap-8">
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                يمكنك تحديد نسب العمولة المختلفة حسب الدول التي تتعامل معها. سيتم تطبيق هذه النسب عند إرسال الحوالات الدولية.
              </p>
            </div>
            
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">عمولات الدول</CardTitle>
                  <CardDescription>
                    تحديد نسبة العمولة التي يريد المكتب استلامها مقابل الحوالات الدولية من دول مختلفة
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                      <PlusCircle className="ml-2 h-4 w-4" />
                      إضافة عمولة جديدة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>إضافة أو تعديل عمولة دولة</DialogTitle>
                      <DialogDescription>
                        أدخل اسم الدولة ونسبة العمولة التي ترغب بتطبيقها على الحوالات القادمة منها
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم الدولة</FormLabel>
                              <FormControl>
                                <Input placeholder="مثال: الإمارات، مصر، تركيا" {...field} />
                              </FormControl>
                              <FormDescription>
                                أدخل اسم الدولة باللغة العربية
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="commissionRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نسبة العمولة (%)</FormLabel>
                              <FormControl>
                                <Input placeholder="مثال: 1.5" {...field} />
                              </FormControl>
                              <FormDescription>
                                يجب أن تكون القيمة بين 0 و 10
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                جاري الحفظ...
                              </>
                            ) : (
                              <>حفظ العمولة</>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-destructive p-4 text-center">{error}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الدولة</TableHead>
                        <TableHead>نسبة العمولة (%)</TableHead>
                        <TableHead className="text-left">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">
                            لا توجد عمولات مخصصة للدول حالياً
                          </TableCell>
                        </TableRow>
                      ) : (
                        commissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell className="font-medium">{commission.country}</TableCell>
                            <TableCell>{commission.commissionRate}%</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(commission.id)}
                                className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>معلومات عن عمولات الدول</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-bold text-blue-700 mb-2">كيف يتم احتساب العمولات الدولية؟</h3>
                    <p className="text-blue-600">
                      عند إرسال حوالة دولية، يتم احتساب عمولتين:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-blue-600">
                      <li>عمولة المكتب المستلم: يتم خصمها من المرسل ويستلمها المكتب المستلم</li>
                      <li>عمولة النظام: يتم خصمها من المرسل ويستلمها إدارة النظام</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h3 className="font-bold text-amber-700 mb-2">ملاحظات هامة</h3>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-amber-600">
                      <li>يمكنك تحديد عمولة مختلفة لكل دولة تتعامل معها</li>
                      <li>إذا لم تحدد عمولة لدولة معينة، سيتم تطبيق العمولة الافتراضية (0.5%)</li>
                      <li>يمكنك حذف أي عمولة لتطبيق العمولة الافتراضية</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}