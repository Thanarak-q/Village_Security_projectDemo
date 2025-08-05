import UserManagementTable from "./table_user";

export default function page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 max-w-full xl:max-w-7xl">
        {/* Header - Content moved to navbar */}
        <div>
          <UserManagementTable />
        </div>
      </div>
    </div>
  );
}
