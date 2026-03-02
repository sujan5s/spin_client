"use client";

import { useState, useEffect, useCallback } from "react";
import { Monitor, Search, RefreshCw, User, Clock, Globe, LogIn } from "lucide-react";
import { format } from "date-fns";

interface LogEntry {
    id: number;
    email: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user: { id: number; name: string | null; email: string } | null;
}

function parseDevice(ua: string | null) {
    if (!ua) return "Unknown";
    if (/mobile/i.test(ua)) return "📱 Mobile";
    if (/tablet|ipad/i.test(ua)) return "📟 Tablet";
    return "🖥️ Desktop";
}

function parseBrowser(ua: string | null) {
    if (!ua) return "Unknown";
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) return "Chrome";
    if (/firefox/i.test(ua)) return "Firefox";
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
    if (/edge/i.test(ua)) return "Edge";
    return "Other";
}

export default function LoginLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (debouncedSearch) params.set("search", debouncedSearch);
            const res = await fetch(`/api/admin/login-logs?${params}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setLogs(data.logs);
            setTotal(data.total);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const totalPages = Math.ceil(total / 50);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <LogIn className="w-6 h-6 text-emerald-400" />
                        Login Logs
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {total.toLocaleString()} login events recorded
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-medium text-white transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search by email or name…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    suppressHydrationWarning
                />
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-4 border-zinc-700 border-t-emerald-400 animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
                        <LogIn className="w-10 h-10 opacity-30" />
                        <p>No login logs found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-800/50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> User</div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Time</div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> IP Address</div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> Device / Browser</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {logs.map((log, i) => (
                                    <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-3 text-zinc-600 text-xs">
                                            {(page - 1) * 50 + i + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">
                                                {log.user?.name ?? "—"}
                                            </div>
                                            <div className="text-zinc-500 text-xs">{log.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-white">
                                                {format(new Date(log.createdAt), "dd MMM yyyy")}
                                            </div>
                                            <div className="text-zinc-500 text-xs">
                                                {format(new Date(log.createdAt), "hh:mm:ss a")}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-zinc-300 text-xs bg-zinc-800 px-2 py-0.5 rounded">
                                                {log.ipAddress ?? "Unknown"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-white">{parseDevice(log.userAgent)}</div>
                                            <div className="text-zinc-500 text-xs">{parseBrowser(log.userAgent)}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-zinc-500">
                        Page {page} of {totalPages} · {total} total events
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white disabled:opacity-40 hover:bg-zinc-700 transition-colors"
                        >
                            ← Prev
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white disabled:opacity-40 hover:bg-zinc-700 transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
