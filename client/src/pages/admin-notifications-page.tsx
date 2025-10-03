import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";
import { Bell, Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
} from "@/components/ui";

// نموذج للتحقق من صحة بيانات الإشعار
const notificationSchema = z.object({
  account_number: z.string().min(1, { message: "رقم الحساب مطلوب" }),
  subject: z.string().min(3, { message: "الموضوع يجب أن يحتوي على 3 أحرف على الأقل" }),
  message: z.string().min(10, { message: "الرسالة يجب أن تحتوي على 10 أحرف على الأقل" }),
});

export default function AdminNotificationsPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [sendingStatus, setSendingStatus] = useState<
    "idle" | "success" | "error" | "sending"
  >("idle");

  // نموذج الإشعار
  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      account_number: "",
      subject: "",
      message: "",
    },
  });

  // إرسال إشعار للمستخدم
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSchema>) => {
      const response = await apiRequest("/api/admin/notify-by-account", "POST", {
        account_number: data.account_number,
        subject: data.subject,
        message: data.message,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "فشل في إرسال الإشعار");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setSendingStatus("success");
      toast({
        title: "تم الإرسال",
        description: data.message,
      });
      form.reset();
    },
    onError: (error: Error) => {
      setSendingStatus("error");
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // التعامل مع إرسال النموذج
  const onSubmit = (data: z.infer<typeof notificationSchema>) => {
    setSendingStatus("sending");
    sendNotificationMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 dir-rtl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">إرسال إشعارات</h1>
          <Button
            variant="outline"
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للوحة التحكم
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>إرسال إشعار لمستخدم</CardTitle>
              <CardDescription>
                قم بإرسال إشعار إلى مستخدم محدد عن طريق رقم الحساب
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم حساب المستخدم</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="أدخل رقم حساب المستخدم (مثال: 2XXXXXXXXX)"
                            dir="ltr"
                          />
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
                        <FormLabel>موضوع الإشعار</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="أدخل موضوع الإشعار"
                          />
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
                        <FormLabel>محتوى الإشعار</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="أدخل محتوى الإشعار"
                            rows={5}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sendingStatus === "sending"}
                  >
                    {sendingStatus === "sending" && (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    )}
                    <Bell className="h-4 w-4 ml-2" />
                    إرسال الإشعار
                  </Button>
                </form>
              </Form>

              {sendingStatus === "success" && (
                <div
                  className="mt-6 p-4 rounded-md bg-green-50 border border-green-500 text-green-600"
                >
                  <div className="flex items-center font-medium mb-2">
                    <CheckCircle className="h-4 w-4 ml-2" />
                    تم إرسال الإشعار بنجاح
                  </div>
                  <div className="text-sm">
                    تم إرسال الإشعار إلى المستخدم بنجاح
                  </div>
                </div>
              )}

              {sendingStatus === "error" && (
                <div
                  className="mt-6 p-4 rounded-md bg-red-50 border border-red-500 text-red-600"
                >
                  <div className="flex items-center font-medium mb-2">
                    <AlertCircle className="h-4 w-4 ml-2" />
                    فشل في إرسال الإشعار
                  </div>
                  <div className="text-sm">
                    حدث خطأ أثناء إرسال الإشعار. يرجى التحقق من رقم الحساب وحاول مرة أخرى.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>تعليمات استخدام نظام الإشعارات</CardTitle>
              <CardDescription>
                كيفية استخدام نظام الإشعارات بفعالية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">رقم الحساب</h3>
                <p className="text-sm text-muted-foreground">
                  أدخل رقم حساب المستخدم الذي تريد إرسال الإشعار إليه. يجب أن يبدأ رقم الحساب بـ "2" متبوعاً بـ 9 أرقام.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">موضوع الإشعار</h3>
                <p className="text-sm text-muted-foreground">
                  أدخل موضوعاً واضحاً وموجزاً للإشعار يلخص محتواه.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">محتوى الإشعار</h3>
                <p className="text-sm text-muted-foreground">
                  أدخل المحتوى التفصيلي للإشعار. تأكد من أن المحتوى واضح ومفهوم للمستخدم.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-500 text-blue-600 p-4 rounded-md">
                <div className="flex items-center font-medium mb-2">
                  <Bell className="h-4 w-4 ml-2" />
                  ملاحظة هامة
                </div>
                <div className="text-sm">
                  سيظهر الإشعار للمستخدم في قائمة الإشعارات الخاصة به فور إرساله. تأكد من صحة رقم الحساب قبل الإرسال.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}