import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button-ar";

interface CurrencyRate {
  currency: string;
  code: string;
  buy: number;
  sell: number;
  change: number;
  lastUpdate: string;
}

export default function Rates() {
  const [rates, setRates] = useState<CurrencyRate[]>([
    {
      currency: "دولار أمريكي",
      code: "USD",
      buy: 3.750,
      sell: 3.760,
      change: 0.05,
      lastUpdate: "قبل ساعة واحدة",
    },
    {
      currency: "يورو",
      code: "EUR",
      buy: 4.123,
      sell: 4.135,
      change: -0.12,
      lastUpdate: "قبل ساعتين",
    },
    {
      currency: "جنيه إسترليني",
      code: "GBP",
      buy: 4.850,
      sell: 4.870,
      change: 0.08,
      lastUpdate: "قبل 30 دقيقة",
    },
    {
      currency: "ين ياباني",
      code: "JPY",
      buy: 0.0342,
      sell: 0.0348,
      change: 0.02,
      lastUpdate: "قبل 45 دقيقة",
    },
    {
      currency: "درهم إماراتي",
      code: "AED",
      buy: 1.020,
      sell: 1.025,
      change: 0.00,
      lastUpdate: "قبل 10 دقائق",
    },
  ]);

  // Update the timestamp
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <section id="rates" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-500 mb-2">أسعار العملات</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            أحدث أسعار العملات المحدثة باستمرار لضمان أفضل قيمة لمعاملاتك
          </p>
        </div>
        
        <div className="overflow-x-auto bg-neutral-100 rounded-xl shadow-md">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead>
              <tr className="bg-primary bg-opacity-5">
                <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-500">العملة</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-500">سعر الشراء</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-500">سعر البيع</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-500">التغيير</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-500">آخر تحديث</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rates.map((rate, index) => (
                <tr key={index} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="font-semibold text-neutral-500">{rate.currency}</span>
                      <span className="text-neutral-400 mr-2">{rate.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                    {rate.buy.toFixed(rate.buy < 1 ? 4 : 3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                    {rate.sell.toFixed(rate.sell < 1 ? 4 : 3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`${rate.change > 0 ? 'text-success' : rate.change < 0 ? 'text-error' : 'text-neutral-400'}`}>
                      {rate.change > 0 ? '+' : ''}{rate.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-400">{rate.lastUpdate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-neutral-400">
            آخر تحديث للأسعار: اليوم الساعة {currentTime}
          </p>
          <Button className="inline-block mt-4">
            عرض جميع العملات
          </Button>
        </div>
      </div>
    </section>
  );
}
