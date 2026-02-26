"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, AlertCircle, Settings, ChevronDown } from "lucide-react";

interface PlinkoBucket {
    index: number;
    multiplier: number;
    probability: number;
}

export default function PlinkoSettingsPage() {
    const [rows, setRows] = useState<number>(16);
    const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
    const [buckets, setBuckets] = useState<PlinkoBucket[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, [rows, risk]);

    const fetchSettings = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/admin/plinko-settings?rows=${rows}&risk=${risk}`);
            if (!res.ok) throw new Error("Failed to fetch settings");
            const data = await res.json();

            if (data.settings) {
                setBuckets(data.settings);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to load plinko settings" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/plinko-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows, risk, settings: buckets }),
            });

            if (!res.ok) throw new Error("Failed to save settings");
            setMessage({ type: "success", text: "Settings saved successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save settings" });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (index: number, field: keyof PlinkoBucket, value: number) => {
        const newBuckets = [...buckets];
        newBuckets[index] = { ...newBuckets[index], [field]: value };
        setBuckets(newBuckets);
    };

    const totalWeight = buckets.reduce((sum, b) => sum + (b.probability || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-purple-500" />
                    Plinko Game Settings
                </h1>

                <div className="flex gap-2">
                    <select
                        value={rows}
                        onChange={(e) => setRows(parseInt(e.target.value))}
                        className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2"
                    >
                        <option value={8}>8 Rows</option>
                        <option value={12}>12 Rows</option>
                        <option value={16}>16 Rows</option>
                    </select>

                    <select
                        value={risk}
                        onChange={(e) => setRisk(e.target.value as any)}
                        className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 uppercase"
                    >
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                    </select>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50"
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
                        Configuration for {rows} Rows - {risk.toUpperCase()} Risk
                    </h2>
                    <div className="text-sm text-zinc-400">
                        Total Probability Weight: <span className="text-white font-mono font-bold">{totalWeight}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950 text-zinc-200 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Bucket Index</th>
                                <th className="px-6 py-4">Multiplier (x)</th>
                                <th className="px-6 py-4">Probability Weight</th>
                                <th className="px-6 py-4">% Chance (Approx)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8">
                                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                                    </td>
                                </tr>
                            ) : (
                                buckets.map((bucket, index) => (
                                    <tr key={index} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-3 font-mono">
                                            {index}
                                        </td>
                                        <td className="px-6 py-3">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={bucket.multiplier}
                                                onChange={(e) => handleChange(index, "multiplier", parseFloat(e.target.value))}
                                                className="bg-zinc-800 border-zinc-700 rounded px-3 py-1.5 w-24 focus:outline-none focus:border-purple-500 text-white"
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <input
                                                type="number"
                                                value={bucket.probability}
                                                onChange={(e) => handleChange(index, "probability", parseInt(e.target.value) || 0)}
                                                className="bg-zinc-800 border-zinc-700 rounded px-3 py-1.5 w-24 focus:outline-none focus:border-purple-500 text-white font-bold"
                                            />
                                        </td>
                                        <td className="px-6 py-3 font-mono text-zinc-300">
                                            {totalWeight > 0 ? ((bucket.probability / totalWeight) * 100).toFixed(2) : 0}%
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
