export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <h1 className="text-xl font-bold text-white">Offline</h1>
            <p className="text-zinc-400 text-sm max-w-xs">
                Geen internetverbinding. Je opgeslagen spel staat lokaal — open Totally opnieuw zodra je
                weer online bent.
            </p>
        </div>
    )
}
