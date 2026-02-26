import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        await jwtVerify(token.value, JWT_SECRET);

        const transactions = await prisma.transaction.findMany({
            where: { userId: Number(id) },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ transactions });

    } catch (error) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
