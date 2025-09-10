"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiffService } from "@/lib/liff";
import { verifyLiffToken, storeAuthData } from "@/lib/liffAuth";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type Step = "init" | "logging-in" | "ready" | "denied" | "error";

const svc = LiffService.getInstance();

export default function LiffPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("init");
  const [msg, setMsg] = useState("กำลังเตรียม LIFF ...");
  const [user, setUser] = useState<{ name?: string; id?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [lineProfile, setLineProfile] = useState<any>(null);


  useEffect(() => {
    const run = async () => {
      try {
        // Check if we're on Android and show appropriate message
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (isAndroid) {
          // Check if user is in external browser (not LINE app)
          const isExternalBrowser = !window.navigator.userAgent.includes('Line');
          
          if (isExternalBrowser) {
            console.log("🤖 Android external browser detected - auto-redirecting to LIFF");
            setMsg("กำลังเปิด LIFF สำหรับ Android ...");
            // Auto-redirect immediately for external browsers
            setTimeout(() => {
              svc.forceOpenLiffDirect();
            }, 1000);
            return;
          }
          
          setMsg("กำลังเตรียม LIFF สำหรับ Android ...");
          // Show progress for Android users
          setTimeout(() => setMsg("กำลังโหลด SDK ..."), 2000);
          setTimeout(() => setMsg("กำลังเชื่อมต่อกับ LINE ..."), 4000);
          
          // Auto-redirect for Android users after 6 seconds if still stuck
          setTimeout(() => {
            if (step === "init" || step === "logging-in") {
              console.log("🤖 Android auto-redirect triggered (6s timeout)");
              setMsg("กำลังเปิด LIFF โดยตรงสำหรับ Android ...");
              svc.forceOpenLiffDirect();
            }
          }, 6000);
          
          // Backup auto-redirect after 10 seconds
          setTimeout(() => {
            if (step === "init" || step === "logging-in") {
              console.log("🤖 Android backup auto-redirect triggered (10s timeout)");
              setMsg("กำลังเปิด LIFF โดยตรงสำหรับ Android ...");
              window.location.href = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || '2008071362'}`;
            }
          }, 10000);
        }
        
        // Add timeout for Android users
        const initPromise = svc.init();
        const timeoutPromise = new Promise((_, reject) => {
          const timeout = isAndroid ? 10000 : 5000; // 10s for Android, 5s for others
          setTimeout(() => reject(new Error("LIFF initialization timeout")), timeout);
        });
        
        await Promise.race([initPromise, timeoutPromise]);

        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          setStep("error");
          setMsg("ไม่มี NEXT_PUBLIC_LIFF_ID");
          return;
        }

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
          setMsg("กำลังเข้าสู่ระบบด้วย LINE ...");
          await svc.login(window.location.href);
          return; // จะ redirect ออกไป
        }

        // 2) เคส session ค้าง: isLoggedIn() = true แต่ไม่มี access token → re-login
        const accessToken = svc.getAccessToken();
        if (!accessToken) {
          console.warn("⚠️ loggedIn แต่ไม่มี access token → re-login");
          setStep("logging-in");
          setMsg("รีเฟรชสิทธิ์เข้าใช้งาน LINE ...");
          svc.logout();
          await svc.login(window.location.href);
          return;
        }

        // 3) พยายามดึงโปรไฟล์
        const profile = await svc.getProfile();

        // 4) ถ้าดึงโปรไฟล์ไม่ได้หรือเป็น unknown → เคลียร์ session แล้วบังคับ login ใหม่
        if (!profile?.userId || profile.userId === "unknown") {
          console.warn("⚠️ โปรไฟล์ใช้งานไม่ได้ (token หมดอายุ/consent ไม่ครบ) → re-login");
          setStep("logging-in");
          setMsg("รีเฟรชสิทธิ์เข้าใช้งาน LINE ...");
          svc.logout();
          await svc.login(window.location.href);
          return;
        }

        // 5) สำเร็จ → แสดงผล แล้วพาไปหน้าแรก
        setUser({ name: profile.displayName ?? "ผู้ใช้", id: profile.userId });
        setLineProfile(profile);
        
        // Verify with backend and handle authentication
        const idToken = svc.getIDToken();
        if (idToken) {
          setIdToken(idToken);
          try {
            console.log('🔍 Verifying user with backend...');
            const authResult = await verifyLiffToken(idToken);
            console.log('🔍 Auth result:', authResult);
            
            if (authResult.success && authResult.user && authResult.token) {
              // User exists in database, store auth data and redirect
              console.log('✅ User found in database, redirecting to Resident page');
              storeAuthData(authResult.user, authResult.token);
              setStep("ready");
              setMsg("เข้าสู่ระบบสำเร็จ กำลังพาไปหน้าหลัก...");
              setTimeout(() => router.replace("/Resident"), 1000);
            } else if (authResult.lineUserId) {
              // User not found, redirect to register page
              console.log('📝 User not found in database, redirecting to register page');
              setStep("ready");
              setMsg("กำลังพาไปหน้าลงทะเบียน...");
              setTimeout(() => {
                router.push('/liff/register');
              }, 1000);
            } else {
              // Error occurred
              console.error('❌ Authentication failed:', authResult);
              setStep("error");
              setMsg(authResult.error || 'Authentication failed');
            }
          } catch (error) {
            console.error('Backend authentication error:', error);
            setStep("error");
            setMsg("เกิดข้อผิดพลาดในการยืนยันตัวตน");
          }
        } else {
          setTimeout(() => router.replace("/"), 1000);
        }
      } catch (e) {
        console.error("LIFF initialization error:", e);
        const isAndroid = /Android/i.test(navigator.userAgent);
        
        setStep("error");
        setMsg("เกิดข้อผิดพลาดในการเริ่มต้น LIFF");
      }
    };

    void run();
  }, [router]);

  const handleRetry = () => {
    // เคส denied/error ให้ลองใหม่ เคลียร์ session + reload
    setStep("init");
    setMsg("กำลังเตรียม LIFF ...");
    svc.clearCache();
    svc.retryConsent();
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-neutral-900 text-white p-6">
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-zinc-900/80 backdrop-blur-lg ring-1 ring-white/10 p-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-green-400">เข้าสู่ระบบด้วย LINE</h1>
        <p className="text-sm text-gray-400 mb-6">
          เชื่อมต่อบัญชี LINE ของคุณเพื่อเข้าใช้งาน
        </p>

        <div className="flex flex-col items-center gap-3">
          {step === "init" || step === "logging-in" ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-green-400" />
              <p className="text-gray-300">{msg}</p>
            </>
          ) : step === "ready" ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <p className="text-green-300 font-medium">{msg}</p>
              <div className="bg-black/40 rounded-xl p-4 mt-3 text-sm w-full border border-white/10">
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-gray-400 break-all">{user.id}</p>
              </div>
              <button
                onClick={handleRetry}
                className="mt-4 text-gray-400 hover:text-gray-300 text-sm underline"
              >
                เปลี่ยนบัญชี LINE
              </button>
            </>
          ) : step === "denied" ? (
            <>
              <XCircle className="w-12 h-12 text-yellow-400" />
              <p className="text-yellow-300">{msg}</p>
              <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg shadow-md hover:bg-yellow-300 transition"
              >
                ลองใหม่
              </button>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 text-rose-500" />
              <p className="text-rose-300">{msg}</p>
              <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-400 transition"
              >
                โหลดใหม่
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}