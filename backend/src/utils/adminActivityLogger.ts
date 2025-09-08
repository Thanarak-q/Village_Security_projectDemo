/**
 * @file This file contains utility functions for logging admin activities.
 * It provides a structured way to record actions performed by administrators,
 * such as user management, house management, and system-level changes.
 * These logs are essential for auditing, security monitoring, and debugging.
 */

import {
  createActivityLog,
  CreateActivityLogParams,
} from "../db/adminActivityLogUtils";

/**
 * Extracts the client's IP address from an incoming request object.
 * It checks several common headers where the IP address might be located,
 * providing a reliable way to identify the source of a request.
 *
 * @param {any} request - The incoming request object, typically from a web framework.
 * @returns {string} The client's IP address, or 'unknown' if it cannot be determined.
 */
export const getClientIP = (request: any): string => {
  return (
    request.headers["x-forwarded-for"] ||
    request.headers["x-real-ip"] ||
    request.headers["cf-connecting-ip"] ||
    request.remoteAddress ||
    "unknown"
  );
};

/**
 * Retrieves the User-Agent string from a request object.
 * The User-Agent provides information about the client's browser,
 * operating system, and other details, which can be useful for logging.
 *
 * @param {any} request - The incoming request object.
 * @returns {string} The User-Agent string, or 'unknown' if it's not available.
 */
export const getUserAgent = (request: any): string => {
  return request.headers["user-agent"] || "unknown";
};

/**
 * Logs an administrative activity to the database.
 * This function gathers details about the action, including the administrator,
 * the type of action, and metadata from the request like IP address and User-Agent.
 *
 * @param {Omit<CreateActivityLogParams, "ip_address" | "user_agent">} params - The core parameters for the activity log, such as admin ID and action type.
 * @param {any} request - The request object associated with the activity.
 * @returns {Promise<void>} A promise that resolves when the log has been created.
 */
export const logAdminActivity = async (
  params: Omit<CreateActivityLogParams, "ip_address" | "user_agent">,
  request: any
): Promise<void> => {
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
    // Errors are caught and logged without being re-thrown to ensure that logging failures
    // do not disrupt the primary application functionality.
  }
};

/**
 * A dictionary of predefined, human-readable descriptions for common admin actions.
 * This helps maintain consistency in log messages and supports internationalization.
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
 * Logs an action related to user approval or rejection.
 *
 * @param {string} admin_id - The UUID of the administrator performing the action.
 * @param {"approve_user" | "reject_user"} action - The type of user-related action.
 * @param {"resident" | "guard"} target_type - The role of the user being acted upon.
 * @param {string} target_id - The UUID of the user being acted upon.
 * @param {string} [additional_info] - Optional details about the action.
 * @param {any} [request] - The request object, if available.
 * @returns {Promise<void>} A promise that resolves when the action is logged.
 */
export const logUserAction = async (
  admin_id: string,
  action: "approve_user" | "reject_user",
  target_type: "resident" | "guard",
  target_id: string,
  additional_info?: string,
  request?: any
): Promise<void> => {
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
 * Logs an action related to house management (create, update, delete, etc.).
 *
 * @param {string} admin_id - The UUID of the administrator.
 * @param {"create_house" | "update_house" | "delete_house" | "change_house_status"} action - The type of house-related action.
 * @param {string} target_id - The UUID of the house being managed.
 * @param {string} [old_value] - The state of the data before the change.
 * @param {string} [new_value] - The state of the data after the change.
 * @param {string} [additional_info] - Optional details about the action.
 * @param {any} [request] - The request object, if available.
 * @returns {Promise<void>} A promise that resolves when the action is logged.
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
): Promise<void> => {
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
 * Logs an action related to managing house members (adding or removing).
 *
 * @param {string} admin_id - The UUID of the administrator.
 * @param {"add_house_member" | "remove_house_member"} action - The type of member action.
 * @param {string} target_id - The UUID of the house member record.
 * @param {string} [additional_info] - Optional details about the action.
 * @param {any} [request] - The request object, if available.
 * @returns {Promise<void>} A promise that resolves when the action is logged.
 */
export const logHouseMemberAction = async (
  admin_id: string,
  action: "add_house_member" | "remove_house_member",
  target_id: string,
  additional_info?: string,
  request?: any
): Promise<void> => {
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
 * Logs an action where an administrator views a list of resources.
 *
 * @param {string} admin_id - The UUID of the administrator.
 * @param {"resident" | "guard" | "visitor_records"} target_type - The type of resource being viewed.
 * @param {string} [additional_info] - Optional details about the view action.
 * @param {any} [request] - The request object, if available.
 * @returns {Promise<void>} A promise that resolves when the action is logged.
 */
export const logViewAction = async (
  admin_id: string,
  target_type: "resident" | "guard" | "visitor_records",
  additional_info?: string,
  request?: any
): Promise<void> => {
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