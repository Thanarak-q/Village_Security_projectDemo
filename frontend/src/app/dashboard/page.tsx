import WeeklyAccessBarChart from "./chart";
import FastProcessPage from "./fastprocess";
import NotificationComponent from "./notification";
import PendingTable from "./pending_table";
import {
  DailyAccessCard,
  RecentActivityCard,
  ResidentsStatCard,
  SecurityLevelCard,
} from "./statistic";

export default function page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full xl:max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="space-y-1">
            <h1 className="scroll-m-20 text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">
              สวัสดี, คุณผู้จัดการ
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-500">
              วันจันทร์ที่ 1 มกราคม 2024
            </p>
          </div>
          <div className="flex justify-end sm:justify-start">
            <NotificationComponent />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <ResidentsStatCard />
          <DailyAccessCard />
          <SecurityLevelCard />
          <RecentActivityCard />
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="lg:col-span-2">
            <WeeklyAccessBarChart />
          </div>
        </div>

        {/* Fast Process */}
        <div className="mb-6 sm:mb-8">
          <FastProcessPage />
        </div>

        {/* Pending Table */}
        <div className="mb-6">
          <PendingTable />
        </div>
      </div>
    </div>
  );
}