"use client"

import Title from "@/components/title"
import ScoresTable from "@/components/scores-table"
import { ResetScoresButton } from "@/components/reset-scores-button"

export default function ScoresPage() {
    return (
        <>
            <Title>Scores</Title>
            <ScoresTable />
            <ResetScoresButton />
        </>
    )
}
