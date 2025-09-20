"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Car, Clock, Home, ChevronLeft, ChevronRight } from "lucide-react";
// import NotificationComponent from "../../dashboard/(main)/notification";
import { useRouter } from "next/navigation";
import {
  getAuthData,
  isAuthenticated,
  LiffUser,
  clearAuthData,
} from "@/lib/liffAuth";
import { gsap } from "gsap";
import { ModeToggle } from "@/components/mode-toggle";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import Image from "next/image";

interface VisitorRequest {
  id: string;
  plateNumber: string;
  visitorName: string;
  destination: string;
  time: string;
  carImage: string;
  status?: "approved" | "denied";
}

interface ApprovalCardsProps {
  items: VisitorRequest[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  villageName: string;
  villageNameError: string | null;
}

interface ApiVisitorRequest {
  visitor_record_id: string;
  resident_id: string;
  guard_id: string;
  house_id: string;
  picture_key?: string;
  visitor_name?: string;
  visitor_id_card?: string;
  license_plate?: string;
  entry_time: string;
  record_status: "pending" | "approved" | "rejected";
  visit_purpose?: string;
  createdAt: string;
  updatedAt: string;
  resident_name: string;
  resident_email: string;
  guard_name: string;
  guard_email: string;
  house_address: string;
  village_key: string;
}

// API functions for fetching visitor records by LINE user ID
const fetchPendingVisitorRequests = async (
  lineUserId: string
): Promise<ApiVisitorRequest[]> => {
  const response = await fetch(
    `/api/visitor-requests/pending/line/${encodeURIComponent(lineUserId)}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch pending visitor requests: ${response.statusText}`
    );
  }
  const result = await response.json();
  return result.success ? result.data : [];
};

const fetchVisitorHistory = async (
  lineUserId: string
): Promise<ApiVisitorRequest[]> => {
  const response = await fetch(
    `/api/visitor-requests/history/line/${encodeURIComponent(lineUserId)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch visitor history: ${response.statusText}`);
  }
  const result = await response.json();
  return result.success ? result.data : [];
};

const approveVisitorRequest = async (id: string): Promise<void> => {
  const response = await fetch(`/api/visitor-requests/${id}/approve`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Failed to approve request: ${response.statusText}`);
  }
};

const denyVisitorRequest = async (id: string): Promise<void> => {
  const response = await fetch(`/api/visitor-requests/${id}/deny`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Failed to deny request: ${response.statusText}`);
  }
};

const fetchVillageName = async (villageKey: string): Promise<string> => {
  console.log("🔍 Fetching village name for key:", villageKey);
  const response = await fetch(
    `/api/villages/check/${encodeURIComponent(villageKey)}`
  );
  console.log("📡 Village API response status:", response.status);
  if (!response.ok) {
    console.error("❌ Village API error:", response.statusText);
    throw new Error(`Failed to fetch village info: ${response.statusText}`);
  }
  const result = await response.json();
  console.log("📋 Village API result:", result);
  if (result.exists && result.village_name) {
    console.log("✅ Village name found:", result.village_name);
    return result.village_name;
  }
  console.error("❌ Village not found in result:", result);
  throw new Error(`Village not found for key: ${villageKey}`);
};

const transformApiData = (apiData: ApiVisitorRequest): VisitorRequest => {
  // Format the entry time to display format
  const entryTime = new Date(apiData.entry_time);
  const timeString = entryTime.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return {
    id: apiData.visitor_record_id,
    plateNumber: apiData.license_plate || "ไม่ระบุ",
    visitorName: apiData.visitor_name || apiData.visit_purpose || "ไม่ระบุ",
    destination: apiData.house_address,
    time: timeString,
    carImage: apiData.picture_key || "car1.jpg", // fallback to default image
    status:
      apiData.record_status === "approved"
        ? "approved"
        : apiData.record_status === "rejected"
        ? "denied"
        : undefined,
  };
};

