"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { cn } from "@/lib/utils";
import { getSymbolComponent } from "./SlotsSymbols";
import { Trophy, Info, Loader2, Coins } from "lucide-react";
import { toast } from "sonner";

const REEL_COUNT = 5;
const SYMBOLS = ['cherry', 'lemon', 'watermelon', 'diamond', '7', 'bell'];

// Sound effects placeholder
const useSound = () => {
    return {
        playSpin: () => { },
        playWin: () => { },
    };
};

export default function SlotsGame() {
    const { balance, updateBalance, setBalance, refreshTransactions } = useWallet();
    const [betAmount, setBetAmount] = useState<string>("10");
    const [isSpinning, setIsSpinning] = useState(false);
    const [reels, setReels] = useState<string[]>(Array(REEL_COUNT).fill('7'));
    const [winData, setWinData] = useState<{ amount: number, type: string, multiplier: number } | null>(null);

    const { playSpin, playWin } = useSound();

    const handleSpin = async () => {
        const bet = parseFloat(betAmount);
        if (!bet || bet <= 0 || bet > balance || isSpinning) {
            if (bet > balance) toast.error("Insufficient funds");
            return;
        }

        setIsSpinning(true);
        setWinData(null);
        playSpin();

        try {
            updateBalance(-bet);
            // refreshTransactions(); // Wait for result to refresh history

            const res = await fetch("/api/game/slots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ betAmount: bet })
            });

            if (!res.ok) throw new Error("Failed to spin");
            const data = await res.json();

            // Delay visuals
            setTimeout(() => {
                if (data.reels) {
                    setReels(data.reels);
                }

                setIsSpinning(false);

                // Sync balance from server (guarateed correctness)
                if (data.balance !== undefined) {
                    setBalance(data.balance);
                }
                refreshTransactions();

                // Win logic after stop
                setTimeout(() => {
                    handleWin(data, bet);
                }, 500); // Quick check after stop
            }, 2000); // 2s spin duration

        } catch (error) {
            console.error(error);
            setIsSpinning(false);
            toast.error("Error processing spin. Please try again.");
        }
    };

    const handleWin = (data: any, bet: number) => {
        if (data.winAmount > 0) {
            // Balance already synced via setBalance(data.balance) above
            setWinData({
                amount: data.winAmount,
                type: data.multiplier >= 10 ? 'jackpot' : 'win',
                multiplier: data.multiplier
            });
            playWin();
            toast.success(`You won $${data.winAmount.toFixed(2)} (${data.multiplier}x)!`);
            // Trigger confetti or similar here if desired
        } else {
            toast.error(`You lost $${bet.toFixed(2)}`);
        }
    };

    return (
        <div className="h-full bg-[#0f1012] text-white p-2 md:p-4 flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <h1 className="text-2xl font-bold">Slots</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 flex items-center gap-2">
                        <span className="text-zinc-400 text-sm">Balance</span>
                        <div className="flex items-center gap-1 text-green-400 font-bold">
                            {/* <span>$</span> */}
                            <span>{balance.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl flex-1 min-h-0">

                {/* --- LEFT SIDEBAR (Controls) --- */}
                <div className="w-full md:w-80 bg-zinc-900 rounded-xl p-6 border border-zinc-800 h-fit flex flex-col gap-6 shrink-0 shadow-xl">
                    <div>
                        <label className="text-sm text-zinc-400 font-medium mb-2 block">Bet Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                disabled={isSpinning}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 pl-10 text-white font-bold focus:outline-none focus:border-yellow-500 transition-colors disabled:opacity-50"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><Coins className="text-yellow-500 w-5 h-5" /></span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                                onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                                disabled={isSpinning}
                                className="bg-zinc-800 hover:bg-zinc-700 py-1 rounded text-xs text-zinc-400 font-medium transition-colors disabled:opacity-50"
                            >1/2</button>
                            <button
                                onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                                disabled={isSpinning}
                                className="bg-zinc-800 hover:bg-zinc-700 py-1 rounded text-xs text-zinc-400 font-medium transition-colors disabled:opacity-50"
                            >2x</button>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button
                            onClick={handleSpin}
                            disabled={isSpinning || !betAmount || parseFloat(betAmount) <= 0}
                            className="w-full py-4 bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xl rounded-xl shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-[4px] transition-all uppercase tracking-wider relative overflow-hidden"
                        >
                            {isSpinning ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "SPIN"}
                        </button>
                    </div>

                    {winData && (
                        <div className="bg-zinc-950 p-4 rounded-lg border border-green-500/20 text-center animate-in fade-in zoom-in">
                            <div className="text-sm text-zinc-400 uppercase font-bold tracking-wider mb-1">Last Win</div>
                            <div className="text-2xl font-black text-green-400">${winData.amount.toFixed(2)}</div>
                            <div className="text-xs text-green-500/80">{winData.multiplier}x Multiplier</div>
                        </div>
                    )}
                </div>

                {/* --- RIGHT AREA (Game) --- */}
                <div className="flex-1 bg-zinc-950 rounded-xl p-6 border border-zinc-800 shadow-inner flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-yellow-500/5 blur-[100px] rounded-full pointer-events-none" />

                    {/* Machine Container */}
                    <div className="relative z-10 w-full max-w-3xl aspect-[16/9] md:aspect-video bg-zinc-900 p-2 md:p-4 rounded-xl border border-zinc-800 shadow-2xl flex gap-2 md:gap-4 overflow-hidden">
                        {/* Reels */}
                        {reels.map((symbol, i) => (
                            <ReelColumn key={i} targetSymbol={symbol} isSpinning={isSpinning} delay={i} />
                        ))}

                        {/* Payline Indicator */}
                        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-500/20 -translate-y-1/2 pointer-events-none z-20 hidden" />
                    </div>
                </div>

            </div>
        </div>
    );
}

