import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getIP } from "./publicIP";

// JWT token key in localStorage - same as in useAuth
const TOKEN_KEY = "auth_token";

// Cache for client IP to avoid repeated API calls
let cachedClientIP: string | null = null;
let ipFetchPromise: Promise<string | null> | null = null;

// Function to get client IP with caching and singleton pattern
async function getClientIP(): Promise<string | null> {
  // Return cached IP if available
  if (cachedClientIP) {
    return cachedClientIP;
  }

  // If already fetching, return the existing promise
  if (ipFetchPromise) {
    return ipFetchPromise;
  }

  // Create new fetch promise
  ipFetchPromise = (async () => {
    try {
      console.log('🌐 جلب IP العميل للـ API headers...');
      const ip = await getIP();
      if (ip) {
        cachedClientIP = ip;
        console.log(`✅ تم الحصول على IP العميل: ${ip}`);
        return ip;
      } else {
        console.warn('⚠️ لم يتم الحصول على IP العميل');
        return null;
      }
    } catch (error) {
      console.error('❌ خطأ في الحصول على IP العميل:', error);
      return null;
    } finally {
      // Reset promise after completion
      ipFetchPromise = null;
    }
  })();

  return ipFetchPromise;
}

// Helper to get all required headers (auth, content-type, client-ip)
async function getAllHeaders(options: { 
  contentType?: boolean;
  includeIP?: boolean;
} = {}): Promise<Record<string, string>> {
  const { contentType = false, includeIP = false } = options;
  const headers: Record<string, string> = {};

  // Add Content-Type if requested
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  // Add Authorization if token exists
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add Client IP if available and requested
  if (includeIP) {
    try {
      const clientIP = await getClientIP();
      if (clientIP) {
        headers["X-Client-IP"] = clientIP;
        console.log(`📡 إضافة X-Client-IP header: ${clientIP}`);
      }
    } catch (error) {
      console.warn('⚠️ فشل في إضافة X-Client-IP header:', error);
    }
  }

  return headers;
}

// Helper to get authorization header if token exists (legacy function - kept for compatibility)
function getAuthHeaders(contentType = false): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: HeadersInit = {};
  
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = 'GET',
  data?: any,
  options: {
    headers?: HeadersInit;
    skipClientIP?: boolean;
  } = {}
): Promise<Response> {
  const { headers = {}, skipClientIP = true } = options;
  const body = data ? JSON.stringify(data) : undefined;
  
  // Get all headers including client IP
  const baseHeaders = await getAllHeaders({
    contentType: !!body,
    includeIP: !skipClientIP
  });
  
  // Merge with any custom headers provided
  const finalHeaders: Record<string, string> = {
    ...baseHeaders,
    ...(headers as Record<string, string>),
  };
  
  console.log(`🚀 API Request: ${method} ${url}`, {
    hasClientIP: !!finalHeaders["X-Client-IP"],
    clientIP: finalHeaders["X-Client-IP"] ? `${finalHeaders["X-Client-IP"].substring(0, 8)}...` : 'none',
    hasAuth: !!finalHeaders["Authorization"]
  });
  
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body,
  });

  // Handle 401 errors by clearing invalid token
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    const errorData = await res.text();
    throw new Error(errorData || "غير مصرح به");
  }
  
  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(errorData || `خطأ ${res.status}`);
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  skipClientIP?: boolean;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, skipClientIP = true }) =>
  async ({ queryKey }) => {
    // Get all headers including client IP
    const headers = await getAllHeaders({
      contentType: false,
      includeIP: !skipClientIP
    });
    
    const url = queryKey[0] as string;
    console.log(`🔍 Query Request: GET ${url}`, {
      hasClientIP: !!headers["X-Client-IP"],
      clientIP: headers["X-Client-IP"] ? `${headers["X-Client-IP"].substring(0, 8)}...` : 'none',
      hasAuth: !!headers["Authorization"]
    });
    
    const res = await fetch(url, { 
      method: 'GET',
      headers 
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      throw new Error("غير مصرح به");
    }

    if (!res.ok) {
      const text = await res.text() || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw", skipClientIP: false }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Utility functions for IP cache management
export function clearClientIPCache(): void {
  cachedClientIP = null;
  ipFetchPromise = null;
  console.log('🧹 تم مسح cache الخاص بـ Client IP');
}

export function getCurrentClientIP(): string | null {
  return cachedClientIP;
}

export async function refreshClientIP(): Promise<string | null> {
  clearClientIPCache();
  return await getClientIP();
}