/**
 * @file This file provides a rate limiting middleware for an Elysia application.
 *
 * The middleware is designed to prevent brute-force attacks and Denial of Service (DoS)
 * by limiting the number of requests an IP address can make to specific endpoints
 * within a given time frame. It is a crucial security feature for protecting sensitive
 * routes, such as login endpoints.
 */

/**
 * Defines the structure for the in-memory store that tracks request counts.
 * Each key, typically an IP address, maps to an object containing the request count
 * and the time when the count should be reset.
 * @interface
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * An in-memory store for rate limiting. For production environments with multiple
 * server instances, a distributed store like Redis is recommended for scalability.
 */
const store: RateLimitStore = {};

/**
 * Creates an Elysia middleware function for rate limiting requests.
 *
 * @param {Object} options - Configuration options for the rate limiter.
 * @param {number} options.windowMs - The time window in milliseconds during which requests are counted.
 * @param {number} options.max - The maximum number of requests allowed from a single IP within the time window.
 * @param {string} [options.message] - An optional custom message to return when the rate limit is exceeded.
 * @returns {Function} An Elysia hook function that enforces the rate limit.
 */
export const rateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return async (context: any) => {
    const { set, request } = context;

    // Determines the client's IP address, supporting proxy headers for accurate identification.
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const key = `${ip}:${request.url}`; // Creates a unique key for each IP and endpoint combination.

    // Removes expired entries from the store to prevent memory leaks.
    if (store[key] && now > store[key].resetTime) {
      delete store[key];
    }

    // Initializes a new entry or increments the count for an existing one.
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
    } else {
      store[key].count++;
    }

    // Checks if the request count has exceeded the defined limit.
    if (store[key].count > options.max) {
      set.status = 429; // HTTP 429 Too Many Requests
      return {
        error: options.message || "Too many requests, please try again later.",
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000), // Provides the client with the reset time in seconds.
      };
    }
  };
};