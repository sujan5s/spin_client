import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await jwtVerify(token.value, JWT_SECRET);

        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // ── KPI Counts ─────────────────────────────────────────
        // Use allSettled so one missing table doesn't crash the entire endpoint
        const settled = await Promise.allSettled([
            prisma.user.count(),
            prisma.user.count({ where: { transactions: { some: { createdAt: { gte: sevenDaysAgo } } } } }),
            prisma.user.groupBy({ by: ["kycStatus"], _count: { id: true } }),
            prisma.transaction.aggregate({ where: { type: { in: ["DEPOSIT", "deposit", "CREDIT"] } }, _sum: { amount: true } }),
            prisma.withdrawalRequest.aggregate({ where: { status: "SUCCESSFUL" }, _sum: { amount: true } }),
            prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
            prisma.withdrawalRequest.count({ where: { status: "SUCCESSFUL" } }),
            prisma.withdrawalRequest.count({ where: { status: "REJECTED" } }),
            prisma.transaction.count(),
            prisma.minesGame.count(),
            prisma.shuffleGame.count(),
            prisma.dragonTowerGame.count(),
            prisma.ticket.count(),
            prisma.user.aggregate({ _sum: { balance: true } }),
            prisma.user.count({ where: { kycStatus: "PENDING" } }),
            prisma.accountDeletionRequest.count({ where: { status: "PENDING" } }),
        ]);

        const val = <T>(i: number, fallback: T): T =>
            settled[i].status === "fulfilled" ? (settled[i] as PromiseFulfilledResult<T>).value : fallback;

        const totalUsers = val(0, 0) as number;
        const activeUsersLast7Days = val(1, 0) as number;
        const kycCounts = val(2, []) as { kycStatus: string; _count: { id: number } }[];
        const depositTotal = val(3, { _sum: { amount: 0 } }) as { _sum: { amount: number | null } };
        const withdrawTotal = val(4, { _sum: { amount: 0 } }) as { _sum: { amount: number | null } };
        const pendingWithdrawals = val(5, 0) as number;
        const successfulWithdrawals = val(6, 0) as number;
        const rejectedWithdrawals = val(7, 0) as number;
        const totalTransactions = val(8, 0) as number;
        const minesGamesCount = val(9, 0) as number;
        const shuffleGamesCount = val(10, 0) as number;
        const dragonGamesCount = val(11, 0) as number;
        const totalTickets = val(12, 0) as number;
        const totalBalance = val(13, { _sum: { balance: 0 } }) as { _sum: { balance: number | null } };
        const pendingKyc = val(14, 0) as number;
        const pendingDeletions = val(15, 0) as number;

        // Log any individual failures for debugging (non-fatal)
        settled.forEach((r, i) => { if (r.status === "rejected") console.warn(`Stats query[${i}] failed:`, r.reason?.message ?? r.reason); });

        // ── User Growth (last 30 days grouped by day) ──────────
        const usersRaw = await prisma.user.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        const userGrowthMap: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            userGrowthMap[key] = 0;
        }
        usersRaw.forEach(u => {
            const key = u.createdAt.toISOString().slice(0, 10);
            if (userGrowthMap[key] !== undefined) userGrowthMap[key]++;
        });
        const userGrowth = Object.entries(userGrowthMap).map(([date, count]) => ({ date, count }));

        // ── Daily Revenue (last 30 days) ───────────────────────
        const depositsRaw = await prisma.transaction.findMany({
            where: { type: { in: ["DEPOSIT", "deposit", "CREDIT"] }, createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true, amount: true },
        });

        const revenueMap: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            revenueMap[d.toISOString().slice(0, 10)] = 0;
        }
        depositsRaw.forEach(t => {
            const key = t.createdAt.toISOString().slice(0, 10);
            if (revenueMap[key] !== undefined) revenueMap[key] += t.amount;
        });
        const revenueChart = Object.entries(revenueMap).map(([date, amount]) => ({ date, amount: Math.round(amount) }));

        // ── Withdrawal trend (last 30 days) ────────────────────
        const withdrawRaw = await prisma.withdrawalRequest.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true, amount: true, status: true },
        });

        const withdrawMap: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            withdrawMap[d.toISOString().slice(0, 10)] = 0;
        }
        withdrawRaw.forEach(t => {
            const key = t.createdAt.toISOString().slice(0, 10);
            if (withdrawMap[key] !== undefined) withdrawMap[key] += t.amount;
        });
        const withdrawChart = Object.entries(withdrawMap).map(([date, amount]) => ({ date, amount: Math.round(amount) }));

        // ── Game popularity ────────────────────────────────────
        const gameStats = [
            { game: "Mines", plays: minesGamesCount },
            { game: "3-Cup Shuffle", plays: shuffleGamesCount },
            { game: "Dragon Tower", plays: dragonGamesCount },
            { game: "Lucky Draw", plays: totalTickets },
        ];

        // ── KYC chart ─────────────────────────────────────────
        const kycChart = kycCounts.map(k => ({ status: k.kycStatus, count: k._count.id }));

        // ── Withdrawal funnel ──────────────────────────────────
        const totalWithdrawalRequests = pendingWithdrawals + successfulWithdrawals + rejectedWithdrawals;
        const approvalRate = totalWithdrawalRequests > 0
            ? parseFloat(((successfulWithdrawals / totalWithdrawalRequests) * 100).toFixed(1))
            : 0;

        return NextResponse.json({
            kpis: {
                totalUsers,
                activeUsersLast7Days,
                totalDeposited: Math.round(depositTotal._sum.amount ?? 0),
                totalWithdrawn: Math.round(withdrawTotal._sum.amount ?? 0),
                platformBalance: Math.round(totalBalance._sum.balance ?? 0),
                pendingWithdrawals,
                successfulWithdrawals,
                rejectedWithdrawals,
                withdrawalApprovalRate: approvalRate,
                totalTransactions,
                totalGamesPlayed: minesGamesCount + shuffleGamesCount + dragonGamesCount,
                pendingKycRequests: pendingKyc,
                pendingDeletionRequests: pendingDeletions,
            },
            userGrowth,
            revenueChart,
            withdrawChart,
            kycChart,
            gameStats,
        });
    } catch (error) {
        console.error("Stats error:", error);
        return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
    }
}
