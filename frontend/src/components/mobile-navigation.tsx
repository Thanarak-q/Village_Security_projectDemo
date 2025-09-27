"use client";

import {
  Home,
  BookUser,
  Building,
  History,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { type AdminRole } from "@/lib/roleUtils";

const mobileNavItems = [
  {
    title: "หน้าหลัก",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "ผู้ใช้",
    url: "/dashboard/user_manage",
    icon: BookUser,
  },
  {
    title: "บ้าน",
    url: "/dashboard/house_manage",
    icon: Building,
  },
  {
    title: "นิติบุคคล",
    url: "/dashboard/staff_manage",
    icon: Users,
  },
  {
    title: "ประวัติ",
    url: "/dashboard/history",
    icon: History,
  },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (res.ok) {
          const json = await res.json();
          setUserRole(json.role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  // Filter items based on user role
  const getFilteredItems = () => {
    if (userRole === "staff") {
      return mobileNavItems.filter(item => item.title !== "นิติบุคคล");
    }
    return mobileNavItems;
  };

  const filteredItems = getFilteredItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="flex items-center justify-around px-1 py-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.title}
                href={item.url}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 min-w-0 flex-1 mx-1",
                  isActive
                    ? "text-primary bg-primary/15 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <div className="relative">
                  <item.icon
                    className={cn(
                      "w-5 h-5 mb-1 transition-all duration-300",
                      isActive ? "scale-110" : "scale-100"
                    )}
                  />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-300 text-center leading-tight",
                    isActive ? "font-semibold" : "font-normal"
                  )}
                >
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
