import { toast } from "@/hooks/use-toast";

// دالة مساعدة لعرض رسائل تنبيه بأمان
export function showToast(
  message: string, 
  type: "default" | "destructive" = "default"
) {
  console.log(`[Toast] ${type}: ${message}`);
  
  toast({
    variant: type,
    title: message,
  });
}