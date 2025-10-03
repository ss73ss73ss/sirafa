import { Request } from "express";
import axios from "axios";

interface IPResult {
  ip: string;
  source: string;
  isPublic: boolean;
  trusted: boolean;
  serverDetectedIp?: string;
  clientReportedIp?: string;
  fallbackReason?: string;
}

// Check if IP is public (not private/loopback)
function isPublicIP(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  
  // Remove IPv6 prefix if present
  const cleanIP = ip.replace(/^::ffff:/, '');
  
  // Remove port if present
  const ipOnly = cleanIP.split(':')[0];
  
  // Check for loopback and private ranges
  if (ipOnly === '127.0.0.1' || ipOnly === 'localhost' || ipOnly === '::1') return false;
  
  const parts = ipOnly.split('.');
  if (parts.length !== 4) return false; // Not IPv4
  
  const firstOctet = parseInt(parts[0]);
  const secondOctet = parseInt(parts[1]);
  
  // Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  if (firstOctet === 10) return false;
  if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) return false;
  if (firstOctet === 192 && secondOctet === 168) return false;
  
  return true;
}

// Normalize IP (remove IPv6 prefix, ports)
function normalizeIP(ip: string): string {
  if (!ip) return '';
  return ip.replace(/^::ffff:/, '').split(':')[0];
}

// Check if we're behind a trusted proxy
function isBehindTrustedProxy(req: Request): boolean {
  // Check if Express trust proxy is enabled
  const app = req.app;
  if (!app || !app.get('trust proxy')) {
    return false;
  }
  
  // Check if the request comes from a known proxy IP
  const serverDetectedIP = normalizeIP(req.ip || req.socket?.remoteAddress || '');
  
  // Known proxy/CDN IP ranges (simplified check)
  const trustedProxyPatterns = [
    /^127\./, // localhost
    /^10\./, // private network (common in containers)
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // private network
    /^192\.168\./, // private network
  ];
  
  return trustedProxyPatterns.some(pattern => pattern.test(serverDetectedIP));
}

