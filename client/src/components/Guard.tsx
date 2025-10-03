import { ReactNode, useEffect } from "react";
import { usePageRestriction } from "@/hooks/use-access-control";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface GuardProps {
  page: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Guard({ page, children, fallback }: GuardProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: restriction, isLoading, error } = usePageRestriction(page);

  // تسجيل للتأكد من عمل النظام
  console.log(`🛡️ Guard تحقق من الصفحة: ${page}`, {
    userId: user?.id,
    accountNumber: user?.accountNumber,
    isLoading,
    restriction,
    error
  });

  useEffect(() => {
    if (!isLoading && restriction?.isBlocked) {
      console.log(`🚫 تم حظر الوصول للصفحة: ${page}`, restriction);
      const reason = restriction.reason || "تم تقييد وصولك لهذه الصفحة";
      setLocation(`/blocked?reason=${encodeURIComponent(reason)}&page=${page}`);
    }
  }, [restriction, isLoading, setLocation, page]);

  // إذا لم يكن المستخدم مسجل دخول، لا نحتاج للتحقق من القيود
  if (!user) {
    return <>{children}</>;
  }

  // إذا كان هناك خطأ في التحقق من القيود، نعرض الصفحة (fail-safe)
  if (error) {
    console.error('خطأ في التحقق من قيود الوصول:', error);
    return <>{children}</>;
  }

  // أثناء التحميل
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>جاري التحقق من الصلاحيات...</span>
        </div>
      </div>
    );
  }

  // إذا كانت الصفحة محجوبة، سيتم إعادة التوجيه بواسطة useEffect
  if (restriction?.isBlocked) {
    return null;
  }

  // إذا لم تكن محجوبة، عرض المحتوى
  return <>{children}</>;
}