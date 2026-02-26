import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        // Auth check (ensure admin)
        // const cookieStore = await cookies();
        // const token = cookieStore.get("admin_token");
        // if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const config = await prisma.minesConfiguration.findFirst();

        let settings = {};
        if (config && config.settings) {
            try {
                settings = JSON.parse(config.settings);
            } catch (e) {
                console.error("Failed to parse mines settings", e);
            }
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Error fetching mines settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        // Auth check
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token");
        // if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { settings } = body;

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: "Invalid settings format" }, { status: 400 });
        }

        // Check if config exists
        const existing = await prisma.minesConfiguration.findFirst();

        if (existing) {
            await prisma.minesConfiguration.update({
                where: { id: existing.id },
                data: { settings: JSON.stringify(settings) }
            });
        } else {
            await prisma.minesConfiguration.create({
                data: { settings: JSON.stringify(settings) }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating mines settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
