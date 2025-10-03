import { useState, useEffect } from "react";
import { OfficeCommission } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// نموذج الإدخال لبيانات العمولة
const commissionSchema = z.object({
  city: z.string().min(2, { message: "يجب أن يكون اسم المدينة مكون من حرفين على الأقل" }),
  commissionRate: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0 && num <= 10;
    },
    { message: "يجب أن تكون نسبة العمولة رقماً موجباً بين 0 و 10" }
  )
});

type CommissionFormValues = z.infer<typeof commissionSchema>;

export default function OfficeCommissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commissions, setCommissions] = useState<OfficeCommission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      city: "",
      commissionRate: "",
    },
  });

  const loadCommissions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("/api/office-commissions");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "حدث خطأ أثناء تحميل بيانات العمولات");
      }
      
      const data = await response.json();
      setCommissions(data);
    } catch (error: any) {
      console.error("خطأ في تحميل بيانات العمولات:", error);
      setError(error.message || "حدث خطأ أثناء تحميل بيانات العمولات");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadCommissions();
  }, []);

  const onSubmit = async (values: CommissionFormValues) => {
    try {
      const response = await apiRequest("/api/office-commissions", "POST", values);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "حدث خطأ أثناء حفظ العمولة");
      }
      
      const data = await response.json();
      
      toast({
        title: "تم بنجاح",
        description: data.message || "تم تحديث عمولة المكتب للمدينة المحددة",
      });
      
      setIsDialogOpen(false);
      form.reset();
      loadCommissions();
      
    } catch (error: any) {
      console.error("خطأ في إضافة/تحديث العمولة:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ العمولة، يرجى المحاولة مرة أخرى",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/office-commissions/${id}`, "DELETE");
      
      toast({
        title: "تم بنجاح",
        description: "تم حذف عمولة المدينة",
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

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">إدارة عمولات المكتب حسب المدن</CardTitle>
        <CardDescription>
          تحديد نسبة العمولة التي يريد المكتب استلامها مقابل الحوالات القادمة من مدن مختلفة
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">جاري التحميل...</div>
        ) : error ? (
          <div className="text-destructive p-4">{error}</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المدينة</TableHead>
                  <TableHead>نسبة العمولة (%)</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      لا توجد عمولات مخصصة للمدن حتى الآن
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>{commission.city}</TableCell>
                      <TableCell>{commission.commissionRate}%</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(commission.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">إضافة عمولة لمدينة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rtl">
            <DialogHeader>
              <DialogTitle>تحديد عمولة لمدينة</DialogTitle>
              <DialogDescription>
                أدخل اسم المدينة ونسبة العمولة التي تريد تطبيقها على الحوالات
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم المدينة" {...field} />
                      </FormControl>
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
                        <Input 
                          placeholder="أدخل نسبة العمولة" 
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" className="mt-4">حفظ العمولة</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}