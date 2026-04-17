"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { use, useState, useEffect } from "react"
import { playersAtom, Player } from "@/lib/atoms/players"
import {
    schoppenvrouwenGameAtom,
    setSchoppenvrouwenScoreForRoundAtom,
    setSchoppenvrouwenRoundClosedByForRoundAtom,
    advanceSchoppenvrouwenRoundAtom,
    isSchoppenvrouwenFinishedAtom,
    getSchoppenvrouwenPlayerTotalAtom,
    getSchoppenvrouwenLastFullyScoredRoundIndex,
    isValidSchoppenvrouwenGame,
    resetSchoppenvrouwenGameAtom,
    SCHOPPENVROUWEN_CARDS_PER_PLAYER,
    SCHOPPENVROUWEN_TARGET_SCORE
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
    player: Player | undefined
    currentScore: number | undefined
    totalScore: number
    onScoreChange: (score: number) => void
}) => {
    const displayName = player?.name?.trim() || `Speler #${playerId}`
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
                <span className="text-base font-semibold text-white truncate">{displayName}</span>
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
    const setRoundClosedBy = useSetAtom(setSchoppenvrouwenRoundClosedByForRoundAtom)
    const advanceRound = useSetAtom(advanceSchoppenvrouwenRoundAtom)
    const resetGame = useSetAtom(resetSchoppenvrouwenGameAtom)
    const isGameFinished = useAtomValue(isSchoppenvrouwenFinishedAtom)
    const getPlayerTotal = useAtomValue(getSchoppenvrouwenPlayerTotalAtom)
    const [isHydrated, setIsHydrated] = useState(false)
    const [closerConfirmed, setCloserConfirmed] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (!isHydrated) return
        if (!game) {
            router.replace("/schoppenvrouwen/setup")
            return
        }
        if (!isValidSchoppenvrouwenGame(game)) {
            console.warn("Invalid schoppenvrouwen game shape in storage — resetting", game)
            resetGame()
            router.replace("/schoppenvrouwen/setup")
        }
    }, [game, router, isHydrated, resetGame])

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

    const roundIndex = !isNaN(roundNumber) ? roundNumber - 1 : -1
    const isValidRound =
        !!game &&
        !isNaN(roundNumber) &&
        roundIndex >= 0 &&
        roundIndex < game.rounds.length

    const viewedRound =
        isValidRound && game ? game.rounds[roundIndex] : null
    const playerOrder = game?.playerOrder ?? []
    const orderLen = playerOrder.length

    const isViewedRoundComplete =
        viewedRound !== null &&
        Object.keys(viewedRound.scores).length === playerOrder.length

    const lastFullyScoredRoundIndex = game
        ? getSchoppenvrouwenLastFullyScoredRoundIndex(game)
        : -1
    const playersAtOrOverTarget = playerOrder.filter(
        (id) => getPlayerTotal(id) >= SCHOPPENVROUWEN_TARGET_SCORE
    )
    const shouldAskWhoClosed =
        viewedRound !== null &&
        isViewedRoundComplete &&
        roundIndex === lastFullyScoredRoundIndex &&
        playersAtOrOverTarget.length >= 2

    useEffect(() => {
        setCloserConfirmed(false)
    }, [roundIndex, shouldAskWhoClosed])

    if (!isHydrated || !game || !isValidSchoppenvrouwenGame(game)) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-zinc-500">Laden...</div>
            </div>
        )
    }

    if (!isValidRound) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-zinc-500">Laden...</div>
            </div>
        )
    }

    const activeRound = viewedRound!

    const displayDealerIndex =
        orderLen > 0
            ? (game.dealerIndex - (game.currentRoundIndex - roundIndex) + orderLen) % orderLen
            : 0
    const dealerId = orderLen > 0 ? playerOrder[displayDealerIndex] : undefined

    const closerHighlightId =
        activeRound.roundClosedByPlayerId ??
        (roundIndex === lastFullyScoredRoundIndex ? game.lastRoundClosedByPlayerId : undefined) ??
        playerOrder[0]

    const isEditingPastRound = roundIndex < game.currentRoundIndex
    const canFinishRound =
        isViewedRoundComplete && (!shouldAskWhoClosed || closerConfirmed)

    const doneButtonLabel = !isViewedRoundComplete
        ? "Vul alle scores in"
        : shouldAskWhoClosed && !closerConfirmed
          ? "Kies wie de ronde heeft afgesloten"
          : isEditingPastRound
            ? "Terug naar stand →"
            : isGameFinished
              ? "Bekijk Eindstand →"
              : "Volgende Ronde →"

    const handleDone = () => {
        if (!canFinishRound) return

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
                            currentScore={activeRound.scores[playerId]}
                            totalScore={
                                getPlayerTotal(playerId) +
                                (!isViewedRoundComplete ? (activeRound.scores[playerId] ?? 0) : 0)
                            }
                            onScoreChange={(score) =>
                                setScoreForRound({ roundIndex, playerId, score })
                            }
                        />
                    ))}
                </div>

                {shouldAskWhoClosed && (
                    <div className="rounded-2xl border border-amber-500/30 bg-zinc-900 p-4 space-y-2">
                        <div className="text-sm font-medium text-zinc-200 text-center">
                            Meerdere spelers op {SCHOPPENVROUWEN_TARGET_SCORE}+ — wie heeft de ronde afgesloten?{" "}
                            <span className="text-zinc-500 font-normal">(uitgelegd)</span>
                        </div>
                        <p className="text-xs text-zinc-500 text-center px-1">
                            Diegene wint, niet degene met de hoogste score. Tik een naam om te bevestigen.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {playerOrder.map((pid) => (
                                <Button
                                    key={pid}
                                    type="button"
                                    variant={closerHighlightId === pid ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "rounded-xl",
                                        closerHighlightId === pid
                                            ? "bg-rose-600 hover:bg-rose-700"
                                            : "border-zinc-700 text-zinc-300"
                                    )}
                                    onClick={() => {
                                        setRoundClosedBy({ roundIndex, playerId: pid })
                                        setCloserConfirmed(true)
                                    }}
                                >
                                    {players[pid]?.name ?? `#${pid}`}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Done button */}
                <Button
                    onClick={handleDone}
                    className={cn(
                        "w-full text-lg font-bold h-14 rounded-xl",
                        canFinishRound ? "bg-rose-600 hover:bg-rose-700" : "bg-zinc-800 text-zinc-500"
                    )}
                    disabled={!canFinishRound}
                >
                    {doneButtonLabel}
                </Button>
            </div>
        </>
    )
}
