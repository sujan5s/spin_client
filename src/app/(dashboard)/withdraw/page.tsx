"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { CreditCard, Wallet, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { TokenIcon } from "@/components/TokenIcon";
import { cn } from "@/lib/utils";

const AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function WithdrawPage() {
    const { balance, withdrawFunds, transactions } = useWallet();
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleWithdraw = async () => {
        const amount = selectedAmount || parseFloat(customAmount);
        if (!amount || amount <= 0) return;

        if (amount > balance) {
            setError("Insufficient balance");
            return;
        }

        setIsProcessing(true);
        setError(null);
        try {
            await withdrawFunds(amount);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setSelectedAmount(null);
            setCustomAmount("");
        } catch (err: any) {
            setError(err.message || "Failed to withdraw funds");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Withdraw Funds</h1>
                <p className="text-muted-foreground">Cash out your winnings securely</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Balance Card */}
                <div className="p-8 bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 rounded-2xl flex flex-col justify-between h-64 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="h-32 w-32" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-muted-foreground">Available to Withdraw</h3>
                        <div className="text-5xl font-bold text-foreground mt-2 flex items-center gap-2"><TokenIcon size={40} />{balance.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle className="h-4 w-4" /> Verified Account
                    </div>
                </div>

                {/* Withdraw Form */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" /> Withdraw Amount
                    </h3>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {AMOUNTS.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => {
                                    setSelectedAmount(amount);
                                    setCustomAmount("");
                                    setError(null);
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
                                    setError(null);
                                }}
                                className="w-full pl-8 pr-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                            <AlertCircle className="h-4 w-4" /> {error}
                        </div>
                    )}

                    <button
                        onClick={handleWithdraw}
                        disabled={isProcessing || (!selectedAmount && !customAmount)}
                        className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-lg transition-all flex items-center justify-center"
                    >
                        {isProcessing ? (
                            <span className="animate-pulse">Processing...</span>
                        ) : success ? (
                            <span className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" /> Withdrawal Successful
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Withdraw Now <ArrowRight className="h-4 w-4" />
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Transaction History (Withdrawals Only) */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6">Recent Withdrawals</h3>
                <div className="space-y-4">
                    {transactions.filter(t => t.type === 'withdraw').length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No withdrawals yet.</p>
                    ) : (
                        transactions.filter(t => t.type === 'withdraw').map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                                <div>
                                    <p className="font-medium capitalize">Withdrawal to Bank</p>
                                    <p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className="font-bold text-red-500">
                                    -<TokenIcon size={14} className="mx-0.5" />{tx.amount.toFixed(2)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
