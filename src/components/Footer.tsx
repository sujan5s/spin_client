import Link from "next/link";
import { Gamepad2, Instagram, Mail, Shield } from "lucide-react";

export default function Footer() {
    const year = 2026;

    return (
        <footer className="bg-zinc-950 border-t border-zinc-800/60 text-zinc-400 text-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1 space-y-3">
                        <div className="flex items-center gap-2">
                            <Gamepad2 className="h-6 w-6 text-[#00ff9d]" />
                            <span className="text-xl font-black bg-gradient-to-r from-[#00ff9d] to-[#00e5ff] bg-clip-text text-transparent">
                                GAMEVERSE
                            </span>
                        </div>
                        <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
                            The ultimate gaming platform with provably fair games, instant deposits, and fast KYC withdrawals.
                        </p>
                        <div className="flex gap-3 pt-1">
                            <a href="#" aria-label="Instagram" className="hover:text-[#00ff9d] transition-colors"><Instagram className="h-4 w-4" /></a>
                            <a href="mailto:support@gameverse.com" aria-label="Email" className="hover:text-[#00ff9d] transition-colors"><Mail className="h-4 w-4" /></a>
                        </div>
                    </div>

                    {/* Games */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Games</h3>
                        <ul className="space-y-2">
                            {[
                                { label: "Spin & Win", href: "/spin" },
                                { label: "Mines", href: "/mines" },
                                { label: "Plinko", href: "/plinko" },
                                { label: "Roulette", href: "/roulette" },
                                { label: "Slots", href: "/slots" },
                                { label: "Dragon Tower", href: "/dragontower" },
                            ].map(g => (
                                <li key={g.label}>
                                    <Link href={g.href} className="hover:text-[#00ff9d] transition-colors">{g.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Account</h3>
                        <ul className="space-y-2">
                            {[
                                { label: "Dashboard", href: "/home" },
                                { label: "Wallet", href: "/wallet" },
                                { label: "Withdraw", href: "/withdraw" },
                                { label: "Referral", href: "/referral" },
                                { label: "Settings", href: "/settings" },
                            ].map(l => (
                                <li key={l.label}>
                                    <Link href={l.href} className="hover:text-[#00ff9d] transition-colors">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Legal</h3>
                        <ul className="space-y-2">
                            {[
                                { label: "Privacy Policy", href: "/privacy-policy" },
                                { label: "Terms of Service", href: "/terms-of-service" },
                                { label: "Responsible Gaming", href: "/responsible-gaming" },
                                { label: "Cookie Policy", href: "/cookie-policy" },
                            ].map(l => (
                                <li key={l.label}>
                                    <Link href={l.href} className="hover:text-[#00ff9d] transition-colors">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Divider + Copyright */}
                <div className="border-t border-zinc-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-zinc-600 text-xs">
                        © {year} GameVerse. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <Shield className="h-3.5 w-3.5 text-[#00ff9d]" />
                        Provably fair · Secure · 18+ only
                    </div>
                </div>
            </div>
        </footer>
    );
}
