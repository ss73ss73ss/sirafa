// أداة تشخيص بيانات المستخدم
import { useEffect } from 'react';

export function useDebugUser() {
  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem("user");
      const authToken = localStorage.getItem("auth_token");
      
      console.log("=========== معلومات تشخيص المستخدم ===========");
      console.log("بيانات المستخدم من localStorage:", userDataStr);
      
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log("بيانات المستخدم المحولة:", userData);
        console.log("نوع بيانات المستخدم:", typeof userData);
        console.log("هل userData كائن؟", userData instanceof Object);
        console.log("المفاتيح الموجودة:", Object.keys(userData));
      } else {
        console.log("لا توجد بيانات مستخدم في localStorage");
      }
      
      console.log("رمز المصادقة موجود؟", !!authToken);
      if (authToken) {
        console.log("جزء من رمز المصادقة:", authToken.substring(0, 15) + "...");
      }
      
      console.log("==============================================");
    } catch (error) {
      console.error("خطأ في تشخيص بيانات المستخدم:", error);
    }
  }, []);
  
  return null;
}