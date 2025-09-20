import { Elysia } from "elysia";
import db from "../db/drizzle";
import { admins, villages, residents, guards, houses } from "../db/schema";
import { eq, count, sql } from "drizzle-orm";
import { requireRole } from "../hooks/requireRole";

/**
 * Super Admin System Overview/Stats Routes
 * Accessible by: superadmin only
 * @type {Elysia}
 */
export const superAdminStatsRoutes = new Elysia({ prefix: "/api/superadmin" })
  .onBeforeHandle(requireRole(["superadmin"]))

  /**
   * Get system overview statistics
   * @returns {Promise<Object>} System statistics
   */
  .get("/stats", async ({ set }) => {
    try {
      // Get total counts
      const [
        totalVillages,
        totalAdmins,
        totalResidents,
        totalGuards,
        totalHouses
      ] = await Promise.all([
        db.select({ count: count() }).from(villages),
        db.select({ count: count() }).from(admins),
        db.select({ count: count() }).from(residents),
        db.select({ count: count() }).from(guards),
        db.select({ count: count() }).from(houses)
      ]);

      // Get admin counts by role
      const adminByRole = await db
        .select({
          role: admins.role,
          count: count()
        })
        .from(admins)
        .groupBy(admins.role);

      // Get admin counts by status
      const adminByStatus = await db
        .select({
          status: admins.status,
          count: count()
        })
        .from(admins)
        .groupBy(admins.status);

      // Get villages with admin count
      const villagesWithAdminCount = await db
        .select({
          village_id: villages.village_id,
          village_name: villages.village_name,
          village_key: villages.village_key,
          admin_count: count(admins.admin_id),
        })
        .from(villages)
        .leftJoin(admins, eq(villages.village_key, admins.village_key))
        .groupBy(villages.village_id, villages.village_name, villages.village_key)
        .orderBy(villages.village_name);

      // Get recent admins (last 10)
      const recentAdmins = await db
        .select({
          admin_id: admins.admin_id,
          username: admins.username,
          email: admins.email,
          role: admins.role,
          status: admins.status,
          village_key: admins.village_key,
          village_name: villages.village_name,
          createdAt: admins.createdAt,
        })
        .from(admins)
        .leftJoin(villages, eq(admins.village_key, villages.village_key))
        .orderBy(sql`${admins.createdAt} DESC`)
        .limit(10);

      // Get villages without admins
      const villagesWithoutAdmins = villagesWithAdminCount.filter(v => v.admin_count === 0);

      // Calculate statistics
      const stats = {
        overview: {
          totalVillages: totalVillages[0].count,
          totalAdmins: totalAdmins[0].count,
          totalResidents: totalResidents[0].count,
          totalGuards: totalGuards[0].count,
          totalHouses: totalHouses[0].count,
        },
        adminBreakdown: {
          byRole: adminByRole.reduce((acc, item) => {
            acc[item.role] = item.count;
            return acc;
          }, {} as Record<string, number>),
          byStatus: adminByStatus.reduce((acc, item) => {
            if (item.status) {
              acc[item.status] = item.count;
            }
            return acc;
          }, {} as Record<string, number>),
        },
        villages: {
          total: totalVillages[0].count,
          withAdmins: villagesWithAdminCount.filter(v => v.admin_count > 0).length,
          withoutAdmins: villagesWithoutAdmins.length,
          list: villagesWithAdminCount,
        },
        recentActivity: {
          recentAdmins: recentAdmins,
        },
        alerts: {
          villagesWithoutAdmins: villagesWithoutAdmins.length > 0 ? villagesWithoutAdmins : [],
          pendingAdmins: adminByStatus.find(s => s.status === 'pending')?.count || 0,
          disabledAdmins: adminByStatus.find(s => s.status === 'disable')?.count || 0,
        }
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("Error fetching system stats:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch system statistics" };
    }
  });
