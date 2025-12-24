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

    // Get the player being edited or currently entering
    const activePlayerId = editingPlayerId ?? currentPlayerId
    const activePlayer = players[activePlayerId]
    const isEditing = editingPlayerId !== null

    // Auto-advance to scoreboard when all tricks are valid
    useEffect(() => {
        if (!allTricksComplete || !totalTricksValid || isEditing) return
        
        // Small delay for visual feedback
        const timeout = setTimeout(() => {
            if (!isLastRound) {
                advanceToNextRound()
            }
            router.push("/boerenbridge")
        }, 500)
        
        return () => clearTimeout(timeout)
    }, [allTricksComplete, totalTricksValid, isEditing, isLastRound, advanceToNextRound, router])

    return (
        <>
            <Title>
                Slagen - {cards} kaarten
            </Title>

            <div className="space-y-6">
                {/* Progress info */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                    <div className="flex justify-center items-center">
                        <span className="text-gray-300 font-medium text-lg">Ingevoerd:</span>
                        <span
                            className={cn(
                                "ml-3 text-3xl font-bold",
                                allTricksComplete && totalTricksValid
                                    ? "text-emerald-400"
                                    : allTricksComplete && !totalTricksValid
                                      ? "text-red-400"
                                      : "text-white"
                            )}
                        >
                            {totalTricks} / {cards}
                        </span>
                    </div>
                </div>

                {/* Validation warning */}
                {allTricksComplete && !totalTricksValid && !isEditing && (
                    <div className="flex flex-col items-center gap-3 text-red-300 bg-red-900/40 border border-red-500/50 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-8 w-8 text-red-400" />
                            <span className="text-lg font-bold">
                                Totaal slagen ({totalTricks}) moet {cards} zijn
                            </span>
                        </div>
                        <span className="text-base font-medium">
                            Klik op een speler hieronder om aan te passen
                        </span>
                    </div>
                )}

                {/* Current player input - show when entering new OR editing */}
                {(!allTricksComplete || isEditing) && activePlayer && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                            <PlayerAvatar player={activePlayer} className="w-16 h-16" />
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-white">{activePlayer.name}</span>
                                <span className="text-gray-300 text-lg">
                                    (geboden: <span className="text-emerald-400 font-bold">{currentRound.bids[activePlayerId]}</span>)
                                </span>
                            </div>
                            {isEditing && (
                                <span className="text-sm bg-amber-600 text-white px-3 py-1 rounded font-bold self-start">Aanpassen</span>
                            )}
                        </div>

                        {/* Tricks buttons */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {Array.from({ length: cards + 1 }, (_, i) => i).map((tricks) => (
                                <Button
                                    key={tricks}
                                    onClick={() => handleTricks(tricks)}
                                    variant="default"
                                    className={cn(
                                        "text-3xl font-bold py-8",
                                        isEditing
                                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                                            : "bg-slate-600 hover:bg-slate-500 text-white"
                                    )}
                                >
                                    {tricks}
                                </Button>
                            ))}
                        </div>

                        {/* Back/Cancel button */}
                        {(currentPlayerIndex > 0 || isEditing) && (
                            <Button variant="ghost" onClick={handleBack} className="w-full text-gray-400 text-lg py-4">
                                {isEditing ? "✕ Annuleren" : "← Vorige speler"}
                            </Button>
                        )}
                    </div>
                )}

                {/* Results summary */}
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-200">
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
                                    "flex items-center justify-between p-4 rounded-lg transition-all",
                                    hasTricks ? "bg-slate-700 cursor-pointer hover:bg-slate-600 border border-slate-600" : "bg-slate-800 opacity-50",
                                    isBeingEdited && "ring-4 ring-amber-500 bg-slate-600"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <PlayerAvatar player={player} className="w-12 h-12" />
                                    <span className="font-bold text-xl text-white">{player.name}</span>
                                    {isBeingEdited && (
                                        <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded font-bold">bewerken</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-base text-gray-300">
                                        <span>Bod: </span>
                                        <span className="font-bold text-emerald-400 text-xl">{bid}</span>
                                    </div>
                                    <div className="text-base text-gray-300">
                                        <span>Slagen: </span>
                                        <span className={cn("font-bold text-xl", hasTricks ? "text-blue-400" : "text-gray-500")}>
                                            {hasTricks ? tricks : "-"}
                                        </span>
                                    </div>
                                    {hasTricks && (
                                        <div className="flex items-center gap-2 min-w-[60px] justify-end">
                                            {isCorrect ? (
                                                <Check className="h-6 w-6 text-emerald-400" />
                                            ) : (
                                                <X className="h-6 w-6 text-red-400" />
                                            )}
                                            <span
                                                className={cn(
                                                    "font-bold font-mono text-2xl",
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

                {/* Auto-advancing indicator */}
                {allTricksComplete && totalTricksValid && (
                    <div className="text-center text-emerald-400 py-6">
                        <span className="animate-pulse text-xl font-bold">Naar scorebord...</span>
                    </div>
                )}
            </div>
        </>
    )
}

