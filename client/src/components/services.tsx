import { Ticket, SendIcon, LineChartIcon, CreditCardIcon, ShieldIcon, SmartphoneIcon } from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: <Ticket className="h-8 w-8" />,
      title: "صرف العملات",
      description: "أفضل أسعار الصرف للعملات الأجنبية مع تحديثات فورية لأسعار السوق",
    },
    {
      icon: <SendIcon className="h-8 w-8" />,
      title: "تحويل الأموال",
      description: "خدمة تحويل أموال سريعة وآمنة إلى جميع أنحاء العالم بأسعار تنافسية",
    },
    {
      icon: <LineChartIcon className="h-8 w-8" />,
      title: "استشارات مالية",
      description: "نصائح مهنية حول أفضل الطرق للتعامل مع العملات وتحويلات الأموال",
    },
    {
      icon: <CreditCardIcon className="h-8 w-8" />,
      title: "بطاقات مدفوعة مسبقاً",
      description: "بطاقات متعددة العملات للسفر والتسوق بأمان في جميع أنحاء العالم",
    },
    {
      icon: <ShieldIcon className="h-8 w-8" />,
      title: "خزائن آمنة",
      description: "خدمة الخزائن الآمنة لحفظ العملات والمستندات المهمة بشكل آمن",
    },
    {
      icon: <SmartphoneIcon className="h-8 w-8" />,
      title: "خدمات إلكترونية",
      description: "منصة إلكترونية متكاملة لإجراء المعاملات المالية من أي مكان وأي وقت",
    },
  ];

  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-500 mb-2">خدماتنا</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            نقدم مجموعة متكاملة من الخدمات المالية والصرافة لتلبية احتياجاتك المختلفة بكفاءة وأمان
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-neutral-100 rounded-xl p-6 shadow-md hover:shadow-lg transition duration-300">
              <div className="text-primary text-3xl mb-4">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-neutral-500 mb-2">{service.title}</h3>
              <p className="text-neutral-400">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
