"use client"

import dynamic from "next/dynamic"
import { useAtomValue, useSetAtom } from "jotai"
import { useLayoutEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { playersAtom } from "@/lib/atoms/players"
import {
    BoerenBridgeGame,
    boerenBridgePlayStepAtom,
    type BoerenBridgePlayStep
} from "@/lib/atoms/game"
import { BiddingView } from "@/components/boerenbridge/bidding-view"
import { TricksView } from "@/components/boerenbridge/tricks-view"
import { BoerenBridgeScoreboardView } from "@/components/boerenbridge/scoreboard-view"
import { LoadingPlaceholder } from "@/components/loading-placeholder"
import { useValidGame } from "@/hooks/use-valid-game"
import { usePrefetchRoutes } from "@/hooks/use-prefetch-routes"

function parseStepParam(value: string | null): BoerenBridgePlayStep | null {
    if (value === "bid" || value === "tricks" || value === "scoreboard") {
        return value
    }
    return null
}

export function BoerenBridgePlayFlow() {
    const { hydrated, game } = useValidGame("boerenbridge")
    const playStep = useAtomValue(boerenBridgePlayStepAtom)
    const setPlayStep = useSetAtom(boerenBridgePlayStepAtom)
    const searchParams = useSearchParams()

    const prefetchRoutes = useMemo(() => ["/boerenbridge/setup", "/players"], [])
    usePrefetchRoutes(prefetchRoutes)

    useLayoutEffect(() => {
        const fromUrl = parseStepParam(searchParams.get("step"))
        if (fromUrl) {
            setPlayStep(fromUrl)
        }
    }, [searchParams, setPlayStep])

    if (!hydrated || !game) {
        return <LoadingPlaceholder />
    }

    switch (playStep) {
        case "bid":
            return (
                <BiddingView
                    game={game}
                    onContinue={() => setPlayStep("tricks")}
                    onBackToScoreboard={() => setPlayStep("scoreboard")}
                />
            )
        case "tricks":
            return (
                <TricksView
                    game={game}
                    onBackToScoreboard={() => setPlayStep("scoreboard")}
                />
            )
        default:
            return <BoerenBridgeScoreboardView game={game} onContinue={setPlayStep} />
    }
}
