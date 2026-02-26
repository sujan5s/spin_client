import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await prisma.dragonTowerSettings.findFirst();

        if (!settings) {
            return NextResponse.json({
                minBets: { easy: 10, medium: 10, hard: 10, expert: 10, master: 10 }
            });
        }

        return NextResponse.json({
            minBets: {
                easy: settings.minBetEasy,
                medium: settings.minBetMedium,
                hard: settings.minBetHard,
                expert: settings.minBetExpert,
                master: settings.minBetMaster
            }
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
    }
}
