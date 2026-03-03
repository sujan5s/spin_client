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
            referralBonusNewUser: settings.referralBonusNewUser,
            referralBonusReferrer: settings.referralBonusReferrer,
            gamesEnabled: JSON.parse(settings.gamesEnabled),
            marqueeText: settings.marqueeText ?? "",
            marqueeSpeed: settings.marqueeSpeed ?? 25
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
        const { bonusDeductionPct, referralBonusNewUser, referralBonusReferrer, gamesEnabled, marqueeText, marqueeSpeed } = body;

        let settings = await prisma.systemSettings.findFirst();

        if (settings) {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: {
                    bonusDeductionPct: bonusDeductionPct !== undefined ? Number(bonusDeductionPct) : settings.bonusDeductionPct,
                    referralBonusNewUser: referralBonusNewUser !== undefined ? Number(referralBonusNewUser) : settings.referralBonusNewUser,
                    referralBonusReferrer: referralBonusReferrer !== undefined ? Number(referralBonusReferrer) : settings.referralBonusReferrer,
                    gamesEnabled: gamesEnabled ? JSON.stringify(gamesEnabled) : settings.gamesEnabled,
                    marqueeText: marqueeText !== undefined ? String(marqueeText) : settings.marqueeText,
                    marqueeSpeed: marqueeSpeed !== undefined ? Number(marqueeSpeed) : settings.marqueeSpeed
                }
            });
        } else {
            settings = await prisma.systemSettings.create({
                data: {
                    bonusDeductionPct: bonusDeductionPct !== undefined ? Number(bonusDeductionPct) : 20,
                    referralBonusNewUser: referralBonusNewUser !== undefined ? Number(referralBonusNewUser) : 50,
                    referralBonusReferrer: referralBonusReferrer !== undefined ? Number(referralBonusReferrer) : 100,
                    gamesEnabled: gamesEnabled ? JSON.stringify(gamesEnabled) : DEFAULT_GAMES_ENABLED
                }
            });
        }

        return NextResponse.json({
            success: true,
            settings: {
                id: settings.id,
                bonusDeductionPct: settings.bonusDeductionPct,
                referralBonusNewUser: settings.referralBonusNewUser,
                referralBonusReferrer: settings.referralBonusReferrer,
                gamesEnabled: JSON.parse(settings.gamesEnabled),
                marqueeText: settings.marqueeText ?? "",
                marqueeSpeed: settings.marqueeSpeed ?? 25
            }
        });

    } catch (error) {
        console.error("Error updating system settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
