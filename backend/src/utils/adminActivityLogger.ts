import {
  createActivityLog,
  CreateActivityLogParams,
} from "../db/adminActivityLogUtils";

/**
 * Gets the client IP address from a request.
 * @param {any} request - The request object.
 * @returns {string | undefined} The client IP address.
 */
export const getClientIP = (request: any): string | undefined => {
  return (
    request.headers["x-forwarded-for"] ||
    request.headers["x-real-ip"] ||
    request.headers["cf-connecting-ip"] ||
    request.remoteAddress ||
    "unknown"
  );
};

/**
 * Gets the user agent from a request.
 * @param {any} request - The request object.
 * @returns {string | undefined} The user agent.
 */
export const getUserAgent = (request: any): string | undefined => {
  return request.headers["user-agent"] || "unknown";
};

/**
 * Logs an admin activity.
 * @param {Omit<CreateActivityLogParams, "ip_address" | "user_agent">} params - The parameters for the activity log.
 * @param {any} request - The request object.
 * @returns {Promise<void>}
 */
export const logAdminActivity = async (
  params: Omit<CreateActivityLogParams, "ip_address" | "user_agent">,
  request: any
) => {
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

/**
 * Predefined log descriptions for common actions.
 * @type {Object}
 */
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

/**
 * Logs a user action.
 * @param {string} admin_id - The ID of the admin performing the action.
 * @param {"approve_user" | "reject_user"} action - The action performed.
 * @param {"resident" | "guard"} target_type - The type of the target user.
 * @param {string} target_id - The ID of the target user.
 * @param {string} [additional_info] - Additional information about the action.
 * @param {any} [request] - The request object.
 * @returns {Promise<void>}
 */
export const logUserAction = async (
  admin_id: string,
  action: "approve_user" | "reject_user",
  target_type: "resident" | "guard",
  target_id: string,
  additional_info?: string,
  request?: any
) => {
  const description = additional_info
    ? `${
        LOG_DESCRIPTIONS[
          action === "approve_user" ? "APPROVE_RESIDENT" : "REJECT_RESIDENT"
        ]
      } - ${additional_info}`
    : LOG_DESCRIPTIONS[
        action === "approve_user" ? "APPROVE_RESIDENT" : "REJECT_RESIDENT"
      ];

  if (request) {
    await logAdminActivity(
      {
        admin_id,
        action_type: action,
        target_type,
        target_id,
        description,
      },
      request
    );
  }
};

/**
 * Logs a house action.
 * @param {string} admin_id - The ID of the admin performing the action.
 * @param {"create_house" | "update_house" | "delete_house" | "change_house_status"} action - The action performed.
 * @param {string} target_id - The ID of the target house.
 * @param {string} [old_value] - The old value of the data.
 * @param {string} [new_value] - The new value of the data.
 * @param {string} [additional_info] - Additional information about the action.
 * @param {any} [request] - The request object.
 * @returns {Promise<void>}
 */
export const logHouseAction = async (
  admin_id: string,
  action:
    | "create_house"
    | "update_house"
    | "delete_house"
    | "change_house_status",
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
    await logAdminActivity(
      {
        admin_id,
        action_type: action,
        target_type: "house",
        target_id,
        old_value,
        new_value,
        description,
      },
      request
    );
  }
};

/**
 * Logs a house member action.
 * @param {string} admin_id - The ID of the admin performing the action.
 * @param {"add_house_member" | "remove_house_member"} action - The action performed.
 * @param {string} target_id - The ID of the target house member.
 * @param {string} [additional_info] - Additional information about the action.
 * @param {any} [request] - The request object.
 * @returns {Promise<void>}
 */
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
    await logAdminActivity(
      {
        admin_id,
        action_type: action,
        target_type: "house_member",
        target_id,
        description,
      },
      request
    );
  }
};

/**
 * Logs a view action.
 * @param {string} admin_id - The ID of the admin performing the action.
 * @param {"resident" | "guard" | "visitor_records"} target_type - The type of the target being viewed.
 * @param {string} [additional_info] - Additional information about the action.
 * @param {any} [request] - The request object.
 * @returns {Promise<void>}
 */
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
    await logAdminActivity(
      {
        admin_id,
        action_type: `view_${target_type}` as any,
        target_type,
        description,
      },
      request
    );
  }
}; 