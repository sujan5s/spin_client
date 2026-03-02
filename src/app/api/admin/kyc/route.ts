import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get("admin_token");

        if (!adminToken) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            where: {
                kycStatus: "PENDING"
            },
            select: {
                id: true,
                email: true,
                name: true,
                kycStatus: true,
                kycDocumentUrl: true,
                createdAt: true
            },
            orderBy: {
                updatedAt: "desc"
            }
        });

        return NextResponse.json({ users }, { status: 200 });

    } catch (error: any) {
        console.error("KYC GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get("admin_token");

        if (!adminToken) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { userId, action } = await request.json();

        if (!userId || !["VERIFIED", "REJECTED"].includes(action)) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                kycStatus: action
            }
        });

        return NextResponse.json({
            message: `KYC successfully ${action.toLowerCase()}`,
            user: updatedUser
        }, { status: 200 });

    } catch (error: any) {
        console.error("KYC PUT error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
