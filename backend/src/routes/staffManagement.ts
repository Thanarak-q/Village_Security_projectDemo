import { Elysia, t } from "elysia";
import db from "../db/drizzle";
import { admins, villages, admin_villages } from "../db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";
import { hashPassword } from "../utils/passwordUtils";
import { randomBytes } from "crypto";

// Type definitions
interface AddStaffBody {
  username: string;
  village_id: string;
}



/**
 * Legal Entity Management Routes
 * Accessible by: admin and superadmin
 * @type {Elysia}
 */
export const staffManagementRoutes = new Elysia({ prefix: "/api/staff" })
  .onBeforeHandle(requireRole(["admin", "superadmin"]))

  /**
   * Add a new staff member (legal entity)
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} Success message with generated credentials
   */
  .post("/add-staff", async ({ body, set, currentUser }: { body: AddStaffBody; set: any; currentUser: any }) => {
    try {
      const { username, village_id } = body;

      // Validate required fields
      if (!username || !village_id) {
        set.status = 400;
        return { 
          success: false, 
          error: "กรุณากรอกข้อมูลให้ครบถ้วน" 
        };
      }

      // Create prefixed username with "staff_" prefix
      const prefixedUsername = `staff_${username}`;

      // Check if village exists
      const village = await db
        .select()
        .from(villages)
        .where(eq(villages.village_id, village_id))
        .limit(1);

      if (village.length === 0) {
        set.status = 404;
        return { 
          success: false, 
          error: "ไม่พบหมู่บ้านที่ระบุ" 
        };
      }

      // Check if prefixed username already exists
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.username, prefixedUsername))
        .limit(1);

      if (existingAdmin.length > 0) {
        set.status = 409;
        return { 
          success: false, 
          error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" 
        };
      }

      // Generate password (8 characters)
      const password = randomBytes(4).toString('hex'); // 8 characters
      const hashedPassword = await hashPassword(password);

      // Create new staff admin
      const newStaff = await db
        .insert(admins)
        .values({
          username: prefixedUsername,
          email: null, // No email required
          phone: null, // No phone required
          password_hash: hashedPassword,
          role: "staff",
          status: "verified",
        })
        .returning();

      // Create admin_village relationship
      await db
        .insert(admin_villages)
        .values({
          admin_id: newStaff[0].admin_id,
          village_id: village_id,
        });

      return {
        success: true,
        message: "เพิ่มนิติบุคคลสำเร็จ",
        data: {
          admin_id: newStaff[0].admin_id,
          username: prefixedUsername,
          original_username: username, // Keep original for reference
          password,
          village_id: village_id,
          village_name: village[0].village_name,
          role: "staff",
          status: "verified",
          created_at: newStaff[0].createdAt
        }
      };
    } catch (error) {
      console.error("Error adding staff:", error);
      set.status = 500;
      return { 
        success: false, 
        error: "เกิดข้อผิดพลาดในการเพิ่มนิติบุคคล" 
      };
    }
  })

  /**
   * Get all staff members (legal entities) for a specific village
   * @param {Object} context - The context for the request.
   * @param {Object} context.query - The query parameters.
   * @returns {Promise<Object>} List of staff members
   */
  .get("/staff", async ({ query, set, currentUser, request }: { query: any; set: any; currentUser: any; request: any }) => {
    try {
      // Extract village_id from query parameters
      let village_id = query?.village_id;
      
      // Fallback: if query parsing fails, try to extract from URL
      if (!village_id && request?.url) {
        const url = new URL(request.url);
        village_id = url.searchParams.get('village_id');
      }

      if (!village_id || typeof village_id !== 'string') {
        set.status = 400;
        return { 
          success: false, 
          error: "กรุณาระบุ village_id" 
        };
      }

      // Check if village exists
      const village = await db
        .select()
        .from(villages)
        .where(eq(villages.village_id, village_id))
        .limit(1);

      if (village.length === 0) {
        set.status = 404;
        return { 
          success: false, 
          error: "ไม่พบหมู่บ้านที่ระบุ" 
        };
      }

      // Get all staff members for the village
      const staffMembers = await db
        .select({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          phone: admins.phone,
          role: admins.role,
          password_changed_at: admins.password_changed_at,
          created_at: admins.createdAt,
          updated_at: admins.updatedAt,
          village_id: villages.village_id,
          village_name: villages.village_name,
        })
        .from(admins)
        .innerJoin(admin_villages, eq(admins.admin_id, admin_villages.admin_id))
        .innerJoin(villages, eq(admin_villages.village_id, villages.village_id))
        .where(
          and(
            eq(admin_villages.village_id, village_id),
            eq(admins.role, "staff"),
            isNull(admins.disable_at)
          )
        )
        .orderBy(desc(admins.createdAt));

      return {
        success: true,
        data: staffMembers,
        village_name: village[0].village_name
      };
    } catch (error) {
      console.error("Error fetching staff members:", error);
      set.status = 500;
      return { 
        success: false, 
        error: "เกิดข้อผิดพลาดในการดึงข้อมูลนิติบุคคล" 
      };
    }
  })

  /**
   * Get staff member details by ID
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Staff member details
   */
  .get("/staff/:id", async ({ params, set, currentUser }: { params: { id: string }; set: any; currentUser: any }) => {
    try {
      const { id } = params;

      const staffMember = await db
        .select({
          admin_id: admins.admin_id,
          username: admins.username,
          role: admins.role,
          created_at: admins.createdAt,
          updated_at: admins.updatedAt,
          village_id: villages.village_id,
          village_name: villages.village_name,
        })
        .from(admins)
        .innerJoin(admin_villages, eq(admins.admin_id, admin_villages.admin_id))
        .innerJoin(villages, eq(admin_villages.village_id, villages.village_id))
        .where(
          and(
            eq(admins.admin_id, id),
            eq(admins.role, "staff")
          )
        )
        .limit(1);

      if (staffMember.length === 0) {
        set.status = 404;
        return { 
          success: false, 
          error: "ไม่พบนิติบุคคลที่ระบุ" 
        };
      }

      return {
        success: true,
        data: staffMember[0]
      };
    } catch (error) {
      console.error("Error fetching staff member:", error);
      set.status = 500;
      return { 
        success: false, 
        error: "เกิดข้อผิดพลาดในการดึงข้อมูลนิติบุคคล" 
      };
    }
  })


  /**
   * Delete staff member
   * @param {Object} context - The context for the request.
   * @param {Object} context.params - The route parameters.
   * @returns {Promise<Object>} Success message
   */
  .delete("/staff/:id", async ({ params, set, currentUser }: { params: { id: string }; set: any; currentUser: any }) => {
    try {
      const { id } = params;

      // Check if staff member exists
      const staffMember = await db
        .select()
        .from(admins)
        .where(
          and(
            eq(admins.admin_id, id),
            eq(admins.role, "staff")
          )
        )
        .limit(1);

      if (staffMember.length === 0) {
        set.status = 404;
        return { 
          success: false, 
          error: "ไม่พบนิติบุคคลที่ระบุ" 
        };
      }

      // Delete admin_village relationship first
      await db
        .delete(admin_villages)
        .where(eq(admin_villages.admin_id, id));

      // Soft delete staff member
      await db
        .update(admins)
        .set({ 
          disable_at: new Date(),
          status: "disable"
        })
        .where(eq(admins.admin_id, id));

      return {
        success: true,
        message: "ลบนิติบุคคลสำเร็จ"
      };
    } catch (error) {
      console.error("Error deleting staff member:", error);
      set.status = 500;
      return { 
        success: false, 
        error: "เกิดข้อผิดพลาดในการลบนิติบุคคล" 
      };
    }
  });
