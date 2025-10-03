import { Link } from "wouter";
import { Button } from "@/components/ui/button-ar";
import { useAuth } from "@/hooks/use-auth";

interface HeroProps {
  onRegisterClick: () => void;
}

export default function Hero({ onRegisterClick }: HeroProps) {
  const { user } = useAuth();

  return (
    <section id="home" className="golden-bg text-white py-16 md:py-24 min-h-[70vh] flex items-center">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              خدمات صرافة موثوقة <br />لكل احتياجاتك المالية
            </h1>
            <p className="text-lg mb-6">
              نقدم أفضل أسعار الصرف وخدمات تحويل الأموال بشكل آمن وسريع
            </p>
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90">
                  <Link href="/dashboard">لوحة التحكم</Link>
                </Button>
              ) : (
                <Button 
                  size="lg"
                  onClick={onRegisterClick} 
                  className="bg-accent text-white hover:bg-accent/90"
                >
                  ابدأ الآن
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="bg-white text-primary hover:bg-neutral-100">
                <a href="#services">تعرف على خدماتنا</a>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1589758438368-0ad531db3366?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800" 
              alt="مكتب صرافة عصري" 
              className="rounded-lg shadow-xl w-full h-auto" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
