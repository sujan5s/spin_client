"use client";

import { useState, useEffect } from "react";
import { Ticket, Trophy, Users, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { TokenIcon } from "@/components/TokenIcon";

interface TicketData {
    id: number;
    tokenNumber: string;
    price: number;
    user: { name: string; email: string };
    purchasedAt: string;
}

const POOL_PRICES = [10, 50, 200, 500];

export default function AdminLuckyDrawPage() {
    const [pools, setPools] = useState<Record<number, TicketData[]>>({});
    const [recentWinners, setRecentWinners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [drawingPool, setDrawingPool] = useState<number | null>(null);
    const [drawResult, setDrawResult] = useState<{ winner: string; ticket: string; amount: number } | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/lucky-draw/stats");
            if (res.ok) {
                const data = await res.json();
                setPools(data.pools);
                setRecentWinners(data.recentWinners);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleDraw = async (price: number) => {
        if (!confirm(`Are you sure you want to draw a winner for the ${price} pool?`)) return;

        setDrawingPool(price);
        try {
            const res = await fetch("/api/admin/lucky-draw/draw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price }),
            });

            const data = await res.json();
            if (res.ok) {
                setDrawResult(data.result);
                await fetchStats();
            } else {
                alert(data.error || "Draw failed");
            }
        } catch (error) {
            alert("Something went wrong");
        } finally {
            setDrawingPool(null);
        }
    };

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Trophy className="h-8 w-8 text-yellow-500" /> Lucky Draw Management
                </h1>
                <button onClick={fetchStats} className="p-2 hover:bg-secondary rounded-full">
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            {drawResult && (
                <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                    <h2 className="text-2xl font-bold text-green-500 mb-2">🎉 Winner Announced! 🎉</h2>
                    <p className="text-lg">
                        <span className="font-bold">{drawResult.winner}</span> won
                        <span className="font-bold mx-1 text-green-500 inline-flex items-center"><TokenIcon size={16} />{drawResult.amount}</span>
                        with ticket <span className="font-mono bg-secondary px-2 rounded">{drawResult.ticket}</span>
                    </p>
                    <button onClick={() => setDrawResult(null)} className="mt-4 text-sm text-green-500 underline">Close</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {POOL_PRICES.map((price) => {
                    const participants = pools[price] || [];
                    return (
                        <div key={price} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <TokenIcon size={24} />
                                </div>
                                <span className="text-2xl font-bold">{price}</span>
                            </div>

                            <h3 className="text-lg font-semibold mb-1">Pool {price}</h3>
                            <p className="text-muted-foreground text-sm mb-6 flex items-center gap-1">
                                <Users className="h-4 w-4" /> {participants.length} Participants
                            </p>

                            <button
                                onClick={() => handleDraw(price)}
                                disabled={participants.length === 0 || drawingPool !== null}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {drawingPool === price ? <Loader2 className="h-4 w-4 animate-spin" /> : "Announce Winner"}
                            </button>

                            {participants.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <p className="text-xs text-muted-foreground font-medium mb-2">Recent Entries:</p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {participants.slice(0, 5).map(t => (
                                            <div key={t.id} className="text-xs flex justify-between">
                                                <span className="truncate max-w-[100px]">{t.user.name || "User"}</span>
                                                <span className="font-mono opacity-70">{t.tokenNumber}</span>
                                            </div>
                                        ))}
                                        {participants.length > 5 && (
                                            <div className="text-xs text-center text-muted-foreground pt-1">
                                                + {participants.length - 5} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Recent Winners (Simplified for now) */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Recent Winners</h2>
                <div className="space-y-2">
                    {recentWinners.length === 0 ? (
                        <p className="text-muted-foreground">No winners yet.</p>
                    ) : (
                        recentWinners.map((winner) => (
                            <div key={winner.id} className="flex items-center justify-between p-2 hover:bg-secondary/50 rounded">
                                <span className="font-medium">{winner.user?.name || "Unknown"}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-green-500 font-bold flex items-center gap-1">+<TokenIcon size={14} />{winner.price * 2}</span>
                                    <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded capitalize">{winner.status}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
