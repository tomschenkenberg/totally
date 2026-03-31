"use client"

import { useAtom, useAtomValue } from "jotai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import React from "react"
import {
    playersAtom,
    getPlayerScoresAtom,
    addScoreForRoundAtom,
    Player,
    activeNamedPlayers
} from "@/lib/atoms/players"

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
        <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-base font-semibold text-white truncate min-w-0">{player.name}</span>
            <div className="flex items-center gap-2 shrink-0">
                <Input
                    className="text-lg font-semibold font-mono w-24 h-10 bg-zinc-800 border-zinc-700 text-white text-center rounded-xl"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={inputValue}
                    onChange={handleScoreChange}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSign}
                    disabled={inputValue === ""}
                    className="border-zinc-700 text-zinc-400 hover:text-white h-10 w-10 p-0 rounded-xl"
                >
                    +/-
                </Button>
            </div>
        </div>
    )
}

const Round = ({ round }: { round: number }) => {
    const players = useAtomValue(playersAtom)
    const scoringPlayers = activeNamedPlayers(players)

    return (
        <>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800/60">
                {Object.entries(scoringPlayers).map(([id, player]) => (
                    <InputPlayerScore key={id} id={Number(id)} player={player} round={round} />
                ))}
            </div>
            <Link href="/scores" prefetch={true}>
                <Button variant="default" className="w-full h-12 text-lg rounded-xl">
                    Klaar
                </Button>
            </Link>
        </>
    )
}

export default Round
