"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { playersAtom } from "@/lib/atoms/players"
import {
    boerenBridgeGameAtom,
    getPlayerBoerenBridgeTotalAtom,
    calculateBoerenBridgeScore,
    isGameFinishedAtom,
    resetBoerenBridgeGameAtom,
    BOEREN_BRIDGE_ROUNDS
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Trophy, Crown, Play, PartyPopper, RotateCcw } from "lucide-react"
import { EditRoundModal } from "@/components/edit-round-modal"
import { StandUpdate } from "@/components/stand-update"

export default function BoerenBridgeScoreboard() {
    const router = useRouter()
    const game = useAtomValue(boerenBridgeGameAtom)
    const players = useAtomValue(playersAtom)
    const getPlayerTotal = useAtomValue(getPlayerBoerenBridgeTotalAtom)
    const isGameFinished = useAtomValue(isGameFinishedAtom)
    const resetGame = useSetAtom(resetBoerenBridgeGameAtom)
    const [isHydrated, setIsHydrated] = useState(false)
    const [editingRoundIndex, setEditingRoundIndex] = useState<number | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    // Wait for hydration
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (!isHydrated) return
        if (!game) {
            router.replace("/boerenbridge/setup")
        }
    }, [game, router, isHydrated])

    if (!isHydrated || !game) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">Laden...</div>
            </div>
        )
    }

    const playerOrder = game.playerOrder

    // Get sorted players by total score
    const sortedPlayers = [...playerOrder]
        .map((id) => ({
            id,
            player: players[id],
            total: getPlayerTotal(id)
        }))
        .sort((a, b) => b.total - a.total)

    const currentRoundIndex = game.currentRoundIndex

    const handleContinue = () => {
        if (isGameFinished) return
        
        const currentRound = game.rounds[currentRoundIndex]
        const bidsComplete = Object.keys(currentRound?.bids || {}).length === playerOrder.length
        const tricksComplete = Object.keys(currentRound?.tricks || {}).length === playerOrder.length

        // Round should already be advanced from tricks page when complete
        // Navigate based on current round state
        if (!bidsComplete) {
            router.push(`/boerenbridge/round/${currentRoundIndex + 1}/bid`)
        } else if (!tricksComplete) {
            router.push(`/boerenbridge/round/${currentRoundIndex + 1}/tricks`)
        }
    }

    return (
        <>
            <Title>
                {isGameFinished ? (
                    <span className="flex items-center justify-center gap-2">
                        <Trophy className="h-8 w-8 text-amber-400" />
                        Eindstand
                    </span>
                ) : (
                    "Boerenbridge"
                )}
            </Title>

            <div className="space-y-6">
                {/* Winner announcement for finished game */}
                {isGameFinished && sortedPlayers.length > 0 && (
                    <div className="bg-linear-to-br from-amber-900/50 to-amber-700/30 border-2 border-amber-500 rounded-xl p-6">
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-3">
                                <PartyPopper className="h-8 w-8 text-amber-400" />
                                <span className="text-2xl font-bold text-amber-300">Gefeliciteerd!</span>
                                <PartyPopper className="h-8 w-8 text-amber-400" />
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <div className="text-left">
                                    <div className="text-3xl font-bold text-white">{sortedPlayers[0].player.name}</div>
                                    <div className="text-lg text-amber-300">wint met {sortedPlayers[0].total} punten!</div>
                                </div>
                            </div>
                            <Button
                                onClick={() => {
                                    resetGame()
                                    router.push("/boerenbridge/setup")
                                }}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-xl font-bold py-6 mt-4"
                            >
                                <RotateCcw className="h-6 w-6 mr-3" />
                                Nieuw spel starten
                            </Button>
                        </div>
                    </div>
                )}

                {/* Next action prompt */}
                {!isGameFinished && (
                    <div className="bg-emerald-900/30 border border-emerald-600/50 rounded-lg p-4">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Crown className="h-6 w-6 text-amber-400" />
                                <span className="text-xl font-bold text-white">
                                    {players[playerOrder[game.dealerIndex]]?.name}
                                </span>
                                <span className="text-gray-200">deelt</span>
                                <span className="text-3xl font-bold text-emerald-300">
                                    {BOEREN_BRIDGE_ROUNDS[currentRoundIndex]}
                                </span>
                                <span className="text-gray-200">
                                    {BOEREN_BRIDGE_ROUNDS[currentRoundIndex] === 1 ? "kaart" : "kaarten"}
                                </span>
                            </div>
                            <div className="text-base text-gray-200 font-medium">
                                {players[playerOrder[(game.dealerIndex + 1) % playerOrder.length]]?.name} biedt als eerste
                            </div>
                        </div>
                    </div>
                )}

                {/* Action button - above standings */}
                {!isGameFinished && (
                    <Button
                        onClick={handleContinue}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-xl font-bold py-8"
                    >
                        <Play className="h-6 w-6 mr-3" />
                        Biedingen invoeren →
                    </Button>
                )}

                {/* AI Stand Update */}
                <StandUpdate gameMode="boerenbridge" />

                {/* Standings */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-200">Stand</h3>
                    {sortedPlayers.map((item, index) => (
                        <div
                            key={item.id}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg bg-slate-700",
                                index === 0 && isGameFinished && "border-2 border-amber-500 bg-slate-600"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        "w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg",
                                        index === 0
                                            ? "bg-amber-500 text-slate-900"
                                            : index === 1
                                              ? "bg-gray-300 text-slate-900"
                                              : index === 2
                                                ? "bg-amber-700 text-white"
                                                : "bg-slate-600 text-white"
                                    )}
                                >
                                    {index + 1}
                                </span>
                                <span className="font-bold text-white text-lg">{item.player.name}</span>
                            </div>
                            <span
                                className={cn(
                                    "text-3xl font-bold font-mono",
                                    item.total >= 0 ? "text-emerald-400" : "text-red-400"
                                )}
                            >
                                {item.total}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Round history */}
                {game.rounds.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-200">
                            Rondes
                            <span className="text-sm font-normal text-gray-400 ml-2">
                                (klik om te bewerken)
                            </span>
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-base">
                                <thead>
                                    <tr className="border-b-2 border-slate-600">
                                        <th className="text-left p-3 text-white font-bold">Ronde</th>
                                        {playerOrder.map((id) => (
                                            <th key={id} className="text-center p-3 text-white font-bold min-w-[80px]">
                                                {players[id]?.name?.slice(0, 8)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {game.rounds.map((round, roundIndex) => {
                                        const isComplete = Object.keys(round.tricks).length === playerOrder.length
                                        if (!isComplete && roundIndex === currentRoundIndex) return null

                                        return (
                                            <tr
                                                key={roundIndex}
                                                onClick={() => {
                                                    setEditingRoundIndex(roundIndex)
                                                    setIsEditModalOpen(true)
                                                }}
                                                className="border-b border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors"
                                            >
                                                <td className="p-3 text-white font-bold">
                                                    <span className="font-mono text-lg">{round.cards}</span>
                                                    <span className="text-sm text-gray-300 ml-1 font-normal">
                                                        {round.cards === 1 ? "kaart" : "kaarten"}
                                                    </span>
                                                </td>
                                                {playerOrder.map((id) => {
                                                    const bid = round.bids[id]
                                                    const tricks = round.tricks[id]
                                                    const hasResult = bid !== undefined && tricks !== undefined
                                                    const score = hasResult
                                                        ? calculateBoerenBridgeScore(bid, tricks)
                                                        : null

                                                    return (
                                                        <td key={id} className="text-center p-3">
                                                            {hasResult ? (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="text-sm text-gray-300 font-medium">
                                                                        {bid} → {tricks}
                                                                    </span>
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
                                                            ) : (
                                                                <span className="text-gray-500 font-bold">-</span>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* Edit Round Modal */}
            <EditRoundModal
                roundIndex={editingRoundIndex}
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    setIsEditModalOpen(open)
                    if (!open) {
                        setEditingRoundIndex(null)
                    }
                }}
            />
        </>
    )
}

