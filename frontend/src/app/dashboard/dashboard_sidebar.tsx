"use client";

import {
  Home,
  Settings,
  BookUser,
  Building,
  LogOut,
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
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
  {
    title: "การตั้งค่า",
    url: "/dashboard/setting_manage",
    icon: Settings,
  },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const { setOpen } = useSidebar();

  async function onSubmit() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "GET",
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.message || "Login failed");
      }

      console.log("Login successful");
      setShouldRedirect(true);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/login");
    }
  }, [shouldRedirect, router]);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="">
          <SidebarGroupLabel className="my-3 md:my-5 border-gray-200 mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3">
              <div>
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14">
                  <AvatarImage src="https://www.lifeandliving.co.th/wp-content/uploads/2022/01/%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%88%E0%B8%B1%E0%B8%94%E0%B8%AA%E0%B8%A3%E0%B8%A3-%E0%B8%A3%E0%B8%B0%E0%B8%A2%E0%B8%AD%E0%B8%87.jpg.webp" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  หมู่บ้านไทย
                </p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  ระบบจัดการหมู่บ้าน
                </p>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="border-t border-gray-200">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="">
                  <SidebarMenuButton
                    asChild
                    className={`py-3 md:py-4 px-2 md:px-3 h-auto text-sm md:text-base transition-all duration-200 ${
                      pathname === item.url
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Link 
                      href={item.url}
                      onClick={() => {
                        // Close sidebar on mobile when menu item is clicked
                        if (window.innerWidth < 768) {
                          setOpen(false);
                        }
                      }}
                    >
                      <item.icon
                        className={`w-4 h-4 md:w-5 md:h-5 ${
                          pathname === item.url ? "text-blue-600" : ""
                        }`}
                      />
                      <span
                        className={pathname === item.url ? "font-semibold" : ""}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem key="logout" className="">
                <SidebarMenuButton
                  asChild
                  className="py-3 md:py-4 px-2 md:px-3 h-auto text-sm md:text-base font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Link href="" onClick={onSubmit}>
                    <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                    <span>ออกจากระบบ</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {/* <MenuShowColor items={items}/>   */}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
