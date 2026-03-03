"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, AlertCircle, Settings, SlidersHorizontal, ToggleRight, Users, MessageSquareText } from "lucide-react";

interface GamesEnabled {
    [key: string]: boolean;
}

export default function SystemSettingsPage() {
    const [bonusDeductionPct, setBonusDeductionPct] = useState<number>(20);
    const [referralBonusNewUser, setReferralBonusNewUser] = useState<number>(50);
    const [referralBonusReferrer, setReferralBonusReferrer] = useState<number>(100);
    const [marqueeText, setMarqueeText] = useState<string>("");
    const [marqueeSpeed, setMarqueeSpeed] = useState<number>(25);
    const [gamesEnabled, setGamesEnabled] = useState<GamesEnabled>({
        spin: true,
        roulette: true,
        slots: true,
        mines: true,
        plinko: true,
        dragontower: true,
        shuffle: true,
        luckydraw: true
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/system-settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            const data = await res.json();
            setBonusDeductionPct(data.bonusDeductionPct);
            if (data.referralBonusNewUser !== undefined) setReferralBonusNewUser(data.referralBonusNewUser);
            if (data.referralBonusReferrer !== undefined) setReferralBonusReferrer(data.referralBonusReferrer);
            if (data.marqueeText !== undefined) setMarqueeText(data.marqueeText);
            if (data.marqueeSpeed !== undefined) setMarqueeSpeed(data.marqueeSpeed);
            if (data.marqueeSpeed !== undefined) setMarqueeSpeed(data.marqueeSpeed);
            if (data.gamesEnabled) {
                setGamesEnabled(data.gamesEnabled);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to load system settings" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/system-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bonusDeductionPct, referralBonusNewUser, referralBonusReferrer, gamesEnabled, marqueeText, marqueeSpeed }),
            });

            if (!res.ok) throw new Error("Failed to save settings");
            setMessage({ type: "success", text: "Settings saved successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save settings" });
        } finally {
            setSaving(false);
        }
    };

    const toggleGame = (gameKey: string) => {
        setGamesEnabled(prev => ({
            ...prev,
            [gameKey]: !prev[gameKey]
        }));
    };

    const formatGameName = (key: string) => {
        const names: Record<string, string> = {
            spin: "Daily Spin",
            roulette: "Royal Roulette",
            slots: "Vegas Slots",
            mines: "Mines",
            plinko: "Plinko",
            dragontower: "Dragon Tower",
            shuffle: "Shuffle",
            luckydraw: "Lucky Draw"
        };
        return names[key] || key;
    };

    if (loading) {
        return <div className="text-white flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" /> Loading Settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <SlidersHorizontal className="w-8 h-8 text-blue-500" />
                    System Controls
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === "success" ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
                    <AlertCircle className="w-5 h-5" />
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Balance Split Ratio */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden p-6">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-400" />
                        Balance Deduction Split
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Configure the percentage of the bet that is deducted from the Bonus Balance during gameplay (when available). The remainder is deducted from the Main Balance.
                    </p>

                    <div className="flex flex-col gap-4">
                        <label className="text-sm font-medium text-gray-300">
                            Bonus Balance Deduction (%)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={bonusDeductionPct}
                                onChange={(e) => setBonusDeductionPct(Number(e.target.value))}
                                className="w-full accent-blue-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="bg-gray-950 px-4 py-2 rounded-lg border border-gray-800 flex items-center justify-center min-w-[80px]">
                                <span className="text-white font-bold">{bonusDeductionPct}%</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
                            <span>0% (Main Only)</span>
                            <span>50%</span>
                            <span>100% (Bonus Only)</span>
                        </div>

                        <div className="mt-4 p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg">
                            <p className="text-sm text-blue-300">
                                <strong>Current Rule:</strong> When a user plays a game, <strong className="text-white">{bonusDeductionPct}%</strong> is drawn from their Bonus Balance (if sufficient) and <strong className="text-white">{100 - bonusDeductionPct}%</strong> is drawn from their Main Balance.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Referral System Settings */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden p-6">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        Referral System Limits
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Configure the bonus amounts awarded when a new user signs up using a referral code. Both the new user and the referrer receive these rewards instantly.
                    </p>

                    <div className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">
                                New User Bonus (Signee)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={referralBonusNewUser}
                                    onChange={(e) => setReferralBonusNewUser(Number(e.target.value))}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 pl-8 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Amount credited to the new user upon signup.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">
                                Referrer Bonus (Owner)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={referralBonusReferrer}
                                    onChange={(e) => setReferralBonusReferrer(Number(e.target.value))}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 pl-8 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Amount credited to the user whose code was used.</p>
                        </div>
                    </div>
                </div>

                {/* Game Toggles */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden p-6">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                        <ToggleRight className="w-5 h-5 text-gray-400" />
                        Game Visibility Control
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Turn specific games ON or OFF. If a game is OFF, it will be completely hidden from the user dashboard and unavailable to play.
                    </p>

                    <div className="space-y-3">
                        {Object.entries(gamesEnabled).map(([key, isEnabled]) => (
                            <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800">
                                <span className="font-medium text-gray-300">{formatGameName(key)}</span>
                                <button
                                    onClick={() => toggleGame(key)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${isEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Marquee Settings */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden p-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                    <MessageSquareText className="w-5 h-5 text-gray-400" />
                    Info Banner (Marquee)
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                    Set the scrolling text that appears at the top of the client application. Leave empty to hide the banner.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                            Scroll Speed ({marqueeSpeed}s)
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="60"
                            value={marqueeSpeed}
                            onChange={(e) => setMarqueeSpeed(Number(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
                            <span>Fast (5s)</span>
                            <span>Slow (60s)</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                            Banner Text
                        </label>
                        <textarea
                            value={marqueeText}
                            onChange={(e) => setMarqueeText(e.target.value)}
                            placeholder="e.g. Welcome! Enjoy a 50% bonus on your first deposit..."
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[100px] resize-y"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
