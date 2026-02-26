"use client";

import { useState, useEffect } from "react";
import { Ticket, Trophy, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import LuckyDrawPopup from "@/components/lucky-draw/LuckyDrawPopup";
import { toast } from "sonner";
import { TokenIcon } from "@/components/TokenIcon";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";

interface TicketData {
    id: number;
    tokenNumber: string;
    price: number;
    status: string; // active, won, lost
    purchasedAt: string;
}

const TICKET_PRICES = [10, 50, 200, 500];

export default function LuckyDrawPage() {
    const { balance } = useWallet();
    const { refreshUser } = useAuth();
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null); // price of ticket being bought
    const [error, setError] = useState<string | null>(null);
    const [popupData, setPopupData] = useState<{ isOpen: boolean, price: number } | null>(null);

    const fetchTickets = async () => {
        try {
            const res = await fetch("/api/lucky-draw/tickets");
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error("Failed to fetch tickets", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handlePurchase = async (price: number) => {
        if (balance < price) {
            setError(`Insufficient balance. You need ${price} to buy this ticket.`);
            setTimeout(() => setError(null), 3000);
            return;
        }

        setPurchaseLoading(price);
        setError(null);

        try {
            const res = await fetch("/api/lucky-draw/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: price }),
            });

            const data = await res.json();

            if (res.ok) {
                await refreshUser(); // Update balance in AuthContext
                await fetchTickets();

                // Show Popup
                setPopupData({ isOpen: true, price });

                // Show Toast
                toast.success("Ticket Purchased Successfully!");
            } else {
                setError(data.error || "Purchase failed");
                toast.error(data.error || "Purchase failed");
            }
        } catch (error) {
            console.error("Purchase error:", error);
            const msg = error instanceof Error ? error.message : "Something went wrong";
            setError(msg);
            toast.error(msg);
        } finally {
            setPurchaseLoading(null);
        }
    };

    const activeTickets = tickets.filter(t => t.status === "active");
    const pastTickets = tickets.filter(t => t.status !== "active");

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Ticket className="h-8 w-8 text-primary" /> Lucky Draw
                </h1>
                <p className="text-muted-foreground">Buy tickets for a chance to verify 2x your money!</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Purchase Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {TICKET_PRICES.map((price) => (
                    <div key={price} className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center hover:border-primary/50 transition-colors shadow-lg shadow-black/5 hover:shadow-primary/5 group">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <TokenIcon size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Ticket {price}</h3>
                        <p className="text-sm text-muted-foreground mb-6">Win up to <span className="text-green-500 font-bold">{price * 2}</span></p>

                        <button
                            onClick={() => handlePurchase(price)}
                            disabled={purchaseLoading !== null}
                            className="mt-auto w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {purchaseLoading === price ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy Ticket"}
                        </button>
                    </div>
                ))}
            </div>

            {/* My Active Tickets */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} /> My Active Tokens
                    </h2>
                    <span className="text-sm text-muted-foreground">{activeTickets.length} active</span>
                </div>

                {isLoading ? (
                    <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                ) : activeTickets.length === 0 ? (
                    <div className="bg-secondary/30 border border-border rounded-xl p-8 text-center text-muted-foreground">
                        You have no active tickets. Buy one above!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeTickets.map(ticket => (
                            <div key={ticket.id} className="bg-card border border-primary/30 rounded-lg p-4 flex items-center justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><Ticket className="h-16 w-16" /></div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Token Number</div>
                                    <div className="text-lg font-mono font-bold text-primary">{ticket.tokenNumber}</div>
                                </div>
                                <div className="text-right z-10">
                                    <div className="text-xs text-muted-foreground">Value</div>
                                    <div className="font-bold flex items-center justify-end gap-1"><TokenIcon size={14} />{ticket.price}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History */}
            {pastTickets.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-border">
                    <h2 className="text-xl font-bold">History</h2>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Token</th>
                                    <th className="px-6 py-3 font-medium">Price</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {pastTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-secondary/50">
                                        <td className="px-6 py-4">{new Date(ticket.purchasedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-mono">{ticket.tokenNumber}</td>
                                        <td className="px-6 py-4">{ticket.price}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'won' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {ticket.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* Success Popup */}
            {popupData && (
                <LuckyDrawPopup
                    isOpen={popupData.isOpen}
                    price={popupData.price}
                    onClose={() => setPopupData(null)}
                />
            )}
        </div>
    );
}
