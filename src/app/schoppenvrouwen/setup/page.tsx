"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { playersAtom } from "@/lib/atoms/players"
import { initSchoppenvrouwenGameAtom, SCHOPPENVROUWEN_TARGET_SCORE, SCHOPPENVROUWEN_CARDS_PER_PLAYER } from "@/lib/atoms/game"
import { PlayerOrderList } from "@/components/player-order-list"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function SchoppenvrouwenSetupPage() {
    const players = useAtomValue(playersAtom)
    const initGame = useSetAtom(initSchoppenvrouwenGameAtom)
    const router = useRouter()

    const playerList = Object.entries(players).map(([id, player]) => ({
        id: Number(id),
        player
    }))

    const [playerOrder, setPlayerOrder] = useState<number[]>([])
    const [dealerIndex, setDealerIndex] = useState(0)

    // Initialize order when players change
    useEffect(() => {
        if (playerList.length > 0 && playerOrder.length === 0) {
            setPlayerOrder(playerList.map((p) => p.id))
        }
    }, [playerList, playerOrder.length])

    const handleStartGame = () => {
        if (playerOrder.length < 2) return
        initGame({ playerOrder, dealerIndex })
        router.push("/schoppenvrouwen/round/1")
    }

    if (playerList.length < 2) {
        return (
            <>
                <Title>Schoppenvrouwen Setup</Title>
                <div className="text-center space-y-4">
                    <p className="text-gray-400 text-lg">
                        Je hebt minimaal 2 spelers nodig om Schoppenvrouwen te spelen.
                    </p>
                    <Link href="/players">
                        <Button variant="default" className="bg-rose-600 hover:bg-rose-700">
                            Voeg Spelers Toe
                        </Button>
                    </Link>
                </div>
            </>
        )
    }

    return (
        <>
            <Title>Schoppenvrouwen Setup</Title>

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-200 mb-2">Spelersvolgorde</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Sleep spelers om de zitplaatsvolgorde aan te passen. Klik op de kroon om de eerste deler aan te
                        wijzen.
                    </p>

                    <PlayerOrderList
                        players={playerList}
                        playerOrder={playerOrder}
                        dealerIndex={dealerIndex}
                        onOrderChange={setPlayerOrder}
                        onDealerChange={setDealerIndex}
                    />
                </div>

                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                    <h3 className="font-semibold text-gray-200 mb-2">Spelregels</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Eerste speler die {SCHOPPENVROUWEN_TARGET_SCORE} punten bereikt wint</li>
                        <li>• Als meerdere spelers tegelijk {SCHOPPENVROUWEN_TARGET_SCORE}+ halen, wint de &ldquo;laatste finisher&rdquo;</li>
                        <li>• Elke ronde: {SCHOPPENVROUWEN_CARDS_PER_PLAYER} kaarten per speler (2 decks)</li>
                        <li>• Dealer wisselt elke ronde met de klok mee</li>
                    </ul>
                </div>

                <Button
                    onClick={handleStartGame}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-xl py-6"
                    disabled={playerOrder.length < 2}
                >
                    Start Spel
                </Button>
            </div>
        </>
    )
}

