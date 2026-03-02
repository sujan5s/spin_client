"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users, TrendingUp, TrendingDown, Wallet, Shield, Gamepad2,
    RefreshCw, DollarSign, CheckCircle, XCircle, Clock, Activity,
    BarChart2, PieChart, ArrowUpRight, ArrowDownRight, FileText, Trash2
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────
interface Stats {
    kpis: {
        totalUsers: number;
        activeUsersLast7Days: number;
        totalDeposited: number;
        totalWithdrawn: number;
        platformBalance: number;
        pendingWithdrawals: number;
        successfulWithdrawals: number;
        rejectedWithdrawals: number;
        withdrawalApprovalRate: number;
        totalTransactions: number;
        totalGamesPlayed: number;
        pendingKycRequests: number;
        pendingDeletionRequests: number;
    };
    userGrowth: { date: string; count: number }[];
    revenueChart: { date: string; amount: number }[];
    withdrawChart: { date: string; amount: number }[];
    kycChart: { status: string; count: number }[];
    gameStats: { game: string; plays: number }[];
}

// ── Mini inline SVG line/area chart ─────────────────────────
function SparkLine({
    data, color = "#00ff9d", fill = false
}: { data: number[]; color?: string; fill?: boolean }) {
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    const w = 300; const h = 80;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / max) * (h - 8);
        return `${x},${y}`;
    }).join(" ");
    const fillPath = `M 0,${h} L ${data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / max) * (h - 8);
        return `${x},${y}`;
    }).join(" L ")} L ${w},${h} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" preserveAspectRatio="none">
            {fill && (
                <defs>
                    <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
            )}
            {fill && <path d={fillPath} fill={`url(#grad-${color.replace("#", "")})`} />}
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle
                cx={(data.length - 1) / (data.length - 1) * w}
                cy={h - (data[data.length - 1] / max) * (h - 8)}
                r="3" fill={color}
            />
        </svg>
    );
}

// ── Bar chart ────────────────────────────────────────────────
function BarChart({ data, color = "#00ff9d" }: { data: { label: string; value: number }[]; color?: string }) {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex items-end gap-1.5 h-32 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                        className="w-full rounded-t-sm transition-all"
                        style={{ height: `${(d.value / max) * 100}%`, background: color, opacity: 0.6 + (d.value / max) * 0.4 }}
                        title={`${d.label}: ${d.value}`}
                    />
                </div>
            ))}
        </div>
    );
}

