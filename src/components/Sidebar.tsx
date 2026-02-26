"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Gamepad2, Settings, LogOut, CreditCard, Ticket, X, Dices, Bomb, Eye, Crown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Wallet", href: "/wallet", icon: Wallet },
    { name: "Withdraw", href: "/withdraw", icon: CreditCard },
    { name: "Lucky Draw", href: "/lucky-draw", icon: Ticket },
    { name: "Spin & Win", href: "/spin", icon: Gamepad2 },
    { name: "Roulette", href: "/roulette", icon: Dices },
    { name: "Mines", href: "/mines", icon: Bomb },
    { name: "Plinko", href: "/plinko", icon: LayoutDashboard }, // Reuse icon or find better (Grip has dots?)
    { name: "Dragon Tower", href: "/dragontower", icon: Crown },
    { name: "3 Cup Shuffle", href: "/shuffle", icon: Eye },
    { name: "Slots", href: "/slots", icon: Gamepad2 },
    { name: "Referral", href: "/referral", icon: Users },
];

interface SidebarProps {
    onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <div className="flex h-full w-full md:w-64 flex-col bg-card border-r border-border">
            <div className="flex h-16 items-center justify-between px-6 border-b border-border">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    GAMEVERSE
                </h1>
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground">
                        <X className="h-6 w-6" />
                    </button>
                )}
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-6 w-6 flex-shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-border p-4">
                <button
                    onClick={() => {
                        logout();
                        if (onClose) onClose();
                    }}
                    className="group flex w-full items-center px-2 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                    <LogOut className="mr-3 h-6 w-6 text-muted-foreground group-hover:text-destructive" />
                    Logout
                </button>
            </div>
        </div>
    );
}
