import { Elysia, t } from "elysia";
import db from "../db/drizzle";
import { requireLiffAuth } from "../hooks/requireLiffAuth";
import { visitor_records, visitors, houses, villages } from "../db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

// API route group: Visitors currently inside the village (for guards)
export const visitorsInRoutes = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireLiffAuth(["guard"]))
  .get(
    "/visitors-in",
    async ({ query, currentUser, set }) => {
      try {
        // Ensure guard has a village context
        const villageId: string | undefined =
          (currentUser?.village_ids && currentUser.village_ids[0]) ||
          currentUser?.village_id;

        if (!villageId) {
          set.status = 400;
          return {
            success: false,
            error:
              "Missing village context. Guard must be associated with a village.",
          };
        }

        // Parse and sanitize query params
        const isInParam = query.isIn;
        const isIn =
          typeof isInParam === "string"
            ? isInParam === "true"
            : isInParam === undefined
              ? true
              : Boolean(isInParam);

        const limitNum =
          typeof query.limit === "string"
            ? Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100)
            : 20;
        const offsetNum =
          typeof query.offset === "string"
            ? Math.max(parseInt(query.offset, 10) || 0, 0)
            : 0;

        // Total count query
        const [{ count }] = await db
          .select({
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(visitor_records)
          .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
          .where(
            and(
              eq(houses.village_id, villageId),
              eq(visitor_records.is_in, isIn),
            ),
          );

        // Main list query
        const rows = await db
          .select({
            visitor_record_id: visitor_records.visitor_record_id,
            // join fields
            visitor_id: visitor_records.visitor_id,
            picture_key: visitor_records.picture_key,
            license_plate: visitor_records.license_plate,
            entry_time: visitor_records.entry_time,
            is_in: visitor_records.is_in,
            visit_purpose: visitor_records.visit_purpose,
            house_address: houses.address,
            village_key: villages.village_key,
            // visitor details (nullable)
            visitor_fname: visitors.fname,
            visitor_lname: visitors.lname,
            visitor_phone: visitors.phone,
          })
          .from(visitor_records)
          .leftJoin(
            visitors,
            eq(visitor_records.visitor_id, visitors.visitor_id),
          )
          .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
          .innerJoin(villages, eq(houses.village_id, villages.village_id))
          .where(
            and(
              eq(houses.village_id, villageId),
              eq(visitor_records.is_in, isIn),
            ),
          )
          .orderBy(visitor_records.entry_time)
          .limit(limitNum)
          .offset(offsetNum);

        // Map to frontend payload shape
        const data = rows.map((r) => {
          const visitorName =
            `${r.visitor_fname ?? ""} ${r.visitor_lname ?? ""}`
              .trim()
              .replace(/\s+/g, " ");
          const nameOrFallback =
            visitorName.length > 0 ? visitorName : "ผู้เยี่ยม";

          return {
            // Keep both for compatibility with the current UI (uses visitorId for keys)
            visitorId: r.visitor_record_id,
            visitor_record_id: r.visitor_record_id,
            visitorName: nameOrFallback,
            phone: r.visitor_phone ?? "-",
            houseNumber: r.house_address ?? "-",
            purpose: r.visit_purpose ?? "-",
            entryTime:
              r.entry_time?.toISOString?.() ?? new Date().toISOString(),
            licensePlate: r.license_plate ?? undefined,
            isIn: r.is_in ?? false,
            villageKey: r.village_key ?? "",
          };
        });

        return {
          success: true,
          total: count ?? 0,
          data,
        };
      } catch (error) {
        console.error("Error fetching visitors-in list:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to fetch visitors currently in the village",
        };
      }
    },
    {
      query: t.Object(
        {
          isIn: t.Optional(t.Union([t.String(), t.Boolean()])),
          limit: t.Optional(t.String()),
          offset: t.Optional(t.String()),
        },
        { additionalProperties: true },
      ),
    },
  )
  .post(
    "/visitors-in/approve-out",
    async ({ body, currentUser, set }) => {
      try {
        const villageId: string | undefined =
          (currentUser?.village_ids && currentUser.village_ids[0]) ||
          currentUser?.village_id;

        if (!villageId) {
          set.status = 400;
          return {
            success: false,
            error:
              "Missing village context. Guard must be associated with a village.",
          };
        }

        const { visitorId } = (body || {}) as { visitorId?: string };

        if (!visitorId || typeof visitorId !== "string" || !visitorId.trim()) {
          set.status = 400;
          return {
            success: false,
            error: "visitorId is required and must be a non-empty string.",
          };
        }

        // Ensure the record exists and belongs to the guard's village
        const rec = await db
          .select({
            id: visitor_records.visitor_record_id,
            is_in: visitor_records.is_in,
          })
          .from(visitor_records)
          .innerJoin(houses, eq(visitor_records.house_id, houses.house_id))
          .where(
            and(
              eq(visitor_records.visitor_record_id, visitorId),
              eq(houses.village_id, villageId),
            ),
          )
          .limit(1);

        if (!rec || rec.length === 0) {
          set.status = 404;
          return {
            success: false,
            error:
              "Visitor record not found in your village or already removed.",
          };
        }

        // If already out, keep idempotent behavior and just return success
        if (rec[0].is_in === false) {
          return {
            success: true,
            message: "Visitor already marked as out.",
          };
        }

        const [updated] = await db
          .update(visitor_records)
          .set({
            is_in: false,
            exit_time: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(visitor_records.visitor_record_id, visitorId))
          .returning({
            visitor_record_id: visitor_records.visitor_record_id,
            is_in: visitor_records.is_in,
            exit_time: visitor_records.exit_time,
          });

        return {
          success: true,
          data: updated,
          message: "Visitor marked as out successfully.",
        };
      } catch (error) {
        console.error("Error approving visitor out:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to approve visitor out",
        };
      }
    },
    {
      body: t.Object({
        visitorId: t.String(),
      }),
    },
  );

export default visitorsInRoutes;
