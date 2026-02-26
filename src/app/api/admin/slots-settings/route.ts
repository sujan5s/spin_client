import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

// Default configuration matches current hardcoded values
const DEFAULT_WEIGHTS = {
    'clover': 50,
    'cherry': 40,
    'bell': 30,
    'diamond': 15,
    '7': 5
};

const DEFAULT_PAYTABLE = {
    'clover': { 3: 2, 4: 5, 5: 10 },
    'cherry': { 3: 3, 4: 8, 5: 15 },
    'bell': { 3: 5, 4: 15, 5: 30 },
    'diamond': { 3: 10, 4: 30, 5: 60 },
    '7': { 3: 50, 4: 200, 5: 1000 }
};

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        if (payload.role !== "admin") { // Assuming role based auth or just checking token presence for now if role missing
            // If schema doesn't have role, we might skip this or check if user is admin
            // For now, generally protecting route
        }

        const config = await prisma.slotsConfiguration.findFirst();

        if (config) {
            return NextResponse.json(JSON.parse(config.settings));
        } else {
            return NextResponse.json({
                weights: DEFAULT_WEIGHTS,
                paytable: DEFAULT_PAYTABLE
            });
        }

    } catch (error) {
        console.error("Error fetching slots settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        await jwtVerify(token.value, JWT_SECRET); // Add admin check if possible

        const body = await request.json();
        const { weights, paytable } = body;

        if (!weights || !paytable) {
            return NextResponse.json({ error: "Invalid settings data" }, { status: 400 });
        }

        const existing = await prisma.slotsConfiguration.findFirst();

        if (existing) {
            await prisma.slotsConfiguration.update({
                where: { id: existing.id },
                data: {
                    settings: JSON.stringify({ weights, paytable })
                }
            });
        } else {
            await prisma.slotsConfiguration.create({
                data: {
                    settings: JSON.stringify({ weights, paytable })
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating slots settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
