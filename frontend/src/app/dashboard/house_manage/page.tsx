import HouseManagementTable from "./table_house";

export default function page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header - Content moved to navbar */}
        <div>
          <HouseManagementTable />
        </div>
      </div>
    </div>
  );
}
