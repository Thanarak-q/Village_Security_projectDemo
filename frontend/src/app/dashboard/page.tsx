import WeeklyAccessBarChart from "./chart";
import NotificationComponent from "./notification";
import PendingTable from "./pending_table";
import {
  TotalUsersCard,
  DailyAccessCard,
  PendingTasksCard,
  EmptyCard,
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
              {new Date().toLocaleDateString('th-TH', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex justify-end sm:justify-start">
            <NotificationComponent />
          </div>
        </div>

        {/* Statistics Cards - 4 Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <TotalUsersCard />
          <DailyAccessCard />
          <PendingTasksCard />
          <EmptyCard />
        </div>

        {/* Chart Section - สถิติเข้าออกประจำวัน/สัปดาห์/ปี */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="lg:col-span-2">
            <WeeklyAccessBarChart />
          </div>
        </div>

        {/* Pending Users Table - ตาราง user ใหม่รออนุมัติ */}
        <div className="mb-6">
          <PendingTable />
        </div>
      </div>
    </div>
  );
}