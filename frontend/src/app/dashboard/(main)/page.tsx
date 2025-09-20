"use client";
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
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
  const { data: statsData, loading: statsLoading, error: statsError } = useStatsData();
  const cardsRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
      });
  }, []);

  // GSAP smooth scroll-up animations
  useEffect(() => {
    if (!data) return;

    // Capture ref values to avoid stale closure issues
    const chartElement = chartRef.current;
    const tableElement = tableRef.current;

    // Set initial state for chart and table only
    gsap.set([chartElement, tableElement], {
      opacity: 0,
      y: 50
    });

    // Individual cards initial state
    const cards = cardsRef.current?.children;
    if (cards) {
      gsap.set(Array.from(cards), {
        opacity: 0,
        y: 60
      });
    }

    // Create smooth scroll-up timeline
    const tl = gsap.timeline();

    // Animate individual cards first
    if (cards) {
      Array.from(cards).forEach((card, index) => {
        tl.to(card, {
          duration: 0.6,
          opacity: 1,
          y: 0,
          ease: "power2.inOut"
        }, index * 0.1);
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
      if (cards) {
        gsap.killTweensOf(Array.from(cards));
      }
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="space-y-1">
            <h1 className="scroll-m-20 text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
              {/* สวัสดี, คุณผู้จัดการ {data.username} 👋 */}
            </h1>
            {/* <p className="text-xs sm:text-sm md:text-base text-gray-500">
              วันนี้ {new Date().toLocaleDateString("th-TH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p> */}
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
