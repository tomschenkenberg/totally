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
    SCHOPPENVROUWEN_CARDS_PER_PLAYER,
    isSchoppenvrouwenRoundFullyScored,
    isValidSchoppenvrouwenGame
} from "@/lib/atoms/game"
import { Button } from "@/components/ui/button"
import Title from "@/components/title"
import { cn, scoreTextClass } from "@/lib/utils"
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

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (!isHydrated) return
        if (!game) {
            router.replace("/schoppenvrouwen/setup")
            return
        }
        if (!isValidSchoppenvrouwenGame(game)) {
            console.warn("Invalid schoppenvrouwen game shape in storage — resetting", game)
            resetGame()
            router.replace("/schoppenvrouwen/setup")
        }
    }, [game, router, isHydrated, resetGame])

    if (!isHydrated || !game || !isValidSchoppenvrouwenGame(game)) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-zinc-500">Laden...</div>
            </div>
        )
    }

    const playerOrder = game.playerOrder
    const currentRoundIndex = game.currentRoundIndex
    const n = playerOrder.length
    const currentRound = game.rounds[currentRoundIndex]
    const currentRoundPartial =
        currentRound !== undefined && !isSchoppenvrouwenRoundFullyScored(currentRound, n)

    const sortedPlayers = [...playerOrder]
        .map((id) => {
            const official = getPlayerTotal(id)
            const displayTotal =
                official + (currentRoundPartial ? (currentRound!.scores[id] ?? 0) : 0)
            return { id, player: players[id], total: displayTotal, official }
        })
        .sort((a, b) => b.total - a.total)
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
                        <Trophy className="h-7 w-7 text-amber-400" />
                        Eindstand
                    </span>
                ) : (
                    "Schoppenvrouwen"
                )}
            </Title>

            <div className="space-y-4">
                {isGameFinished && winner && (
                    <div className="rounded-2xl bg-linear-to-br from-amber-900/40 to-amber-800/20 border border-amber-500/30 p-5">
                        <div className="text-center space-y-3">
                            <div className="flex items-center justify-center gap-2">
                                <PartyPopper className="h-6 w-6 text-amber-400" />
                                <span className="text-xl font-bold text-amber-300">Gefeliciteerd!</span>
                                <PartyPopper className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{winner.name}</div>
                                <div className="text-base text-amber-300/80">wint met {winnerTotal} punten!</div>
                            </div>
                            <Button
                                onClick={() => {
                                    resetGame()
                                    router.push("/schoppenvrouwen/setup")
                                }}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-lg font-bold h-12 rounded-xl mt-2"
                            >
                                <RotateCcw className="h-5 w-5 mr-2" />
                                Nieuw spel starten
                            </Button>
                        </div>
                    </div>
                )}

                {!isGameFinished && (
                    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                        <div className="text-center space-y-1">
                            <div className="flex items-center justify-center gap-2">
                                <Crown className="h-5 w-5 text-amber-400" />
                                <span className="text-lg font-bold text-white">
                                    {players[playerOrder[game.dealerIndex]]?.name}
                                </span>
                                <span className="text-zinc-400">deelt</span>
                                <span className="text-2xl font-bold text-white tabular-nums">
                                    {SCHOPPENVROUWEN_CARDS_PER_PLAYER}
                                </span>
                                <span className="text-zinc-400">kaarten</span>
                            </div>
                            <div className="text-sm text-zinc-500">
                                Ronde {currentRoundIndex + 1} • Doel: {SCHOPPENVROUWEN_TARGET_SCORE} punten
                            </div>
                        </div>
                    </div>
                )}

                {!isGameFinished && (
                    <Button
                        onClick={handleContinue}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-lg font-bold h-14 rounded-xl"
                    >
                        <Play className="h-5 w-5 mr-2" />
                        Scores invoeren
                    </Button>
                )}

                <StandUpdate gameMode="schoppenvrouwen" />

                {/* Standings */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider px-1">Stand</h3>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800/60">
                        {sortedPlayers.map((item, index) => {
                            const isWinner = isGameFinished && item.id === winnerId
                            const reachedTarget = item.official >= SCHOPPENVROUWEN_TARGET_SCORE

                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-3",
                                        isWinner && "bg-amber-500/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={cn(
                                                "w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm",
                                                index === 0
                                                    ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                                                    : index === 1
                                                      ? "bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600"
                                                      : index === 2
                                                        ? "bg-amber-800/20 text-amber-600 ring-1 ring-amber-700/30"
                                                        : "bg-zinc-800 text-zinc-500"
                                            )}
                                        >
                                            {index + 1}
                                        </span>
                                        <span className="font-semibold text-white">
                                            {item.player?.name?.trim() || `Speler #${item.id}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "text-2xl font-bold font-mono tabular-nums",
                                                item.total < 0
                                                    ? "text-red-400"
                                                    : reachedTarget
                                                      ? "text-amber-400"
                                                      : "text-emerald-400"
                                            )}
                                        >
                                            {item.total}
                                        </span>
                                        {reachedTarget && <Trophy className="h-4 w-4 text-amber-400" />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Round history */}
                {game.rounds.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider px-1">
                            Rondes
                            <span className="normal-case tracking-normal font-normal text-zinc-600 ml-1.5">
                                (tik om te bewerken)
                            </span>
                        </h3>
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800">
                                            <th className="text-left py-2.5 px-3 text-zinc-500 font-semibold text-xs uppercase">#</th>
                                            {playerOrder.map((id) => (
                                                <th key={id} className="text-center py-2.5 px-2 text-zinc-500 font-semibold text-xs uppercase">
                                                    {players[id]?.name?.slice(0, 6)}
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
                                                    className="border-b border-zinc-800/50 active:bg-zinc-800 transition-colors"
                                                >
                                                    <td className="py-2.5 px-3 text-zinc-400 font-mono font-bold">
                                                        {roundIndex + 1}
                                                    </td>
                                                    {playerOrder.map((id) => {
                                                        const score = round.scores[id]
                                                        const hasScore = score !== undefined

                                                        return (
                                                            <td key={id} className="text-center py-2.5 px-2">
                                                                {hasScore ? (
                                                                    <span
                                                                        className={cn(
                                                                            "font-bold font-mono text-base",
                                                                            scoreTextClass(score)
                                                                        )}
                                                                    >
                                                                        {score > 0 ? "+" : ""}{score}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-zinc-700">-</span>
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
                    </div>
                )}
            </div>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 max-w-[calc(100vw-2rem)]">
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
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                        ))}
                        <Button onClick={handleSaveEdit} className="w-full bg-rose-600 hover:bg-rose-700 rounded-xl h-12">
                            Opslaan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
