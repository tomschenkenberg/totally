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
    setBidAtom
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

    const [currentBidderIndex, setCurrentBidderIndex] = useState(0)
    const [isHydrated, setIsHydrated] = useState(false)

    // Wait for hydration
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    // Redirect if no game or wrong round (only after hydration and data loaded)
    useEffect(() => {
        if (!isHydrated || !game || !currentRound) return
        
        if (roundNumber !== game.currentRoundIndex + 1) {
            router.push(`/boerenbridge/round/${game.currentRoundIndex + 1}/bid`)
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

    const currentBidderId = biddingOrder[currentBidderIndex]
    const currentBidder = players[currentBidderId]

    // Calculate total bids so far
    const totalBids = Object.values(currentRound.bids).reduce((sum, bid) => sum + bid, 0)

    // Calculate forbidden bid for last bidder
    const isLastBidder = currentBidderIndex === biddingOrder.length - 1
    const forbiddenBid = isLastBidder ? cards - totalBids : null

    // Check if all bids are complete
    const allBidsComplete = Object.keys(currentRound.bids).length === biddingOrder.length

    const handleBid = (bid: number) => {
        setBid({ playerId: currentBidderId, bid })

        if (currentBidderIndex < biddingOrder.length - 1) {
            setCurrentBidderIndex(currentBidderIndex + 1)
        }
    }

    const handleContinue = () => {
        router.push(`/boerenbridge/round/${roundNumber}/tricks`)
    }

    const handleBack = () => {
        if (currentBidderIndex > 0) {
            // Remove the previous bid and go back
            const prevBidderId = biddingOrder[currentBidderIndex - 1]
            // We'll just go back visually, the bid stays
            setCurrentBidderIndex(currentBidderIndex - 1)
        }
    }

    return (
        <>
            <Title>
                Ronde {roundNumber} - Bieden
            </Title>

            <div className="space-y-6">
                {/* Round info */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-gray-400">Kaarten:</span>
                            <span className="ml-2 text-2xl font-bold text-emerald-400">{cards}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-amber-500" />
                            <span className="text-gray-400">Deler:</span>
                            <span className="ml-1 font-semibold text-gray-200">
                                {dealerId !== null && players[dealerId]?.name}
                            </span>
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                        Totaal geboden: <span className="font-bold text-gray-200">{totalBids}</span> / {cards}
                    </div>
                </div>

                {/* Current bidder */}
                {!allBidsComplete && currentBidder && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <PlayerAvatar player={currentBidder} />
                            <span className="text-xl font-bold text-gray-200">{currentBidder.name}</span>
                            {currentBidderIndex === biddingOrder.length - 1 && (
                                <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded">Laatste</span>
                            )}
                        </div>

                        {/* Forbidden bid warning */}
                        {isLastBidder && forbiddenBid !== null && forbiddenBid >= 0 && forbiddenBid <= cards && (
                            <div className="flex items-center gap-2 justify-center text-amber-400 text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                <span>
                                    {forbiddenBid} mag niet (totaal zou {cards} worden)
                                </span>
                            </div>
                        )}

                        {/* Bid buttons */}
                        <div className="grid grid-cols-4 gap-2">
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
                                            "text-xl py-6",
                                            isForbidden
                                                ? "opacity-30 cursor-not-allowed line-through"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                        )}
                                    >
                                        {bid}
                                    </Button>
                                )
                            })}
                        </div>

                        {/* Back button */}
                        {currentBidderIndex > 0 && (
                            <Button variant="ghost" onClick={handleBack} className="w-full text-gray-400">
                                ← Vorige speler
                            </Button>
                        )}
                    </div>
                )}

                {/* Bids summary */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-200">Biedingen</h3>
                    {biddingOrder.map((playerId, index) => {
                        const player = players[playerId]
                        const bid = currentRound.bids[playerId]
                        const hasBid = bid !== undefined

                        return (
                            <div
                                key={playerId}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg",
                                    hasBid ? "bg-slate-700" : "bg-slate-800 opacity-50"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <PlayerAvatar player={player} />
                                    <span className="font-semibold text-gray-200">{player.name}</span>
                                    {index === biddingOrder.length - 1 && (
                                        <span className="text-xs text-amber-400">(laatste)</span>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-xl font-bold font-mono",
                                        hasBid ? "text-emerald-400" : "text-gray-500"
                                    )}
                                >
                                    {hasBid ? bid : "-"}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Continue button */}
                {allBidsComplete && (
                    <Button
                        onClick={handleContinue}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-xl py-6"
                    >
                        Doorgaan naar Spelen →
                    </Button>
                )}
            </div>
        </>
    )
}

