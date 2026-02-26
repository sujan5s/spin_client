"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { Bomb, Diamond, Coins, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface GameState {
    id: number;
    status: "active" | "won" | "lost" | "cashed_out";
    multiplier: number;
    amount: number; // Current payout amount
    mines: number[]; // Only available on end
    revealed: number[];
}

export default function MinesPage() {
    const { balance, updateBalance, refreshTransactions } = useWallet();

    // Inputs
    const [betAmount, setBetAmount] = useState("10");
    const [minesCount, setMinesCount] = useState(3);

    // Game State
    const [game, setGame] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false); // Revealing/Cashing out

    // Sound effects (optional, can add later)

    const handleStartGame = async () => {
        const bet = parseFloat(betAmount);
        if (!bet || bet < 10 || bet > balance) {
            toast.error(bet < 10 ? "Minimum bet amount is 10" : "Invalid bet amount");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/game/mines/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ betAmount: bet, minesCount })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setGame({
                id: data.game.id,
                status: "active",
                multiplier: 1.0,
                amount: bet, // Initially just the bet back (technically 0 profit until first move but Stake shows base)
                mines: [],
                revealed: []
            });

            updateBalance(-bet);
            refreshTransactions();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReveal = async (index: number) => {
        if (!game || game.status !== "active" || actionLoading) return;
        if (game.revealed.includes(index)) return;

        setActionLoading(true);
        try {
            const res = await fetch("/api/game/mines/reveal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: game.id, tileIndex: index })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            if (data.status === "lost") {
                // Game Over
                setGame(prev => prev ? {
                    ...prev,
                    status: "lost",
                    mines: data.mines,
                    revealed: data.revealed // Should include the bomb just hit
                } : null);
                // toast.error("Boom! You hit a mine.");
            } else {
                // Safe
                setGame(prev => prev ? {
                    ...prev,
                    status: "active",
                    multiplier: data.multiplier,
                    amount: data.currentPayout,
                    revealed: data.revealed
                } : null);
                // Audio success?
            }

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCashout = async () => {
        if (!game || game.status !== "active" || actionLoading) return;

        setActionLoading(true);
        try {
            const res = await fetch("/api/game/mines/cashout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: game.id })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setGame(prev => prev ? {
                ...prev,
                status: "cashed_out",
                mines: data.mines
            } : null);

            updateBalance(data.payout);
            refreshTransactions();

            toast.success(`Cashed out $${data.payout.toFixed(2)}!`);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickPick = () => {
        // Find unrevealed tile
        if (!game) return;
        const available = Array.from({ length: 25 }, (_, i) => i)
            .filter(i => !game.revealed.includes(i));

        if (available.length > 0) {
            const random = available[Math.floor(Math.random() * available.length)];
            handleReveal(random);
        }
    };

    // Derived state for next multiplier prediction could be added here

    return (
        <div className="h-full bg-[#0f1012] text-white p-2 md:p-4 flex flex-col items-center">
            <div className="w-full max-w-6xl flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <Bomb className="w-6 h-6 text-red-500" />
                    <h1 className="text-2xl font-bold">Mines</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 flex items-center gap-2">
                        <span className="text-zinc-400 text-sm">Balance</span>
                        <div className="flex items-center gap-1 text-green-400 font-bold">
                            <span></span>
                            <span>{balance.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl flex-1 min-h-0">
                {/* Sidebar Controls */}
                <div className="w-full md:w-80 bg-zinc-900 rounded-xl p-6 border border-zinc-800 h-fit flex flex-col gap-6 shrink-0">
                    <div>
                        <label className="text-sm text-zinc-400 font-medium mb-2 block">Bet Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                disabled={game?.status === "active"}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 pl-10 text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><Coins className="text-yellow-500 w-6 h-6" /></span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                                onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                                disabled={game?.status === "active"}
                                className="bg-zinc-800 hover:bg-zinc-700 py-1 rounded text-xs text-zinc-400 font-medium transition-colors disabled:opacity-50"
                            >1/2</button>
                            <button
                                onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                                disabled={game?.status === "active"}
                                className="bg-zinc-800 hover:bg-zinc-700 py-1 rounded text-xs text-zinc-400 font-medium transition-colors disabled:opacity-50"
                            >2x</button>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm text-zinc-400 font-medium">Mines</label>
                            <span className="text-sm font-bold bg-zinc-950 px-2 rounded border border-zinc-800">{minesCount}</span>
                        </div>
                        <input // Basic slider for now, can be custom grid selector
                            type="range"
                            min="1"
                            max="24"
                            value={minesCount}
                            onChange={(e) => setMinesCount(parseInt(e.target.value))}
                            disabled={game?.status === "active"}
                            className="w-full h-2 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="flex justify-between text-xs text-zinc-600 mt-1 font-mono">
                            <span>1</span>
                            <span>3</span>
                            <span>5</span>
                            <span>10</span>
                            <span>24</span>
                        </div>
                    </div>

                    <div className="mt-auto">
                        {game?.status === "active" ? (
                            <button
                                onClick={handleCashout}
                                disabled={actionLoading || game.revealed.length === 0} // Can't cashout without playing once? Actually Stake allows reveal then cashout immediately. 
                                className="w-full py-4 bg-green-500 hover:bg-green-600 text-black font-black text-xl rounded-lg shadow-[0_5px_0_rgb(22,163,74)] active:shadow-none active:translate-y-[5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center leading-none gap-1"
                            >
                                <span>CASHOUT</span>
                                <div className="flex items-center gap-1 text-sm opacity-80 font-mono">
                                    <span className="text-xs">{(game.multiplier).toFixed(2)}x</span>
                                    <span>${game.amount.toFixed(2)}</span>
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={handleStartGame}
                                disabled={isLoading || parseFloat(betAmount) < 10}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-lg shadow-[0_5px_0_rgb(79,70,229)] active:shadow-none active:translate-y-[5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "BET"}
                            </button>
                        )}

                        {game?.status === "active" && (
                            <button
                                onClick={handleQuickPick}
                                disabled={actionLoading}
                                className="w-full mt-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                Pick Random Tile
                            </button>
                        )}
                    </div>
                </div>

                {/* Game Grid */}
                <div className="flex-1 flex items-center justify-center bg-zinc-950 rounded-xl p-4 shadow-inner relative overflow-hidden w-full">
                    {/* Fixed aspect ratio container to prevent shifts */}
                    <div className="grid grid-cols-5 grid-rows-5 gap-3 w-full max-w-[500px] max-h-[500px] aspect-square">
                        {Array.from({ length: 25 }, (_, i) => i).map((i) => {
                            const isRevealed = game?.revealed.includes(i);
                            const isMine = game?.mines?.includes(i);
                            const isLostMine = game?.status === "lost" && isMine;

                            let content = null;
                            // Base style - fixed dimensions via flex/grid context + fixed border width to prevent layout shift
                            // We add border-t-4 etc or just border-4. Let's use border-b-4 for the "3D" effect if we wanted, 
                            // but here we are using box-shadow for 3D. 
                            // To prevent shift when switching to "border-4" on reveal, we must have border-4 here too.
                            // We can use border-transparent or border-zinc-800 (same as bg).
                            let style = "bg-zinc-800 border-4 border-zinc-800 shadow-[0_4px_0_rgb(24,24,27)] hover:-translate-y-1 hover:bg-zinc-700";

                            if (game?.status !== "active") {
                                style = "bg-zinc-800 border-4 border-zinc-800 shadow-[0_4px_0_rgb(24,24,27)] opacity-50 cursor-default";
                            }

                            if (isRevealed) {
                                style = "bg-zinc-900 border-4 border-zinc-800 cursor-default shadow-none translate-y-[2px]"; // Pressed state
                                if (isLostMine) {
                                    style = "bg-red-500 border-4 border-red-700 shadow-none";
                                    content = <Bomb className="w-1/2 h-1/2 text-white animate-bounce" />
                                } else {
                                    style = "bg-[#0f212e] border-4 border-[#1a3c54] shadow-none";
                                    content = <Diamond className="w-1/2 h-1/2 text-green-400 animate-in zoom-in duration-300 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                }
                            } else if (game?.status !== "active" && isMine) {
                                style = "bg-zinc-800 opacity-60";
                                content = <Bomb className="w-1/2 h-1/2 text-white/50" />
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleReveal(i)}
                                    disabled={game?.status !== "active" || isRevealed}
                                    className={cn(
                                        "w-full h-full rounded-lg transition-all flex items-center justify-center relative outline-none",
                                        style
                                    )}
                                >
                                    {content}
                                </button>
                            );
                        })}
                    </div>

                    {/* Game Over Overlays? */}
                    {game?.status === "lost" && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-red-500 font-black text-4xl px-8 py-4 rounded-xl border-2 border-red-500 backdrop-blur-sm animate-in zoom-in fade-in duration-300 whitespace-nowrap z-10 pointer-events-none">
                            BOOM!
                        </div>
                    )}
                    {game?.status === "cashed_out" && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-green-400 font-black text-4xl px-8 py-4 rounded-xl border-2 border-green-500 backdrop-blur-sm animate-in zoom-in fade-in duration-300 whitespace-nowrap z-10 pointer-events-none flex flex-col items-center">
                            <span>{game.multiplier.toFixed(2)}x</span>
                            <span className="text-xl text-white">Won ${game.amount.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
