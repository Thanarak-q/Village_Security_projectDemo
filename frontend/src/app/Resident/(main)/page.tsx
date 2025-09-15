"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useState, useEffect } from "react";
import { Car, Clock } from "lucide-react";
import NotificationComponent from "./notification";
import {
  // ❌ remove fetchVisitorRecordsByName
  approveVisitorRequest,
  denyVisitorRequest,
  VisitorRequest as ApiVisitorRequest,
} from "@/lib/api/visitorRequests";

/** =========================================
 *  Types & Transform
 *  =======================================*/
interface VisitorRequest {
  id: string;
  plateNumber: string;
  visitorName: string;
  destination: string;
  time: string;
  carImage: string;
  status?: "approved" | "denied";
}

const transformApiData = (apiData: ApiVisitorRequest): VisitorRequest => {
  return {
    id: apiData.visitor_record_id,
    plateNumber: apiData.license_plate || "",
    visitorName: apiData.visit_purpose || "เยี่ยม",
    destination: apiData.guard_name || apiData.house_address || "รปภ.",
    time: new Date(apiData.entry_time).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    carImage: apiData.picture_key || "",
    status:
      apiData.record_status === "approved"
        ? "approved"
        : apiData.record_status === "rejected"
        ? "denied"
        : undefined,
  };
};

/** =========================================
 *  NEW: fetch by user_line_id (client-side helper)
 *  =======================================*/
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3001";

/**
 * Fetch visitor records for a specific LINE user id.
 * Adjust the endpoint/query to match your backend route.
 */
async function fetchVisitorRecordsByUserLineId(
  userLineId: string
): Promise<ApiVisitorRequest[]> {
  const url = `${API_BASE}/api/visitor-records?user_line_id=${encodeURIComponent(
    userLineId
  )}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status} for ${url}`);
  }
  const data = await res.json();
  // Expecting an array of ApiVisitorRequest
  return Array.isArray(data) ? data : data?.items ?? [];
}

/** =========================================
 *  ApprovalCards (unchanged)
 *  =======================================*/
