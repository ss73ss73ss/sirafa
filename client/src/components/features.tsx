import { Check, Shield, Zap, Headphones } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Check className="text-primary" />,
      title: "أسعار منافسة",
      description: "نقدم أفضل أسعار الصرف في السوق مع تحديثات فورية ومستمرة.",
    },
    {
      icon: <Shield className="text-primary" />,
      title: "أمان وموثوقية",
      description: "خدماتنا مؤمنة بالكامل ونتبع أعلى معايير الأمان في جميع المعاملات.",
    },
    {
      icon: <Zap className="text-primary" />,
      title: "سرعة في التنفيذ",
      description: "نضمن إتمام جميع المعاملات والتحويلات في أسرع وقت ممكن.",
    },
    {
      icon: <Headphones className="text-primary" />,
      title: "دعم متواصل",
      description: "فريق متخصص لمساعدتك في أي وقت والإجابة على استفساراتك.",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-neutral-100 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <img 
              src="https://pixabay.com/get/g1384bd5ef17f624929b6efeb3fe578125a7d703cfbe12a3652b2c002c3f9e6403f534773a3589d6a42b8601b2bca56f96061c31af7ab68842cf56cf64fff694f_1280.jpg" 
              alt="عمليات مالية رقمية" 
              className="rounded-xl shadow-lg w-full h-auto" 
            />
          </div>
          
          <div className="md:w-1/2 md:pr-12">
            <h2 id="about" className="text-3xl font-bold text-neutral-500 mb-4">
              لماذا تختار صرافة الخليج؟
            </h2>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 ml-4 bg-primary bg-opacity-10 p-3 rounded-full">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-500 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
