/**
 * 🔐 Centralized JWT Secret Management
 * 
 * This module provides a singleton JWT secret that is consistent across all authentication modules.
 * It prevents the security issues that arise from having different secrets in different modules.
 */

import { randomBytes } from 'crypto';

let jwtSecret: string | null = null;

/**
 * Get the JWT secret - either from environment variable or generate a secure fallback
 * 
 * @returns {string} The JWT secret to use for signing and verifying tokens
 * @note Now provides fallback generation in production with warnings for enhanced deployment resilience
 */
export function getJwtSecret(): string {
  // Return cached secret if already computed
  if (jwtSecret !== null) {
    return jwtSecret;
  }

  // Try to get from environment variable first
  if (process.env.JWT_SECRET) {
    jwtSecret = process.env.JWT_SECRET;
    console.log("🔐 JWT_SECRET configured securely from environment variable");
    return jwtSecret;
  }

  // Check if we're in production - if so, warn but provide fallback
  if (process.env.NODE_ENV === 'production') {
    console.error("🚨 PRODUCTION WARNING: JWT_SECRET environment variable is missing!");
    console.error("🚨 SECURITY NOTICE: Using auto-generated secret. For better security, please set JWT_SECRET in your deployment environment variables.");
    console.error("🚨 This fallback ensures your application starts, but you should add JWT_SECRET to your deployment secrets.");
  } else {
    // Development fallback: generate a secure secret and cache it
    console.warn("⚠️ DEMO MODE: Generating secure JWT_SECRET automatically for demo purposes");
    console.warn("⚠️ In production, always set JWT_SECRET as an environment variable!");
  }
  
  // Generate a cryptographically secure secret using crypto.randomBytes
  const cryptoRandom = randomBytes(64).toString('hex');
  const timestamp = Date.now().toString(36);
  const processInfo = process.pid?.toString(36) || 'unknownpid';
  
  // Create a cryptographically secure secret for both production and development
  const baseSecret = process.env.NODE_ENV === 'production' 
    ? `prod_secure_jwt_${cryptoRandom}_${timestamp}_${processInfo}_replit_exchange_platform_2025`
    : `demo_secure_jwt_${cryptoRandom}_${timestamp}_replit_exchange_platform_2025`;
  
  jwtSecret = baseSecret;
  
  const mode = process.env.NODE_ENV === 'production' ? 'production fallback' : 'demo';
  console.log(`🔐 JWT_SECRET configured securely (auto-generated for ${mode})`);
  return jwtSecret;
}

/**
 * Reset the JWT secret cache - mainly for testing purposes
 * 
 * @internal
 */
export function resetJwtSecret(): void {
  jwtSecret = null;
}

/**
 * Check if JWT secret is available without throwing
 * 
 * @returns {boolean} True if JWT secret is available
 */
export function isJwtSecretAvailable(): boolean {
  try {
    getJwtSecret();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get environment and JWT secret status for deployment validation
 * 
 * @returns {object} Environment status information
 */
export function getEnvironmentStatus() {
  return {
    nodeEnv: process.env.NODE_ENV || 'undefined',
    jwtSecretConfigured: !!process.env.JWT_SECRET,
    isProduction: process.env.NODE_ENV === 'production',
    usingFallback: !process.env.JWT_SECRET
  };
}