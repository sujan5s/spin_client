"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, AlertCircle, Bomb, Calculator } from "lucide-react";

export default function MinesSettingsPage() {
    const [minesCount, setMinesCount] = useState<number>(3);
    const [multipliers, setMultipliers] = useState<number[]>([]);

    // Store all settings: { "3": [1.1, ...], "5": [...] }
    const [allSettings, setAllSettings] = useState<Record<string, number[]>>({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Combination logic for default calculation
    const combination = (n: number, r: number): number => {
        if (r < 0 || r > n) return 0;
        if (r === 0 || r === n) return 1;
        if (r > n / 2) r = n - r;
        let res = 1;
        for (let i = 1; i <= r; i++) res = res * (n - i + 1) / i;
        return res;
    };

    const calculateDefaults = (mines: number) => {
        const totalTiles = 25;
        const limit = 25 - mines; // Max safe clicks
        const newMultipliers: number[] = [];

        for (let i = 1; i <= limit; i++) {
            // revealedCount = i
            // The formula in backend is: 0.99 * (C(25, M) / C(25-R, M))
            const possibleWorlds = combination(totalTiles, mines);
            const remainingWorlds = combination(totalTiles - i, mines);
            let raw = 0.99 * (possibleWorlds / remainingWorlds);
            newMultipliers.push(parseFloat(raw.toFixed(2)));
        }
        return newMultipliers;
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        // When minesCount changes, check if we have custom settings, else calc default
        if (allSettings[minesCount.toString()]) {
            setMultipliers(allSettings[minesCount.toString()]);
        } else {
            setMultipliers(calculateDefaults(minesCount));
        }
    }, [minesCount, allSettings]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/mines-settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            const data = await res.json();
            if (data.settings) {
                setAllSettings(data.settings);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to load settings" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const updatedSettings = {
                ...allSettings,
                [minesCount.toString()]: multipliers
            };

            const res = await fetch("/api/admin/mines-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: updatedSettings }),
            });

            if (!res.ok) throw new Error("Failed to save settings");

            setAllSettings(updatedSettings);
            setMessage({ type: "success", text: "Settings saved successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save settings" });
        } finally {
            setSaving(false);
        }
    };

    const handleMultiplierChange = (index: number, val: string) => {
        const floatVal = parseFloat(val);
        const newArr = [...multipliers];
        newArr[index] = isNaN(floatVal) ? 0 : floatVal;
        setMultipliers(newArr);
    };

    const handleReset = () => {
        if (confirm("Reset to default probabilities?")) {
            setMultipliers(calculateDefaults(minesCount));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Bomb className="w-8 h-8 text-red-500" />
                    Mines Game Settings
                </h1>

                <div className="flex gap-2">
                    <select
                        value={minesCount}
                        onChange={(e) => setMinesCount(parseInt(e.target.value))}
                        className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2"
                    >
                        {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n} Mines</option>
                        ))}
                    </select>

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-all"
                        title="Calculate Defaults"
                    >
                        <Calculator className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === "success" ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
                    <AlertCircle className="w-5 h-5" />
                    {message.text}
                </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-zinc-200">
                        Multiplier Configuration for {minesCount} Mines
                    </h2>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950 text-zinc-200 uppercase font-medium sticky top-0">
                            <tr>
                                <th className="px-6 py-4">Hit # (Safe Clicks)</th>
                                <th className="px-6 py-4">Multiplier (x)</th>
                                <th className="px-6 py-4">Current Profit (on $10 bet)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-8">
                                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-red-500" />
                                    </td>
                                </tr>
                            ) : (
                                multipliers.map((mult, index) => (
                                    <tr key={index} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-3 font-mono">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-3">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={mult}
                                                onChange={(e) => handleMultiplierChange(index, e.target.value)}
                                                className="bg-zinc-800 border-zinc-700 rounded px-3 py-1.5 w-32 focus:outline-none focus:border-red-500 text-white font-bold"
                                            />
                                        </td>
                                        <td className="px-6 py-3 text-green-400 font-mono">
                                            ${((10 * mult) - 10).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
