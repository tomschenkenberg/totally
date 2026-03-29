"use client"

import Title from "@/components/title"
import PlayerInput from "@/app/players/player-input"

export default function PlayersPage() {
    const numberOfPlayers = 6
    return (
        <>
            <Title>Spelers</Title>
            <div className="space-y-3">
                {[...Array(numberOfPlayers)].map((_, index) => (
                    <PlayerInput key={index} id={index} placeholder={`Speler ${index + 1}`} />
                ))}
            </div>
        </>
    )
}
