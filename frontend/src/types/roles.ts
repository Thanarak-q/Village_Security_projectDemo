export type RoleStatus = 'verified' | 'pending' | 'disable' | (string & {});

export interface RoleHouse {
  house_id: string;
  house_address: string | null;
}

export interface UserRole {
  role: string;
  village_id: string;
  village_name?: string;
  status: RoleStatus;
  resident_id?: string;
  guard_id?: string;
  houses?: RoleHouse[];
}

export interface UserRolesResponse {
  success: boolean;
  roles?: UserRole[];
  message?: string;
}
