"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, AlertCircle, Settings } from "lucide-react";

interface SpinSegment {
    id?: number;
    label: string;
    value: number;
    color: string;
    textColor: string;
    probability: number;
    isVisible: boolean;
}

export default function SpinSettingsPage() {
    const [segments, setSegments] = useState<SpinSegment[]>([]);
    const [maxSpins, setMaxSpins] = useState<number>(3);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchSegments();
    }, []);

    const fetchSegments = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/spin-settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            const data = await res.json();
            setSegments(data.segments);
            if (data.maxSpinsPerDay !== undefined) setMaxSpins(data.maxSpinsPerDay);
        } catch (error) {
            setMessage({ type: "error", text: "Failed to load spin settings" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/spin-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ segments, maxSpinsPerDay: maxSpins }),
            });

            if (!res.ok) throw new Error("Failed to save settings");
            setMessage({ type: "success", text: "Settings saved successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save settings" });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (index: number, field: keyof SpinSegment, value: any) => {
        const newSegments = [...segments];
        newSegments[index] = { ...newSegments[index], [field]: value };
        setSegments(newSegments);
    };

    const totalWeight = segments.reduce((sum, s) => sum + (s.probability || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-blue-500" />
                    Spin Game Settings
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

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-200">Segment Configuration</h2>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-gray-950 px-4 py-2 rounded-lg border border-gray-800">
                            <span className="text-sm text-gray-400">Max Spins / Day:</span>
                            <input
                                type="number"
                                min="1"
                                value={maxSpins}
                                onChange={(e) => setMaxSpins(Math.max(1, parseInt(e.target.value) || 0))}
                                className="bg-transparent text-white font-bold w-12 text-center focus:outline-none border-b border-gray-700 focus:border-blue-500"
                            />
                        </div>

                        <div className="text-sm text-gray-400">
                            Total Probability Weight: <span className="text-white font-mono font-bold">{totalWeight}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-950 text-gray-200 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Label</th>
                                <th className="px-6 py-4">Multiplier Value</th>
                                <th className="px-6 py-4">Color</th>
                                <th className="px-6 py-4">Text Color</th>
                                <th className="px-6 py-4">Probability Weight</th>
                                <th className="px-6 py-4">% Chance (Approx)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {segments.map((segment, index) => (
                                <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-3">
                                        <input
                                            type="text"
                                            value={segment.label}
                                            onChange={(e) => handleChange(index, "label", e.target.value)}
                                            className="bg-gray-800 border-gray-700 rounded px-3 py-1.5 w-full focus:outline-none focus:border-blue-500 text-white"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={segment.value}
                                            onChange={(e) => handleChange(index, "value", parseFloat(e.target.value))}
                                            className="bg-gray-800 border-gray-700 rounded px-3 py-1.5 w-24 focus:outline-none focus:border-blue-500 text-white"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={segment.color}
                                                onChange={(e) => handleChange(index, "color", e.target.value)}
                                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                            />
                                            <span className="font-mono text-xs">{segment.color}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={segment.textColor}
                                                onChange={(e) => handleChange(index, "textColor", e.target.value)}
                                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                            />
                                            <span className="font-mono text-xs">{segment.textColor}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            type="number"
                                            value={segment.probability}
                                            onChange={(e) => handleChange(index, "probability", parseInt(e.target.value) || 0)}
                                            className="bg-gray-800 border-gray-700 rounded px-3 py-1.5 w-24 focus:outline-none focus:border-blue-500 text-white font-bold"
                                        />
                                    </td>
                                    <td className="px-6 py-3 font-mono text-gray-300">
                                        {totalWeight > 0 ? ((segment.probability / totalWeight) * 100).toFixed(1) : 0}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
