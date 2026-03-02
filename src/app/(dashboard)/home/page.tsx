"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { TokenIcon } from "@/components/TokenIcon";
import { Gamepad2, Bomb, Crown, Dices, LayoutDashboard, Eye, Coins, Ticket, Wallet, CreditCard, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ALL_GAMES = [
    {
        name: "Spin & Win",
        href: "/spin",
        icon: Gamepad2,
        description: "Spin the wheel, multiply your bet.",
        color: "from-blue-600 to-cyan-500",
        shadow: "shadow-blue-500/20",
        border: "border-blue-500/20",
        gameKey: "spin",
    },
    {
        name: "Mines",
        href: "/mines",
        icon: Bomb,
        description: "Navigate the grid, dodge the mines.",
        color: "from-red-600 to-orange-500",
        shadow: "shadow-red-500/20",
        border: "border-red-500/20",
        gameKey: "mines",
    },
    {
        name: "Plinko",
        href: "/plinko",
        icon: LayoutDashboard,
        description: "Drop the ball and chase the multiplier.",
        color: "from-green-600 to-emerald-500",
        shadow: "shadow-green-500/20",
        border: "border-green-500/20",
        gameKey: "plinko",
    },
    {
        name: "Roulette",
        href: "/roulette",
        icon: Dices,
        description: "Bet on numbers, colors, or odds.",
        color: "from-purple-600 to-pink-500",
        shadow: "shadow-purple-500/20",
        border: "border-purple-500/20",
        gameKey: "roulette",
    },
    {
        name: "Slots",
        href: "/slots",
        icon: Coins,
        description: "Match symbols for a jackpot.",
        color: "from-yellow-500 to-orange-500",
        shadow: "shadow-yellow-500/20",
        border: "border-yellow-500/20",
        gameKey: "slots",
    },
    {
        name: "Dragon Tower",
        href: "/dragontower",
        icon: Crown,
        description: "Climb the tower, avoid the dragon.",
        color: "from-rose-600 to-red-700",
        shadow: "shadow-rose-500/20",
        border: "border-rose-500/20",
        gameKey: "dragontower",
    },
    {
        name: "3 Cup Shuffle",
        href: "/shuffle",
        icon: Eye,
        description: "Follow the ball, trust your instincts.",
        color: "from-indigo-600 to-blue-700",
        shadow: "shadow-indigo-500/20",
        border: "border-indigo-500/20",
        gameKey: "shuffle",
    },
    {
        name: "Lucky Draw",
        href: "/lucky-draw",
        icon: Ticket,
        description: "Buy a ticket, win the prize pool.",
        color: "from-amber-500 to-yellow-600",
        shadow: "shadow-amber-500/20",
        border: "border-amber-500/20",
        gameKey: "luckydraw",
    },
];

const QUICK_LINKS = [
    { name: "Add Funds", href: "/wallet", icon: Wallet, desc: "Deposit to your wallet", color: "text-primary" },
    { name: "Withdraw", href: "/withdraw", icon: CreditCard, desc: "Cash out your winnings", color: "text-green-400" },
    { name: "Dashboard", href: "/dashboard", icon: TrendingUp, desc: "View your stats", color: "text-accent" },
    { name: "Referral", href: "/referral", icon: Zap, desc: "Invite friends & earn", color: "text-yellow-400" },
];

const stagger = { visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function HomePage() {
    const { user } = useAuth();
    const { balance, bonusBalance } = useWallet();
    const { gamesEnabled } = useSystemSettings();

    const availableGames = ALL_GAMES.filter(game => gamesEnabled[game.gameKey] !== false);

    return (
        <div className="space-y-10 pb-10">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-accent/10 to-primary/5 border border-primary/20 p-6 md:p-8"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-0 pointer-events-none translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10">
                    <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4" /> GameVerse Platform
                    </p>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3">
                        Welcome back, {user?.name?.split(" ")[0] || "Gamer"}! 👋
                    </h1>
                    <p className="text-muted-foreground max-w-xl mb-5">
                        Ready to play? Check your balance, pick a game, and start winning. Your funds are secure and withdrawals are fast.
                    </p>
                    {/* Balance Pills */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-background/80 border border-border px-4 py-2 rounded-full">
                            <TokenIcon size={16} />
                            <span className="font-bold text-foreground">{balance.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">Main</span>
                        </div>
                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full">
                            <TokenIcon size={16} className="text-yellow-500" />
                            <span className="font-bold text-yellow-400">{bonusBalance.toFixed(2)}</span>
                            <span className="text-xs text-yellow-600">Bonus</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Links */}
            <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {QUICK_LINKS.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="flex flex-col gap-2 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                            <link.icon className={cn("h-6 w-6", link.color)} />
                            <span className="font-semibold text-foreground text-sm">{link.name}</span>
                            <span className="text-xs text-muted-foreground">{link.desc}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Game Selection */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">Choose a Game</h2>
                    <span className="text-sm text-muted-foreground">{availableGames.length} games available</span>
                </div>

                {availableGames.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
                        All games are currently disabled by the admin.
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                        {availableGames.map((game) => (
                            <motion.div key={game.name} variants={fadeUp}>
                                <Link
                                    href={game.href}
                                    className={cn(
                                        "group relative flex flex-col overflow-hidden rounded-2xl bg-card border transition-all hover:-translate-y-1 hover:shadow-xl",
                                        game.border, game.shadow
                                    )}
                                >
                                    {/* Gradient top bar */}
                                    <div className={cn("h-1 w-full bg-gradient-to-r", game.color)} />
                                    <div className="p-5 flex-1 flex flex-col gap-3">
                                        <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", game.color)}>
                                            <game.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground text-base mb-1">{game.name}</h3>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{game.description}</p>
                                        </div>
                                        <div className={cn("mt-auto text-xs font-bold flex items-center gap-1 bg-gradient-to-r bg-clip-text text-transparent", game.color)}>
                                            Play Now →
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
