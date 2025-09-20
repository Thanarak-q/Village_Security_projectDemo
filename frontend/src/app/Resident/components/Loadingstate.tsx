"use client";

export const LoadingState = () => {
  return (
    <div className="flex items-center justify-center h-32">
      <p className="text-muted-foreground text-sm">กำลังโหลดข้อมูล...</p>
    </div>
  );
};

export const AuthLoadingState = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
      </div>
    </div>
  );
};
