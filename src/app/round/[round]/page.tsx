import Title from "@/components/title"
import Round from "./round"

type Params = Promise<{ round: string }>

export default async function RoundPage({ params }: { params: Params }) {
    const { round } = await params

    if (isNaN(Number(round))) {
        return <div>Invalid round number</div>
    }

    return (
        <>
            <Title>Round {round}</Title>
            <Round round={Number(round)} />
        </>
    )
}
