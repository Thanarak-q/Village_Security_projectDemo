"use client";
import { useEffect, useState } from "react";
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
        {/* Header - Content moved to navbar */}

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
