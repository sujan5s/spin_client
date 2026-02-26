"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ArrowUpRight, ArrowDownLeft, Receipt, Gamepad2 } from "lucide-react";
import { TokenIcon } from "@/components/TokenIcon";

// Types
interface Transaction {
    id: number;
    type: string;
    amount: number;
    createdAt: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    balance: number;
    createdAt: string;
}

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [user, setUser] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch User Details
                const userRes = await fetch(`/api/admin/users/${id}`);
                const userData = await userRes.json();

                // Fetch Transactions
                const txRes = await fetch(`/api/admin/users/${id}/transactions`);
                const txData = await txRes.json();

                if (userRes.ok) setUser(userData.user);
                if (txRes.ok) setTransactions(txData.transactions);

            } catch (error) {
                console.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const getTxIcon = (type: string) => {
        if (type === 'deposit') return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
        if (type === 'withdraw') return <ArrowUpRight className="w-5 h-5 text-red-500" />;
        if (type.includes('game') || type.includes('win')) return <Gamepad2 className="w-5 h-5 text-yellow-500" />;
        return <Receipt className="w-5 h-5 text-blue-500" />;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!user) return <div className="p-8 text-center text-red-500">User not found</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{user.name || "No Name"}</h1>
                    <p className="text-gray-400">{user.email}</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-sm text-gray-400">Current Balance</p>
                    <p className="text-3xl font-bold text-green-400 flex items-center justify-end gap-1"><TokenIcon size={32} />{user.balance.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit">
                    <h3 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">Account Details</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-400">User ID</span>
                            <span className="font-mono">{user.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Joined On</span>
                            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Transactions */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2 flex items-center justify-between">
                        <span>Transaction History</span>
                        <span className="text-xs font-normal text-gray-500">{transactions.length} records</span>
                    </h3>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {transactions.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No transactions found</p>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-950/50 rounded-lg border border-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-900 rounded-full border border-gray-800">
                                            {getTxIcon(tx.type)}
                                        </div>
                                        <div>
                                            <div className="font-medium capitalize text-sm">{tx.type.replace('_', ' ')}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-bold ${tx.type === 'deposit' || tx.type.includes('win') ? 'text-green-500' : 'text-red-500'} flex items-center gap-0.5`}>
                                        {tx.type === 'deposit' || tx.type.includes('win') ? '+' : '-'}<TokenIcon size={14} />{tx.amount}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
