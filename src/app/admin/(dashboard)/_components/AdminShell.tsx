"use client";

import { useState } from "react";
import { Menu, X, Gamepad2 } from "lucide-react";
import AdminNav from "./AdminNav";
import LogoutButton from "./LogoutButton";

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans">

            {/* ── Mobile overlay ─────────────────────────────── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ─────────────────────────────────────── */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 flex flex-col w-64
                    bg-gray-900 border-r border-gray-800
                    transform transition-transform duration-300 ease-in-out
                    md:translate-x-0 md:static md:inset-auto md:flex
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Sidebar header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-blue-400" />
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                            Admin Console
                        </h1>
                    </div>
                    {/* Close button — mobile only */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav links — clicking a link closes sidebar on mobile */}
                <div onClick={() => setSidebarOpen(false)} className="flex-1 overflow-y-auto">
                    <AdminNav />
                </div>

                <div className="p-4 border-t border-gray-800">
                    <LogoutButton />
                </div>
            </aside>

            {/* ── Main content ────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile top bar */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-sm bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        Admin Console
                    </span>
                    <div className="w-9" /> {/* spacer */}
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
