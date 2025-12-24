"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAtomValue } from "jotai"
import { boerenBridgeGameAtom } from "@/lib/atoms/game"

export default function RoundPage() {
    const params = useParams()
    const router = useRouter()
    const roundNumber = Number(params.n)
    const game = useAtomValue(boerenBridgeGameAtom)

    useEffect(() => {
        if (!game) {
            router.push("/boerenbridge/setup")
            return
        }

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
    }, [game, roundNumber, router])

    return (
        <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Laden...</div>
        </div>
    )
}

