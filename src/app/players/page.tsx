"use client"

import Title from "@/components/title"
import { PlayersRoster } from "@/app/players/players-roster"

export default function PlayersPage() {
    return (
        <>
            <Title>Spelers</Title>
            <PlayersRoster />
        </>
    )
}
