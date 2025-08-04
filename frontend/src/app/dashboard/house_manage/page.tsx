import NotificationComponent from "../(main)/notification";
import HouseManagementTable from "./table_house";

export default function page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="scroll-m-20 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">
              การจัดการบ้าน
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              จัดการข้อมูลบ้านและสถานะการอยู่อาศัย
            </p>
          </div>
          <div className="flex justify-end sm:justify-start">
            <NotificationComponent />
          </div>
        </div>
        <div>
          <HouseManagementTable />
        </div>
      </div>
    </div>
  );
}
