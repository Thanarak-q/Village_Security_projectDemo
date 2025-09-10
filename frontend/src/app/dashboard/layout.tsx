"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./dashboard_sidebar";
import React, { useEffect, useState } from "react";
import Navbar from "./navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{ user?: { id: string; username: string; email: string }; role?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
      });
  }, []);

  if (!data) return <p>Loading...</p>;
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
