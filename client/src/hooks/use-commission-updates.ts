import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

/**
 * Hook لمراقبة تحديثات نسب العمولة وتطبيقها على النظام كله
 */
export function useCommissionUpdates() {
  useEffect(() => {
    const handleCommissionUpdate = (event: CustomEvent) => {
      console.log('🔄 تم تحديث نسب العمولة، جاري تحديث جميع الصفحات...');
      
      // تحديث جميع cache الصفحات المتعلقة بالعمولات
      queryClient.invalidateQueries({ queryKey: ['/api/commission-rates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inter-office-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agent-commission-rate'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calculate-receiver-commission'] });
      
      // إعادة جلب البيانات فوراً
      queryClient.refetchQueries({ queryKey: ['/api/commission-rates'] });
    };

    // إضافة مستمع للحدث
    window.addEventListener('commissionUpdate', handleCommissionUpdate as EventListener);

    // تنظيف عند الإزالة
    return () => {
      window.removeEventListener('commissionUpdate', handleCommissionUpdate as EventListener);
    };
  }, []);
}

/**
 * دالة لإرسال إشعار تحديث العمولة لجميع الصفحات
 */
export function notifyCommissionUpdate() {
  const event = new CustomEvent('commissionUpdate', {
    detail: { timestamp: Date.now() }
  });
  
  window.dispatchEvent(event);
  console.log('📡 تم إرسال إشعار تحديث العمولة لجميع الصفحات');
}