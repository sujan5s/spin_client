import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Default Configuration
const DEFAULT_CONFIG = {
    minBet: 10,
    easyMultipliers: [1.29, 1.72, 2.29, 3.06, 4.08, 5.45, 7.26, 9.69, 12.93],
    mediumMultipliers: [1.45, 2.18, 3.27, 4.91, 7.36, 11.04, 16.56, 24.84, 37.26],
    hardMultipliers: [1.94, 3.88, 7.76, 15.52, 31.04, 62.08, 124.16, 248.32, 496.64],
    expertMultipliers: [2.91, 8.73, 26.19, 78.57, 235.71, 707.13, 2121.39, 6364.17, 19092.51],
    masterMultipliers: [3.88, 15.52, 62.08, 248.32, 993.28, 3973.12, 15892.48, 63569.92, 254279.68]
};

export async function GET() {
    try {
        let settings = await prisma.dragonTowerSettings.findFirst();

        if (!settings) {
            // Create default
            settings = await prisma.dragonTowerSettings.create({
                data: {
                    minBetEasy: DEFAULT_CONFIG.minBet,
                    minBetMedium: DEFAULT_CONFIG.minBet,
                    minBetHard: DEFAULT_CONFIG.minBet,
                    minBetExpert: DEFAULT_CONFIG.minBet,
                    minBetMaster: DEFAULT_CONFIG.minBet,
                    easyMultipliers: JSON.stringify(DEFAULT_CONFIG.easyMultipliers),
                    mediumMultipliers: JSON.stringify(DEFAULT_CONFIG.mediumMultipliers),
                    hardMultipliers: JSON.stringify(DEFAULT_CONFIG.hardMultipliers),
                    expertMultipliers: JSON.stringify(DEFAULT_CONFIG.expertMultipliers),
                    masterMultipliers: JSON.stringify(DEFAULT_CONFIG.masterMultipliers),
                }
            });
        }

        return NextResponse.json({
            minBets: {
                easy: settings.minBetEasy,
                medium: settings.minBetMedium,
                hard: settings.minBetHard,
                expert: settings.minBetExpert,
                master: settings.minBetMaster
            },
            multipliers: {
                easy: JSON.parse(settings.easyMultipliers),
                medium: JSON.parse(settings.mediumMultipliers),
                hard: JSON.parse(settings.hardMultipliers),
                expert: JSON.parse(settings.expertMultipliers),
                master: JSON.parse(settings.masterMultipliers),
            }
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { minBets, multipliers } = body;

        const first = await prisma.dragonTowerSettings.findFirst();

        const data = {
            minBetEasy: parseFloat(minBets.easy),
            minBetMedium: parseFloat(minBets.medium),
            minBetHard: parseFloat(minBets.hard),
            minBetExpert: parseFloat(minBets.expert),
            minBetMaster: parseFloat(minBets.master),
            easyMultipliers: JSON.stringify(multipliers.easy),
            mediumMultipliers: JSON.stringify(multipliers.medium),
            hardMultipliers: JSON.stringify(multipliers.hard),
            expertMultipliers: JSON.stringify(multipliers.expert),
            masterMultipliers: JSON.stringify(multipliers.master),
        };

        if (first) {
            await prisma.dragonTowerSettings.update({
                where: { id: first.id },
                data
            });
        } else {
            await prisma.dragonTowerSettings.create({ data });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
