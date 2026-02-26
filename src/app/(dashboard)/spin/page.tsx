"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { AlertCircle, Trophy, History, Coins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinSegment {
    id: number;
    label: string;
    value: number;
    color: string;
    textColor: string;
    probability: number;
    isVisible: boolean;
}

export default function SpinPage() {
    const { balance, updateBalance, refreshTransactions } = useWallet();
    const [betAmount, setBetAmount] = useState<string>("");
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<{ multiplier: number; winAmount: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<{ multiplier: number; win: boolean }[]>([]);
    const [segments, setSegments] = useState<SpinSegment[]>([]);

    // Spin Limit State
    const [spinsUsed, setSpinsUsed] = useState(0);
    const [maxSpins, setMaxSpins] = useState(3);
    const [timeUntilReset, setTimeUntilReset] = useState(0);
    const [formattedTime, setFormattedTime] = useState("");

    const [loading, setLoading] = useState(true);
    const wheelRef = useRef<HTMLDivElement>(null);

    // Lights animation state
    const [activeLight, setActiveLight] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveLight((prev) => (prev + 1) % 20); // 20 lights
        }, 100);

        // Fetch segments
        fetch("/api/admin/spin-settings")
            .then(res => res.json())
            .then(data => {
                if (data.segments && Array.isArray(data.segments)) {
                    setSegments(data.segments);
                    if (data.maxSpinsPerDay !== undefined) {
                        setMaxSpins(data.maxSpinsPerDay);
                    }
                } else if (Array.isArray(data)) {
                    setSegments(data);
                } else {
                    console.error("Failed to load segments", data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));

        return () => clearInterval(interval);
    }, []);

    // Fetch Spin Status
    const fetchSpinStatus = async () => {
        try {
            const res = await fetch("/api/game/spin/status");
            const data = await res.json();
            if (!data.error) {
                setSpinsUsed(data.spinsUsed);
                setMaxSpins(data.maxSpins);
                setTimeUntilReset(data.timeUntilReset);
            }
        } catch (e) {
            console.error("Failed to fetch spin status", e);
        }
    };

    useEffect(() => {
        fetchSpinStatus();
    }, [balance]); // Refetch on balance change (often means a spin happened) or just on mount/result

    // Timer Logic
    useEffect(() => {
        if (timeUntilReset > 0) {
            const timer = setInterval(() => {
                setTimeUntilReset(prev => {
                    if (prev <= 1000) {
                        fetchSpinStatus(); // Refresh when timer hits 0
                        return 0;
                    }
                    return prev - 1000;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeUntilReset]);

    useEffect(() => {
        if (timeUntilReset > 0) {
            const hours = Math.floor((timeUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000);
            setFormattedTime(`${hours}h ${minutes}m ${seconds}s`);
        } else {
            setFormattedTime("");
        }
    }, [timeUntilReset]);

    const spinsLeft = Math.max(0, maxSpins - spinsUsed);

    const handleSpin = async () => {
        const bet = parseFloat(betAmount);
        if (!bet || bet < 10 || bet > balance) return;

        setIsSpinning(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetch("/api/game/spin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ betAmount: bet }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to spin");
            }

            const { segmentIndex, multiplier, winAmount } = data;

            // Calculate rotation
            // 0 degrees is top.
            // Segment `i` is at `i * (360 / segments.length)` degrees.
            const segmentAngle = 360 / segments.length;
            const targetRotation = 360 - (segmentIndex * segmentAngle);
            const currentRotationMod = rotation % 360;
            let distance = targetRotation - currentRotationMod;
            if (distance < 0) distance += 360;

            // Add at least 5 full spins (1800 degrees) + the distance to target
            const newRotation = rotation + 1800 + distance;

            setRotation(newRotation);

            setTimeout(async () => {
                setIsSpinning(false);
                setResult({ multiplier, winAmount });

                // Update history
                setHistory(prev => [{ multiplier, win: winAmount > 0 }, ...prev].slice(0, 5));

                const netChange = winAmount - bet;
                updateBalance(netChange);
                refreshTransactions(); // Update transaction history

                // Trigger Global Notification
                try {
                    await fetch("/api/notifications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: winAmount > 0 ? "Mega Spin Win!" : "Mega Spin Result",
                            message: winAmount > 0
                                ? `You won $${winAmount.toFixed(2)} with a ${multiplier}x multiplier!`
                                : `You lost $${bet.toFixed(2)}. Better luck next time!`,
                            type: winAmount > 0 ? "success" : "info"
                        })
                    });
                } catch (e) {
                    console.error("Failed to send notification", e);
                }

                // Update Spin Status locally
                setSpinsUsed(prev => prev + 1);

            }, 5000);

        } catch (err: any) {
            setIsSpinning(false);
            setError(err.message);
            console.error("Spin error:", err);
        }
    };

    const setMaxBet = () => {
        setBetAmount(balance.toString());
    };

    const setHalfBet = () => {
        setBetAmount((balance / 2).toFixed(2));
    };

    if (loading) {
        return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-yellow-500" /></div>;
    }

    if (segments.length === 0) {
        return <div className="min-h-[80vh] flex items-center justify-center text-red-500">Failed to load game configuration.</div>;
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2 uppercase tracking-wider">
                    Mega Spin
                </h1>
                <p className="text-yellow-200/80 font-medium tracking-widest uppercase text-sm">Win Big or Go Home</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-16 items-center justify-center w-full max-w-6xl">
                {/* Wheel Section */}
                <div className="relative group">
                    {/* Outer Glow */}
                    <div className="absolute inset-0 bg-yellow-500/20 blur-[100px] rounded-full pointer-events-none" />

                    {/* Wheel Border with Lights */}
                    <div className="relative w-[340px] h-[340px] md:w-[450px] md:h-[450px] rounded-full bg-gradient-to-b from-red-900 to-red-950 p-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-yellow-600/50">
                        {/* Lights */}
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "absolute w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] transition-all duration-300",
                                    (i + activeLight) % 2 === 0 ? "bg-yellow-300 shadow-yellow-300" : "bg-red-900/50"
                                )}
                                style={{
                                    top: "50%",
                                    left: "50%",
                                    transform: `rotate(${i * 18}deg) translate(165px) md:translate(215px)`, // Adjust radius based on container size
                                }}
                            />
                        ))}

                        {/* The Wheel */}
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-yellow-500/30 relative bg-[#1a1a1a]">
                            <div
                                ref={wheelRef}
                                className="w-full h-full transition-transform cubic-bezier(0.1, 0.7, 0.1, 1)"
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    transitionDuration: isSpinning ? "5s" : "0s",
                                }}
                            >
                                {segments.map((seg, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-full h-full top-0 left-0 origin-center"
                                        style={{
                                            transform: `rotate(${i * (360 / segments.length)}deg)`,
                                        }}
                                    >
                                        <div
                                            className="absolute w-full h-full top-0 left-0 flex justify-center pt-6"
                                            style={{
                                                background: `conic-gradient(from -${360 / segments.length / 2}deg at 50% 50%, ${seg.color} 0deg, ${seg.color} ${360 / segments.length}deg, transparent ${360 / segments.length}deg)`,
                                                clipPath: `polygon(50% 50%, 0 0, 100% 0)`, // Simplified clip path, might need adjustment for dynamic count
                                            }}
                                        >
                                            <span
                                                className="text-lg md:text-2xl font-black drop-shadow-md"
                                                style={{ color: seg.textColor }}
                                            >
                                                {seg.label}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center Cap */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10 flex items-center justify-center border-4 border-yellow-200">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-black/20 rounded-full flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-yellow-100" />
                            </div>
                        </div>

                        {/* Pointer */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-12 h-14 filter drop-shadow-lg">
                            <svg viewBox="0 0 24 24" fill="url(#gold-gradient)" className="w-full h-full">
                                <defs>
                                    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#fcd34d" />
                                        <stop offset="50%" stopColor="#d97706" />
                                        <stop offset="100%" stopColor="#fcd34d" />
                                    </linearGradient>
                                </defs>
                                <path d="M12 22L5 5h14l-7 17z" stroke="#78350f" strokeWidth="1" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="w-full max-w-md space-y-6">
                    {/* Balance Card */}
                    <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-6 rounded-2xl shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Coins className="w-5 h-5 text-yellow-500" />
                                <span className="font-medium">Balance</span>
                            </div>
                            <span className="text-2xl font-bold text-white font-mono">
                                {balance.toFixed(2)}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {/* Daily Limit Info */}
                            <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-zinc-700">
                                {spinsLeft > 0 ? (
                                    <>
                                        <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-bold">Daily Spins Left</p>
                                        <p className="text-2xl font-black text-white">{spinsLeft} <span className="text-gray-500 text-lg">/ {maxSpins}</span></p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-red-400 text-sm mb-1 uppercase tracking-wider font-bold">Daily Limit Reached</p>
                                        <p className="text-xs text-gray-400 mb-2">Next refresh in:</p>
                                        <p className="text-xl font-mono text-white font-bold">{formattedTime}</p>
                                    </>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl py-4 pl-4 pr-24 text-white text-lg font-medium focus:outline-none focus:border-yellow-500/50 transition-colors"
                                    placeholder="Bet Amount"
                                    disabled={isSpinning}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button
                                        onClick={setHalfBet}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 rounded-lg transition-colors uppercase"
                                        disabled={isSpinning}
                                    >
                                        1/2
                                    </button>
                                    <button
                                        onClick={setMaxBet}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-yellow-500 rounded-lg transition-colors uppercase"
                                        disabled={isSpinning}
                                    >
                                        Max
                                    </button>
                                </div>
                            </div>

                            {parseFloat(betAmount) > balance && (
                                <p className="text-red-500 text-xs flex items-center gap-1 animate-pulse">
                                    <AlertCircle className="h-3 w-3" /> Insufficient funds
                                </p>
                            )}

                            {parseFloat(betAmount) < 10 && betAmount !== "" && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Minimum bet is 10
                                </p>
                            )}

                            {error && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> {error}
                                </p>
                            )}

                            <button
                                onClick={handleSpin}
                                disabled={isSpinning || !betAmount || parseFloat(betAmount) < 10 || parseFloat(betAmount) > balance || spinsLeft <= 0}
                                className="w-full py-4 bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xl rounded-xl shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-[4px] transition-all uppercase tracking-wider"
                            >
                                {isSpinning ? "Spinning..." : "SPIN NOW"}
                            </button>
                        </div>
                    </div>

                    {/* Result Display */}
                    {result && (
                        <div className={cn(
                            "p-6 rounded-2xl text-center animate-in zoom-in duration-300 shadow-2xl border-2",
                            result.multiplier > 0
                                ? "bg-gradient-to-br from-green-900/90 to-green-950/90 border-green-500/50"
                                : "bg-gradient-to-br from-red-900/90 to-red-950/90 border-red-500/50"
                        )}>
                            {result.multiplier > 0 ? (
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-green-400 flex items-center justify-center gap-2 uppercase italic">
                                        <Trophy className="h-8 w-8" /> Big Win!
                                    </h3>
                                    <div className="text-5xl font-black text-white drop-shadow-lg">
                                        ${result.winAmount.toFixed(2)}
                                    </div>
                                    <p className="text-green-200/60 font-medium uppercase tracking-widest text-sm">
                                        {result.multiplier}x Multiplier
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-red-400 uppercase">No Luck</h3>
                                    <p className="text-red-200/60">Try again to win big!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recent History */}
                    {history.length > 0 && (
                        <div className="flex justify-center gap-2 mt-4">
                            {history.map((h, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2",
                                        h.win
                                            ? "bg-green-900/50 border-green-500 text-green-400"
                                            : "bg-red-900/50 border-red-500 text-red-400"
                                    )}
                                >
                                    {h.multiplier}x
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
