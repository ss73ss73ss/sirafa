import { Star, StarHalf } from "lucide-react";

interface Testimonial {
  stars: number;
  content: string;
  avatar: string;
  name: string;
  job: string;
}

export default function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      stars: 5,
      content: "أسعار صرف ممتازة وخدمة عملاء محترفة. استفدت كثيراً من خدماتهم في تحويلاتي المالية المتكررة للخارج.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      name: "محمد العلي",
      job: "رجل أعمال",
    },
    {
      stars: 4.5,
      content: "أستخدم خدماتهم بشكل منتظم للتحويلات العائلية، والخدمة سريعة جداً والموظفون ودودون ومتعاونون.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      name: "سارة الأحمد",
      job: "مدرسة",
    },
    {
      stars: 5,
      content: "المنصة الإلكترونية سهلة الاستخدام ومريحة جداً. أقوم بجميع معاملاتي من خلالها دون الحاجة لزيارة الفرع.",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      name: "خالد النعيمي",
      job: "مهندس برمجيات",
    }
  ];

  // Helper function to render stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-accent text-accent" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="fill-accent text-accent" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-neutral-300" />);
    }

    return stars;
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-500 mb-2">ماذا يقول عملاؤنا</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            نفخر بتقديم أفضل خدمة لعملائنا ونسعد بآرائهم حول تجربتهم معنا
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-neutral-100 rounded-xl p-6 shadow-md relative">
              <div className="text-primary text-3xl absolute top-6 right-6 opacity-20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              
              <div className="mb-4 relative z-10">
                <div className="flex space-x-1 space-x-reverse">
                  {renderStars(testimonial.stars)}
                </div>
              </div>
              
              <p className="text-neutral-500 mb-6 relative z-10">"{testimonial.content}"</p>
              
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full ml-4 bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-neutral-500">{testimonial.name}</p>
                  <p className="text-sm text-neutral-400">{testimonial.job}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
