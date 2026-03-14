import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

const DEFAULT_PAYOUTS = {
    straight: 36,
    red: 2,
    black: 2,
    even: 2,
    odd: 2,
    low: 2,
    high: 2,
    dozen: 3,
    column: 3
};

export async function GET(request: Request) {
    try {
        const config = await prisma.rouletteConfiguration.findFirst();

        let payouts = DEFAULT_PAYOUTS;
        if (config?.settings) {
            try {
                payouts = { ...DEFAULT_PAYOUTS, ...JSON.parse(config.settings) };
            } catch (e) {
                console.error("Failed to parse roulette settings");
            }
        }

        return NextResponse.json({ payouts });
    } catch (error) {
        console.error("Error fetching roulette settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { payouts } = body;

        if (!payouts || typeof payouts !== "object") {
            return NextResponse.json({ error: "Invalid payouts format" }, { status: 400 });
        }

        let config = await prisma.rouletteConfiguration.findFirst();

        if (config) {
            await prisma.rouletteConfiguration.update({
                where: { id: config.id },
                data: {
                    settings: JSON.stringify(payouts)
                }
            });
        } else {
            await prisma.rouletteConfiguration.create({
                data: {
                    settings: JSON.stringify(payouts)
                }
            });
        }

        return NextResponse.json({ success: true, message: "Settings updated successfully" });

    } catch (error) {
        console.error("Error updating roulette settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
