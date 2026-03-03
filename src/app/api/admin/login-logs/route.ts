import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = 50;
        const search = searchParams.get("search") ?? "";

        const where: any = search
            ? {
                OR: [
                    { email: { contains: search, mode: "insensitive" } },
                    { user: { name: { contains: search, mode: "insensitive" } } },
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
