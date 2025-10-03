import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import OfficeCommissions from "@/components/dashboard/office-commissions";

export default function OfficeCommissionPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // حماية الصفحة - يجب أن يكون المستخدم من نوع مكتب صرافة
    if (user && user.type !== 'agent') {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  if (!user || user.type !== 'agent') {
    return null;
  }

  return (
    <div className="container mx-auto p-4 rtl">
      <h1 className="text-3xl font-bold mb-6">إدارة عمولات المكتب حسب المدن</h1>
      <div className="mb-6">
        <p className="text-muted-foreground mb-4">
          يمكنك تحديد نسب العمولة المختلفة حسب المدن التي تتعامل معها. سيتم تطبيق هذه النسب عند إرسال الحوالات من المدن المحددة.
        </p>
      </div>
      
      <OfficeCommissions />
      
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={() => setLocation('/dashboard')}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition-colors"
        >
          العودة للوحة التحكم
        </button>
      </div>
    </div>
  );
}