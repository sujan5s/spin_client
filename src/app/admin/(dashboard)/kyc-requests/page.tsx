"use client";

import { useState, useEffect } from "react";
import { Check, X, FileText, Search, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface KycUser {
    id: number;
    email: string;
    name: string | null;
    kycDocumentUrl: string | null;
    createdAt: string;
}

export default function KycRequestsPage() {
    const [users, setUsers] = useState<KycUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/admin/kyc");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch KYC requests:", error);
            toast.error("Failed to fetch requests");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (userId: number, action: "VERIFIED" | "REJECTED") => {
        setActionLoading(userId);
        try {
            const res = await fetch("/api/admin/kyc", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action })
            });

            if (!res.ok) throw new Error("Failed to update status");

            toast.success(`User successfully ${action.toLowerCase()}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error("Action error:", error);
            toast.error("Failed to update user status");
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">KYC Verification Requests</h1>
                <p className="text-gray-400">Review and approve user identification documents</p>
            </div>

            {users.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                    <p className="text-gray-400">There are no pending KYC requests at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {users.map((user) => (
                        <div key={user.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors flex flex-col">
                            <div className="p-6 border-b border-gray-800">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{user.name || "Unnamed User"}</h3>
                                        <p className="text-sm text-gray-400">{user.email}</p>
                                    </div>
                                    <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/20">
                                        Pending Review
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    User ID: {user.id} • Registered: {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="flex-1 p-6 bg-gray-950/50 flex flex-col items-center justify-center relative min-h-[300px]">
                                {user.kycDocumentUrl ? (
                                    user.kycDocumentUrl.endsWith('.pdf') ? (
                                        <div className="text-center w-full">
                                            <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                                            <a href={user.kycDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-medium">
                                                View PDF Document
                                            </a>
                                        </div>
                                    ) : (
                                        <a href={user.kycDocumentUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full h-full min-h-[250px] group">
                                            <Image
                                                src={user.kycDocumentUrl}
                                                alt="KYC Document"
                                                fill
                                                className="object-contain rounded-lg"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <div className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                                                    <Search className="h-4 w-4" /> Click to enlarge
                                                </div>
                                            </div>
                                        </a>
                                    )
                                ) : (
                                    <div className="text-gray-500 text-center">
                                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Document missing or corrupted</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-800 grid grid-cols-2 gap-4 bg-gray-900">
                                <button
                                    onClick={() => handleAction(user.id, "REJECTED")}
                                    disabled={actionLoading === user.id}
                                    className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                >
                                    {actionLoading === user.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleAction(user.id, "VERIFIED")}
                                    disabled={actionLoading === user.id}
                                    className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 text-green-500 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                >
                                    {actionLoading === user.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                    Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
