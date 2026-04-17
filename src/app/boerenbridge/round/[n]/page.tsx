"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useValidGame } from "@/hooks/use-valid-game"

export default function RoundPage() {
    const params = useParams()
    const router = useRouter()
    const roundNumber = Number(params.n)
    const { hydrated, game } = useValidGame("boerenbridge")

    useEffect(() => {
        if (!hydrated || !game) return

        const expectedRound = game.currentRoundIndex + 1
        if (roundNumber !== expectedRound) {
            router.push(`/boerenbridge/round/${expectedRound}/bid`)
            return
        }

        const currentRound = game.rounds[game.currentRoundIndex]
        const playerCount = game.playerOrder.length
        const bidsComplete = Object.keys(currentRound?.bids || {}).length === playerCount
        const tricksComplete = Object.keys(currentRound?.tricks || {}).length === playerCount

        if (!bidsComplete) {
            router.push(`/boerenbridge/round/${roundNumber}/bid`)
        } else if (!tricksComplete) {
            router.push(`/boerenbridge/round/${roundNumber}/tricks`)
        } else {
            router.push("/boerenbridge")
        }
    }, [hydrated, game, roundNumber, router])

    return (
        <div className="flex items-center justify-center py-16">
            <div className="text-zinc-500">Laden...</div>
        </div>
    )
}

