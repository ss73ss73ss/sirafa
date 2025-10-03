import { useEffect } from "react";
import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Services from "@/components/services";
import Features from "@/components/features";
import Rates from "@/components/rates";
import Testimonials from "@/components/testimonials";
import CTA from "@/components/cta";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Update document title
  useEffect(() => {
    document.title = "صرافة الخليج - خدمات الصرافة المالية";
  }, []);

  const openLoginModal = () => {
    setLocation("/auth");
  };

  const openRegisterModal = () => {
    setLocation("/auth");
  };

  return (
    <div className="golden-page-bg">
      <Navbar 
        onLoginClick={openLoginModal} 
        onRegisterClick={openRegisterModal}
        isLoggedIn={!!user}
      />
      <Hero onRegisterClick={openRegisterModal} />
      <Services />
      <Features />
      <Rates />
      <Testimonials />
      <CTA onRegisterClick={openRegisterModal} />
      <Footer />
    </div>
  );
}
