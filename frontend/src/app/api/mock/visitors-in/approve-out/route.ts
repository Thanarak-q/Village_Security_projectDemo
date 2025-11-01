import { NextResponse } from "next/server";

/**
 * Mock route: POST /api/mock/visitors-in/approve-out
 *
 * Purpose:
 * - Temporarily "approve" a visitor as out of the village based on visitorId.
 * - Backend will later replace this with real DB updates that flip `isIn` to false
 *   and record exit time in the corresponding tables.
 *
 * Request body (JSON):
 * {
 *   "visitorId": "vis_1001"
 * }
 *
 * Response:
 * 200:
 * {
 *   "success": true,
 *   "data": {
 *     "visitorId": "vis_1001",
 *     "status": "out",
 *     "approvedAt": "<ISO timestamp>"
 *   },
 *   "message": "Visitor has been approved as out (mock)"
 * }
 *
 * 400:
 * {
 *   "success": false,
 *   "error": "visitorId is required and must be a string"
 * }
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be application/json" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const visitorId = typeof body?.visitorId === "string" ? body.visitorId.trim() : "";

    if (!visitorId) {
      return NextResponse.json(
        { success: false, error: "visitorId is required and must be a string" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Simulate processing delay (optional)
    await new Promise((r) => setTimeout(r, 150));

    // Mock success response
    return NextResponse.json(
      {
        success: true,
        data: {
          visitorId,
          status: "out",
          approvedAt: new Date().toISOString(),
        },
        message: "Visitor has been approved as out (mock)",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    // Mock internal error
    const msg = error instanceof Error ? error.message : "Internal mock error";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
