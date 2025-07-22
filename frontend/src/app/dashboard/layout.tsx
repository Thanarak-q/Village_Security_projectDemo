"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./dashboard_sidebar"
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
   
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full bg-gray-80">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}