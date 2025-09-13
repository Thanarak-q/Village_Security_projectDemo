"use client";

import {
  Home,
  BookUser,
  Building,
  History,
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
  SidebarTrigger,
} from "@/components/ui/sidebar";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, memo } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
// import { MenuShowColor } from "@/components/animation";

const items = [
  {
    title: "หน้าหลัก",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "จัดการบัญชีผู้ใช้",
    url: "/dashboard/user_manage",
    icon: BookUser,
  },
  {
    title: "จัดการบ้าน",
    url: "/dashboard/house_manage",
    icon: Building,
  },
  {
    title: "ประวัติ",
    url: "/dashboard/history",
    icon: History,
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
    role: string;
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
          <SidebarGroupLabel className="my-3 border-border mb-6">
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
                  {userData?.village_name || "manager"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ระบบจัดการหมู่บ้าน
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
            {/* <MenuShowColor items={items}/>   */}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto border-t border-border">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarTrigger className="p-4 hover:bg-muted/50 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring hover:shadow-sm mx-2" />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
})

export { AppSidebar }
