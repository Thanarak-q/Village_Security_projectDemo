"use client";
import { useEffect, useState } from "react";
import WeeklyAccessBarChart from "./chart";
import NotificationComponent from "./notification";
import PendingTable from "./pending_table";
import {
  TotalUsersCard,
  DailyAccessCard,
  PendingTasksCard,
  EmptyCard,
} from "./statistic";

export default function Page() {

  const [data, setData] = useState<any>(null);

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

  if (!data) return <p>Loading...</p>;
  // if (data.role !== "admin") {
  //   window.location.href = "/login";
  //   return null; // Prevent rendering if not admin
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 max-w-full xl:max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="space-y-1">
            <h1 className="scroll-m-20 text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">
              {/* สวัสดี, คุณผู้จัดการ {data.username} 👋 */}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-500">
              {new Date().toLocaleDateString("th-TH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex justify-start sm:justify-end">
            <NotificationComponent />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <TotalUsersCard />
          <DailyAccessCard />
          <PendingTasksCard />
          <EmptyCard />
        </div>

        {/* Chart */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <WeeklyAccessBarChart />
        </div>

        {/* Pending Table */}
        <div className="mb-4 sm:mb-6">
          <PendingTable />
        </div>
      </div>
    </div>
  );
}
