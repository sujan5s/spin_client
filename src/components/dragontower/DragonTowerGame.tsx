"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Flame, Ghost, Crown, Egg, Skull, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type Difficulty = "easy" | "medium" | "hard" | "expert" | "master";

type GameConfig = {
    cols: number;
    rows: number;
    multipliers: number[];
};

export default function DragonTowerGame() {
    const { balance, updateBalance, setBalance, refreshTransactions } = useWallet();
    const [betAmount, setBetAmount] = useState<string>("10");
    const [difficulty, setDifficulty] = useState<Difficulty>("medium");
    const [gameState, setGameState] = useState<"idle" | "playing" | "game_over" | "won">("idle");
    const [gameId, setGameId] = useState<number | null>(null);
    const [currentRow, setCurrentRow] = useState<number>(0);
    const [history, setHistory] = useState<any[]>([]); // Array of row results
    const [config, setConfig] = useState<GameConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [minBets, setMinBets] = useState<Record<string, number>>({
        easy: 10, medium: 10, hard: 10, expert: 10, master: 10
    });

    useEffect(() => {
        // Fetch Min Bets Config
        fetch("/api/game/dragontower/config")
            .then(res => res.json())
            .then(data => {
                if (data.minBets) setMinBets(data.minBets);
            })
            .catch(err => console.error("Failed to load config", err));
    }, []);

    // Initial placeholder config for UI before game starts
    const INITIAL_ROWS = 9;
    const getCols = (d: Difficulty) => {
        switch (d) {
            case "easy": return 4;
            case "medium": return 3;
            case "hard": return 2;
            case "expert": return 3;
            case "master": return 4;
            default: return 3;
        }
    };

    const handleStart = async () => {
        const currentMinBet = minBets[difficulty];
        const bet = parseFloat(betAmount);

        if (!bet || bet < currentMinBet || bet > balance) {
            toast.error(bet < currentMinBet ? `Minimum bet for ${difficulty} is ${currentMinBet}` : "Insufficient funds");
            return;
        }

        setLoading(true);
        try {
            updateBalance(-bet);

            const res = await fetch("/api/game/dragontower/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ betAmount: bet, difficulty })
            });

            if (!res.ok) throw new Error("Failed to start");
            const data = await res.json();

            setGameId(data.gameId);
            setConfig(data.config);
            setGameState("playing");
            setCurrentRow(0);
            setHistory(Array(data.config.rows).fill(null)); // Reset Grid
        } catch (e) {
            toast.error("Error starting game");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTile = async (index: number) => {
        if (gameState !== "playing" || !gameId) return;

        try {
            const res = await fetch("/api/game/dragontower/reveal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId, tileIndex: index })
            });

            const data = await res.json();

            // Update History Grid
            setHistory(prev => {
                const newHist = [...prev];
                // Store the full row content and the user's pick
                newHist[currentRow] = {
                    content: data.rowContent, // [1, 0, 1] etc
                    picked: index
                };
                return newHist;
            });

            if (data.status === "lost") {
                setGameState("game_over");
                toast.error("You hit a mine!");
                // If lost, we might want to show the full tower?
                // API returned allRows in data.allRows if lost
                if (data.allRows) {
                    // Fill the rest of the history to reveal everything
                    setHistory(prev => {
                        const newHist = [...prev];
                        data.allRows.forEach((row: number[], i: number) => {
                            if (i >= currentRow) {
                                newHist[i] = { content: row, picked: i === currentRow ? index : -1 };
                            }
                        });
                        return newHist;
                    });
                }
            } else if (data.status === "won") {
                setGameState("won");
                toast.success(`Tower Conquered! Won $${data.winAmount.toFixed(2)}`);
                updateBalance(data.winAmount);
                refreshTransactions();
            } else {
                // Continue
                setCurrentRow(prev => prev + 1);
            }

        } catch (e) {
            toast.error("Error revealing tile");
        }
    };

    const handleCashout = async () => {
        if (!gameId || gameState !== "playing") return;

        try {
            const res = await fetch("/api/game/dragontower/cashout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId })
            });
            const data = await res.json();

            if (data.status === "cashed_out") {
                toast.success(`Cashed out $${data.winAmount.toFixed(2)}`);
                updateBalance(data.winAmount);
                setGameState("game_over");
                refreshTransactions();
            }
        } catch (e) {
            toast.error("Error cashing out");
        }
    };

    // Render Setup
    const cols = config ? config.cols : getCols(difficulty);
    const rows = config ? config.rows : INITIAL_ROWS;

    // Multipliers
    // If not playing, use placeholders. 
    // If playing, use config.multipliers.
    // We display ladder from Bottom (Row 0) to Top.
    // Actually, visually standard is Top = High, Bottom = Low/Start.
    // So Row 0 should be at Bottom.

    return (
        <div className="h-full bg-[#0f1012] text-white p-2 md:p-4 flex flex-col items-center overflow-auto">
            <div className="w-full max-w-6xl flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-500" />
                    <h1 className="text-2xl font-bold">Dragon Tower</h1>
                </div>
                <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">Balance</span>
                    <span className="text-green-400 font-bold">${balance.toFixed(2)}</span>
                </div>
            </div>

            <div className="w-full max-w-6xl flex flex-col md:flex-row gap-4 md:gap-8 h-full">
                {/* Sidebar Controls */}
                <div className="w-full md:w-80 bg-zinc-900 p-6 rounded-xl border border-zinc-800 h-fit space-y-6 shrink-0">
                    <div>
                        <label className="text-sm text-zinc-400 font-medium mb-2 block">Bet Amount</label>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            disabled={gameState === "playing"}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white font-bold mb-2"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))} disabled={gameState === "playing"} className="bg-zinc-800 py-1 rounded text-xs text-zinc-400">1/2</button>
                            <button onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))} disabled={gameState === "playing"} className="bg-zinc-800 py-1 rounded text-xs text-zinc-400">2x</button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-zinc-400 font-medium mb-2 block">Difficulty</label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                            disabled={gameState === "playing"}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white font-bold capitalize"
                        >
                            {["easy", "medium", "hard", "expert", "master"].map(d => (
                                <option key={d} value={d} className="capitalize">{d}</option>
                            ))}
                        </select>
                    </div>

                    {gameState === "playing" ? (
                        <div className="space-y-3">
                            {currentRow > 0 && (
                                <div className="text-center p-3 bg-zinc-950 rounded border border-green-900/50">
                                    <div className="text-xs text-zinc-400">Current Win</div>
                                    <div className="text-xl font-bold text-green-400">
                                        ${(parseFloat(betAmount) * (config?.multipliers[currentRow - 1] || 1)).toFixed(2)}
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={handleCashout}
                                disabled={currentRow === 0}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                CASHOUT
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={loading}
                            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-[0_4px_0_rgb(147,51,234)] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50"
                        >
                            {loading ? "Starting..." : "START GAME"}
                        </button>
                    )}
                </div>

                {/* Tower Area */}
                <div className="flex-1 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col justify-center items-center py-8 relative overflow-hidden min-h-[600px]">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <Crown className="absolute top-10 left-10 w-96 h-96 text-purple-900 blur-3xl" />
                    </div>

                    {/* The Grid */}
                    <div className="relative z-10 flex flex-col-reverse gap-3">
                        {/* We map 0..8. Row 0 is at Bottom. */}
                        {Array.from({ length: rows }).map((_, rIndex) => {
                            const isCurrent = rIndex === currentRow && gameState === "playing";
                            const isPast = rIndex < currentRow;
                            const isFuture = rIndex > currentRow;
                            const rowData = history[rIndex];

                            // Multiplier Label
                            // If config exists, use it. Else, dummy.
                            // Note: visualRIndex 0 is bottom.

                            return (
                                <div key={rIndex} className="flex items-center gap-4">
                                    {/* Row Multiplier */}
                                    <div className={`w-16 text-right font-mono text-sm ${isCurrent ? "text-white font-bold" : "text-zinc-600"}`}>
                                        {config ? `${config.multipliers[rIndex]}x` : ""}
                                    </div>

                                    {/* Tiles */}
                                    <div className="flex gap-3">
                                        {Array.from({ length: cols }).map((_, cIndex) => {
                                            // Determine Status
                                            // If row is passed/revealed, show content.
                                            // content: 0=Mine, 1=Safe. 

                                            let content = null;
                                            let style = "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 cursor-pointer";

                                            if (rowData) {
                                                // Row is revealed
                                                const isMine = rowData.content[cIndex] === 0;
                                                const isSafe = rowData.content[cIndex] === 1;
                                                const wasPicked = rowData.picked === cIndex;

                                                if (isMine) {
                                                    content = <Skull className="w-6 h-6 text-red-500 animate-pulse" />;
                                                    style = "bg-red-950/50 border-red-900";
                                                } else if (isSafe) {
                                                    content = <Egg className="w-6 h-6 text-yellow-500" />;
                                                    style = wasPicked ? "bg-green-950/50 border-green-900 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-zinc-800/50 border-zinc-800 opacity-50";
                                                }
                                            } else {
                                                // Not revealed
                                                if (isCurrent) {
                                                    style = "bg-zinc-800 border-zinc-600 hover:bg-zinc-700 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.1)] border-purple-500/30";
                                                    content = <Shield className="w-5 h-5 text-zinc-600" />;
                                                } else if (isFuture) {
                                                    style = "bg-zinc-900 border-zinc-800 opacity-30 cursor-not-allowed";
                                                } else if (isPast) {
                                                    // Should be covered by rowData usually
                                                    style = "bg-zinc-900 border-zinc-800 opacity-50";
                                                }
                                            }

                                            return (
                                                <motion.button
                                                    key={cIndex}
                                                    whileHover={isCurrent ? { scale: 1.05, y: -2 } : {}}
                                                    whileTap={isCurrent ? { scale: 0.95 } : {}}
                                                    onClick={() => isCurrent && handleSelectTile(cIndex)}
                                                    disabled={!isCurrent}
                                                    className={`w-16 h-12 md:w-24 md:h-16 rounded-lg border-2 flex items-center justify-center transition-all ${style}`}
                                                >
                                                    {content}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
