"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ApprovalForm from "./ApprovalForm";
import type { UserRole } from "@/types/roles";

interface DemoUser {
  id: string;
  fname: string;
  lname: string;
  email: string;
  role: string;
  village_id: string;
  village_name?: string;
  guard_id?: string;
  status: string;
}

function Page() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("🛡️ Guard authentication check starting (Demo Mode)");

      try {
        // Check demo auth via API
        const response = await fetch('/api/auth/demo/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          console.log("❌ User not authenticated, redirecting to demo login");
          router.push("/demo");
          return;
        }

        const data = await response.json();

        if (!data.authenticated || data.role !== 'guard') {
          console.log("❌ Not authenticated as guard, redirecting to demo login");
          router.push("/demo");
          return;
        }

        console.log("✅ Guard authenticated:", data);

        // Set user data
        setCurrentUser({
          id: data.id,
          fname: data.fname,
          lname: data.lname,
          email: data.email,
          role: data.role,
          village_id: data.village_id,
          village_name: data.village_name,
          guard_id: data.guard_id,
          status: data.status,
        });

        // Store village info in session
        if (data.village_id) {
          sessionStorage.setItem("selectedVillage", data.village_id);
          sessionStorage.setItem("selectedVillageId", data.village_id);
        }
        if (data.village_name) {
          sessionStorage.setItem("selectedVillageName", data.village_name);
        }

        // Create mock role for ApprovalForm
        const guardRole: UserRole = {
          role: 'guard',
          status: data.status || 'verified',
          guard_id: data.guard_id,
          village_id: data.village_id,
          village_name: data.village_name,
        };
        setUserRoles([guardRole]);

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push("/demo");
      }
    };

    checkAuth();
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
      <ApprovalForm userRoles={userRoles} />
    </div>
  );
}
export default Page;
