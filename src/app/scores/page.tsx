import ScoresTable from "@/app/scores/scores-table"
import Title from "@/components/title"
import { ResetScoresButton } from "@/app/scores/reset-scores-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AddNewScoresButton } from "@/components/add-scores-button"

export default function ScoresPage() {
    return (
        <>
            <Title>Scores</Title>
            <ScoresTable />
            <div className="flex flex-col space-y-4 pb-6">
                <ResetScoresButton />
                <AddNewScoresButton />
            </div>
        </>
    )
}
