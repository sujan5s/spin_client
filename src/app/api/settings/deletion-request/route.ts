import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { userId: number; email: string };
    } catch {
        return null;
    }
}

// POST — submit a new deletion request
export async function POST(request: Request) {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { reason } = await request.json();
        if (!reason || reason.trim().length < 10) {
            return NextResponse.json({ error: "Please provide a reason of at least 10 characters" }, { status: 400 });
        }

        // Check if there's already a pending request
        const existing = await prisma.accountDeletionRequest.findFirst({
            where: { userId: authUser.userId, status: "PENDING" },
        });
        if (existing) {
            return NextResponse.json({ error: "You already have a pending deletion request" }, { status: 409 });
        }

        const req = await prisma.accountDeletionRequest.create({
            data: {
                userId: authUser.userId,
                reason: reason.trim(),
            },
        });

        return NextResponse.json({ success: true, request: req });
    } catch (error) {
        console.error("Deletion request error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET — check if user has a pending request
export async function GET() {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.accountDeletionRequest.findFirst({
        where: { userId: authUser.userId },
        orderBy: { createdAt: "desc" },
        select: { status: true, createdAt: true },
    });

    return NextResponse.json({ existing });
}
