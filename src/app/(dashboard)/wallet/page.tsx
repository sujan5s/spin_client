"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { CreditCard, Wallet, CheckCircle } from "lucide-react";
import { TokenIcon } from "@/components/TokenIcon";
import { cn } from "@/lib/utils";

const AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function WalletPage() {
    const { balance, addFunds, transactions } = useWallet();
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleAddFunds = async () => {
        const amount = selectedAmount || parseFloat(customAmount);
        if (!amount || amount <= 0) return;

        setIsProcessing(true);
        try {
            await addFunds(amount);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setSelectedAmount(null);
            setCustomAmount("");
        } catch (error) {
            alert("Failed to add funds");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
                <p className="text-muted-foreground">Manage your funds and deposits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Balance Card */}
                <div className="p-8 bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 rounded-2xl flex flex-col justify-between h-64 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="h-32 w-32" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-muted-foreground">Current Balance</h3>
                        <div className="text-5xl font-bold text-foreground mt-2 flex items-center gap-2"><TokenIcon size={40} />{balance.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle className="h-4 w-4" /> Verified Account
                    </div>
                </div>

                {/* Add Funds */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" /> Add Funds
                    </h3>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {AMOUNTS.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => {
                                    setSelectedAmount(amount);
                                    setCustomAmount("");
                                }}
                                className={cn(
                                    "py-3 px-4 rounded-lg border font-medium transition-all",
                                    selectedAmount === amount
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-secondary/50 border-border hover:border-primary/50 text-foreground"
                                )}
                            >
                                <TokenIcon size={14} className="mr-1" />{amount}
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Custom Amount
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <TokenIcon size={16} />
                            </span>
                            <input
                                type="number"
                                value={customAmount}
                                onChange={(e) => {
                                    setCustomAmount(e.target.value);
                                    setSelectedAmount(null);
                                }}
                                className="w-full pl-8 pr-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAddFunds}
                        disabled={isProcessing || (!selectedAmount && !customAmount)}
                        className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-lg transition-all flex items-center justify-center"
                    >
                        {isProcessing ? (
                            <span className="animate-pulse">Processing...</span>
                        ) : success ? (
                            <span className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" /> Added Successfully
                            </span>
                        ) : (
                            "Add Funds Now"
                        )}
                    </button>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6">Transaction History</h3>
                <div className="space-y-4">
                    {transactions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
                    ) : (
                        transactions.slice(0, 20).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                                <div>
                                    <p className="font-medium capitalize">{tx.type.replace("_", " ")}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={cn(
                                    "font-bold flex items-center gap-0.5",
                                    tx.amount > 0 ? "text-green-500" : "text-red-500"
                                )}>
                                    {tx.amount > 0 ? "+" : "-"}<TokenIcon size={14} />{Math.abs(tx.amount).toFixed(2)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
