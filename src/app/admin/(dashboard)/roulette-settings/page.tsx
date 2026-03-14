"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, AlertCircle, Settings } from "lucide-react";

const DEFAULT_PAYOUTS = {
    straight: 36,
    red: 2,
    black: 2,
    even: 2,
    odd: 2,
    low: 2,
    high: 2,
    dozen: 3,
    column: 3
};

type PayoutsConfig = typeof DEFAULT_PAYOUTS;

export default function RouletteSettingsPage() {
    const [payouts, setPayouts] = useState<PayoutsConfig>(DEFAULT_PAYOUTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/roulette-settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            const data = await res.json();
            if (data.payouts) {
                setPayouts(data.payouts);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to load roulette settings" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/roulette-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payouts }),
            });

            if (!res.ok) throw new Error("Failed to save settings");
            setMessage({ type: "success", text: "Settings saved successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save settings" });
        } finally {
            setSaving(false);
        }
    };

    const handlePayoutChange = (key: keyof PayoutsConfig, value: number) => {
        setPayouts(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const BET_TYPES = [
        { key: "straight", label: "Straight Up (1 Number)", desc: "Bet on a single number" },
        { key: "red", label: "Red", desc: "Bet on any red number" },
        { key: "black", label: "Black", desc: "Bet on any black number" },
        { key: "even", label: "Even", desc: "Bet on any even number" },
        { key: "odd", label: "Odd", desc: "Bet on any odd number" },
        { key: "low", label: "Low (1-18)", desc: "Bet on numbers 1 through 18" },
        { key: "high", label: "High (19-36)", desc: "Bet on numbers 19 through 36" },
        { key: "dozen", label: "Dozen (1st, 2nd, 3rd)", desc: "Bet on a set of 12 numbers" },
        { key: "column", label: "Column (1st, 2nd, 3rd)", desc: "Bet on a full column of numbers" }
    ] as const;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-blue-500" />
                    Roulette Game Settings
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

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden p-6 max-w-4xl">
                <h2 className="text-xl font-semibold text-gray-200 mb-6 border-b border-gray-800 pb-4">Payout Multipliers Configuration</h2>
                <p className="text-gray-400 text-sm mb-6">Configure the win multipliers for different types of bets in Roulette. These values represent how much a winning bet pays out (including the original bet amount). For example, a setting of 2 means a ₹100 bet returns ₹200 (₹100 profit).</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {BET_TYPES.map(({ key, label, desc }) => (
                        <div key={key} className="flex flex-col gap-2 p-4 rounded-lg bg-gray-800/50 border border-gray-800">
                            <div>
                                <label className="text-sm font-medium text-gray-300">{label}</label>
                                <p className="text-xs text-gray-500 mt-1 mb-3">{desc}</p>
                            </div>
                            <div className="relative mt-auto">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">x</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1.0"
                                    value={payouts[key]}
                                    onChange={(e) => handlePayoutChange(key, parseFloat(e.target.value) || 1.0)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-8 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
