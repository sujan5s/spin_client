"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Trophy, Settings, Bomb, Crown, FileText, IndianRupee, BarChart2, LogIn, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { name: "Statistics", href: "/admin/statistics", icon: BarChart2 },
    { name: "Login Logs", href: "/admin/login-logs", icon: LogIn },
    { name: "Users Management", href: "/admin", icon: Users, exact: true },
    { name: "Withdraw Requests", href: "/admin/withdraw-requests", icon: IndianRupee },
    { name: "KYC Requests", href: "/admin/kyc-requests", icon: FileText },
    { name: "Deletion Requests", href: "/admin/deletion-requests", icon: Trash2 },
    { name: "Lucky Draw", href: "/admin/lucky-draw", icon: Trophy },
    { name: "System Controls", href: "/admin/system-settings", icon: Settings },
    { name: "Spin Settings", href: "/admin/spin-settings", icon: Settings },
    { name: "Plinko Settings", href: "/admin/plinko-settings", icon: Settings },
    { name: "Mines Settings", href: "/admin/mines-settings", icon: Bomb },
    {
        name: "Slots Settings",
        href: "/admin/slots-settings",
        icon: () => <div className="w-5 h-5 flex items-center justify-center font-bold border border-current rounded text-[10px]">7</div>
    },
    { name: "Dragon Tower Settings", href: "/admin/dragontower-settings", icon: Crown },
];

export default function AdminNav() {
    const pathname = usePathname();

    return (
        <nav className="flex-1 p-4 space-y-2">
            {NAV_ITEMS.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                            isActive
                                ? "bg-blue-600/10 text-blue-400 hover:bg-blue-600/20"
                                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        )}
                    >
                        <Icon className="w-5 h-5" />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );
}
