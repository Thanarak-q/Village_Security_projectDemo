"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiffService } from "@/lib/liff";
import { verifyLiffToken, storeAuthData } from "@/lib/liffAuth";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type Step = "init" | "logging-in" | "ready" | "denied" | "error";

const svc = LiffService.getInstance();

export default function GuardLiffPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("init");
  const [msg, setMsg] = useState("กำลังเตรียม LIFF สำหรับยามรักษาความปลอดภัย...");
  const [, setUser] = useState<{ name?: string; id?: string }>({});
  const [, setIdToken] = useState<string | null>(null);
  const [, setLineProfile] = useState<{ userId?: string; displayName?: string; pictureUrl?: string } | null>(null);


  useEffect(() => {
    // เพิ่ม timeout สำหรับทั้ง process เพื่อป้องกันการค้าง
    const processTimeout = setTimeout(() => {
      if (step === "logging-in") {
        setStep("error");
        setMsg("การเข้าสู่ระบบใช้เวลานานเกินไป กรุณาลองใหม่");
      }
    }, 30000); // 30 วินาที timeout

    const run = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_GUARD_LIFF_ID;
        if (!liffId) {
          setStep("error");
          setMsg("ไม่พบ LIFF ID - กรุณาติดต่อผู้ดูแลระบบเพื่อตั้งค่า LIFF ID");
          return;
        }
        
        // Initialize LIFF with guard-specific configuration
        const initPromise = svc.init('guard');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("LIFF initialization timeout")), 10000); // ลดเวลา timeout
        });
        
        await Promise.race([initPromise, timeoutPromise]);

        // ผู้ใช้ปฏิเสธสิทธิ์
        const qs = new URLSearchParams(window.location.search);
        if (qs.get("error") === "access_denied") {
          setStep("denied");
          setMsg("คุณปฏิเสธการอนุญาต กรุณาลองใหม่");
          return;
        }

        // 1) ถ้ายังไม่ล็อกอิน → เด้งไป login ทันที
        if (!svc.isLoggedIn()) {
          setStep("logging-in");
          setMsg("กำลังเข้าสู่ระบบด้วย LINE สำหรับยามรักษาความปลอดภัย...");
          try {
            // ใช้ setTimeout เพื่อให้ UI อัปเดตก่อน redirect
            setTimeout(() => {
              svc.login(window.location.href);
            }, 100);
          } catch (error) {
            console.error("Login failed:", error);
            setStep("error");
            setMsg("ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่");
          }
          return;
        }

        // 2) เคส session ค้าง: isLoggedIn() = true แต่ไม่มี access token → re-login
        const accessToken = svc.getAccessToken();
        if (!accessToken) {
          console.warn("⚠️ loggedIn แต่ไม่มี access token → re-login");
          setStep("logging-in");
          setMsg("รีเฟรชสิทธิ์เข้าใช้งาน LINE...");
          svc.logout();
          try {
            setTimeout(() => {
              svc.login(window.location.href);
            }, 100);
          } catch (error) {
            console.error("Re-login failed:", error);
            setStep("error");
            setMsg("ไม่สามารถรีเฟรชสิทธิ์ได้ กรุณาลองใหม่");
          }
          return;
        }

        // 3) พยายามดึงโปรไฟล์
        const profile = await svc.getProfile();

        // 4) ถ้าดึงโปรไฟล์ไม่ได้หรือเป็น unknown → เคลียร์ session แล้วบังคับ login ใหม่
        if (!profile?.userId || profile.userId === "unknown") {
          console.warn("⚠️ โปรไฟล์ใช้งานไม่ได้ (token หมดอายุ/consent ไม่ครบ) → re-login");
          setStep("logging-in");
          setMsg("รีเฟรชสิทธิ์เข้าใช้งาน LINE...");
          svc.logout();
          try {
            setTimeout(() => {
              svc.login(window.location.href);
            }, 100);
          } catch (error) {
            console.error("Profile re-login failed:", error);
            setStep("error");
            setMsg("ไม่สามารถดึงข้อมูลโปรไฟล์ได้ กรุณาลองใหม่");
          }
          return;
        }

        // 5) สำเร็จ → แสดงผล แล้วพาไปหน้าแรก
        setUser({ name: profile.displayName ?? "ยามรักษาความปลอดภัย", id: profile.userId });
        setLineProfile(profile);
        
        // Verify with backend and handle authentication
        const idToken = svc.getIDToken();
        if (idToken) {
          setIdToken(idToken);
          try {
            const authResult = await verifyLiffToken(idToken, 'guard');
            console.log('🔍 Guard Auth Result:', authResult);
            
            if (authResult.success && authResult.user && authResult.token) {
              // User exists in database, store auth data and redirect to Guard main page
              storeAuthData(authResult.user, authResult.token);
              setStep("ready");
              setMsg("เข้าสู่ระบบสำเร็จ กำลังพาไปหน้าหลัก...");
              setTimeout(() => router.replace("/guard"), 1000);
            } else if (authResult.expectedRole) {
              // User is already registered but using wrong LIFF app
              setStep("ready");
              setMsg(`คุณได้ลงทะเบียนเป็น${authResult.expectedRole === 'resident' ? 'ลูกบ้าน' : 'ยามรักษาความปลอดภัย'}แล้ว กรุณาใช้แอปที่ถูกต้อง`);
              setTimeout(() => {
                if (authResult.expectedRole === 'resident') {
                  router.push('/liff/resident');
                } else {
                  router.push('/liff/guard');
                }
              }, 3000);
            } else if (authResult.lineUserId) {
              // User not found, redirect to register page
              console.log('📝 Guard not found in database, redirecting to register page');
              setStep("ready");
              setMsg("กำลังพาไปหน้าลงทะเบียน...");
              setTimeout(() => {
                router.push('/liff/guard/register');
              }, 1000);
            } else {
              // Error occurred
              console.error('Authentication failed:', authResult);
              setStep("error");
              setMsg(authResult.error || 'Authentication failed');
            }
          } catch (error) {
            console.error('Backend authentication error:', error);
            setStep("error");
            setMsg("เกิดข้อผิดพลาดในการยืนยันตัวตน");
          }
        } else {
          setStep("error");
          setMsg("ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่");
        }
      } catch (e) {
        console.error("LIFF initialization error:", e);
        setStep("error");
        setMsg("เกิดข้อผิดพลาดในการเริ่มต้น LIFF");
      }
    };

    void run();

    // Cleanup timeout
    return () => {
      clearTimeout(processTimeout);
    };
  }, [router, step]);



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-neutral-900 text-white p-6">
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-zinc-900/80 backdrop-blur-lg ring-1 ring-white/10 p-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-green-400">เข้าสู่ระบบยามรักษาความปลอดภัย</h1>
        <p className="text-sm text-gray-400 mb-6">
          เชื่อมต่อบัญชี LINE ของคุณเพื่อเข้าใช้งานสำหรับยามรักษาความปลอดภัย
        </p>

        <div className="flex flex-col items-center gap-3">
          {step === "init" || step === "logging-in" ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-green-400" />
              <p className="text-gray-300">{msg}</p>
            </>
          ) : step === "ready" ? (
            <>
              {msg.includes('คุณได้ลงทะเบียนเป็น') ? (
                <>
                  <XCircle className="w-12 h-12 text-yellow-400" />
                  <p className="text-yellow-300 font-medium text-center">{msg}</p>
                  <div className="bg-yellow-900/20 rounded-xl p-4 mt-3 text-sm w-full border border-yellow-500/30">
                    <p className="font-semibold text-yellow-200">กำลังเปลี่ยนไปยังแอปที่ถูกต้อง...</p>
                    <p className="text-xs text-yellow-300 mt-1">กรุณารอสักครู่</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                  <p className="text-green-300 font-medium text-center">{msg}</p>
                  <div className="bg-green-900/20 rounded-xl p-4 mt-3 text-sm w-full border border-green-500/30">
                    <p className="font-semibold text-green-200">ยามรักษาความปลอดภัย</p>
                    <p className="text-xs text-green-300 mt-1">กำลังพาไปหน้าหลัก...</p>
                  </div>
                </>
              )}
            </>
          ) : step === "denied" ? (
            <>
              <XCircle className="w-12 h-12 text-yellow-400" />
              <p className="text-yellow-300">{msg}</p>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 text-rose-500" />
              <p className="text-rose-300">{msg}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
