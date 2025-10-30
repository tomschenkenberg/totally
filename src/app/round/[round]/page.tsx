"use client"

import Title from "@/components/title"
import Round from "./round"
import { use } from "react"

type Params = Promise<{ round: string }>

export default function RoundPage({ params }: { params: Params }) {
    const { round } = use(params)

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
