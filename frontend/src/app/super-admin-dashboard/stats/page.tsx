"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Users, 
  UserCheck, 
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
  BarChart3
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SystemStats {
  overview: {
    totalVillages: number;
    totalAdmins: number;
    totalResidents: number;
    totalGuards: number;
    totalHouses: number;
  };
  adminBreakdown: {
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
  };
  villages: {
    total: number;
    withAdmins: number;
    withoutAdmins: number;
    list: Array<{
      village_id: string;
      village_name: string;
      admin_count: number;
    }>;
  };
  recentActivity: {
    recentAdmins: Array<{
      admin_id: string;
      username: string;
      email: string;
      role: string;
      status: string;
      villages: Array<{
        village_id: string;
        village_name: string;
      }>;
      createdAt: string;
    }>;
  };
  alerts: {
    villagesWithoutAdmins: Array<{
      village_id: string;
      village_name: string;
      admin_count: number;
    }>;
    pendingAdmins: number;
    disabledAdmins: number;
  };
}

export default function StatsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/superadmin/stats", {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        // Access denied - will be handled by layout
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || "Failed to load statistics");
      }
    } catch (err) {
      setError("Failed to load statistics");
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading system statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchStats} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">สถิติระบบ</h1>
          <p className="text-muted-foreground">
            ข้อมูลสถิติและรายงานของระบบทั้งหมด
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/super-admin-dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              ภาพรวมระบบ
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หมู่บ้านทั้งหมด</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalVillages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.villages.withAdmins} มี Admin, {stats.villages.withoutAdmins} ไม่มี Admin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin ทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">
              {stats.adminBreakdown.byRole.admin || 0} เจ้าของโครงการ, {stats.adminBreakdown.byRole.staff || 0} นิติ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้อยู่อาศัย</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalResidents}</div>
            <p className="text-xs text-muted-foreground">
              ผู้อยู่อาศัยทั้งหมดในระบบ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยามรักษาความปลอดภัย</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalGuards}</div>
            <p className="text-xs text-muted-foreground">
              ยามทั้งหมดในระบบ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บ้านทั้งหมด</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalHouses}</div>
            <p className="text-xs text-muted-foreground">
              บ้านทั้งหมดในระบบ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Status Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              สถิติ Admin ตามบทบาท
            </CardTitle>
            <CardDescription>
              จำนวน Admin แยกตามบทบาท
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">เจ้าของโครงการ</span>
                </div>
                <Badge variant="default">
                  {stats.adminBreakdown.byRole.admin || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">นิติ</span>
                </div>
                <Badge variant="secondary">
                  {stats.adminBreakdown.byRole.staff || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              สถิติ Admin ตามสถานะ
            </CardTitle>
            <CardDescription>
              จำนวน Admin แยกตามสถานะ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">ยืนยันแล้ว</span>
                </div>
                <Badge variant="default">
                  {stats.adminBreakdown.byStatus.verified || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">รอการอนุมัติ</span>
                </div>
                <Badge variant="secondary">
                  {stats.adminBreakdown.byStatus.pending || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium">ปิดใช้งาน</span>
                </div>
                <Badge variant="destructive">
                  {stats.adminBreakdown.byStatus.disable || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(stats.alerts.villagesWithoutAdmins.length > 0 || 
        stats.alerts.pendingAdmins > 0 || 
        stats.alerts.disabledAdmins > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              การแจ้งเตือน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.alerts.villagesWithoutAdmins.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                  {stats.alerts.villagesWithoutAdmins.length}
                </Badge>
                <span className="text-sm text-orange-700">
                  หมู่บ้านที่ไม่มี Admin
                </span>
              </div>
            )}
            {stats.alerts.pendingAdmins > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                  {stats.alerts.pendingAdmins}
                </Badge>
                <span className="text-sm text-yellow-700">
                  Admin รอการอนุมัติ
                </span>
              </div>
            )}
            {stats.alerts.disabledAdmins > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-red-300 text-red-700">
                  {stats.alerts.disabledAdmins}
                </Badge>
                <span className="text-sm text-red-700">
                  Admin ที่ถูกปิดใช้งาน
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Admin ที่สร้างล่าสุด
            </CardTitle>
            <CardDescription>
              Admin ที่ถูกสร้างในระบบล่าสุด 10 คน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.recentAdmins.map((admin) => (
                <div key={admin.admin_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{admin.username}</p>
                      <Badge 
                        variant={admin.role === 'admin' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {admin.role === 'admin' ? 'เจ้าของโครงการ' : 'นิติ'}
                      </Badge>
                      <Badge 
                        variant={
                          admin.status === 'verified' ? 'default' :
                          admin.status === 'pending' ? 'secondary' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {admin.status === 'verified' ? 'ยืนยันแล้ว' :
                         admin.status === 'pending' ? 'รอการอนุมัติ' : 'ปิดใช้งาน'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-xs text-muted-foreground">
                      หมู่บ้าน: {admin.villages?.length
                        ? admin.villages.map((village) => village.village_name).join(", ")
                        : "ไม่ระบุ"}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(admin.createdAt).toLocaleDateString('th-TH')}
                  </div>
                </div>
              ))}
              {stats.recentActivity.recentAdmins.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  ไม่มี Admin ในระบบ
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Villages Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              สถานะหมู่บ้าน
            </CardTitle>
            <CardDescription>
              รายการหมู่บ้านทั้งหมดและจำนวน Admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.villages.list.map((village) => (
                <div key={village.village_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{village.village_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {village.village_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={village.admin_count > 0 ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {village.admin_count} Admin
                    </Badge>
                  </div>
                </div>
              ))}
              {stats.villages.list.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  ไม่มีหมู่บ้านในระบบ
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
