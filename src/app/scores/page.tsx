import ScoresTable from "@/app/scores/scores-table"
import Title from "@/components/title"
import { ResetScoresButton } from "@/app/scores/reset-scores-button"

export default function ScoresPage() {
    return (
        <>
            <Title>Scores</Title>
            <ScoresTable />
            <ResetScoresButton />
        </>
    )
}
