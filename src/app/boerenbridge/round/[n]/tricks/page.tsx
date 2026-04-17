"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useParams, useRouter } from "next/navigation"
import { playersAtom } from "@/lib/atoms/players"
import {
    getCurrentRoundCardsAtom,
    getCurrentRoundAtom,
    setTricksAtom,
    calculateBoerenBridgeScore,
    BOEREN_BRIDGE_ROUNDS,
    advanceToNextRoundAtom
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import { cn, scoreTextClass } from "@/lib/utils"
import { useEffect, useState, useRef } from "react"
import { Check, X, AlertTriangle } from "lucide-react"
import { useValidGame } from "@/hooks/use-valid-game"

export default function TricksPage() {
    const params = useParams()
    const router = useRouter()
    const roundNumber = Number(params.n)

    const { hydrated, game } = useValidGame("boerenbridge")
    const players = useAtomValue(playersAtom)
    const cards = useAtomValue(getCurrentRoundCardsAtom)
    const currentRound = useAtomValue(getCurrentRoundAtom)
    const setTricks = useSetAtom(setTricksAtom)
    const advanceToNextRound = useSetAtom(advanceToNextRoundAtom)

    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
    const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null)
    const [isAutoAdvancing, setIsAutoAdvancing] = useState(false)
    const [submittingTricks, setSubmittingTricks] = useState<{
        tricks: number
        playerId: number
    } | null>(null)

    useEffect(() => {
        if (!hydrated || !game || !currentRound) return
        const playerOrder = game.playerOrder
        const firstPlayerWithoutTricks = playerOrder.findIndex(
            (playerId) => currentRound.tricks[playerId] === undefined
        )
        if (firstPlayerWithoutTricks !== -1) {
            setCurrentPlayerIndex(firstPlayerWithoutTricks)
        } else {
            setCurrentPlayerIndex(0)
        }
        setEditingPlayerId(null)
    }, [roundNumber, hydrated, game, currentRound])

    useEffect(() => {
        if (!hydrated || !game || !currentRound) return
        if (autoAdvanceRef.current) return
        const tricksComplete = Object.keys(currentRound.tricks).length === game.playerOrder.length
        if (tricksComplete) return
        if (roundNumber !== game.currentRoundIndex + 1) {
            router.replace(`/boerenbridge/round/${game.currentRoundIndex + 1}/tricks`)
        }
    }, [game, currentRound, roundNumber, router, hydrated])

    const playerOrder = game?.playerOrder ?? []
    const currentPlayerId = playerOrder[currentPlayerIndex]

    const isEditing = editingPlayerId !== null

    const autoAdvanceRef = useRef(false)

    if (!hydrated || !game || !currentRound) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-zinc-500">Laden...</div>
            </div>
        )
    }

    if (isAutoAdvancing) {
        return (
            <div className="flex items-center justify-center py-16">
                <span className="animate-pulse text-lg font-bold text-emerald-400">Naar scorebord...</span>
            </div>
        )
    }

    const safePlayerOrder = game.playerOrder
    const firstPlayerWithoutTricksIndex = safePlayerOrder.findIndex(
        (playerId) => currentRound.tricks[playerId] === undefined
    )
    const targetPlayerIndex = firstPlayerWithoutTricksIndex !== -1 ? firstPlayerWithoutTricksIndex : 0
    const safeTargetPlayerIndex = targetPlayerIndex >= 0 && targetPlayerIndex < safePlayerOrder.length ? targetPlayerIndex : 0

    let safeActivePlayerId: number | null = null
    if (editingPlayerId !== null) {
        safeActivePlayerId = editingPlayerId
    } else if (safePlayerOrder.length > 0) {
        if (safeTargetPlayerIndex >= 0 && safeTargetPlayerIndex < safePlayerOrder.length) {
            safeActivePlayerId = safePlayerOrder[safeTargetPlayerIndex]
        }
        if (safeActivePlayerId === null || safeActivePlayerId === undefined) {
            safeActivePlayerId = safePlayerOrder[0]
        }
    }
    const activePlayer = safeActivePlayerId && players[safeActivePlayerId]
        ? players[safeActivePlayerId]
        : (safePlayerOrder.length > 0 && players[safePlayerOrder[0]] ? players[safePlayerOrder[0]] : null)

    const tricksEntered = Object.keys(currentRound.tricks).length
    const safeAllTricksComplete = tricksEntered === safePlayerOrder.length
    const safeTotalTricks = Object.values(currentRound.tricks).reduce((sum, t) => sum + t, 0)
    const safeTotalTricksValid = safeTotalTricks === cards
    const needsTricksInput = tricksEntered < safePlayerOrder.length

    const playersWithoutTricks = safePlayerOrder.filter(
        (playerId) => currentRound.tricks[playerId] === undefined
    )
    const isLastPlayer = playersWithoutTricks.length === 1 && !isEditing

    const tricksWithoutCurrentPlayer = isEditing && editingPlayerId !== null
        ? Object.entries(currentRound.tricks)
            .filter(([id]) => Number(id) !== editingPlayerId)
            .reduce((sum, [, t]) => sum + t, 0)
        : safeTotalTricks
    const remainingTricks = cards - tricksWithoutCurrentPlayer

    const handleTricks = (tricks: number) => {
        if (submittingTricks) return
        if (safeActivePlayerId === null) return

        // Brief visual confirmation — cleared on the next frame so the UI
        // updates immediately (previously gated behind a 750ms delay).
        setSubmittingTricks({ tricks, playerId: safeActivePlayerId })

        let newTotal: number
        let newCount: number

        if (editingPlayerId !== null) {
            newTotal = safeTotalTricks - (currentRound.tricks[editingPlayerId] || 0) + tricks
            newCount = tricksEntered
        } else {
            newTotal = safeTotalTricks + tricks
            newCount = tricksEntered + 1
        }

        const willBeComplete = newCount === safePlayerOrder.length
        const willBeValid = newTotal === cards
        const isLast = game.currentRoundIndex === BOEREN_BRIDGE_ROUNDS.length - 1

        if (willBeComplete && willBeValid && !autoAdvanceRef.current) {
            autoAdvanceRef.current = true
            setIsAutoAdvancing(true)

            queueMicrotask(() => {
                if (!isLast) {
                    advanceToNextRound()
                }
                router.replace("/boerenbridge")
            })
        }

        if (editingPlayerId !== null) {
            setTricks({ playerId: editingPlayerId, tricks })
            setEditingPlayerId(null)
        } else if (safeActivePlayerId !== null) {
            setTricks({ playerId: safeActivePlayerId, tricks })
            const currentIdx = safePlayerOrder.indexOf(safeActivePlayerId)
            const nextPlayerIndex = safePlayerOrder.findIndex(
                (playerId, idx) =>
                    idx > currentIdx && currentRound.tricks[playerId] === undefined
            )
            if (nextPlayerIndex !== -1) {
                setCurrentPlayerIndex(nextPlayerIndex)
            }
        }

        requestAnimationFrame(() => setSubmittingTricks(null))
    }

    const handleBack = () => {
        if (editingPlayerId !== null) {
            setEditingPlayerId(null)
        } else if (currentPlayerIndex > 0) {
            setCurrentPlayerIndex(currentPlayerIndex - 1)
        }
    }

    const handleEditPlayer = (playerId: number) => {
        setEditingPlayerId(playerId)
    }

    return (
        <>
            <Title>Slagen - {cards} kaarten</Title>

            <div className="space-y-4">
                {/* Progress */}
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <div className="flex justify-center items-center">
                        <span className="text-zinc-400 text-sm">Ingevoerd:</span>
                        <span
                            className={cn(
                                "ml-2 text-2xl font-bold font-mono",
                                safeAllTricksComplete && safeTotalTricksValid
                                    ? "text-emerald-400"
                                    : safeAllTricksComplete && !safeTotalTricksValid
                                      ? "text-red-400"
                                      : "text-white"
                            )}
                        >
                            {safeTotalTricks}
                        </span>
                        <span className="text-zinc-600 text-lg font-mono ml-1">/ {cards}</span>
                    </div>
                </div>

                {/* Validation warning */}
                {safeAllTricksComplete && !safeTotalTricksValid && !isEditing && (
                    <div className="flex items-center gap-2 text-red-300 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                        <div className="text-sm">
                            <span className="font-semibold">Totaal slagen ({safeTotalTricks}) moet {cards} zijn.</span>
                            <span className="text-red-400/70 block">Tik op een speler om aan te passen</span>
                        </div>
                    </div>
                )}

                {/* Current player input */}
                {(needsTricksInput || isEditing) && activePlayer && safeActivePlayerId !== null && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-2xl font-bold text-white">{activePlayer.name}</span>
                                {isEditing && (
                                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-semibold ring-1 ring-amber-500/30">Aanpassen</span>
                                )}
                            </div>
                            <span className="text-sm text-zinc-500">
                                geboden: <span className="text-emerald-400 font-bold">{currentRound.bids[safeActivePlayerId] ?? 0}</span>
                            </span>
                        </div>

                        {isLastPlayer ? (
                            <div className="space-y-3">
                                <div className="text-center text-amber-400/80 text-sm font-medium">
                                    Resterende slagen:{" "}
                                    <span className="font-bold text-xl text-amber-400">{remainingTricks}</span>
                                </div>
                                {(() => {
                                    const isMyTurnSubmitting = submittingTricks?.playerId === safeActivePlayerId
                                    const isSelected = isMyTurnSubmitting && submittingTricks?.tricks === remainingTricks
                                    const isSubmittingOther = isMyTurnSubmitting && !isSelected

                                    return (
                                        <Button
                                            onClick={() => handleTricks(remainingTricks)}
                                            variant="default"
                                            disabled={isSubmittingOther || isSelected}
                                            className={cn(
                                                "w-full text-3xl font-bold h-20 rounded-xl transition-all duration-200",
                                                isSelected
                                                    ? "bg-green-500 hover:bg-green-600 scale-105 ring-2 ring-green-400/50 text-white"
                                                    : "bg-emerald-600 hover:bg-emerald-700 text-white",
                                                isSubmittingOther && "opacity-40 scale-95"
                                            )}
                                        >
                                            {isSelected ? (
                                                <Check className="w-10 h-10 animate-bounce" />
                                            ) : (
                                                remainingTricks
                                            )}
                                        </Button>
                                    )
                                })()}
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: cards + 1 }, (_, i) => i).map((tricks) => {
                                    const isMyTurnSubmitting = submittingTricks?.playerId === safeActivePlayerId
                                    const isSelected = isMyTurnSubmitting && submittingTricks?.tricks === tricks
                                    const isSubmittingOther = isMyTurnSubmitting && !isSelected

                                    return (
                                        <Button
                                            key={tricks}
                                            onClick={() => handleTricks(tricks)}
                                            variant="default"
                                            disabled={isSubmittingOther || isSelected}
                                            className={cn(
                                                "text-2xl font-bold h-16 rounded-xl transition-all duration-200",
                                                isSelected
                                                    ? "bg-green-500 hover:bg-green-600 scale-105 ring-2 ring-green-400/50 text-white"
                                                    : isEditing
                                                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                                                      : "bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white border border-zinc-700",
                                                isSubmittingOther && "opacity-40 scale-95"
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

                        {(safeTargetPlayerIndex > 0 || isEditing) && (
                            <Button variant="ghost" onClick={handleBack} className="w-full text-zinc-500 h-12 rounded-xl">
                                {isEditing ? "Annuleren" : "← Vorige speler"}
                            </Button>
                        )}
                    </div>
                )}

                {/* Results summary */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider px-1">
                        Resultaten
                        {safeAllTricksComplete && (
                            <span className="normal-case tracking-normal font-normal text-zinc-600 ml-1.5">
                                (tik om aan te passen)
                            </span>
                        )}
                    </h3>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800/60">
                        {safePlayerOrder.map((playerId) => {
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
                                    onClick={() => hasTricks && handleEditPlayer(playerId)}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-3 transition-all",
                                        hasTricks ? "active:bg-zinc-800" : "opacity-40",
                                        isBeingEdited && "ring-2 ring-inset ring-amber-500/50 bg-amber-500/5"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white">{player.name}</span>
                                        {isBeingEdited && (
                                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">bewerken</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                            <span>Bod <span className="font-bold text-emerald-400 text-sm">{bid}</span></span>
                                            <span>Slagen <span className={cn("font-bold text-sm", hasTricks ? "text-blue-400" : "text-zinc-600")}>{hasTricks ? tricks : "-"}</span></span>
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
                                                        score !== null ? scoreTextClass(score) : "text-zinc-500"
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
