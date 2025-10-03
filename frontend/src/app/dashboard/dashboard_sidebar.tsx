"use client";

import {
  Home,
  BookUser,
  Building,
  History,
  Bell,
  Settings,
  Users,
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
// import { MenuShowColor } from "@/components/animation";
import { getSelectedVillage } from "@/lib/villageSelection";

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
    title: "จัดการนิติบุคคล",
    url: "/dashboard/staff_manage",
    icon: Users,
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

const getAdminItems = (userRole: string) => {
  const baseItems = [...items];
  
  // Hide "จัดการนิติบุคคล" (Legal Entity Management) for staff users
  if (userRole === "staff") {
    const filteredItems = baseItems.filter(item => item.title !== "จัดการนิติบุคคล");
    return filteredItems;
  }
  
  // Add village selection for admin/superadmin users
  if (userRole === "admin" || userRole === "superadmin") {
    baseItems.push({
      title: "เปลี่ยนหมู่บ้าน",
      url: "/admin-village-selection",
      icon: Settings,
    });
  }
  
  return baseItems;
};

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
  const [selectedVillageName, setSelectedVillageName] = useState<string>("");

  const fetchVillageNameById = async (villageId: string) => {
    try {
      const villageRes = await fetch(`/api/villages/check/${villageId}`, {
        credentials: "include",
      });
      if (villageRes.ok) {
        const villageData = await villageRes.json();
        if (villageData.exists && villageData.village_name) {
          setSelectedVillageName(villageData.village_name);
          sessionStorage.setItem("selectedVillageName", villageData.village_name);
        }
      }
    } catch (error) {
      console.error("Error fetching village name:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null;
        }
        
        const json = await res.json();
        if (json) {
          setUserData(json);
          
          const { key, name } = getSelectedVillage();

          if (json.role === "admin" || json.role === "superadmin") {
            if (name) {
              setSelectedVillageName(name);
            } else if (key) {
              fetchVillageNameByKey(key);
            }
          } else if (json.role === "staff") {
            // For staff users, use their assigned village name
            if (json.village_name) {
              setSelectedVillageName(json.village_name);
            } else if (json.village_ids && json.village_ids.length > 0) {
              // Fetch village name by ID if village_name is not available
              fetchVillageNameById(json.village_ids[0]);
            }
          }

          if (!name && json.village_name) {
            setSelectedVillageName(json.village_name);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();

    // Listen for village changes to update the village name display
    const handleVillageChange = (event: Event) => {
      const detail = (event as CustomEvent<{ villageName?: string; villageId?: string }>).detail;

      if (detail?.villageName) {
        setSelectedVillageName(detail.villageName);
        sessionStorage.setItem("selectedVillageName", detail.villageName);
        return;
      }

      if (detail?.villageId) {
        fetchVillageNameById(detail.villageId);
        return;
      }

      const { key, name } = getSelectedVillage();
      if (name) {
        setSelectedVillageName(name);
      } else if (key) {
        fetchVillageNameByKey(key);
      }
    };

    window.addEventListener('villageChanged', handleVillageChange as EventListener);

    return () => {
      window.removeEventListener('villageChanged', handleVillageChange as EventListener);
    };
  }, [userData?.role]);


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
                  {selectedVillageName || userData?.village_name || "หมู่บ้าน"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ระบบจัดการหมู่บ้าน
                </p>
  
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="border-t border-border">
            <SidebarMenu>
              {getAdminItems(userData?.role || "").map((item) => (
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
                {/* <SidebarTrigger className="p-4 hover:bg-muted/50 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring hover:shadow-sm mx-2" /> */}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
})

export { AppSidebar }
