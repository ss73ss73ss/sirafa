import { Transaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { formatCurrencyNoCommas, formatDateWithWesternNumbers, formatTimeWithWesternNumbers } from "@/lib/number-utils";
import { ArrowDown, ArrowUp, Repeat } from "lucide-react";

interface TransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function Transactions({ transactions, isLoading }: TransactionsProps) {
  // Helper function to get transaction icon and color
  const getTransactionDetails = (type: string) => {
    switch (type) {
      case "deposit":
        return {
          icon: <ArrowDown className="h-4 w-4" />,
          color: "bg-green-100 text-green-600",
          label: "إيداع"
        };
      case "withdrawal":
        return {
          icon: <ArrowUp className="h-4 w-4" />,
          color: "bg-red-100 text-red-600",
          label: "سحب"
        };
      case "exchange":
        return {
          icon: <Repeat className="h-4 w-4" />,
          color: "bg-blue-100 text-blue-600",
          label: "تحويل"
        };
      default:
        return {
          icon: <Repeat className="h-4 w-4" />,
          color: "bg-neutral-100 text-neutral-600",
          label: "معاملة"
        };
    }
  };

  // Sort transactions by date (most recent first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  // Take only the most recent 5 transactions
  const recentTransactions = sortedTransactions.slice(0, 5);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="px-6 pt-6 pb-4 bg-[#FFD300]">
        <CardTitle className="text-lg font-bold text-black text-center">آخر المعاملات</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6" style={{ backgroundColor: '#f5f5f6', color: '#09090b' }}>
        {isLoading ? (
          // Skeleton loading state
          (<div className="space-y-4">
            {Array(5).fill(0).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-neutral-100">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>)
        ) : recentTransactions.length === 0 ? (
          // No transactions state
          (<div className="text-center py-8">
            <p className="text-neutral-500">لا توجد معاملات حتى الآن</p>
          </div>)
        ) : (
          // Actual transactions list
          (<div className="space-y-4">
            {recentTransactions.map((transaction) => {
              const { icon, color, label } = getTransactionDetails(transaction.type);
              
              return (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`h-8 w-8 rounded-full ${color} flex items-center justify-center`}>
                      {icon}
                    </div>
                    <div>
                      <p className="font-medium text-[#14161a]">{label}</p>
                      <div className="flex items-center text-xs text-neutral-500 mt-1">
                        <span className="text-[#14161a]">{transaction.date ? formatDateWithWesternNumbers(transaction.date) : ''}</span>
                        <span className="mx-1 text-[#14161a]">•</span>
                        <span className="text-[#14161a]">{transaction.date ? formatTimeWithWesternNumbers(transaction.date) : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#14161a]">
                      {transaction.type === "deposit" ? "+" : transaction.type === "withdrawal" ? "-" : ""}
                      {formatCurrencyNoCommas(Number(transaction.amount), transaction.currency)}
                    </p>
                    {transaction.description && (
                      <p className="text-xs mt-1 text-[#14161a]">{transaction.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>)
        )}
      </CardContent>
    </Card>
  );
}