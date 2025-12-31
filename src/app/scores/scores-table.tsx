"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useAtomValue } from "jotai"
import { playersAtom, getNumberOfRoundsAtom } from "@/lib/atoms/players"
import { gameModeAtom, schoppenvrouwenGameAtom } from "@/lib/atoms/game"

export default function ScoresTable() {
    const router = useRouter()
    const gameMode = useAtomValue(gameModeAtom)
    const players = useAtomValue(playersAtom)
    const rounds = useAtomValue(getNumberOfRoundsAtom)
    const schoppenvrouwenGame = useAtomValue(schoppenvrouwenGameAtom)

    // Schoppenvrouwen mode - use game-specific data
    if (gameMode === "schoppenvrouwen" && schoppenvrouwenGame) {
        const playerOrder = schoppenvrouwenGame.playerOrder
        const gameRounds = schoppenvrouwenGame.rounds

        // Get player names for headers
        const playerNames = playerOrder.map((id) => {
            const player = players[id]
            return player?.name || `Speler ${id + 1}`
        })

        // Filter to only completed rounds
        const completedRounds = gameRounds.filter((round) => Object.keys(round.scores).length > 0)

        // Calculate totals
        const totals = playerOrder.map((id) =>
            gameRounds.reduce((sum, round) => sum + (round.scores[id] || 0), 0)
        )

        const handleRowClick = (roundIndex: number) => {
            router.push(`/schoppenvrouwen/round/${roundIndex + 1}`)
        }

        return (
            <div className="rounded-md border border-slate-600 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-600">
                            <TableHead className="w-10 text-center text-gray-300 font-bold">#</TableHead>
                            {playerNames.map((name, i) => (
                                <TableHead key={i} className="text-right text-gray-200 font-bold px-3">
                                    {name}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {completedRounds.map((round, roundIndex) => (
                            <TableRow
                                key={roundIndex}
                                className="border-slate-600 cursor-pointer hover:bg-slate-700/50"
                                onClick={() => handleRowClick(roundIndex)}
                            >
                                <TableCell className="w-10 text-center text-gray-400 font-mono">
                                    {roundIndex + 1}
                                </TableCell>
                                {playerOrder.map((id) => (
                                    <TableCell key={id} className="text-right font-mono px-3 text-gray-200">
                                        {round.scores[id] ?? "-"}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                        {/* Total row */}
                        <TableRow className="border-slate-600 bg-slate-700/50">
                            <TableCell className="w-10 text-center text-gray-400 font-bold">Σ</TableCell>
                            {totals.map((total, i) => (
                                <TableCell key={i} className="text-right font-mono font-bold px-3 text-white">
                                    {total}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        )
    }

    // Generic mode - use players atom
    const playerEntries = Object.entries(players)
    
    // Calculate totals for generic mode
    const totals = playerEntries.map(([, player]) =>
        Object.values(player.scores).reduce((sum, score) => sum + score, 0)
    )

    const handleRowClick = (roundNumber: number) => {
        router.push(`/round/${roundNumber}`)
    }

    return (
        <div className="rounded-md border border-slate-600 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-600">
                        <TableHead className="w-10 text-center text-gray-300 font-bold">#</TableHead>
                        {playerEntries.map(([id, player]) => (
                            <TableHead key={id} className="text-right text-gray-200 font-bold px-3">
                                {player.name}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rounds }, (_, i) => i + 1).map((roundNum) => (
                        <TableRow
                            key={roundNum}
                            className="border-slate-600 cursor-pointer hover:bg-slate-700/50"
                            onClick={() => handleRowClick(roundNum)}
                        >
                            <TableCell className="w-10 text-center text-gray-400 font-mono">
                                {roundNum}
                            </TableCell>
                            {playerEntries.map(([id, player]) => (
                                <TableCell key={id} className="text-right font-mono px-3 text-gray-200">
                                    {player.scores[roundNum] || 0}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow className="border-slate-600 bg-slate-700/50">
                        <TableCell className="w-10 text-center text-gray-400 font-bold">Σ</TableCell>
                        {totals.map((total, i) => (
                            <TableCell key={i} className="text-right font-mono font-bold px-3 text-white">
                                {total}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}
