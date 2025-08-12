/**
 * SECURITY ENHANCEMENT: Rate Limiting Middleware
 * 
 * Purpose: Prevent brute force attacks and DoS by limiting requests per IP
 * Added: 2024-12-08 - Security audit improvement
 * 
 * Features:
 * - Tracks requests per IP address
 * - Configurable time window and max requests
 * - Works with Caddy proxy headers (X-Forwarded-For, X-Real-IP)
 * - Returns 429 status code when limit exceeded
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (consider Redis for production scaling)
const store: RateLimitStore = {};

export const rateLimit = (options: {
  windowMs: number;    // Time window in milliseconds
  max: number;         // Maximum requests per window
  message?: string;    // Custom error message
}) => {
  return async (context: any) => {
    const { set, request } = context;
    
    // Get real IP address from proxy headers (Caddy support)
    // Priority: X-Forwarded-For > X-Real-IP > fallback to 'unknown'
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const now = Date.now();
    const key = `${ip}:${request.url}`; // Unique key per IP and endpoint
    
    // Cleanup: Remove expired entries to prevent memory leaks
    if (store[key] && now > store[key].resetTime) {
      delete store[key];
    }
    
    // Initialize new entry or increment existing counter
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs
      };
    } else {
      store[key].count++;
    }
    
    // Check if limit exceeded
    if (store[key].count > options.max) {
      set.status = 429; // Too Many Requests
      return { 
        error: options.message || 'Too many requests',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000) // Seconds until reset
      };
    }
  };
};