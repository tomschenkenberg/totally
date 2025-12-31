"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { playersAtom } from "@/lib/atoms/players"
import {
    schoppenvrouwenGameAtom,
    getSchoppenvrouwenPlayerTotalAtom,
    isSchoppenvrouwenFinishedAtom,
    resetSchoppenvrouwenGameAtom,
    getSchoppenvrouwenWinnerAtom,
    setSchoppenvrouwenScoreForRoundAtom,
    SCHOPPENVROUWEN_TARGET_SCORE,
    SCHOPPENVROUWEN_CARDS_PER_PLAYER
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Trophy, Crown, Play, PartyPopper, RotateCcw } from "lucide-react"
import { StandUpdate } from "@/components/stand-update"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SchoppenvrouwenScoreboard() {
    const router = useRouter()
    const game = useAtomValue(schoppenvrouwenGameAtom)
    const players = useAtomValue(playersAtom)
    const getPlayerTotal = useAtomValue(getSchoppenvrouwenPlayerTotalAtom)
    const isGameFinished = useAtomValue(isSchoppenvrouwenFinishedAtom)
    const winnerId = useAtomValue(getSchoppenvrouwenWinnerAtom)
    const resetGame = useSetAtom(resetSchoppenvrouwenGameAtom)
    const setScoreForRound = useSetAtom(setSchoppenvrouwenScoreForRoundAtom)
    const [isHydrated, setIsHydrated] = useState(false)
    const [editingRoundIndex, setEditingRoundIndex] = useState<number | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editScores, setEditScores] = useState<{ [playerId: number]: string }>({})

    // Wait for hydration
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (!isHydrated) return
        if (!game) {
            router.replace("/schoppenvrouwen/setup")
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
    const winner = winnerId !== null ? players[winnerId] : null
    const winnerTotal = winnerId !== null ? getPlayerTotal(winnerId) : 0

    const handleContinue = () => {
        if (isGameFinished) return
        router.push(`/schoppenvrouwen/round/${currentRoundIndex + 1}`)
    }

    const handleEditRound = (roundIndex: number) => {
        const round = game.rounds[roundIndex]
        if (!round) return
        
        const scores: { [playerId: number]: string } = {}
        playerOrder.forEach((id) => {
            scores[id] = round.scores[id]?.toString() || "0"
        })
        setEditScores(scores)
        setEditingRoundIndex(roundIndex)
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = () => {
        if (editingRoundIndex === null) return
        
        playerOrder.forEach((playerId) => {
            const score = parseInt(editScores[playerId] || "0", 10)
            if (!isNaN(score)) {
                setScoreForRound({ roundIndex: editingRoundIndex, playerId, score })
            }
        })
        
        setIsEditModalOpen(false)
        setEditingRoundIndex(null)
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
                    "Schoppenvrouwen"
                )}
            </Title>

            <div className="space-y-6">
                {/* Winner announcement for finished game */}
                {isGameFinished && winner && (
                    <div className="bg-linear-to-br from-amber-900/50 to-amber-700/30 border-2 border-amber-500 rounded-xl p-6">
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-3">
                                <PartyPopper className="h-8 w-8 text-amber-400" />
                                <span className="text-2xl font-bold text-amber-300">Gefeliciteerd!</span>
                                <PartyPopper className="h-8 w-8 text-amber-400" />
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <div className="text-left">
                                    <div className="text-3xl font-bold text-white">{winner.name}</div>
                                    <div className="text-lg text-amber-300">wint met {winnerTotal} punten!</div>
                                </div>
                            </div>
                            <Button
                                onClick={() => {
                                    resetGame()
                                    router.push("/schoppenvrouwen/setup")
                                }}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-xl font-bold py-6 mt-4"
                            >
                                <RotateCcw className="h-6 w-6 mr-3" />
                                Nieuw spel starten
                            </Button>
                        </div>
                    </div>
                )}

                {/* Progress indicator */}
                {!isGameFinished && (
                    <div className="bg-rose-900/30 border border-rose-600/50 rounded-lg p-4">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Crown className="h-6 w-6 text-amber-400" />
                                <span className="text-xl font-bold text-white">
                                    {players[playerOrder[game.dealerIndex]]?.name}
                                </span>
                                <span className="text-gray-200">deelt</span>
                                <span className="text-3xl font-bold text-rose-300">
                                    {SCHOPPENVROUWEN_CARDS_PER_PLAYER}
                                </span>
                                <span className="text-gray-200">kaarten</span>
                            </div>
                            <div className="text-base text-gray-200 font-medium">
                                Ronde {currentRoundIndex + 1} • Doel: {SCHOPPENVROUWEN_TARGET_SCORE} punten
                            </div>
                        </div>
                    </div>
                )}

                {/* Action button - above standings */}
                {!isGameFinished && (
                    <Button
                        onClick={handleContinue}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-xl font-bold py-8"
                    >
                        <Play className="h-6 w-6 mr-3" />
                        Scores invoeren →
                    </Button>
                )}

                {/* AI Stand Update */}
                <StandUpdate gameMode="schoppenvrouwen" />

                {/* Standings */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-200">Stand</h3>
                    {sortedPlayers.map((item, index) => {
                        const isWinner = isGameFinished && item.id === winnerId
                        const reachedTarget = item.total >= SCHOPPENVROUWEN_TARGET_SCORE
                        
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg bg-slate-700",
                                    isWinner && "border-2 border-amber-500 bg-slate-600"
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
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            "text-3xl font-bold font-mono",
                                            reachedTarget ? "text-amber-400" : "text-rose-400"
                                        )}
                                    >
                                        {item.total}
                                    </span>
                                    {reachedTarget && <Trophy className="h-5 w-5 text-amber-400" />}
                                </div>
                            </div>
                        )
                    })}
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
                                        const isComplete = Object.keys(round.scores).length === playerOrder.length
                                        if (!isComplete && roundIndex === currentRoundIndex) return null

                                        return (
                                            <tr
                                                key={roundIndex}
                                                onClick={() => handleEditRound(roundIndex)}
                                                className="border-b border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors"
                                            >
                                                <td className="p-3 text-white font-bold">
                                                    <span className="font-mono text-lg">{roundIndex + 1}</span>
                                                </td>
                                                {playerOrder.map((id) => {
                                                    const score = round.scores[id]
                                                    const hasScore = score !== undefined

                                                    return (
                                                        <td key={id} className="text-center p-3">
                                                            {hasScore ? (
                                                                <span
                                                                    className={cn(
                                                                        "font-bold font-mono text-xl",
                                                                        score > 0
                                                                            ? "text-emerald-400"
                                                                            : score < 0
                                                                              ? "text-red-400"
                                                                              : "text-gray-400"
                                                                    )}
                                                                >
                                                                    {score > 0 ? "+" : ""}{score}
                                                                </span>
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
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-slate-800 border-slate-600">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            Ronde {editingRoundIndex !== null ? editingRoundIndex + 1 : ""} bewerken
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {playerOrder.map((playerId) => (
                            <div key={playerId} className="flex items-center gap-4">
                                <Label className="text-white w-24 truncate">
                                    {players[playerId]?.name}
                                </Label>
                                <Input
                                    type="number"
                                    value={editScores[playerId] || "0"}
                                    onChange={(e) => setEditScores({ ...editScores, [playerId]: e.target.value })}
                                    className="bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                        ))}
                        <Button onClick={handleSaveEdit} className="w-full bg-rose-600 hover:bg-rose-700">
                            Opslaan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

