"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { use, useState, useEffect } from "react"
import { playersAtom, Player } from "@/lib/atoms/players"
import {
    schoppenvrouwenGameAtom,
    setSchoppenvrouwenScoreAtom,
    advanceSchoppenvrouwenRoundAtom,
    isSchoppenvrouwenRoundCompleteAtom,
    isSchoppenvrouwenFinishedAtom,
    getSchoppenvrouwenPlayerTotalAtom,
    SCHOPPENVROUWEN_CARDS_PER_PLAYER
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Title from "@/components/title"
import { Crown } from "lucide-react"

type Params = Promise<{ n: string }>

const InputPlayerScore = ({
    playerId,
    player,
    currentScore,
    totalScore,
    onScoreChange
}: {
    playerId: number
    player: Player
    currentScore: number | undefined
    totalScore: number
    onScoreChange: (score: number) => void
}) => {
    const [inputValue, setInputValue] = useState(currentScore?.toString() || "")

    const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const scoreValue = e.target.value
        setInputValue(scoreValue)

        if (scoreValue !== "") {
            const newScore = parseInt(scoreValue, 10)
            if (!isNaN(newScore)) {
                onScoreChange(newScore)
            }
        }
    }

    const toggleSign = () => {
        if (inputValue === "") return
        const currentValue = parseInt(inputValue, 10)
        const newValue = (currentValue * -1).toString()
        setInputValue(newValue)
        onScoreChange(parseInt(newValue, 10))
    }

    return (
        <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
            <div className="flex items-center space-x-2">
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-gray-200">{player.name}</span>
                    <span className="text-sm text-gray-400 font-mono">Totaal: {totalScore}</span>
                </div>
            </div>
            <span className="text-2xl font-bold ml-4 flex items-center gap-2">
                <Input
                    className="text-xl font-semibold font-mono w-24 bg-slate-600 border-slate-500"
                    type="number"
                    inputMode="decimal"
                    placeholder="Score"
                    value={inputValue}
                    onChange={handleScoreChange}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSign}
                    disabled={inputValue === ""}
                    className="border-slate-500 text-gray-200"
                >
                    +/-
                </Button>
            </span>
        </div>
    )
}

export default function SchoppenvrouwenRoundPage({ params }: { params: Params }) {
    const { n } = use(params)
    const roundNumber = parseInt(n, 10)

    const router = useRouter()
    const game = useAtomValue(schoppenvrouwenGameAtom)
    const players = useAtomValue(playersAtom)
    const setScore = useSetAtom(setSchoppenvrouwenScoreAtom)
    const advanceRound = useSetAtom(advanceSchoppenvrouwenRoundAtom)
    const isRoundComplete = useAtomValue(isSchoppenvrouwenRoundCompleteAtom)
    const isGameFinished = useAtomValue(isSchoppenvrouwenFinishedAtom)
    const getPlayerTotal = useAtomValue(getSchoppenvrouwenPlayerTotalAtom)
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (!isHydrated) return
        if (!game) {
            router.replace("/schoppenvrouwen/setup")
        }
    }, [game, router, isHydrated])

    if (isNaN(roundNumber)) {
        return <div>Invalid round number</div>
    }

    if (!isHydrated || !game) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">Laden...</div>
            </div>
        )
    }

    const currentRound = game.rounds[game.currentRoundIndex]
    const playerOrder = game.playerOrder
    const dealerId = playerOrder[game.dealerIndex]

    const handleDone = () => {
        if (isRoundComplete) {
            if (isGameFinished) {
                // Game is over, go to final scoreboard
                router.push("/schoppenvrouwen")
            } else {
                // Advance to next round and go to scoreboard
                advanceRound()
                router.push("/schoppenvrouwen")
            }
        }
    }

    return (
        <>
            <Title>Ronde {roundNumber}</Title>

            <div className="space-y-6">
                {/* Round info */}
                <div className="bg-rose-900/30 border border-rose-600/50 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2">
                        <Crown className="h-5 w-5 text-amber-400" />
                        <span className="text-gray-200">
                            <span className="font-bold text-white">{players[dealerId]?.name}</span> deelt{" "}
                            <span className="font-bold text-rose-300">{SCHOPPENVROUWEN_CARDS_PER_PLAYER}</span> kaarten
                        </span>
                    </div>
                </div>

                {/* Score inputs */}
                <div className="space-y-3">
                    {playerOrder.map((playerId) => (
                        <InputPlayerScore
                            key={playerId}
                            playerId={playerId}
                            player={players[playerId]}
                            currentScore={currentRound?.scores[playerId]}
                            totalScore={getPlayerTotal(playerId)}
                            onScoreChange={(score) => setScore({ playerId, score })}
                        />
                    ))}
                </div>

                {/* Done button */}
                <Button
                    onClick={handleDone}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-xl py-6"
                    disabled={!isRoundComplete}
                >
                    {isRoundComplete
                        ? isGameFinished
                            ? "Bekijk Eindstand →"
                            : "Volgende Ronde →"
                        : "Vul alle scores in"}
                </Button>
            </div>
        </>
    )
}

