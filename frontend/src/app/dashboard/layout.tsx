"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./dashboard_sidebar";
import { MobileNavigation } from "@/components/mobile-navigation";
import React, { useEffect, useState } from "react";
import Navbar from "./navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{ user?: { id: string; username: string; email: string }; role?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        
        const json = await res.json();
        if (json) {
          setData(json);
          
          // Check if user is admin/superadmin and needs village selection
          if (json.role === "admin" || json.role === "superadmin") {
            const selectedVillageId = sessionStorage.getItem("selectedVillageId") ?? sessionStorage.getItem("selectedVillage");

            const clearSelectionAndRedirect = () => {
              sessionStorage.removeItem("selectedVillage");
              sessionStorage.removeItem("selectedVillageId");
              sessionStorage.removeItem("selectedVillageName");
              window.location.href = "/admin-village-selection";
            };

            if (!selectedVillageId) {
              // Redirect to village selection if no village is selected
              clearSelectionAndRedirect();
              return;
            }

            // Verify that the selected village is in the user's accessible villages
            const accessibleVillageIds: string[] = Array.isArray(json.village_ids)
              ? json.village_ids
              : [];
            if (
              json.role !== "superadmin" &&
              accessibleVillageIds.length > 0 &&
              !accessibleVillageIds.includes(selectedVillageId)
            ) {
              clearSelectionAndRedirect();
              return;
            }

          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        window.location.href = "/login";
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthAndRole();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) return <p>Loading...</p>;
  
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
