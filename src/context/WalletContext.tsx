"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface WalletContextType {
    balance: number;
    bonusBalance: number;
    addFunds: (amount: number) => Promise<void>;
    withdrawFunds: (amount: number, paymentMethod: string, details: any) => Promise<void>;
    updateBalance: (amount: number) => void; // amount can be negative
    setBalance: (amount: number) => void; // Direct set
    setBonusBalance: (amount: number) => void;
    refreshTransactions: () => Promise<void>;
    transactions: Transaction[];
    withdrawalRequests: WithdrawalRequest[];
    isLoading: boolean;
}

interface WithdrawalRequest {
    id: number;
    amount: number;
    status: string;
    paymentMethod: string;
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    createdAt: string;
}

interface Transaction {
    id: number;
    type: string;
    amount: number;
    createdAt: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [bonusBalance, setBonusBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setBalance(user.balance);
            setBonusBalance(user.bonusBalance || 0);
            fetchTransactions();
        } else {
            setBalance(0);
            setBonusBalance(0);
            setTransactions([]);
        }
    }, [user]);

    const fetchTransactions = async () => {
        try {
            const res = await fetch("/api/wallet/transactions");
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions);
            }

            const reqRes = await fetch("/api/wallet/withdraw/requests");
            if (reqRes.ok) {
                const data = await reqRes.json();
                setWithdrawalRequests(data.requests);
            }
        } catch (error) {
            console.error("Failed to fetch wallet data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const addFunds = async (amount: number) => {
        try {
            const res = await fetch("/api/wallet/deposit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });

            if (!res.ok) {
                throw new Error("Failed to add funds");
            }

            const data = await res.json();
            setBalance(data.balance);
            if (data.bonusBalance !== undefined) {
                setBonusBalance(data.bonusBalance);
            }
            fetchTransactions(); // Refresh history
        } catch (error) {
            console.error("Add funds error", error);
            throw error;
        }
    };

    const withdrawFunds = async (amount: number, paymentMethod: string, details: any) => {
        try {
            const res = await fetch("/api/wallet/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, paymentMethod, ...details }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to withdraw funds");
            }

            const data = await res.json();

            // Immediately update the balance with the new deducted amount returned from API
            if (data.balance !== undefined) {
                setBalance(data.balance);
            }

            fetchTransactions(); // Refresh history and requests
        } catch (error) {
            console.error("Withdraw funds error", error);
            throw error;
        }
    };

    const updateBalance = (amount: number) => {
        if (typeof amount !== 'number' || isNaN(amount)) {
            console.error("Invalid amount passed to updateBalance:", amount);
            return;
        }
        // This is for local optimistic updates during games
        // Real sync should happen via API calls in the game logic
        setBalance((prev) => prev + amount);
    };

    return (
        <WalletContext.Provider value={{ balance, bonusBalance, addFunds, withdrawFunds, updateBalance, setBalance, setBonusBalance, refreshTransactions: fetchTransactions, transactions, withdrawalRequests, isLoading }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within an WalletProvider");
    }
    return context;
}
