export type RoleStatus = 'verified' | 'pending' | 'disable' | (string & {});

export interface UserRole {
  role: string;
  village_id: string;
  village_name?: string;
  status: RoleStatus;
}

export interface UserRolesResponse {
  success: boolean;
  roles?: UserRole[];
  message?: string;
}
