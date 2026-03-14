"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, AlertCircle, Settings } from "lucide-react";

export default function ShuffleSettingsPage() {
    const [multiplier, setMultiplier] = useState<number>(2.90);
    const [minBet, setMinBet] = useState<number>(10);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/shuffle-settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            const data = await res.json();
            if (data.multiplier !== undefined) setMultiplier(data.multiplier);
            if (data.minBet !== undefined) setMinBet(data.minBet);
        } catch (error) {
            setMessage({ type: "error", text: "Failed to load shuffle settings" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/shuffle-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ multiplier, minBet }),
            });

            if (!res.ok) throw new Error("Failed to save settings");
            setMessage({ type: "success", text: "Settings saved successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save settings" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-blue-500" />
                    Shuffle Game Settings
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

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden p-6 max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-200 mb-6 border-b border-gray-800 pb-4">Game Configuration</h2>

                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-400">Win Multiplier</label>
                        <p className="text-xs text-gray-500 mb-2">The multiplier applied to the bet amount when a user guesses the correct cup (default: 2.90 for 1/3 odds + house edge).</p>
                        <div className="relative max-w-xs">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">x</span>
                            <input
                                type="number"
                                step="0.01"
                                min="1.0"
                                value={multiplier}
                                onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.0)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-800">
                        <label className="text-sm font-medium text-gray-400">Minimum Bet</label>
                        <p className="text-xs text-gray-500 mb-2">The minimum amount a user can bet on a round.</p>
                        <div className="relative max-w-xs">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                            <input
                                type="number"
                                step="1"
                                min="1"
                                value={minBet}
                                onChange={(e) => setMinBet(parseFloat(e.target.value) || 10)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