// ------------------------------------------
// Reel Column Component (Restyled)
// ------------------------------------------
function ReelColumn({ targetSymbol, isSpinning, delay }: { targetSymbol: string, isSpinning: boolean, delay: number }) {
    const [visualState, setVisualState] = useState<'static' | 'spinning'>('static');

    useEffect(() => {
        if (isSpinning) {
            setVisualState('spinning');
        } else {
            const stopDelay = delay * 200;
            const timer = setTimeout(() => {
                setVisualState('static');
            }, 500 + stopDelay);
            return () => clearTimeout(timer);
        }
    }, [isSpinning, delay]);

    const SymbolComp = getSymbolComponent(targetSymbol);

    return (
        <div className="flex-1 bg-zinc-950 rounded-lg relative overflow-hidden flex flex-col items-center border border-zinc-800/50 shadow-inner group">
            {/* Gradient Shine */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-20 pointer-events-none" />

            {visualState === 'static' ? (
                <div className="absolute inset-0 flex items-center justify-center animate-in slide-in-from-top duration-500">
                    <SymbolComp className="w-[60%] h-[60%] drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 group-hover:scale-110" />
                </div>
            ) : (
                <div className="w-full h-[600%] absolute top-0 flex flex-col justify-around animate-reel-spin">
                    {/* Blur Reel Sequence */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        const randomSym = SYMBOLS[i % SYMBOLS.length];
                        const S = getSymbolComponent(randomSym);
                        return (
                            <div key={i} className="flex-1 flex items-center justify-center opacity-40 blur-[1px]">
                                <S className="w-[50%] h-[50%]" />
                            </div>
                        )
                    })}
                </div>
            )}

            <style jsx>{`
                @keyframes reel-spin {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); } 
                }
                .animate-reel-spin {
                    animation: reel-spin 0.5s linear infinite;
                }
            `}</style>
        </div>
    );
}
