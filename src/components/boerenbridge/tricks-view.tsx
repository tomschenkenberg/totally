"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { playersAtom } from "@/lib/atoms/players"
import {
    BoerenBridgeGame,
    getCurrentRoundCardsAtom,
    getCurrentRoundAtom,
    getTotalTricksAtom,
    isTricksCompleteAtom,
    setTricksAtom,
    clearTricksAtom,
    completeBoerenBridgeRoundAtom,
    calculateBoerenBridgeScore
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import { cn, scoreTextClass } from "@/lib/utils"
import { useState } from "react"
import { Check, X, AlertTriangle } from "lucide-react"
import { LoadingPlaceholder } from "@/components/loading-placeholder"

interface TricksViewProps {
    game: BoerenBridgeGame
}

export function TricksView({ game }: TricksViewProps) {
    const players = useAtomValue(playersAtom)
    const cards = useAtomValue(getCurrentRoundCardsAtom)
    const currentRound = useAtomValue(getCurrentRoundAtom)
    const totalTricks = useAtomValue(getTotalTricksAtom)
    const allTricksComplete = useAtomValue(isTricksCompleteAtom)
    const setTricks = useSetAtom(setTricksAtom)
    const clearTricks = useSetAtom(clearTricksAtom)
    const completeRound = useSetAtom(completeBoerenBridgeRoundAtom)

    const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null)
    const [submittingTricks, setSubmittingTricks] = useState<{
        tricks: number
        playerId: number
    } | null>(null)

    if (!currentRound) {
        return <LoadingPlaceholder />
    }

    const playerOrder = game.playerOrder
    const activePlayerId =
        editingPlayerId ??
        playerOrder.find((playerId) => currentRound.tricks[playerId] === undefined) ??
        null
    const activePlayer = activePlayerId !== null ? players[activePlayerId] : null
    const isEditing = editingPlayerId !== null
    const tricksValid = allTricksComplete && totalTricks === cards
    const needsTricksInput = !allTricksComplete

    const playersWithoutTricks = playerOrder.filter(
        (playerId) => currentRound.tricks[playerId] === undefined
    )
    const isLastPlayer = playersWithoutTricks.length === 1 && !isEditing

    const tricksWithoutActivePlayer =
        editingPlayerId !== null
            ? Object.entries(currentRound.tricks)
                  .filter(([id]) => Number(id) !== editingPlayerId)
                  .reduce((sum, [, t]) => sum + t, 0)
            : totalTricks
    const remainingTricks = cards - tricksWithoutActivePlayer

    const activePlayerIndex = activePlayerId !== null ? playerOrder.indexOf(activePlayerId) : -1

    const handleTricks = (tricks: number) => {
        if (submittingTricks || activePlayerId === null) return

        setSubmittingTricks({ tricks, playerId: activePlayerId })

        const playerId = isEditing ? editingPlayerId : activePlayerId
        setTricks({ playerId, tricks })
        if (isEditing) {
            setEditingPlayerId(null)
        }

        completeRound()

        requestAnimationFrame(() => setSubmittingTricks(null))
    }

    const handleBack = () => {
        if (editingPlayerId !== null) {
            setEditingPlayerId(null)
            return
        }
        if (activePlayerIndex <= 0) return

        for (let i = activePlayerIndex - 1; i >= 0; i--) {
            const playerId = playerOrder[i]
            if (currentRound.tricks[playerId] !== undefined) {
                clearTricks({ playerId })
                return
            }
        }
    }

    const canGoBack =
        isEditing ||
        (activePlayerIndex > 0 &&
            playerOrder.slice(0, activePlayerIndex).some((id) => currentRound.tricks[id] !== undefined))

    return (
        <>
            <Title>Slagen - {cards} kaarten</Title>

            <div className="space-y-4">
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <div className="flex justify-center items-center">
                        <span className="text-zinc-400 text-sm">Ingevoerd:</span>
                        <span
                            className={cn(
                                "ml-2 text-2xl font-bold font-mono",
                                allTricksComplete && tricksValid
                                    ? "text-emerald-400"
                                    : allTricksComplete && !tricksValid
                                      ? "text-red-400"
                                      : "text-white"
                            )}
                        >
                            {totalTricks}
                        </span>
                        <span className="text-zinc-600 text-lg font-mono ml-1">/ {cards}</span>
                    </div>
                </div>

                {allTricksComplete && !tricksValid && !isEditing && (
                    <div className="flex items-center gap-2 text-red-300 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                        <div className="text-sm">
                            <span className="font-semibold">
                                Totaal slagen ({totalTricks}) moet {cards} zijn.
                            </span>
                            <span className="text-red-400/70 block">Tik op een speler om aan te passen</span>
                        </div>
                    </div>
                )}

                {(needsTricksInput || isEditing) && activePlayer && activePlayerId !== null && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-2xl font-bold text-white">{activePlayer.name}</span>
                                {isEditing && (
                                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-semibold ring-1 ring-amber-500/30">
                                        Aanpassen
                                    </span>
                                )}
                            </div>
                            <span className="text-sm text-zinc-500">
                                geboden:{" "}
                                <span className="text-emerald-400 font-bold">
                                    {currentRound.bids[activePlayerId] ?? 0}
                                </span>
                            </span>
                        </div>

                        {isLastPlayer ? (
                            <div className="space-y-3">
                                <div className="text-center text-amber-400/80 text-sm font-medium">
                                    Resterende slagen:{" "}
                                    <span className="font-bold text-xl text-amber-400">
                                        {remainingTricks}
                                    </span>
                                </div>
                                <Button
                                    onClick={() => handleTricks(remainingTricks)}
                                    variant="default"
                                    disabled={
                                        submittingTricks?.playerId === activePlayerId &&
                                        submittingTricks.tricks === remainingTricks
                                    }
                                    className="w-full text-3xl font-bold h-20 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {submittingTricks?.playerId === activePlayerId &&
                                    submittingTricks.tricks === remainingTricks ? (
                                        <Check className="w-10 h-10 animate-bounce" />
                                    ) : (
                                        remainingTricks
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: cards + 1 }, (_, i) => i).map((tricks) => {
                                    const isMyTurnSubmitting =
                                        submittingTricks?.playerId === activePlayerId
                                    const isSelected =
                                        isMyTurnSubmitting && submittingTricks?.tricks === tricks

                                    return (
                                        <Button
                                            key={tricks}
                                            onClick={() => handleTricks(tricks)}
                                            variant="default"
                                            disabled={isMyTurnSubmitting && !isSelected}
                                            className={cn(
                                                "text-2xl font-bold h-16 rounded-xl transition-all duration-200",
                                                isSelected
                                                    ? "bg-green-500 hover:bg-green-600 scale-105 ring-2 ring-green-400/50 text-white"
                                                    : isEditing
                                                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                                                      : "bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white border border-zinc-700"
                                            )}
                                        >
                                            {isSelected ? (
                                                <Check className="w-7 h-7 animate-bounce" />
                                            ) : (
                                                tricks
                                            )}
                                        </Button>
                                    )
                                })}
                            </div>
                        )}

                        {canGoBack && (
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                className="w-full text-zinc-500 h-12 rounded-xl"
                            >
                                {isEditing ? "Annuleren" : "← Vorige speler"}
                            </Button>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider px-1">
                        Resultaten
                        {allTricksComplete && (
                            <span className="normal-case tracking-normal font-normal text-zinc-600 ml-1.5">
                                (tik om aan te passen)
                            </span>
                        )}
                    </h3>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800/60">
                        {playerOrder.map((playerId) => {
                            const player = players[playerId]
                            const bid = currentRound.bids[playerId]
                            const tricks = currentRound.tricks[playerId]
                            const hasTricks = tricks !== undefined
                            const score = hasTricks ? calculateBoerenBridgeScore(bid, tricks) : null
                            const isCorrect = hasTricks && bid === tricks
                            const isBeingEdited = editingPlayerId === playerId

                            return (
                                <div
                                    key={playerId}
                                    onClick={() => hasTricks && setEditingPlayerId(playerId)}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-3 transition-all",
                                        hasTricks ? "active:bg-zinc-800" : "opacity-40",
                                        isBeingEdited && "ring-2 ring-inset ring-amber-500/50 bg-amber-500/5"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white">{player.name}</span>
                                        {isBeingEdited && (
                                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                                                bewerken
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                            <span>
                                                Bod{" "}
                                                <span className="font-bold text-emerald-400 text-sm">
                                                    {bid}
                                                </span>
                                            </span>
                                            <span>
                                                Slagen{" "}
                                                <span
                                                    className={cn(
                                                        "font-bold text-sm",
                                                        hasTricks ? "text-blue-400" : "text-zinc-600"
                                                    )}
                                                >
                                                    {hasTricks ? tricks : "-"}
                                                </span>
                                            </span>
                                        </div>
                                        {hasTricks && (
                                            <div className="flex items-center gap-1.5 min-w-[50px] justify-end">
                                                {isCorrect ? (
                                                    <Check className="h-4 w-4 text-emerald-400" />
                                                ) : (
                                                    <X className="h-4 w-4 text-red-400" />
                                                )}
                                                <span
                                                    className={cn(
                                                        "font-bold font-mono text-lg",
                                                        score !== null
                                                            ? scoreTextClass(score)
                                                            : "text-zinc-500"
                                                    )}
                                                >
                                                    {score !== null && score > 0 ? "+" : ""}
                                                    {score}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}
