"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./dashboard_sidebar";
import React, { useEffect, useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<any>(null);

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
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full bg-gray-80">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
