"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to LIFF page for authentication
    router.replace("/liff");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-neutral-900 text-white p-6">
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-zinc-900/80 backdrop-blur-lg ring-1 ring-white/10 p-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-green-400">Village Security</h1>
        <p className="text-sm text-gray-400 mb-6">
          กำลังพาไปยังหน้าล็อกอิน...
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
        </div>
      </div>
    </div>
  );
}
