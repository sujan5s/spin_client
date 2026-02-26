import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function GET(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await jwtVerify(token.value, JWT_SECRET); // Verify it's a valid token signed by us

        // You might want to also check role inside token if you have multiple roles
        // const { payload } = await jwtVerify(token.value, JWT_SECRET);
        // if (payload.role !== 'admin') throw new Error('Not admin');

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                balance: true,
                createdAt: true,
                _count: {
                    select: { tickets: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform data to flat structure if needed, or send as is
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name || "No Name",
            email: user.email,
            balance: user.balance,
            joinedAt: user.createdAt,
            luckyDraws: user._count.tickets
        }));

        return NextResponse.json({ users: formattedUsers });

    } catch (error) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ error: "Unauthorized or Error fetching data" }, { status: 401 });
    }
}
