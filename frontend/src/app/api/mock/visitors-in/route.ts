import { NextResponse } from "next/server";

/**
 * Mock route: GET /api/mock/visitors-in
 *
 * Purpose:
 * - Provide a temporary/mock list of visitors who are currently "in" the village (isIn === true).
 * - Backend integration will replace this later with real DB calls using the `isIn` column.
 *
 * Query params (optional):
 * - villageKey: string   -> filter/mock by village key (default: "demo-village")
 * - empty=1              -> force an empty list (for UI testing)
 * - isIn=true|false      -> filter flag; defaults to true. This mock respects the flag (main use is true).
 *
 * Response shape:
 * {
 *   success: boolean;
 *   data: Array<{
 *     visitorId: string;         // The primary ID you'll send when approving "out"
 *     visitor_record_id: string; // Mock record id (useful later if backend ties to records)
 *     visitorName: string;
 *     phone: string;
 *     houseNumber: string;
 *     purpose: string;
 *     entryTime: string;         // ISO string for UI formatting
 *     licensePlate?: string;
 *     imageUrl?: string;
 *     isIn: boolean;             // Always true for this endpoint by default
 *     villageKey: string;
 *   }>;
 *   total: number;
 * }
 */

type MockVisitor = {
  visitorId: string;
  visitor_record_id: string;
  visitorName: string;
  phone: string;
  houseNumber: string;
  purpose: string;
  entryTime: string;
  licensePlate?: string;
  imageUrl?: string;
  isIn: boolean;
  villageKey: string;
};

function buildMockData(villageKey: string): MockVisitor[] {
  // Fixed seed-like data for predictable results during development.
  const now = new Date();

  const toIsoOffset = (minutesAgo: number) =>
    new Date(now.getTime() - minutesAgo * 60_000).toISOString();

  return [
    {
      visitorId: "vis_1001",
      visitor_record_id: "rec_2001",
      visitorName: "สมชาย ใจดี",
      phone: "081-234-5678",
      houseNumber: "123/45",
      purpose: "ส่งพัสดุ",
      entryTime: toIsoOffset(15),
      licensePlate: "1กข 1234",
      imageUrl:
        "https://via.placeholder.com/300x200/1DB446/FFFFFF?text=Visitor+1",
      isIn: true,
      villageKey,
    },
    {
      visitorId: "vis_1002",
      visitor_record_id: "rec_2002",
      visitorName: "ศิริพร สายชิล",
      phone: "089-555-1212",
      houseNumber: "88/9",
      purpose: "เยี่ยมญาติ",
      entryTime: toIsoOffset(35),
      licensePlate: "2ขค 9876",
      imageUrl:
        "https://via.placeholder.com/300x200/00A3FF/FFFFFF?text=Visitor+2",
      isIn: true,
      villageKey,
    },
    {
      visitorId: "vis_1003",
      visitor_record_id: "rec_2003",
      visitorName: "John Doe",
      phone: "080-000-0000",
      houseNumber: "59/1",
      purpose: "ช่างซ่อมบำรุง",
      entryTime: toIsoOffset(55),
      licensePlate: "3งจ 4321",
      imageUrl:
        "https://via.placeholder.com/300x200/FF6B00/FFFFFF?text=Visitor+3",
      isIn: true,
      villageKey,
    },
    {
      // This one isIn=false to help test filtering (won't appear by default)
      visitorId: "vis_1004",
      visitor_record_id: "rec_2004",
      visitorName: "Jane Smith",
      phone: "082-333-4444",
      houseNumber: "77/77",
      purpose: "รับเอกสาร",
      entryTime: toIsoOffset(5),
      licensePlate: "6ฉช 6543",
      imageUrl:
        "https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Visitor+4",
      isIn: false,
      villageKey,
    },
  ];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const villageKey = searchParams.get("villageKey") || "demo-village";
    const forceEmpty = searchParams.get("empty") === "1";
    const isInParam = searchParams.get("isIn");
    const isInFlag =
      isInParam === null ? true : isInParam.toLowerCase() === "true";

    if (forceEmpty) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          total: 0,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const all = buildMockData(villageKey);
    const filtered = all.filter((v) => v.isIn === isInFlag);

    return NextResponse.json(
      {
        success: true,
        data: filtered,
        total: filtered.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Mock visitors-in endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal mock error",
      },
      { status: 500 }
    );
  }
}
