import Link from "next/link";
import Footer from "@/components/Footer";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function ResponsibleGamingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
                <Link href="/home" className="inline-flex items-center text-primary hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-black mb-6 border-b border-border pb-4 flex items-center gap-3">
                    <AlertTriangle className="text-yellow-500 w-8 h-8" />
                    Responsible Gaming
                </h1>

                <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">

                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-xl my-8">
                        <p className="font-bold text-yellow-400 m-0">Gaming should be entertaining and enjoyable. We are committed to endorsing responsible gaming practices as a policy of customer care and social responsibility.</p>
                    </div>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">Maintain Control</h2>
                    <p>While the majority of our customers gamble within their means, for some, it can become a problem. It may help to keep the following in mind:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Gaming is a form of entertainment, not a way to make money or pay off debts.</li>
                        <li>Keep track of the time and money you spend.</li>
                        <li>Do not chase your losses. Only gamble what you can afford to lose.</li>
                        <li>If you need a break from gambling, self-exclusion or cool-off options can be requested through our support team.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">How We Can Help</h2>
                    <p>If you feel you may have a gambling problem, we offer several tools and mechanisms to help you control your gaming habits:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Self-Exclusion:</strong> Request to have your account blocked for a specific period (24 hours to 6 months).</li>
                        <li><strong>Deposit Limits:</strong> Contact support to set maximum daily, weekly, or monthly deposit limits on your account.</li>
                        <li><strong>Account Closure:</strong> You can permanently close your account at any time.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">Seeking External Support</h2>
                    <p>If you or someone you know is struggling with a gambling addiction, we strongly recommend reaching out to professional organizations dedicated to providing help and support:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><a href="https://www.begambleaware.org/" target="_blank" rel="noopener noreferrer" className="text-[#00ff9d] hover:underline">BeGambleAware</a></li>
                        <li><a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" className="text-[#00ff9d] hover:underline">Gamblers Anonymous</a></li>
                        <li><a href="https://www.gamcare.org.uk/" target="_blank" rel="noopener noreferrer" className="text-[#00ff9d] hover:underline">GamCare</a></li>
                    </ul>
                </div>
            </div>
            <Footer />
        </div>
    );
}
