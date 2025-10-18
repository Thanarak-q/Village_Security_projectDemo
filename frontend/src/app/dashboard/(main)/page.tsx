"use client";
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { gsap } from "gsap";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import {
  TotalUsersCard,
  DailyAccessCard,
  PendingTasksCard,
  EmptyCard,
  useStatsData,
} from "./statistic";

// Lazy load heavy components
const WeeklyAccessBarChart = lazy(() => import("./chart"));

interface DashboardVillage {
  village_id: string;
  village_name: string;
  village_key: string;
}

interface DashboardUser {
  villages?: DashboardVillage[];
  [key: string]: unknown;
}

export default function Page() {
  const [data, setData] = useState<DashboardUser | null>(null);
  const [selectedVillageName, setSelectedVillageName] = useState<string>("");
  const [villageKey, setVillageKey] = useState<string>("");
  const [showVillageKey, setShowVillageKey] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const { data: statsData, loading: statsLoading, error: statsError } = useStatsData();
  const villageInfoRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        // Check if response is JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }

        return res.json() as Promise<DashboardUser>;
      })
      .then((json) => {
        if (json) {
          setData(json);
          // Extract village information from user data
          if (json.villages && json.villages.length > 0) {
            const selectedVillageId = sessionStorage.getItem("selectedVillage");
            if (selectedVillageId) {
              const selectedVillage = json.villages.find((v) => v.village_id === selectedVillageId);
              if (selectedVillage) {
                setSelectedVillageName(selectedVillage.village_name);
                setVillageKey(selectedVillage.village_key);
              }
            }
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching auth data:", error);
      });

  }, []);

  // GSAP smooth scroll-up animation - matching other sidebar pages
  useEffect(() => {
    const containerElement = headerRef.current?.parentElement;
    
    // Only animate if element exists
    if (!containerElement) return;
    
    // Set initial state
    gsap.set(containerElement, {
      opacity: 0,
      y: 50
    });

    // Animate entrance
    gsap.to(containerElement, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: "power2.inOut",
      delay: 0.2
    });

    return () => {
      try {
        gsap.killTweensOf(containerElement);
      } catch (error) {
        console.warn('GSAP cleanup error:', error);
      }
    };
  }, [data]);

  // Animate village info changes when village selection changes
  useEffect(() => {
    if (!villageInfoRef.current || !villageKey) return;

    // Smooth transition when village changes - matching other sidebar pages
    gsap.fromTo(villageInfoRef.current,
      {
        opacity: 0,
        y: 20
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.inOut"
      }
    );
  }, [villageKey, selectedVillageName]);

  // Refetch data when selected village changes
  useEffect(() => {
    const handleVillageChange = () => {
      console.log('🔄 Dashboard: Village changed event received');
      const villageId = sessionStorage.getItem("selectedVillageId");
      console.log('🏘️ Dashboard: Selected village id:', villageId);

      if (villageId && data?.villages) {
        const selectedVillage = data.villages.find((v) => v.village_id === villageId);
        if (selectedVillage) {
          console.log('✅ Dashboard: Village updated:', selectedVillage.village_name);
          setSelectedVillageName(selectedVillage.village_name);
          setVillageKey(selectedVillage.village_key);
        }
      } else {
        console.log('❌ Dashboard: No village selected');
        setSelectedVillageName("");
        setVillageKey("");
      }
    };

    window.addEventListener('villageChanged', handleVillageChange);

    return () => {
      window.removeEventListener('villageChanged', handleVillageChange);
    };
  }, [data]);

  // if (!data) return <p>Loading...</p>;
  // if (data.role !== "admin") {
  //   window.location.href = "/login";
  //   return null; // Prevent rendering if not admin
  // }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 max-w-full xl:max-w-7xl">
        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8"
        >
          <div className="space-y-1">

            {villageKey && (
              <div
                ref={villageInfoRef}
                className="flex items-center gap-2"
              >
                <span className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  รหัสหมู่บ้าน:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm md:text-base font-medium text-primary bg-primary/10 px-2 py-1 rounded-md font-mono select-all">
                    {showVillageKey ? villageKey : '••••••••'}
                  </span>
                  <button
                    onClick={() => setShowVillageKey(!showVillageKey)}
                    className="p-1.5 hover:bg-muted rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring hover:scale-105"
                    title={showVillageKey ? "ซ่อนรหัสหมู่บ้าน" : "แสดงรหัสหมู่บ้าน"}
                  >
                    {showVillageKey ? (
                      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground transition-all duration-300" />
                    ) : (
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground transition-all duration-300" />
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(villageKey);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        console.error('Failed to copy village key:', err);
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = villageKey;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="p-1.5 hover:bg-muted rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring hover:scale-105"
                    title="คัดลอกรหัสหมู่บ้าน"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 transition-all duration-300" />
                    ) : (
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground transition-all duration-300" />
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
          <div className="flex justify-start sm:justify-end">
            {/* <NotificationComponent /> */}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <TotalUsersCard data={statsData} loading={statsLoading} error={statsError} />
          <DailyAccessCard data={statsData} loading={statsLoading} error={statsError} />
          <PendingTasksCard data={statsData} loading={statsLoading} error={statsError} />
          <EmptyCard data={statsData} loading={statsLoading} error={statsError} />
        </div>

        {/* Chart */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <WeeklyAccessBarChart />
          </Suspense>
        </div>

        {/* Pending Table */}
        {/* <div className="mb-4 sm:mb-6">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <PendingTable />
          </Suspense>
        </div> */}
      </div>
    </div>
  );
}
