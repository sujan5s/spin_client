import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

const DEFAULT_GAMES_ENABLED = JSON.stringify({
    spin: true,
    roulette: true,
    slots: true,
    mines: true,
    plinko: true,
    dragontower: true,
    shuffle: true,
    luckydraw: true
});

export async function GET(request: Request) {
    try {
        let settings = await prisma.systemSettings.findFirst();

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    bonusDeductionPct: 20,
                    gamesEnabled: DEFAULT_GAMES_ENABLED
                }
            });
        }

        return NextResponse.json({
            id: settings.id,
            bonusDeductionPct: settings.bonusDeductionPct,
            gamesEnabled: JSON.parse(settings.gamesEnabled)
        });
    } catch (error) {
        console.error("Error fetching system settings:", error);
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
        const { bonusDeductionPct, gamesEnabled } = body;

        let settings = await prisma.systemSettings.findFirst();

        if (settings) {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: {
                    bonusDeductionPct: bonusDeductionPct !== undefined ? Number(bonusDeductionPct) : settings.bonusDeductionPct,
                    gamesEnabled: gamesEnabled ? JSON.stringify(gamesEnabled) : settings.gamesEnabled
                }
            });
        } else {
            settings = await prisma.systemSettings.create({
                data: {
                    bonusDeductionPct: bonusDeductionPct !== undefined ? Number(bonusDeductionPct) : 20,
                    gamesEnabled: gamesEnabled ? JSON.stringify(gamesEnabled) : DEFAULT_GAMES_ENABLED
                }
            });
        }

        return NextResponse.json({
            success: true,
            settings: {
                id: settings.id,
                bonusDeductionPct: settings.bonusDeductionPct,
                gamesEnabled: JSON.parse(settings.gamesEnabled)
            }
        });

    } catch (error) {
        console.error("Error updating system settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
