"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useParams, useRouter } from "next/navigation"
import { playersAtom } from "@/lib/atoms/players"
import {
    boerenBridgeGameAtom,
    getCurrentRoundCardsAtom,
    getCurrentDealerIdAtom,
    getBiddingOrderAtom,
    getCurrentRoundAtom,
    setBidAtom,
    clearBidAtom
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import PlayerAvatar from "@/components/avatar"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Crown, AlertTriangle } from "lucide-react"

export default function BiddingPage() {
    const params = useParams()
    const router = useRouter()
    const roundNumber = Number(params.n)

    const game = useAtomValue(boerenBridgeGameAtom)
    const players = useAtomValue(playersAtom)
    const cards = useAtomValue(getCurrentRoundCardsAtom)
    const dealerId = useAtomValue(getCurrentDealerIdAtom)
    const biddingOrder = useAtomValue(getBiddingOrderAtom)
    const currentRound = useAtomValue(getCurrentRoundAtom)
    const setBid = useSetAtom(setBidAtom)
    const clearBid = useSetAtom(clearBidAtom)

    const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null)
    const [isHydrated, setIsHydrated] = useState(false)

    // Wait for hydration
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    // Calculate the current bidder index based on who hasn't bid yet
    // This is derived from the game state, not local state
    const calculatedBidderIndex = currentRound && biddingOrder.length > 0
        ? biddingOrder.findIndex((playerId) => {
            // Check if player has NOT bid (localStorage may serialize keys as strings)
            const hasBid = playerId in currentRound.bids || String(playerId) in currentRound.bids
            return !hasBid
        })
        : 0
    // If -1 (all have bid), keep it as -1 to let allBidsComplete handle it
    const currentBidderIndex = calculatedBidderIndex

    // Redirect if no game or wrong round (only after hydration and data loaded)
    useEffect(() => {
        if (!isHydrated || !game || !currentRound) return
        
        if (roundNumber !== game.currentRoundIndex + 1) {
            router.replace(`/boerenbridge/round/${game.currentRoundIndex + 1}/bid`)
        }
    }, [game, currentRound, roundNumber, router, isHydrated])

    // Redirect to setup if no game
    useEffect(() => {
        if (!isHydrated) return
        if (!game) {
            router.replace("/boerenbridge/setup")
        }
    }, [isHydrated, game, router])

    if (!isHydrated || !game || !currentRound) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">Laden...</div>
            </div>
        )
    }

    // Safely get current bidder (handle -1 case when all have bid)
    const currentBidderId = currentBidderIndex >= 0 && currentBidderIndex < biddingOrder.length 
        ? biddingOrder[currentBidderIndex] 
        : null
    const currentBidder = currentBidderId !== null ? players[currentBidderId] : null

    // Calculate total bids so far (excluding the player being edited)
    const totalBids = editingPlayerId !== null
        ? Object.entries(currentRound.bids)
            .filter(([id]) => Number(id) !== editingPlayerId)
            .reduce((sum, [, bid]) => sum + bid, 0)
        : Object.values(currentRound.bids).reduce((sum, bid) => sum + bid, 0)

    // Get the active player (being edited or currently bidding)
    const activePlayerId = editingPlayerId ?? currentBidderId
    const activePlayer = activePlayerId !== null ? players[activePlayerId] : null
    const isEditing = editingPlayerId !== null

    // Calculate forbidden bid for last bidder (when editing, recalculate based on remaining bids)
    // Check if the active player (being edited or currently bidding) is the last bidder
    const activePlayerIndex = editingPlayerId !== null
        ? biddingOrder.indexOf(editingPlayerId)
        : currentBidderIndex
    const isLastBidder = activePlayerIndex === biddingOrder.length - 1
    const forbiddenBid = isLastBidder ? cards - totalBids : null

    // Check if all bids are complete
    const allBidsComplete = Object.keys(currentRound.bids).length === biddingOrder.length

    const handleBid = (bid: number) => {
        if (editingPlayerId !== null) {
            // Editing mode: update the bid and exit edit mode
            setBid({ playerId: editingPlayerId, bid })
            setEditingPlayerId(null)
        } else if (currentBidderId !== null) {
            // Normal mode: set bid (currentBidderIndex is derived, will auto-advance)
            setBid({ playerId: currentBidderId, bid })
        }
    }

    const handleEditPlayer = (playerId: number) => {
        setEditingPlayerId(playerId)
    }

    const handleContinue = () => {
        router.push(`/boerenbridge/round/${roundNumber}/tricks`)
    }

    const handleBack = () => {
        if (editingPlayerId !== null) {
            // Cancel editing
            setEditingPlayerId(null)
        } else if (currentBidderIndex > 0) {
            // Go back to previous bidder by clearing their bid
            const prevBidderId = biddingOrder[currentBidderIndex - 1]
            clearBid({ playerId: prevBidderId })
        }
    }

    return (
        <>
            <Title>
                Bieden - {cards} kaarten
            </Title>

            <div className="space-y-6">
                {/* Dealer info */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Crown className="h-6 w-6 text-amber-500" />
                            <span className="text-gray-300 font-medium">Deler:</span>
                            <span className="ml-1 text-xl font-bold text-white">
                                {dealerId !== null && players[dealerId]?.name}
                            </span>
                        </div>
                        <div className="text-base text-gray-300">
                            Totaal: <span className="font-bold text-white text-lg">{totalBids}</span> / {cards}
                        </div>
                    </div>
                </div>

                {/* Current bidder or editing player */}
                {(!allBidsComplete || isEditing) && activePlayer && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                            <PlayerAvatar player={activePlayer} className="w-16 h-16" />
                            <span className="text-3xl font-bold text-white">{activePlayer.name}</span>
                            {isEditing && (
                                <span className="text-sm bg-amber-600 text-white px-3 py-1 rounded font-bold">Aanpassen</span>
                            )}
                            {!isEditing && isLastBidder && (
                                <span className="text-sm bg-amber-600 text-white px-3 py-1 rounded font-bold">Laatste</span>
                            )}
                        </div>

                        {/* Forbidden bid warning */}
                        {isLastBidder && forbiddenBid !== null && forbiddenBid >= 0 && forbiddenBid <= cards && (
                            <div className="flex items-center gap-2 justify-center text-amber-400 text-lg font-bold bg-amber-900/30 p-2 rounded">
                                <AlertTriangle className="h-6 w-6" />
                                <span>
                                    {forbiddenBid} mag niet
                                </span>
                            </div>
                        )}

                        {/* Bid buttons */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {Array.from({ length: cards + 1 }, (_, i) => i).map((bid) => {
                                const isForbidden =
                                    isLastBidder && forbiddenBid !== null && bid === forbiddenBid
                                return (
                                    <Button
                                        key={bid}
                                        onClick={() => handleBid(bid)}
                                        disabled={isForbidden}
                                        variant={isForbidden ? "outline" : "default"}
                                        className={cn(
                                            "text-3xl font-bold py-8",
                                            isForbidden
                                                ? "opacity-40 cursor-not-allowed line-through border-2 border-red-500 text-red-400"
                                                : isEditing
                                                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        )}
                                    >
                                        {bid}
                                    </Button>
                                )
                            })}
                        </div>

                        {/* Back/Cancel button */}
                        {((currentBidderIndex > 0 && currentBidderIndex !== -1) || isEditing) && (
                            <Button variant="ghost" onClick={handleBack} className="w-full text-gray-400 text-lg py-4">
                                {isEditing ? "✕ Annuleren" : "← Vorige speler"}
                            </Button>
                        )}
                    </div>
                )}

                {/* Bids summary */}
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-200">
                        Biedingen
                        {allBidsComplete && (
                            <span className="text-sm font-normal text-gray-400 ml-2">
                                (klik om aan te passen)
                            </span>
                        )}
                    </h3>
                    {biddingOrder.map((playerId, index) => {
                        const player = players[playerId]
                        const bid = currentRound.bids[playerId]
                        const hasBid = bid !== undefined
                        const isBeingEdited = editingPlayerId === playerId

                        return (
                            <div
                                key={playerId}
                                onClick={() => hasBid && handleEditPlayer(playerId)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg transition-all",
                                    hasBid
                                        ? "bg-slate-700 cursor-pointer hover:bg-slate-600 border border-slate-600"
                                        : "bg-slate-800 opacity-50",
                                    isBeingEdited && "ring-4 ring-amber-500 bg-slate-600"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <PlayerAvatar player={player} className="w-10 h-10" />
                                    <span className="font-bold text-lg text-white">{player.name}</span>
                                    {isBeingEdited && (
                                        <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded font-bold">bewerken</span>
                                    )}
                                    {index === biddingOrder.length - 1 && !isBeingEdited && (
                                        <span className="text-sm font-bold text-amber-400 ml-2">(laatste)</span>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-2xl font-bold font-mono",
                                        hasBid ? "text-emerald-400" : "text-gray-500"
                                    )}
                                >
                                    {hasBid ? bid : "-"}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Continue button - show who plays first */}
                {allBidsComplete && (
                    <div className="space-y-4">
                        <div className="bg-emerald-900/40 border-2 border-emerald-600 rounded-lg p-5 text-center">
                            <span className="text-gray-200 text-lg block mb-1">Eerste speler: </span>
                            <span className="text-3xl font-bold text-emerald-400 block">
                                {players[biddingOrder[0]]?.name}
                            </span>
                        </div>
                        <Button
                            onClick={handleContinue}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-2xl font-bold py-8"
                        >
                            Slagen invoeren →
                        </Button>
                    </div>
                )}
            </div>
        </>
    )
}

