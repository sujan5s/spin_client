"use client";

import { useRef, useEffect } from "react";
import { PLINKO_MULTIPLIERS } from "@/lib/plinko-config";

interface PlinkoCanvasProps {
    rows: number;
    risk: 'low' | 'medium' | 'high';
    balls: { id: string; path: number[]; multiplier: number; betAmount: number }[]; // Active balls
    onBallComplete: (id: string, multiplier: number, bet: number) => void;
}

export default function PlinkoCanvas({ rows, risk, balls, onBallComplete }: PlinkoCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeBalls = useRef<any[]>([]); // Store local animation state for balls

    // Sync props with ref
    useEffect(() => {
        // Add new balls that aren't in activeBalls yet
        balls.forEach(ball => {
            if (!activeBalls.current.find(b => b.id === ball.id)) {
                activeBalls.current.push({
                    ...ball,
                    x: 400, // Center (assuming 800 width)
                    y: 50,  // Top
                    rowIndex: 0, // Current row being processed
                    progress: 0, // 0 to 1 between rows
                    vx: 0,
                    vy: 0,
                    finished: false
                });
            }
        });
    }, [balls]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        const width = 600;
        const height = 450;

        // Config
        const startY = 50;
        const pinGapX = width / (rows + 4);
        const pinGapY = (height - 120) / rows;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw Pins
            ctx.fillStyle = "white";
            for (let r = 0; r < rows; r++) {
                const pinsInRow = r + 3; // First row has 3 pins usually? Or simple pyramid: Row 0 has 1 pin?
                // Standard Plinko: Row 0 has 3 pins.
                // Let's assume standard pyramid.
                // Row i has i + 3 pins.
                for (let c = 0; c < pinsInRow; c++) {
                    const x = width / 2 - ((pinsInRow - 1) * pinGapX) / 2 + c * pinGapX;
                    const y = startY + r * pinGapY;

                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    // Glow
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = "rgba(255,255,255,0.5)";
                }
            }
            ctx.shadowBlur = 0; // Reset

            // Draw Multipliers (Buckets)
            // @ts-ignore
            const multipliers = PLINKO_MULTIPLIERS[rows][risk];
            const bucketCount = rows + 1;
            const bucketY = startY + rows * pinGapY + 10;

            for (let i = 0; i < bucketCount; i++) {
                // Align buckets with the spaces between the last row's pins
                // Last row has (rows-1) + 3 pins = rows + 2 pins.
                // Spaces = rows + 1. Correct.

                const pinsInLastRow = rows + 2;
                // X calculation matches pin logic but shifted
                // The buckets are BETWEEN the pins of the imaginary next row
                const rowWidth = (pinsInLastRow - 1) * pinGapX;
                const startX = width / 2 - rowWidth / 2;
                const x = startX + i * pinGapX; // Between pins? No, this aligns with pins.
                // Wait, Plinko balls fall INTO gaps.
                // A pyramid of size N rows produces N+1 buckets.
                // The last row of pins helps divert to these buckets.
                // The buckets are centered under the gaps.

                // Let's just use the pin X logic for "Row = rows" (which is virtual)
                const bucketEffectiveRow = rows; // virtual
                const bucketPins = bucketEffectiveRow + 3; // virtual pins width

                // Center check:
                const xPos = width / 2 - ((bucketCount - 1) * pinGapX) / 2 + i * pinGapX;

                // Color Gradient based on value
                const val = multipliers[i];
                let color = "#22c55e"; // Green
                if (val > 2) color = "#eab308"; // Yellow
                if (val > 10) color = "#ef4444"; // Red

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.roundRect(xPos - pinGapX / 2 + 2, bucketY, pinGapX - 4, 30, 4);
                ctx.fill();

                ctx.fillStyle = "black";
                ctx.font = "bold 10px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`${val}x`, xPos, bucketY + 15);
            }

            // Update & Draw Balls
            activeBalls.current.forEach(ball => {
                if (ball.finished) return;

                // Physics Simulation (Simplified Route Following)
                // We interpolate from current pin to next pin based on path[rowIndex]

                // Current Target Logic
                // If rowIndex < rows
                // Current pin is at Row `ball.rowIndex`.
                // The ball effectively hit a pin at this row.
                // We need to animate falling to the next row.

                // Let's verify start pos. x=400, y=50.
                // Row 0 Y = startY = 80.
                // So initial drop is to Row 0.

                // Simplified:
                // We treat "levels".
                // Level -1: Spawner.
                // Level 0 to rows-1: Pins.
                // Level rows: Bucket.

                const speed = 0.05; // speed factor
                ball.progress += speed;

                if (ball.progress >= 1) {
                    ball.progress = 0;
                    ball.rowIndex++;

                    // Bounce sound?
                }

                if (ball.rowIndex > rows) {
                    ball.finished = true;
                    onBallComplete(ball.id, ball.multiplier, ball.betAmount);
                    return;
                }

                // Calculate Position
                // We need Start Point (Prev Row Pin) and End Point (Next Row Pin)

                // Virtual pin mapping
                // For a ball at "index" usually position in array.
                // Initially ball index = 0 (Center path effectively).
                // Actually tracking "current column index" is easier.
                // Start at index 0 (relative to center?).
                // Path: 0 (Left) -> index unchanged (visually left). 
                // 1 (Right) -> index + 1.

                // Wait. 
                // Row 0 has 3 pins: indices 0, 1, 2. Ball drops on Pin 1 (Center).
                // If Left (0), goes between Pin 1 and 0? No, hitting pin 1 deflects left.
                // Standard logic:
                // Ball hits pin (r, c).
                // Go Left -> Next pin is (r+1, c).
                // Go Right -> Next Pin is (r+1, c+1).

                // Initial state: Ball is falling onto the "Apex" pin?
                // Or Plinko usually has 1 pin at top?
                // My drawing logic: `pinsInRow = r + 3`. Row 0 has 3 pins.
                // That's a wide top. Usually row 0 has 1 pin?
                // If Row 0 has 3 pins, the ball must spawn above the middle one.

                // Let's calculate coords
                const getPinPos = (r: number, c: number) => {
                    const pinsInRow = r + 3;
                    const x = width / 2 - ((pinsInRow - 1) * pinGapX) / 2 + c * pinGapX;
                    const y = startY + r * pinGapY;
                    return { x, y };
                };

                // Calculate "Path So Far" to determine current column
                // path slice(0, rowIndex) sum?
                // Start Col: Intended to be Middle of Row 0.
                // Row 0 pins: 3. Middle is index 1.
                const startCol = 1;

                // Current Col (at start of this hop)
                const pathSoFar = ball.path.slice(0, ball.rowIndex);
                const currentCol = startCol + pathSoFar.reduce((a: number, b: number) => a + b, 0);

                // Next Col
                const nextDir = ball.rowIndex < rows ? ball.path[ball.rowIndex] : 0; // 0 or 1
                // Wait. If rowIndex == rows (Bucket), we don't need next dir.

                const nextCol = currentCol + (ball.rowIndex < rows ? nextDir : 0);

                // Interpolate
                // Start Pos
                let p1, p2;

                if (ball.rowIndex === 0) {
                    // Drop from spawner to first pin
                    p1 = { x: 400, y: 0 };
                    p2 = getPinPos(0, 1);
                } else if (ball.rowIndex <= rows) {
                    p1 = getPinPos(ball.rowIndex - 1, currentCol);

                    if (ball.rowIndex === rows) {
                        // Fall to bucket
                        // Bucket Y
                        const bY = bucketY + 15;
                        // Match bucket X
                        const pinsInLast = rows + 2;
                        const rowWidth = (pinsInLast - 1) * pinGapX;
                        const startX = width / 2 - rowWidth / 2;
                        // The column index calculation matches the bucket index logic?
                        // StartCol was 1. 
                        // Check: 16 rows. Path all 0s. 
                        // Final Col = 1.
                        // But bucket 0 is at far left. Bucket index should be 0.
                        // My startCol offset is creating issues.
                        // If Row 0 has 1 pin. index 0.
                        // Start index 0.
                        // Path sum = final index. Matches PLINKO_MULTIPLIERS logic.

                        // REVISING PIN LAYOUT FOR SIMPLICITY:
                        // Row 0 has 3 pins is weird. Let's make Row 0 have 3 pins but spawning targets the middle one?
                        // Actually, standard Plinko Pyramid:
                        // Row 0: 3 pins.
                        // Row 1: 4 pins.
                        // It works.
                        // My multiplier logic (`resultIndex = sum(rights)`) assumes a pure binary tree (1 pin at top).
                        // 1 pin at top -> Row 0 (1 pin). Row 1 (2 pins).
                        // If I draw 3 pins at top, I have to ensure the math aligns.

                        // Let's stick to the VISUAL that matches the MATH.
                        // Math: 1 pin top.
                        // Visual: Draw `r + 3` pins? No, change to `r + 1` pins?
                        // If Row 0 has 1 pin. X is center.
                        // Row 1 has 2 pins.
                        // This matches math perfectly.

                        const finalIndex = currentCol - 1; // Correction if I shift drawing
                        // Wait, if I change drawing to `pinsInRow = r + 1` (Standard Pyramid)
                        // then StartCol = 0 (Center Pin).
                        // Let's re-write drawing logic in this render loop.
                    }
                }

                // REDO DRAWING LOGIC IN PLACE to match Math (r+1 pins)
                const getStandardPinPos = (r: number, c: number) => {
                    // r=0 -> 3 pins (visual padding) or 1?
                    // Let's do Standard: r=0 has 3 pins (Pyramid with cutoff top?)
                    // If math is `sum(rights)`, it implies a single start point branching out.
                    // The visual root must be 1 pin (or valid bounce point).

                    // Let's Visual = Math.
                    // Row 0: 1 Pin. (x=center)
                    // Row 1: 2 Pins.
                    const pinsInRowNow = r + 3; // Keep the wide look but spawn in middle
                    // Middle of 3 is index 1.
                    const x = width / 2 - ((pinsInRowNow - 1) * pinGapX) / 2 + c * pinGapX;
                    const y = startY + r * pinGapY;
                    return { x, y };
                };

                // Logic Adjustment:
                // Start (Row -1): Spawner (400, 20).
                // Row 0: Pin 1 (Center).
                // Hop 1: Row 0 pin 1 -> Row 1 pin (1 or 2).

                let startPos, endPos;

                // RowIndex represents "Target Row we are falling TO"
                if (ball.rowIndex === 0) {
                    // Falling to first pin (Row 0, Col 1)
                    startPos = { x: 400, y: 20 };
                    endPos = getStandardPinPos(0, 1);
                } else if (ball.rowIndex <= rows) {
                    // Falling FROM Row (rowIndex-1) TO (rowIndex)
                    // Determine Col at Row-1
                    const prevPath = ball.path.slice(0, ball.rowIndex - 1);
                    const prevCol = 1 + prevPath.reduce((a: number, b: number) => a + b, 0);

                    startPos = getStandardPinPos(ball.rowIndex - 1, prevCol);

                    if (ball.rowIndex === rows) {
                        // Falling to Bucket
                        const currentPath = ball.path; // all
                        const finalCol = 1 + currentPath.reduce((a: number, b: number) => a + b, 0);
                        // Convert col to bucket X
                        // Bucket index 0 corresponds to far left path?
                        // If path is all Left (0), finalCol is 1.
                        // Bucket corresponding to "0 rights" should be index 0.
                        // So Bucket Index = FinalCol - 1.

                        const bucketIndex = finalCol - 1;
                        // Bucket X calculation from earlier:
                        const pinsInLastRow = rows + 2; // (rows-1) + 3
                        const rowWidth = (pinsInLastRow - 1) * pinGapX;
                        const startX = width / 2 - rowWidth / 2;
                        const tx = startX + bucketIndex * pinGapX;
                        endPos = { x: tx, y: bucketY + 15 };
                    } else {
                        // Falling to next pin
                        const dir = ball.path[ball.rowIndex - 1]; // Direction taken from Prev to Curr
                        const currCol = prevCol + dir;
                        endPos = getStandardPinPos(ball.rowIndex, currCol);
                    }
                }

                // Quadratic Bezier for "Bounce"
                // Control point is mid-way X and slightly higher Y (arc)
                // Use `ball.progress` (0 to 1) for T.
                // B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2

                if (startPos && endPos) {
                    const cX = (startPos.x + endPos.x) / 2;
                    const cY = startPos.y - 15; // Arc height

                    const t = ball.progress;
                    const bx = (1 - t) * (1 - t) * startPos.x + 2 * (1 - t) * t * cX + t * t * endPos.x;
                    const by = (1 - t) * (1 - t) * startPos.y + 2 * (1 - t) * t * cY + t * t * endPos.y;

                    ctx.beginPath();
                    ctx.arc(bx, by, 6, 0, Math.PI * 2);
                    ctx.fillStyle = "#ef4444"; // Red Ball
                    ctx.fill();
                }

            });

            animationId = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(animationId);
    }, [rows, risk]);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={450}
            className="w-full h-auto max-w-[800px] border border-zinc-700 rounded-xl bg-[#0a0a0a] shadow-2xl"
        />
    );
}
