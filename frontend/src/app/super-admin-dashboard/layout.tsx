"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/SuperAdminSidebar";
import { MobileNavigation } from "@/components/mobile-navigation";
import React, { useEffect, useState } from "react";
import Navbar from "./components/SuperAdminNavbar";
import AccessDenied from "./components/AccessDenied";
import { useRouter } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{ user?: { id: string; username: string; email: string }; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        return res.json();
      })
      .then((json) => {
        if (json) {
          // Check if user is superadmin
          if (json.role !== "superadmin") {
            // Show access denied page instead of redirecting
            setUserRole(json.role || "ไม่ระบุ");
            setAccessDenied(true);
            return;
          }
          setData(json);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return <AccessDenied userRole={userRole} requiredRole="Super Admin" />;
  }

  if (!data) {
    return null; // Will redirect to login
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        <main className="pb-16 md:pb-0">
          {children}
        </main>
        <MobileNavigation />
      </SidebarInset>
    </SidebarProvider>
  );
}
