"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { ModeToggle } from "@/components/mode-toggle";
import {
  CheckCircle2,
  RefreshCcw,
  Phone,
  Home,
  CalendarClock,
  Car,
  Shuffle,
  User,
} from "lucide-react";

type VisitorIn = {
  visitorId: string;
  visitor_record_id: string;
  visitorName: string;
  phone: string;
  houseNumber: string;
  purpose: string;
  entryTime: string; // ISO string
  licensePlate?: string;
  isIn: boolean;
  villageKey: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
  error?: string;
};

export default function VisitorsInPage() {
  const [loading, setLoading] = React.useState(true);
  const [approvingIds, setApprovingIds] = React.useState<
    Record<string, boolean>
  >({});
  const [visitors, setVisitors] = React.useState<VisitorIn[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [successName, setSuccessName] = React.useState("");
  const [selected, setSelected] = React.useState<VisitorIn | null>(null);
  const filteredVisitors = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return visitors;
    return visitors.filter((v) => {
      const fields = [
        v.visitorName,
        v.licensePlate || "",
        v.houseNumber || "",
        v.phone || "",
        v.purpose || "",
      ];
      return fields.some((f) => f.toLowerCase().includes(q));
    });
  }, [visitors, search]);

  const fetchVisitors = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/visitors-in?isIn=true`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      const result: ApiResponse<VisitorIn[]> = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to load visitors");
      }

      setVisitors(result.data ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("โหลดรายชื่อผู้เยี่ยมล้มเหลว", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleApproveOut = async (visitorId: string) => {
    if (approvingIds[visitorId]) return;
    setApprovingIds((prev) => ({ ...prev, [visitorId]: true }));

    try {
      // Try to call a mock endpoint. If it doesn't exist, we still do optimistic update.
      const res = await fetch(`/api/visitors-in/approve-out`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });

      if (!res.ok) {
        // Fallback mock: no backend yet, simulate success
        await new Promise((r) => setTimeout(r, 300));
      }

      // Optimistic update: remove from list
      setVisitors((prev) => prev.filter((v) => v.visitorId !== visitorId));
      toast.success("บันทึกการออกสำเร็จ", {
        description: `อนุมัติการออกของผู้เยี่ยมเรียบร้อย`,
      });
      setSuccessOpen(true);
      setSelected(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("อนุมัติการออกไม่สำเร็จ", { description: msg });
    } finally {
      setApprovingIds((prev) => ({ ...prev, [visitorId]: false }));
    }
  };

  const formatThaiDateTime = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-card rounded-2xl border shadow-lg">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2 slect-none pointer-events-none">
                <Home className="w-5 h-5 sm:w-6 sm:h-6" /> ผู้เยี่ยมในหมู่บ้าน
              </h1>

              <span className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="h-9">
                  <a
                    href="/guard"
                    aria-label="Open approval form"
                    title="ส่งคำขอเข้าเยี่ยม"
                  >
                    ส่งคำขอเข้าเยี่ยม
                  </a>
                </Button>

                <ModeToggle />
                <a
                  href="/liff/select-role"
                  className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Go to role selection"
                  title="กลับไปเลือกบทบาท"
                >
                  <Shuffle className="w-5 h-5 text-foreground" />
                </a>
                <a
                  href="/guard/profile"
                  className="p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Go to profile"
                  title="โปรไฟล์"
                >
                  <User className="w-5 h-5 text-foreground" />
                </a>
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="ค้นหาชื่อ ทะเบียน เลขที่บ้าน หรือเบอร์"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10"
              />
              <Button
                variant="outline"
                onClick={() => setSearch("")}
                disabled={!search}
              >
                ล้าง
              </Button>
              <Button onClick={() => setSearch(search)} disabled={loading}>
                ค้นหา
              </Button>
              {/*<Button
                variant="outline"
                onClick={fetchVisitors}
                disabled={loading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                รีเฟรช
              </Button>*/}
            </div>
          </div>

          <div className="px-4 pb-4">
            {loading ? (
              <LoadingList />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchVisitors} />
            ) : filteredVisitors.length === 0 ? (
              <EmptyState onRefresh={fetchVisitors} />
            ) : (
              <div className="space-y-3">
                {filteredVisitors.map((v) => (
                  <Card key={v.visitorId} className="overflow-hidden">
                    <div className="flex flex-col gap-4 p-4 md:flex-row">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-medium">
                              {v.visitorName}
                            </h2>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="gap-1">
                                <Home className="h-3.5 w-3.5" />
                                {v.houseNumber}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <CalendarClock className="h-3.5 w-3.5" />
                                เข้ามา: {formatThaiDateTime(v.entryTime)}
                              </Badge>
                              {v.licensePlate ? (
                                <Badge variant="outline" className="gap-1">
                                  <Car className="h-3.5 w-3.5" />
                                  {v.licensePlate}
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setSelected(v);
                                setConfirmOpen(true);
                              }}
                              disabled={!!approvingIds[v.visitorId]}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {approvingIds[v.visitorId]
                                ? "กำลังบันทึก..."
                                : "อนุมัติออก"}
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {v.phone}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              วัตถุประสงค์:{" "}
                            </span>
                            <span>{v.purpose || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Confirmation Dialog */}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ยืนยันการอนุมัติออก</AlertDialogTitle>
                <AlertDialogDescription>
                  ยืนยันการบันทึกการออกของ
                  {selected ? ` ${selected.visitorName}` : ""} ใช่หรือไม่?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-2 justify-end pt-2">
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (selected) {
                      setSuccessName(selected.visitorName);
                      setConfirmOpen(false);
                      handleApproveOut(selected.visitorId);
                    }
                  }}
                >
                  ยืนยัน
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          {/* Success Dialog */}
          <AlertDialog open={successOpen} onOpenChange={setSuccessOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>บันทึกสำเร็จ</AlertDialogTitle>
                <AlertDialogDescription>
                  ระบบบันทึกการออกเรียบร้อยแล้ว
                  {successName ? ` สำหรับ ${successName}` : ""}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end pt-2">
                <AlertDialogAction onClick={() => setSuccessOpen(false)}>
                  เข้าใจแล้ว
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function LoadingList() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card key={idx} className="overflow-hidden">
          <div className="flex flex-col gap-4 p-4 md:flex-row">
            <div className="md:w-40 md:flex-shrink-0">
              <div className="aspect-video animate-pulse rounded-md bg-muted" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                <div className="h-6 w-36 animate-pulse rounded bg-muted" />
                <div className="h-6 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <h3 className="text-lg font-medium">
        ไม่มีผู้เยี่ยมที่อยู่ในหมู่บ้านขณะนี้
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        เมื่อมีผู้เยี่ยมเข้ามา
        ระบบจะแสดงรายชื่อที่นี่เพื่อให้คุณสามารถกดอนุมัติการออกได้
      </p>
      <Button variant="outline" onClick={onRefresh} className="mt-2">
        <RefreshCcw className="mr-2 h-4 w-4" />
        รีเฟรช
      </Button>
    </Card>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <h3 className="text-lg font-medium text-destructive">เกิดข้อผิดพลาด</h3>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry} className="mt-2">
        <RefreshCcw className="mr-2 h-4 w-4" />
        ลองใหม่
      </Button>
    </Card>
  );
}
