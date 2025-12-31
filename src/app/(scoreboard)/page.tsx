"use client"

import Scoreboard from "@/app/(scoreboard)/scoreboard"
import Title from "@/components/title"
import { GameModeSelector } from "@/components/game-mode-selector"
import { useAtomValue } from "jotai"
import { gameModeAtom } from "@/lib/atoms/game"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ScoreboardPage() {
    const gameMode = useAtomValue(gameModeAtom)
    const router = useRouter()

    useEffect(() => {
        if (gameMode === "boerenbridge") {
            router.push("/boerenbridge")
        } else if (gameMode === "schoppenvrouwen") {
            router.push("/schoppenvrouwen")
        }
    }, [gameMode, router])

    if (gameMode === null) {
        return (
            <>
                <Title>Kies een Spel</Title>
                <GameModeSelector />
            </>
        )
    }

    if (gameMode === "boerenbridge" || gameMode === "schoppenvrouwen") {
        return null // Will redirect
    }

    return (
        <>
            <Title>Scoreboard</Title>
            <Scoreboard />
        </>
    )
}
