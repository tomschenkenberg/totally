"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { playersAtom } from "@/lib/atoms/players"
import { initBoerenBridgeGameAtom } from "@/lib/atoms/game"
import { PlayerOrderList } from "@/components/player-order-list"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function BoerenBridgeSetupPage() {
    const players = useAtomValue(playersAtom)
    const initGame = useSetAtom(initBoerenBridgeGameAtom)
    const router = useRouter()

    const playerList = Object.entries(players).map(([id, player]) => ({
        id: Number(id),
        player
    }))

    const [playerOrder, setPlayerOrder] = useState<number[]>([])
    const [dealerIndex, setDealerIndex] = useState(0)

    useEffect(() => {
        if (playerList.length > 0 && playerOrder.length === 0) {
            setPlayerOrder(playerList.map((p) => p.id))
        }
    }, [playerList, playerOrder.length])

    const handleStartGame = () => {
        if (playerOrder.length < 2) return
        initGame({ playerOrder, dealerIndex })
        router.push("/boerenbridge/round/1/bid")
    }

    if (playerList.length < 2) {
        return (
            <>
                <Title>Boerenbridge Setup</Title>
                <div className="text-center space-y-4 py-8">
                    <p className="text-zinc-400">
                        Je hebt minimaal 2 spelers nodig om Boerenbridge te spelen.
                    </p>
                    <Link href="/players">
                        <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12">
                            Voeg Spelers Toe
                        </Button>
                    </Link>
                </div>
            </>
        )
    }

    return (
        <>
            <Title>Boerenbridge Setup</Title>

            <div className="space-y-5">
                <div>
                    <h2 className="text-base font-semibold text-white mb-1">Spelersvolgorde</h2>
                    <p className="text-zinc-500 text-sm mb-3">
                        Sleep om de volgorde aan te passen. Tik op de kroon voor de eerste deler.
                    </p>
                    <PlayerOrderList
                        players={playerList}
                        playerOrder={playerOrder}
                        dealerIndex={dealerIndex}
                        onOrderChange={setPlayerOrder}
                        onDealerChange={setDealerIndex}
                    />
                </div>

                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                    <h3 className="font-semibold text-white text-sm mb-2">Spelregels</h3>
                    <ul className="text-sm text-zinc-500 space-y-1">
                        <li>• 19 rondes: 10 → 1 → 10 kaarten</li>
                        <li>• Juist: 5 + aantal slagen punten</li>
                        <li>• Fout: verschil wordt afgetrokken</li>
                        <li>• Totaal biedingen ≠ aantal kaarten</li>
                    </ul>
                </div>

                <Button
                    onClick={handleStartGame}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg font-bold h-14 rounded-xl"
                    disabled={playerOrder.length < 2}
                >
                    Start Spel
                </Button>
            </div>
        </>
    )
}
