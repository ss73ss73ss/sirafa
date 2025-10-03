import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface BackToDashboardButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function BackToDashboardButton({ 
  className = "", 
  variant = "outline",
  size = "default"
}: BackToDashboardButtonProps) {
  return (
    <Link href="/dashboard">
      <Button 
        variant={variant} 
        size={size}
        className={`flex items-center gap-2 ${className}`}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="text-[#f3a212]">لوحة التحكم</span>
      </Button>
    </Link>
  );
}