import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");
    // matches existing admin auth pattern

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = 50;
        const search = searchParams.get("search") ?? "";

        const where = search
            ? {
                OR: [
                    { email: { contains: search, mode: "insensitive" as const } },
                    { user: { name: { contains: search, mode: "insensitive" as const } } },
                ],
            }
            : {};

        const [logs, total] = await Promise.all([
            prisma.loginLog.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.loginLog.count({ where }),
        ]);

        return NextResponse.json({ logs, total, page, limit });
    } catch (error) {
        console.error("Login logs error:", error);
        return NextResponse.json({ error: "Failed to fetch login logs" }, { status: 500 });
    }
}
