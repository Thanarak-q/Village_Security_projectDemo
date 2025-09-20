"use client";

import { Home } from "lucide-react";
import NotificationComponent from "../../dashboard/(main)/notification";
import { ModeToggle } from "@/components/mode-toggle";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ApprovalCards } from "../components/Approvalcards";
import { VisitorHistory } from "../components/Visitorhistory";
import { LoadingState, AuthLoadingState } from "../components/Loadingstate";
import { ErrorState } from "../components/Errorstate";
import { useVisitorData } from "../hooks/useVisitordata";

// Target LINE user ID for สมชาย ผาสุก
const TARGET_LINE_USER_ID = "Ue529194c37fd43a24cf96d8648299d90";
const TARGET_RESIDENT_NAME = "สมชาย ผาสุก";

// Main Resident Page Component
const ResidentPage = () => {
  const {
    pendingRequests,
    history,
    loading,
    error,
    isCheckingAuth,
    confirmationDialog,
    handleApprove,
    handleDeny,
    handleConfirmAction,
    handleCloseDialog,
  } = useVisitorData();

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return <AuthLoadingState />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[420px]">
        {/* Main Card */}
        <div className="bg-card rounded-2xl border shadow-lg">
          {/* Header */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                <Home className="w-6 h-6 sm:w-7 sm:h-7" /> หมู่บ้านร่มรื่น
              </h1>
              <span className="flex items-center gap-2">
                <ModeToggle />
                <NotificationComponent />
              </span>
            </div>
            <p className="text-sm text-muted-foreground">สวัสดี {TARGET_RESIDENT_NAME} 👋</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              📋 แสดงข้อมูลสำหรับ: {TARGET_RESIDENT_NAME} (LINE ID: {TARGET_LINE_USER_ID})
            </p>
          </div>

          {/* Approval Cards Section */}
          <div className="px-4 py-4">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} />
            ) : (
              <ApprovalCards
                items={pendingRequests}
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            )}
          </div>

          {/* History Section */}
          <VisitorHistory history={history} />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        title={
          confirmationDialog.type === 'approve'
            ? 'ยืนยันการอนุมัติ'
            : 'ยืนยันการปฏิเสธ'
        }
        description={
          confirmationDialog.request
            ? `คุณแน่ใจหรือว่าต้องการ${confirmationDialog.type === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}คำขอสำหรับ:
              
              🚗 ทะเบียน: ${confirmationDialog.request.plateNumber}
              👤 ผู้มาเยือน: ${confirmationDialog.request.visitorName}
              🏠 ปลายทาง: ${confirmationDialog.request.destination}
              ⏰ เวลา: ${confirmationDialog.request.time}`
            : ''
        }
        type={confirmationDialog.type}
        isLoading={confirmationDialog.isLoading}
        confirmText={confirmationDialog.type === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}
        cancelText="ยกเลิก"
      />
    </div>
  );
};

export default ResidentPage;
