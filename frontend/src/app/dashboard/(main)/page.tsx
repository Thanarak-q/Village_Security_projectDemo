"use client";
import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import WeeklyAccessBarChart from "./chart";
import PendingTable from "./pending_table";
import {
  TotalUsersCard,
  DailyAccessCard,
  PendingTasksCard,
  EmptyCard,
} from "./statistic";

export default function Page() {
  const [data, setData] = useState<any>(null);
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

    // Set initial state for chart and table only
    gsap.set([chartRef.current, tableRef.current], {
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
    tl.to(chartRef.current, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: "power2.inOut"
    }, "-=0.2")
      // Finally animate table
      .to(tableRef.current, {
        duration: 0.8,
        opacity: 1,
        y: 0,
        ease: "power2.inOut"
      }, "-=0.4");

    return () => {
      gsap.killTweensOf([chartRef.current, tableRef.current]);
      if (cards) {
        gsap.killTweensOf(Array.from(cards));
      }
    };
  }, [data]);

  if (!data) return <p>Loading...</p>;
  // if (data.role !== "admin") {
  //   window.location.href = "/login";
  //   return null; // Prevent rendering if not admin
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 max-w-full xl:max-w-7xl">
        {/* Header - Content moved to navbar */}

        {/* Statistics Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8"
        >
          <TotalUsersCard />
          <DailyAccessCard />
          <PendingTasksCard />
          <EmptyCard />
        </div>

        {/* Chart */}
        <div
          ref={chartRef}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <WeeklyAccessBarChart />
        </div>

        {/* Pending Table */}
        <div
          ref={tableRef}
          className="mb-4 sm:mb-6"
        >
          <PendingTable />
        </div>
      </div>
    </div>
  );
}
