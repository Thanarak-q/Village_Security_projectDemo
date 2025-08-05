import { createActivityLog, CreateActivityLogParams } from "../db/adminActivityLogUtils";

// Helper function to get client IP address
export const getClientIP = (request: any): string | undefined => {
  return (
    request.headers["x-forwarded-for"] ||
    request.headers["x-real-ip"] ||
    request.headers["cf-connecting-ip"] ||
    request.remoteAddress ||
    "unknown"
  );
};

// Helper function to get user agent
export const getUserAgent = (request: any): string | undefined => {
  return request.headers["user-agent"] || "unknown";
};

// Helper function to create activity log entry
export const logAdminActivity = async (params: Omit<CreateActivityLogParams, "ip_address" | "user_agent">, request: any) => {
  try {
    const ip_address = getClientIP(request);
    const user_agent = getUserAgent(request);

    await createActivityLog({
      ...params,
      ip_address,
      user_agent,
    });
  } catch (error) {
    console.error("Error logging admin activity:", error);
    // Don't throw error to avoid breaking the main functionality
  }
};

// Predefined log descriptions for common actions
export const LOG_DESCRIPTIONS = {
  // User management
  APPROVE_RESIDENT: "อนุมัติ resident",
  REJECT_RESIDENT: "ปฏิเสธ resident",
  APPROVE_GUARD: "อนุมัติ guard",
  REJECT_GUARD: "ปฏิเสธ guard",
  
  // House management
  CREATE_HOUSE: "เพิ่มบ้านใหม่",
  UPDATE_HOUSE: "แก้ไขข้อมูลบ้าน",
  DELETE_HOUSE: "ลบบ้าน",
  CHANGE_HOUSE_STATUS: "เปลี่ยนสถานะบ้าน",
  
  // House member management
  ADD_HOUSE_MEMBER: "เพิ่มสมาชิกบ้าน",
  REMOVE_HOUSE_MEMBER: "ลบสมาชิกบ้าน",
  
  // User status management
  CHANGE_USER_STATUS: "เปลี่ยนสถานะผู้ใช้",
  CHANGE_USER_ROLE: "เปลี่ยน role ของผู้ใช้",
  
  // Admin management
  CREATE_ADMIN: "เพิ่ม admin ใหม่",
  UPDATE_ADMIN: "แก้ไขข้อมูล admin",
  DELETE_ADMIN: "ลบ admin",
  
  // Village management
  CREATE_VILLAGE: "เพิ่มหมู่บ้านใหม่",
  UPDATE_VILLAGE: "แก้ไขข้อมูลหมู่บ้าน",
  DELETE_VILLAGE: "ลบหมู่บ้าน",
  
  // View actions
  VIEW_RESIDENTS: "ดูข้อมูล residents",
  VIEW_GUARDS: "ดูข้อมูล guards",
  VIEW_VISITOR_RECORDS: "ดู visitor records",
  
  // System actions
  EXPORT_DATA: "export ข้อมูล",
  SYSTEM_CONFIG: "ตั้งค่าระบบ",
} as const;

// Helper function to create log entry for user approval/rejection
export const logUserAction = async (
  admin_id: string,
  action: "approve_user" | "reject_user",
  target_type: "resident" | "guard",
  target_id: string,
  additional_info?: string,
  request?: any
) => {
  const description = additional_info 
    ? `${LOG_DESCRIPTIONS[action === "approve_user" ? "APPROVE_RESIDENT" : "REJECT_RESIDENT"]} - ${additional_info}`
    : LOG_DESCRIPTIONS[action === "approve_user" ? "APPROVE_RESIDENT" : "REJECT_RESIDENT"];

  if (request) {
    await logAdminActivity({
      admin_id,
      action_type: action,
      target_type,
      target_id,
      description,
    }, request);
  }
};

// Helper function to create log entry for house management
export const logHouseAction = async (
  admin_id: string,
  action: "create_house" | "update_house" | "delete_house" | "change_house_status",
  target_id: string,
  old_value?: string,
  new_value?: string,
  additional_info?: string,
  request?: any
) => {
  const descriptions = {
    create_house: LOG_DESCRIPTIONS.CREATE_HOUSE,
    update_house: LOG_DESCRIPTIONS.UPDATE_HOUSE,
    delete_house: LOG_DESCRIPTIONS.DELETE_HOUSE,
    change_house_status: LOG_DESCRIPTIONS.CHANGE_HOUSE_STATUS,
  };

  const description = additional_info 
    ? `${descriptions[action]} - ${additional_info}`
    : descriptions[action];

  if (request) {
    await logAdminActivity({
      admin_id,
      action_type: action,
      target_type: "house",
      target_id,
      old_value,
      new_value,
      description,
    }, request);
  }
};

// Helper function to create log entry for house member management
export const logHouseMemberAction = async (
  admin_id: string,
  action: "add_house_member" | "remove_house_member",
  target_id: string,
  additional_info?: string,
  request?: any
) => {
  const descriptions = {
    add_house_member: LOG_DESCRIPTIONS.ADD_HOUSE_MEMBER,
    remove_house_member: LOG_DESCRIPTIONS.REMOVE_HOUSE_MEMBER,
  };

  const description = additional_info 
    ? `${descriptions[action]} - ${additional_info}`
    : descriptions[action];

  if (request) {
    await logAdminActivity({
      admin_id,
      action_type: action,
      target_type: "house_member",
      target_id,
      description,
    }, request);
  }
};

// Helper function to create log entry for view actions
export const logViewAction = async (
  admin_id: string,
  target_type: "resident" | "guard" | "visitor_records",
  additional_info?: string,
  request?: any
) => {
  const descriptions = {
    resident: LOG_DESCRIPTIONS.VIEW_RESIDENTS,
    guard: LOG_DESCRIPTIONS.VIEW_GUARDS,
    visitor_records: LOG_DESCRIPTIONS.VIEW_VISITOR_RECORDS,
  };

  const description = additional_info 
    ? `${descriptions[target_type]} - ${additional_info}`
    : descriptions[target_type];

  if (request) {
    await logAdminActivity({
      admin_id,
      action_type: `view_${target_type}` as any,
      target_type,
      description,
    }, request);
  }
}; 