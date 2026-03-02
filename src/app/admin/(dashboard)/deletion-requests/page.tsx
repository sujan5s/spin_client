"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, User, Clock, CheckCircle, XCircle, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface DeletionRequest {
    id: number;
    reason: string;
    status: string;
    createdAt: string;
    user: {
        id: number;
        name: string | null;
        email: string;
        balance: number;
        kycStatus: string;
        createdAt: string;
    };
}

export default function DeletionRequestsPage() {
    const [requests, setRequests] = useState<DeletionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<number | null>(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/deletion-requests");
            const data = await res.json();
            setRequests(data.requests ?? []);
        } catch {
            toast.error("Failed to load deletion requests");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleAction = async (requestId: number, action: "APPROVED" | "REJECTED") => {
        const label = action === "APPROVED" ? "delete this account" : "reject this request";
        if (!confirm(`Are you sure you want to ${label}? ${action === "APPROVED" ? "This is IRREVERSIBLE." : ""}`)) return;

        setActionId(requestId);
        try {
            const res = await fetch("/api/admin/deletion-requests", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setRequests(r => r.filter(x => x.id !== requestId));
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error("Action failed");
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <Trash2 className="w-6 h-6 text-red-400" />
                        Account Deletion Requests
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {requests.length} pending request{requests.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-medium text-white transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-300">
                    Approving a deletion request is <strong>permanent and irreversible</strong>. The user's account, balance, game history, and all associated data will be permanently deleted.
                </p>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-4 border-zinc-700 border-t-red-400 animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-16 flex flex-col items-center gap-3 text-zinc-500">
                    <CheckCircle className="w-12 h-12 text-emerald-400 opacity-60" />
                    <p className="font-medium">No pending deletion requests</p>
                    <p className="text-sm">All deletion requests have been processed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {requests.map(req => (
                        <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            {/* User Info */}
                            <div className="p-5 border-b border-zinc-800">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{req.user.name ?? "Unnamed"}</div>
                                            <div className="text-zinc-500 text-xs">{req.user.email}</div>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${req.user.kycStatus === "VERIFIED" ? "bg-emerald-500/10 text-emerald-400"
                                            : req.user.kycStatus === "PENDING" ? "bg-yellow-500/10 text-yellow-400"
                                                : "bg-zinc-700 text-zinc-400"
                                        }`}>
                                        KYC: {req.user.kycStatus}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-zinc-800/50 rounded-lg p-2.5">
                                        <div className="text-zinc-500 text-xs mb-0.5">Balance</div>
                                        <div className="font-bold text-white">₹{req.user.balance.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-2.5">
                                        <div className="text-zinc-500 text-xs mb-0.5">Member since</div>
                                        <div className="font-bold text-white">{format(new Date(req.user.createdAt), "MMM yyyy")}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="p-5 border-b border-zinc-800">
                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Reason for deletion</div>
                                <p className="text-zinc-300 text-sm leading-relaxed bg-zinc-800/40 rounded-lg p-3 italic">
                                    "{req.reason}"
                                </p>
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-600">
                                    <Clock className="w-3 h-3" />
                                    Requested {format(new Date(req.createdAt), "dd MMM yyyy 'at' hh:mm a")}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleAction(req.id, "REJECTED")}
                                    disabled={actionId === req.id}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors disabled:opacity-40"
                                >
                                    {actionId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleAction(req.id, "APPROVED")}
                                    disabled={actionId === req.id}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                                >
                                    {actionId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
