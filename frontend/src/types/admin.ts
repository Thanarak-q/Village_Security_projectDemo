/**
 * Admin role types and interfaces for the Village Security system
 * 
 * Role Definitions:
 * - admin: เจ้าของโครงการ (Project Owner)
 * - staff: นิติ (Legal Staff)  
 * - superadmin: เจ้าของ SE (SE Owner)
 */

export type AdminRole = 'admin' | 'staff' | 'superadmin';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  village_key: string;
  status: 'verified' | 'pending' | 'disable';
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuthResponse {
  success: boolean;
  user?: AdminUser;
  token?: string;
  error?: string;
}

// Role-based permissions
export const ROLE_PERMISSIONS = {
  admin: {
    name: 'เจ้าของโครงการ',
    nameEn: 'Project Owner',
    description: 'สามารถจัดการระบบทั้งหมดในโครงการ',
    permissions: [
      'view_dashboard',
      'manage_users',
      'manage_houses',
      'view_reports',
      'manage_settings'
    ]
  },
  staff: {
    name: 'นิติ',
    nameEn: 'Legal Staff',
    description: 'สามารถดูข้อมูลและรายงานได้',
    permissions: [
      'view_dashboard',
      'view_reports',
      'view_users'
    ]
  },
  superadmin: {
    name: 'เจ้าของ SE',
    nameEn: 'SE Owner',
    description: 'สามารถจัดการระบบทั้งหมดในทุกโครงการ',
    permissions: [
      'view_dashboard',
      'manage_users',
      'manage_houses',
      'view_reports',
      'manage_settings',
      'manage_villages',
      'system_admin'
    ]
  }
} as const;

// Helper function to get role display name
export const getRoleDisplayName = (role: AdminRole): string => {
  return ROLE_PERMISSIONS[role]?.name || role;
};

// Helper function to check if user has permission
export const hasPermission = (userRole: AdminRole, permission: string): boolean => {
  const userPermissions = ROLE_PERMISSIONS[userRole]?.permissions;
  return userPermissions ? userPermissions.includes(permission as any) : false;
};
