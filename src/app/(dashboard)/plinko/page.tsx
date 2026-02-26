"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { Coins, Loader2, History } from "lucide-react";
import PlinkoCanvas from "@/components/plinko/PlinkoCanvas";
import WinLossPopup from "@/components/plinko/WinLossPopup";
import { cn } from "@/lib/utils";

export default function PlinkoPage() {
    const { balance, updateBalance, refreshTransactions } = useWallet();
    const [betAmount, setBetAmount] = useState<string>("10");
    const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
    const [rows, setRows] = useState<number>(16);
    const [activeBalls, setActiveBalls] = useState<any[]>([]);
    const [popupData, setPopupData] = useState<{ isOpen: boolean, amount: number, multiplier: number, type: 'win' | 'loss' } | null>(null);

    // Auto-bet feature
    // const [isAuto, setIsAuto] = useState(false);

    const handleDrop = async () => {
        const bet = parseFloat(betAmount);
        if (!bet || bet <= 0 || bet > balance) return;

        // Optimistic deduction? Or wait for API?
        // Wait for API to ensure path is valid.

        try {
            const res = await fetch("/api/game/plinko", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ betAmount: bet, rows, risk })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Add ball to state
            const newBall = {
                id: Math.random().toString(36).substr(2, 9),
                path: data.path,
                multiplier: data.multiplier,
                betAmount: bet // Store bet for toast
            };

            setActiveBalls(prev => [...prev, newBall]);

            setActiveBalls(prev => [...prev, newBall]);

            // Deduction happens immediately for better UX
            updateBalance(-bet);
            refreshTransactions();

        } catch (error) {
            console.error(error);
        }
    };

    const handleBallComplete = (id: string, multiplier: number, bet: number) => {
        // Calculate win
        const win = bet * multiplier;
        const profit = win - bet;

        // Update balance with Winnings (since bet was already deducted)
        if (win > 0) {
            updateBalance(win);
            refreshTransactions();
        }

        // Update Last Results
        setLastResults(prev => [{ id, multiplier, profit }, ...prev].slice(0, 10));

        // Show Popup
        setPopupData({
            isOpen: true,
            amount: win,
            multiplier,
            type: profit >= 0 ? 'win' : 'loss'
        });

        // Hide Popup after 2 seconds
        setTimeout(() => {
            setPopupData(prev => prev ? { ...prev, isOpen: false } : null);
        }, 2000);

        // Remove ball<bos>
        setTimeout(() => {
            setActiveBalls(prev => prev.filter(b => b.id !== id));
        }, 1000);
    };

    const [lastResults, setLastResults] = useState<{ id: string, multiplier: number, profit: number }[]>([]);

    return (
        <div className="h-screen bg-[#0f1012] text-white p-2 md:p-4 flex flex-col items-center overflow-auto">
            {/* Header */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-4 shrink-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 uppercase tracking-tight">
                        PLINKO
                    </h1>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-2">
                    <Coins className="text-yellow-500 w-5 h-5" />
                    <span className="text-lg font-mono font-bold">{balance.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex flex-col-reverse lg:flex-row gap-4 w-full max-w-6xl h-full min-h-0">
                {/* Controls */}
                <div className="w-full lg:w-1/4 space-y-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 h-fit overflow-y-auto max-h-full">

                    {/* Bet Amount */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Bet Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl py-4 pl-4 pr-12 text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <button onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))} className="px-2 py-1 bg-zinc-800 rounded text-xs">1/2</button>
                                <button onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))} className="px-2 py-1 bg-zinc-800 rounded text-xs">2x</button>
                            </div>
                        </div>
                    </div>

                    {/* Risk */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Risk Level</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['low', 'medium', 'high'] as const).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRisk(r)}
                                    className={cn(
                                        "py-2 rounded-lg text-sm font-bold capitalize transition-colors",
                                        risk === r
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    )}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Rows</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[8, 12, 16].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRows(r)}
                                    className={cn(
                                        "py-2 rounded-lg text-sm font-bold transition-colors",
                                        rows === r
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    )}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Play Button */}
                    <button
                        onClick={handleDrop}
                        className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-black text-xl rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[4px] transition-all uppercase tracking-wider"
                    >
                        BET
                    </button>
                </div>

                {/* Last Results Overlay (Removed) */}
                {/* <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none"> ... </div> */}

                {/* Game Board */}
                <div className="flex-1 flex flex-col items-center w-full">
                    <div className="flex justify-center items-center bg-zinc-950 rounded-xl p-2 shadow-inner w-full mb-8">
                        <PlinkoCanvas
                            rows={rows}
                            risk={risk}
                            balls={activeBalls}
                            onBallComplete={handleBallComplete}
                        />
                    </div>

                    {/* History Section */}
                    <div className="w-full bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <History className="w-5 h-5 text-zinc-400" />
                            History
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {lastResults.map(res => (
                                <div key={res.id} className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm font-bold border transition-all animate-in zoom-in duration-300",
                                    res.profit > 0
                                        ? "bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_10px_-4px_rgba(34,197,94,0.5)]"
                                        : "bg-zinc-800 border-zinc-700 text-zinc-400"
                                )}>
                                    {res.multiplier}x
                                </div>
                            ))}
                            {lastResults.length === 0 && (
                                <span className="text-zinc-500 text-sm italic">No recent bets</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Popup */}
            {popupData && (
                <WinLossPopup
                    isOpen={popupData.isOpen}
                    amount={popupData.amount}
                    multiplier={popupData.multiplier}
                    type={popupData.type}
                />
            )}
        </div>
    );
}
