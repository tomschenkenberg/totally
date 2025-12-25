"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useParams, useRouter } from "next/navigation"
import { playersAtom } from "@/lib/atoms/players"
import {
    boerenBridgeGameAtom,
    getCurrentRoundCardsAtom,
    getCurrentRoundAtom,
    setTricksAtom,
    calculateBoerenBridgeScore,
    BOEREN_BRIDGE_ROUNDS,
    advanceToNextRoundAtom
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import PlayerAvatar from "@/components/avatar"
import { cn } from "@/lib/utils"
import { useEffect, useState, useRef } from "react"
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
    const [isAutoAdvancing, setIsAutoAdvancing] = useState(false)

    // Wait for hydration
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    // Reset player index when round number changes or when entering tricks phase
    useEffect(() => {
        if (!isHydrated || !game || !currentRound) return
        
        // Find the first player who hasn't entered tricks yet
        const playerOrder = game.playerOrder
        const firstPlayerWithoutTricks = playerOrder.findIndex(
            (playerId) => currentRound.tricks[playerId] === undefined
        )
        
        if (firstPlayerWithoutTricks !== -1) {
            setCurrentPlayerIndex(firstPlayerWithoutTricks)
        } else {
            // All players have tricks, start from beginning
            setCurrentPlayerIndex(0)
        }
        setEditingPlayerId(null)
    }, [roundNumber, isHydrated, game, currentRound])

    // Redirect if no game or wrong round (only after hydration and data loaded)
    useEffect(() => {
        if (!isHydrated || !game || !currentRound) return
        if (autoAdvanceRef.current) return // Don't redirect if auto-advancing
        
        // Don't redirect if tricks are complete - we're navigating to scoreboard
        const tricksComplete = Object.keys(currentRound.tricks).length === game.playerOrder.length
        if (tricksComplete) return
        
        if (roundNumber !== game.currentRoundIndex + 1) {
            router.replace(`/boerenbridge/round/${game.currentRoundIndex + 1}/tricks`)
        }
    }, [game, currentRound, roundNumber, router, isHydrated])

    // Redirect to setup if no game
    useEffect(() => {
        if (!isHydrated) return
        if (!game) {
            router.replace("/boerenbridge/setup")
        }
    }, [isHydrated, game, router])

    // Calculate values safely (even if game/currentRound is null)
    const playerOrder = game?.playerOrder ?? []
    const currentPlayerId = playerOrder[currentPlayerIndex]
    const currentPlayer = currentPlayerId ? players[currentPlayerId] : null

    // Calculate total tricks so far
    const totalTricks = currentRound ? Object.values(currentRound.tricks).reduce((sum, t) => sum + t, 0) : 0

    // Check if all tricks are recorded
    const allTricksComplete = currentRound ? Object.keys(currentRound.tricks).length === playerOrder.length : false

    // Validate total tricks equals cards
    const totalTricksValid = totalTricks === cards

    // Is this the last round?
    const isLastRound = game ? game.currentRoundIndex === BOEREN_BRIDGE_ROUNDS.length - 1 : false

    // Get the player being edited or currently entering
    const activePlayerId = editingPlayerId ?? currentPlayerId
    const activePlayerForEdit = activePlayerId ? players[activePlayerId] : null
    const isEditing = editingPlayerId !== null

    // Ref to track if we've already started auto-advancing (used in handleTricks)
    const autoAdvanceRef = useRef(false)

    if (!isHydrated || !game || !currentRound) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">Laden...</div>
            </div>
        )
    }

    // Show loading state when auto-advancing to scoreboard
    // This prevents visual glitch when round advances but navigation hasn't happened yet
    if (isAutoAdvancing) {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="animate-pulse text-xl font-bold text-emerald-400">Naar scorebord...</span>
            </div>
        )
    }

    // Recalculate after early return when we know game/currentRound are available
    const safePlayerOrder = game.playerOrder
    // Find first player without tricks
    const firstPlayerWithoutTricksIndex = safePlayerOrder.findIndex(
        (playerId) => currentRound.tricks[playerId] === undefined
    )
    // Use the first player without tricks, or first player if all have tricks
    const targetPlayerIndex = firstPlayerWithoutTricksIndex !== -1 ? firstPlayerWithoutTricksIndex : 0
    // Ensure targetPlayerIndex is within bounds
    const safeTargetPlayerIndex = targetPlayerIndex >= 0 && targetPlayerIndex < safePlayerOrder.length ? targetPlayerIndex : 0
    // Use editing player ID if editing, otherwise use target player, with fallback to first player
    // Always ensure we have a valid player ID
    let safeActivePlayerId: number | null = null
    if (editingPlayerId !== null) {
        safeActivePlayerId = editingPlayerId
    } else if (safePlayerOrder.length > 0) {
        // Try target player index first
        if (safeTargetPlayerIndex >= 0 && safeTargetPlayerIndex < safePlayerOrder.length) {
            safeActivePlayerId = safePlayerOrder[safeTargetPlayerIndex]
        }
        // Fallback to first player if target index didn't work
        if (safeActivePlayerId === null || safeActivePlayerId === undefined) {
            safeActivePlayerId = safePlayerOrder[0]
        }
    }
    // Ensure we always have a valid player
    const activePlayer = safeActivePlayerId && players[safeActivePlayerId] 
        ? players[safeActivePlayerId] 
        : (safePlayerOrder.length > 0 && players[safePlayerOrder[0]] ? players[safePlayerOrder[0]] : null)
    
    // Recalculate completion status with safe values
    const tricksEntered = Object.keys(currentRound.tricks).length
    const safeAllTricksComplete = tricksEntered === safePlayerOrder.length
    const safeTotalTricks = Object.values(currentRound.tricks).reduce((sum, t) => sum + t, 0)
    const safeTotalTricksValid = safeTotalTricks === cards
    const needsTricksInput = tricksEntered < safePlayerOrder.length

    // Calculate how many players still need to enter tricks
    const playersWithoutTricks = safePlayerOrder.filter(
        (playerId) => currentRound.tricks[playerId] === undefined
    )
    const isLastPlayer = playersWithoutTricks.length === 1 && !isEditing
    
    // Calculate remaining tricks for last player
    // When editing, exclude the edited player's tricks from the total
    const tricksWithoutCurrentPlayer = isEditing && editingPlayerId !== null
        ? Object.entries(currentRound.tricks)
            .filter(([id]) => Number(id) !== editingPlayerId)
            .reduce((sum, [, t]) => sum + t, 0)
        : safeTotalTricks
    const remainingTricks = cards - tricksWithoutCurrentPlayer

    const handleTricks = (tricks: number) => {
        // Calculate if this trick will complete the round
        let newTotal: number
        let newCount: number
        
        if (editingPlayerId !== null) {
            newTotal = safeTotalTricks - (currentRound.tricks[editingPlayerId] || 0) + tricks
            newCount = tricksEntered // editing doesn't change count
        } else {
            newTotal = safeTotalTricks + tricks
            newCount = tricksEntered + 1
        }
        
        const willBeComplete = newCount === safePlayerOrder.length
        const willBeValid = newTotal === cards
        const isLast = game.currentRoundIndex === BOEREN_BRIDGE_ROUNDS.length - 1
        
        // If this completes the round, set loading state BEFORE the state update
        // This prevents any flash of the completed state
        if (willBeComplete && willBeValid && !autoAdvanceRef.current) {
            autoAdvanceRef.current = true
            setIsAutoAdvancing(true)
            
            // Schedule advance + navigation after the state update is processed
            queueMicrotask(() => {
                if (!isLast) {
                    advanceToNextRound()
                }
                // Navigate immediately - no delay needed since we already show loading state
                router.replace("/boerenbridge")
            })
        }
        
        // Now update the tricks
        if (editingPlayerId !== null) {
            setTricks({ playerId: editingPlayerId, tricks })
            setEditingPlayerId(null)
        } else if (safeActivePlayerId !== null) {
            setTricks({ playerId: safeActivePlayerId, tricks })
            // Move to next player without tricks
            const currentIdx = safePlayerOrder.indexOf(safeActivePlayerId)
            const nextPlayerIndex = safePlayerOrder.findIndex(
                (playerId, idx) => idx > currentIdx && currentRound.tricks[playerId] === undefined
            )
            if (nextPlayerIndex !== -1) {
                setCurrentPlayerIndex(nextPlayerIndex)
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
                                safeAllTricksComplete && safeTotalTricksValid
                                    ? "text-emerald-400"
                                    : safeAllTricksComplete && !safeTotalTricksValid
                                      ? "text-red-400"
                                      : "text-white"
                            )}
                        >
                            {safeTotalTricks} / {cards}
                        </span>
                    </div>
                </div>

                {/* Validation warning */}
                {safeAllTricksComplete && !safeTotalTricksValid && !isEditing && (
                    <div className="flex flex-col items-center gap-3 text-red-300 bg-red-900/40 border border-red-500/50 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-8 w-8 text-red-400" />
                            <span className="text-lg font-bold">
                                Totaal slagen ({safeTotalTricks}) moet {cards} zijn
                            </span>
                        </div>
                        <span className="text-base font-medium">
                            Klik op een speler hieronder om aan te passen
                        </span>
                    </div>
                )}

                {/* Current player input - show when entering new OR editing */}
                {(needsTricksInput || isEditing) && activePlayer && safeActivePlayerId !== null && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                            <PlayerAvatar player={activePlayer} className="w-16 h-16" />
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-white">
                                    {activePlayer.name}
                                </span>
                                <span className="text-gray-300 text-lg">
                                    (geboden: <span className="text-emerald-400 font-bold">{currentRound.bids[safeActivePlayerId] ?? 0}</span>)
                                </span>
                            </div>
                            {isEditing && (
                                <span className="text-sm bg-amber-600 text-white px-3 py-1 rounded font-bold self-start">Aanpassen</span>
                            )}
                        </div>

                        {/* Tricks buttons */}
                        {isLastPlayer ? (
                            <div className="space-y-3">
                                <div className="text-center text-amber-300 text-lg font-medium">
                                    Resterende slagen: <span className="font-bold text-2xl">{remainingTricks}</span>
                                </div>
                                <Button
                                    onClick={() => handleTricks(remainingTricks)}
                                    variant="default"
                                    className="w-full text-4xl font-bold py-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {remainingTricks}
                                </Button>
                            </div>
                        ) : (
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
                        )}

                        {/* Back/Cancel button */}
                        {(safeTargetPlayerIndex > 0 || isEditing) && (
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
                        {safeAllTricksComplete && (
                            <span className="text-sm font-normal text-gray-400 ml-2">
                                (klik om aan te passen)
                            </span>
                        )}
                    </h3>
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
                                    "flex items-center justify-between p-3 rounded-lg transition-all",
                                    hasTricks ? "bg-slate-700 cursor-pointer hover:bg-slate-600 border border-slate-600" : "bg-slate-800 opacity-50",
                                    isBeingEdited && "ring-4 ring-amber-500 bg-slate-600"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg text-white">{player.name}</span>
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

            </div>
        </>
    )
}

