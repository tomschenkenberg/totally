"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { playersAtom } from "@/lib/atoms/players"
import {
    BoerenBridgeGame,
    getCurrentRoundCardsAtom,
    getCurrentDealerIdAtom,
    getBiddingOrderAtom,
    getCurrentRoundAtom,
    getTotalBidsAtom,
    getForbiddenBidAtom,
    isBiddingCompleteAtom,
    setBidAtom,
    clearBidAtom,
    boerenBridgeBidsSumEqualsCards
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Crown, AlertTriangle, Check } from "lucide-react"
import { LoadingPlaceholder } from "@/components/loading-placeholder"

interface BiddingViewProps {
    game: BoerenBridgeGame
    onContinue: () => void
    onBackToScoreboard: () => void
}

export function BiddingView({ game, onContinue, onBackToScoreboard }: BiddingViewProps) {
    const players = useAtomValue(playersAtom)
    const cards = useAtomValue(getCurrentRoundCardsAtom)
    const dealerId = useAtomValue(getCurrentDealerIdAtom)
    const biddingOrder = useAtomValue(getBiddingOrderAtom)
    const currentRound = useAtomValue(getCurrentRoundAtom)
    const baseTotalBids = useAtomValue(getTotalBidsAtom)
    const forbiddenBidFromAtom = useAtomValue(getForbiddenBidAtom)
    const allBidsComplete = useAtomValue(isBiddingCompleteAtom)
    const setBid = useSetAtom(setBidAtom)
    const clearBid = useSetAtom(clearBidAtom)

    const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null)
    const [submittingBid, setSubmittingBid] = useState<{ bid: number; playerId: number } | null>(null)

    if (!currentRound) {
        return <LoadingPlaceholder />
    }

    const currentBidderIndex = biddingOrder.findIndex((playerId) => !(playerId in currentRound.bids))
    const currentBidderId =
        currentBidderIndex >= 0 && currentBidderIndex < biddingOrder.length
            ? biddingOrder[currentBidderIndex]
            : null

    const totalBids =
        editingPlayerId !== null
            ? Object.entries(currentRound.bids)
                  .filter(([id]) => Number(id) !== editingPlayerId)
                  .reduce((sum, [, bid]) => sum + bid, 0)
            : baseTotalBids

    const activePlayerId = editingPlayerId ?? currentBidderId
    const activePlayer = activePlayerId !== null ? players[activePlayerId] : null
    const isEditing = editingPlayerId !== null

    const activePlayerIndex =
        editingPlayerId !== null ? biddingOrder.indexOf(editingPlayerId) : currentBidderIndex
    const isLastBidder = activePlayerIndex === biddingOrder.length - 1
    const forbiddenBid =
        isEditing && isLastBidder ? cards - totalBids : isEditing ? null : forbiddenBidFromAtom

    const bidsSumInvalid =
        allBidsComplete &&
        boerenBridgeBidsSumEqualsCards(currentRound, cards, game.playerOrder.length)

    const handleBid = (bid: number) => {
        if (submittingBid) return

        const playerId = editingPlayerId ?? currentBidderId
        if (playerId === null) return

        const wasEditing = editingPlayerId !== null
        setSubmittingBid({ bid, playerId })
        setBid({ playerId, bid })
        if (wasEditing) {
            setEditingPlayerId(null)
        }
        requestAnimationFrame(() => setSubmittingBid(null))
    }

    const handleBack = () => {
        if (editingPlayerId !== null) {
            setEditingPlayerId(null)
            return
        }
        if (currentBidderIndex > 0) {
            clearBid({ playerId: biddingOrder[currentBidderIndex - 1] })
        }
    }

    return (
        <>
            <Title>Bieden - {cards} kaarten</Title>

            <div className="space-y-4">
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-amber-400" />
                            <span className="text-zinc-400 text-sm">Deler:</span>
                            <span className="font-bold text-white">
                                {dealerId !== null && players[dealerId]?.name}
                            </span>
                        </div>
                        <div className="text-sm text-zinc-400">
                            Totaal:{" "}
                            <span className="font-bold text-white text-lg font-mono">{totalBids}</span>
                            <span className="text-zinc-600">/{cards}</span>
                        </div>
                    </div>
                </div>

                {(!allBidsComplete || isEditing) && activePlayer && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-2xl font-bold text-white">{activePlayer.name}</span>
                            {isEditing && (
                                <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-semibold ring-1 ring-amber-500/30">
                                    Aanpassen
                                </span>
                            )}
                            {!isEditing && isLastBidder && (
                                <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-semibold ring-1 ring-amber-500/30">
                                    Laatste
                                </span>
                            )}
                        </div>

                        {forbiddenBid !== null && forbiddenBid >= 0 && forbiddenBid <= cards && (
                            <div className="flex items-center gap-2 justify-center text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-sm font-semibold">
                                <AlertTriangle className="h-4 w-4" />
                                <span>{forbiddenBid} mag niet</span>
                            </div>
                        )}

                        <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: cards + 1 }, (_, i) => i).map((bid) => {
                                const isForbidden = forbiddenBid !== null && bid === forbiddenBid
                                const isMyTurnSubmitting = submittingBid?.playerId === activePlayerId
                                const isSelected = isMyTurnSubmitting && submittingBid?.bid === bid
                                const isSubmittingOther = isMyTurnSubmitting && !isSelected

                                return (
                                    <Button
                                        key={bid}
                                        onClick={() => handleBid(bid)}
                                        disabled={isForbidden || isSubmittingOther || isSelected}
                                        variant={isForbidden ? "outline" : "default"}
                                        className={cn(
                                            "text-2xl font-bold h-16 rounded-xl transition-all duration-200",
                                            isForbidden
                                                ? "opacity-30 line-through border-red-500/30 text-red-400 bg-transparent"
                                                : isSelected
                                                  ? "bg-green-500 hover:bg-green-600 scale-105 ring-2 ring-green-400/50 text-white"
                                                  : isEditing
                                                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                                                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white",
                                            isSubmittingOther && "opacity-40 scale-95"
                                        )}
                                    >
                                        {isSelected ? (
                                            <Check className="w-7 h-7 animate-bounce" />
                                        ) : (
                                            bid
                                        )}
                                    </Button>
                                )
                            })}
                        </div>

                        <Button
                            variant="ghost"
                            onClick={
                                isEditing || (currentBidderIndex > 0 && currentBidderIndex !== -1)
                                    ? handleBack
                                    : onBackToScoreboard
                            }
                            className="w-full text-zinc-500 h-12 rounded-xl"
                        >
                            {isEditing
                                ? "Annuleren"
                                : currentBidderIndex > 0 && currentBidderIndex !== -1
                                  ? "← Vorige speler"
                                  : "← Scorebord"}
                        </Button>
                    </div>
                )}

                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider px-1">
                        Biedingen
                        {allBidsComplete && (
                            <span className="normal-case tracking-normal font-normal text-zinc-600 ml-1.5">
                                (tik om aan te passen)
                            </span>
                        )}
                    </h3>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800/60">
                        {biddingOrder.map((playerId, index) => {
                            const player = players[playerId]
                            const bid = currentRound.bids[playerId]
                            const hasBid = bid !== undefined
                            const isBeingEdited = editingPlayerId === playerId

                            return (
                                <div
                                    key={playerId}
                                    onClick={() => hasBid && setEditingPlayerId(playerId)}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-3 transition-all",
                                        hasBid ? "active:bg-zinc-800" : "opacity-40",
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
                                        {index === biddingOrder.length - 1 && !isBeingEdited && (
                                            <span className="text-xs text-amber-500/60">(laatste)</span>
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            "text-xl font-bold font-mono",
                                            hasBid ? "text-emerald-400" : "text-zinc-700"
                                        )}
                                    >
                                        {hasBid ? bid : "-"}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {allBidsComplete && bidsSumInvalid && (
                    <div className="flex items-center gap-2 text-red-300 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                        <span className="text-sm font-semibold">
                            Totaal geboden ({totalBids}) mag niet precies {cards} zijn. Pas een bod aan.
                        </span>
                    </div>
                )}

                {allBidsComplete && !isEditing && (
                    <div className="space-y-3">
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                            <span className="text-sm text-zinc-400">Eerste speler</span>
                            <span className="text-xl font-bold text-emerald-400 block mt-0.5">
                                {players[biddingOrder[0]]?.name}
                            </span>
                        </div>
                        <Button
                            onClick={onContinue}
                            disabled={bidsSumInvalid}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg font-bold h-14 rounded-xl"
                        >
                            Slagen invoeren →
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onBackToScoreboard}
                            className="w-full text-zinc-500 h-12 rounded-xl"
                        >
                            ← Scorebord
                        </Button>
                    </div>
                )}
            </div>
        </>
    )
}
