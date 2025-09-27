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
  const cardsRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);


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
    const villageKey = sessionStorage.getItem("selectedVillage");
    if (villageKey) {
      setSelectedVillageKey(villageKey);
      fetch(`/api/villages/check/${villageKey}`, {
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

  // GSAP smooth scroll-up animations
  useEffect(() => {
    if (!data) return;

    // Capture ref values to avoid stale closure issues
    const chartElement = chartRef.current;
    const tableElement = tableRef.current;

    // Only proceed if elements exist
    if (!chartElement || !tableElement) return;

    // Set initial state for chart and table only
    gsap.set([chartElement, tableElement], {
      opacity: 0,
      y: 50
    });

    // Individual cards initial state
    const cards = cardsRef.current?.children;
    if (cards && cards.length > 0) {
      gsap.set(Array.from(cards), {
        opacity: 0,
        y: 60
      });
    }

    // Create smooth scroll-up timeline
    const tl = gsap.timeline();

    // Animate individual cards first
    if (cards && cards.length > 0) {
      Array.from(cards).forEach((card, index) => {
        if (card) {
          tl.to(card, {
            duration: 0.6,
            opacity: 1,
            y: 0,
            ease: "power2.inOut"
          }, index * 0.1);
        }
      });
    }

    // Then animate chart
    tl.to(chartElement, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: "power2.inOut"
    }, "-=0.2")
      // Finally animate table
      .to(tableElement, {
        duration: 0.8,
        opacity: 1,
        y: 0,
        ease: "power2.inOut"
      }, "-=0.4");

    return () => {
      gsap.killTweensOf([chartElement, tableElement]);
      if (cards && cards.length > 0) {
        gsap.killTweensOf(Array.from(cards));
      }
    };
  }, [data]);

  // Refetch data when selected village changes
  useEffect(() => {
    const handleVillageChange = () => {
      console.log('🔄 Dashboard: Village changed event received');
      const villageKey = sessionStorage.getItem("selectedVillage");
      console.log('🏘️ Dashboard: Selected village key:', villageKey);
      
      if (villageKey) {
        setSelectedVillageKey(villageKey);
        fetch(`/api/villages/check/${villageKey}`, {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="space-y-1">
           
            {selectedVillageKey && (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  หมู่บ้าน:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm md:text-base font-medium text-primary bg-primary/10 px-2 py-1 rounded-md font-mono select-all">
                    {showVillageKey ? selectedVillageKey : '••••••••'}
                  </span>
                  <button
                    onClick={() => setShowVillageKey(!showVillageKey)}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    title={showVillageKey ? "ซ่อนรหัสหมู่บ้าน" : "แสดงรหัสหมู่บ้าน"}
                  >
                    {showVillageKey ? (
                      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground" />
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
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8"
        >
          <TotalUsersCard data={statsData} loading={statsLoading} error={statsError} />
          <DailyAccessCard data={statsData} loading={statsLoading} error={statsError} />
          <PendingTasksCard data={statsData} loading={statsLoading} error={statsError} />
          <EmptyCard data={statsData} loading={statsLoading} error={statsError} />
        </div>

        {/* Chart */}
        <div
          ref={chartRef}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <WeeklyAccessBarChart />
          </Suspense>
        </div>

        {/* Pending Table */}
        {/* <div
          ref={tableRef}
          className="mb-4 sm:mb-6"
        >
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <PendingTable />
          </Suspense>
        </div> */}
      </div>
    </div>
  );
}

