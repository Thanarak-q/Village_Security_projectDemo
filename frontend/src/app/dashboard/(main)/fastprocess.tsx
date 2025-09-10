"use client";
import Link from "next/link";
import { Users, Home, Shield, Search } from "lucide-react";

const quickActions = [
  {
    id: 1,
    title: "เพิ่มผู้อยู่อาศัย",
    icon: Users,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
    url: "/add-resident",
  },
  {
    id: 2,
    title: "ส่งการแจ้งเตือน",
    icon: Home,
    iconColor: "text-cyan-500",
    bgColor: "bg-cyan-50",
    url: "/monthly-report",
  },
  {
    id: 3,
    title: "สร้างรายงาน",
    icon: Shield,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-50",
    url: "/create-report",
  },
  {
    id: 4,
    title: "ค้นหาผู้อยู่อาศัย",
    icon: Search,
    iconColor: "text-red-500",
    bgColor: "bg-red-50",
    url: "/search-resident",
  },
];

export default function FastProcessPage() {
  return (
    <div className="bg-muted">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight text-foreground">
            การดำเนินการด่วน
          </h1>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link
                key={action.id}
                href={action.url}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className={`p-4 rounded-full ${action.bgColor} mb-4`}>
                    <IconComponent className={`h-8 w-8 ${action.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">
                    {action.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
