import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrencyNoCommas, formatDateTimeWithWesternNumbers } from '@/lib/number-utils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  User, 
  Shield, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft,
  Wallet,
  DollarSign,
  Euro,
  PoundSterling,
  CircleDollarSign,
  Banknote
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// المكون الرئيسي للوحة التحكم
const UserDashboardPage = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // الاستعلام عن الرصيد
  const { data: balancesData, isLoading: isBalancesLoading } = useQuery({
    queryKey: ['/api/balance'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/balance');
        const data = await res.json();
        return data;
      } catch (error) {
        console.error('فشل في جلب بيانات الرصيد:', error);
        return { balances: {} };
      }
    }
  });

  // الاستعلام عن المعاملات الأخيرة
  const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/transactions');
        return await res.json();
      } catch (error) {
        console.error('فشل في جلب بيانات المعاملات:', error);
        return [];
      }
    }
  });

  // إعادة التوجيه إذا لم يكن المستخدم مسجل الدخول
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // تنسيق المبلغ والعملة
  const formatCurrency = (amount: string | number, currency: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${numAmount.toLocaleString('ar-LY')} ${currency}`;
  };

  // أيقونة العملة المناسبة
  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'USD':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'EUR':
        return <Euro className="h-5 w-5 text-blue-500" />;
      case 'GBP':
        return <PoundSterling className="h-5 w-5 text-purple-500" />;
      case 'LYD':
        return <Banknote className="h-5 w-5 text-teal-500" />;
      default:
        return <CircleDollarSign className="h-5 w-5 text-gray-500" />;
    }
  };

  // معالجة نوع المعاملة
  const getTransactionTypeDetails = (type: string) => {
    switch (type) {
      case 'deposit':
        return {
          label: 'إيداع',
          icon: <ArrowDownLeft className="h-4 w-4 text-green-500" />,
          color: 'text-green-600'
        };
      case 'withdraw':
        return {
          label: 'سحب',
          icon: <ArrowUpRight className="h-4 w-4 text-red-500" />,
          color: 'text-red-600'
        };
      case 'transfer_in':
        return {
          label: 'تحويل وارد',
          icon: <ArrowDownLeft className="h-4 w-4 text-blue-500" />,
          color: 'text-blue-600'
        };
      case 'transfer_out':
        return {
          label: 'تحويل صادر',
          icon: <ArrowUpRight className="h-4 w-4 text-orange-500" />,
          color: 'text-orange-600'
        };
      default:
        return {
          label: 'معاملة',
          icon: <CreditCard className="h-4 w-4 text-gray-500" />,
          color: 'text-gray-600'
        };
    }
  };

  return (
    <div className="container max-w-6xl py-10">
      <h1 className="text-2xl font-bold mb-6">لوحة التحكم الشخصية</h1>
      
      {/* قسم معلومات المستخدم */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">معلومات الحساب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">الاسم الكامل</h3>
              <p className="font-medium">{user.fullName}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">البريد الإلكتروني</h3>
              <p className="font-medium">{user.email}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">رقم الحساب</h3>
              <p className="font-medium">{user.accountNumber || 'غير متوفر'}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">نوع الحساب</h3>
              <div className="flex items-center gap-1">
                <p className="font-medium">{user.type === 'agent' ? 'مكتب صرافة' : 'حساب شخصي'}</p>
                {user.verified && (
                  <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-xs">
                    موثق
                  </Badge>
                )}
              </div>
            </div>
            
            {user.type === 'agent' && (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">المدينة</h3>
                  <p className="font-medium">{user.city || 'غير محدد'}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">نسبة العمولة</h3>
                  <p className="font-medium">{user.commissionRate ? `${user.commissionRate}%` : 'غير محدد'}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* قسم الأرصدة */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">الأرصدة</CardTitle>
        </CardHeader>
        <CardContent>
          {isBalancesLoading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">جاري تحميل البيانات...</div>
            </div>
          ) : balancesData && Object.keys(balancesData.balances).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(balancesData.balances).map(([currency, amount]) => (
                <div key={currency} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">{currency}</span>
                    {getCurrencyIcon(currency)}
                  </div>
                  <p className="text-2xl font-bold">{formatCurrencyNoCommas(Number(amount), currency)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center">
              <p className="text-gray-500">لا توجد أرصدة متوفرة</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/balance')}
          >
            عرض التفاصيل والمعاملات
          </Button>
        </CardFooter>
      </Card>
      
      {/* قسم آخر المعاملات */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">آخر المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          {isTransactionsLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">جاري تحميل البيانات...</div>
            </div>
          ) : transactionsData && transactionsData.length > 0 ? (
            <div className="space-y-4">
              {transactionsData.slice(0, 5).map((transaction: any) => {
                const { label, icon, color } = getTransactionTypeDetails(transaction.type);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {icon}
                      </div>
                      <div>
                        <p className={`font-medium ${color}`}>{label}</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTimeWithWesternNumbers(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{formatCurrencyNoCommas(Number(transaction.amount), transaction.currency)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-gray-500">لا توجد معاملات سابقة</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/transfers')}
          >
            عرض جميع المعاملات
          </Button>
        </CardFooter>
      </Card>
      
      {/* قسم الإجراءات السريعة */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">الإجراءات السريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2" 
            onClick={() => navigate('/transfers')}
          >
            <ArrowUpRight className="h-6 w-6" />
            <span>التحويلات</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2" 
            onClick={() => navigate('/market')}
          >
            <BarChart3 className="h-6 w-6" />
            <span>سوق العملات</span>
          </Button>
          
          {!user.verified && (
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2" 
              onClick={() => navigate('/verification')}
            >
              <Shield className="h-6 w-6" />
              <span>توثيق الحساب</span>
            </Button>
          )}
          
          {user.type !== 'agent' && (
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2" 
              onClick={() => navigate('/upgrade-request')}
            >
              <Wallet className="h-6 w-6" />
              <span>طلب ترقية الحساب</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;