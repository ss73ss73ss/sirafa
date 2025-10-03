import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button-ar";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  isLoggedIn: boolean;
}

export default function Navbar({ onLoginClick, onRegisterClick, isLoggedIn }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logoutMutation, user } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="elegant-navbar shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 10h10" />
            <path d="M7 14h10" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span className="text-white">التحويل الرقمي</span>
        </Link>
        
        <nav className="hidden md:flex space-x-1 space-x-reverse">
          <Link href="/" className="px-3 py-2 text-neutral-400 hover:text-primary transition">الرئيسية</Link>
          <a href="#services" className="px-3 py-2 text-neutral-400 hover:text-primary transition">خدماتنا</a>
          <a href="#about" className="px-3 py-2 text-neutral-400 hover:text-primary transition">من نحن</a>
          <a href="#contact" className="px-3 py-2 text-neutral-400 hover:text-primary transition">اتصل بنا</a>
        </nav>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          <ThemeToggle />
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">لوحة التحكم</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" onClick={onLoginClick} className="px-4">
                تسجيل الدخول
              </Button>
              <Button variant="secondary" onClick={onRegisterClick} className="hidden md:block">
                إنشاء حساب
              </Button>
            </>
          )}
          <button className="md:hidden text-neutral-500" onClick={toggleMobileMenu}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-2">
            <Link href="/" className="block py-2 text-neutral-400 hover:text-primary">الرئيسية</Link>
            <a href="#services" className="block py-2 text-neutral-400 hover:text-primary">خدماتنا</a>
            <a href="#about" className="block py-2 text-neutral-400 hover:text-primary">من نحن</a>
            <a href="#contact" className="block py-2 text-neutral-400 hover:text-primary">اتصل بنا</a>
            <div className="py-2 border-t mt-2 pt-2">
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
            </div>
            {!isLoggedIn && (
              <Button 
                onClick={onRegisterClick} 
                variant="secondary" 
                className="w-full mt-2"
              >
                إنشاء حساب
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
