"use client";

import Link from "next/link";
import { Gamepad2, ArrowRight, Wallet, Trophy, ShieldCheck, Zap, Coins, Dices, Bomb, Crown, Eye, LayoutDashboard, Ticket } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

const GAMES = [
  { name: "Spin & Win", icon: Gamepad2, desc: "Spin the classic wheel to multiply your bet instantly.", color: "from-blue-500 to-cyan-400" },
  { name: "Mines", icon: Bomb, desc: "Navigate the grid. Uncover gems to boost your multiplier while dodging hidden mines.", color: "from-red-500 to-orange-400" },
  { name: "Plinko", icon: LayoutDashboard, desc: "Drop the ball and watch it bounce down the pegs to a massive multiplier slot.", color: "from-green-500 to-emerald-400" },
  { name: "Roulette", icon: Dices, desc: "Place your bets on numbers or colors and let the wheel decide your fate.", color: "from-purple-500 to-pink-400" },
  { name: "Slots", icon: Coins, desc: "Match identical symbols across the reels for massive jackpot payouts.", color: "from-yellow-400 to-orange-500" },
  { name: "Dragon Tower", icon: Crown, desc: "Ascend the mythical tower by picking the safe eggs. One wrong move and the dragon wakes.", color: "from-rose-500 to-red-600" },
  { name: "3 Cup Shuffle", icon: Eye, desc: "Keep your eye on the ball. Guess the correct cup after the shuffle to win.", color: "from-indigo-500 to-blue-600" },
  { name: "Lucky Draw", icon: Ticket, desc: "Buy tickets and wait for the countdown. Win life-changing guaranteed prize pools.", color: "from-amber-400 to-yellow-600" },
];

const BENEFITS = [
  { title: "Double Balance System", icon: Wallet, desc: "Unique Main & Bonus balance split. We give you a 50% head start on deposits to play longer!" },
  { title: "Secure Withdrawals", icon: Zap, desc: "Verify your KYC once and request lightning-fast manual withdrawals to UPI or Bank Accounts." },
  { title: "Provably Fair Logic", icon: ShieldCheck, desc: "All our games use cryptographically secure random number generation. Play with complete peace of mind." },
  { title: "Exclusive Rewards", icon: Trophy, desc: "Earn generous referral bonuses, daily login streaks, and exclusive high roller perks." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative font-sans">

      {/* Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] mix-blend-screen" style={{ animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite 2s" }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] bg-secondary/30 rounded-full blur-[150px] mix-blend-screen animate-pulse"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-6 max-w-7xl mx-auto backdrop-blur-md bg-background/50 border-b border-border/50 sticky top-0 rounded-b-2xl">
        <div className="flex items-center space-x-3">
          <Gamepad2 className="h-8 w-8 text-primary shadow-primary/50 drop-shadow-lg" />
          <span className="text-2xl font-black tracking-tighter bg-gradient-to-br from-white via-primary/80 to-accent bg-clip-text text-transparent">
            GAMEVERSE
          </span>
        </div>
        <div className="space-x-4 flex items-center">
          <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-white transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-full font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] transition-all hover:-translate-y-0.5"
          >
            Play Now
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center">

        {/* HERO SECTION */}
        <section className="w-full max-w-7xl mx-auto px-6 pt-24 pb-24 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto">
            <motion.div variants={fadeIn} className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md">
              <span className="text-sm font-bold text-primary flex items-center gap-2">
                <Zap className="h-4 w-4" /> Welcome to the Next Generation of iGaming
              </span>
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
              Play Games. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-accent drop-shadow-sm">
                Multiply Your Wealth.
              </span>
            </motion.h1>

            <motion.p variants={fadeIn} className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
              Experience the ultimate thrill with our provably fair minigames. Deposit securely, utilize our unique Double Balance system, and request secure withdrawals to your bank.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-10 py-5 bg-white text-black text-lg font-black rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                Create Free Account <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
              <Link
                href="#games"
                className="w-full sm:w-auto px-10 py-5 bg-secondary/80 backdrop-blur-md text-white text-lg font-bold rounded-full hover:bg-secondary border border-white/10 transition-all flex items-center justify-center"
              >
                Explore Games
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* STATS DIVIDER */}
        <section className="w-full bg-black/40 border-y border-white/5 backdrop-blur-xl py-12 mb-32 hidden sm:block">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
            <div>
              <p className="text-4xl font-black text-white mb-1">8+</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Original Games</p>
            </div>
            <div>
              <p className="text-4xl font-black text-primary mb-1">50%</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Bonus on Deposits</p>
            </div>
            <div>
              <p className="text-4xl font-black text-green-400 mb-1">&lt;24hr</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Approval Time</p>
            </div>
            <div>
              <p className="text-4xl font-black text-accent mb-1">100%</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Provably Fair</p>
            </div>
          </div>
        </section>

        {/* GAMES SHOWCASE */}
        <section id="games" className="w-full max-w-7xl mx-auto px-6 pb-32 pt-10 sm:pt-0">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Our Premium <span className="text-primary">Originals</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Immersive, high RTP games designed specifically for maximum entertainment and massive multipliers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {GAMES.map((game, idx) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1 }}
                className="group relative overflow-hidden rounded-3xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${game.color} transition-opacity duration-500`}></div>
                <div className="p-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${game.color} shadow-lg`}>
                    <game.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{game.name}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{game.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* WHY CHOOSE US / BENEFITS */}
        <section className="w-full bg-secondary/30 border-t border-white/5 py-24 sm:py-32 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/2">
                <h2 className="text-4xl md:text-6xl font-black leading-tight mb-6">Built For <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Players.</span> Evaluated by <span className="text-white">Experts.</span></h2>
                <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                  We refused to build just another generic casino. GameVerse processes massive volume daily by offering unmatched transparency, KYC-verified withdrawals via UPI & Bank Transfers, and an industry-first proprietary Bonus Wallet system.
                </p>
                <Link href="/signup" className="inline-flex items-center text-primary font-bold hover:text-white transition-colors group text-lg">
                  Experience the difference <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                {BENEFITS.map((benefit, idx) => (
                  <div key={idx} className="bg-background/80 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                    <benefit.icon className="h-10 w-10 text-primary mb-5" />
                    <h4 className="text-xl font-bold mb-3">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-[3rem] blur-3xl -z-10 opacity-50"></div>
          <h2 className="text-4xl sm:text-5xl font-black mb-8 leading-tight">Ready to multiply your fortune?</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join the fastest growing iGaming platform today. Sign up in seconds, deposit instantly, and let the games begin.
          </p>
          <Link
            href="/signup"
            className="px-10 sm:px-12 py-5 sm:py-6 bg-gradient-to-r from-primary to-accent text-white text-lg sm:text-xl font-black rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] transition-all transform hover:scale-105 inline-block"
          >
            Claim Your 50% Welcome Bonus
          </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-border bg-black/50 py-12 mt-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2 opacity-50">
            <Gamepad2 className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tighter">GAMEVERSE</span>
          </div>
          <p className="text-muted-foreground text-sm opacity-50 text-center md:text-left">
            © 2026 GameVerse Ltd. All rights reserved. Play responsibly. 18+ only.
          </p>
        </div>
      </footer>
    </div>
  );
}
