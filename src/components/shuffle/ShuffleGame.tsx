"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { useSocket } from "@/context/SocketContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye } from "lucide-react";

export default function ShuffleGame() {
    const { balance, updateBalance, refreshTransactions } = useWallet();
    const { gamesEnabled } = useSystemSettings();
    const { socket, isConnected } = useSocket();

    const [betAmount, setBetAmount] = useState<string>("10");
    const [gameState, setGameState] = useState<"idle" | "shuffling" | "picking" | "revealed">("idle");
    const [winningCup, setWinningCup] = useState<number | null>(null);
    const [selectedCup, setSelectedCup] = useState<number | null>(null);
    const [gameId, setGameId] = useState<number | null>(null);
    const [positions, setPositions] = useState([0, 1, 2]);

    const animateShuffles = async () => {
        const shuffles = 10;
        const speed = 400;

        for (let i = 0; i < shuffles; i++) {
            await new Promise<void>(r => setTimeout(r, speed));
            setPositions(prev => {
                const newPos = [...prev];
                const a = Math.floor(Math.random() * 3);
                let b = Math.floor(Math.random() * 2);
                if (b >= a) b++;
                [newPos[a], newPos[b]] = [newPos[b], newPos[a]];
                return newPos;
            });
        }
        await new Promise<void>(r => setTimeout(r, speed));
    };

    const handleStart = async () => {
        if (!isConnected || !socket) {
            toast.error("Connecting to game server... please wait");
            return;
        }

        const bet = parseFloat(betAmount);
        if (!bet || bet < 10 || bet > balance) {
            toast.error(bet < 10 ? "Minimum bet is 10" : "Insufficient funds");
            return;
        }

        // Optimistic UI
        updateBalance(-bet);
        setGameState("shuffling");
        setWinningCup(null);
        setSelectedCup(null);
        setPositions([0, 1, 2]);

        socket.emit("shuffle:play", { betAmount: bet }, async (response: { success?: boolean; error?: string; gameId?: number }) => {
            if (response.error || !response.success) {
                toast.error(response.error || "Error starting game");
                setGameState("idle");
                updateBalance(bet); // Refund
                return;
            }

            setGameId(response.gameId!);

            // Local visual illusion - random winner for animation only
            const localWinner = Math.floor(Math.random() * 3);
            setWinningCup(localWinner);

            await animateShuffles();

            setGameState("picking");
            toast.info("Pick a cup!", { duration: 2000 });
        });
    };

    const handlePick = (pickedIndex: number) => {
        if (gameState !== "picking" || !gameId || selectedCup !== null) return;
        if (!isConnected || !socket) return;

        const logicalCupId = positions[pickedIndex];
        setSelectedCup(logicalCupId);

        socket.emit("shuffle:pick", { gameId, selectedCup: logicalCupId }, (response: { success?: boolean; error?: string; status?: string; winAmount?: number; winningCup?: number; }) => {
            if (response.error || !response.success) {
                toast.error(response.error || "Error finalizing game");
                setGameState("idle");
                return;
            }

            // Set REAL winning cup from server
            if (response.winningCup !== undefined) {
                setWinningCup(response.winningCup);
            }

            setGameState("revealed");

            if (response.status === "won") {
                toast.success(`You won $${response.winAmount!.toFixed(2)}!`);
            } else {
                toast.error("Wrong cup! Better luck next time.");
            }

            refreshTransactions();
        });
    };

    const handlePlayAgain = () => {
        setGameState("idle");
        setWinningCup(null);
        setSelectedCup(null);
        setGameId(null);
        setPositions([0, 1, 2]);
    };

    const isDisabled = gameState === "shuffling" || gameState === "picking";

    return (
        <div className="h-full bg-[#0f1012] text-white p-2 md:p-4 flex flex-col items-center">
            <div className="w-full max-w-4xl flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-2">
                    <Eye className="w-6 h-6 text-purple-500" />
                    <h1 className="text-2xl font-bold">3 Cup Shuffle</h1>
                </div>
                <div className="flex items-center gap-3">
                    {isConnected ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            Live
                        </span>
                    ) : (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Connecting...
                        </span>
                    )}
                    <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 flex items-center gap-2">
                        <span className="text-zinc-400 text-sm">Balance</span>
                        <span className="text-green-400 font-bold">${balance.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8">
                {/* Controls */}
                <div className="w-full md:w-72 bg-zinc-900 p-6 rounded-xl border border-zinc-800 h-fit space-y-6">
                    {gamesEnabled.shuffle === false && gameState === "idle" && (
                        <div className="text-red-500 text-sm font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center animate-pulse">
                            Game is currently disabled by Admin.
                        </div>
                    )}
                    <div>
                        <label className="text-sm text-zinc-400 font-medium mb-2 block">Bet Amount</label>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            disabled={isDisabled}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white font-bold"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))} disabled={isDisabled} className="bg-zinc-800 py-1 rounded text-xs text-zinc-400">1/2</button>
                            <button onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))} disabled={isDisabled} className="bg-zinc-800 py-1 rounded text-xs text-zinc-400">2x</button>
                        </div>
                    </div>
                    <button
                        onClick={gameState === "revealed" ? handlePlayAgain : handleStart}
                        disabled={isDisabled || gamesEnabled.shuffle === false || !isConnected}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-[0_4px_0_rgb(147,51,234)] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {gameState === "shuffling" ? "SHUFFLING..." : gameState === "picking" ? "PICK A CUP" : gameState === "revealed" ? "PLAY AGAIN" : "START GAME"}
                    </button>
                </div>

                {/* Game Area */}
                <div className="flex-1 bg-zinc-950 rounded-xl border border-zinc-800 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute bottom-0 w-full h-1/3 bg-[#1a1a20] transform skew-x-12 origin-bottom-left scale-150" />

                    <div className="relative z-10 flex gap-4 md:gap-12 items-end mb-12">
                        {[0, 1, 2].map((slotIndex) => {
                            const cupId = positions[slotIndex];
                            const isWinningCup = cupId === winningCup;
                            const isSelectedCup = cupId === selectedCup;

                            return (
                                <motion.div
                                    key={cupId}
                                    layout
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    onClick={() => handlePick(slotIndex)}
                                    className={`relative cursor-pointer group w-24 h-32 md:w-32 md:h-40 ${gameState !== "picking" ? "cursor-default" : ""}`}
                                >
                                    <motion.div
                                        animate={{
                                            y: (gameState === "revealed" && (isSelectedCup || isWinningCup)) ? -60 : 0
                                        }}
                                        className="relative z-20 w-full h-full"
                                    >
                                        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl">
                                            <defs>
                                                <linearGradient id={`cupGrad-${cupId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#ef4444" />
                                                    <stop offset="50%" stopColor="#dc2626" />
                                                    <stop offset="100%" stopColor="#b91c1c" />
                                                </linearGradient>
                                            </defs>
                                            <path d="M10,120 L0,120 L15,10 C15,10 20,0 50,0 C80,0 85,10 85,10 L100,120 L90,120 Z" fill={`url(#cupGrad-${cupId})`} />
                                            <path d="M25,10 C25,10 30,5 50,5 C70,5 75,10 75,10 L85,110 L15,110 Z" fill="white" fillOpacity="0.1" />
                                        </svg>
                                    </motion.div>

                                    {/* Ball */}
                                    {isWinningCup && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] z-10" />
                                    )}

                                    {/* PICK ME Tooltip */}
                                    {gameState === "picking" && (
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold bg-zinc-800 px-2 py-1 rounded">
                                            PICK ME
                                        </div>
                                    )}

                                    {/* Result Overlay */}
                                    {gameState === "revealed" && isSelectedCup && (
                                        <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${isWinningCup ? "text-green-400 bg-green-950" : "text-red-400 bg-red-950"}`}>
                                            {isWinningCup ? "✓ Winner!" : "✗ Wrong"}
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
