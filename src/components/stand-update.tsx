"use client"

import { useState, useCallback } from "react"
import { useAtomValue } from "jotai"
import { readStreamableValue } from "@ai-sdk/rsc"
import { Button } from "@/components/ui/button"
import { playersAtom } from "@/lib/atoms/players"
import {
    boerenBridgeGameAtom,
    getPlayerBoerenBridgeTotalAtom,
    schoppenvrouwenGameAtom,
    getSchoppenvrouwenPlayerTotalAtom,
    isSchoppenvrouwenRoundFullyScored,
    GameMode
} from "@/lib/atoms/game"
import { generateStandUpdate } from "@/app/actions/stand-update"
import {
    getCachedStandUpdate,
    hashGameState,
    setCachedStandUpdate
} from "@/lib/stand-update-cache"
import {
    buildBoerenBridgeStandState,
    buildGenericStandState,
    buildSchoppenvrouwenStandState,
    type StandUpdateGameState
} from "@/lib/stand-update/build-game-state"
import { useStandUpdateSpeech } from "@/hooks/use-stand-update-speech"
import { Sparkles, Volume2, Loader2, Square } from "lucide-react"
import { cn } from "@/lib/utils"

function StandUpdatePanel({ gameState, hasEnoughData }: { gameState: StandUpdateGameState; hasEnoughData: boolean }) {
    const [update, setUpdate] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showUpdate, setShowUpdate] = useState(false)
    const { isSpeaking, isLoadingAudio, speak } = useStandUpdateSpeech()

    const handleGenerateUpdate = useCallback(async () => {
        setIsLoading(true)
        setUpdate("")
        setShowUpdate(true)

        try {
            const stateHash = hashGameState(gameState)
            const cached = getCachedStandUpdate(stateHash)
            if (cached) {
                setUpdate(cached)
                return
            }

            const { output } = await generateStandUpdate(gameState)

            let fullText = ""
            for await (const delta of readStreamableValue(output)) {
                if (delta) {
                    fullText += delta
                    setUpdate(fullText)
                }
            }

            if (fullText) {
                setCachedStandUpdate(stateHash, fullText)
            }
        } catch (error) {
            console.error("Failed to generate update:", error)
            setUpdate("Oeps, kon geen update genereren. Probeer het nog eens!")
        } finally {
            setIsLoading(false)
        }
    }, [gameState])

    if (!hasEnoughData) {
        return null
    }

    return (
        <div className="space-y-2">
            <Button
                onClick={handleGenerateUpdate}
                disabled={isLoading}
                variant="outline"
                className={cn(
                    "w-full h-11 rounded-xl border-purple-500/30 bg-purple-500/5 text-purple-300",
                    "hover:bg-purple-500/10 hover:text-purple-200 hover:border-purple-500/40",
                    "transition-all duration-200"
                )}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isLoading ? "Genereren..." : "AI Stand Update"}
            </Button>

            {showUpdate && (
                <div className="relative rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                    <div className="pr-10">
                        <p className="text-sm text-zinc-200 leading-relaxed">
                            {update || (
                                <span className="text-zinc-500 italic">Aan het nadenken...</span>
                            )}
                        </p>
                    </div>

                    {update && !isLoading && (
                        <Button
                            onClick={() => speak(update)}
                            variant="ghost"
                            size="icon"
                            disabled={isLoadingAudio}
                            className="absolute top-3 right-3 h-8 w-8 text-purple-400 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg"
                            title={isSpeaking ? "Stop" : isLoadingAudio ? "Audio laden..." : "Voorlezen"}
                        >
                            {isLoadingAudio ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isSpeaking ? (
                                <Square className="h-3.5 w-3.5 fill-current" />
                            ) : (
                                <Volume2 className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

export function StandUpdateBoerenBridge() {
    const players = useAtomValue(playersAtom)
    const game = useAtomValue(boerenBridgeGameAtom)
    const getTotal = useAtomValue(getPlayerBoerenBridgeTotalAtom)

    if (!game) return null

    const gameState = buildBoerenBridgeStandState(game, players, getTotal)
    const hasEnoughData = game.rounds.some(
        (r) =>
            Object.keys(r.bids).length === game.playerOrder.length &&
            Object.keys(r.tricks).length === game.playerOrder.length
    )

    return <StandUpdatePanel gameState={gameState} hasEnoughData={hasEnoughData} />
}

export function StandUpdateSchoppenvrouwen() {
    const players = useAtomValue(playersAtom)
    const game = useAtomValue(schoppenvrouwenGameAtom)
    const getTotal = useAtomValue(getSchoppenvrouwenPlayerTotalAtom)

    if (!game) return null

    const n = game.playerOrder.length
    const gameState = buildSchoppenvrouwenStandState(game, players, getTotal)
    const hasEnoughData = game.rounds.some((r) => isSchoppenvrouwenRoundFullyScored(r, n))

    return <StandUpdatePanel gameState={gameState} hasEnoughData={hasEnoughData} />
}

export function StandUpdateGeneric() {
    const players = useAtomValue(playersAtom)
    const gameState = buildGenericStandState(players)
    const hasEnoughData = Object.values(players).some((p) => Object.keys(p.scores).length > 0)

    return <StandUpdatePanel gameState={gameState} hasEnoughData={hasEnoughData} />
}

/** @deprecated Prefer mode-specific exports to avoid cross-mode atom subscriptions. */
export function StandUpdate({ gameMode }: { gameMode: GameMode }) {
    switch (gameMode) {
        case "boerenbridge":
            return <StandUpdateBoerenBridge />
        case "schoppenvrouwen":
            return <StandUpdateSchoppenvrouwen />
        case "generic":
            return <StandUpdateGeneric />
        default: {
            const _exhaustive: never = gameMode
            return _exhaustive
        }
    }
}
