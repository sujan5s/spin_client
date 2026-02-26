import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { LayoutDashboard, Users, LogOut, Trophy, Settings, Bomb, Eye, Crown } from "lucide-react";

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");

    if (!token) {
        redirect("/admin/login");
    }

    return (
        <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        Admin Console
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-colors">
                        <Users className="w-5 h-5" />
                        Users Management
                    </Link>
                    <Link href="/admin/lucky-draw" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                        <Trophy className="w-5 h-5" />
                        Lucky Draw
                    </Link>
                    <Link href="/admin/spin-settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                        Spin Settings
                    </Link>
                    <Link href="/admin/plinko-settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                        Plinko Settings
                    </Link>
                    <Link href="/admin/mines-settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                        <Bomb className="w-5 h-5" />
                        Mines Settings
                    </Link>
                    <Link href="/admin/slots-settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                        <div className="w-5 h-5 flex items-center justify-center font-bold border border-current rounded text-[10px]">7</div>
                        Slots Settings
                    </Link>
                    <Link href="/admin/dragontower-settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                        <Crown className="w-5 h-5" />
                        Dragon Tower Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

// Client component for logout logic
import LogoutButton from "./_components/LogoutButton";
