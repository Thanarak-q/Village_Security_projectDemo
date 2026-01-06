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
        // First try regular admin auth
        let res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        // If regular auth fails, try demo auth as fallback
        if (res.status === 401) {
          res = await fetch("/api/auth/demo/me", {
            credentials: "include",
          });

          if (!res.ok) {
            // Also check localStorage for demo admin (stored during demo login)
            const liffUser = localStorage.getItem('liffUser');
            if (liffUser) {
              const user = JSON.parse(liffUser);
              if (user.role === 'admin' || user.role === 'staff' || user.role === 'superadmin') {
                setData({
                  user: {
                    id: user.id,
                    username: user.username || user.fname,
                    email: user.email
                  },
                  role: user.role
                });
                setIsChecking(false);
                return;
              }
            }
            window.location.href = "/login";
            return;
          }

          // Demo auth successful - transform response for dashboard
          const demoData = await res.json();
          if (demoData.authenticated && ['admin', 'staff', 'superadmin'].includes(demoData.role)) {
            setData({
              user: {
                id: demoData.id || demoData.admin_id,
                username: demoData.username || demoData.fname,
                email: demoData.email,
              },
              role: demoData.role,
              village_ids: demoData.village_id ? [demoData.village_id] : [],
            } as any);
            setIsChecking(false);
            return;
          }

          window.location.href = "/login";
          return;
        }

        const json = await res.json();
        if (json) {
          setData(json);

          // Handle village selection based on user role
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

          } else if (json.role === "staff") {
            // For staff users, auto-select their assigned village
            const accessibleVillageIds: string[] = Array.isArray(json.village_ids)
              ? json.village_ids
              : [];

            if (accessibleVillageIds.length > 0) {
              const staffVillageId = accessibleVillageIds[0];
              const currentSelectedVillage = sessionStorage.getItem("selectedVillageId") ?? sessionStorage.getItem("selectedVillage");

              // Auto-set village for staff if not already set
              if (!currentSelectedVillage || currentSelectedVillage !== staffVillageId) {
                sessionStorage.setItem("selectedVillage", staffVillageId);
                sessionStorage.setItem("selectedVillageId", staffVillageId);

                // Set village name if available
                if (json.village_name) {
                  sessionStorage.setItem("selectedVillageName", json.village_name);
                }

                console.log("Auto-selected village for staff:", staffVillageId);
              }
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
