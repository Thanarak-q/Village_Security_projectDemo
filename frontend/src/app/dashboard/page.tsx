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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="scroll-m-20 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">
              สวัสดี, คุณผู้จัดการ
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              วันจันทร์ที่ 1 มกราคม 2024
            </p>
          </div>
          <div className="flex justify-end sm:justify-start">
            <NotificationComponent />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <ResidentsStatCard />
          <DailyAccessCard />
          <SecurityLevelCard />
          <RecentActivityCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
          <WeeklyAccessBarChart />
        </div>

        <div>
          <FastProcessPage />
        </div>

        <div>
          <PendingTable />
        </div>
      </div>
    </div>
  );
}
