import db from "../db/drizzle";
import { admin_activity_logs } from "../db/schema";
import { AdminActivityLogInsert } from "../db/schema";

/**
 * Logs an admin activity to the database.
 * @param {string} adminId - The ID of the admin performing the action.
 * @param {string} actionType - The type of action being performed.
 * @param {string} description - A detailed description of the action.
 * @returns {Promise<AdminActivityLog>} A promise that resolves to the created log entry.
 */
export async function logAdminActivity(
  adminId: string,
  actionType: string,
  description: string
): Promise<AdminActivityLogInsert> {
  try {
    const logEntry = await db
      .insert(admin_activity_logs)
      .values({
        admin_id: adminId,
        action_type: actionType,
        description: description,
      })
      .returning();

    return logEntry[0];
  } catch (error) {
    console.error("Error logging admin activity:", error);
    throw new Error("Failed to log admin activity");
  }
}

/**
 * Logs house-related admin activities.
 */
export const houseActivityLogger = {
  /**
   * Logs when a house is created.
   * @param {string} adminId - The ID of the admin.
   * @param {string} houseAddress - The address of the created house.
   * @param {string} villageKey - The village key.
   */
  async logHouseCreated(adminId: string, houseAddress: string, villageKey: string) {
    return await logAdminActivity(
      adminId,
      "house_create",
      `สร้างบ้านใหม่: ${houseAddress} ในหมู่บ้าน ${villageKey}`
    );
  },

  /**
   * Logs when a house is updated.
   * @param {string} adminId - The ID of the admin.
   * @param {string} houseId - The ID of the house.
   * @param {string} houseAddress - The address of the house.
   * @param {Object} changes - The changes made to the house.
   */
  async logHouseUpdated(
    adminId: string,
    houseId: string,
    houseAddress: string,
    changes: { address?: string; status?: string }
  ) {
    const changeDescriptions = [];
    
    if (changes.address) {
      changeDescriptions.push(`เปลี่ยนที่อยู่เป็น: ${changes.address}`);
    }
    
    if (changes.status) {
      changeDescriptions.push(`เปลี่ยนสถานะเป็น: ${changes.status}`);
    }

    const description = changeDescriptions.length > 0 
      ? `แก้ไขบ้าน ${houseAddress}: ${changeDescriptions.join(", ")}`
      : `แก้ไขบ้าน ${houseAddress}`;

    return await logAdminActivity(
      adminId,
      "house_update",
      description
    );
  },

  /**
   * Logs when a house is deleted.
   * @param {string} adminId - The ID of the admin.
   * @param {string} houseAddress - The address of the deleted house.
   * @param {string} villageKey - The village key.
   */
  async logHouseDeleted(adminId: string, houseAddress: string, villageKey: string) {
    return await logAdminActivity(
      adminId,
      "house_delete",
      `ลบบ้าน: ${houseAddress} จากหมู่บ้าน ${villageKey}`
    );
  },

  /**
   * Logs when a house status is updated.
   * @param {string} adminId - The ID of the admin.
   * @param {string} houseAddress - The address of the house.
   * @param {string} oldStatus - The previous status.
   * @param {string} newStatus - The new status.
   */
  async logHouseStatusUpdated(
    adminId: string,
    houseAddress: string,
    oldStatus: string,
    newStatus: string
  ) {
    return await logAdminActivity(
      adminId,
      "house_status_update",
      `เปลี่ยนสถานะบ้าน ${houseAddress} จาก ${oldStatus} เป็น ${newStatus}`
    );
  }
};

/**
 * Logs admin settings-related activities.
 */
export const adminSettingsActivityLogger = {
  /**
   * Logs when admin profile is updated.
   * @param {string} adminId - The ID of the admin.
   * @param {string} adminUsername - The username of the admin.
   * @param {Object} changes - The changes made to the profile.
   */
  async logProfileUpdated(
    adminId: string,
    adminUsername: string,
    changes: { username?: string; email?: string; phone?: string }
  ) {
    const changeDescriptions = [];
    
    if (changes.username) {
      changeDescriptions.push(`เปลี่ยน username เป็น: ${changes.username}`);
    }
    
    if (changes.email) {
      changeDescriptions.push(`เปลี่ยน email เป็น: ${changes.email}`);
    }
    
    if (changes.phone) {
      changeDescriptions.push(`เปลี่ยนเบอร์โทรเป็น: ${changes.phone}`);
    }

    const description = changeDescriptions.length > 0 
      ? `อัปเดตข้อมูลส่วนตัว: ${changeDescriptions.join(", ")}`
      : `อัปเดตข้อมูลส่วนตัว`;

    return await logAdminActivity(
      adminId,
      "admin_profile_update",
      description
    );
  },

  /**
   * Logs when admin password is changed.
   * @param {string} adminId - The ID of the admin.
   * @param {string} adminUsername - The username of the admin.
   */
  async logPasswordChanged(adminId: string, adminUsername: string) {
    return await logAdminActivity(
      adminId,
      "admin_password_change",
      `เปลี่ยนรหัสผ่านสำเร็จ`
    );
  },

  /**
   * Logs when admin settings are updated (both profile and password).
   * @param {string} adminId - The ID of the admin.
   * @param {string} adminUsername - The username of the admin.
   * @param {Object} changes - The changes made.
   * @param {boolean} passwordChanged - Whether password was changed.
   */
  async logSettingsUpdated(
    adminId: string,
    adminUsername: string,
    changes: { username?: string; email?: string; phone?: string },
    passwordChanged: boolean
  ) {
    const changeDescriptions = [];
    
    if (changes.username) {
      changeDescriptions.push(`เปลี่ยน username เป็น: ${changes.username}`);
    }
    
    if (changes.email) {
      changeDescriptions.push(`เปลี่ยน email เป็น: ${changes.email}`);
    }
    
    if (changes.phone) {
      changeDescriptions.push(`เปลี่ยนเบอร์โทรเป็น: ${changes.phone}`);
    }
    
    if (passwordChanged) {
      changeDescriptions.push(`เปลี่ยนรหัสผ่าน`);
    }

    const description = changeDescriptions.length > 0 
      ? `อัปเดตการตั้งค่า: ${changeDescriptions.join(", ")}`
      : `อัปเดตการตั้งค่า`;

    return await logAdminActivity(
      adminId,
      "admin_settings_update",
      description
    );
  }
};

