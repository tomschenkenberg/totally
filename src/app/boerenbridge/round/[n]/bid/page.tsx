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

                {/* Current bidder */}
                {!allBidsComplete && currentBidder && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                            <PlayerAvatar player={currentBidder} className="w-16 h-16" />
                            <span className="text-3xl font-bold text-white">{currentBidder.name}</span>
                            {currentBidderIndex === biddingOrder.length - 1 && (
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
                                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        )}
                                    >
                                        {bid}
                                    </Button>
                                )
                            })}
                        </div>

                        {/* Back button */}
                        {currentBidderIndex > 0 && (
                            <Button variant="ghost" onClick={handleBack} className="w-full text-gray-400 text-lg py-4">
                                ← Vorige speler
                            </Button>
                        )}
                    </div>
                )}

                {/* Bids summary */}
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-200">Biedingen</h3>
                    {biddingOrder.map((playerId, index) => {
                        const player = players[playerId]
                        const bid = currentRound.bids[playerId]
                        const hasBid = bid !== undefined

                        return (
                            <div
                                key={playerId}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg",
                                    hasBid ? "bg-slate-700 border border-slate-600" : "bg-slate-800 opacity-50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <PlayerAvatar player={player} className="w-10 h-10" />
                                    <span className="font-bold text-lg text-white">{player.name}</span>
                                    {index === biddingOrder.length - 1 && (
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

