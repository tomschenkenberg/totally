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
    const completedRounds = game.rounds.filter(
        (r) => Object.keys(r.tricks).length === playerOrder.length
    ).length

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
                {/* Game progress */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-gray-400">Ronde:</span>
                            <span className="ml-2 text-xl font-bold text-emerald-400">
                                {completedRounds} / {BOEREN_BRIDGE_ROUNDS.length}
                            </span>
                        </div>
                        {!isGameFinished && (
                            <div className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-amber-500" />
                                <span className="text-gray-400">Deler:</span>
                                <span className="ml-1 font-semibold text-gray-200">
                                    {players[playerOrder[game.dealerIndex]]?.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

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
                                        "w-8 h-8 flex items-center justify-center rounded-full font-bold",
                                        index === 0
                                            ? "bg-amber-500 text-slate-900"
                                            : index === 1
                                              ? "bg-gray-400 text-slate-900"
                                              : index === 2
                                                ? "bg-amber-700 text-white"
                                                : "bg-slate-600 text-gray-400"
                                    )}
                                >
                                    {index + 1}
                                </span>
                                <PlayerAvatar player={item.player} />
                                <span className="font-semibold text-gray-200">{item.player.name}</span>
                            </div>
                            <span
                                className={cn(
                                    "text-2xl font-bold font-mono",
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
                        <h3 className="text-lg font-semibold text-gray-200">Rondes</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-600">
                                        <th className="text-left p-2 text-gray-400">Ronde</th>
                                        {playerOrder.map((id) => (
                                            <th key={id} className="text-center p-2 text-gray-400 min-w-[60px]">
                                                {players[id]?.name?.slice(0, 6)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {game.rounds.map((round, roundIndex) => {
                                        const isComplete = Object.keys(round.tricks).length === playerOrder.length
                                        if (!isComplete && roundIndex === currentRoundIndex) return null

                                        return (
                                            <tr key={roundIndex} className="border-b border-slate-700">
                                                <td className="p-2 text-gray-400">
                                                    <span className="font-mono">{round.cards}</span>
                                                    <span className="text-xs text-gray-500 ml-1">kaarten</span>
                                                </td>
                                                {playerOrder.map((id) => {
                                                    const bid = round.bids[id]
                                                    const tricks = round.tricks[id]
                                                    const hasResult = bid !== undefined && tricks !== undefined
                                                    const score = hasResult
                                                        ? calculateBoerenBridgeScore(bid, tricks)
                                                        : null

                                                    return (
                                                        <td key={id} className="text-center p-2">
                                                            {hasResult ? (
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-xs text-gray-500">
                                                                        {bid}→{tricks}
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            "font-bold font-mono",
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
                                                                <span className="text-gray-600">-</span>
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
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-xl py-6"
                        >
                            <Play className="h-5 w-5 mr-2" />
                            Ronde {currentRoundIndex + 1} Spelen ({BOEREN_BRIDGE_ROUNDS[currentRoundIndex]} kaarten)
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

