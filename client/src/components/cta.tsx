import { Link } from "wouter";
import { Button } from "@/components/ui/button-ar";
import { useAuth } from "@/hooks/use-auth";

interface CTAProps {
  onRegisterClick: () => void;
}

export default function CTA({ onRegisterClick }: CTAProps) {
  const { user } = useAuth();

  return (
    <section className="py-16 bg-primary">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-2/3 mb-8 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ابدأ رحلتك المالية الآن
            </h2>
            <p className="text-white text-opacity-90 text-lg mb-6">
              انضم إلى آلاف العملاء الذين يثقون بنا لإدارة معاملاتهم المالية. سجل الآن واستفد من خدماتنا المتميزة.
            </p>
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Button asChild variant="secondary" className="bg-white text-primary hover:bg-neutral-100">
                  <Link href="/dashboard">الانتقال إلى لوحة التحكم</Link>
                </Button>
              ) : (
                <Button
                  onClick={onRegisterClick}
                  className="bg-white text-primary hover:bg-neutral-100"
                >
                  إنشاء حساب مجاني
      </Button>
    )}
    <Button asChild variant="outline" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-10 px-4 py-2 border border-white text-white hover:bg-white/10 bg-[#2094f3]">
                <a href="#contact">تواصل معنا</a>
      </Button>  
            </div>
          </div>
         <div className="md:w-1/3 flex justify-center">
            {/* تم إزالة الصورة بناءً على طلب المستخدم */}
          </div>
        </div>
      </div>
    </section>
  );
}
