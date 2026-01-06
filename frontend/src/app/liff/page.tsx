"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Demo mode - redirect to demo login instead of LINE LIFF
const isDemoMode = true; // Set to false to use LINE LIFF

export default function LiffPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("กำลังเตรียมระบบ...");

  useEffect(() => {
    if (isDemoMode) {
      setMsg("กำลังเปลี่ยนเส้นทางไป Demo Login...");
      // Short delay for visual feedback
      const timeout = setTimeout(() => {
        router.replace("/demo");
      }, 500);
      return () => clearTimeout(timeout);
    }

    // Original LIFF logic would go here if not in demo mode
    // For now, always redirect to demo
    router.replace("/demo");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-neutral-900 text-white p-6">
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-zinc-900/80 backdrop-blur-lg ring-1 ring-white/10 p-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-green-400">Village Security</h1>
        <p className="text-sm text-gray-400 mb-6">Demo Mode</p>

        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 animate-spin text-green-400" />
          <p className="text-gray-300">{msg}</p>
        </div>
      </div>
    </div>
  );
}
