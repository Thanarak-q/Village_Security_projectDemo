"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAuthData } from "@/lib/liffAuth";
import { initLiff } from "@/lib/liff";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Clear local storage first
        clearAuthData();
        
        // Initialize LIFF to check login status
        const liffInitialized = await initLiff();
        
        if (liffInitialized) {
          // Import liff after initialization
          const liff = (await import("@line/liff")).default;
          
          // Logout from LINE LIFF if logged in
          if (liff.isLoggedIn()) {
            liff.logout();
          }
        }
        
        // Redirect to login
        router.push('/liff/login');
      } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if logout fails
        router.push('/liff/login');
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">กำลังออกจากระบบ...</p>
      </div>
    </div>
  );
}
