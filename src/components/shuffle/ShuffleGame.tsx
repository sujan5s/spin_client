"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Trophy, HelpCircle, Eye } from "lucide-react";

export default function ShuffleGame() {
    const { balance, updateBalance, setBalance, refreshTransactions } = useWallet();
    const [betAmount, setBetAmount] = useState<string>("10");
    const [gameState, setGameState] = useState<"idle" | "showing" | "shuffling" | "picking" | "revealed">("idle");
    const [winningCup, setWinningCup] = useState<number | null>(null);
    const [selectedCup, setSelectedCup] = useState<number | null>(null);
    const [gameId, setGameId] = useState<number | null>(null);

    // Cup positions (0, 1, 2)
    // We visually swap these indices.
    // positions[0] = the visual index of Cup 0.
    const [positions, setPositions] = useState([0, 1, 2]);

    const handleStart = async () => {
        const bet = parseFloat(betAmount);
        if (!bet || bet < 10 || bet > balance) {
            toast.error(bet < 10 ? "Minimum bet is 10" : "Insufficient funds");
            return;
        }

        try {
            updateBalance(-bet);
            setGameState("shuffling");
            setWinningCup(null);
            setSelectedCup(null);

            const res = await fetch("/api/game/shuffle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ betAmount: bet })
            });

            if (!res.ok) throw new Error("Failed to start");
            const data = await res.json();

            setGameId(data.gameId);
            const winner = data.winningCup; // 0, 1, 2
            setWinningCup(winner); // We know it, but we hide it visually until reveal

            // Animation Sequence
            // 1. Show Ball under winning cup (Reset positions first)
            setPositions([0, 1, 2]);

            // 2. Perform Shuffles
            await animateShuffles(winner);

            setGameState("picking");
            toast.info("Pick a cup!", { duration: 2000 });

        } catch (error) {
            toast.error("Error starting game");
            setGameState("idle");
        }
    };

    const animateShuffles = async (targetIndex: number) => {
        // Need to simulate shuffles for X seconds.
        // We need to ensure that the final position of 'targetIndex' corresponds to where we want it?
        // Actually, 'winningCup' is the LOGICAL ID of the cup that has the ball.
        // If winningCup is 0, then the RED CUP (ID 0) has the ball.
        // We just need to shuffle the cup objects around.
        // The user tracks the RED CUP.

        const shuffles = 10;
        const speed = 400; // ms

        for (let i = 0; i < shuffles; i++) {
            await new Promise(r => setTimeout(r, speed));

            // Pick two random indices to swap
            setPositions(prev => {
                const newPos = [...prev];
                const a = Math.floor(Math.random() * 3);
                let b = Math.floor(Math.random() * 3);
                while (b === a) b = Math.floor(Math.random() * 3);

                // Swap
                const temp = newPos[a];
                newPos[a] = newPos[b];
                newPos[b] = temp;
                return newPos;
            });
        }
        await new Promise(r => setTimeout(r, speed));
    };

    const handlePick = async (pickedIndex: number) => {
        if (gameState !== "picking" || !gameId) return;

        // pickedIndex is the VISUAL slot (0=left, 1=mid, 2=right).
        // We need to find which LOGICAL cup is at that slot.
        // positions array maps: visual_slot -> logical_cup_id
        // e.g. [2, 0, 1] means Slot 0 has Cup 2, Slot 1 has Cup 0...
        const logicalCupId = positions[pickedIndex];

        setSelectedCup(logicalCupId);
        setGameState("revealed");

        try {
            const res = await fetch("/api/game/shuffle", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId, selectedCup: logicalCupId })
            });
            const data = await res.json();

            if (data.status === "won") {
                toast.success(`You won $${data.winAmount.toFixed(2)}!`);
                updateBalance(data.winAmount); // Optimistic
            } else {
                toast.error("Wrong cup!");
            }
            if (data.balance) setBalance(data.balance);
            refreshTransactions();

        } catch (e) {
            toast.error("Error finalizing game");
        }
    };

    return (
        <div className="h-full bg-[#0f1012] text-white p-2 md:p-4 flex flex-col items-center">
            <div className="w-full max-w-4xl flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-2">
                    <Eye className="w-6 h-6 text-purple-500" />
                    <h1 className="text-2xl font-bold">3 Cup Shuffle</h1>
                </div>
                <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">Balance</span>
                    <span className="text-green-400 font-bold">${balance.toFixed(2)}</span>
                </div>
            </div>

            <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8">
                {/* Controls */}
                <div className="w-full md:w-72 bg-zinc-900 p-6 rounded-xl border border-zinc-800 h-fit space-y-6">
                    <div>
                        <label className="text-sm text-zinc-400 font-medium mb-2 block">Bet Amount</label>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            disabled={gameState === "showing" || gameState === "shuffling" || gameState === "picking"}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white font-bold"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))} disabled={gameState === "showing" || gameState === "shuffling" || gameState === "picking"} className="bg-zinc-800 py-1 rounded text-xs text-zinc-400">1/2</button>
                            <button onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))} disabled={gameState === "showing" || gameState === "shuffling" || gameState === "picking"} className="bg-zinc-800 py-1 rounded text-xs text-zinc-400">2x</button>
                        </div>
                    </div>
                    <button
                        onClick={handleStart}
                        disabled={gameState === "showing" || gameState === "shuffling" || gameState === "picking"}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-[0_4px_0_rgb(147,51,234)] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50"
                    >
                        {gameState === "showing" || gameState === "shuffling" ? "SHUFFLING..." : gameState === "picking" ? "PICK A CUP" : gameState === "revealed" ? "PLAY AGAIN" : "START GAME"}
                    </button>
                </div>

                {/* Game Area */}
                <div className="flex-1 bg-zinc-950 rounded-xl border border-zinc-800 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                    {/* Floor */}
                    <div className="absolute bottom-0 w-full h-1/3 bg-[#1a1a20] transform skew-x-12 origin-bottom-left scale-150" />

                    {/* Cups Container */}
                    <div className="relative z-10 flex gap-4 md:gap-12 items-end mb-12">
                        {[0, 1, 2].map((slotIndex) => { // Render 3 slots
                            // Find which logical cup is at this slot
                            const cupId = positions[slotIndex];
                            const isWinningCup = cupId === winningCup;
                            const isSelected = cupId === selectedCup;

                            return (
                                <motion.div
                                    key={cupId} // Key by ID so motion tracks it
                                    layout
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    onClick={() => handlePick(slotIndex)}
                                    className={`relative cursor-pointer group w-24 h-32 md:w-32 md:h-40`}
                                >
                                    {/* Cup Body */}
                                    {/* Lift Logic: Showing (Winner) OR Revealed (Selected/Winner) */}
                                    <motion.div
                                        animate={{
                                            y: (gameState === "showing" && isWinningCup) ? -60
                                                : (gameState === "revealed" && (isSelected || isWinningCup)) ? -60
                                                    : 0
                                        }}
                                        className="relative z-20 w-full h-full"
                                    >
                                        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl">
                                            <path d="M10,120 L0,120 L15,10 C15,10 20,0 50,0 C80,0 85,10 85,10 L100,120 L90,120 Z" fill="url(#cupGradient)" />
                                            <defs>
                                                <linearGradient id="cupGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#ef4444" />
                                                    <stop offset="50%" stopColor="#dc2626" />
                                                    <stop offset="100%" stopColor="#b91c1c" />
                                                </linearGradient>
                                            </defs>
                                            {/* Highlight */}
                                            <path d="M25,10 C25,10 30,5 50,5 C70,5 75,10 75,10 L85,110 L15,110 Z" fill="white" fillOpacity="0.1" />
                                        </svg>
                                    </motion.div>

                                    {/* Ball (Hidden under cup) */}
                                    {isWinningCup && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] z-10" />
                                    )}

                                    {/* Selection Indicator */}
                                    {gameState === "picking" && (
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold bg-zinc-800 px-2 py-1 rounded">
                                            PICK ME
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
