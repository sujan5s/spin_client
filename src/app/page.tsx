import Link from "next/link";
import { Gamepad2, ArrowRight, Wallet, Trophy } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-accent/20 rounded-full blur-[120px] opacity-30"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            GAMEVERSE
          </span>
        </div>
        <div className="space-x-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Login
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-transform hover:scale-105"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-20 pb-32 px-4 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Play Games. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary-foreground">
            Double Your Money.
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-10">
          The ultimate gaming platform where skill meets fortune. Join thousands of players, manage your wallet, and win big with our fair and exciting games.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-full hover:bg-primary/90 transition-all transform hover:scale-105 flex items-center"
          >
            Start Playing Now <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 bg-secondary text-secondary-foreground text-lg font-bold rounded-full hover:bg-secondary/80 transition-all"
          >
            Learn More
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full">
          <div className="p-6 bg-card/50 backdrop-blur-sm border border-border rounded-xl hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Wallet</h3>
            <p className="text-muted-foreground">Easy deposits and withdrawals with our secure wallet system.</p>
          </div>
          <div className="p-6 bg-card/50 backdrop-blur-sm border border-border rounded-xl hover:border-accent/50 transition-colors">
            <div className="h-12 w-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Gamepad2 className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Exciting Games</h3>
            <p className="text-muted-foreground">Spin the wheel and other simple games to test your luck.</p>
          </div>
          <div className="p-6 bg-card/50 backdrop-blur-sm border border-border rounded-xl hover:border-secondary-foreground/50 transition-colors">
            <div className="h-12 w-12 bg-secondary/50 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Trophy className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Rewards</h3>
            <p className="text-muted-foreground">Win and see your balance update instantly. No waiting.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
