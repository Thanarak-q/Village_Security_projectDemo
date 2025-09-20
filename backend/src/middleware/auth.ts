/**
 * @file Authentication Middleware
 * Express middleware for JWT authentication and authorization
 */

// Note: This is for Express-style middleware, but we're using Elysia
// The actual implementation will be in the route handlers
import { authService } from '../utils/auth';
import { AppError, ErrorType, ErrorSeverity } from '../utils/errorHandler';

export interface AuthenticatedRequest {
  admin?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

// Authentication helper functions for Elysia
export const extractTokenFromHeaders = (headers: Record<string, string | undefined>): string | null => {
  const authHeader = headers.authorization;
  return authService.extractTokenFromHeader(authHeader);
};

export const verifyAdminToken = async (token: string) => {
  return await authService.verifyToken(token);
};

export const checkRolePermission = (adminRole: string, requiredRole: string): boolean => {
  return authService.hasPermission(adminRole, requiredRole);
};

export const checkAnyRolePermission = (adminRole: string, roles: string[]): boolean => {
  return roles.some(role => authService.hasPermission(adminRole, role));
};
