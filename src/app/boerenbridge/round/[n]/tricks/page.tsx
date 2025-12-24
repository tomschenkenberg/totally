"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useParams, useRouter } from "next/navigation"
import { playersAtom } from "@/lib/atoms/players"
import {
    boerenBridgeGameAtom,
    getCurrentRoundCardsAtom,
    getCurrentRoundAtom,
    setTricksAtom,
    advanceToNextRoundAtom,
    calculateBoerenBridgeScore,
    BOEREN_BRIDGE_ROUNDS
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import PlayerAvatar from "@/components/avatar"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Check, X, AlertTriangle } from "lucide-react"

export default function TricksPage() {
    const params = useParams()
    const router = useRouter()
    const roundNumber = Number(params.n)

    const game = useAtomValue(boerenBridgeGameAtom)
    const players = useAtomValue(playersAtom)
    const cards = useAtomValue(getCurrentRoundCardsAtom)
    const currentRound = useAtomValue(getCurrentRoundAtom)
    const setTricks = useSetAtom(setTricksAtom)
    const advanceToNextRound = useSetAtom(advanceToNextRoundAtom)

    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
    const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null)
    const [isHydrated, setIsHydrated] = useState(false)

    // Wait for hydration
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    // Redirect if no game or wrong round (only after hydration and data loaded)
    useEffect(() => {
        if (!isHydrated || !game || !currentRound) return
        
        if (roundNumber !== game.currentRoundIndex + 1) {
            router.push(`/boerenbridge/round/${game.currentRoundIndex + 1}/tricks`)
        }
    }, [game, currentRound, roundNumber, router, isHydrated])

    // Redirect to setup if no game (separate effect to handle this case)
    useEffect(() => {
        if (!isHydrated) return
        // Give some time for atoms to hydrate from storage
        const timeout = setTimeout(() => {
            if (!game) {
                router.push("/boerenbridge/setup")
            }
        }, 100)
        return () => clearTimeout(timeout)
    }, [isHydrated, game, router])

    if (!isHydrated || !game || !currentRound) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">Laden...</div>
            </div>
        )
    }

    const playerOrder = game.playerOrder
    const currentPlayerId = playerOrder[currentPlayerIndex]
    const currentPlayer = players[currentPlayerId]

    // Calculate total tricks so far
    const totalTricks = Object.values(currentRound.tricks).reduce((sum, t) => sum + t, 0)

    // Check if all tricks are recorded
    const allTricksComplete = Object.keys(currentRound.tricks).length === playerOrder.length

    // Validate total tricks equals cards
    const totalTricksValid = totalTricks === cards

    // Is this the last round?
    const isLastRound = game.currentRoundIndex === BOEREN_BRIDGE_ROUNDS.length - 1

    const handleTricks = (tricks: number) => {
        if (editingPlayerId !== null) {
            // Editing existing player
            setTricks({ playerId: editingPlayerId, tricks })
            setEditingPlayerId(null)
        } else {
            // Entering new player
            setTricks({ playerId: currentPlayerId, tricks })
            if (currentPlayerIndex < playerOrder.length - 1) {
                setCurrentPlayerIndex(currentPlayerIndex + 1)
            }
        }
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

    const handleCancelEdit = () => {
        setEditingPlayerId(null)
    }

    // Get the player being edited or currently entering
    const activePlayerId = editingPlayerId ?? currentPlayerId
    const activePlayer = players[activePlayerId]
    const isEditing = editingPlayerId !== null

    const handleContinue = () => {
        if (!allTricksComplete || !totalTricksValid) return

        if (isLastRound) {
            router.push("/boerenbridge")
        } else {
            advanceToNextRound()
            router.push(`/boerenbridge/round/${roundNumber + 1}/bid`)
        }
    }

    return (
        <>
            <Title>
                Ronde {roundNumber} - Slagen
            </Title>

            <div className="space-y-6">
                {/* Round info */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-gray-400">Kaarten:</span>
                            <span className="ml-2 text-2xl font-bold text-emerald-400">{cards}</span>
                        </div>
                        <div>
                            <span className="text-gray-400">Slagen ingevoerd:</span>
                            <span
                                className={cn(
                                    "ml-2 text-xl font-bold",
                                    allTricksComplete && totalTricksValid
                                        ? "text-emerald-400"
                                        : allTricksComplete && !totalTricksValid
                                          ? "text-red-400"
                                          : "text-gray-200"
                                )}
                            >
                                {totalTricks} / {cards}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Validation warning */}
                {allTricksComplete && !totalTricksValid && !isEditing && (
                    <div className="flex flex-col items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            <span>
                                Totaal slagen ({totalTricks}) moet gelijk zijn aan aantal kaarten ({cards})
                            </span>
                        </div>
                        <span className="text-sm text-gray-400">
                            Klik op een speler hieronder om de slagen aan te passen
                        </span>
                    </div>
                )}

                {/* Current player input - show when entering new OR editing */}
                {(!allTricksComplete || isEditing) && activePlayer && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <PlayerAvatar player={activePlayer} />
                            <span className="text-xl font-bold text-gray-200">{activePlayer.name}</span>
                            <span className="text-gray-400">
                                (geboden: <span className="text-emerald-400 font-bold">{currentRound.bids[activePlayerId]}</span>)
                            </span>
                            {isEditing && (
                                <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded">Aanpassen</span>
                            )}
                        </div>

                        {/* Tricks buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: cards + 1 }, (_, i) => i).map((tricks) => (
                                <Button
                                    key={tricks}
                                    onClick={() => handleTricks(tricks)}
                                    variant="default"
                                    className={cn(
                                        "text-xl py-6",
                                        isEditing
                                            ? "bg-amber-600 hover:bg-amber-700"
                                            : "bg-slate-600 hover:bg-slate-500"
                                    )}
                                >
                                    {tricks}
                                </Button>
                            ))}
                        </div>

                        {/* Back/Cancel button */}
                        {(currentPlayerIndex > 0 || isEditing) && (
                            <Button variant="ghost" onClick={handleBack} className="w-full text-gray-400">
                                {isEditing ? "✕ Annuleren" : "← Vorige speler"}
                            </Button>
                        )}
                    </div>
                )}

                {/* Results summary */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-200">
                        Resultaten
                        {allTricksComplete && (
                            <span className="text-sm font-normal text-gray-400 ml-2">
                                (klik om aan te passen)
                            </span>
                        )}
                    </h3>
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
                                onClick={() => hasTricks && handleEditPlayer(playerId)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg transition-all",
                                    hasTricks ? "bg-slate-700 cursor-pointer hover:bg-slate-600" : "bg-slate-800 opacity-50",
                                    isBeingEdited && "ring-2 ring-amber-500 bg-slate-600"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <PlayerAvatar player={player} />
                                    <span className="font-semibold text-gray-200">{player.name}</span>
                                    {isBeingEdited && (
                                        <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded">bewerken</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-400">
                                        <span>Bod: </span>
                                        <span className="font-bold text-emerald-400">{bid}</span>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        <span>Slagen: </span>
                                        <span className={cn("font-bold", hasTricks ? "text-blue-400" : "text-gray-500")}>
                                            {hasTricks ? tricks : "-"}
                                        </span>
                                    </div>
                                    {hasTricks && (
                                        <div className="flex items-center gap-1">
                                            {isCorrect ? (
                                                <Check className="h-5 w-5 text-emerald-400" />
                                            ) : (
                                                <X className="h-5 w-5 text-red-400" />
                                            )}
                                            <span
                                                className={cn(
                                                    "font-bold font-mono text-lg",
                                                    score !== null && score > 0
                                                        ? "text-emerald-400"
                                                        : "text-red-400"
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

                {/* Continue button */}
                {allTricksComplete && totalTricksValid && (
                    <Button
                        onClick={handleContinue}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-xl py-6"
                    >
                        {isLastRound ? "Naar Eindstand →" : "Volgende Ronde →"}
                    </Button>
                )}
            </div>
        </>
    )
}

