"use client";

import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { User, Mail, Calendar, Wallet, Trophy, History } from "lucide-react";
import { TokenIcon } from "@/components/TokenIcon";

export default function ProfilePage() {
    const { user } = useAuth();
    const { balance, transactions } = useWallet();

    if (!user) return null;

    const totalWins = transactions.filter(t => t.type === "game_win").length;
    const totalGames = transactions.filter(t => t.type === "game_win" || t.type === "game_loss").length;

    // Calculate total won amount
    const totalWonAmount = transactions
        .filter(t => t.type === "game_win")
        .reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
                <p className="text-muted-foreground">Manage your account and view your stats</p>
            </div>

            {/* User Info Card */}
            <div className="bg-card border border-border rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="h-24 w-24 rounded-full bg-accent flex items-center justify-center text-4xl font-bold text-accent-foreground">
                    {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <div className="flex flex-col md:flex-row gap-4 text-muted-foreground justify-center md:justify-start">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" /> {user.email}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
                    <div className="text-3xl font-bold text-primary flex items-center justify-center gap-2"><TokenIcon size={32} />{balance.toFixed(2)}</div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border p-6 rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Wins</div>
                            <div className="text-2xl font-bold">{totalWins}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Games Played</div>
                            <div className="text-2xl font-bold">{totalGames}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Won</div>
                            <div className="text-2xl font-bold text-green-500 flex items-center gap-1">+<TokenIcon size={20} />{totalWonAmount.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Preview */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
                <div className="space-y-4">
                    {transactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${tx.type === 'game_win' ? 'bg-green-500/10 text-green-500' :
                                    tx.type === 'game_loss' ? 'bg-red-500/10 text-red-500' :
                                        tx.type === 'deposit' ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-orange-500/10 text-orange-500'
                                    }`}>
                                    {tx.type === 'game_win' ? <Trophy className="h-4 w-4" /> :
                                        tx.type === 'game_loss' ? <History className="h-4 w-4" /> :
                                            tx.type === 'deposit' ? <Wallet className="h-4 w-4" /> :
                                                <User className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="font-medium capitalize">{tx.type.replace("_", " ")}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className={`font-bold flex items-center gap-1 ${tx.type === 'deposit' || tx.type === 'game_win' ? 'text-green-500' : 'text-red-500'
                                }`}>
                                {tx.type === 'deposit' || tx.type === 'game_win' ? '+' : '-'}<TokenIcon size={14} />{Math.abs(tx.amount).toFixed(2)}
                            </span>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No recent activity</p>
                    )}
                </div>
            </div>
        </div>
    );
}
