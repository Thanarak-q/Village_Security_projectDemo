"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getAuthData } from "@/lib/liffAuth";
import ApprovalForm from "./ApprovalForm";

function page() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthAndStatus = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        router.push("/liff/guard");
        return;
      }

      // Get user data and check role
      const { user } = getAuthData();
      if (!user || user.role !== "guard") {
        if (user?.role === "resident") {
          router.push("/liff/resident");
        } else {
          router.push("/liff/guard");
        }
        return;
      }

      // Check user status - redirect pending users to pending page
      if (user.status === "pending") {
        router.push("/guard/pending");
        return;
      }

      // Check if user is disabled
      if (user.status === "disable") {
        router.push("/liff/guard");
        return;
      }

      // Only verified users can access the main page
      if (user.status !== "verified") {
        router.push("/guard/pending");
        return;
      }

      // User is verified - allow access
      setIsCheckingAuth(false);
    };

    checkAuthAndStatus();
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
