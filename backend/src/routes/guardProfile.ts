import { Elysia } from "elysia";
import db from "../db/drizzle";
import { guards } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireLiffAuth } from "../hooks/requireLiffAuth";

export const guardProfileRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireLiffAuth(["guard"]))
  
  /**
   * Update guard profile information (fname, lname, email, phone)
   * Only allows guards to update their own profile
   */
  .put("/guard/profile", async ({ body, currentUser, set }: any) => {
    try {
      const { fname, lname, email, phone } = body as {
        fname?: string;
        lname?: string;
        email?: string;
        phone?: string;
      };

      // Validate that current user is a guard
      if (currentUser.role !== "guard") {
        set.status = 403;
        return {
          success: false,
          error: "Access denied. Only guards can update guard profiles.",
        };
      }

      // Validate required fields
      if (!fname || !lname || !email || !phone) {
        set.status = 400;
        return {
          success: false,
          error: "Missing required fields: fname, lname, email, phone",
        };
      }

      // Validate field lengths and formats
      if (fname.trim().length === 0) {
        set.status = 400;
        return {
          success: false,
          error: "ชื่อไม่สามารถเป็นค่าว่างได้",
        };
      }

      if (lname.trim().length === 0) {
        set.status = 400;
        return {
          success: false,
          error: "นามสกุลไม่สามารถเป็นค่าว่างได้",
        };
      }

      if (email.trim().length === 0) {
        set.status = 400;
        return {
          success: false,
          error: "อีเมลไม่สามารถเป็นค่าว่างได้",
        };
      }

      if (phone.trim().length === 0) {
        set.status = 400;
        return {
          success: false,
          error: "เบอร์โทรศัพท์ไม่สามารถเป็นค่าว่างได้",
        };
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        set.status = 400;
        return {
          success: false,
          error: "รูปแบบอีเมลไม่ถูกต้อง",
        };
      }

      // Phone format validation (Thai phone number - 10 digits)
      const phoneRegex = /^[0-9]{10}$/;
      const cleanPhone = phone.replace(/-/g, "").replace(/\s/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        set.status = 400;
        return {
          success: false,
          error: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก",
        };
      }

      // Check if guard exists
      const existingGuard = await db
        .select()
        .from(guards)
        .where(eq(guards.guard_id, currentUser.id));

      if (existingGuard.length === 0) {
        set.status = 404;
        return {
          success: false,
          error: "ไม่พบข้อมูลยามรักษาความปลอดภัย",
        };
      }

      // Check if email is already used by another guard
      if (email !== existingGuard[0].email) {
        const emailExists = await db
          .select()
          .from(guards)
          .where(eq(guards.email, email));

        if (emailExists.length > 0) {
          set.status = 400;
          return {
            success: false,
            error: "อีเมลนี้ถูกใช้งานแล้ว",
          };
        }
      }

      // Update guard profile
      const updateResult = await db
        .update(guards)
        .set({
          fname: fname.trim(),
          lname: lname.trim(),
          email: email.trim(),
          phone: cleanPhone,
          updatedAt: new Date(),
        })
        .where(eq(guards.guard_id, currentUser.id))
        .returning();

      if (updateResult.length === 0) {
        set.status = 500;
        return {
          success: false,
          error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
        };
      }

      return {
        success: true,
        message: "อัปเดตข้อมูลส่วนตัวสำเร็จ",
        data: {
          guard_id: updateResult[0].guard_id,
          fname: updateResult[0].fname,
          lname: updateResult[0].lname,
          email: updateResult[0].email,
          phone: updateResult[0].phone,
          updatedAt: updateResult[0].updatedAt,
        },
      };
    } catch (error) {
      console.error("Error updating guard profile:", error);
      set.status = 500;
      return {
        success: false,
        error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
      };
    }
  })

  /**
   * Get current guard's profile information
   */
  .get("/guard/profile", async ({ currentUser, set }: any) => {
    try {
      // Validate that current user is a guard
      if (currentUser.role !== "guard") {
        set.status = 403;
        return {
          success: false,
          error: "Access denied. Only guards can access guard profiles.",
        };
      }

      // Get guard profile
      const guard = await db
        .select({
          guard_id: guards.guard_id,
          line_user_id: guards.line_user_id,
          line_display_name: guards.line_display_name,
          line_profile_url: guards.line_profile_url,
          email: guards.email,
          fname: guards.fname,
          lname: guards.lname,
          phone: guards.phone,
          village_id: guards.village_id,
          status: guards.status,
          hired_date: guards.hired_date,
          createdAt: guards.createdAt,
          updatedAt: guards.updatedAt,
        })
        .from(guards)
        .where(eq(guards.guard_id, currentUser.id));

      if (guard.length === 0) {
        set.status = 404;
        return {
          success: false,
          error: "ไม่พบข้อมูลยามรักษาความปลอดภัย",
        };
      }

      return {
        success: true,
        data: guard[0],
      };
    } catch (error) {
      console.error("Error fetching guard profile:", error);
      set.status = 500;
      return {
        success: false,
        error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
      };
    }
  });
