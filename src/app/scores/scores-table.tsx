"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useAtomValue } from "jotai"
import { playersAtom, getNumberOfRoundsAtom } from "@/lib/atoms/players"
import {
    gameModeAtom,
    schoppenvrouwenGameAtom,
    isSchoppenvrouwenRoundFullyScored
} from "@/lib/atoms/game"

export default function ScoresTable() {
    const router = useRouter()
    const gameMode = useAtomValue(gameModeAtom)
    const players = useAtomValue(playersAtom)
    const rounds = useAtomValue(getNumberOfRoundsAtom)
    const schoppenvrouwenGame = useAtomValue(schoppenvrouwenGameAtom)

    if (gameMode === "schoppenvrouwen" && schoppenvrouwenGame) {
        const playerOrder = schoppenvrouwenGame.playerOrder
        const gameRounds = schoppenvrouwenGame.rounds

        const playerNames = playerOrder.map((id) => {
            const player = players[id]
            return player?.name || `Speler ${id + 1}`
        })

        const totals = playerOrder.map((id) =>
            gameRounds.reduce((sum, round) => {
                if (!isSchoppenvrouwenRoundFullyScored(round, playerOrder.length)) return sum
                return sum + (round.scores[id] || 0)
            }, 0)
        )

        const handleRowClick = (gameRoundIndex: number) => {
            router.push(`/schoppenvrouwen/round/${gameRoundIndex + 1}`)
        }

        return (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="w-10 text-center text-zinc-500 font-semibold text-xs">#</TableHead>
                            {playerNames.map((name, i) => (
                                <TableHead key={i} className="text-right text-zinc-400 font-semibold text-xs px-3">
                                    {name}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gameRounds.map((round, gameRoundIndex) => {
                            if (Object.keys(round.scores).length === 0) return null
                            return (
                                <TableRow
                                    key={gameRoundIndex}
                                    className="border-zinc-800/50 active:bg-zinc-800"
                                    onClick={() => handleRowClick(gameRoundIndex)}
                                >
                                    <TableCell className="w-10 text-center text-zinc-500 font-mono text-xs">
                                        {gameRoundIndex + 1}
                                    </TableCell>
                                    {playerOrder.map((id) => (
                                        <TableCell
                                            key={id}
                                            className="text-right font-mono px-3 text-zinc-300 text-sm"
                                        >
                                            {round.scores[id] ?? "-"}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )
                        })}
                        <TableRow className="border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800/30">
                            <TableCell className="w-10 text-center text-zinc-500 font-bold text-xs">Σ</TableCell>
                            {totals.map((total, i) => (
                                <TableCell key={i} className="text-right font-mono font-bold px-3 text-white text-sm">
                                    {total}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        )
    }

    const playerEntries = Object.entries(players)

    const totals = playerEntries.map(([, player]) =>
        Object.values(player.scores).reduce((sum, score) => sum + score, 0)
    )

    const handleRowClick = (roundNumber: number) => {
        router.push(`/round/${roundNumber}`)
    }

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="w-10 text-center text-zinc-500 font-semibold text-xs">#</TableHead>
                        {playerEntries.map(([id, player]) => (
                            <TableHead key={id} className="text-right text-zinc-400 font-semibold text-xs px-3">
                                {player.name}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rounds }, (_, i) => i + 1).map((roundNum) => (
                        <TableRow
                            key={roundNum}
                            className="border-zinc-800/50 active:bg-zinc-800"
                            onClick={() => handleRowClick(roundNum)}
                        >
                            <TableCell className="w-10 text-center text-zinc-500 font-mono text-xs">
                                {roundNum}
                            </TableCell>
                            {playerEntries.map(([id, player]) => (
                                <TableCell key={id} className="text-right font-mono px-3 text-zinc-300 text-sm">
                                    {player.scores[roundNum] || 0}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                    <TableRow className="border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800/30">
                        <TableCell className="w-10 text-center text-zinc-500 font-bold text-xs">Σ</TableCell>
                        {totals.map((total, i) => (
                            <TableCell key={i} className="text-right font-mono font-bold px-3 text-white text-sm">
                                {total}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}
