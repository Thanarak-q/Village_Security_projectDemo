"use client";

import {
  Home,
  Building,
  Users,
  BarChart3,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, memo } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { type AdminRole } from "@/lib/roleUtils";

const items = [
  {
    title: "ภาพรวมระบบ",
    url: "/super-admin-dashboard",
    icon: Home,
  },
  {
    title: "จัดการหมู่บ้าน",
    url: "/super-admin-dashboard/villages",
    icon: Building,
  },
  {
    title: "จัดการ Admin",
    url: "/super-admin-dashboard/admins",
    icon: Users,
  },
  {
    title: "สถิติระบบ",
    url: "/super-admin-dashboard/stats",
    icon: BarChart3,
  },
];

const AppSidebar = memo(function AppSidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [userData, setUserData] = useState<{
    id: string;
    username: string;
    email: string;
    fname?: string;
    lname?: string;
    profileImage?: string;
    role: AdminRole;
    village_name?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 401) {
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json) setUserData(json);
      });
  }, []);

  return (
    <Sidebar className="sticky top-0 h-screen hidden md:block" collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup className="flex-1 min-h-0">
          <SidebarGroupLabel className="my-3 border-border" style={{ marginBottom: '1.7rem' }}>
            <div className="flex items-center gap-3 p-2">
              <div>
                <div className="w-12 h-12 overflow-hidden relative">
                  <Image
                    src={theme === "dark" ? "/house-white.png" : "/house-dark.png"}
                    alt="House"
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              </div>
              <div>
                <p className="scroll-m-20 text-xl font-semibold tracking-tight">
                  Super Admin
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ระบบจัดการระบบ
                </p>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="border-t border-border">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="group">
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={`py-4 px-4 h-auto text-base transition-all duration-300 ease-in-out rounded-lg mx-2 ${
                      pathname === item.url
                        ? "bg-primary/10 text-primary border-r-3 border-primary shadow-sm"
                        : "hover:bg-muted/50 hover:shadow-sm"
                    }`}
                  >
                    <Link href={item.url}>
                      <item.icon
                        className={`w-5 h-5 mr-3 transition-all duration-300 ${
                          pathname === item.url 
                            ? "text-primary scale-110" 
                            : "text-muted-foreground group-hover:text-foreground group-hover:scale-105"
                        }`}
                      />
                      <span
                        className={`transition-all duration-300 ${
                          pathname === item.url 
                            ? "font-semibold text-primary" 
                            : "font-medium group-hover:font-semibold"
                        }`}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto border-t border-border">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="p-4 text-sm text-muted-foreground">
                  <p className="font-medium">{userData?.username || "Loading..."}</p>
                  <p className="text-xs">Super Administrator</p>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
})

export { AppSidebar }
