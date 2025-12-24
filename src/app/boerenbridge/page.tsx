"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { playersAtom } from "@/lib/atoms/players"
import {
    boerenBridgeGameAtom,
    getPlayerBoerenBridgeTotalAtom,
    calculateBoerenBridgeScore,
    resetBoerenBridgeGameAtom,
    isGameFinishedAtom,
    BOEREN_BRIDGE_ROUNDS
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import PlayerAvatar from "@/components/avatar"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Trophy, Crown, RotateCcw, Play } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"

export default function BoerenBridgeScoreboard() {
    const router = useRouter()
    const game = useAtomValue(boerenBridgeGameAtom)
    const players = useAtomValue(playersAtom)
    const getPlayerTotal = useAtomValue(getPlayerBoerenBridgeTotalAtom)
    const resetGame = useSetAtom(resetBoerenBridgeGameAtom)
    const isGameFinished = useAtomValue(isGameFinishedAtom)
    const [isHydrated, setIsHydrated] = useState(false)

    // Wait for hydration
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (!isHydrated) return
        if (!game) {
            router.push("/boerenbridge/setup")
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

        if (!bidsComplete) {
            router.push(`/boerenbridge/round/${currentRoundIndex + 1}/bid`)
        } else if (!tricksComplete) {
            router.push(`/boerenbridge/round/${currentRoundIndex + 1}/tricks`)
        }
    }

    const handleNewGame = () => {
        resetGame()
        router.push("/")
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
                    "Boeren Bridge"
                )}
            </Title>

            <div className="space-y-6">
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
                                <span className="text-gray-200">kaarten</span>
                            </div>
                            <div className="text-base text-gray-200 font-medium">
                                {players[playerOrder[(game.dealerIndex + 1) % playerOrder.length]]?.name} biedt als eerste
                            </div>
                        </div>
                    </div>
                )}

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
                                <PlayerAvatar player={item.player} className="w-10 h-10" />
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
                        <h3 className="text-xl font-bold text-gray-200">Rondes</h3>
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
                                            <tr key={roundIndex} className="border-b border-slate-600">
                                                <td className="p-3 text-white font-bold">
                                                    <span className="font-mono text-lg">{round.cards}</span>
                                                    <span className="text-sm text-gray-300 ml-1 font-normal">kaarten</span>
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

                {/* Actions */}
                <div className="space-y-3">
                    {!isGameFinished && (
                        <Button
                            onClick={handleContinue}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-xl font-bold py-8"
                        >
                            <Play className="h-6 w-6 mr-3" />
                            Biedingen invoeren →
                        </Button>
                    )}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Nieuw Spel
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-800 border-slate-600">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Nieuw spel starten?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                    Het huidige spel wordt gewist. Dit kan niet ongedaan worden gemaakt.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-700 border-slate-600 hover:bg-slate-600">
                                    Annuleren
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleNewGame}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Ja, nieuw spel
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </>
    )
}

