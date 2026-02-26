import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Ticket, X } from "lucide-react";

interface LuckyDrawPopupProps {
    isOpen: boolean;
    onClose: () => void;
    price: number;
}

export default function LuckyDrawPopup({ isOpen, onClose, price }: LuckyDrawPopupProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={cn(
                            "relative w-full max-w-md p-8 rounded-3xl text-center shadow-2xl border-4 overflow-hidden",
                            "bg-gradient-to-br from-yellow-900/90 to-yellow-950/90 border-yellow-500/50"
                        )}
                    >
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 rounded-full bg-black/20 hover:bg-black/40 text-yellow-200/60 hover:text-yellow-100 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 space-y-4">
                            <div className="mx-auto w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4 ring-4 ring-yellow-500/30">
                                <Ticket className="w-10 h-10 text-yellow-400" />
                            </div>

                            <h3 className="text-3xl font-black text-yellow-400 uppercase italic tracking-wider drop-shadow-md">
                                Ticket Purchased!
                            </h3>

                            <p className="text-yellow-100/80 font-medium">
                                You have successfully entered the draw.
                            </p>

                            <div className="py-4">
                                <span className="text-5xl font-black text-white drop-shadow-lg">
                                    ${(price * 2).toFixed(2)}
                                </span>
                                <p className="text-yellow-200/60 text-sm font-bold uppercase tracking-widest mt-1">
                                    Potential Win
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black text-lg rounded-xl shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-[4px] transition-all uppercase tracking-wider"
                            >
                                Awesome!
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
