import { Elysia } from "elysia";
import db from "../db/drizzle";
import { residents } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireLiffAuth } from "../hooks/requireLiffAuth";

export const residentProfileRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireLiffAuth(["resident"]))
  
  /**
   * Update resident profile information (fname, lname, email, phone)
   * Only allows residents to update their own profile
   */
  .put("/resident/profile", async ({ body, currentUser, set }: any) => {
    try {
      const { fname, lname, email, phone } = body as {
        fname?: string;
        lname?: string;
        email?: string;
        phone?: string;
      };

      // Validate that current user is a resident
      if (currentUser.role !== "resident") {
        set.status = 403;
        return {
          success: false,
          error: "Access denied. Only residents can update resident profiles.",
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

      // Check if resident exists
      const existingResident = await db
        .select()
        .from(residents)
        .where(eq(residents.resident_id, currentUser.id));

      if (existingResident.length === 0) {
        set.status = 404;
        return {
          success: false,
          error: "ไม่พบข้อมูลผู้อยู่อาศัย",
        };
      }

      // Check if email is already used by another resident
      if (email !== existingResident[0].email) {
        const emailExists = await db
          .select()
          .from(residents)
          .where(eq(residents.email, email));

        if (emailExists.length > 0) {
          set.status = 400;
          return {
            success: false,
            error: "อีเมลนี้ถูกใช้งานแล้ว",
          };
        }
      }

      // Update resident profile
      const updateResult = await db
        .update(residents)
        .set({
          fname: fname.trim(),
          lname: lname.trim(),
          email: email.trim(),
          phone: cleanPhone,
          updatedAt: new Date(),
        })
        .where(eq(residents.resident_id, currentUser.id))
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
          resident_id: updateResult[0].resident_id,
          fname: updateResult[0].fname,
          lname: updateResult[0].lname,
          email: updateResult[0].email,
          phone: updateResult[0].phone,
          updatedAt: updateResult[0].updatedAt,
        },
      };
    } catch (error) {
      console.error("Error updating resident profile:", error);
      set.status = 500;
      return {
        success: false,
        error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
      };
    }
  })

  /**
   * Get current resident's profile information
   */
  .get("/resident/profile", async ({ currentUser, set }: any) => {
    try {
      // Validate that current user is a resident
      if (currentUser.role !== "resident") {
        set.status = 403;
        return {
          success: false,
          error: "Access denied. Only residents can access resident profiles.",
        };
      }

      // Get resident profile
      const resident = await db
        .select({
          resident_id: residents.resident_id,
          line_user_id: residents.line_user_id,
          line_display_name: residents.line_display_name,
          line_profile_url: residents.line_profile_url,
          email: residents.email,
          fname: residents.fname,
          lname: residents.lname,
          phone: residents.phone,
          village_id: residents.village_id,
          status: residents.status,
          move_in_date: residents.move_in_date,
          createdAt: residents.createdAt,
          updatedAt: residents.updatedAt,
        })
        .from(residents)
        .where(eq(residents.resident_id, currentUser.id));

      if (resident.length === 0) {
        set.status = 404;
        return {
          success: false,
          error: "ไม่พบข้อมูลผู้อยู่อาศัย",
        };
      }

      return {
        success: true,
        data: resident[0],
      };
    } catch (error) {
      console.error("Error fetching resident profile:", error);
      set.status = 500;
      return {
        success: false,
        error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
      };
    }
  });
