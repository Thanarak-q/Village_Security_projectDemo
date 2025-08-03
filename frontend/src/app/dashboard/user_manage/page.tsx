import NotificationComponent from "../notification";
import UserManagementTable from "./table_user";

export default function page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 max-w-full xl:max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="space-y-1">
            <h1 className="scroll-m-20 text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">
              จัดการผู้ใช้งาน
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-500">
              จัดการข้อมูลผู้ใช้งานทั้งหมดในระบบ
            </p>
          </div>
          <div className="flex justify-start sm:justify-end">
            <NotificationComponent />
          </div>
        </div>
        <div>
          <UserManagementTable />
        </div>
      </div>
    </div>
  );
}