// Extract client public IP from request headers
export function getClientPublicIP(req: Request): IPResult {
  // Debug logging disabled for production

  // Extract server-detected and client-reported IPs separately
  const serverDetectedIP = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  const clientReportedIP = req.headers['x-client-ip'] as string;
  
  const normalizedServerIP = normalizeIP(serverDetectedIP);
  const normalizedClientIP = clientReportedIP ? normalizeIP(clientReportedIP) : null;
  
  const isBehindProxy = isBehindTrustedProxy(req);
  
  // Server and client IP logging disabled

  // Priority order for trusted headers (proxy/CDN headers)
  const trustedHeaderChecks = [
    { header: 'cf-connecting-ip', source: 'Cloudflare' },
    { header: 'fly-client-ip', source: 'Fly.io' },
    { header: 'x-real-ip', source: 'X-Real-IP' }
  ];

  // Check trusted headers first (always check these as they're CDN/proxy specific)
  for (const check of trustedHeaderChecks) {
    const value = req.headers[check.header];
    if (value && typeof value === 'string') {
      const normalizedIP = normalizeIP(value);
      if (isPublicIP(normalizedIP)) {
        // Using trusted header: check.source
        return { 
          ip: normalizedIP, 
          source: check.source, 
          isPublic: true,
          trusted: true,
          serverDetectedIp: normalizedServerIP,
          clientReportedIp: normalizedClientIP
        };
      }
    }
  }

  // Check X-Forwarded-For ONLY if behind trusted proxy
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor && typeof xForwardedFor === 'string' && isBehindProxy) {
    const ips = xForwardedFor.split(',').map(ip => normalizeIP(ip.trim()));
    for (const ip of ips) {
      if (isPublicIP(ip)) {
        // Using X-Forwarded-For header (trusted proxy)
        return { 
          ip, 
          source: 'X-Forwarded-For (trusted proxy)', 
          isPublic: true,
          trusted: true,
          serverDetectedIp: normalizedServerIP,
          clientReportedIp: normalizedClientIP
        };
      }
    }
  } else if (xForwardedFor && typeof xForwardedFor === 'string' && !isBehindProxy) {
    // X-Forwarded-For present but not behind trusted proxy - potential spoofing
    const ips = xForwardedFor.split(',').map(ip => normalizeIP(ip.trim()));
    for (const ip of ips) {
      if (isPublicIP(ip)) {
        // X-Forwarded-For header present but not trusted (potential spoofing)
        return { 
          ip, 
          source: 'X-Forwarded-For (untrusted)', 
          isPublic: true,
          trusted: false, // Not trusted due to lack of proper proxy setup
          serverDetectedIp: normalizedServerIP,
          clientReportedIp: normalizedClientIP,
          fallbackReason: 'X-Forwarded-For without trusted proxy configuration'
        };
      }
    }
  }

  // Check server-detected IP (req.ip, socket.remoteAddress)
  if (isPublicIP(normalizedServerIP)) {
    // Using server-detected IP
    return { 
      ip: normalizedServerIP, 
      source: 'Server-detected', 
      isPublic: true,
      trusted: true,
      serverDetectedIp: normalizedServerIP,
      clientReportedIp: normalizedClientIP
    };
  }

  // Special case: If server IP is 127.0.0.1 and client provided public IP, use client IP
  if (normalizedServerIP === '127.0.0.1' && normalizedClientIP && isPublicIP(normalizedClientIP)) {
    // Fallback: using client IP (localhost case)
    return { 
      ip: normalizedClientIP, 
      source: 'Client-provided (localhost fallback)', 
      isPublic: true,
      trusted: false, // Not trusted for security purposes
      serverDetectedIp: normalizedServerIP,
      clientReportedIp: normalizedClientIP,
      fallbackReason: 'Server IP is localhost, using client-reported IP'
    };
  }

  // General fallback to client-provided IP - USE ONLY FOR DISPLAY/GEO
  if (normalizedClientIP && isPublicIP(normalizedClientIP)) {
    // Fallback: using client IP (display only)
    return { 
      ip: normalizedClientIP, 
      source: 'Client-provided (display only)', 
      isPublic: true,
      trusted: false,
      serverDetectedIp: normalizedServerIP,
      clientReportedIp: normalizedClientIP,
      fallbackReason: 'No trusted public IP available'
    };
  }

  // Last resort: return private/loopback IP with warning
  // Fallback: using private IP
  return { 
    ip: normalizedServerIP, 
    source: 'Fallback (private)', 
    isPublic: false,
    trusted: false,
    serverDetectedIp: normalizedServerIP,
    clientReportedIp: normalizedClientIP,
    fallbackReason: 'No public IP available'
  };
}

// Get geo location from IP (only for public IPs)
export async function getGeoLocation(ip: string) {
  try {
    // Don't try geolocation for private IPs
    if (!isPublicIP(ip)) {
      // Skipping geolocation for private IP
      return {
        country: 'Unknown (Local IP)',
        city: 'Unknown (Local IP)', 
        region: 'Unknown (Local IP)',
        timezone: 'Unknown (Local IP)'
      };
    }

    // Fallback to external service (ip-api is free)
    // Fetching geolocation from external service
    const response = await axios.get(`http://ip-api.com/json/${ip}?lang=ar`, { timeout: 3000 });
    if (response.data && response.data.status === 'success') {
      // Geolocation data received from ip-api.com
      return {
        country: response.data.country || 'Unknown',
        city: response.data.city || 'Unknown',
        region: response.data.regionName || 'Unknown',
        timezone: response.data.timezone || 'Unknown'
      };
    }
  } catch (error) {
    // Geolocation fetch error (silent)
  }
  
  return {
    country: 'Unknown',
    city: 'Unknown', 
    region: 'Unknown',
    timezone: 'Unknown'
  };
}

// Helper function that returns just the IP string for display purposes only
// WARNING: This IP may not be trusted for security controls - use getClientPublicIP for security decisions
export function getDisplayIP(req: Request): string {
  const ipResult = getClientPublicIP(req);
  return ipResult.ip;
}