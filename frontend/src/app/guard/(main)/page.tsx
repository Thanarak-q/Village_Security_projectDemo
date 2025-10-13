"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getAuthData } from "@/lib/liffAuth";
import { LiffService } from "@/lib/liff";
import ApprovalForm from "./ApprovalForm";
import type { LiffUser } from "@/lib/liffAuth";
import type { UserRole, UserRolesResponse } from "@/types/roles";

function Page() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<LiffUser | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    const checkAuthAndStatus = () => {
      console.log("🛡️ Guard authentication check starting");
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log("❌ User not authenticated, redirecting to guard LIFF");
        router.push("/liff?role=guard");
        return;
      }

      // Get user data and check role
      const { user } = getAuthData();
      console.log("🔍 Guard user data:", user);
      
      if (!user) {
        console.log("❌ No user data found, redirecting to LIFF with guard context");
        router.push("/liff?role=guard");
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

      // Basic user authentication check - detailed role checking will be done in roles fetch
      console.log("✅ User authenticated, will check guard role status in roles fetch");
      // Set currentUser for the roles fetch useEffect
      setCurrentUser(user);
      // Don't set isCheckingAuth to false yet - wait for role verification
    };

    checkAuthAndStatus();
  }, [router]);

  // Check if user came from role switch and needs LIFF authentication
  useEffect(() => {
    const checkRoleSwitch = () => {
      // Check if user has stored auth data but LIFF session is not active
      const { user: storedUser, token: storedToken } = getAuthData();
      const svc = LiffService.getInstance();
      
      if (storedUser && storedToken && !svc.isLoggedIn()) {
        console.log("🔄 User has stored auth data but LIFF session inactive. Redirecting to LIFF...");
        // Redirect to LIFF with role parameter to maintain context
        router.push('/liff?role=guard');
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
      const { user } = getAuthData();
      if (user) {
        // Try different possible ID fields from LIFF user data
        const userId = user.lineUserId || user.id;
        console.log("🔍 Guard main page - attempting to fetch roles for user ID:", userId);
        console.log("🔍 Guard main page - current user object:", user);
        
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
            
            console.log("🔍 Guard main page - roles API response status:", response.status);
            
            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data: UserRolesResponse = await response.json();
                console.log("🔍 Guard main page - roles API response data:", data);

                if (data.success && data.roles) {
                  const roles = data.roles;
                  setUserRoles(roles);

                  // Check if user has guard role and its status
                  const guardRole = roles.find((role) => role.role === 'guard');
                  const hasResidentRole = roles.some((role) => role.role === 'resident');
                  
                  console.log("🔍 Guard role check - guardRole:", guardRole);
                  console.log("🔍 Guard role check - hasResidentRole:", hasResidentRole);
                  console.log("🔍 Guard role check - all roles:", data.roles);
                  
                  if (!guardRole) {
                    console.log("❌ User does not have guard role, redirecting to LIFF with guard context");
                    router.push("/liff?role=guard");
                    return;
                  }
                  
                  // Check if guard role is verified
                  if (guardRole.status !== "verified") {
                    console.log("❌ Guard role is not verified (status:", guardRole.status, "), redirecting to pending page");
                    router.push("/guard/pending");
                    return;
                  }
                  
                  console.log("✅ User has verified guard role, continuing to main page");
                  
                  // User is verified - allow access
                  setIsCheckingAuth(false);
                  
                  // Store role information for potential role switching
                  if (hasResidentRole) {
                    console.log("🔄 User has both roles - role switching available");
                  }
                } else {
                  console.log("❌ No roles found or API error, redirecting to LIFF with guard context");
                  router.push("/liff?role=guard");
                  return;
                }
              }
            } else {
              console.log("❌ Roles API failed with status:", response.status);
              router.push("/liff?role=guard");
              return;
            }
          } catch (error) {
            console.error('Error fetching user roles:', error);
            router.push("/liff?role=guard");
            return;
          }
        } else {
          console.log("❌ No user ID found, redirecting to LIFF with guard context");
          router.push("/liff?role=guard");
          return;
        }
      }
    };

    fetchUserRoles();
  }, [currentUser, router]);

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
        <ApprovalForm userRoles={userRoles} />
    </div>
  );
}
export default Page;