/**
 * Logs user management-related activities.
 */
export const userManagementActivityLogger = {
  /**
   * Logs when a user status is updated.
   * @param {string} adminId - The ID of the admin.
   * @param {string} adminUsername - The username of the admin.
   * @param {string} userType - The type of user (resident/guard).
   * @param {string} userName - The name of the user.
   * @param {string} oldStatus - The previous status.
   * @param {string} newStatus - The new status.
   */
  async logUserStatusUpdated(
    adminId: string,
    adminUsername: string,
    userType: string,
    userName: string,
    oldStatus: string,
    newStatus: string
  ) {
    return await logAdminActivity(
      adminId,
      "user_status_update",
      `เปลี่ยนสถานะ${userType} ${userName} จาก ${oldStatus} เป็น ${newStatus}`
    );
  },

  /**
   * Logs when a user's house is updated.
   * @param {string} adminId - The ID of the admin.
   * @param {string} adminUsername - The username of the admin.
   * @param {string} userName - The name of the user.
   * @param {string} oldHouse - The previous house address.
   * @param {string} newHouse - The new house address.
   */
  async logUserHouseUpdated(
    adminId: string,
    adminUsername: string,
    userName: string,
    oldHouse: string | null,
    newHouse: string
  ) {
    const description = oldHouse 
      ? `เปลี่ยนบ้านของ resident ${userName} จาก ${oldHouse} เป็น ${newHouse}`
      : `กำหนดบ้าน ${newHouse} ให้ resident ${userName}`;

    return await logAdminActivity(
      adminId,
      "user_house_update",
      description
    );
  },

  /**
   * Logs when a user's role is changed.
   * @param {string} adminId - The ID of the admin.
   * @param {string} adminUsername - The username of the admin.
   * @param {string} userName - The name of the user.
   * @param {string} oldRole - The previous role.
   * @param {string} newRole - The new role.
   * @param {string} newStatus - The new status.
   */
  async logUserRoleChanged(
    adminId: string,
    adminUsername: string,
    userName: string,
    oldRole: string,
    newRole: string,
    newStatus: string
  ) {
    return await logAdminActivity(
      adminId,
      "user_role_change",
      `เปลี่ยน role ของ ${userName} จาก ${oldRole} เป็น ${newRole} (สถานะ: ${newStatus})`
    );
  },

  /**
   * Logs when a user is approved.
   * @param {string} adminId - The ID of the admin.
   * @param {string} adminUsername - The username of the admin.
   * @param {string} userType - The type of user (resident/guard).
   * @param {string} userName - The name of the user.
   * @param {string} houseNumber - The house number (if applicable).
   */
  async logUserApproved(
    adminId: string,
    adminUsername: string,
    userType: string,
    userName: string,
    houseNumber?: string
  ) {
    const description = houseNumber 
      ? `อนุมัติ${userType} ${userName} (บ้าน: ${houseNumber})`
      : `อนุมัติ${userType} ${userName}`;

    return await logAdminActivity(
      adminId,
      "user_approve",
      description
    );
  },

  /**
   * Logs when a user is rejected.
   * @param {string} adminId - The ID of the admin.
   * @param {string} adminUsername - The username of the admin.
   * @param {string} userType - The type of user (resident/guard).
   * @param {string} userName - The name of the user.
   * @param {string} reason - The reason for rejection.
   */
  async logUserRejected(
    adminId: string,
    adminUsername: string,
    userType: string,
    userName: string,
    reason: string
  ) {
    return await logAdminActivity(
      adminId,
      "user_reject",
      `ปฏิเสธ${userType} ${userName} (เหตุผล: ${reason})`
    );
  }
};
