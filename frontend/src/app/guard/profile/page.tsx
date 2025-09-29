"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, MapPin, Shield, Edit, Plus } from "lucide-react";
import { getAuthData, isAuthenticated } from "@/lib/liffAuth";
import { ModeToggle } from "@/components/mode-toggle";

const GuardProfilePage = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [villageName, setVillageName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = () => {
      if (!isAuthenticated()) {
        router.push('/liff');
        return;
      }

      const { user } = getAuthData();
      if (user) {
        setCurrentUser(user);
        // You can add village name fetching logic here if needed
        // For now, we'll use the village_key directly
      }
      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const handleGoBack = () => {
    router.back();
  };

  const handleRegisterRole = () => {
    router.push('/guard/profile/register-role');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">ไม่พบข้อมูลผู้ใช้</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[420px]">
        {/* Main Card */}
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
                  <User className="w-6 h-6 sm:w-7 sm:h-7" />
                  ข้อมูลส่วนตัว
                </h1>
              </div>
              <ModeToggle />
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-4 py-6 space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {currentUser.line_profile_url ? (
                  <img
                    src={currentUser.line_profile_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {currentUser.fname} {currentUser.lname}
              </h2>
              <p className="text-sm text-muted-foreground">
                ยามรักษาความปลอดภัย
              </p>
            </div>

            {/* User Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">อีเมล</p>
                  <p className="text-foreground">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
                  <p className="text-foreground">{currentUser.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">หมู่บ้าน</p>
                  <p className="text-foreground">{villageName || currentUser.village_key}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">สถานะ</p>
                  <p className="text-foreground capitalize">
                    {currentUser.status === 'verified' ? 'ยืนยันแล้ว' : 
                     currentUser.status === 'pending' ? 'รอการยืนยัน' : 
                     currentUser.status === 'disable' ? 'ถูกปิดใช้งาน' : currentUser.status}
                  </p>
                </div>
              </div>
            </div>

            {/* LINE Information */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">ข้อมูล LINE</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">L</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">LINE User ID</p>
                  <p className="text-foreground text-xs font-mono">{currentUser.lineUserId}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
              <button 
                onClick={handleRegisterRole}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                ลงทะเบียนบทบาทเพิ่มเติม
              </button>
              
              <button className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <Edit className="w-4 h-4" />
                แก้ไขข้อมูล
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardProfilePage;
