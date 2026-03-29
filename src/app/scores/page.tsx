"use client"

import Link from "next/link"
import { useAtomValue } from "jotai"
import ScoresTable from "@/app/scores/scores-table"
import Title from "@/components/title"
import { ResetScoresButton } from "@/app/scores/reset-scores-button"
import { AddNewScoresButton } from "@/components/add-scores-button"
import { gameModeAtom } from "@/lib/atoms/game"

export default function ScoresPage() {
    const gameMode = useAtomValue(gameModeAtom)
    const showGenericScoreActions = gameMode === "generic" || gameMode === null

    return (
        <>
            <Title>Scores</Title>
            <ScoresTable />
            {showGenericScoreActions ? (
                <div className="flex flex-col space-y-3 pb-4">
                    <ResetScoresButton />
                    <AddNewScoresButton />
                </div>
            ) : (
                <p className="text-zinc-500 text-sm pb-4">
                    {gameMode === "schoppenvrouwen" && (
                        <>
                            Scores voor dit spel staan op het{" "}
                            <Link href="/schoppenvrouwen" className="text-rose-400 underline underline-offset-2">
                                Schoppenvrouwen scorebord
                            </Link>
                            .
                        </>
                    )}
                    {gameMode === "boerenbridge" && (
                        <>
                            Scores voor dit spel staan op het{" "}
                            <Link href="/boerenbridge" className="text-emerald-400 underline underline-offset-2">
                                Boerenbridge scorebord
                            </Link>
                            .
                        </>
                    )}
                </p>
            )}
        </>
    )
}
