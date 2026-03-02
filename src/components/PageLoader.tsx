export default function PageLoader() {
    return (
        <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-4">
            {/* Spinner */}
            <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-accent animate-spin [animation-duration:0.6s]" />
            </div>
            <p className="text-sm text-muted-foreground font-medium tracking-wide animate-pulse">Loading...</p>
        </div>
    );
}
