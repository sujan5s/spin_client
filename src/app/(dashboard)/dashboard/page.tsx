"use client";

import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowUpRight, ArrowDownLeft, Trophy } from "lucide-react";
import { TokenIcon } from "@/components/TokenIcon";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const { balance, transactions } = useWallet();
    const { user } = useAuth();

    const totalWins = transactions
        .filter((t) => t.type === "game_win")
        .reduce((acc, t) => acc + t.amount, 0);

    const totalDeposits = transactions
        .filter((t) => t.type === "deposit")
        .reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
                        <TokenIcon className="h-5 w-5" />
                    </div>
                    <div className="text-3xl font-bold text-foreground flex items-center gap-1"><TokenIcon size={24} />{balance.toFixed(2)}</div>
                </div>
                <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Winnings</h3>
                        <Trophy className="h-5 w-5 text-accent" />
                    </div>
                    <div className="text-3xl font-bold text-accent flex items-center gap-1">+<TokenIcon size={24} />{totalWins.toFixed(2)}</div>
                </div>
                <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Deposited</h3>
                        <ArrowUpRight className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="text-3xl font-bold text-foreground flex items-center gap-1"><TokenIcon size={24} />{totalDeposits.toFixed(2)}</div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 font-medium">Amount</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                        No transactions yet. Start playing!
                                    </td>
                                </tr>
                            ) : (
                                transactions.slice(0, 5).map((t) => (
                                    <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium capitalize flex items-center gap-2">
                                            {t.type === "deposit" && <ArrowUpRight className="h-4 w-4 text-primary" />}
                                            {t.type === "game_win" && <Trophy className="h-4 w-4 text-accent" />}
                                            {t.type === "game_loss" && <ArrowDownLeft className="h-4 w-4 text-destructive" />}
                                            {t.type.replace("_", " ")}
                                        </td>
                                        <td
                                            className={cn(
                                                "px-6 py-4 font-bold",
                                                t.type === "game_loss" ? "text-destructive" : "text-primary"
                                            )}
                                        >
                                            {t.type === "game_loss" ? "-" : "+"}<TokenIcon size={14} className="mx-0.5" />{t.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                Completed
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
