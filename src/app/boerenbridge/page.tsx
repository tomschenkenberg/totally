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
            <div className="flex items-center justify-center py-16">
                <div className="text-zinc-500">Laden...</div>
            </div>
        )
    }

    const playerOrder = game.playerOrder

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

    return (
        <>
            <Title>
                {isGameFinished ? (
                    <span className="flex items-center justify-center gap-2">
                        <Trophy className="h-7 w-7 text-amber-400" />
                        Eindstand
                    </span>
                ) : (
                    "Boerenbridge"
                )}
            </Title>

            <div className="space-y-4">
                {isGameFinished && sortedPlayers.length > 0 && (
                    <div className="rounded-2xl bg-linear-to-br from-amber-900/40 to-amber-800/20 border border-amber-500/30 p-5">
                        <div className="text-center space-y-3">
                            <div className="flex items-center justify-center gap-2">
                                <PartyPopper className="h-6 w-6 text-amber-400" />
                                <span className="text-xl font-bold text-amber-300">Gefeliciteerd!</span>
                                <PartyPopper className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{sortedPlayers[0].player.name}</div>
                                <div className="text-base text-amber-300/80">wint met {sortedPlayers[0].total} punten!</div>
                            </div>
                            <Button
                                onClick={() => {
                                    resetGame()
                                    router.push("/boerenbridge/setup")
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
                                <span className="text-2xl font-bold text-emerald-400">
                                    {BOEREN_BRIDGE_ROUNDS[currentRoundIndex]}
                                </span>
                            </div>
                            <div className="text-sm text-zinc-500">
                                {players[playerOrder[(game.dealerIndex + 1) % playerOrder.length]]?.name} biedt als eerste
                            </div>
                        </div>
                    </div>
                )}

                {!isGameFinished && (
                    <Button
                        onClick={handleContinue}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg font-bold h-14 rounded-xl"
                    >
                        <Play className="h-5 w-5 mr-2" />
                        Biedingen invoeren
                    </Button>
                )}

                <StandUpdate gameMode="boerenbridge" />

                {/* Standings */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider px-1">Stand</h3>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800/60">
                        {sortedPlayers.map((item, index) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex items-center justify-between px-4 py-3",
                                    index === 0 && isGameFinished && "bg-amber-500/5"
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
                                    <span className="font-semibold text-white">{item.player.name}</span>
                                </div>
                                <span
                                    className={cn(
                                        "text-2xl font-bold font-mono tabular-nums",
                                        item.total >= 0 ? "text-emerald-400" : "text-red-400"
                                    )}
                                >
                                    {item.total}
                                </span>
                            </div>
                        ))}
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
                                            const isComplete = Object.keys(round.tricks).length === playerOrder.length
                                            if (!isComplete && roundIndex === currentRoundIndex) return null

                                            return (
                                                <tr
                                                    key={roundIndex}
                                                    onClick={() => {
                                                        setEditingRoundIndex(roundIndex)
                                                        setIsEditModalOpen(true)
                                                    }}
                                                    className="border-b border-zinc-800/50 active:bg-zinc-800 transition-colors"
                                                >
                                                    <td className="py-2.5 px-3 text-zinc-400 font-mono font-bold">
                                                        {round.cards}
                                                    </td>
                                                    {playerOrder.map((id) => {
                                                        const bid = round.bids[id]
                                                        const tricks = round.tricks[id]
                                                        const hasResult = bid !== undefined && tricks !== undefined
                                                        const score = hasResult
                                                            ? calculateBoerenBridgeScore(bid, tricks)
                                                            : null

                                                        return (
                                                            <td key={id} className="text-center py-2.5 px-2">
                                                                {hasResult ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="text-[10px] text-zinc-600">
                                                                            {bid}→{tricks}
                                                                        </span>
                                                                        <span
                                                                            className={cn(
                                                                                "font-bold font-mono text-base",
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
