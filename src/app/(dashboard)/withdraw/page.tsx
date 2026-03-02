"use client";

import { useState, useRef } from "react";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, Wallet, CheckCircle, AlertCircle, ArrowRight, UploadCloud, FileType, Check, Clock } from "lucide-react";
import { TokenIcon } from "@/components/TokenIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function WithdrawPage() {
    const { user, refreshUser } = useAuth();
    const { balance, withdrawFunds, transactions, withdrawalRequests } = useWallet();
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Withdrawal Flow State
    const [step, setStep] = useState<"AMOUNT" | "PAYMENT">("AMOUNT");
    const [paymentMethod, setPaymentMethod] = useState<"UPI" | "BANK">("UPI");
    const [upiId, setUpiId] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");

    // KYC Upload State
    const [kycFile, setKycFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [kycError, setKycError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProcessAmount = () => {
        const amount = selectedAmount || parseFloat(customAmount);
        if (!amount || amount <= 0) return;

        if (amount > balance) {
            setError("Insufficient balance");
            return;
        }

        setError(null);
        setStep("PAYMENT");
    };

    const handleWithdraw = async () => {
        const amount = selectedAmount || parseFloat(customAmount);

        setIsProcessing(true);
        setError(null);
        try {
            await withdrawFunds(amount, paymentMethod, {
                upiId: paymentMethod === "UPI" ? upiId : undefined,
                accountNumber: paymentMethod === "BANK" ? accountNumber : undefined,
                ifscCode: paymentMethod === "BANK" ? ifscCode : undefined,
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setStep("AMOUNT");
                setSelectedAmount(null);
                setCustomAmount("");
            }, 5000);
        } catch (err: any) {
            setError(err.message || "Failed to withdraw funds");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKycUpload = async () => {
        if (!kycFile) {
            setKycError("Please select a document to upload.");
            return;
        }

        setIsUploading(true);
        setKycError(null);
        try {
            const formData = new FormData();
            formData.append("file", kycFile);

            const res = await fetch("/api/user/kyc", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to upload document");
            }

            toast.success("Document uploaded successfully! Verification is pending.");
            await refreshUser();
        } catch (err: any) {
            setKycError(err.message || "An error occurred during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    const kycStatus = user?.kycStatus || "UNVERIFIED";

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Withdraw Funds</h1>
                <p className="text-muted-foreground">Cash out your winnings securely</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Balance Card */}
                <div className="p-8 bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 rounded-2xl flex flex-col justify-between h-64 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="h-32 w-32" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-muted-foreground">Available to Withdraw</h3>
                        <div className="text-5xl font-bold text-foreground mt-2 flex items-center gap-2"><TokenIcon size={40} />{balance.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle className="h-4 w-4" /> Verified Account
                    </div>
                </div>

                {/* Action Area based on KYC Status */}
                {kycStatus === "UNVERIFIED" || kycStatus === "REJECTED" ? (
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" /> KYC Verification Required
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {kycStatus === "REJECTED"
                                ? "Your previous document was rejected. Please upload a clear photo of your Aadhaar Card, PAN Card, or Driving License to proceed."
                                : "To comply with regulations and enable withdrawals, please upload a clear photo of your Aadhaar Card, PAN Card, or Driving License."}
                        </p>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg, image/png, image/webp, application/pdf"
                            onChange={(e) => setKycFile(e.target.files?.[0] || null)}
                        />

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer mb-6 text-center group bg-secondary/20"
                        >
                            <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud className="h-8 w-8 text-primary" />
                            </div>
                            {kycFile ? (
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <FileType className="h-5 w-5 text-primary" />
                                    {kycFile.name}
                                    <Check className="h-4 w-4 text-green-500 ml-2" />
                                </div>
                            ) : (
                                <>
                                    <p className="font-bold text-foreground">Click to upload document</p>
                                    <p className="text-sm text-muted-foreground mt-1">Supports JPG, PNG, WEBP, or PDF</p>
                                </>
                            )}
                        </div>

                        {kycError && (
                            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" /> {kycError}
                            </div>
                        )}

                        <button
                            onClick={handleKycUpload}
                            disabled={isUploading || !kycFile}
                            className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isUploading ? "Uploading..." : "Submit for Verification"}
                        </button>
                    </div>
                ) : kycStatus === "PENDING" ? (
                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="bg-yellow-500/10 p-6 rounded-full mb-6">
                            <Clock className="h-12 w-12 text-yellow-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Verification in Progress</h3>
                        <p className="text-muted-foreground max-w-sm">
                            Your KYC document is currently being reviewed by our team. This usually takes just a few hours. Withdrawals will be unlocked once approved.
                        </p>
                    </div>
                ) : success ? (
                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="bg-green-500/10 p-6 rounded-full mb-6 relative">
                            <Clock className="h-12 w-12 text-green-500 absolute top-2 right-2 opacity-50" />
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Withdrawal Requested</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            Your withdrawal is requested and is approved within 24 hrs. Please check your transaction history for updates.
                        </p>
                        <button
                            onClick={() => {
                                setSuccess(false);
                                setStep("AMOUNT");
                                setSelectedAmount(null);
                                setCustomAmount("");
                            }}
                            className="w-full py-4 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-all"
                        >
                            Return to Wallet
                        </button>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
                        {step === "AMOUNT" ? (
                            <>
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" /> Withdraw Amount
                                </h3>

                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {AMOUNTS.map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => {
                                                setSelectedAmount(amount);
                                                setCustomAmount("");
                                                setError(null);
                                            }}
                                            className={cn(
                                                "py-3 px-4 rounded-lg border font-medium transition-all",
                                                selectedAmount === amount
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-secondary/50 border-border hover:border-primary/50 text-foreground"
                                            )}
                                        >
                                            <TokenIcon size={14} className="mr-1" />{amount}
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Custom Amount
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            <TokenIcon size={16} />
                                        </span>
                                        <input
                                            type="number"
                                            value={customAmount}
                                            onChange={(e) => {
                                                setCustomAmount(e.target.value);
                                                setSelectedAmount(null);
                                                setError(null);
                                            }}
                                            className="w-full pl-8 pr-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                                        <AlertCircle className="h-4 w-4" /> {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleProcessAmount}
                                    disabled={!selectedAmount && !customAmount}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    Process <ArrowRight className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setStep("AMOUNT")} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
                                    ← Back
                                </button>
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-primary" /> Payment Details
                                </h3>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <button
                                        onClick={() => setPaymentMethod("UPI")}
                                        className={cn(
                                            "py-3 px-4 rounded-lg border font-medium transition-all text-center",
                                            paymentMethod === "UPI"
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-secondary/50 border-border hover:border-primary/50 text-foreground"
                                        )}
                                    >
                                        UPI
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod("BANK")}
                                        className={cn(
                                            "py-3 px-4 rounded-lg border font-medium transition-all text-center",
                                            paymentMethod === "BANK"
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-secondary/50 border-border hover:border-primary/50 text-foreground"
                                        )}
                                    >
                                        Bank Transfer
                                    </button>
                                </div>

                                {paymentMethod === "UPI" ? (
                                    <div className="mb-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-muted-foreground mb-2">UPI ID</label>
                                            <input
                                                type="text"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                                placeholder="username@upi"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-muted-foreground mb-2">Account Number</label>
                                            <input
                                                type="text"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                                placeholder="0000 0000 0000 0000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-muted-foreground mb-2">IFSC Code</label>
                                            <input
                                                type="text"
                                                value={ifscCode}
                                                onChange={(e) => setIfscCode(e.target.value)}
                                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                                placeholder="SBIN0000001"
                                            />
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                                        <AlertCircle className="h-4 w-4" /> {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleWithdraw}
                                    disabled={isProcessing || (paymentMethod === "UPI" && !upiId) || (paymentMethod === "BANK" && (!accountNumber || !ifscCode))}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? "Processing..." : "Request Withdraw"}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Transaction History & Requests */}
            <div className="bg-card border border-border rounded-xl p-6 mt-8">
                <h3 className="text-xl font-bold mb-6">Recent Withdrawal Requests</h3>
                <div className="space-y-4">
                    {withdrawalRequests.length === 0 && transactions.filter(t => t.type === 'withdraw').length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No withdrawals yet.</p>
                    ) : (
                        <>
                            {/* Show Requests (Pending/Rejected) first */}
                            {withdrawalRequests.map((req) => (
                                <div key={`req-${req.id}`} className="flex items-center justify-between p-4 border-b border-border last:border-0 relative">
                                    <div>
                                        <p className="font-medium capitalize flex items-center gap-2">
                                            {req.paymentMethod === 'UPI' ? 'UPI Withdrawal' : 'Bank Transfer'}
                                            {req.status === 'PENDING' && <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-500 font-bold uppercase">Pending</span>}
                                            {req.status === 'REJECTED' && <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-500 font-bold uppercase">Rejected</span>}
                                            {req.status === 'SUCCESSFUL' && <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-500 font-bold uppercase">Processed</span>}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={cn("font-bold text-lg", req.status === "REJECTED" ? "text-muted-foreground line-through" : "text-red-500")}>
                                        <TokenIcon size={14} className="mx-0.5 inline-block" />{req.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
