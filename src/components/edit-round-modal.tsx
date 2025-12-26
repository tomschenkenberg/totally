"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { playersAtom } from "@/lib/atoms/players"
import {
    boerenBridgeGameAtom,
    setBidForRoundAtom,
    setTricksForRoundAtom,
    calculateBoerenBridgeScore,
    BOEREN_BRIDGE_ROUNDS
} from "@/lib/atoms/game"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import PlayerAvatar from "@/components/avatar"
import { cn } from "@/lib/utils"
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

    // Calculate total tricks
    const totalTricks = Object.values(round.tricks).reduce((sum, t) => sum + t, 0)
    const totalTricksValid = totalTricks === cards

    const handleBid = (playerId: number, bid: number) => {
        setBidForRound({ roundIndex, playerId, bid })
    }

    const handleTricks = (playerId: number, tricks: number) => {
        setTricksForRound({ roundIndex, playerId, tricks })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-2xl">
                        Ronde {roundIndex + 1} bewerken
                    </SheetTitle>
                    <SheetDescription>
                        {cards} {cards === 1 ? "kaart" : "kaarten"}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Validation warning */}
                    {!totalTricksValid && (
                        <div className="flex flex-col items-center gap-3 text-red-300 bg-red-900/40 border border-red-500/50 p-4 rounded-lg">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-6 w-6 text-red-400" />
                                <span className="text-base font-bold">
                                    Totaal slagen ({totalTricks}) moet {cards} zijn
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Progress info */}
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                        <div className="flex justify-center items-center">
                            <span className="text-gray-300 font-medium">Totaal slagen:</span>
                            <span
                                className={cn(
                                    "ml-3 text-2xl font-bold",
                                    totalTricksValid ? "text-emerald-400" : "text-red-400"
                                )}
                            >
                                {totalTricks} / {cards}
                            </span>
                        </div>
                    </div>

                    {/* Players list */}
                    <div className="space-y-4">
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
                                    className="bg-slate-800 rounded-lg p-4 border border-slate-600 space-y-4"
                                >
                                    {/* Player header */}
                                    <div className="flex items-center gap-3">
                                        <PlayerAvatar player={player} className="w-10 h-10" />
                                        <span className="font-bold text-lg text-white">{player.name}</span>
                                        {hasBid && hasTricks && (
                                            <div className="flex items-center gap-2 ml-auto">
                                                {isCorrect ? (
                                                    <Check className="h-5 w-5 text-emerald-400" />
                                                ) : (
                                                    <X className="h-5 w-5 text-red-400" />
                                                )}
                                                <span
                                                    className={cn(
                                                        "font-bold font-mono text-xl",
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

                                    {/* Bid section */}
                                    <div>
                                        <div className="text-sm text-gray-400 mb-2">Bod:</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Array.from({ length: cards + 1 }, (_, i) => i).map((bidValue) => (
                                                <Button
                                                    key={bidValue}
                                                    onClick={() => handleBid(playerId, bidValue)}
                                                    variant={bid === bidValue ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        bid === bidValue
                                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            : ""
                                                    )}
                                                >
                                                    {bidValue}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tricks section */}
                                    <div>
                                        <div className="text-sm text-gray-400 mb-2">Slagen:</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Array.from({ length: cards + 1 }, (_, i) => i).map((tricksValue) => (
                                                <Button
                                                    key={tricksValue}
                                                    onClick={() => handleTricks(playerId, tricksValue)}
                                                    variant={tricks === tricksValue ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        tricks === tricksValue
                                                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                            : ""
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

