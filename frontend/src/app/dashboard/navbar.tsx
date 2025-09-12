"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { gsap } from "gsap";
import NotificationComponent from "./(main)/notification";
import { ModeToggle } from "@/components/mode-toggle";
import { useTheme } from "next-themes";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function Navbar() {
  const pathname = usePathname();
  const [userData, setUserData] = useState<{
    id: string;
    username: string;
    email: string;
    fname?: string;
    lname?: string;
    profileImage?: string;
    role: string;
  } | null>(null);
  const titleSpinRef = useRef<HTMLSpanElement>(null);
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const isAnimatingRef = useRef(false);
  const { theme } = useTheme();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const currentDate = new Date();
  const thaiDate = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(currentDate);

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

  // Function to start animation
  const startAnimation = useCallback(() => {
    if (!titleSpinRef.current || !userData || isAnimatingRef.current) return;

    const titleTexts = ["สวัสดีครับ", `${userData.username}`];

    // Set initial state
    gsap.set(titleSpinRef.current, {
      y: 20,
      opacity: 0,
      rotationX: -90,
      transformOrigin: "center bottom",
    });

    // Reset index
    setCurrentTitleIndex(0);
    isAnimatingRef.current = true;

    // Create timeline
    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.5,
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });

    // Initial entrance
    // tl.to(titleSpinRef.current, {
    //   duration: 0.8,
    //   y: 0,
    //   opacity: 1,
    //   rotationX: 0,
    //   ease: "power2.inOut",
    //   delay: 0.3
    // })

    // Loop animation
    titleTexts.forEach((_, index: number) => {
      tl.to(titleSpinRef.current, {
        duration: 0.2,
        y: -10,
        opacity: 0,
        rotationX: 90,
        ease: "power2.inOut",
        onComplete: () => {
          setCurrentTitleIndex(index);
        },
      })
        .to(titleSpinRef.current, {
          duration: 0.5,
          y: 0,
          opacity: 1,
          rotationX: 0,
          ease: "power2.inOut",
        })
        .to({}, { duration: 2.5 });
    });

    animationRef.current = tl;
  }, [userData]);

  // Function to stop animation
  const stopAnimation = () => {
    if (animationRef.current) {
      animationRef.current.kill();
      animationRef.current = null;
    }
    if (titleSpinRef.current) {
      gsap.killTweensOf(titleSpinRef.current);
      gsap.set(titleSpinRef.current, { clearProps: "all" });
    }
    isAnimatingRef.current = false;
    setCurrentTitleIndex(0);
  };

  // Effect for pathname changes
  useEffect(() => {
    if (pathname === "/dashboard" && userData) {
      // Start animation only if not already running
      if (!isAnimatingRef.current) {
        startAnimation();
      }
    } else {
      // Stop animation when leaving dashboard
      stopAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [pathname, userData, startAnimation]);

  // Effect for userData changes (only when on dashboard)
  useEffect(() => {
    if (pathname === "/dashboard" && userData && !isAnimatingRef.current) {
      startAnimation();
    }
  }, [userData, pathname, startAnimation]);

  // Logout function
  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "GET",
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.message || "Logout failed");
      }

      console.log("Logout successful");
      setShouldRedirect(true);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = "/login";
    }
  }, [shouldRedirect]);

  // Dynamic content based on current route
  const getPageContent = () => {
    switch (pathname) {
      case "/dashboard":
        return {
          title: "", // Will be replaced by spinning animation
          subtitle: new Date().toLocaleDateString("th-TH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          titleClass:
            "text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground",
          subtitleClass: "text-xs sm:text-sm text-muted-foreground",
        };
      case "/dashboard/user_manage":
        return {
          title: "จัดการผู้ใช้งาน",
          subtitle: "จัดการข้อมูลผู้ใช้งานทั้งหมดในระบบ",
          titleClass:
            "text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground",
          subtitleClass: "text-xs sm:text-sm text-muted-foreground",
        };
      case "/dashboard/house_manage":
        return {
          title: "การจัดการบ้าน",
          subtitle: "จัดการข้อมูลบ้านและสถานะการอยู่อาศัย",
          titleClass:
            "text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground",
          subtitleClass: "text-xs sm:text-sm text-muted-foreground",
        };
      case "/dashboard/setting_manage":
        return {
          title: "การตั้งค่า",
          subtitle: "จัดการการตั้งค่าระบบ",
          titleClass:
            "text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground",
          subtitleClass: "text-xs sm:text-sm text-muted-foreground",
        };
      case "/dashboard/history":
        return {
          title: "ประวัติ",
          subtitle: "ดูประวัติการใช้งานระบบ",
          titleClass:
            "text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground",
          subtitleClass: "text-xs sm:text-sm text-muted-foreground",
        };
      default:
        return {
          title: "การจัดการบ้าน",
          subtitle: thaiDate,
          titleClass:
            "text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground",
          subtitleClass: "text-xs sm:text-sm text-muted-foreground",
        };
    }
  };

  const pageContent = getPageContent();

  return (
    <nav className="w-full sticky top-0 z-50">
      {/* ส่วนเนื้อหาสีขาว */}
      <div className="bg-background p-4 flex justify-between items-center border-b border-border h-20">
        {/* ด้านซ้าย - ข้อความ */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              {/* Dashboard Title with Spinning Animation */}
              {pathname === "/dashboard" ? (
                <div className="relative overflow-hidden h-8 flex items-center">
                  <span
                    ref={titleSpinRef}
                    className="inline-block text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground transform-gpu"
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: "1000px",
                    }}
                  >
                    {userData &&
                      (currentTitleIndex === 0
                        ? "สวัสดีคุณผู้จัดการ"
                        : `${userData.username} `)}
                  </span>
                </div>
              ) : (
                <h1 className={pageContent.titleClass}>{pageContent.title}</h1>
              )}
            </div>
            <p className={pageContent.subtitleClass}>{pageContent.subtitle}</p>
          </div>
        </div>

        {/* ด้านขวา - ไอคอนและโปรไฟล์ */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ModeToggle />

          {/* Notification Component */}
          <NotificationComponent />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-12 w-12 rounded-md">
                <div className="h-12 w-12 overflow-hidden flex items-center justify-center relative rounded-md">
                  <Image
                    src={userData?.profileImage || (theme === "dark" ? "/user-white.png" : "/user-dark.png")}
                    alt={
                      userData?.fname && userData?.lname
                        ? `${userData.fname} ${userData.lname} Profile`
                        : "Profile Picture"
                    }
                    fill
                    className="object-contain"
                    sizes="48px"
                    onError={() => {
                      // Fallback handled by src prop
                    }}
                  />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userData?.fname && userData?.lname
                      ? `${userData.fname} ${userData.lname}`
                      : userData?.username || "ผู้ใช้งาน"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userData?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/setting_manage" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>การตั้งค่า</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
                variant="destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>ออกจากระบบ</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
