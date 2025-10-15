"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Save, X } from "lucide-react";
import { getAuthData, isAuthenticated } from "@/lib/liffAuth";
import { ModeToggle } from "@/components/mode-toggle";
import type { LiffUser } from "@/lib/liffAuth";

const EditGuardProfilePage = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<LiffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated()) {
        router.push('/liff');
        return;
      }

      try {
        // Try LIFF authentication first (for guards and residents)
        let response = await fetch('/api/auth/liff/me', {
          credentials: 'include',
        });

        // If LIFF auth fails, try admin authentication
        if (!response.ok) {
          response = await fetch('/api/auth/me', {
            credentials: 'include',
          });
        }

        if (response.ok) {
          const userData: LiffUser = await response.json();
          setCurrentUser(userData);
          setFormData({
            fname: userData.fname || "",
            lname: userData.lname || "",
            email: userData.email || "",
            phone: userData.phone || "",
          });
        } else {
          // Fallback to localStorage if API fails
          const { user } = getAuthData();
          if (user) {
            setCurrentUser(user);
            setFormData({
              fname: user.fname || "",
              lname: user.lname || "",
              email: user.email || "",
              phone: user.phone || "",
            });
          } else {
            router.push('/liff');
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to localStorage
        const { user } = getAuthData();
        if (user) {
          setCurrentUser(user);
          setFormData({
            fname: user.fname || "",
            lname: user.lname || "",
            email: user.email || "",
            phone: user.phone || "",
          });
        } else {
          router.push('/liff');
          return;
        }
      }

      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const handleGoBack = () => {
    router.back();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.fname.trim()) {
      setError("กรุณากรอกชื่อ");
      return false;
    }
    if (!formData.lname.trim()) {
      setError("กรุณากรอกนามสกุล");
      return false;
    }
    if (!formData.email.trim()) {
      setError("กรุณากรอกอีเมล");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("กรุณากรอกเบอร์โทรศัพท์");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง");
      return false;
    }

    // Phone validation (Thai phone number)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/-/g, ""))) {
      setError("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch('/api/guard/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fname: formData.fname.trim(),
          lname: formData.lname.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess("บันทึกข้อมูลสำเร็จ");
        // Update the current user data
        setCurrentUser((prev) => (prev ? { ...prev, ...formData } : prev));
        // Redirect back to profile page after 1.5 seconds
        setTimeout(() => {
          router.push('/guard/profile');
        }, 1500);
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
                  แก้ไขข้อมูลส่วนตัว
                </h1>
              </div>
              <ModeToggle />
            </div>
          </div>

          {/* Form Content */}
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
              <p className="text-sm text-muted-foreground text-center">
                รูปโปรไฟล์จาก LINE ไม่สามารถแก้ไขได้
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label htmlFor="fname" className="block text-sm font-medium text-foreground mb-2">
                  ชื่อ *
                </label>
                <input
                  type="text"
                  id="fname"
                  name="fname"
                  value={formData.fname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="กรอกชื่อ"
                  disabled={saving}
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lname" className="block text-sm font-medium text-foreground mb-2">
                  นามสกุล *
                </label>
                <input
                  type="text"
                  id="lname"
                  name="lname"
                  value={formData.lname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="กรอกนามสกุล"
                  disabled={saving}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  อีเมล *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="กรอกอีเมล"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  เบอร์โทรศัพท์ *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="กรอกเบอร์โทรศัพท์"
                    disabled={saving}
                  />
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    บันทึกข้อมูล
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancel}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditGuardProfilePage;
