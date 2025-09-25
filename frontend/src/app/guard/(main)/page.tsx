"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// DISABLED: LIFF authentication
// import { isAuthenticated, getAuthData } from "@/lib/liffAuth";
import ApprovalForm from "./ApprovalForm";

function page() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // DISABLED: LIFF authentication check - skip all auth checks
    console.log("🚫 LIFF authentication disabled - allowing direct access");
    setIsCheckingAuth(false);
    
    /* DISABLED: Original LIFF authentication logic
    const checkAuthAndStatus = () => {
      console.log("🛡️ Guard authentication check starting");
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log("❌ User not authenticated, redirecting to guard LIFF");
        router.push("/liff/guard");
        return;
      }

      // Get user data and check role
      const { user } = getAuthData();
      console.log("🔍 Guard user data:", user);
      
      if (!user || user.role !== "guard") {
        console.log("❌ User is not a guard, redirecting to appropriate page");
        if (user?.role === "resident") {
          router.push("/liff/resident");
        } else {
          router.push("/liff/guard");
        }
        return;
      }

      // Debug: Log user status
      console.log("🔍 Guard status check:", {
        status: user.status,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        role: user.role
      });

      // Check user status - redirect pending users to pending page
      if (user.status === "pending") {
        console.log("❌ Guard status is pending, redirecting to pending page");
        router.push("/guard/pending");
        return;
      }

      // Check if user is disabled
      if (user.status === "disable") {
        console.log("❌ Guard is disabled, redirecting to login");
        router.push("/liff/guard");
        return;
      }

      // Only verified users can access the main page
      if (user.status !== "verified") {
        console.log("❌ Guard status is not verified, redirecting to pending page");
        router.push("/guard/pending");
        return;
      }

      console.log("✅ Guard is verified, allowing access to main page");
      // User is verified - allow access
      setIsCheckingAuth(false);
    };

    checkAuthAndStatus();
    */
  }, [router]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <ApprovalForm />
    </div>
  );
}
export default page;
