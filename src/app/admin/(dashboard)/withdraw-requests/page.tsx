"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Search, RefreshCw, AlertCircle, IndianRupee, Banknote } from "lucide-react";
import { toast } from "sonner";
import { TokenIcon } from "@/components/TokenIcon";

export default function WithdrawRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/withdrawals");
            if (!res.ok) throw new Error("Failed to fetch requests");
            const data = await res.json();
            setRequests(data.requests);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load withdrawal requests");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (requestId: number, action: "SUCCESSFUL" | "REJECTED") => {
        setProcessingId(requestId);
        try {
            const res = await fetch("/api/admin/withdrawals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to process request");
            }

            toast.success(`Request marked as ${action.toLowerCase()}`);
            setRequests(prev => prev.filter(r => r.id !== requestId));

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to process request");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = requests.filter(req =>
        req.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Withdrawal Requests</h1>
                    <p className="text-muted-foreground mt-1">Review and process user withdrawal requests</p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            suppressHydrationWarning
                            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>
                    <button
                        onClick={fetchRequests}
                        suppressHydrationWarning
                        className="p-2 border border-border rounded-md hover:bg-secondary/50 text-muted-foreground transition-colors"
                        title="Refresh list"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            <div className="border border-border rounded-lg bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary/30">
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Method</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Details</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                        Loading requests...
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-muted-foreground flex flex-col items-center">
                                        <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                                        <p>No pending withdrawal requests found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-secondary/10 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{req.user?.name || 'Unknown User'}</span>
                                                <span className="text-xs text-muted-foreground">{req.user?.email}</span>
                                                <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full w-fit mt-1 border border-border">
                                                    Bal: <TokenIcon size={10} className="inline mr-1" />{req.user?.balance.toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 font-bold text-red-400">
                                            <TokenIcon size={14} className="inline mr-1" />{req.amount.toFixed(2)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                {req.paymentMethod === 'UPI' ? <IndianRupee className="h-4 w-4 text-primary" /> : <Banknote className="h-4 w-4 text-blue-400" />}
                                                <span className="font-medium">{req.paymentMethod}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 max-w-[200px]">
                                            {req.paymentMethod === 'UPI' ? (
                                                <div className="text-sm truncate" title={req.upiId}>
                                                    <span className="text-muted-foreground text-xs block">UPI ID</span>
                                                    {req.upiId}
                                                </div>
                                            ) : (
                                                <div className="text-sm">
                                                    <div className="truncate" title={req.accountNumber}>
                                                        <span className="text-muted-foreground text-xs block">Account Number</span>
                                                        {req.accountNumber}
                                                    </div>
                                                    <div className="truncate mt-1" title={req.ifscCode}>
                                                        <span className="text-muted-foreground text-xs block">IFSC Code</span>
                                                        {req.ifscCode}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-muted-foreground">
                                            {format(new Date(req.createdAt), 'MMM d, yyyy h:mm a')}
                                        </td>
                                        <td className="py-4 px-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleAction(req.id, "SUCCESSFUL")}
                                                disabled={processingId === req.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                                            >
                                                {processingId === req.id ? "..." : <><CheckCircle className="h-4 w-4" /> Successful</>}
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, "REJECTED")}
                                                disabled={processingId === req.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                                            >
                                                {processingId === req.id ? "..." : <><XCircle className="h-4 w-4" /> Reject</>}
                                            </button>
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
