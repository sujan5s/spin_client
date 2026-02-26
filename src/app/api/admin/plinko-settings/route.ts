import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { PLINKO_MULTIPLIERS } from "@/lib/plinko-config";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rows = searchParams.get("rows");
        const risk = searchParams.get("risk");

        if (rows && risk) {
            // Fetch specific config
            const config = await prisma.plinkoConfiguration.findUnique({
                where: {
                    rows_risk: {
                        rows: parseInt(rows),
                        risk: risk
                    }
                }
            });

            if (!config) {
                // If not found, return default from hardcoded config
                // @ts-ignore
                const defaultMultipliers = PLINKO_MULTIPLIERS[parseInt(rows)]?.[risk] || [];
                // Default equal probability (e.g. 10)
                const defaultSettings = defaultMultipliers.map((m: number, i: number) => ({
                    index: i,
                    multiplier: m,
                    probability: 10
                }));
                return NextResponse.json({ settings: defaultSettings });
            }

            return NextResponse.json({ settings: JSON.parse(config.settings) });

        } else {
            // Return all configs or metadata if needed (for now assume UI requests specific)
            return NextResponse.json({ message: "Specify rows and risk" });
        }

    } catch (error) {
        console.error("Error fetching Plinko settings:", error);
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
        const { rows, risk, settings } = body;

        if (!rows || !risk || !Array.isArray(settings)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // Upsert configuration
        await prisma.plinkoConfiguration.upsert({
            where: {
                rows_risk: {
                    rows: rows,
                    risk: risk
                }
            },
            update: {
                settings: JSON.stringify(settings)
            },
            create: {
                rows: rows,
                risk: risk,
                settings: JSON.stringify(settings)
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating Plinko settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