const ApprovalCards: React.FC<ApprovalCardsProps> = ({
  items,
  onApprove,
  onDeny,
  villageName,
  villageNameError,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dragOffset, setDragOffset] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [lastTouchTime, setLastTouchTime] = useState<number | null>(null);
  const [lastTouchX, setLastTouchX] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [velocity, setVelocity] = useState(0);

  // Sort by smallest id first
  const sortedPending = [...items].sort((a, b) => Number(a.id) - Number(b.id));

  const nextCard = (skipCount: number = 1) => {
    const newIndex = Math.min(
      currentIndex + skipCount,
      sortedPending.length - 1
    );
    if (newIndex !== currentIndex && !isAnimating && cardRef.current) {
      setIsAnimating(true);
      // card out to the left
      gsap.to(cardRef.current, {
        x: -100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex(newIndex);
          // Reset position and animate in from right
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

  const prevCard = (skipCount: number = 1) => {
    const newIndex = Math.max(currentIndex - skipCount, 0);
    if (newIndex !== currentIndex && !isAnimating && cardRef.current) {
      setIsAnimating(true);
      // card out to the right
      gsap.to(cardRef.current, {
        x: 100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex(newIndex);
          // Reset position and animate in from left
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

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    const now = Date.now();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartTime(now);
    setLastTouchTime(now);
    setLastTouchX(e.targetTouches[0].clientX);
    setVelocity(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isAnimating) return;
    const currentTouch = e.targetTouches[0].clientX;
    const now = Date.now();
    const diff = currentTouch - touchStart;

    // Calculate velocity based on recent movement
    if (lastTouchTime && lastTouchX !== null) {
      const timeDiff = now - lastTouchTime;
      const distanceDiff = Math.abs(currentTouch - lastTouchX);
      if (timeDiff > 0) {
        const currentVelocity = distanceDiff / timeDiff;
        setVelocity(currentVelocity);
      }
    }

    setDragOffset(diff);
    setTouchEnd(currentTouch);
    setLastTouchTime(now);
    setLastTouchX(currentTouch);

    // Apply visual feedback that follows finger movement
    if (cardRef.current) {
      gsap.set(cardRef.current, { x: diff * 0.4 });
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isAnimating || !touchStartTime) return;

    const now = Date.now();
    const totalTime = now - touchStartTime;
    const diff = touchStart - touchEnd;

    // Calculate final velocity
    const finalVelocity = Math.abs(diff) / totalTime;

    // Calculate how many cards to skip based on velocity and distance
    let skipCount = 1;
    const absDiff = Math.abs(diff);

    if (finalVelocity > 1.5) {
      // Very fast swipe - skip multiple cards
      skipCount = Math.min(Math.floor(absDiff / 80) + 1, 5); // Max 5 cards
    } else if (finalVelocity > 1.0) {
      // Fast swipe - skip 2-3 cards
      skipCount = Math.min(Math.floor(absDiff / 100) + 1, 3);
    } else if (finalVelocity > 0.5) {
      // Medium-fast swipe - skip 1-2 cards
      skipCount = Math.min(Math.floor(absDiff / 120) + 1, 2);
    } else if (finalVelocity > 0.2) {
      // Medium swipe - normal single card
      skipCount = 1;
    } else {
      // Slow swipe - normal single card
      skipCount = 1;
    }

    // Dynamic thresholds based on velocity and distance
    let minDistance = 30; // Base minimum distance

    if (finalVelocity > 1.0) {
      // Very fast swipe - very low threshold
      minDistance = 15;
    } else if (finalVelocity > 0.5) {
      // Fast swipe - low threshold
      minDistance = 25;
    } else if (finalVelocity > 0.2) {
      // Medium swipe - normal threshold
      minDistance = 40;
    } else {
      // Slow swipe - higher threshold
      minDistance = 60;
    }

    const isLeftSwipe = diff > minDistance;
    const isRightSwipe = diff < -minDistance;

    // Reset drag state
    setIsDragging(false);
    setDragOffset(0);

    if (isLeftSwipe && currentIndex < sortedPending.length - 1) {
      nextCard(skipCount);
    } else if (isRightSwipe && currentIndex > 0) {
      prevCard(skipCount);
    } else {
      // Snap back to center with velocity-based duration
      if (cardRef.current) {
        const snapDuration = Math.min(0.6, Math.max(0.15, finalVelocity * 0.2));
        gsap.to(cardRef.current, {
          x: 0,
          duration: snapDuration,
          ease: "power2.out",
        });
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartTime(null);
    setLastTouchTime(null);
    setLastTouchX(null);
    setVelocity(0);
  };

  // Mouse event handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    const now = Date.now();
    setTouchEnd(null);
    setTouchStart(e.clientX);
    setTouchStartTime(now);
    setLastTouchTime(now);
    setLastTouchX(e.clientX);
    setVelocity(0);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStart || isAnimating) return;
    const now = Date.now();
    const diff = e.clientX - touchStart;

    // Calculate velocity based on recent movement
    if (lastTouchTime && lastTouchX !== null) {
      const timeDiff = now - lastTouchTime;
      const distanceDiff = Math.abs(e.clientX - lastTouchX);
      if (timeDiff > 0) {
        const currentVelocity = distanceDiff / timeDiff;
        setVelocity(currentVelocity);
      }
    }

    setDragOffset(diff);
    setTouchEnd(e.clientX);
    setLastTouchTime(now);
    setLastTouchX(e.clientX);

    if (cardRef.current) {
      gsap.set(cardRef.current, { x: diff * 0.4 });
    }
  };

  const handleMouseUp = () => {
    if (!touchStart || isAnimating || !touchStartTime) return;

    const now = Date.now();
    const totalTime = now - touchStartTime;
    const diff = touchStart - (touchEnd || touchStart);

    // Calculate final velocity
    const finalVelocity = Math.abs(diff) / totalTime;

    // Calculate how many cards to skip based on velocity and distance
    let skipCount = 1;
    const absDiff = Math.abs(diff);

    if (finalVelocity > 1.5) {
      // Very fast swipe - skip multiple cards
      skipCount = Math.min(Math.floor(absDiff / 80) + 1, 5); // Max 5 cards
    } else if (finalVelocity > 1.0) {
      // Fast swipe - skip 2-3 cards
      skipCount = Math.min(Math.floor(absDiff / 100) + 1, 3);
    } else if (finalVelocity > 0.5) {
      // Medium-fast swipe - skip 1-2 cards
      skipCount = Math.min(Math.floor(absDiff / 120) + 1, 2);
    } else if (finalVelocity > 0.2) {
      // Medium swipe - normal single card
      skipCount = 1;
    } else {
      // Slow swipe - normal single card
      skipCount = 1;
    }

    // Dynamic thresholds based on velocity and distance
    let minDistance = 30; // Base minimum distance

    if (finalVelocity > 1.0) {
      // Very fast swipe - very low threshold
      minDistance = 15;
    } else if (finalVelocity > 0.5) {
      // Fast swipe - low threshold
      minDistance = 25;
    } else if (finalVelocity > 0.2) {
      // Medium swipe - normal threshold
      minDistance = 40;
    } else {
      // Slow swipe - higher threshold
      minDistance = 60;
    }

    const isLeftSwipe = diff > minDistance;
    const isRightSwipe = diff < -minDistance;

    setIsDragging(false);
    setDragOffset(0);

    if (isLeftSwipe && currentIndex < sortedPending.length - 1) {
      nextCard(skipCount);
    } else if (isRightSwipe && currentIndex > 0) {
      prevCard(skipCount);
    } else {
      // Snap back to center with velocity-based duration
      if (cardRef.current) {
        const snapDuration = Math.min(0.6, Math.max(0.15, finalVelocity * 0.2));
        gsap.to(cardRef.current, {
          x: 0,
          duration: snapDuration,
          ease: "power2.out",
        });
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartTime(null);
    setLastTouchTime(null);
    setLastTouchX(null);
    setVelocity(0);
  };

  // reset card position
  useLayoutEffect(() => {
    if (cardRef.current) {
      gsap.set(cardRef.current, { x: 0, opacity: 1 });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white-50">
      <div className="bg-white px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">
          {villageName ||
            (villageNameError ? "ไม่พบข้อมูลหมู่บ้าน" : "กำลังโหลด...")}
        </h1>
        {/* <div className="relative">
          <NotificationComponent />
        </div> */}
        {sortedPending.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              onClick={() => prevCard()}
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
              onClick={() => nextCard()}
              disabled={
                currentIndex === sortedPending.length - 1 || isAnimating
              }
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 border-border hover:bg-accent"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Card Container with GSAP Animation */}
      <div className="min-h-[350px] relative overflow-hidden">
        {/* Swipe indicators */}
        {/* Simple swipe hint */}
        {sortedPending.length > 1 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-black/10 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-muted-foreground opacity-50">
            ปัดแรงๆ เพื่อข้ามหลายการ์ด
          </div>
        )}

        {sortedPending.length > 0 ? (
          <div ref={cardRef}>
            <Card className="shadow-sm border-border bg-background/50">
              <CardContent className="p-3">
                {/* Swipeable area - only the top part with info */}
                <div
                  className="touch-none select-none"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: isDragging ? "grabbing" : "grab" }}
                >
                  <div
                    className={`transition-all duration-200 ${
                      isDragging ? "scale-102" : "scale-100"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <Car className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base text-foreground truncate">
                          {sortedPending[currentIndex].plateNumber}
                        </div>
                        <div className="text-muted-foreground text-sm truncate">
                          {sortedPending[currentIndex].visitorName} •{" "}
                          {sortedPending[currentIndex].destination}
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
                          <Image
                            src={`/${sortedPending[currentIndex].carImage}`}
                            alt={`Car ${sortedPending[currentIndex].plateNumber}`}
                            className="object-cover w-full h-full"
                            width={400}
                            height={192}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <Car className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons - not swipeable, always clickable */}
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => onDeny(sortedPending[currentIndex].id)}
                    disabled={isAnimating}
                    variant="destructive"
                    className="px-4 py-6 text-sm rounded-lg flex-1 disabled:opacity-50 dark:bg-red-600"
                  >
                    ปฏิเสธ
                  </Button>
                  <Button
                    onClick={() => onApprove(sortedPending[currentIndex].id)}
                    disabled={isAnimating}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-6 text-sm rounded-lg flex-1 disabled:opacity-50 dark:bg-green-900/20 dark:text-green-400"
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

// Main Resident Page Component
const ResidentPage = () => {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<VisitorRequest[]>([]);
  const [history, setHistory] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<LiffUser | null>(null);
  const [villageName, setVillageName] = useState<string>("");
  const [villageNameError, setVillageNameError] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    type: "approve" | "reject";
    request: VisitorRequest | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: "approve",
    request: null,
    isLoading: false,
  });

  // Set initial village name immediately
  useEffect(() => {
    console.log("🚀 Component mounted, setting initial village name");
    setVillageName("กำลังโหลด...");
  }, []);

  // Check authentication and role on component mount
  useEffect(() => {
    console.log("🔐 Starting authentication check");
    const checkAuthAndRole = () => {
      // Check if user is authenticated
      console.log("🔍 Checking if user is authenticated...");
      if (!isAuthenticated()) {
        console.log("❌ User not authenticated, redirecting to LIFF login");
        router.push("/liff/resident");
        return;
      }
      console.log("✅ User is authenticated");

      // Get user data and check role
      const { user } = getAuthData();
      if (!user || user.role !== "resident") {
        console.log("User is not a resident, redirecting to appropriate page");
        if (user?.role === "guard") {
          router.push("/liff/guard");
        } else {
          router.push("/liff/resident");
        }
        return;
      }

      console.log("User is authenticated as resident:", user);
      console.log("User village_key:", user?.village_key);
      console.log("Full user object:", JSON.stringify(user, null, 2));
      setCurrentUser(user);
      setIsCheckingAuth(false);
    };

    checkAuthAndRole();
  }, [router]);

  // Fetch data on component mount
  useEffect(() => {
    console.log("📊 Data loading useEffect triggered");
    console.log("👤 Current user:", currentUser);
    const loadData = async () => {
      if (!currentUser?.lineUserId) {
        console.log("❌ No current user or LINE user ID available");
        return;
      }
      console.log("✅ Current user has LINE user ID, proceeding with data load");

      console.log(
        "🔄 Starting data load for LINE user ID:",
        currentUser.lineUserId
      );
      try {
        setLoading(true);
        setError(null);
        console.log("🚀 Starting API calls...");
        
        // Set a temporary village name immediately
        setVillageName("กำลังโหลด...");
        setVillageNameError(null);

        // Test backend connection first
        console.log("🔍 Testing backend connection...");
        try {
          const healthResponse = await fetch("/api/health");
          console.log("🏥 Backend health check:", healthResponse.status);
          if (!healthResponse.ok) {
            throw new Error(
              `Backend health check failed: ${healthResponse.status}`
            );
          }
        } catch (healthError) {
          console.warn("⚠️ Backend health check failed:", healthError);
          // Continue with data fetching - maybe backend is running but health endpoint is different
        }

        // Fetch pending visitor requests and history separately
        console.log(
          `🔍 Fetching pending visitor requests for LINE user ID: ${currentUser.lineUserId}`
        );
        const pendingData = await fetchPendingVisitorRequests(
          currentUser.lineUserId
        );

        console.log(
          `🔍 Fetching visitor history for LINE user ID: ${currentUser.lineUserId}`
        );
        const historyData = await fetchVisitorHistory(currentUser.lineUserId);

        // Debug: Log raw data before transformation
        console.log("Raw API data:", {
          pendingData: pendingData,
          historyData: historyData,
          pendingCount: pendingData?.length || 0,
          historyCount: historyData?.length || 0,
        });

        // Transform API data to component format
        const transformedPending = pendingData.map(transformApiData);
        const transformedHistory = historyData.map(transformApiData);

        setPendingRequests(transformedPending);
        setHistory(transformedHistory);

        console.log("Transformed data:", {
          pending: transformedPending.length,
          history: transformedHistory.length,
          historyItems: transformedHistory,
        });
        
        // Final check - if village name is still empty, set a fallback
        if (!villageName) {
          console.log("⚠️ Village name is still empty, setting final fallback");
          setVillageName("หมู่บ้านผาสุก (ทดสอบ)");
          setVillageNameError(null);
        }
      } catch (err) {
        console.error("❌ Error loading visitor data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`ไม่สามารถโหลดข้อมูลได้: ${errorMessage}`);

        // Fallback to mock data for development
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

    if (!isCheckingAuth && currentUser) {
      loadData();
    }
  }, [currentUser, isCheckingAuth]);

  // Fetch village name separately (not dependent on visitor data)
  useEffect(() => {
    const fetchVillage = async () => {
      if (!currentUser?.village_key) {
        console.log("No village key found for user");
        setVillageNameError("No village key found for user");
        setVillageName("");
        return;
      }

      try {
        console.log("Fetching village name for key:", currentUser.village_key);
        const villageName = await fetchVillageName(currentUser.village_key);
        setVillageName(villageName);
        setVillageNameError(null);
        console.log("Village name loaded:", villageName);
      } catch (error) {
        console.error("Failed to fetch village name:", error);
        setVillageNameError(
          error instanceof Error
            ? error.message
            : "Failed to load village name"
        );
        setVillageName("");
      }
    };

    if (currentUser) {
      fetchVillage();
    }
  }, [currentUser]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
        </div>
      </div>
    );
  }

  const handleApprove = (id: string) => {
    const request = pendingRequests.find((req) => req.id === id);
    if (!request) return;

    setConfirmationDialog({
      isOpen: true,
      type: "approve",
      request,
      isLoading: false,
    });
  };

  const handleDeny = (id: string) => {
    const request = pendingRequests.find((req) => req.id === id);
    if (!request) return;

    setConfirmationDialog({
      isOpen: true,
      type: "reject",
      request,
      isLoading: false,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationDialog.request) return;

    const { request, type } = confirmationDialog;

    setConfirmationDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      // Optimistic update - remove from pending immediately
      setPendingRequests((prev) => prev.filter((req) => req.id !== request.id));
      setHistory((prev) => [
        { ...request, status: type === "approve" ? "approved" : "denied" },
        ...prev,
      ]);

      // Call API
      if (type === "approve") {
        await approveVisitorRequest(request.id);
        console.log("Approved for:", request.plateNumber);
      } else {
        await denyVisitorRequest(request.id);
        console.log("Denied for:", request.plateNumber);
      }

      // Close dialog
      setConfirmationDialog({
        isOpen: false,
        type: "approve",
        request: null,
        isLoading: false,
      });
    } catch (error) {
      console.error(
        `Error ${type === "approve" ? "approving" : "denying"} request:`,
        error
      );

      // Rollback on error
      setPendingRequests((prev) => [...prev, request]);
      setHistory((prev) => prev.filter((req) => req.id !== request.id));

      // Show error and close dialog
      setConfirmationDialog({
        isOpen: false,
        type: "approve",
        request: null,
        isLoading: false,
      });

      alert(
        `เกิดข้อผิดพลาดในการ${
          type === "approve" ? "อนุมัติ" : "ปฏิเสธ"
        } กรุณาลองใหม่อีกครั้ง`
      );
    }
  };

  const handleCloseDialog = () => {
    if (confirmationDialog.isLoading) return; // Prevent closing while loading

    setConfirmationDialog({
      isOpen: false,
      type: "approve",
      request: null,
      isLoading: false,
    });
  };

  const handleLogout = () => {
    clearAuthData();
    router.push("/liff/resident");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[420px]">
        {/* Main Card */}
        <div className="bg-card rounded-2xl border shadow-lg">
          {/* Header */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                <Home className="w-6 h-6 sm:w-7 sm:h-7" />
                {villageName ||
                  (villageNameError ? "ไม่พบข้อมูลหมู่บ้าน" : "กำลังโหลด...")}
              </h1>
              <span className="flex items-center gap-2">
                <ModeToggle />
                {/* <NotificationComponent /> */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 h-7"
                >
                  ออกจากระบบ
                </Button>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              สวัสดี{" "}
              {currentUser
                ? `${currentUser.fname} ${currentUser.lname}`
                : "ผู้อยู่อาศัย"}{" "}
              👋
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              📋 แสดงข้อมูลสำหรับ:{" "}
              {currentUser
                ? `${currentUser.fname} ${currentUser.lname}`
                : "ผู้อยู่อาศัย"}
            </p>
          </div>

          {/* Approval Cards Section */}
          <div className="px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground text-sm">
                  กำลังโหลดข้อมูล...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <p className="text-red-500 text-sm text-center">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  ลองใหม่
                </Button>
              </div>
            ) : (
              <ApprovalCards
                items={pendingRequests}
                onApprove={handleApprove}
                onDeny={handleDeny}
                villageName={villageName}
                villageNameError={villageNameError}
              />
            )}
          </div>

          {/* History Section */}
          <div className="px-4 py-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              ประวัติล่าสุด
            </h2>
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                ยังไม่มีประวัติ
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {history.map((item) => (
                  <Card
                    key={item.id}
                    className={`border ${
                      item.status === "approved"
                        ? "bg-green-300 border-green-200 text-white dark:bg-green-950/20 dark:border-green-800"
                        : "bg-red-300 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    }`}
                  >
                    <CardContent className="py-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate dark:text-white">
                            {item.plateNumber}
                          </div>
                          <div className="text-sm text-black truncate dark:text-white">
                            {item.visitorName}
                          </div>
                          <div className="text-xs text-black truncate dark:text-white">
                            {item.destination} • {item.time}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                            item.status === "approved"
                              ? "bg-green-600 hover:bg-green-700 text-white dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-600 hover:bg-red-700 text-white dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {item.status === "approved"
                            ? "อนุมัติแล้ว"
                            : "ปฏิเสธ"}
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        title={
          confirmationDialog.type === "approve"
            ? "ยืนยันการอนุมัติ"
            : "ยืนยันการปฏิเสธ"
        }
        description={
          confirmationDialog.request
            ? `คุณแน่ใจหรือว่าต้องการ${
                confirmationDialog.type === "approve" ? "อนุมัติ" : "ปฏิเสธ"
              }คำขอสำหรับ:
              
              🚗 ทะเบียน: ${confirmationDialog.request.plateNumber}
              👤 ผู้มาเยือน: ${confirmationDialog.request.visitorName}
              🏠 ปลายทาง: ${confirmationDialog.request.destination}
              ⏰ เวลา: ${confirmationDialog.request.time}`
            : ""
        }
        type={confirmationDialog.type}
        isLoading={confirmationDialog.isLoading}
        confirmText={
          confirmationDialog.type === "approve" ? "อนุมัติ" : "ปฏิเสธ"
        }
        cancelText="ยกเลิก"
      />
    </div>
  );
};

export default ResidentPage;
