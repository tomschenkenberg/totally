"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { playersAtom } from "@/lib/atoms/players"
import {
    boerenBridgeGameAtom,
    setBidForRoundAtom,
    setTricksForRoundAtom,
    calculateBoerenBridgeScore,
    boerenBridgeBidsSumEqualsCards
} from "@/lib/atoms/game"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn, scoreTextClass } from "@/lib/utils"
import { AlertTriangle, Check, X } from "lucide-react"

interface EditRoundModalProps {
    roundIndex: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditRoundModal({ roundIndex, open, onOpenChange }: EditRoundModalProps) {
    const game = useAtomValue(boerenBridgeGameAtom)
    const players = useAtomValue(playersAtom)
    const setBidForRound = useSetAtom(setBidForRoundAtom)
    const setTricksForRound = useSetAtom(setTricksForRoundAtom)

    if (!game || roundIndex === null || roundIndex < 0 || roundIndex >= game.rounds.length) {
        return null
    }

    const round = game.rounds[roundIndex]
    const cards = round.cards
    const playerOrder = game.playerOrder

    const totalTricks = Object.values(round.tricks).reduce((sum, t) => sum + t, 0)
    const totalTricksValid = totalTricks === cards

    const allBidsEntered = playerOrder.every((id) => round.bids[id] !== undefined)
    const sumBids = Object.values(round.bids).reduce((s, b) => s + b, 0)
    const bidsSumInvalid = allBidsEntered && boerenBridgeBidsSumEqualsCards(round, cards, playerOrder.length)

    const handleBid = (playerId: number, bid: number) => {
        setBidForRound({ roundIndex, playerId, bid })
    }

    const handleTricks = (playerId: number, tricks: number) => {
        setTricksForRound({ roundIndex, playerId, tricks })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-zinc-950 border-zinc-800">
                <SheetHeader>
                    <SheetTitle className="text-xl text-white">
                        Ronde {roundIndex + 1} bewerken
                    </SheetTitle>
                    <SheetDescription className="text-zinc-500">
                        {cards} {cards === 1 ? "kaart" : "kaarten"}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                    {bidsSumInvalid && (
                        <div className="flex items-center gap-2 text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm">
                            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                            <span className="font-semibold">
                                Totaal geboden ({sumBids}) mag niet precies {cards} zijn
                            </span>
                        </div>
                    )}

                    {!totalTricksValid && (
                        <div className="flex items-center gap-2 text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm">
                            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                            <span className="font-semibold">
                                Totaal slagen ({totalTricks}) moet {cards} zijn
                            </span>
                        </div>
                    )}

                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                        <div className="flex justify-center items-center">
                            <span className="text-sm text-zinc-400">Totaal slagen:</span>
                            <span
                                className={cn(
                                    "ml-2 text-xl font-bold font-mono",
                                    totalTricksValid ? "text-emerald-400" : "text-red-400"
                                )}
                            >
                                {totalTricks}
                            </span>
                            <span className="text-zinc-600 font-mono ml-1">/ {cards}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {playerOrder.map((playerId) => {
                            const player = players[playerId]
                            const bid = round.bids[playerId]
                            const tricks = round.tricks[playerId]
                            const hasBid = bid !== undefined
                            const hasTricks = tricks !== undefined
                            const score = hasBid && hasTricks ? calculateBoerenBridgeScore(bid, tricks) : null
                            const isCorrect = hasBid && hasTricks && bid === tricks

                            return (
                                <div
                                    key={playerId}
                                    className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-white">{player.name}</span>
                                        {hasBid && hasTricks && (
                                            <div className="flex items-center gap-1.5 ml-auto">
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

                                    <div>
                                        <div className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Bod</div>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {Array.from({ length: cards + 1 }, (_, i) => i).map((bidValue) => (
                                                <Button
                                                    key={bidValue}
                                                    onClick={() => handleBid(playerId, bidValue)}
                                                    variant={bid === bidValue ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "h-9 rounded-lg text-sm",
                                                        bid === bidValue
                                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                                                    )}
                                                >
                                                    {bidValue}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Slagen</div>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {Array.from({ length: cards + 1 }, (_, i) => i).map((tricksValue) => (
                                                <Button
                                                    key={tricksValue}
                                                    onClick={() => handleTricks(playerId, tricksValue)}
                                                    variant={tricks === tricksValue ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "h-9 rounded-lg text-sm",
                                                        tricks === tricksValue
                                                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                            : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                                                    )}
                                                >
                                                    {tricksValue}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
