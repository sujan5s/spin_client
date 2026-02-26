"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw } from "lucide-react";

const SYMBOLS = ['clover', 'cherry', 'bell', 'diamond', '7'];

// Default configuration to reset to or initial load backup
const DEFAULT_WEIGHTS = {
    'clover': 50,
    'cherry': 40,
    'bell': 30,
    'diamond': 15,
    '7': 5
};

const DEFAULT_PAYTABLE = {
    'clover': { 3: 2, 4: 5, 5: 10 },
    'cherry': { 3: 3, 4: 8, 5: 15 },
    'bell': { 3: 5, 4: 15, 5: 30 },
    'diamond': { 3: 10, 4: 30, 5: 60 },
    '7': { 3: 50, 4: 200, 5: 1000 }
};

export default function SlotsSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [weights, setWeights] = useState<any>(DEFAULT_WEIGHTS);
    const [paytable, setPaytable] = useState<any>(DEFAULT_PAYTABLE);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/slots-settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            const data = await res.json();

            if (data.weights) setWeights(data.weights);
            if (data.paytable) setPaytable(data.paytable);
        } catch (error) {
            toast.error("Failed to load settings");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/slots-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weights, paytable })
            });

            if (!res.ok) throw new Error("Failed to save settings");
            toast.success("Settings saved successfully");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm("Are you sure you want to reset to default values?")) {
            setWeights(DEFAULT_WEIGHTS);
            setPaytable(DEFAULT_PAYTABLE);
            toast.info("Reset to defaults. Click Save to apply.");
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const totalWeight = Object.values(weights).reduce((a: any, b: any) => parseInt(a) + parseInt(b), 0) as number;

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Slots Settings</h1>
                    <p className="text-muted-foreground mt-1">Configure probabilities and payouts for the Slot Machine.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors text-zinc-400"
                    >
                        <RotateCcw className="w-4 h-4" /> Reset Defaults
                    </button>
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

            <div className="grid md:grid-cols-2 gap-8">
                {/* PROBABILITIES */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex justify-between">
                        <span>Symbol Weights</span>
                        <span className="text-sm font-normal text-zinc-400">Total: {totalWeight}</span>
                    </h2>
                    <div className="space-y-4">
                        {SYMBOLS.map((sym) => {
                            const weight = weights[sym];
                            const prob = ((weight / totalWeight) * 100).toFixed(2);
                            return (
                                <div key={sym} className="flex items-center gap-4">
                                    <div className="w-24 capitalize font-medium text-zinc-300">{sym}</div>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            value={weight}
                                            onChange={(e) => setWeights({ ...weights, [sym]: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="w-20 text-right text-xs text-zinc-500">{prob}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* PAYTABLE */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Paytable (Multipliers)</h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2">
                            <div>Symbol</div>
                            <div>3 Matches</div>
                            <div>4 Matches</div>
                            <div>5 Matches</div>
                        </div>
                        {SYMBOLS.map((sym) => (
                            <div key={sym} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 items-center">
                                <div className="capitalize font-medium text-zinc-300">{sym}</div>
                                <input
                                    type="number"
                                    value={paytable[sym][3]}
                                    onChange={(e) => setPaytable({ ...paytable, [sym]: { ...paytable[sym], 3: parseFloat(e.target.value) } })}
                                    className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm w-full"
                                />
                                <input
                                    type="number"
                                    value={paytable[sym][4]}
                                    onChange={(e) => setPaytable({ ...paytable, [sym]: { ...paytable[sym], 4: parseFloat(e.target.value) } })}
                                    className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm w-full"
                                />
                                <input
                                    type="number"
                                    value={paytable[sym][5]}
                                    onChange={(e) => setPaytable({ ...paytable, [sym]: { ...paytable[sym], 5: parseFloat(e.target.value) } })}
                                    className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm w-full"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
