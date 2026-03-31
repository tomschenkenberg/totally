"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { use, useState, useEffect } from "react"
import { playersAtom, Player } from "@/lib/atoms/players"
import {
    schoppenvrouwenGameAtom,
    setSchoppenvrouwenScoreForRoundAtom,
    advanceSchoppenvrouwenRoundAtom,
    isSchoppenvrouwenFinishedAtom,
    getSchoppenvrouwenPlayerTotalAtom,
    SCHOPPENVROUWEN_CARDS_PER_PLAYER
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Title from "@/components/title"
import { Crown } from "lucide-react"
import { cn, scoreTextClass } from "@/lib/utils"

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

    useEffect(() => {
        setInputValue(currentScore?.toString() ?? "")
    }, [currentScore])

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
        <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex flex-col min-w-0">
                <span className="text-base font-semibold text-white truncate">{player.name}</span>
                <span className="text-xs text-zinc-500 font-mono">
                    Totaal:{" "}
                    <span className={scoreTextClass(totalScore)}>{totalScore}</span>
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Input
                    className="text-lg font-semibold font-mono w-20 h-10 bg-zinc-800 border-zinc-700 text-white text-center rounded-xl"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={inputValue}
                    onChange={handleScoreChange}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSign}
                    disabled={inputValue === ""}
                    className="border-zinc-700 text-zinc-400 hover:text-white h-10 w-10 p-0 rounded-xl"
                >
                    +/-
                </Button>
            </div>
        </div>
    )
}

export default function SchoppenvrouwenRoundPage({ params }: { params: Params }) {
    const { n } = use(params)
    const roundNumber = parseInt(n, 10)

    const router = useRouter()
    const game = useAtomValue(schoppenvrouwenGameAtom)
    const players = useAtomValue(playersAtom)
    const setScoreForRound = useSetAtom(setSchoppenvrouwenScoreForRoundAtom)
    const advanceRound = useSetAtom(advanceSchoppenvrouwenRoundAtom)
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

    useEffect(() => {
        if (!isHydrated || !game) return
        if (isNaN(roundNumber)) {
            router.replace("/schoppenvrouwen")
            return
        }
        const ri = roundNumber - 1
        if (ri < 0 || ri >= game.rounds.length) {
            router.replace("/schoppenvrouwen")
        }
    }, [isHydrated, game, roundNumber, router])

    if (!isHydrated || !game) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-zinc-500">Laden...</div>
            </div>
        )
    }

    const roundIndex = roundNumber - 1
    const isValidRound =
        !isNaN(roundNumber) && roundIndex >= 0 && roundIndex < game.rounds.length

    if (!isValidRound) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-zinc-500">Laden...</div>
            </div>
        )
    }

    const viewedRound = game.rounds[roundIndex]
    const playerOrder = game.playerOrder
    const orderLen = playerOrder.length
    const displayDealerIndex =
        orderLen > 0
            ? (game.dealerIndex - (game.currentRoundIndex - roundIndex) + orderLen) % orderLen
            : 0
    const dealerId = orderLen > 0 ? playerOrder[displayDealerIndex] : undefined

    const isViewedRoundComplete =
        Object.keys(viewedRound.scores).length === playerOrder.length

    const isEditingPastRound = roundIndex < game.currentRoundIndex

    const doneButtonLabel = !isViewedRoundComplete
        ? "Vul alle scores in"
        : isEditingPastRound
          ? "Terug naar stand →"
          : isGameFinished
            ? "Bekijk Eindstand →"
            : "Volgende Ronde →"

    const handleDone = () => {
        if (!isViewedRoundComplete) return

        if (isEditingPastRound) {
            router.push("/schoppenvrouwen")
            return
        }

        if (isGameFinished) {
            router.push("/schoppenvrouwen")
        } else {
            advanceRound()
            router.push("/schoppenvrouwen")
        }
    }

    return (
        <>
            <Title>Ronde {roundNumber}</Title>

            <div className="space-y-4">
                {/* Round info */}
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <div className="flex items-center justify-center gap-2">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span className="text-sm text-zinc-400">
                            <span className="font-bold text-white">{dealerId !== undefined ? players[dealerId]?.name : "—"}</span>{" "}
                            deelt{" "}
                            <span className="font-bold text-white tabular-nums">{SCHOPPENVROUWEN_CARDS_PER_PLAYER}</span>{" "}
                            kaarten
                        </span>
                    </div>
                </div>

                {/* Score inputs */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800/60">
                    {playerOrder.map((playerId) => (
                        <InputPlayerScore
                            key={`${playerId}-${roundIndex}`}
                            playerId={playerId}
                            player={players[playerId]}
                            currentScore={viewedRound.scores[playerId]}
                            totalScore={
                                getPlayerTotal(playerId) +
                                (!isViewedRoundComplete ? (viewedRound.scores[playerId] ?? 0) : 0)
                            }
                            onScoreChange={(score) =>
                                setScoreForRound({ roundIndex, playerId, score })
                            }
                        />
                    ))}
                </div>

                {/* Done button */}
                <Button
                    onClick={handleDone}
                    className={cn(
                        "w-full text-lg font-bold h-14 rounded-xl",
                        isViewedRoundComplete
                            ? "bg-rose-600 hover:bg-rose-700"
                            : "bg-zinc-800 text-zinc-500"
                    )}
                    disabled={!isViewedRoundComplete}
                >
                    {doneButtonLabel}
                </Button>
            </div>
        </>
    )
}
