import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get("admin_token");

        if (!adminToken) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Fetch all active tickets
        const activeTickets = await prisma.ticket.findMany({
            where: { status: "active" },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { purchasedAt: "desc" }
        });

        // Group by price
        const pools: Record<number, any[]> = {};
        activeTickets.forEach(ticket => {
            if (!pools[ticket.price]) pools[ticket.price] = [];
            pools[ticket.price].push(ticket);
        });

        // Fetch recent winners
        const recentWinners = await prisma.ticket.findMany({
            where: { status: "won" },
            include: { user: { select: { name: true } } },
            orderBy: { purchasedAt: "desc" }, // actually should be winning time, but we don't track it separately yet. using purchasedAt or we can assume recent.
            take: 10
        });

        return NextResponse.json({
            pools,
            recentWinners
        });

    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
