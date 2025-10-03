import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileSidebarTriggerProps {
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
}

export function MobileSidebarTrigger({ onClick, isOpen = false, className }: MobileSidebarTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "fixed top-4 right-4 z-[60] h-12 w-12 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 ease-in-out",
        className
      )}
      onClick={onClick}
    >
      {isOpen ? (
        <X className="h-6 w-6 text-gray-700" />
      ) : (
        <Menu className="h-6 w-6 text-gray-700" />
      )}
      <span className="sr-only">{isOpen ? "إغلاق القائمة" : "فتح القائمة"}</span>
    </Button>
  );
}