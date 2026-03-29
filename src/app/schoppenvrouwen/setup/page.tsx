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
                <div className="text-center space-y-4 py-8">
                    <p className="text-zinc-400">
                        Je hebt minimaal 2 spelers nodig om Schoppenvrouwen te spelen.
                    </p>
                    <Link href="/players">
                        <Button variant="default" className="bg-rose-600 hover:bg-rose-700 rounded-xl h-12">
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
                        <li>• Eerste tot {SCHOPPENVROUWEN_TARGET_SCORE} punten wint</li>
                        <li>• Gelijktijdig {SCHOPPENVROUWEN_TARGET_SCORE}+: laatste finisher wint</li>
                        <li>• Per ronde: {SCHOPPENVROUWEN_CARDS_PER_PLAYER} kaarten per speler</li>
                        <li>• Deler wisselt elke ronde met de klok mee</li>
                    </ul>
                </div>

                <Button
                    onClick={handleStartGame}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-lg font-bold h-14 rounded-xl"
                    disabled={playerOrder.length < 2}
                >
                    Start Spel
                </Button>
            </div>
        </>
    )
}
