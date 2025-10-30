"use client"

import { Player } from "@/lib/atoms/players"
import PlayerAvatar from "@/components/avatar"
import { useAtomValue } from "jotai"
import { getPlayersSortedByScoreAtom, getNumberOfRoundsAtom, getTotalScoreAtom } from "@/lib/atoms/players"
import { AddNewScoresButton } from "@/components/add-scores-button"

const PlayerScore = ({ id, player }: { id: number; player: Player }) => {
    const getTotalScore = useAtomValue(getTotalScoreAtom)

    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <PlayerAvatar player={player} />
                <span className="text-2xl font-bold text-gray-200">{player.name}</span>
            </div>
            <span className="text-2xl font-bold ml-4 font-mono text-gray-200">{getTotalScore(id)}</span>
        </div>
    )
}

export default function Scoreboard() {
    const sortedPlayers = useAtomValue(getPlayersSortedByScoreAtom)
    const numberOfRounds = useAtomValue(getNumberOfRoundsAtom)

    return (
        <>
            <div className="text-lg text-center text-gray-200">
                After <span className="font-bold">{numberOfRounds}</span> rounds
            </div>
            <div className="flex flex-col space-y-4 pb-6">
                {sortedPlayers.map(({ id, player }) => (
                    <PlayerScore key={id} id={id} player={player} />
                ))}
            </div>
            <AddNewScoresButton />
        </>
    )
}
