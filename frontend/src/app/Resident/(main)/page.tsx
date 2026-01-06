"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, User, LogOut } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ApprovalCards } from "../components/Approvalcards";
import { VisitorHistory } from "../components/Visitorhistory";
import { LoadingState, AuthLoadingState } from "../components/Loadingstate";
import { ErrorState } from "../components/Errorstate";
import { useVisitorData } from "../hooks/useVisitordata";

interface DemoUser {
  id: string;
  fname: string;
  lname: string;
  email: string;
  role: string;
  village_id: string;
  village_name?: string;
  resident_id?: string;
  status: string;
}

// Main Resident Page Component
const ResidentPage = () => {
  const router = useRouter();
  const [villageName, setVillageName] = useState<string>('');
  const [isCheckingDemoAuth, setIsCheckingDemoAuth] = useState(true);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  const {
    pendingRequests,
    history,
    loading,
    error,
    isCheckingAuth,
    currentUser,
    confirmationDialog,
    handleApprove,
    handleDeny,
    handleConfirmAction,
    handleCloseDialog,
  } = useVisitorData();

  const handleNavigateToProfile = () => {
    router.push('/Resident/profile');
  };

  const handleLogout = () => {
    // Clear localStorage and redirect to demo
    localStorage.removeItem('liffUser');
    localStorage.removeItem('liffToken');
    router.push('/demo');
  };

  // Check demo authentication
  useEffect(() => {
    const checkDemoAuth = async () => {
      try {
        const response = await fetch('/api/auth/demo/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          console.log("❌ User not authenticated, redirecting to demo login");
          router.push("/demo");
          return;
        }

        const data = await response.json();

        if (!data.authenticated || data.role !== 'resident') {
          console.log("❌ Not authenticated as resident, redirecting to demo login");
          router.push("/demo");
          return;
        }

        console.log("✅ Resident authenticated:", data);

        setDemoUser({
          id: data.id,
          fname: data.fname,
          lname: data.lname,
          email: data.email,
          role: data.role,
          village_id: data.village_id,
          village_name: data.village_name,
          resident_id: data.resident_id,
          status: data.status,
        });

        if (data.village_name) {
          setVillageName(data.village_name);
        }

        setIsCheckingDemoAuth(false);
      } catch (error) {
        console.error('Auth check error:', error);
        // If demo auth fails, fall back to localStorage check
        const userStr = localStorage.getItem('liffUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === 'resident') {
            setDemoUser(user);
            setVillageName(user.village_name || '');
            setIsCheckingDemoAuth(false);
            return;
          }
        }
        router.push("/demo");
      }
    };

    checkDemoAuth();
  }, [router]);

  // Use demo user or currentUser from hook
  const displayUser = demoUser || currentUser;
  const displayVillageName = demoUser?.village_name || currentUser?.village_name || villageName;

  // Show loading state while checking authentication
  if (isCheckingDemoAuth || isCheckingAuth) {
    return <AuthLoadingState />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[420px] relative">
        {/* Main Card */}
        <div className="bg-card rounded-2xl border shadow-lg relative">
          {/* Header */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                  <Home className="w-6 h-6 sm:w-7 sm:h-7" />
                  {displayVillageName ? `${displayVillageName}` : 'หมู่บ้าน'}
                </h1>
              </div>
              <span className="flex items-center gap-2">
                <ModeToggle />
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Logout"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={handleNavigateToProfile}
                  className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Go to profile"
                >
                  <User className="w-5 h-5 text-foreground" />
                </button>
              </span>
            </div>
            {displayUser ? (
              <>
                <p className="text-sm text-muted-foreground">
                  สวัสดี {displayUser.fname} {displayUser.lname} 👋
                </p>

              </>
            ) : (
              <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลผู้ใช้...</p>
            )}
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
