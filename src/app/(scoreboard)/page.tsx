"use client"

import dynamic from "next/dynamic"
import Scoreboard from "@/app/(scoreboard)/scoreboard"
import Title from "@/components/title"
import { GameModeSelector } from "@/components/game-mode-selector"
import { useAtomValue } from "jotai"
import { gameModeAtom } from "@/lib/atoms/game"
import { LoadingPlaceholder } from "@/components/loading-placeholder"

const BoerenBridgePlayFlow = dynamic(
    () => import("@/components/boerenbridge/play-flow").then((m) => ({ default: m.BoerenBridgePlayFlow })),
    { loading: () => <LoadingPlaceholder /> }
)

const SchoppenvrouwenScoreboard = dynamic(() => import("@/app/schoppenvrouwen/page"), {
    loading: () => <LoadingPlaceholder />
})

export default function ScoreboardPage() {
    const gameMode = useAtomValue(gameModeAtom)

    if (gameMode === null) {
        return (
            <>
                <Title>Kies een Spel</Title>
                <GameModeSelector />
            </>
        )
    }

    if (gameMode === "boerenbridge") {
        return <BoerenBridgePlayFlow />
    }

    if (gameMode === "schoppenvrouwen") {
        return <SchoppenvrouwenScoreboard />
    }

    return (
        <>
            <Title>Scoreboard</Title>
            <Scoreboard />
        </>
    )
}
