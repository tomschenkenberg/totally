"use client"

import { useAtom, useAtomValue } from "jotai"
import { Button } from "../../../components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import PlayerAvatar from "../../../components/avatar"
import React from "react"
import { playersAtom, getPlayerScoresAtom, addScoreForRoundAtom, Player } from "@/lib/atoms/players"

const InputPlayerScore = ({ id, player, round }: { id: number; player: Player; round: number }) => {
    const getPlayerScores = useAtomValue(getPlayerScoresAtom)
    const [, addScoreForRound] = useAtom(addScoreForRoundAtom)

    const [inputValue, setInputValue] = React.useState(getPlayerScores(id)[round]?.toString() || "")

    const handleScoreChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const scoreValue = e.target.value
        setInputValue(scoreValue)

        if (scoreValue !== "") {
            const newScore = parseInt(scoreValue)
            if (!isNaN(newScore)) {
                await addScoreForRound({ id, round, score: newScore })
            }
        }
    }

    const toggleSign = () => {
        if (inputValue === "") return
        const currentValue = parseInt(inputValue)
        const newValue = (currentValue * -1).toString()
        setInputValue(newValue)
        addScoreForRound({ id, round, score: parseInt(newValue) })
    }

    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <PlayerAvatar player={player} />
                <span className="text-xl font-bold">{player.name}</span>
            </div>
            <span className="text-2xl font-bold ml-4 flex items-center gap-2">
                <Input
                    className="text-xl font-semibold font-mono"
                    type="number"
                    inputMode="decimal"
                    placeholder="Score"
                    value={inputValue}
                    onChange={handleScoreChange}
                />
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={toggleSign}
                    disabled={inputValue === ""}
                >
                    +/-
                </Button>
            </span>
        </div>
    )
}

const Round = ({ round }: { round: number }) => {
    const players = useAtomValue(playersAtom)

    return (
        <>
            <div className="flex flex-col space-y-4 pb-6">
                {Object.entries(players).map(([id, player]) => (
                    <InputPlayerScore key={id} id={Number(id)} player={player} round={round} />
                ))}
            </div>
            <Link href="/scores">
                <Button variant="default" className="w-full">
                    Done
                </Button>
            </Link>
        </>
    )
}

export default Round
