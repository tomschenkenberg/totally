"use client"

import { Player } from "@/lib/atoms/players"
import { useAtomValue } from "jotai"
import { getPlayersSortedByScoreAtom, getNumberOfRoundsAtom, getTotalScoreAtom } from "@/lib/atoms/players"
import { AddNewScoresButton } from "@/components/add-scores-button"
import { StandUpdate } from "@/components/stand-update"
import { cn, scoreTextClass } from "@/lib/utils"

const PlayerScore = ({ id, player }: { id: number; player: Player }) => {
    const getTotalScore = useAtomValue(getTotalScoreAtom)

    return (
        <div className="flex justify-between items-center px-4 py-3">
            <span className="text-lg font-semibold text-white">{player.name}</span>
            <span
                className={cn("text-xl font-bold font-mono tabular-nums", scoreTextClass(getTotalScore(id)))}
            >
                {getTotalScore(id)}
            </span>
        </div>
    )
}

export default function Scoreboard() {
    const sortedPlayers = useAtomValue(getPlayersSortedByScoreAtom)
    const numberOfRounds = useAtomValue(getNumberOfRoundsAtom)

    return (
        <>
            <div className="text-sm text-center text-zinc-500">
                Na <span className="font-bold text-zinc-300">{numberOfRounds}</span> rondes
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800/60">
                {sortedPlayers.map(({ id, player }) => (
                    <PlayerScore key={id} id={id} player={player} />
                ))}
            </div>
            <div className="space-y-3">
                <StandUpdate gameMode="generic" />
                <AddNewScoresButton />
            </div>
        </>
    )
}
