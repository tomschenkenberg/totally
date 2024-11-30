"use client"

import Title from "@/components/title"
import PlayerInput from "@/components/player-input"

/* const PlayerInput = dynamic(() => import("@/components/player-input"), {
  ssr: false,
}); */

export default function PlayersPage() {
    const numberOfPlayers = 6
    return (
        <>
            <Title>Players</Title>
            <div className="mt-6 space-y-4">
                {[...Array(numberOfPlayers)].map((_, index) => (
                    <PlayerInput key={index} id={index} placeholder={`Player ${index + 1} Name`} />
                ))}
            </div>
        </>
    )
}
