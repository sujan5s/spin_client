"use client";

import { cn } from "@/lib/utils";

interface BettingTableProps {
    onPlaceBet: (bet: string) => void;
    bets: { [key: string]: number };
    chipValue: number;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export default function BettingTable({ onPlaceBet, bets, chipValue }: BettingTableProps) {

    const Chip = ({ amount }: { amount: number }) => (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-yellow-500 border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-black z-10 pointer-events-none">
            {amount >= 1000 ? "1k+" : amount}
        </div>
    );

    const NumberCell = ({ num }: { num: number }) => {
        const isRed = RED_NUMBERS.includes(num);
        const betAmount = bets[num.toString()];

        return (
            <div
                onClick={() => onPlaceBet(num.toString())}
                className={cn(
                    "relative h-16 border border-zinc-700 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors hover:brightness-125 select-none",
                    isRed ? "bg-[#c0392b]" : "bg-[#2c3e50]"
                )}
            >
                <span className="text-white drop-shadow-md transform -rotate-90 md:rotate-0">{num}</span>
                {betAmount && <Chip amount={betAmount} />}
            </div>
        );
    };

    const SpecialCell = ({ label, code, className }: { label: string, code: string, className?: string }) => {
        const betAmount = bets[code];
        return (
            <div
                onClick={() => onPlaceBet(code)}
                className={cn(
                    "relative border border-zinc-700 flex items-center justify-center font-bold text-sm uppercase tracking-wider cursor-pointer hover:bg-zinc-700/50 transition-colors select-none text-zinc-300",
                    className
                )}
            >
                {label}
                {betAmount && <Chip amount={betAmount} />}
            </div>
        );
    };

    // Generate grid numbers
    // Row 3 (Top visually): 3, 6, ... 36
    const row3 = Array.from({ length: 12 }, (_, i) => (i + 1) * 3);
    // Row 2: 2, 5, ... 35
    const row2 = Array.from({ length: 12 }, (_, i) => (i * 3) + 2);
    // Row 1: 1, 4, ... 34
    const row1 = Array.from({ length: 12 }, (_, i) => (i * 3) + 1);

    return (
        <div className="min-w-[800px] select-none p-4">
            <div className="flex">
                {/* Zero */}
                <div
                    onClick={() => onPlaceBet("0")}
                    className="relative w-12 bg-green-700 border border-zinc-600 rounded-l-full flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:bg-green-600"
                >
                    0
                    {bets["0"] && <Chip amount={bets["0"]} />}
                </div>

                {/* Numbers Grid */}
                <div className="flex-1 flex flex-col">
                    <div className="grid grid-cols-12">
                        {row3.map(num => <NumberCell key={num} num={num} />)}
                    </div>
                    <div className="grid grid-cols-12">
                        {row2.map(num => <NumberCell key={num} num={num} />)}
                    </div>
                    <div className="grid grid-cols-12">
                        {row1.map(num => <NumberCell key={num} num={num} />)}
                    </div>
                </div>

                {/* 2 to 1 Columns */}
                <div className="w-12 flex flex-col">
                    <SpecialCell label="2:1" code="col3" className="h-16" />
                    <SpecialCell label="2:1" code="col2" className="h-16" />
                    <SpecialCell label="2:1" code="col1" className="h-16" />
                </div>
            </div>

            {/* Outside Bets */}
            <div className="ml-12 mr-12 h-16 grid grid-cols-3 border-l border-r border-zinc-700">
                <SpecialCell label="1st 12" code="1st12" />
                <SpecialCell label="2nd 12" code="2nd12" />
                <SpecialCell label="3rd 12" code="3rd12" />
            </div>

            <div className="ml-12 mr-12 h-16 grid grid-cols-6 border-l border-r border-b rounded-b-lg border-zinc-700">
                <SpecialCell label="1-18" code="low" />
                <SpecialCell label="Even" code="even" />
                <SpecialCell label="" code="red" className="bg-[#c0392b]" /> {/* Red Square */}
                <SpecialCell label="" code="black" className="bg-[#2c3e50]" /> {/* Black Square */}
                <SpecialCell label="Odd" code="odd" />
                <SpecialCell label="19-36" code="high" />
            </div>
        </div>
    );
}
