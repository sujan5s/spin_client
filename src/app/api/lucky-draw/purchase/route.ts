import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

function generateToken() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `#LD-${result}`;
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Verify JWT
        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        const userId = Number(payload.userId);

        const { amount } = await request.json();
        const price = Number(amount);

        if (!price || price <= 0) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }

        // Transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Get user
            const user = await tx.user.findUnique({
                where: { id: userId }
            });

            if (!user) throw new Error("User not found");
            if (user.balance < price) throw new Error("Insufficient balance");

            // Deduct balance
            await tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: price } }
            });

            // Create Transaction Record
            await tx.transaction.create({
                data: {
                    userId,
                    type: "ticket_purchase",
                    amount: -price,
                }
            });

            // Generate unique token
            let tokenNumber = generateToken();
            let isUnique = false;
            while (!isUnique) {
                const existing = await tx.ticket.findUnique({ where: { tokenNumber } });
                if (!existing) isUnique = true;
                else tokenNumber = generateToken();
            }

            // Create Ticket
            const ticket = await tx.ticket.create({
                data: {
                    userId,
                    price,
                    tokenNumber,
                    status: "active"
                }
            });

            return ticket;
        });

        return NextResponse.json({
            success: true,
            ticket: result,
            message: "Ticket purchased successfully"
        });

    } catch (error: any) {
        console.error("Purchase error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 400 } // Using 400 for business logic errors like "Insufficient balance"
        );
    }
}