// ── Donut Chart ──────────────────────────────────────────────
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
    const total = slices.reduce((a, b) => a + b.value, 0) || 1;
    let cumAngle = -90;
    const r = 60; const cx = 70; const cy = 70;
    const inner = 38;

    return (
        <div className="flex items-center gap-4 flex-wrap">
            <svg width="140" height="140" viewBox="0 0 140 140">
                {slices.map((s, i) => {
                    const pct = s.value / total;
                    const startA = cumAngle;
                    cumAngle += pct * 360;
                    const endA = cumAngle;
                    const start = polarToXY(cx, cy, r, startA);
                    const end = polarToXY(cx, cy, r, endA);
                    const large = pct > 0.5 ? 1 : 0;
                    const startI = polarToXY(cx, cy, inner, startA);
                    const endI = polarToXY(cx, cy, inner, endA);
                    if (s.value === 0) return null;
                    return (
                        <path
                            key={i}
                            d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} L ${endI.x} ${endI.y} A ${inner} ${inner} 0 ${large} 0 ${startI.x} ${startI.y} Z`}
                            fill={s.color}
                            opacity="0.85"
                            className="hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <title>{s.label}: {s.value}</title>
                        </path>
                    );
                })}
                <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">{total}</text>
                <text x={cx} y={cy + 14} textAnchor="middle" fill="#71717a" fontSize="10">users</text>
            </svg>
            <div className="space-y-2">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-zinc-400">{s.label}</span>
                        <span className="font-bold text-white ml-auto pl-3">{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function polarToXY(cx: number, cy: number, r: number, angle: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({
    label, value, icon: Icon, color, sub, trend
}: {
    label: string; value: string | number; icon: any;
    color: string; sub?: string; trend?: "up" | "down" | null;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-5 flex flex-col gap-3`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}22` }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
                <div className="text-2xl font-black text-white tracking-tight">{value}</div>
                <div className="text-sm text-zinc-500 mt-0.5">{label}</div>
            </div>
            {sub && (
                <div className={`text-xs flex items-center gap-1 font-medium ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-500"}`}>
                    {trend === "up" && <ArrowUpRight className="w-3 h-3" />}
                    {trend === "down" && <ArrowDownRight className="w-3 h-3" />}
                    {sub}
                </div>
            )}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10" style={{ background: color }} />
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────
export default function StatisticsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/statistics");
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();
            setStats(data);
            setLastRefresh(new Date());
        } catch {
            setError("Could not load statistics. Check admin token or server.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) return (
        <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-700 border-t-[#00ff9d] animate-spin" />
            <p className="text-zinc-400 text-sm">Loading statistics…</p>
        </div>
    );

    if (error) return (
        <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
            <p className="text-red-400">{error}</p>
            <button onClick={fetchStats} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm text-white hover:bg-zinc-700">Retry</button>
        </div>
    );

    if (!stats) return null;
    const { kpis, userGrowth, revenueChart, withdrawChart, kycChart, gameStats } = stats;

    const revMax = Math.max(...revenueChart.map(d => d.amount), 1);
    const revenueBarData = revenueChart.slice(-14).map((d, i) => ({
        label: d.date.slice(5),
        value: d.amount
    }));

    const kycColors: Record<string, string> = {
        VERIFIED: "#00ff9d",
        PENDING: "#facc15",
        REJECTED: "#ef4444",
        UNVERIFIED: "#71717a",
    };

    const kycSlices = kycChart.map(k => ({ label: k.status, value: k.count, color: kycColors[k.status] ?? "#888" }));
    const gameMax = Math.max(...gameStats.map(g => g.plays), 1);

    const withdrawalTotal = kpis.pendingWithdrawals + kpis.successfulWithdrawals + kpis.rejectedWithdrawals;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
                        <BarChart2 className="w-7 h-7 text-[#00ff9d]" /> Platform Statistics
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Last refreshed: {lastRefresh.toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-medium transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard label="Total Users" value={kpis.totalUsers.toLocaleString()} icon={Users} color="#00ff9d" sub={`${kpis.activeUsersLast7Days} active this week`} trend="up" />
                <KpiCard label="Withdrawal %" value={`${kpis.withdrawalApprovalRate}%`} icon={CheckCircle} color="#00ff9d" sub={`${kpis.rejectedWithdrawals} rejected`} />
                <KpiCard label="Pending Withdrawals" value={kpis.pendingWithdrawals} icon={Clock} color="#f59e0b" sub="Awaiting action" trend={kpis.pendingWithdrawals > 5 ? "down" : null} />
                <KpiCard label="Pending KYC" value={kpis.pendingKycRequests} icon={FileText} color="#facc15" sub="Awaiting review" trend={kpis.pendingKycRequests > 5 ? "down" : null} />
                <KpiCard label="Pending Deletions" value={kpis.pendingDeletionRequests} icon={Trash2} color="#ef4444" sub="Account requests" trend={kpis.pendingDeletionRequests > 0 ? "down" : null} />

                <KpiCard label="Platform Balance" value={`₹${kpis.platformBalance.toLocaleString()}`} icon={Wallet} color="#10b981" sub="Sum of all user balances" />
                <KpiCard label="Total Deposited" value={`₹${kpis.totalDeposited.toLocaleString()}`} icon={DollarSign} color="#00e5ff" sub="All-time deposits" />
                <KpiCard label="Total Withdrawn" value={`₹${kpis.totalWithdrawn.toLocaleString()}`} icon={TrendingDown} color="#f59e0b" sub={`${kpis.successfulWithdrawals} successful`} />
                <KpiCard label="Games Played" value={kpis.totalGamesPlayed.toLocaleString()} icon={Gamepad2} color="#a855f7" sub="Mines + Shuffle + Dragon" />
                <KpiCard label="Total Transactions" value={kpis.totalTransactions.toLocaleString()} icon={Activity} color="#00e5ff" sub="All-time transaction count" />
            </div>

            {/* Charts Row 1 – User Growth + Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* User Growth */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-[#00ff9d]" /> User Growth</h2>
                        <span className="text-xs text-zinc-500">Last 30 days</span>
                    </div>
                    <SparkLine data={userGrowth.map(d => d.count)} color="#00ff9d" fill />
                    <div className="flex justify-between mt-2 text-xs text-zinc-600">
                        <span>{userGrowth[0]?.date?.slice(5)}</span>
                        <span>{userGrowth[userGrowth.length - 1]?.date?.slice(5)}</span>
                    </div>
                    <div className="mt-3 flex gap-4">
                        <div className="text-center">
                            <div className="text-xl font-black text-[#00ff9d]">{kpis.totalUsers}</div>
                            <div className="text-xs text-zinc-500">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-black text-white">{userGrowth.reduce((a, d) => a + d.count, 0)}</div>
                            <div className="text-xs text-zinc-500">New this month</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-black text-cyan-400">{kpis.activeUsersLast7Days}</div>
                            <div className="text-xs text-zinc-500">Active (7d)</div>
                        </div>
                    </div>
                </div>

                {/* Revenue Trend */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" /> Deposit Revenue</h2>
                        <span className="text-xs text-zinc-500">Last 30 days</span>
                    </div>
                    <SparkLine data={revenueChart.map(d => d.amount)} color="#00e5ff" fill />
                    <div className="flex justify-between mt-2 text-xs text-zinc-600">
                        <span>{revenueChart[0]?.date?.slice(5)}</span>
                        <span>{revenueChart[revenueChart.length - 1]?.date?.slice(5)}</span>
                    </div>
                    <div className="mt-3 flex gap-4">
                        <div className="text-center">
                            <div className="text-xl font-black text-cyan-400">₹{kpis.totalDeposited.toLocaleString()}</div>
                            <div className="text-xs text-zinc-500">All-time</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-black text-white">
                                ₹{revenueChart.reduce((a, d) => a + d.amount, 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-zinc-500">Last 30d</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 – KYC + Withdrawal Funnel + Game Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* KYC Breakdown */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <h2 className="font-bold text-lg flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-yellow-400" /> KYC Status</h2>
                    <DonutChart slices={kycSlices} />
                </div>

                {/* Withdrawal Funnel */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <h2 className="font-bold text-lg flex items-center gap-2 mb-5"><TrendingDown className="w-5 h-5 text-amber-400" /> Withdrawal Funnel</h2>
                    <div className="space-y-3">
                        {[
                            { label: "Total Requests", value: withdrawalTotal, color: "#71717a", icon: Activity },
                            { label: "Successful", value: kpis.successfulWithdrawals, color: "#00ff9d", icon: CheckCircle },
                            { label: "Pending", value: kpis.pendingWithdrawals, color: "#facc15", icon: Clock },
                            { label: "Rejected", value: kpis.rejectedWithdrawals, color: "#ef4444", icon: XCircle },
                        ].map(row => (
                            <div key={row.label}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <row.icon className="w-4 h-4" style={{ color: row.color }} />
                                        <span className="text-zinc-400">{row.label}</span>
                                    </div>
                                    <span className="font-bold text-white">{row.value}</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${withdrawalTotal ? (row.value / withdrawalTotal) * 100 : 0}%`, background: row.color }}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between">
                            <span className="text-zinc-500 text-sm">Approval rate</span>
                            <span className="font-black text-[#00ff9d] text-lg">{kpis.withdrawalApprovalRate}%</span>
                        </div>
                    </div>
                </div>

                {/* Game Popularity */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <h2 className="font-bold text-lg flex items-center gap-2 mb-5"><Gamepad2 className="w-5 h-5 text-purple-400" /> Game Popularity</h2>
                    <div className="space-y-3">
                        {gameStats.sort((a, b) => b.plays - a.plays).map((g, i) => {
                            const colors = ["#a855f7", "#00e5ff", "#00ff9d", "#f59e0b"];
                            return (
                                <div key={g.game}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-zinc-400">{g.game}</span>
                                        <span className="font-bold text-white">{g.plays.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${(g.plays / gameMax) * 100}%`, background: colors[i % colors.length] }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        <div className="mt-2 pt-3 border-t border-zinc-800 text-sm flex justify-between">
                            <span className="text-zinc-500">Total plays</span>
                            <span className="font-bold text-white">{kpis.totalGamesPlayed.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deposit vs Withdrawal daily chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-[#00ff9d]" /> Daily Deposit vs Withdrawal (last 30 days)
                </h2>
                <div className="relative h-40 w-full">
                    {/* combined bar chart */}
                    <div className="flex items-end gap-0.5 h-full w-full">
                        {revenueChart.map((d, i) => {
                            const withd = withdrawChart[i]?.amount ?? 0;
                            const maxVal = Math.max(...revenueChart.map(r => r.amount), ...withdrawChart.map(w => w.amount), 1);
                            return (
                                <div key={d.date} className="flex-1 flex flex-col-reverse gap-0.5 h-full items-center group">
                                    <div
                                        className="w-full rounded-t-sm"
                                        style={{ height: `${(d.amount / maxVal) * 100}%`, background: "#00e5ff", opacity: 0.7 }}
                                        title={`Deposit: ₹${d.amount} (${d.date.slice(5)})`}
                                    />
                                    {withd > 0 && (
                                        <div
                                            className="w-full rounded-t-sm absolute"
                                            style={{ height: `${(withd / maxVal) * 100}%`, background: "#f59e0b", opacity: 0.5, position: "relative" }}
                                            title={`Withdraw: ₹${withd} (${d.date.slice(5)})`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex gap-6 mt-3 text-xs">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-cyan-400 opacity-70" /> Deposits</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-amber-400 opacity-70" /> Withdrawals</div>
                </div>
            </div>

            {/* Footer note */}
            <p className="text-xs text-zinc-600 text-center">Statistics update in real-time. Click Refresh to get the latest data.</p>
        </div>
    );
}
