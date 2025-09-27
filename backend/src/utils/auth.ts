/**
 * @file Authentication Utilities
 * JWT-based authentication and authorization
 */

import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import db from '../db/drizzle';
import { admins } from '../db/schema';
import { verifyPassword } from './passwordUtils';

export interface JWTPayload {
  adminId: string;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  admin?: {
    id: string;
    username: string;
    email: string;
    role: string;
    name: string;
  };
  token?: string;
  error?: string;
}

export class AuthService {
  private static instance: AuthService;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    this.jwtSecret = process.env.JWT_SECRET || 'catfishissuewithcs361';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async authenticate(username: string, password: string): Promise<AuthResult> {
    try {
      // Find admin by username
      const admin = await db
        .select()
        .from(admins)
        .where(eq(admins.username, username))
        .limit(1);

      if (admin.length === 0) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const adminData = admin[0];

      // Verify the password using bcrypt
      const isPasswordValid = await verifyPassword(password, adminData.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Generate JWT token
      const payload: JWTPayload = {
        adminId: adminData.id,
        username: adminData.username,
        email: adminData.email,
        role: adminData.role
      };

      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn
      });

      return {
        success: true,
        admin: {
          id: adminData.id,
          username: adminData.username,
          email: adminData.email,
          role: adminData.role,
          name: adminData.name
        },
        token
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  public async verifyToken(token: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      
      // Verify admin still exists
      const admin = await db
        .select()
        .from(admins)
        .where(eq(admins.id, decoded.adminId))
        .limit(1);

      if (admin.length === 0) {
        return {
          success: false,
          error: 'Admin not found'
        };
      }

      const adminData = admin[0];

      return {
        success: true,
        admin: {
          id: adminData.id,
          email: adminData.email,
          role: adminData.role,
          name: adminData.name
        }
      };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          success: false,
          error: 'Invalid token'
        };
      }
      
      console.error('Token verification error:', error);
      return {
        success: false,
        error: 'Token verification failed'
      };
    }
  }

  public async refreshToken(token: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, { ignoreExpiration: true }) as JWTPayload;
      
      // Verify admin still exists
      const admin = await db
        .select()
        .from(admins)
        .where(eq(admins.id, decoded.adminId))
        .limit(1);

      if (admin.length === 0) {
        return {
          success: false,
          error: 'Admin not found'
        };
      }

      const adminData = admin[0];

      // Generate new token
      const payload: JWTPayload = {
        adminId: adminData.id,
        email: adminData.email,
        role: adminData.role
      };

      const newToken = jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn
      });

      return {
        success: true,
        admin: {
          id: adminData.id,
          email: adminData.email,
          role: adminData.role,
          name: adminData.name
        },
        token: newToken
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  }

  public extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  public hasPermission(adminRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'superadmin': 4,
      'admin': 3,
      'moderator': 2,
      'viewer': 1
    };

    const adminLevel = roleHierarchy[adminRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return adminLevel >= requiredLevel;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