interface ApprovalCardsProps {
  items: VisitorRequest[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

const ApprovalCards: React.FC<ApprovalCardsProps> = ({
  items,
  onApprove,
  onDeny,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const sortedPending = [...items].sort((a, b) => Number(a.id) - Number(b.id));

  const nextCard = () => {
    if (currentIndex < sortedPending.length - 1 && !isAnimating && cardRef.current) {
      setIsAnimating(true);
      gsap.to(cardRef.current, {
        x: -100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex((i) => i + 1);
          gsap.set(cardRef.current, { x: 100, opacity: 0 });
          gsap.to(cardRef.current, {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => setIsAnimating(false),
          });
        },
      });
    }
  };

  const prevCard = () => {
    if (currentIndex > 0 && !isAnimating && cardRef.current) {
      setIsAnimating(true);
      gsap.to(cardRef.current, {
        x: 100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex((i) => i - 1);
          gsap.set(cardRef.current, { x: -100, opacity: 0 });
          gsap.to(cardRef.current, {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => setIsAnimating(false),
          });
        },
      });
    }
  };

  useLayoutEffect(() => {
    if (cardRef.current) gsap.set(cardRef.current, { x: 0, opacity: 1 });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">คำขออนุมัติ</h3>
          <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full border">
            {sortedPending.length}
          </span>
        </div>

        {sortedPending.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              onClick={prevCard}
              disabled={currentIndex === 0 || isAnimating}
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 border-border hover:bg-accent"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>

            <span className="text-xs text-muted-foreground min-w-[2.5rem] text-center font-medium">
              {currentIndex + 1}/{sortedPending.length}
            </span>

            <Button
              onClick={nextCard}
              disabled={currentIndex === sortedPending.length - 1 || isAnimating}
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 border-border hover:bg-accent"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="min-h-[350px] relative overflow-hidden">
        {sortedPending.length > 0 ? (
          <div ref={cardRef}>
            <Card className="shadow-sm border-border bg-background/50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2 mb-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <Car className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base text-foreground truncate">
                      {sortedPending[currentIndex].plateNumber}
                    </div>
                    <div className="text-muted-foreground text-sm truncate">
                      {sortedPending[currentIndex].visitorName} • {sortedPending[currentIndex].destination}
                    </div>
                    <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>{sortedPending[currentIndex].time}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                    {sortedPending[currentIndex].carImage ? (
                      <img
                        src={`/${sortedPending[currentIndex].carImage}`}
                        alt={`Car ${sortedPending[currentIndex].plateNumber}`}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Car className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => onDeny(sortedPending[currentIndex].id)}
                    disabled={isAnimating}
                    variant="destructive"
                    className="px-4 py-2 text-sm rounded-lg flex-1 disabled:opacity-50 dark:bg-red-600"
                  >
                    ปฏิเสธ
                  </Button>
                  <Button
                    onClick={() => onApprove(sortedPending[currentIndex].id)}
                    disabled={isAnimating}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-lg flex-1 disabled:opacity-50 dark:bg-green-900/20 dark:text-green-400"
                  >
                    อนุมัติ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground text-sm">ไม่มีคำขออนุมัติ</p>
          </div>
        )}
      </div>
    </div>
  );
};

/** =========================================
 *  Main Resident Page
 *  =======================================*/
const ResidentPage = () => {
  const [pendingRequests, setPendingRequests] = useState<VisitorRequest[]>([]);
  const [history, setHistory] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Display name for greeting
  const TARGET_DISPLAY_NAME = "สมชาย ผาสุก";

  // Use real LIFF user id if available; fallback to your dev/test id
  const TARGET_USER_LINE_ID =
    (typeof window !== "undefined" &&
      (window as any).__LINE_USER_ID__) || // if you inject it
    process.env.NEXT_PUBLIC_TEST_LINE_USER_ID || // or from env
    "Ue529194c37fd43a24cf96d8648299d90"; // <- fallback from your logs

  useEffect(() => {
    const loadData = async () => {
      console.log(`🔄 Starting data load for LINE user: ${TARGET_USER_LINE_ID}`);

      try {
        setLoading(true);
        setError(null);

        // Optional health check
        try {
          const healthResponse = await fetch(`${API_BASE}/api/health`, {
            cache: "no-store",
          });
          console.log("🏥 Backend health check:", healthResponse.status);
        } catch (e) {
          console.warn("Health check failed (continuing):", e);
        }

        // ✅ Fetch by user_line_id instead of name
        const allVisitorData = await fetchVisitorRecordsByUserLineId(
          TARGET_USER_LINE_ID
        );

        console.log("Raw API data:", {
          allVisitorData,
          totalCount: allVisitorData?.length || 0,
        });

        const pendingData = allVisitorData.filter(
          (r) => r.record_status === "pending"
        );
        const historyData = allVisitorData.filter(
          (r) => r.record_status === "approved" || r.record_status === "rejected"
        );

        console.log("Filtered data:", {
          pendingCount: pendingData.length,
          historyCount: historyData.length,
        });

        setPendingRequests(pendingData.map(transformApiData));
        setHistory(historyData.map(transformApiData));
      } catch (err) {
        console.error("❌ Error loading visitor data:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(`ไม่สามารถโหลดข้อมูลได้: ${errorMessage}`);

        // Dev fallback
        setPendingRequests([
          {
            id: "1",
            plateNumber: "กข 1234",
            visitorName: "ส่งของ",
            destination: "รปภ. สมชาย",
            time: "09:12",
            carImage: "car1.jpg",
          },
          {
            id: "2",
            plateNumber: "ขก 5678",
            visitorName: "เยี่ยม",
            destination: "รปภ. วิทยา",
            time: "09:45",
            carImage: "car2.jpg",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [TARGET_USER_LINE_ID]);

  const handleApprove = async (id: string) => {
    const request = pendingRequests.find((req) => req.id === id);
    if (!request) return;

    const confirmed = window.confirm(
      `คุณแน่ใจหรือว่าต้องการอนุมัติคำขอสำหรับ ${request.plateNumber}?`
    );
    if (!confirmed) return;

    try {
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
      setHistory((prev) => [{ ...request, status: "approved" }, ...prev]);
      await approveVisitorRequest(id);
      console.log("Approved for:", request.plateNumber);
    } catch (error) {
      console.error("Error approving request:", error);
      setPendingRequests((prev) => [...prev, request]);
      setHistory((prev) => prev.filter((req) => req.id !== id));
      alert("เกิดข้อผิดพลาดในการอนุมัติ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDeny = async (id: string) => {
    const request = pendingRequests.find((req) => req.id === id);
    if (!request) return;

    const confirmed = window.confirm(
      `คุณแน่ใจหรือว่าต้องการปฏิเสธคำขอสำหรับ ${request.plateNumber}?`
    );
    if (!confirmed) return;

    try {
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
      setHistory((prev) => [{ ...request, status: "denied" }, ...prev]);
      await denyVisitorRequest(id);
      console.log("Denied for:", request.plateNumber);
    } catch (error) {
      console.error("Error denying request:", error);
      setPendingRequests((prev) => [...prev, request]);
      setHistory((prev) => prev.filter((req) => req.id !== id));
      alert("เกิดข้อผิดพลาดในการปฏิเสธ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-card rounded-2xl border shadow-lg">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                <Home className="w-6 h-6 sm:w-7 sm:h-7" /> หมู่บ้านร่มรื่น
              </h1>
              <span className="flex items-center gap-2">
                <ModeToggle />
                <NotificationComponent />
              </span>
            </div>
            <p className="text-sm text-muted-foreground">สวัสดี {TARGET_DISPLAY_NAME} 👋</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              📋 กำลังแสดงข้อมูลของ LINE ID: {TARGET_USER_LINE_ID}
            </p>
          </div>

          <div className="px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground text-sm">กำลังโหลดข้อมูล...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <p className="text-red-500 text-sm text-center">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  ลองใหม่
                </Button>
              </div>
            ) : (
              <ApprovalCards
                items={pendingRequests}
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            )}
          </div>

          <div className="px-4 py-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">ประวัติล่าสุด</h2>
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">ยังไม่มีประวัติ</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {history.map((item) => (
                  <Card
                    key={item.id}
                    className={`border ${
                      item.status === "approved"
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {item.plateNumber}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {item.visitorName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.destination} • {item.time}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                            item.status === "approved"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {item.status === "approved" ? "อนุมัติ" : "ปฏิเสธ"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentPage;
