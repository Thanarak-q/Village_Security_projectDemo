import {
  Home,
  Settings,
  BookUser,
  Building,
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
import { MenuShowColor } from "@/components/animation";


import Link from "next/link";

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
    title: "การตั้งค่า",
    url: "/dashboard/setting_manage",
    icon: Settings,
  },
];

export function AppSidebar() {
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
                    className="py-3 md:py-4 px-2 md:px-3 h-auto text-sm md:text-base"
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <MenuShowColor items={items} />
            
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
