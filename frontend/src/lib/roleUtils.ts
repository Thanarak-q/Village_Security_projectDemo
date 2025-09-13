/**
 * Utility functions for role management and display
 */

export type AdminRole = 'admin' | 'staff' | 'superadmin';

/**
 * Get Thai display name for admin roles
 */
export const getAdminRoleDisplayName = (role: AdminRole): string => {
  const roleNames: Record<AdminRole, string> = {
    admin: 'เจ้าของโครงการ',
    staff: 'นิติ',
    superadmin: 'เจ้าของ SE'
  };
  
  return roleNames[role] || role;
};

/**
 * Get English display name for admin roles
 */
export const getAdminRoleDisplayNameEn = (role: AdminRole): string => {
  const roleNames: Record<AdminRole, string> = {
    admin: 'Project Owner',
    staff: 'Legal Staff',
    superadmin: 'SE Owner'
  };
  
  return roleNames[role] || role;
};

/**
 * Get role description
 */
export const getAdminRoleDescription = (role: AdminRole): string => {
  const descriptions: Record<AdminRole, string> = {
    admin: 'สามารถจัดการระบบทั้งหมดในโครงการ',
    staff: 'สามารถดูข้อมูลและรายงานได้',
    superadmin: 'สามารถจัดการระบบทั้งหมดในทุกโครงการ'
  };
  
  return descriptions[role] || '';
};

/**
 * Get role badge color classes
 */
export const getAdminRoleBadgeClasses = (role: AdminRole): string => {
  const badgeClasses: Record<AdminRole, string> = {
    admin: 'border-blue-200 text-blue-700 bg-blue-50',
    staff: 'border-green-200 text-green-700 bg-green-50',
    superadmin: 'border-purple-200 text-purple-700 bg-purple-50'
  };
  
  return badgeClasses[role] || 'border-gray-200 text-gray-700 bg-gray-50';
};

/**
 * Check if role has permission
 */
export const hasAdminPermission = (userRole: AdminRole, permission: string): boolean => {
  const permissions: Record<AdminRole, string[]> = {
    admin: [
      'view_dashboard',
      'manage_users',
      'manage_houses',
      'view_reports',
      'manage_settings'
    ],
    staff: [
      'view_dashboard',
      'view_reports',
      'view_users'
    ],
    superadmin: [
      'view_dashboard',
      'manage_users',
      'manage_houses',
      'view_reports',
      'manage_settings',
      'manage_villages',
      'system_admin'
    ]
  };
  
  return permissions[userRole]?.includes(permission) || false;
};
