import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        const userId = Number(payload.userId);

        const body = await request.json();
        const { betAmount } = body;

        // Enforce minimum bet of 10
        if (!betAmount || betAmount < 10) {
            return NextResponse.json({ error: "Minimum bet is 10" }, { status: 400 });
        }

        // Logic:
        // 1. Deduct balance
        // 2. Generate Winning Cup (0, 1, 2)
        // 3. Create Game Record
        // Return winning cup immediately? 
        // YES. The client needs to know where the ball IS to animate the shuffling correctly (or at least where it ends up).
        // To prevent cheating, we could just return "success" and reveal later?
        // But for this simple version, we return the winning cup so the frontend can animate the ball going to that cup.
        // If the user inspects network, they can see the winner. 
        // Proper way: Client animates shuffle randomly. User picks. Client sends pick to server. server checks against DB.
        // Let's do the proper way.

        // WAIT. If we do proper way, we need two endpoints.
        // Endpoint 1: Create Game. Deduct Balance. Server RNGs Winner. Returns GameID.
        // Endpoint 2: Reveal. User sends GameID + Selected. Server checks. Returns Result.

        // However, standard simplified flow for these portfolio apps often just does one request if the animation is deterministic or if we trust client (bad).
        // Let's do the "Reveal" flow. 
        // Actually, for "Shuffle", the user watches the shuffle THEN picks.
        // So the server must determine the winner BEFORE the shuffle starts? Or After?
        // Server determines winner at start.
        // Frontend receives GameID (and maybe a hash of the winner for fairness).
        // Frontend shuffles. 
        // Wait, if frontend shuffles, frontend DECIDES where the ball goes visually.
        // If frontend decides, then frontend knows the winner.
        // So frontend must tell server "I picked Cup X".
        // Server checks "Was Cup X the winner?".
        // But how does Server know where the ball went if Frontend shuffled it randomly?
        // The server says "The ball is in Cup 1".
        // Frontend must make sure the animation ends with ball in Cup 1.
        // So Server MUST tell Frontend "Ball is in Cup 1" at the start (encrypted/hidden or just visible).
        // If we want to hide it from Network tab, we need a "Commit/Reveal" scheme or just accept it's a simple game.
        // Given the instructions "keep logic same as stake", Stake behaves like this:
        // You bet. Animation happens. You pick.
        // If you inspect network on Stake, you usually can't see the result until you pick.
        // This implies the server sends the result AFTER you pick.
        // But then how does the animation know where the ball is?
        // The animation is VISUAL only. The "shuffle" might be fake? 
        // No, if I track the ball with my eyes, and I pick the right cup, I should win.
        // This means the visual state MUST match the server state.

        // SIMPLE SOLUTION:
        // 1. Single API call `play`.
        // 2. Returns `winningCup` (0, 1, 2).
        // 3. Frontend animates the ball ending up in `winningCup`.
        // 4. User strictly follows the animation with their eyes.
        // 5. User clicks. Frontend checks if clicked == winningCup.
        // 6. Verification happens on server? No, if we send result to server "I won", that's insecure.
        // 
        // SECURE SOLUTION:
        // 1. `create`: Bet. Server picks `winningCup`. Stores in DB. Returns `gameId` + `encryptedString(winningCup)`.
        // 2. Frontend animates shuffle. The Frontend **Predetermines** the shuffle path to ensure ball ends at `winningCup`.
        //    (Wait, if Frontend knows where ball ends, it needs `winningCup` in plain text).
        //    So `winningCup` MUST be sent to client.
        //    So Network Inspector CAN see it.
        //    This is acceptable for this level of app.

        const winningCup = Math.floor(Math.random() * 3); // 0, 1, 2
        const multiplier = 2.90; // Standard ~33% odds with house edge

        // Transaction
        const transactionResult = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");
            if (user.balance < betAmount) throw new Error("Insufficient funds");

            // Deduct bet
            await tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: betAmount } }
            });

            // Create Game
            const game = await tx.shuffleGame.create({
                data: {
                    userId,
                    betAmount,
                    winningCup,
                    status: "active",
                    multiplier
                }
            });

            return { game, balance: user.balance - betAmount };
        });

        return NextResponse.json({
            gameId: transactionResult.game.id,
            winningCup,
            balance: transactionResult.balance
        });

    } catch (error: any) {
        console.error("Shuffle Create Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    // This endpoint handles the "Cashout" or "Reveal" verification if we wanted 2-step.
    // But for this UI (User picks cup -> Win/Loss), we can just handle the win payout here.
    // Flow:
    // 1. POST /create -> Returns winningCup.
    // 2. Frontend plays animation ensuring ball goes to winningCup.
    // 3. User clicks cup.
    // 4. Frontend knows if it's a win or loss immediately.
    // 5. IF WIN: Call PUT /reveal to claim prize? 
    //    Actually, better to claim on server.
    //    Let's make it 2-step for security/balance.
    //    If we just show the result and update balance in step 1, the user might close browser before animation ends and be confused why balance changed.
    //    But if they lose, balance is already gone.
    //    If they win, they need the money.

    // Better Flow (Atomic):
    // 1. POST /create -> Returns winningCup. Balance deducted.
    // 2. Frontend Animates.
    // 3. User Clicks.
    // 4. POST /complete -> User sends { gameId, selectedCup }. 
    //    Server verifies. If match, add winnings.

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        const userId = Number(payload.userId);

        const body = await request.json();
        const { gameId, selectedCup } = body;

        const game = await prisma.shuffleGame.findUnique({ where: { id: gameId } });
        if (!game || game.userId !== userId || game.status !== "active") {
            return NextResponse.json({ error: "Invalid game" }, { status: 400 });
        }

        let winAmount = 0;
        let status = "lost";

        if (game.winningCup === selectedCup) {
            status = "won";
            winAmount = game.betAmount * game.multiplier;
        }

        const transactionResult = await prisma.$transaction(async (tx) => {
            // Update Game
            await tx.shuffleGame.update({
                where: { id: gameId },
                data: { status, selectedCup, payout: winAmount }
            });

            // Update User
            let newBalance = 0;
            if (winAmount > 0) {
                const u = await tx.user.update({
                    where: { id: userId },
                    data: { balance: { increment: winAmount } }
                });
                newBalance = u.balance;

                // Transaction Record
                await tx.transaction.create({
                    data: {
                        userId,
                        amount: winAmount,
                        type: "game_win"
                    }
                });
            } else {
                const u = await tx.user.findUnique({ where: { id: userId } });
                newBalance = u?.balance || 0;
            }

            return newBalance;
        });

        return NextResponse.json({
            status,
            winAmount,
            balance: transactionResult
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Error finishing game" }, { status: 500 });
    }
}
