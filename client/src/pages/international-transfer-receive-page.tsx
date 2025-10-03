import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePageRestriction } from "@/hooks/use-access-control";
import { Link } from "wouter";
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Receipt, CheckCircle, Search, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TransferDetails {
  id: number;
  senderAgentId: number;
  senderName: string;
  currencyCode: string;
  amountOriginal: number;
  commissionSystem: number;
  commissionRecipient: number;
  amountPending: number;
  transferCode: string;
  note?: string;
  createdAt: string;
}

export default function InternationalTransferReceivePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // فحص القيود للصفحة
  const { data: restrictionData, isLoading: isCheckingRestriction } = usePageRestriction('international_transfers');

  const [transferCode, setTransferCode] = useState("");
  const [transferDetails, setTransferDetails] = useState<TransferDetails | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // البحث عن التحويل
  const searchTransferMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("/api/international-transfer/search", "POST", { transferCode: code });
      return await response.json();
    },
    onSuccess: (data: TransferDetails) => {
      setTransferDetails(data);
      toast({
        title: "تم العثور على الحوالة",
        description: `حوالة بمبلغ ${data.amountPending} ${data.currencyCode}`,
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "لم يتم العثور على الحوالة",
        description: error.message,
        variant: "destructive"
      });
      setTransferDetails(null);
    }
  });

  // تأكيد استلام الحوالة
  const confirmReceiveMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("/api/international-transfer/receive", "POST", { transferCode: code });
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "تم استلام الحوالة بنجاح",
        description: `تم إضافة ${result.amountReceived} ${result.currencyCode} إلى رصيدك`,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      setTransferDetails(null);
      setTransferCode("");
      setShowConfirmation(false);
    },
    onError: (error: any) => {
      toast({
        title: "فشل في استلام الحوالة",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSearchTransfer = () => {
    if (!transferCode.trim()) {
      toast({
        title: "رمز التحويل مطلوب",
        description: "يرجى إدخال رمز التحويل للبحث",
        variant: "destructive"
      });
      return;
    }
    searchTransferMutation.mutate(transferCode);
  };

  const handleConfirmReceive = () => {
    if (!transferDetails) return;
    confirmReceiveMutation.mutate(transferDetails.transferCode);
  };

  const currencySymbols: Record<string, string> = {
    "USD": "$",
    "EUR": "€",
    "LYD": "د.ل",
    "TRY": "₺",
    "AED": "د.إ",
    "EGP": "ج.م",
    "TND": "د.ت",
    "GBP": "£"
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // فحص القيود أولاً
  if (isCheckingRestriction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (restrictionData?.isBlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">تم تقييد الوصول</CardTitle>
            <CardDescription>لا يمكنك الوصول إلى صفحة التحويلات الدولية</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {restrictionData.reason && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">السبب:</p>
                <p className="font-medium">{restrictionData.reason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الإدارة
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard" className="w-full">
              <Button className="w-full" variant="outline">
                العودة للوحة التحكم
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">استلام حوالة دولية</h1>
        <p className="text-muted-foreground">
          أدخل رمز التحويل لاستلام الحوالة الدولية
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* نموذج البحث */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              البحث عن الحوالة
            </CardTitle>
            <CardDescription>
              أدخل رمز التحويل للبحث عن الحوالة المطلوب استلامها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="transferCode">رمز التحويل</Label>
              <Input
                id="transferCode"
                type="text"
                placeholder="أدخل رمز التحويل (مثال: INT1234567890)"
                value={transferCode}
                onChange={(e) => setTransferCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchTransfer()}
              />
            </div>

            <Button
              onClick={handleSearchTransfer}
              disabled={searchTransferMutation.isPending}
              className="w-full"
            >
              {searchTransferMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              البحث عن الحوالة
            </Button>

            {/* زر الاستلام السريع للمدراء */}
            {user?.type === 'admin' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-800">استلام سريع للمدراء</h3>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    مدير
                  </span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  استخدم الرمز التالي للاختبار السريع
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-blue-300 text-blue-800 hover:bg-blue-100"
                  onClick={() => setTransferCode("INT1751194000000")}
                >
                  تجربة رمز: INT1751194000000
                </Button>
              </div>
            )}

            {/* زر الاستلام السريع للوكلاء */}
            {user?.type === 'agent' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-green-800">استلام سريع للوكلاء</h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    وكيل
                  </span>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  استخدم رمز المستلم التالي للاختبار السريع
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-green-300 text-green-800 hover:bg-green-100"
                  onClick={() => setTransferCode("123456")}
                >
                  تجربة رمز المستلم: 123456
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* عرض تفاصيل الحوالة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              تفاصيل الحوالة
            </CardTitle>
            <CardDescription>
              مراجعة تفاصيل الحوالة قبل الاستلام
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transferDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رمز التحويل:</span>
                    <span className="font-mono">{transferDetails.transferCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المرسل:</span>
                    <span>{transferDetails.senderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ الأصلي:</span>
                    <span>
                      {transferDetails.amountOriginal} {currencySymbols[transferDetails.currencyCode]}
                    </span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>عمولة النظام:</span>
                    <span>
                      -{transferDetails.commissionSystem} {currencySymbols[transferDetails.currencyCode]}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>عمولة المكتب:</span>
                    <span>
                      -{transferDetails.commissionRecipient} {currencySymbols[transferDetails.currencyCode]}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600 font-bold border-t pt-2">
                    <span>المبلغ المستلم:</span>
                    <span>
                      {transferDetails.amountPending} {currencySymbols[transferDetails.currencyCode]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                    <span>{formatDate(transferDetails.createdAt)}</span>
                  </div>
                  {transferDetails.note && (
                    <div className="border-t pt-2">
                      <span className="text-muted-foreground text-xs">ملاحظة:</span>
                      <p className="text-sm mt-1">{transferDetails.note}</p>
                    </div>
                  )}
                </div>

                <Alert>
                  <Download className="h-4 w-4" />
                  <AlertDescription>
                    سيتم إضافة {transferDetails.amountPending} {currencySymbols[transferDetails.currencyCode]} إلى رصيدك عند تأكيد الاستلام
                  </AlertDescription>
                </Alert>

                {!showConfirmation ? (
                  <Button
                    onClick={() => setShowConfirmation(true)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    استلام الحوالة
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Alert className="border-yellow-500 bg-yellow-50">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="font-semibold">
                        هل أنت متأكد من استلام هذه الحوالة؟
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfirmReceive}
                        disabled={confirmReceiveMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {confirmReceiveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        تأكيد الاستلام
                      </Button>
                      <Button
                        onClick={() => setShowConfirmation(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>أدخل رمز التحويل للبحث عن الحوالة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}