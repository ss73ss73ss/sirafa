// مكون بديل للإشعارات بدون استخدام toast
export const useCustomToast = () => {
  const showMessage = (message: string, isError: boolean = false) => {
    // استخدام console.log فقط لعرض الرسائل في وحدة التحكم
    console.log(`[إشعار] ${isError ? 'خطأ' : 'معلومات'}: ${message}`);
    
    // استخدام alert بدلاً من toast مؤقتًا للتغلب على مشكلة الرندر
    window.alert(message);
  };
  
  return {
    showMessage
  };
};