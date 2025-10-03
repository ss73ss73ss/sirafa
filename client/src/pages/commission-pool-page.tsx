import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DollarSign, ArrowDownCircle, Filter, Download, ArrowLeft } from "lucide-react";
import { convertToWesternNumerals } from "@/lib/number-utils";
import { BackToDashboardButton } from "@/components/ui/back-to-dashboard-button";

const withdrawalSchema = z.object({
  currencyCode: z.string().min(1, "يرجى اختيار العملة"),
  amount: z.string().min(1, "يرجى إدخال المبلغ").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "يجب أن يكون المبلغ رقماً موجباً"),
  description: z.string().min(1, "يرجى إدخال وصف العملية"),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface CommissionPoolTransaction {
  id: number;
  sourceType: string;
  sourceId: number | null;
  sourceName: string | null;
  currencyCode: string;
  amount: string;
  transactionType: string;
  relatedTransactionId: number | null;
  description: string | null;
  createdAt: string;
}

const currencies = ["LYD", "USD", "EUR", "TRY", "AED", "EGP", "TND", "GBP"];

export default function CommissionPoolPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    currencyCode: "all",
    sourceType: "all",
  });
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

  const withdrawForm = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      currencyCode: "",
      amount: "",
      description: "",
    },
  });

  // جلب أرصدة حساب العمولات
  const { data: balances = {}, isLoading: balancesLoading } = useQuery<{ [currency: string]: string }>({
    queryKey: ["/api/commission-pool/balance"],
    queryFn: async () => {
      const response = await apiRequest("/api/commission-pool/balance", "GET");
      return await response.json();
    },
  });

  // جلب معاملات حساب العمولات
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<CommissionPoolTransaction[]>({
    queryKey: ["/api/commission-pool/transactions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.currencyCode && filters.currencyCode !== "all") {
        params.append("currencyCode", filters.currencyCode);
      }
      if (filters.sourceType && filters.sourceType !== "all") {
        params.append("sourceType", filters.sourceType);
      }
      
      const response = await apiRequest(`/api/commission-pool/transactions?${params}`, "GET");
      return await response.json();
    },
  });

  // عملية السحب من حساب العمولات
  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      console.log("بيانات السحب المرسلة:", data);
      const response = await apiRequest("/api/commission-pool/withdraw", "POST", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم السحب بنجاح",
        description: "تم سحب المبلغ من حساب العمولات",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/commission-pool/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commission-pool/transactions"] });
      setIsWithdrawDialogOpen(false);
      withdrawForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في عملية السحب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatAmount = (amount: string, currency: string) => {
    return `${convertToWesternNumerals(parseFloat(amount).toFixed(2))} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionTypeColor = (type: string) => {
    return type === "credit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getTransactionTypeText = (type: string) => {
    return type === "credit" ? "إيداع" : "سحب";
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* شريط التنقل */}
      <div className="flex items-center gap-4 mb-6">
        <BackToDashboardButton variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800" />
        <div className="h-6 w-px bg-slate-300" />
        <h1 className="text-2xl font-bold text-[#f3a212] text-center">حساب تجميع العمولات</h1>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#f3a212] text-center">إدارة ومراقبة جميع العمولات المستلمة من النظام</p>
        </div>
        
        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              سحب من الحساب
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>سحب من حساب العمولات</DialogTitle>
            </DialogHeader>
            <Form {...withdrawForm}>
              <form onSubmit={withdrawForm.handleSubmit((data) => withdrawMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={withdrawForm.control}
                  name="currencyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العملة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر العملة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={withdrawForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المبلغ</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="أدخل المبلغ" 
                          type="number" 
                          step="0.01" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={withdrawForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف العملية</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أدخل وصف العملية" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={withdrawMutation.isPending}
                >
                  {withdrawMutation.isPending ? "جارٍ السحب..." : "تأكيد السحب"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      {/* عرض أرصدة العمولات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {balancesLoading ? (
          <div className="col-span-full text-center py-8">جارٍ تحميل الأرصدة...</div>
        ) : Object.keys(balances).length > 0 ? (
          Object.entries(balances).map(([currency, balance]) => (
            <Card key={currency} className="rounded-lg border text-card-foreground shadow-sm text-center pl-[50px] pr-[50px] bg-[#f3a212]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{currency}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(balance, currency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  الرصيد الحالي
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            لا توجد أرصدة متاحة
          </div>
        )}
      </div>
      {/* فلاتر البحث */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر البحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency-filter">العملة</Label>
              <Select
                value={filters.currencyCode}
                onValueChange={(value) => setFilters({ ...filters, currencyCode: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع العملات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العملات</SelectItem>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source-filter">نوع المصدر</Label>
              <Select
                value={filters.sourceType}
                onValueChange={(value) => setFilters({ ...filters, sourceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع المصادر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المصادر</SelectItem>
                  <SelectItem value="agent">وكيل</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="system">النظام</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* جدول المعاملات */}
      <Card>
        <CardHeader>
          <CardTitle>سجل معاملات العمولات</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 text-center">
          {transactionsLoading ? (
            <div className="text-center py-8">جارٍ تحميل المعاملات...</div>
          ) : transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">رقم العملية</TableHead>
                  <TableHead className="text-center">المرسل</TableHead>
                  <TableHead className="text-center">نوع العملية</TableHead>
                  <TableHead className="text-center">العملة</TableHead>
                  <TableHead className="text-center">المبلغ</TableHead>
                  <TableHead className="text-center">الوصف</TableHead>
                  <TableHead className="text-center">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>#{convertToWesternNumerals(transaction.id)}</TableCell>
                    <TableCell>
                      {transaction.sourceName || `${transaction.sourceType} #${transaction.sourceId}`}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                        {getTransactionTypeText(transaction.transactionType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.currencyCode}</TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(transaction.amount, transaction.currencyCode)}
                    </TableCell>
                    <TableCell>{transaction.description || "-"}</TableCell>
                    <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد معاملات متاحة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}