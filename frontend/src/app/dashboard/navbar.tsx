"use client";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import NotificationComponent from "./(main)/notification";
import { ModeToggle } from "@/components/mode-toggle";
import { useTheme } from "next-themes";
import Image from "next/image";

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
  const { open } = useSidebar();
  const { theme } = useTheme();

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
            "text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground",
          subtitleClass: "text-xs sm:text-sm md:text-base text-muted-foreground",
        };
      case "/dashboard/user_manage":
        return {
          title: "จัดการผู้ใช้งาน",
          subtitle: "จัดการข้อมูลผู้ใช้งานทั้งหมดในระบบ",
          titleClass:
            "text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground",
          subtitleClass: "text-xs sm:text-sm md:text-base text-muted-foreground",
        };
      case "/dashboard/house_manage":
        return {
          title: "การจัดการบ้าน",
          subtitle: "จัดการข้อมูลบ้านและสถานะการอยู่อาศัย",
          titleClass:
            "text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground",
          subtitleClass: "text-sm sm:text-base text-muted-foreground",
        };
      case "/dashboard/setting_manage":
        return {
          title: "การตั้งค่า",
          subtitle: "จัดการการตั้งค่าระบบ",
          titleClass: "text-2xl font-bold text-foreground",
          subtitleClass: "text-sm text-muted-foreground",
        };
      default:
        return {
          title: "การจัดการบ้าน",
          subtitle: thaiDate,
          titleClass: "text-2xl font-bold text-foreground",
          subtitleClass: "text-sm text-muted-foreground",
        };
    }
  };

  const pageContent = getPageContent();

  return (
    <nav className="w-full">
      {/* ส่วนเนื้อหาสีขาว */}
      <div className="bg-background p-4 flex justify-between items-center border-b border-border">
        {/* ด้านซ้าย - ข้อความ */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle with Custom Icon */}
          <SidebarTrigger className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
            {open ? (
              <X className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-muted-foreground" />
            )}
          </SidebarTrigger>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              {/* Dashboard Title with Spinning Animation */}
              {pathname === "/dashboard" ? (
                <div className="relative overflow-hidden h-10 flex items-center">
                  <span
                    ref={titleSpinRef}
                    className="inline-block text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground transform-gpu"
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: "1000px",
                    }}
                  >
                    {userData &&
                      (currentTitleIndex === 0
                        ? "สวัสดีคุณผู้จัดการ"
                        : `${userData.username} 👋`)}
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

          {/* รูปโปรไฟล์และชื่อ */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center relative">
              <Image
                src={userData?.profileImage || (theme === "dark" ? "/user-white.png" : "/user-dark.png")}
                alt={
                  userData?.fname && userData?.lname
                    ? `${userData.fname} ${userData.lname} Profile`
                    : "Profile Picture"
                }
                fill
                className="object-cover"
                sizes="40px"
                onError={() => {
                  // Fallback handled by src prop
                }}
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-foreground font-medium text-sm">
                {userData?.fname && userData?.lname
                  ? `${userData.fname} ${userData.lname}`
                  : userData?.username || "ผู้ใช้งาน"}
              </span>
              <span className="text-muted-foreground text-xs">
                {userData?.role === "admin"
                  ? "ผู้จัดการ"
                  : userData?.role || ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
