import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden golden-bg dir-rtl relative">
      {/* استخدام المكون المنفصل للقائمة الجانبية */}
      <Sidebar />

      {/* المحتوى الرئيسي */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* محتوى الصفحة */}
        <main className="flex-1 overflow-y-auto golden-bg px-0.5 sm:px-0 py-0.5 sm:py-0">
          <div className="min-h-full p-0.5 sm:p-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}