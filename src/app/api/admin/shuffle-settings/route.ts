import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const config = await prisma.shuffleConfiguration.findFirst();

        if (!config) {
            // Return defaults if none in DB yet
            return NextResponse.json({
                multiplier: 2.90,
                minBet: 10
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error("Error fetching shuffle settings:", error);
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
        const { multiplier, minBet } = body;

        let config = await prisma.shuffleConfiguration.findFirst();

        if (config) {
            config = await prisma.shuffleConfiguration.update({
                where: { id: config.id },
                data: {
                    multiplier: parseFloat(multiplier),
                    minBet: parseFloat(minBet)
                }
            });
        } else {
            config = await prisma.shuffleConfiguration.create({
                data: {
                    multiplier: parseFloat(multiplier),
                    minBet: parseFloat(minBet)
                }
            });
        }

        return NextResponse.json({ success: true, message: "Settings updated successfully", config });

    } catch (error) {
        console.error("Error updating shuffle settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
