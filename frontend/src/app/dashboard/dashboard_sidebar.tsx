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

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback, memo } from "react";
import { useSidebar } from "@/components/ui/sidebar";
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
  {
    title: "การตั้งค่า",
    url: "/dashboard/setting_manage",
    icon: Settings,
  },
];

const AppSidebar = memo(function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const { setOpen } = useSidebar();
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

  const onSubmit = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/login");
    }
  }, [shouldRedirect, router]);

  return (
    <Sidebar className="sticky top-0 h-screen" collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup className="flex-1 min-h-0">
          <SidebarGroupLabel className="my-2 md:my-3 border-border mb-2 md:mb-3">
            <div className="flex items-center gap-2 md:gap-3 p-1 md:p-2">
              <div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 overflow-hidden relative">
                  <Image
                    src={theme === "dark" ? "/house-white.png" : "/house-dark.png"}
                    alt="House"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, 56px"
                  />
                </div>
              </div>
              <div>
                <p className="scroll-m-20 text-xl font-semibold tracking-tight">
                  {userData?.village_name || "manager"
                  }
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  ระบบจัดการหมู่บ้าน
                </p>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="border-t border-border">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="">
                  <SidebarMenuButton
                    asChild
                    className={`py-2 md:py-3 px-2 md:px-3 h-auto text-sm md:text-base transition-all duration-200 ${
                      pathname === item.url
                        ? "bg-accent text-accent-foreground border-r-2 border-primary"
                        : "hover:bg-muted"
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
                          pathname === item.url ? "text-primary" : ""
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
            </SidebarMenu>
            {/* <MenuShowColor items={items}/>   */}
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Footer with Logout Button */}
        <SidebarGroup className="mt-auto border-t border-border">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="py-2 md:py-3 px-2 md:px-3 h-auto text-sm md:text-base font-bold text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-colors"
                >
                  <Link href="" onClick={onSubmit}>
                    <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                    <span>ออกจากระบบ</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
})

export { AppSidebar }
