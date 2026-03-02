import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { LogOut } from "lucide-react";
import AdminNav from "./_components/AdminNav";

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

                <AdminNav />

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
