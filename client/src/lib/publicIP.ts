import { useState, useEffect } from 'react';

// الواجهة للنتيجة
export interface PublicIPResult {
  ip: string | null;
  source: string;
  timestamp: number;
  error?: string;
}

// الواجهة لخدمة IP
interface IPService {
  name: string;
  url: string;
  extractIP: (response: any) => string;
  timeout: number;
}

// قائمة خدمات IP المتاحة مع fallbacks
const IP_SERVICES: IPService[] = [
  {
    name: 'ipify',
    url: 'https://api.ipify.org?format=json',
    extractIP: (data) => data.ip,
    timeout: 5000
  },
  {
    name: 'ipapi',
    url: 'https://ipapi.co/json/',
    extractIP: (data) => data.ip,
    timeout: 5000
  },
  {
    name: 'ifconfig',
    url: 'https://ifconfig.co/json',
    extractIP: (data) => data.ip,
    timeout: 5000
  },
  {
    name: 'ipinfo',
    url: 'https://ipinfo.io/json',
    extractIP: (data) => data.ip,
    timeout: 5000
  }
];

// مفاتيح التخزين المحلي
const CACHE_KEY = 'public_ip_cache';
const CACHE_DURATION = 20 * 60 * 1000; // 20 دقيقة

// دالة لجلب IP من خدمة واحدة مع timeout
async function fetchIPFromService(service: IPService): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), service.timeout);

  try {
    const response = await fetch(service.url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const ip = service.extractIP(data);

    if (!ip || typeof ip !== 'string') {
      throw new Error('Invalid IP format received');
    }

    // التحقق من صحة تنسيق IP
    if (!isValidIP(ip)) {
      throw new Error(`Invalid IP address: ${ip}`);
    }

    return ip;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout: ${service.name} took too long to respond`);
    }
    throw error;
  }
}

// دالة للتحقق من صحة IP
function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// دالة لحفظ في التخزين المحلي
function cacheResult(result: PublicIPResult): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
  } catch (error) {
    console.warn('Failed to cache IP result:', error);
  }
}

// دالة لاسترجاع من التخزين المحلي
function getCachedResult(): PublicIPResult | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const result: PublicIPResult = JSON.parse(cached);
    const now = Date.now();

    // التحقق من انتهاء صلاحية التخزين المؤقت
    if (now - result.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return result;
  } catch (error) {
    console.warn('Failed to read cached IP result:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

// دالة رئيسية للحصول على IP العام
export async function getPublicIP(forceRefresh = false): Promise<PublicIPResult> {
  // التحقق من التخزين المؤقت أولاً (إلا إذا كان forceRefresh مفعل)
  if (!forceRefresh) {
    const cached = getCachedResult();
    if (cached) {
      return cached;
    }
  }

  let lastError: Error | null = null;

  // جرب كل خدمة بالتسلسل
  for (const service of IP_SERVICES) {
    try {
      console.log(`🌐 محاولة الحصول على IP من ${service.name}...`);
      const ip = await fetchIPFromService(service);
      
      const result: PublicIPResult = {
        ip,
        source: service.name,
        timestamp: Date.now()
      };

      // حفظ النتيجة في التخزين المؤقت
      cacheResult(result);
      
      console.log(`✅ تم الحصول على IP بنجاح من ${service.name}: ${ip}`);
      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`❌ فشل الحصول على IP من ${service.name}:`, lastError.message);
      
      // انتظار قصير قبل المحاولة التالية
      if (service !== IP_SERVICES[IP_SERVICES.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // إذا فشلت كل الخدمات
  const errorResult: PublicIPResult = {
    ip: null,
    source: 'none',
    timestamp: Date.now(),
    error: lastError?.message || 'فشل في الحصول على IP من جميع الخدمات'
  };

  console.error('❌ فشل في الحصول على IP من جميع الخدمات');
  return errorResult;
}

// React Hook لاستخدام IP العام
export function usePublicIP(autoFetch = true) {
  const [result, setResult] = useState<PublicIPResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchIP = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const ipResult = await getPublicIP(forceRefresh);
      setResult(ipResult);
    } catch (error) {
      console.error('Error in usePublicIP:', error);
      setResult({
        ip: null,
        source: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // جلب IP تلقائياً عند التحميل
  useEffect(() => {
    if (autoFetch) {
      // التحقق من التخزين المؤقت أولاً
      const cached = getCachedResult();
      if (cached) {
        setResult(cached);
      } else {
        fetchIP();
      }
    }
  }, [autoFetch]);

  return {
    ip: result?.ip || null,
    source: result?.source || null,
    error: result?.error || null,
    loading,
    timestamp: result?.timestamp || null,
    isStale: result ? (Date.now() - result.timestamp > CACHE_DURATION) : false,
    fetchIP,
    result
  };
}

// دالة مساعدة للحصول على IP فقط (مبسطة)
export async function getIP(): Promise<string | null> {
  try {
    const result = await getPublicIP();
    return result.ip;
  } catch (error) {
    console.error('Error getting IP:', error);
    return null;
  }
}

// دالة لمسح التخزين المؤقت
export function clearIPCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('✅ تم مسح تخزين IP المؤقت');
  } catch (error) {
    console.warn('Failed to clear IP cache:', error);
  }
}

// دالة للحصول على معلومات التخزين المؤقت
export function getCacheInfo(): { hasCache: boolean; age?: number; isExpired?: boolean } {
  const cached = getCachedResult();
  if (!cached) {
    return { hasCache: false };
  }

  const age = Date.now() - cached.timestamp;
  const isExpired = age > CACHE_DURATION;

  return {
    hasCache: true,
    age,
    isExpired
  };
}