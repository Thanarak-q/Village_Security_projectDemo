"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, Home, ChevronRight, User, Settings } from "lucide-react";

interface DemoUser {
    id: string;
    fname: string;
    lname: string;
    email: string | null;
    village_id: string | null;
    role: string;
    display: string;
    username?: string;
}

interface Village {
    village_id: string;
    village_name: string;
    village_key: string;
}

interface DemoUsersResponse {
    success: boolean;
    demo_mode: boolean;
    guards: DemoUser[];
    residents: DemoUser[];
    admins: DemoUser[];
    villages: Village[];
}

export default function DemoLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [loggingIn, setLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [demoUsers, setDemoUsers] = useState<DemoUsersResponse | null>(null);
    const [selectedRole, setSelectedRole] = useState<"guard" | "resident" | "admin" | null>(null);
    const [selectedVillage, setSelectedVillage] = useState<string | null>(null);

    useEffect(() => {
        const fetchDemoUsers = async () => {
            try {
                const response = await fetch("/api/auth/demo/users", {
                    credentials: "include",
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to fetch demo users");
                }

                const data: DemoUsersResponse = await response.json();
                setDemoUsers(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        fetchDemoUsers();
    }, []);

    const handleLogin = async (user: DemoUser) => {
        setLoggingIn(true);
        setError(null);

        try {
            // For admin/staff/superadmin, use real login with seeded credentials
            const isAdmin = ['admin', 'staff', 'superadmin'].includes(user.role);

            if (isAdmin && user.username) {
                // Use real login endpoint with seeded password
                const loginResponse = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        username: user.username,
                        password: "password123", // Seeded password for all admins
                    }),
                });

                if (!loginResponse.ok) {
                    const errorData = await loginResponse.json();
                    throw new Error(errorData.error || "Admin login failed");
                }

                // Store in localStorage for consistency
                const liffUser = {
                    id: user.id,
                    admin_id: user.id,
                    username: user.username,
                    email: user.email,
                    fname: user.fname,
                    lname: user.lname,
                    village_id: user.village_id,
                    role: user.role,
                    status: 'verified',
                };
                localStorage.setItem('liffUser', JSON.stringify(liffUser));

                // Set village in session storage
                if (user.village_id) {
                    sessionStorage.setItem("selectedVillage", user.village_id);
                    sessionStorage.setItem("selectedVillageId", user.village_id);
                }

                // Redirect based on admin role
                if (user.role === "superadmin") {
                    router.push("/super-admin-dashboard");
                } else {
                    // Admin/Staff go to village selection or dashboard
                    router.push("/admin-village-selection");
                }
                return;
            }

            // For guard/resident, use demo login
            const response = await fetch("/api/auth/demo/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    role: user.role,
                    user_id: user.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            // Store user in localStorage to support guard/resident page auth checks
            const liffUser = {
                id: data.user.id,
                admin_id: data.user.admin_id,
                guard_id: data.user.guard_id,
                resident_id: data.user.resident_id,
                lineUserId: `demo_${data.user.id}`,
                email: data.user.email,
                fname: data.user.fname,
                lname: data.user.lname,
                username: data.user.username,
                phone: '',
                village_id: data.user.village_id,
                village_name: data.user.village_name,
                status: data.user.status || 'verified',
                role: data.user.role,
            };
            localStorage.setItem('liffUser', JSON.stringify(liffUser));
            localStorage.setItem('liffToken', `demo_token_${data.user.id}`);

            // Redirect based on role
            if (user.role === "guard") {
                router.push("/guard");
            } else if (user.role === "resident") {
                router.push("/Resident");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
            setLoggingIn(false);
        }
    };

    // Filter users by selected village (only for guard/resident)
    const filteredGuards = demoUsers?.guards.filter(
        (g) => !selectedVillage || g.village_id === selectedVillage
    ) || [];
    const filteredResidents = demoUsers?.residents.filter(
        (r) => !selectedVillage || r.village_id === selectedVillage
    ) || [];
    const filteredAdmins = demoUsers?.admins || [];

    // Get unique villages that have users
    const villagesWithUsers = demoUsers?.villages.filter((v) =>
        demoUsers.guards.some((g) => g.village_id === v.village_id) ||
        demoUsers.residents.some((r) => r.village_id === v.village_id)
    ) || [];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-neutral-900 text-white">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
                    <p className="text-gray-400">กำลังโหลดข้อมูล Demo...</p>
                </div>
            </div>
        );
    }

    if (error && !demoUsers) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-neutral-900 text-white p-6">
                <div className="w-full max-w-md rounded-2xl shadow-2xl bg-zinc-900/80 backdrop-blur-lg ring-1 ring-white/10 p-8 text-center">
                    <div className="text-rose-500 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold mb-2 text-rose-400">Demo Mode Not Available</h1>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">
                        ตรวจสอบว่า DEMO_MODE=true ใน .env ของ backend
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-neutral-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm mb-4">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        Demo Mode
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Village Security Demo</h1>
                    <p className="text-gray-400">เลือก role และ user เพื่อเข้าสู่ระบบ</p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-center">
                        {error}
                    </div>
                )}

                {/* Village Filter - only show for guard/resident */}
                {selectedRole !== "admin" && (
                    <div className="mb-8">
                        <label className="block text-sm text-gray-400 mb-2">กรองตามหมู่บ้าน</label>
                        <select
                            value={selectedVillage || ""}
                            onChange={(e) => setSelectedVillage(e.target.value || null)}
                            className="w-full md:w-auto px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        >
                            <option value="">ทุกหมู่บ้าน</option>
                            {villagesWithUsers.map((v) => (
                                <option key={v.village_id} value={v.village_id}>
                                    {v.village_name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Role Selection */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <button
                        onClick={() => setSelectedRole("guard")}
                        className={`p-6 rounded-2xl border-2 transition-all ${selectedRole === "guard"
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                            }`}
                    >
                        <Shield className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                        <h2 className="text-xl font-bold mb-2">รปภ. (Guard)</h2>
                        <p className="text-sm text-gray-400">
                            {filteredGuards.length} คน พร้อมใช้งาน
                        </p>
                    </button>

                    <button
                        onClick={() => setSelectedRole("resident")}
                        className={`p-6 rounded-2xl border-2 transition-all ${selectedRole === "resident"
                            ? "border-green-500 bg-green-500/20"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                            }`}
                    >
                        <Home className="w-12 h-12 mx-auto mb-4 text-green-400" />
                        <h2 className="text-xl font-bold mb-2">ผู้พักอาศัย (Resident)</h2>
                        <p className="text-sm text-gray-400">
                            {filteredResidents.length} คน พร้อมใช้งาน
                        </p>
                    </button>

                    <button
                        onClick={() => setSelectedRole("admin")}
                        className={`p-6 rounded-2xl border-2 transition-all ${selectedRole === "admin"
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                            }`}
                    >
                        <Settings className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                        <h2 className="text-xl font-bold mb-2">Admin / Staff</h2>
                        <p className="text-sm text-gray-400">
                            {filteredAdmins.length} คน พร้อมใช้งาน
                        </p>
                    </button>
                </div>

                {/* User List */}
                {selectedRole && (
                    <div className="bg-zinc-900/80 backdrop-blur-lg ring-1 ring-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            {selectedRole === "guard" ? (
                                <>
                                    <Shield className="w-5 h-5 text-blue-400" />
                                    เลือก รปภ.
                                </>
                            ) : selectedRole === "resident" ? (
                                <>
                                    <Home className="w-5 h-5 text-green-400" />
                                    เลือกผู้พักอาศัย
                                </>
                            ) : (
                                <>
                                    <Settings className="w-5 h-5 text-purple-400" />
                                    เลือก Admin / Staff
                                </>
                            )}
                        </h3>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {(selectedRole === "guard" ? filteredGuards : selectedRole === "resident" ? filteredResidents : filteredAdmins).map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleLogin(user)}
                                    disabled={loggingIn}
                                    className="w-full p-4 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl border border-zinc-700 hover:border-zinc-600 transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedRole === "guard" ? "bg-blue-500/20" :
                                            selectedRole === "resident" ? "bg-green-500/20" : "bg-purple-500/20"
                                            }`}>
                                            <User className={`w-5 h-5 ${selectedRole === "guard" ? "text-blue-400" :
                                                selectedRole === "resident" ? "text-green-400" : "text-purple-400"
                                                }`} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">{user.fname} {user.lname}</p>
                                            <p className="text-sm text-gray-400">{user.email || user.display}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 group-hover:text-white transition-colors">
                                        {loggingIn ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5" />
                                        )}
                                    </div>
                                </button>
                            ))}

                            {(selectedRole === "guard" ? filteredGuards : selectedRole === "resident" ? filteredResidents : filteredAdmins).length === 0 && (
                                <p className="text-center text-gray-500 py-8">
                                    ไม่พบผู้ใช้{selectedRole === "admin" ? "" : "ในหมู่บ้านที่เลือก"}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
