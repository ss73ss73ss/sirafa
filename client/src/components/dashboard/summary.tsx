import { Transaction } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, Repeat, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/number-utils";

interface SummaryProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function Summary({ transactions, isLoading }: SummaryProps) {
  // Calculate summary values
  const totalDeposits = transactions
    .filter(t => t.type === "deposit")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalWithdrawals = transactions
    .filter(t => t.type === "withdrawal")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalExchanges = transactions
    .filter(t => t.type === "exchange")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalTransactions = transactions.length;

  // Summary items
  const summaryItems = [
    {
      title: "الإيداعات",
      value: totalDeposits,
      icon: <ArrowDown className="h-5 w-5 text-green-500" />,
      color: "bg-green-100",
      textColor: "text-green-700"
    },
    {
      title: "المسحوبات",
      value: totalWithdrawals,
      icon: <ArrowUp className="h-5 w-5 text-red-500" />,
      color: "bg-red-100",
      textColor: "text-red-700"
    },
    {
      title: "العمليات",
      value: totalExchanges,
      icon: <Repeat className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-100",
      textColor: "text-blue-700"
    },
    {
      title: "عدد المعاملات",
      value: totalTransactions,
      icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
      color: "bg-purple-100",
      textColor: "text-purple-700",
      formatter: (value: number) => value.toString() // Don't format as currency
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {isLoading ? (
        // Skeleton loading state
        Array(4).fill(0).map((_, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        // Actual summary cards
        summaryItems.map((item, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">{item.title}</p>
                  <p className={`text-lg font-bold ${item.textColor}`}>
                    {item.formatter 
                      ? item.formatter(item.value) 
                      : formatNumber(item.value)
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}