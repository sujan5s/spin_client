import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { SEGMENTS } from "@/lib/game-config";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        // Allow public access to GET settings so the game can load for users
        // const token = cookieStore.get("admin_token");

        // if (!token) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        // Fetch existing segments
        let segments = await prisma.spinSegment.findMany({
            orderBy: { id: 'asc' }
        });

        // Fetch max spins setting
        const settings = await prisma.spinGameSettings.findFirst();
        const maxSpinsPerDay = settings?.maxSpinsPerDay ?? 3;

        // Seed if empty
        if (segments.length === 0) {
            console.log("Seeding spin segments...");
            // Use transaction to ensure all or nothing
            await prisma.$transaction(
                SEGMENTS.map((segment) =>
                    // @ts-ignore
                    prisma.spinSegment.create({
                        data: {
                            label: segment.label,
                            value: segment.value,
                            color: segment.color,
                            textColor: segment.textColor,
                            probability: 10, // Default weight of 10
                            isVisible: true
                        }
                    })
                )
            );
            // @ts-ignore
            segments = await prisma.spinSegment.findMany({ orderBy: { id: 'asc' } });
        }

        return NextResponse.json({ segments, maxSpinsPerDay });
    } catch (error) {
        console.error("Error fetching spin settings:", error);
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
        const { segments, maxSpinsPerDay } = body;

        if (!Array.isArray(segments)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        // Update all segments in a transaction
        await prisma.$transaction(
            segments.map((segment: any) =>
                // @ts-ignore
                prisma.spinSegment.update({
                    where: { id: segment.id },
                    data: {
                        label: segment.label,
                        value: segment.value,
                        color: segment.color,
                        textColor: segment.textColor,
                        probability: parseInt(segment.probability), // Ensure it's an integer
                        isVisible: segment.isVisible
                    }
                })
            )
        );

        // Update Max Spins
        if (maxSpinsPerDay !== undefined) {
            // Check if settings exist
            const existing = await prisma.spinGameSettings.findFirst();
            if (existing) {
                await prisma.spinGameSettings.update({
                    where: { id: existing.id },
                    data: { maxSpinsPerDay: parseInt(maxSpinsPerDay) }
                });
            } else {
                await prisma.spinGameSettings.create({
                    data: { maxSpinsPerDay: parseInt(maxSpinsPerDay) }
                });
            }
        }

        return NextResponse.json({ success: true, message: "Settings updated successfully" });

    } catch (error) {
        console.error("Error updating spin settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
