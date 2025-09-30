"use client";
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { gsap } from "gsap";
import { Eye, EyeOff } from "lucide-react";
import {
  TotalUsersCard,
  DailyAccessCard,
  PendingTasksCard,
  EmptyCard,
  useStatsData,
} from "./statistic";

// Lazy load heavy components
const WeeklyAccessBarChart = lazy(() => import("./chart"));

export default function Page() {
  const [data, setData] = useState<unknown>(null);
  const [selectedVillageName, setSelectedVillageName] = useState<string>("");
  const [selectedVillageKey, setSelectedVillageKey] = useState<string>("");
  const [showVillageKey, setShowVillageKey] = useState<boolean>(false);
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

        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch((error) => {
        console.error("Error fetching auth data:", error);
      });

    // Get selected village name and key
    const villageId = sessionStorage.getItem("selectedVillage");
    if (villageId) {
      setSelectedVillageKey(villageId);
      fetch(`/api/villages/check/${villageId}`, {
        credentials: "include",
      })
        .then(async (res) => {
          // Check if response is JSON
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Response is not JSON");
          }
          return res.json();
        })
        .then((villageData) => {
          if (villageData && villageData.exists) {
            setSelectedVillageName(villageData.village_name);
          }
        })
        .catch((error) => {
          console.error("Error fetching village name:", error);
        });
    }
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
    if (!villageInfoRef.current || !selectedVillageKey) return;

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
  }, [selectedVillageKey, selectedVillageName]);

  // Refetch data when selected village changes
  useEffect(() => {
    const handleVillageChange = () => {
      console.log('🔄 Dashboard: Village changed event received');
      const villageId = sessionStorage.getItem("selectedVillageId");
      console.log('🏘️ Dashboard: Selected village id:', villageId);

      if (villageId) {
        setSelectedVillageKey(villageId);
        fetch(`/api/villages/check/${villageId}`, {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((villageData) => {
            if (villageData.exists) {
              console.log('✅ Dashboard: Village name updated:', villageData.village_name);
              setSelectedVillageName(villageData.village_name);
            }
          })
          .catch((error) => {
            console.error("Error fetching village name:", error);
          });
      } else {
        console.log('❌ Dashboard: No village selected');
        setSelectedVillageName("");
        setSelectedVillageKey("");
      }
    };

    window.addEventListener('villageChanged', handleVillageChange);

    return () => {
      window.removeEventListener('villageChanged', handleVillageChange);
    };
  }, []);

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

            {selectedVillageKey && (
              <div
                ref={villageInfoRef}
                className="flex items-center gap-2"
              >
                <span className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  รหัสหมู่บ้าน:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm md:text-base font-medium text-primary bg-primary/10 px-2 py-1 rounded-md font-mono select-all">
                    {showVillageKey ? selectedVillageKey : '••••••••'}
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

