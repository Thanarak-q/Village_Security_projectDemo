"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Home,
  ShieldCheck,
  BellRing,
  Users,
  Camera,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ModeToggle } from "@/components/mode-toggle";

gsap.registerPlugin(ScrollTrigger);

/**
 * Luxe Landing Page for Village Security
 * - Glassmorphism + gradient orbs
 * - Subtle GSAP scroll reveals
 * - Crisp typography & spacing
 * - Accessible, keyboard-friendly, responsive
 */
export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Refs for animations
  const heroRef = useRef<HTMLDivElement | null>(null);
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Prefetch login/dashboard for snappy nav
  useEffect(() => {
    router.prefetch("/login");
    router.prefetch("/dashboard");
  }, [router]);

  // Auth probe
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!cancelled && res.ok) setIsLoggedIn(true);
      } catch {
        // ignore network errors; remain logged out
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect when authenticated (avoid layout shift flicker)
  useEffect(() => {
    if (!loading && isLoggedIn) router.replace("/dashboard");
  }, [loading, isLoggedIn, router]);

  // GSAP entrances (only if logged out)
  useEffect(() => {
    if (loading || isLoggedIn) return;

    const ctx = gsap.context(() => {
      // Hero
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
        );
      }

      // Feature grid
      if (featuresRef.current) {
        gsap.fromTo(
          featuresRef.current,
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: featuresRef.current,
              start: "top 80%",
            },
          },
        );
      }

      // Feature cards stagger
      const cardEls = cardsRef.current.filter(Boolean) as HTMLDivElement[];
      if (cardEls.length) {
        gsap.fromTo(
          cardEls,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: featuresRef.current,
              start: "top 80%",
            },
          },
        );
      }

      // Stats
      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current,
          { opacity: 0, scale: 0.96 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.9,
            ease: "back.out(1.6)",
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 80%",
            },
          },
        );
      }
    });

    return () => ctx.revert();
  }, [loading, isLoggedIn]);

  // Decorative background SVG grid (memo to avoid rerenders)
  const Background = useMemo(
    () => (
      <>
        {/* Radial spotlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_60%_at_50%_40%,#000_30%,transparent_80%)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950" />
        </div>

        {/* Gradient orbs */}
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-40 bg-gradient-to-tr from-blue-500 to-cyan-400 dark:opacity-25" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl opacity-40 bg-gradient-to-tr from-fuchsia-500 to-purple-500 dark:opacity-25" />
          <div className="absolute top-1/3 -right-16 h-72 w-72 rounded-full blur-3xl opacity-30 bg-gradient-to-tr from-amber-400 to-orange-500 dark:opacity-20" />
        </div>

        {/* Subtle grid */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <svg
            className="h-full w-full opacity-[0.07] dark:opacity-[0.08]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#grid)"
              className="text-slate-400"
            />
          </svg>
        </div>
      </>
    ),
    [],
  );

  if (loading) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        {Background}
        <div
          className="size-24 animate-spin rounded-full border-4 border-transparent border-t-primary/80"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (isLoggedIn) return null; // redirecting

  return (
    <>
      {/* <div className="fixed top-4 right-4 z-50">
        <ModeToggle />
      </div> */}
      <div className="relative min-h-dvh overflow-clip">
        {Background}

        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
              <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-2xl font-extrabold text-transparent dark:from-blue-400 dark:to-purple-400">
                Village Security
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="#features"
                className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                ฟีเจอร์
              </Link>
              <Link
                href="#stats"
                className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                สถิติ
              </Link>
              <Link href="/guard/visitors-in">
                <Button
                  variant="outline"
                  className="hover:scale-[1.03] transition-transform"
                >
                  Visitors-In
                </Button>
              </Link>
              <ModeToggle />
              <Link href="/login">
                <Button
                  variant="outline"
                  className="hover:scale-[1.03] transition-transform"
                >
                  เข้าสู่ระบบ
                </Button>
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <main className="container mx-auto px-4 pb-24 pt-8 md:pt-16">
          <section
            ref={heroRef}
            className="relative mx-auto max-w-4xl text-center"
          >
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-300/60 bg-white/60 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-200">
              <Sparkles className="h-4 w-4" /> เวอร์ชันใหม่:
              รองรับแจ้งเตือนแบบเรียลไทม์
            </div>

            <h1 className="mt-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-5xl font-extrabold leading-tight tracking-tight text-transparent md:text-7xl dark:from-white dark:via-slate-100 dark:to-slate-300">
              ระบบรักษาความปลอดภัยหมู่บ้านที่ทั้ง{" "}
              <span className="underline decoration-wavy decoration-primary/60 underline-offset-8">
                ปลอดภัย
              </span>{" "}
              และ <span className="whitespace-nowrap">ใช้งานง่าย</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              จัดการการเข้าออกของบุคคลภายนอก อนุมัติแขก แจ้งเตือนเหตุการณ์สำคัญ
              และติดตามสถิติ—all in one.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login">
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg transition-all hover:from-blue-700 hover:to-purple-700"
                >
                  เริ่มใช้งานทันที
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
              >
                ดูฟีเจอร์
              </a>
            </div>

            {/* Hero showcase card */}
            <div className="mx-auto mt-14 max-w-5xl rounded-3xl border border-slate-200/60 bg-white/70 p-3 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/60">
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 dark:from-slate-950 dark:to-slate-900">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-blue-600/10 p-3 text-blue-700 dark:text-blue-300">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">
                        จัดการผู้อยู่อาศัย
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        ฐานข้อมูลครบถ้วน ปรับสิทธิ์ได้ละเอียด
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-600/10 p-3 text-emerald-700 dark:text-emerald-300">
                      <Camera className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">
                        บันทึกการเข้า-ออก
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        พร้อมรูป/ทะเบียน และประวัติย้อนหลัง
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-violet-600/10 p-3 text-violet-700 dark:text-violet-300">
                      <BellRing className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">
                        แจ้งเตือนทันที
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        เหตุการณ์สำคัญส่งตรงถึงมือถือ
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="features" ref={featuresRef} className="mt-24">
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              ฟีเจอร์หลัก
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-300">
              ออกแบบมาเพื่อเจ้าหน้าที่ รปภ. นิติบุคคล และผู้อยู่อาศัย
              ให้ทำงานร่วมกันได้อย่างลื่นไหล
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: <Users className="h-7 w-7" />,
                  title: "บัญชีผู้อยู่อาศัย",
                  desc: "ลงทะเบียนบ้าน/สมาชิก เชื่อม Line OA อนุมัติแขกได้ในคลิกเดียว",
                },
                {
                  icon: <ShieldCheck className="h-7 w-7" />,
                  title: "ด่านรักษาความปลอดภัย",
                  desc: "จุดตรวจเข้าออกพร้อมสแกน ป้ายทะเบียน/รูป และบันทึกเวลาจริง",
                },
                {
                  icon: <BellRing className="h-7 w-7" />,
                  title: "ศูนย์แจ้งเตือน",
                  desc: "แจ้งเหตุ/ประกาศชุมชน ส่งการแจ้งเตือนไปยังกลุ่มที่เกี่ยวข้อง",
                },
              ].map((f, i) => (
                <Card
                  key={i}
                  ref={(el: HTMLDivElement | null) => {
                    cardsRef.current[i] = el;
                  }}
                  className="group relative overflow-hidden border-0 bg-white/70 shadow-xl transition-all hover:-translate-y-1.5 hover:shadow-2xl dark:bg-slate-900/70"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  >
                    <div className="absolute -inset-24 animate-[spin_12s_linear_infinite] bg-[conic-gradient(var(--tw-gradient-stops))] from-blue-500 via-fuchsia-500 to-blue-500 opacity-20 blur-2xl" />
                  </div>
                  <CardHeader className="relative">
                    <div className="mb-3 inline-flex rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {f.icon}
                    </div>
                    <CardTitle className="text-xl">{f.title}</CardTitle>
                    <CardDescription className="text-base">
                      {f.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      <ul className="list-inside list-disc space-y-1">
                        {i === 0 && (
                          <>
                            <li>สิทธิ์แบบ Role-based (Admin/Guard/Resident)</li>
                            <li>โอนย้ายบ้าน/จัดการสมาชิกในครัวเรือน</li>
                            <li>บันทึกประวัติการเข้าใช้งาน</li>
                          </>
                        )}
                        {i === 1 && (
                          <>
                            <li>สแกนทะเบียน/OCR พร้อมรูปยืนยัน</li>
                            <li>รองรับโหมดออฟไลน์ชั่วคราว</li>
                            <li>ส่งต่อเคสให้เวรถัดไป</li>
                          </>
                        )}
                        {i === 2 && (
                          <>
                            <li>แจ้งเตือนเหตุ/ประกาศ/พัสดุ</li>
                            <li>ตั้งเงื่อนไข Trigger ตามเวลา/โซน</li>
                            <li>ส่งผ่าน Line OA / Email</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Stats */}
          <section id="stats" ref={statsRef} className="mt-24">
            <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/60">
              <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-white">
                สถิติหมู่บ้าน
              </h2>
              <div className="mt-8 grid gap-6 text-center md:grid-cols-4">
                {[
                  { value: "150+", label: "ผู้อยู่อาศัย" },
                  { value: "500+", label: "การเข้าออก/เดือน" },
                  { value: "24/7", label: "การเฝ้าระวัง" },
                  { value: "99.9%", label: "ความน่าเชื่อถือ" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm dark:from-slate-950 dark:to-slate-900"
                  >
                    <div className="text-4xl font-extrabold tracking-tight text-primary">
                      {s.value}
                    </div>
                    <div className="mt-1 text-slate-600 dark:text-slate-300">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                *ตัวเลขเป็นตัวอย่างเพื่อการนำเสนอ
                สามารถดึงจากฐานข้อมูลแบบเรียลไทม์
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="mx-auto mt-24 max-w-4xl text-center">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-r from-blue-600 to-violet-600 p-10 text-white shadow-2xl dark:border-slate-800">
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                aria-hidden
              >
                <svg
                  className="h-full w-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="dots"
                      width="24"
                      height="24"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="1" cy="1" r="1" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold md:text-4xl">
                เริ่มปกป้องชุมชนของคุณวันนี้
              </h3>
              <p className="mx-auto mt-2 max-w-2xl text-white/90">
                สมัครใช้งานฟรี ทดลองระบบครบทุกฟีเจอร์ และอัปเกรดได้เมื่อพร้อม
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="font-semibold bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 shadow-sm"
                  >
                    ติดต่อสอบถาม
                  </Button>
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
                >
                  ดูรายละเอียด
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-24 bg-slate-950 py-10 text-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Village Security System
                </span>
              </div>
              <div className="text-center text-xs text-white/60 md:text-right">
                © {new Date().getFullYear()} Village Security — สงวนลิขสิทธิ์
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
