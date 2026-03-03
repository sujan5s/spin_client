import Link from "next/link";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
                <Link href="/home" className="inline-flex items-center text-primary hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-black mb-6 border-b border-border pb-4">Terms of Service</h1>

                <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p>By accessing and using GameVerse, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Eligibility</h2>
                    <p>You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to use our services. By using GameVerse, you represent and warrant that you meet this age requirement and that your use of the platform does not violate any applicable law or regulation in your jurisdiction.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. User Accounts</h2>
                    <p>To access certain features of the platform, you must register for an account. You are responsible for maintaining the confidentiality of your account information, including your password, and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use of your account or password.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. User Conduct</h2>
                    <p>You agree not to engage in any activity that interferes with or disrupts the services. This includes, but is not limited to, the use of automated systems (bots, scrapers) to interact with the platform, exploiting bugs or flaws in the system, or attempting to compromise the security of other user accounts.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Withdrawals and Deposits</h2>
                    <p>All financial transactions are subject to review. We reserve the right to withhold withdrawals if we suspect fraudulent activity or if your account fails to meet the KYC (Know Your Customer) requirements. Bonus balances are subject to specific wagering requirements before they can be withdrawn.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
}
