"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { Loader2, RotateCcw, Coins, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import RouletteWheel from "@/components/roulette/RouletteWheel";
import BettingTable from "@/components/roulette/BettingTable";

export default function RoulettePage() {
    const { balance, updateBalance, refreshTransactions } = useWallet();
    const [gameState, setGameState] = useState<"IDLE" | "SPINNING" | "RESULT">("IDLE");
    const [bets, setBets] = useState<{ [key: string]: number }>({});
    const [selectedChip, setSelectedChip] = useState<number>(1);
    const [previousResult, setPreviousResult] = useState<number | null>(null);
    const [winAmount, setWinAmount] = useState<number>(0);
    const [history, setHistory] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Passed to Wheel to trigger animation
    const [targetNumber, setTargetNumber] = useState<number | null>(null);

    const CHIPS = [1, 5, 10, 25, 50, 100];

    const getTotalBet = () => Object.values(bets).reduce((a, b) => a + b, 0);

    const handlePlaceBet = (betType: string) => {
        if (gameState === "SPINNING") return;
        const currentTotal = getTotalBet();
        if (currentTotal + selectedChip > balance) {
            setError("Insufficient funds");
            setTimeout(() => setError(null), 3000);
            return;
        }

        setBets(prev => ({
            ...prev,
            [betType]: (prev[betType] || 0) + selectedChip
        }));
    };

    const clearBets = () => {
        if (gameState !== "SPINNING") setBets({});
    };

    const undoBet = () => {
        // Simple undo: just clear for now, or could implement stack
        // For MVP, just clear specific Logic is hard, let's just stick to clear
        // Actually, proper undo would remove last added. Let's stick to Clear All for simplicity v1
        if (gameState !== "SPINNING") setBets({});
    };

    const spin = async () => {
        const totalBet = getTotalBet();
        if (totalBet === 0 || totalBet > balance) {
            setError("Invalid bet amount");
            return;
        }

        setGameState("SPINNING");
        setTargetNumber(null); // Reset target to prevent premature spinning to old number
        setError(null);
        setWinAmount(0);
        console.log("Spin started, bets:", bets);

        try {
            const res = await fetch("/api/game/roulette", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bets })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Spin failed");
            }

            // Start Wheel Animation
            console.log("Spin result received:", data.result);
            setTargetNumber(data.result);

            // Wait for animation (e.g., 8 seconds) - The Wheel component will call onComplete
            // But we need to define the onComplete handler here

            // Note: We'll pass the result data to a ref or state to access it after animation
            window.rouletteResult = data;

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setGameState("IDLE");
        }
    };

    const handleSpinComplete = () => {
        // @ts-ignore
        const data = window.rouletteResult;
        if (!data) return;

        // Delay showing result to let the ball settle visually
        setTimeout(() => {
            setGameState("RESULT");
            setPreviousResult(data.result);
            setWinAmount(data.winAmount);
            setHistory(prev => [data.result, ...prev].slice(0, 10)); // Keep last 10

            // Update Wallet
            updateBalance(data.netChange);
            refreshTransactions();

            // Trigger Notification (Delayed)
            setTimeout(async () => {
                try {
                    await fetch("/api/notifications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: data.winAmount > 0 ? "Roulette Win!" : "Roulette Loss",
                            message: `Roulette Result: ${data.result}. Win: $${data.winAmount}`,
                            type: data.winAmount > 0 ? "success" : "info"
                        })
                    });
                } catch (e) {
                    console.error("Failed to send notification", e);
                }

                setGameState("IDLE");
                // Optional: Clear bets or keep them for re-bet?
                // Casino standard: clear bets usually, or have "Rebet" button.
                // We'll keep them on board but user needs to modify if they want?
                // Let's clear for cleaner flow.
                setBets({});
            }, 6000); // 6s delay per user request
        }, 1000); // 1s delay after animation stops
    };

    return (
        <div className="min-h-screen bg-[#0f1012] text-white p-4 md:p-8 flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-7xl flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 uppercase tracking-tight">
                        Royal Roulette
                    </h1>
                    <p className="text-zinc-500 font-medium">European Single Zero</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-3 flex items-center gap-4">
                    <Coins className="text-yellow-500 w-6 h-6" />
                    <span className="text-2xl font-mono font-bold">{balance.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-12 w-full max-w-7xl items-start">

                {/* Left Column: Wheel & History */}
                <div className="w-full xl:w-1/3 flex flex-col items-center gap-8">
                    <div className="relative">
                        <RouletteWheel
                            targetNumber={targetNumber}
                            isSpinning={gameState === "SPINNING"}
                            onSpinComplete={handleSpinComplete}
                        />
                        {/* Result Overlay */}
                        {gameState === "RESULT" && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                <div className="bg-black/90 backdrop-blur-md rounded-2xl p-6 border-2 border-yellow-500 animate-in zoom-in slide-in-from-bottom-5 duration-300 flex flex-col items-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                                    <div className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black mb-2 border-4",
                                        previousResult === 0 ? "bg-green-600 border-green-400" :
                                            [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(previousResult!) ? "bg-red-600 border-red-400" : "bg-black border-zinc-500"
                                    )}>
                                        {previousResult}
                                    </div>
                                    <div className="text-yellow-400 font-bold text-xl uppercase">
                                        {winAmount > 0 ? "You Won!" : "No Luck"}
                                    </div>
                                    {winAmount > 0 && (
                                        <div className="text-3xl font-black text-white">+${winAmount}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* History */}
                    <div className="flex gap-2 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        {history.length === 0 && <span className="text-zinc-500 text-sm">No history</span>}
                        {history.map((num, i) => (
                            <div key={i} className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2",
                                num === 0 ? "bg-green-900 border-green-600 text-green-400" :
                                    [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num) ? "bg-red-900 border-red-600 text-red-400" : "bg-zinc-900 border-zinc-600 text-zinc-400"
                            )}>
                                {num}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Betting Table & Controls */}
                <div className="w-full xl:w-2/3 space-y-8">
                    {/* Chip Selector */}
                    <div className="flex flex-wrap gap-4 justify-center bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800">
                        {CHIPS.map(amount => (
                            <button
                                key={amount}
                                onClick={() => setSelectedChip(amount)}
                                className={cn(
                                    "w-16 h-16 rounded-full border-4 flex items-center justify-center font-black shadow-lg transition-transform hover:scale-110 active:scale-95",
                                    selectedChip === amount ? "translate-y-[-10px] shadow-2xl ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-900" : "",
                                    amount === 1 ? "bg-zinc-300 border-dashed border-zinc-400 text-zinc-800" :
                                        amount === 5 ? "bg-red-600 border-dashed border-white text-white" :
                                            amount === 10 ? "bg-blue-600 border-dashed border-white text-white" :
                                                amount === 25 ? "bg-green-600 border-dashed border-white text-white" :
                                                    amount === 50 ? "bg-black border-dashed border-yellow-400 text-yellow-400" :
                                                        "bg-purple-600 border-dashed border-yellow-200 text-yellow-100" // 100
                                )}
                            >
                                <span className="drop-shadow-md">{amount}</span>
                            </button>
                        ))}
                    </div>

                    {/* Betting Table */}
                    <div className="overflow-x-auto pb-4">
                        <BettingTable
                            onPlaceBet={handlePlaceBet}
                            bets={bets}
                            chipValue={selectedChip}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 justify-end">
                        <button
                            onClick={clearBets}
                            disabled={gameState === "SPINNING"}
                            className="px-6 py-3 rounded-xl font-bold bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors uppercase tracking-wider flex items-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" /> Clear Bets
                        </button>

                        <button
                            onClick={spin}
                            disabled={gameState === "SPINNING" || getTotalBet() === 0 || getTotalBet() > balance}
                            className="bg-gradient-to-br from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-black text-2xl px-12 py-4 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest flex items-center gap-3"
                        >
                            {gameState === "SPINNING" ? <Loader2 className="animate-spin w-8 h-8" /> : "SPIN"}
                        </button>
                    </div>

                    {error && (
                        <div className="text-red-500 font-bold text-center bg-red-900/20 py-2 rounded-lg border border-red-900/50">
                            {error}
                        </div>
                    )}

                    <div className="text-center text-zinc-500 font-mono text-sm">
                        Total Bet: {getTotalBet().toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper to keep TS happy with arbitrary window prop
declare global {
    interface Window {
        rouletteResult: any;
    }
}
