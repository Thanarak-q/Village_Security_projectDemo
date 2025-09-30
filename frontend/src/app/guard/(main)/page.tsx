"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getAuthData } from "@/lib/liffAuth";
import ApprovalForm from "./ApprovalForm";

function Page() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userRoles, setUserRoles] = useState<Array<{role: string, village_id: string, village_name?: string}>>([]);

  useEffect(() => {
    const checkAuthAndStatus = () => {
      console.log("🛡️ Guard authentication check starting");
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log("❌ User not authenticated, redirecting to guard LIFF");
        router.push("/liff");
        return;
      }

      // Get user data and check role
      const { user } = getAuthData();
      console.log("🔍 Guard user data:", user);
      
      if (!user) {
        console.log("❌ No user data found, redirecting to LIFF");
        router.push("/liff");
        return;
      }

      // Check if user has guard role (they might have multiple roles)
      // We'll check this after fetching roles, so for now just continue
      console.log("🔍 User found, checking guard status...");

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
        router.push("/liff");
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
  }, [router]);

  // Fetch user roles to check if they have guard role
  useEffect(() => {
    const fetchUserRoles = async () => {
      const { user } = getAuthData();
      if (user) {
        // Try different possible ID fields from LIFF user data
        const userId = user.lineUserId || user.id;
        console.log("🔍 Guard main page - attempting to fetch roles for user ID:", userId);
        console.log("🔍 Guard main page - current user object:", user);
        
        if (userId) {
          try {
            const apiUrl = '';
            const response = await fetch(`${apiUrl}/api/users/roles?lineUserId=${userId}`, {
              credentials: 'include'
            });
            
            console.log("🔍 Guard main page - roles API response status:", response.status);
            
            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                console.log("🔍 Guard main page - roles API response data:", data);
                
                if (data.success && data.roles) {
                  setUserRoles(data.roles);
                  
                  // Check if user has guard role and other roles
                  const hasGuardRole = data.roles.some((role: any) => role.role === 'guard');
                  const hasResidentRole = data.roles.some((role: any) => role.role === 'resident');
                  
                  console.log("🔍 Guard role check - hasGuardRole:", hasGuardRole);
                  console.log("🔍 Guard role check - hasResidentRole:", hasResidentRole);
                  console.log("🔍 Guard role check - all roles:", data.roles);
                  
                  if (!hasGuardRole) {
                    console.log("❌ User does not have guard role, redirecting to LIFF");
                    router.push("/liff");
                    return;
                  }
                  
                  console.log("✅ User has guard role, continuing to main page");
                  
                  // Store role information for potential role switching
                  if (hasResidentRole) {
                    console.log("🔄 User has both roles - role switching available");
                  }
                } else {
                  console.log("❌ No roles found or API error, redirecting to LIFF");
                  router.push("/liff");
                  return;
                }
              }
            } else {
              console.log("❌ Roles API failed with status:", response.status);
              router.push("/liff");
              return;
            }
          } catch (error) {
            console.error('Error fetching user roles:', error);
            router.push("/liff");
            return;
          }
        } else {
          console.log("❌ No user ID found, redirecting to LIFF");
          router.push("/liff");
          return;
        }
      }
    };

    // Only fetch roles if we're not checking auth
    if (!isCheckingAuth) {
      fetchUserRoles();
    }
  }, [isCheckingAuth, router]);

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
export default Page;
