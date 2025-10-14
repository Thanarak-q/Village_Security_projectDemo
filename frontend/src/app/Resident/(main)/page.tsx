"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, User, Shuffle } from "lucide-react";
// import NotificationComponent from "@/app/dashboard/(main)/notification";
import { ModeToggle } from "@/components/mode-toggle";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ApprovalCards } from "../components/Approvalcards";
import { VisitorHistory } from "../components/Visitorhistory";
import { LoadingState, AuthLoadingState } from "../components/Loadingstate";
import { ErrorState } from "../components/Errorstate";
import { useVisitorData } from "../hooks/useVisitordata";

import { getAuthData } from "@/lib/liffAuth";
import { LiffService } from "@/lib/liff";
import type { UserRole, UserRolesResponse } from "@/types/roles";

// Main Resident Page Component
const ResidentPage = () => {
  const router = useRouter();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [villageName, setVillageName] = useState<string>('');

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

  const handleGoToRoleSelect = () => {
    router.push('/liff/select-role');
  };

  // Check basic user authentication
  useEffect(() => {
    const checkUserAuth = () => {
      if (currentUser) {
        console.log("🔍 Resident main page - checking user authentication:", currentUser);

        // Basic check - if user exists, we'll do detailed role checking in the roles fetch
        console.log("✅ User authenticated, will check resident role status");
      }
    };

    checkUserAuth();
  }, [currentUser, router]);

  // Check if user came from role switch and needs LIFF authentication
  useEffect(() => {
    const checkRoleSwitch = () => {
      // Check if user has stored auth data but LIFF session is not active
      const { user: storedUser, token: storedToken } = getAuthData();
      const svc = LiffService.getInstance();

      if (storedUser && storedToken && !svc.isLoggedIn()) {
        console.log("🔄 User has stored auth data but LIFF session inactive. Redirecting to LIFF...");
        // Redirect to LIFF with role parameter to maintain context
        router.push('/liff?role=resident');
        return;
      }
    };

    // Only check after a short delay to allow other effects to run first
    const timer = setTimeout(checkRoleSwitch, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  // Fetch user roles to check if they have guard role
  useEffect(() => {
    const fetchUserRoles = async () => {
      console.log("🔍 Resident main page - fetchUserRoles called, currentUser:", currentUser);

      // If no currentUser yet, wait for it
      if (!currentUser) {
        console.log("⏳ No currentUser yet, waiting...");
        return;
      }

      // Try different possible ID fields
      const userId = currentUser.lineUserId || currentUser.id;
      console.log("🔍 Resident main page - trying userId:", userId);

      if (userId) {
        try {
          const { token } = getAuthData();
          const response = await fetch(`/api/users/roles?lineUserId=${userId}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          console.log("🔍 Resident main page - API response status:", response.status);

          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data: UserRolesResponse = await response.json();
              console.log("🔍 Resident main page - API response data:", data);

              if (data.success && data.roles) {
                const roles = data.roles;
                setUserRoles(roles);
                console.log("🔍 Resident main page - roles data:", roles);

                // Check if user has resident role and its status
                const residentRole =
                  roles
                    .filter((role) => role.role === 'resident')
                    .find((role) => {
                      if (currentUser?.resident_id) {
                        return role.resident_id === currentUser.resident_id;
                      }
                      if (currentUser?.village_id) {
                        return role.village_id === currentUser.village_id;
                      }
                      return true;
                    }) ?? roles.find((role) => role.role === 'resident');
                console.log("🔍 Resident main page - residentRole:", residentRole);

                if (!residentRole) {
                  console.log("❌ User does not have resident role, redirecting to LIFF");
                  router.push("/liff");
                  return;
                }

                // Check if resident role is verified
                if (residentRole.status !== "verified") {
                  console.log("❌ Resident role is not verified (status:", residentRole.status, "), redirecting to pending page");
                  router.push("/Resident/pending");
                  return;
                }

                // Set village name from resident role data
                if (residentRole.village_name) {
                setVillageName(residentRole.village_name);
                }

                console.log("✅ User has verified resident role, allowing access to resident main page");
              } else {
                console.log("❌ API response not successful or no roles:", data);
              }
            } else {
              console.log("❌ Response is not JSON");
            }
          } else {
            console.log("❌ API request failed with status:", response.status);
          }
        } catch (error) {
          console.error('❌ Error fetching user roles:', error);
          // Don't redirect on error, just log it
        }
      } else {
        console.log("❌ No userId found in currentUser:", currentUser);
      }
    };

    fetchUserRoles();
  }, [currentUser, router]);

  // Check if user has guard role with verified or pending status
  const displayVillageName = currentUser?.village_name ?? villageName;

  // Show loading state while checking authentication
  if (isCheckingAuth) {
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
                  onClick={handleGoToRoleSelect}
                  className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Go to role selection"
                  title="กลับไปเลือกบทบาท"
                >
                  <Shuffle className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={handleNavigateToProfile}
                  className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Go to profile"
                >
                  <User className="w-5 h-5 text-foreground" />
                </button>
                {/* <NotificationComponent /> */}
              </span>
            </div>
            {currentUser ? (
              <>
                <p className="text-sm text-muted-foreground">
                  สวัสดี {currentUser.fname} {currentUser.lname} 👋
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
