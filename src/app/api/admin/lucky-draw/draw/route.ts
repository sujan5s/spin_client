import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get("admin_token");

        if (!adminToken) {
            return NextResponse.json(
                { error: "Not authenticated as admin" },
                { status: 401 }
            );
        }

        // Note: In a real app, verify admin token validity here
        // For now, assuming existence of cookie implies admin (as per existing simplified admin flow)

        const { price } = await request.json();
        const drawPrice = Number(price);

        if (!drawPrice || drawPrice <= 0) {
            return NextResponse.json(
                { error: "Invalid price category" },
                { status: 400 }
            );
        }

        // Perform Draw Logic in Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Fetch active tickets for this pool
            const tickets = await tx.ticket.findMany({
                where: {
                    price: drawPrice,
                    status: "active"
                },
                include: { user: true }
            });

            if (tickets.length === 0) {
                throw new Error("No active tickets in this pool");
            }

            // Pick Random Winner
            const winnerIndex = Math.floor(Math.random() * tickets.length);
            const winnerTicket = tickets[winnerIndex];
            const winningAmount = drawPrice * 2;

            // Update Winner
            await tx.ticket.update({
                where: { id: winnerTicket.id },
                data: { status: "won" }
            });

            await tx.user.update({
                where: { id: winnerTicket.userId },
                data: { balance: { increment: winningAmount } }
            });

            await tx.transaction.create({
                data: {
                    userId: winnerTicket.userId,
                    type: "game_win",
                    amount: winningAmount, // Profit is effectively price * 1, but we credit full return? User said "add two times the price". Usually means return investment + profit. So +2x is correct.
                }
            });

            await tx.notification.create({
                data: {
                    userId: winnerTicket.userId,
                    title: "Lucky Draw Winner!",
                    message: `Congratulations! You won $${winningAmount.toFixed(2)} in the Lucky Draw!`,
                    type: "success"
                }
            });

            // Update Losers
            const loserTickets = tickets.filter(t => t.id !== winnerTicket.id);
            for (const ticket of loserTickets) {
                await tx.ticket.update({
                    where: { id: ticket.id },
                    data: { status: "lost" }
                });

                await tx.notification.create({
                    data: {
                        userId: ticket.userId,
                        title: "Better Luck Next Time",
                        message: `The Lucky Draw for $${drawPrice} has ended. Detailed results are available.`,
                        type: "info"
                    }
                });
            }

            return { winner: winnerTicket.user.name, ticket: winnerTicket.tokenNumber, amount: winningAmount };
        });

        return NextResponse.json({
            success: true,
            message: "Draw completed successfully",
            result
        });

    } catch (error: any) {
        console.error("Draw error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 400 }
        );
    }
}
