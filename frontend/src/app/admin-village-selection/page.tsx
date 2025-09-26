"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { Building2, Home, Users, Shield, LogOut } from "lucide-react";
// import { toast } from "sonner";
import { gsap } from "gsap";

interface Village {
  village_key: string;
  village_name: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  village_key?: string;
}

const VillageSelectionPage = () => {
  const router = useRouter();
  const [villages, setVillages] = useState<Village[]>([]);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVillage, setSelectedVillage] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Animation refs
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const villagesRef = useRef<HTMLDivElement>(null);
  const logoutRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Clear any existing selected village when entering village selection
    sessionStorage.removeItem("selectedVillage");
    
    // Check authentication and get admin data
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const userData = await response.json();
        
        if (userData.role !== "admin" && userData.role !== "superadmin") {
          // toast.error("Access denied. Admin role required.");
          router.push("/login");
          return;
        }

        setAdminUser(userData);

        // Fetch admin villages
        const villagesResponse = await fetch("/api/villages/admin", {
          credentials: "include",
        });

        if (villagesResponse.ok) {
          const villagesData = await villagesResponse.json();
          if (villagesData.success) {
            setVillages(villagesData.data);
          } else {
            // toast.error(villagesData.error || "Failed to fetch villages");
          }
        } else {
          // toast.error("Failed to fetch villages");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        // toast.error("Authentication error");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      // Initial animation
      gsap.fromTo(
        [titleRef.current, subtitleRef.current],
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "power2.out" }
      );

      gsap.fromTo(
        villagesRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power2.out" }
      );

      gsap.fromTo(
        logoutRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, delay: 0.6, ease: "back.out(1.7)" }
      );

      // Special animation for single village - make it feel more prominent
      if (villages.length === 1) {
        const singleVillageCard = villagesRef.current?.querySelector('[data-village-key]');
        if (singleVillageCard) {
          gsap.fromTo(
            singleVillageCard,
            { scale: 0.9, opacity: 0 },
            { 
              scale: 1, 
              opacity: 1, 
              duration: 0.6, 
              delay: 0.8, 
              ease: "back.out(1.2)" 
            }
          );
        }
      }
    }
  }, [loading, villages.length]);

  const handleVillageSelect = async (villageKey: string) => {
    if (isSelecting) return;
    
    setIsSelecting(true);
    setSelectedVillage(villageKey);

    // Store selected village in sessionStorage for dashboard access
    sessionStorage.setItem("selectedVillage", villageKey);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('villageChanged', { 
      detail: { villageKey } 
    }));

    // Animation for selection
    const selectedCard = document.querySelector(`[data-village-key="${villageKey}"]`);
    if (selectedCard) {
      gsap.to(selectedCard, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.to(selectedCard, { scale: 1, duration: 0.2 });
        }
      });
    }

    // Show success message and redirect
    // toast.success("Village selected successfully!");
    
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      // Clear all session data
      sessionStorage.clear();
      localStorage.clear();
      
      router.push("/login");
      // toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // toast.error("Logout failed");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
        return <Shield className="w-5 h-5" />;
      case "admin":
        return <Building2 className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

//   const getRoleText = (role: string) => {
//     switch (role) {
//       case "superadmin":
//         return "เจ้าของ SE";
//       case "admin":
//         return "เจ้าของโครงการ";
//       default:
//         return "ผู้จัดการ";
//     }
//   };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-border">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Home className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Village Security</h1>
            <p className="text-muted-foreground text-sm">Management System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <ModeToggle />
          <Button
            ref={logoutRef}
            variant="outline"
            onClick={handleLogout}
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-12">
          <h2 
            ref={titleRef}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Welcome, {adminUser?.username}
          </h2>
          <p 
            ref={subtitleRef}
            className="text-xl text-muted-foreground mb-2"
          >
            {/* {adminUser && getRoleText(adminUser.role)} */}
          </p>
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            {adminUser && getRoleIcon(adminUser.role)}
            <span className="text-sm">เลือกหมู่บ้านเพื่อจัดการ</span>
          </div>
        </div>

        {/* Villages Grid */}
        <div 
          ref={villagesRef}
          className="w-full max-w-4xl"
        >
          {villages.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  ไม่มีหมู่บ้านสำหรับจัดการ
                </h3>
                <p className="text-muted-foreground">
                  No villages have been assigned to your account yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-6 ${
              villages.length === 1 
                ? "grid-cols-1 justify-center max-w-lg mx-auto" 
                : villages.length === 2 
                ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}>
              {villages.map((village, index) => (
                <Card
                  key={village.village_key}
                  data-village-key={village.village_key}
                  className={`group cursor-pointer bg-card border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                    villages.length === 1 ? "scale-105" : ""
                  }`}
                  onClick={() => handleVillageSelect(village.village_key)}
                >
                  <CardContent className={`text-center ${
                    villages.length === 1 ? "p-10" : "p-8"
                  }`}>
                    <div className={`bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 ${
                      villages.length === 1 ? "w-20 h-20" : "w-16 h-16"
                    }`}>
                      <Building2 className={`text-primary-foreground ${
                        villages.length === 1 ? "w-10 h-10" : "w-8 h-8"
                      }`} />
                    </div>
                    <h3 className={`font-semibold text-foreground mb-2 group-hover:text-primary transition-colors ${
                      villages.length === 1 ? "text-2xl" : "text-xl"
                    }`}>
                      {village.village_name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      คลิกเพื่อจัดการหมู่บ้านนี้
                    </p>
                    {selectedVillage === village.village_key && isSelecting && (
                      <div className="mt-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Village Security Management System v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default VillageSelectionPage;
