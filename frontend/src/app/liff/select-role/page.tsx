"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User, Shield, ArrowLeft, Home, Loader2, Clock } from "lucide-react";
import { getAuthData, switchUserRole } from "@/lib/liffAuth";
import { LiffService } from "@/lib/liff";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { RoleHouse, UserRole } from "@/types/roles";
const RESIDENT_SELECTION_STORAGE_KEY = "residentRoleSelection";
const GUARD_SELECTION_STORAGE_KEY = "guardRoleSelection";

export default function SelectRolePage() {
  const router = useRouter();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingRole, setSwitchingRole] = useState<
    "resident" | "guard" | null
  >(null);
  const [residentSelectionOpen, setResidentSelectionOpen] = useState(false);
  const [selectedResidentOption, setSelectedResidentOption] =
    useState<UserRole | null>(null);
  const [selectedResidentHouseId, setSelectedResidentHouseId] = useState<
    string | null
  >(null);
  const [guardSelectionOpen, setGuardSelectionOpen] = useState(false);
  const [selectedGuardOption, setSelectedGuardOption] =
    useState<UserRole | null>(null);

  const residentRoles = useMemo(
    () => userRoles.filter((role) => role.role === "resident"),
    [userRoles],
  );
  const guardRoles = useMemo(
    () => userRoles.filter((role) => role.role === "guard"),
    [userRoles],
  );

  useEffect(() => {
    const fetchUserRoles = async () => {
      const { user } = getAuthData();
      if (user) {
        const userId = user.lineUserId || user.id;
        console.log(
          "🔍 Select role page - fetching roles for user ID:",
          userId,
        );

        if (userId) {
          try {
            // Ensure we have a valid token before making API calls
            const svc = LiffService.getInstance();
            const validToken = await svc.ensureValidToken();
            if (!validToken) {
              console.warn("⚠️ No valid token available, redirecting to LIFF");
              router.push("/liff");
              return;
            }

            const response = await fetch(
              `/api/users/roles?lineUserId=${userId}`,
              {
                credentials: "include",
              },
            );

            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                console.log("🔍 Select role page - roles API response:", data);

                if (data.success && data.roles) {
                  setUserRoles(data.roles);
                } else {
                  setError("ไม่พบข้อมูลบทบาท");
                }
              } else {
                setError("ได้รับข้อมูลที่ไม่ถูกต้องจากเซิร์ฟเวอร์");
              }
            } else {
              setError("เกิดข้อผิดพลาดในการดึงข้อมูลบทบาท");
            }
          } catch (error) {
            console.error("Error fetching user roles:", error);
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
          }
        } else {
          setError("ไม่พบข้อมูลผู้ใช้");
        }
      } else {
        setError("ไม่พบข้อมูลการเข้าสู่ระบบ");
      }
      setLoading(false);
    };

    fetchUserRoles();
  }, [router]);

  useEffect(() => {
    if (residentSelectionOpen && typeof window !== "undefined") {
      try {
        const storedSelectionRaw = localStorage.getItem(
          RESIDENT_SELECTION_STORAGE_KEY,
        );
        if (storedSelectionRaw) {
          const storedSelection = JSON.parse(storedSelectionRaw);
          const preferred = residentRoles
            .filter((role) => role.role === "resident")
            .find((role) => {
              if (
                storedSelection.residentId &&
                role.resident_id === storedSelection.residentId
              ) {
                return true;
              }
              if (
                storedSelection.villageId &&
                role.village_id === storedSelection.villageId
              ) {
                return true;
              }
              return false;
            });
          if (preferred) {
            setSelectedResidentOption(preferred);
            const houses: RoleHouse[] = preferred.houses ?? [];
            if (
              storedSelection.houseId &&
              houses.some((house) => house.house_id === storedSelection.houseId)
            ) {
              setSelectedResidentHouseId(storedSelection.houseId);
            }
          }
        }
      } catch (error) {
        console.warn(
          "⚠️ Unable to read stored resident selection for modal:",
          error,
        );
      }
    }
  }, [residentSelectionOpen, residentRoles]);

  useEffect(() => {
    if (guardSelectionOpen && typeof window !== "undefined") {
      try {
        const storedSelectionRaw = localStorage.getItem(
          GUARD_SELECTION_STORAGE_KEY,
        );
        if (storedSelectionRaw) {
          const storedSelection = JSON.parse(storedSelectionRaw);
          const preferred = guardRoles
            .filter((role) => role.role === "guard")
            .find((role) => {
              if (
                storedSelection.guardId &&
                role.guard_id === storedSelection.guardId
              ) {
                return true;
              }
              if (
                storedSelection.villageId &&
                role.village_id === storedSelection.villageId
              ) {
                return true;
              }
              return false;
            });
          if (preferred) {
            setSelectedGuardOption(preferred);
          }
        }
      } catch (error) {
        console.warn(
          "⚠️ Unable to read stored guard selection for modal:",
          error,
        );
      }
    }
  }, [guardSelectionOpen, guardRoles]);

  const handleResidentClick = () => {
    if (residentRoles.length === 0) {
      return;
    }

    if (residentRoles.length === 1) {
      const [onlyResident] = residentRoles;
      const houses = onlyResident.houses ?? [];
      if (houses.length <= 1) {
        const houseInfo =
          houses.length === 1
            ? {
                house_id: houses[0].house_id,
                house_address: houses[0].house_address ?? null,
              }
            : { house_id: null, house_address: null };

        void handleRoleSelection("resident", {
          selectedRoleEntry: onlyResident,
          selectedHouse: houseInfo,
        });
      } else {
        setResidentSelectionOpen(true);
        setSelectedResidentOption(onlyResident);
        setSelectedResidentHouseId(null);
      }
      return;
    }

    setResidentSelectionOpen(true);
    setSelectedResidentOption(null);
    setSelectedResidentHouseId(null);
  };

  const handleResidentSelectionChange = (roleEntry: UserRole) => {
    setSelectedResidentOption(roleEntry);
    const houses = roleEntry.houses ?? [];
    if (houses.length === 1) {
      setSelectedResidentHouseId(houses[0].house_id);
    } else {
      setSelectedResidentHouseId(null);
    }
  };

  const handleResidentSelectionConfirm = () => {
    if (!selectedResidentOption) {
      return;
    }

    const houses = selectedResidentOption.houses ?? [];
    if (houses.length > 0) {
      const selectedHouse = houses.find(
        (house) => house.house_id === selectedResidentHouseId,
      );
      if (!selectedHouse) {
        return;
      }

      void handleRoleSelection("resident", {
        selectedRoleEntry: selectedResidentOption,
        selectedHouse: {
          house_id: selectedHouse.house_id,
          house_address: selectedHouse.house_address ?? null,
        },
      });
      return;
    }

    void handleRoleSelection("resident", {
      selectedRoleEntry: selectedResidentOption,
      selectedHouse: { house_id: null, house_address: null },
    });
  };

  const handleResidentSelectionOpenChange = (open: boolean) => {
    setResidentSelectionOpen(open);
    if (!open) {
      setSelectedResidentOption(null);
      setSelectedResidentHouseId(null);
    }
  };

  const handleRoleSelection = async (
    role: "resident" | "guard",
    options?: {
      selectedRoleEntry?: UserRole;
      selectedHouse?: { house_id: string | null; house_address: string | null };
    },
  ) => {
    if (switchingRole) return; // Prevent multiple clicks

    try {
      setSwitchingRole(role);
      console.log(`🔄 Switching to ${role} role...`);

      // Check if the selected role is pending
      const selectedRoleData =
        options?.selectedRoleEntry ?? userRoles.find((r) => r.role === role);
      const isPending = selectedRoleData?.status === "pending";

      console.log(
        `🔍 Selected role data:`,
        selectedRoleData,
        `isPending:`,
        isPending,
      );

      const switchOptions =
        role === "resident"
          ? {
              residentId: options?.selectedRoleEntry?.resident_id,
              villageId: options?.selectedRoleEntry?.village_id,
              houseId: options?.selectedHouse?.house_id ?? null,
              houseAddress: options?.selectedHouse?.house_address ?? null,
              villageName: options?.selectedRoleEntry?.village_name ?? null,
            }
          : {
              guardId: options?.selectedRoleEntry?.guard_id,
              villageId: options?.selectedRoleEntry?.village_id,
              villageName: options?.selectedRoleEntry?.village_name ?? null,
            };

      const result = await switchUserRole(role, switchOptions);

      if (result.success) {
        console.log(`✅ Successfully switched to ${role} role`);

        if (role === "resident") {
          setResidentSelectionOpen(false);
          setSelectedResidentOption(null);
          setSelectedResidentHouseId(null);
          if (typeof window !== "undefined") {
            if (options?.selectedRoleEntry?.village_id) {
              sessionStorage.setItem(
                "selectedVillage",
                options.selectedRoleEntry.village_id,
              );
              sessionStorage.setItem(
                "selectedVillageId",
                options.selectedRoleEntry.village_id,
              );
            }
            if (options?.selectedRoleEntry?.village_name) {
              sessionStorage.setItem(
                "selectedVillageName",
                options.selectedRoleEntry.village_name,
              );
            }
            if (options?.selectedHouse?.house_id) {
              sessionStorage.setItem(
                "selectedHouseId",
                options.selectedHouse.house_id,
              );
            } else {
              sessionStorage.removeItem("selectedHouseId");
            }
            if (options?.selectedHouse?.house_address) {
              sessionStorage.setItem(
                "selectedHouseAddress",
                options.selectedHouse.house_address,
              );
            } else {
              sessionStorage.removeItem("selectedHouseAddress");
            }
            window.dispatchEvent(new CustomEvent("villageChanged"));
          }
        }
        if (role === "guard") {
          setGuardSelectionOpen(false);
          setSelectedGuardOption(null);
          if (typeof window !== "undefined") {
            if (options?.selectedRoleEntry?.village_id) {
              sessionStorage.setItem(
                "selectedVillage",
                options.selectedRoleEntry.village_id,
              );
              sessionStorage.setItem(
                "selectedVillageId",
                options.selectedRoleEntry.village_id,
              );
            }
            if (options?.selectedRoleEntry?.village_name) {
              sessionStorage.setItem(
                "selectedVillageName",
                options.selectedRoleEntry.village_name,
              );
            }
            sessionStorage.removeItem("selectedHouseId");
            sessionStorage.removeItem("selectedHouseAddress");
            window.dispatchEvent(new CustomEvent("villageChanged"));
          }
        }

        // Redirect based on role status
        if (isPending) {
          // User has pending status for this role, redirect to pending page
          if (role === "resident") {
            console.log("⏳ Redirecting to Resident pending page");
            router.push("/Resident/pending");
          } else if (role === "guard") {
            console.log("⏳ Redirecting to Guard pending page");
            router.push("/guard/pending");
          }
        } else {
          // User has verified status for this role, redirect to main page
          if (role === "resident") {
            console.log("✅ Redirecting to Resident main page");
            router.push("/Resident");
          } else if (role === "guard") {
            console.log("✅ Redirecting to Guard main page");
            router.push("/guard");
          }
        }
      } else if (result.needsRedirect && result.redirectTo) {
        // Handle the special case where user needs to go to the role page first
        console.log(
          `🔄 Redirecting to ${result.redirectTo} first, then will redirect to LIFF`,
        );
        router.push(result.redirectTo);
      } else {
        console.error(`❌ Failed to switch to ${role} role:`, result.error);
        alert(`ไม่สามารถสลับบทบาทได้: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error switching to ${role} role:`, error);
      alert("เกิดข้อผิดพลาดในการสลับบทบาท");
    } finally {
      setSwitchingRole(null);
    }
  };

  const handleGuardClick = () => {
    if (guardRoles.length === 0) {
      return;
    }

    if (guardRoles.length === 1) {
      const [onlyGuard] = guardRoles;
      void handleRoleSelection("guard", {
        selectedRoleEntry: onlyGuard,
      });
      return;
    }

    setSelectedGuardOption(null);
    setGuardSelectionOpen(true);
  };

  const handleGuardSelectionConfirm = () => {
    if (!selectedGuardOption) {
      return;
    }
    void handleRoleSelection("guard", {
      selectedRoleEntry: selectedGuardOption,
    });
  };

  const handleGuardSelectionOpenChange = (open: boolean) => {
    setGuardSelectionOpen(open);
    if (!open) {
      setSelectedGuardOption(null);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="bg-card rounded-2xl border shadow-lg">
            <div className="px-4 py-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-red-400 text-2xl">
                  ⚠️
                </span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                เกิดข้อผิดพลาด
              </h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={handleGoBack}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                กลับ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show all roles regardless of status - let the main pages handle status checking
  const hasResidentRole = residentRoles.length > 0;
  const hasGuardRole = guardRoles.length > 0;
  const residentHasPending = residentRoles.some(
    (role) => role.status === "pending",
  );
  const guardHasPending = guardRoles.some((role) => role.status === "pending");
  const residentConfirmDisabled =
    switchingRole === "resident" ||
    !selectedResidentOption ||
    ((selectedResidentOption?.houses?.length ?? 0) > 0 &&
      !selectedResidentHouseId);

  if (!hasResidentRole && !hasGuardRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="bg-card rounded-2xl border shadow-lg">
            <div className="px-4 py-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-red-400 text-2xl">
                  ❌
                </span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                ไม่พบบทบาท
              </h2>
              <p className="text-muted-foreground mb-4">
                ไม่พบบทบาทที่สามารถใช้งานได้ กรุณาลงทะเบียนบทบาทก่อน
              </p>
              <button
                onClick={handleGoBack}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                กลับ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-card rounded-2xl border shadow-lg">
          {/* Header */}
          <div className="px-4 py-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGoBack}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                  <Home className="w-6 h-6 sm:w-7 sm:h-7" />
                  เลือกบทบาท
                </h1>
              </div>
              <ModeToggle />
            </div>
            <p className="text-sm text-muted-foreground">
              เลือกบทบาทที่ต้องการใช้งาน
            </p>
          </div>

          {/* Role Selection */}
          <div className="px-4 py-6 space-y-4">
            {hasResidentRole && (
              <button
                onClick={handleResidentClick}
                disabled={switchingRole !== null}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {switchingRole === "resident" ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      ผู้อยู่อาศัย
                    </h3>
                    {residentHasPending && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        รอการยืนยัน
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    สำหรับผู้ที่อาศัยในหมู่บ้าน
                  </p>
                </div>
              </button>
            )}

            {hasGuardRole && (
              <button
                onClick={handleGuardClick}
                disabled={switchingRole !== null}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {switchingRole === "guard" ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <Shield className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      รปภ.
                    </h3>
                    {guardHasPending && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        รอการยืนยัน
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {guardRoles.length > 1
                      ? "เลือกหมู่บ้านที่ต้องการปฏิบัติงาน"
                      : "สำหรับเจ้าหน้าที่รักษาความปลอดภัย"}
                  </p>
                </div>
              </button>
            )}

            {/* Show pending roles */}
            {userRoles.filter((role) => role.status === "pending").length >
              0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  บทบาทที่รอการยืนยัน
                </h4>
                <div className="space-y-2">
                  {userRoles
                    .filter((role) => role.status === "pending")
                    .map((role, index) => (
                      <div
                        key={`${role.role}-${role.village_id}-${index}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {role.role === "resident" ? (
                            <User className="w-4 h-4 text-primary" />
                          ) : (
                            <Shield className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {role.role === "resident" ? "ผู้อยู่อาศัย" : "รปภ."}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {role.village_name || "ไม่ระบุ"}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ml-auto">
                          รอการยืนยัน
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog
        open={residentSelectionOpen}
        onOpenChange={handleResidentSelectionOpenChange}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เลือกหมู่บ้านที่ต้องการใช้งาน</DialogTitle>
            <DialogDescription>
              คุณมีหลายหมู่บ้านในบทบาทผู้อยู่อาศัย
              กรุณาเลือกหมู่บ้านและบ้านเลขที่ก่อนเข้าสู่ระบบ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {residentRoles.map((role) => {
              const houses = role.houses ?? [];
              const isActive =
                selectedResidentOption?.resident_id === role.resident_id;

              return (
                <div
                  key={role.resident_id ?? role.village_id}
                  className={`rounded-lg border ${
                    isActive ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleResidentSelectionChange(role)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {role.village_name || "ไม่ระบุหมู่บ้าน"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {houses.length > 0
                          ? `${houses.length} บ้านที่เกี่ยวข้อง`
                          : "ไม่มีข้อมูลบ้านในหมู่บ้านนี้"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {role.status === "pending"
                        ? "รอการยืนยัน"
                        : "พร้อมใช้งาน"}
                    </span>
                  </button>
                  {isActive && houses.length > 0 && (
                    <div className="border-t px-4 pb-4">
                      <p className="text-sm font-medium text-foreground mt-3 mb-2">
                        เลือกบ้านเลขที่
                      </p>
                      <div className="space-y-2">
                        {houses.map((house) => {
                          const isHouseSelected =
                            selectedResidentHouseId === house.house_id;
                          return (
                            <Button
                              key={house.house_id}
                              type="button"
                              variant={
                                isHouseSelected ? "secondary" : "outline"
                              }
                              className="w-full justify-start"
                              onClick={() =>
                                setSelectedResidentHouseId(house.house_id)
                              }
                            >
                              {house.house_address || "ไม่ระบุเลขที่บ้าน"}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {isActive && houses.length === 0 && (
                    <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                      ไม่พบข้อมูลบ้านสำหรับหมู่บ้านนี้
                      คุณสามารถเลือกบทบาทนี้เพื่อดำเนินการต่อได้
                    </div>
                  )}
                </div>
              );
            })}
            {residentRoles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                ไม่พบบทบาทผู้อยู่อาศัยที่พร้อมใช้งาน
              </p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleResidentSelectionOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleResidentSelectionConfirm}
              disabled={residentConfirmDisabled}
            >
              ยืนยันการเลือก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={guardSelectionOpen}
        onOpenChange={handleGuardSelectionOpenChange}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เลือกหมู่บ้านสำหรับบทบาท รปภ.</DialogTitle>
            <DialogDescription>
              คุณมีหลายหมู่บ้านที่ต้องดูแล
              กรุณาเลือกหมู่บ้านที่ต้องการใช้งานในขณะนี้
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {guardRoles.map((role) => {
              const isActive = selectedGuardOption?.guard_id === role.guard_id;
              return (
                <button
                  key={role.guard_id ?? role.village_id}
                  type="button"
                  onClick={() => setSelectedGuardOption(role)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary"
                  }`}
                >
                  <p className="text-base font-semibold text-foreground">
                    {role.village_name || "ไม่ระบุหมู่บ้าน"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role.status === "pending" ? "รอการยืนยัน" : "พร้อมใช้งาน"}
                  </p>
                </button>
              );
            })}
            {guardRoles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                ไม่พบบทบาท รปภ.ที่พร้อมใช้งาน
              </p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleGuardSelectionOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleGuardSelectionConfirm}
              disabled={switchingRole === "guard" || !selectedGuardOption}
            >
              {switchingRole === "guard" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              ยืนยันการเลือก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
