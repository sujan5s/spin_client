"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const DIFFICULTIES = ["easy", "medium", "hard", "expert", "master"];

export default function DragonTowerSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // State
    const [minBets, setMinBets] = useState<Record<string, number>>({
        easy: 10, medium: 10, hard: 10, expert: 10, master: 10
    });
    const [multipliers, setMultipliers] = useState<Record<string, number[]>>({
        easy: [], medium: [], hard: [], expert: [], master: []
    });

    const [activeTab, setActiveTab] = useState("easy");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/dragontower-settings");
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();

            if (data.minBets) setMinBets(data.minBets);
            if (data.multipliers) setMultipliers(data.multipliers);
        } catch (e) {
            toast.error("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/dragontower-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    minBets,
                    multipliers
                })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Settings saved!");
        } catch (e) {
            toast.error("Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    const updateMultiplier = (diff: string, index: number, val: string) => {
        const num = parseFloat(val);
        setMultipliers(prev => {
            const newArr = [...prev[diff]];
            newArr[index] = num;
            return { ...prev, [diff]: newArr };
        });
    };

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Crown className="w-8 h-8 text-yellow-500" />
                        Dragon Tower Settings
                    </h1>
                    <p className="text-muted-foreground mt-1">Configure minimum bet and stage multipliers per difficulty.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-2 overflow-x-auto">
                    {DIFFICULTIES.map(d => (
                        <button
                            key={d}
                            onClick={() => setActiveTab(d)}
                            className={cn(
                                "px-4 py-2 rounded-t-lg font-medium capitalize transition-colors",
                                activeTab === d ? "bg-zinc-800 text-white border-b-2 border-purple-500" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {d}
                        </button>
                    ))}
                </div>

                {/* Configuration for Active Tab */}
                <div className="space-y-8">
                    {/* Min Bet */}
                    <div className="max-w-xs">
                        <label className="text-sm text-zinc-400 block mb-2 font-bold uppercase tracking-wider">Minimum Bet for {activeTab}</label>
                        <input
                            type="number"
                            value={minBets[activeTab] || ""}
                            onChange={(e) => {
                                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                setMinBets(prev => ({ ...prev, [activeTab]: val }));
                            }}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white font-bold"
                        />
                    </div>

                    {/* Multipliers Grid */}
                    <div>
                        <h3 className="text-sm text-zinc-400 block mb-4 font-bold uppercase tracking-wider">Multipliers Ladder</h3>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_200px] gap-4 items-center mb-2 px-2 text-zinc-500 text-xs uppercase">
                                <div>Stage</div>
                                <div>Multiplier (x)</div>
                            </div>
                            {/* Rows 0 to 8 */}
                            {multipliers[activeTab]?.map((val, index) => (
                                <div key={index} className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_200px] gap-4 items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                                    <div className="text-zinc-400 font-mono text-sm">Row {index + 1}</div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={val}
                                        onChange={(e) => updateMultiplier(activeTab, index, e.target.value)}
                                        className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white font-bold"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
