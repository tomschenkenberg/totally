"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function SchoppenvrouwenError({
    error,
    reset
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Schoppenvrouwen error boundary:", error)
    }, [error])

    const resetSchoppenvrouwenOnly = () => {
        try {
            localStorage.removeItem("schoppenvrouwenGame")
            localStorage.removeItem("gameMode")
        } catch {
            // ignore
        }
        window.location.href = "/"
    }

    return (
        <div className="text-center p-6 text-zinc-200 space-y-4">
            <h2 className="text-xl font-bold">Schoppenvrouwen kon niet geladen worden</h2>
            <p className="text-sm text-zinc-400 wrap-break-word whitespace-pre-wrap max-w-md mx-auto">
                {error?.message || "Onbekende fout"}
                {error?.digest ? `\n(digest: ${error.digest})` : ""}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={() => reset()}>Probeer opnieuw</Button>
                <Button
                    variant="outline"
                    onClick={resetSchoppenvrouwenOnly}
                    className="border-zinc-700"
                >
                    Reset Schoppenvrouwen
                </Button>
            </div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Dit wist alleen je lopende Schoppenvrouwen-spel.
            </p>
        </div>
    )
}
