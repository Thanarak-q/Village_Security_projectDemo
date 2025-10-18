"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const [userData, setUserData] = useState<{
    id: string;
    username: string;
    email: string;
    role: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((json) => {
        if (json) setUserData(json);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "GET",
        credentials: "include",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex h-16 items-center justify-between px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Super Admin Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={userData?.username || ""} />
                <AvatarFallback className="text-xs">
                  {userData?.username ? getInitials(userData.username) : "SA"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userData?.username || "Loading..."}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userData?.email || ""}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  Super Administrator
                </p>
              </div>
            </DropdownMenuLabel>
            {/* <DropdownMenuSeparator />
            {/* <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/dashboard")}
            >
              {/* <User className="mr-2 h-4 w-4" />
              <span>ไปยัง Dashboard ปกติ</span> */}
            {/* </DropdownMenuItem> */} 
            {/* <DropdownMenuSeparator />  */}
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>ออกจากระบบ</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
