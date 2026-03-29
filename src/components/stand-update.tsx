"use client"

import { useState, useCallback, useRef } from "react"
import { useAtomValue } from "jotai"
import { readStreamableValue } from "@ai-sdk/rsc"
import { Button } from "@/components/ui/button"
import { playersAtom, maxRoundKeyFromPlayers, sortedUnionRoundKeys } from "@/lib/atoms/players"
import {
    boerenBridgeGameAtom,
    getPlayerBoerenBridgeTotalAtom,
    calculateBoerenBridgeScore,
    BOEREN_BRIDGE_ROUNDS,
    schoppenvrouwenGameAtom,
    getSchoppenvrouwenPlayerTotalAtom,
    SCHOPPENVROUWEN_TARGET_SCORE,
    GameMode,
    isSchoppenvrouwenRoundFullyScored
} from "@/lib/atoms/game"
import { generateStandUpdate } from "@/app/actions/stand-update"
import { Sparkles, Volume2, Loader2, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface StandUpdateProps {
    gameMode: GameMode
}

export function StandUpdate({ gameMode }: StandUpdateProps) {
    const [update, setUpdate] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)
    const [showUpdate, setShowUpdate] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const players = useAtomValue(playersAtom)
    const boerenBridgeGame = useAtomValue(boerenBridgeGameAtom)
    const getBoerenBridgeTotal = useAtomValue(getPlayerBoerenBridgeTotalAtom)
    const schoppenvrouwenGame = useAtomValue(schoppenvrouwenGameAtom)
    const getSchoppenvrouwenTotal = useAtomValue(getSchoppenvrouwenPlayerTotalAtom)

    const buildGameState = useCallback(() => {
        if (gameMode === "boerenbridge" && boerenBridgeGame) {
            const playerStandings = boerenBridgeGame.playerOrder.map((id) => {
                const player = players[id]
                const roundScores = boerenBridgeGame.rounds
                    .filter((round) => round.bids[id] !== undefined && round.tricks[id] !== undefined)
                    .map((round) => calculateBoerenBridgeScore(round.bids[id], round.tricks[id]))

                return {
                    name: player?.name || "Onbekend",
                    gender: player?.gender || "x",
                    score: getBoerenBridgeTotal(id),
                    roundScores
                }
            })

            return {
                players: playerStandings,
                currentRound: boerenBridgeGame.currentRoundIndex + 1,
                totalRounds: BOEREN_BRIDGE_ROUNDS.length,
                gameMode: "boerenbridge" as const
            }
        }

        if (gameMode === "schoppenvrouwen" && schoppenvrouwenGame) {
            const n = schoppenvrouwenGame.playerOrder.length
            const playerStandings = schoppenvrouwenGame.playerOrder.map((id) => {
                const player = players[id]
                const roundScores = schoppenvrouwenGame.rounds
                    .filter((round) => isSchoppenvrouwenRoundFullyScored(round, n))
                    .map((round) => round.scores[id] ?? 0)

                return {
                    name: player?.name || "Onbekend",
                    gender: player?.gender || "x",
                    score: getSchoppenvrouwenTotal(id),
                    roundScores
                }
            })

            return {
                players: playerStandings,
                currentRound: schoppenvrouwenGame.currentRoundIndex + 1,
                totalRounds: undefined,
                targetScore: SCHOPPENVROUWEN_TARGET_SCORE,
                gameMode: "schoppenvrouwen" as const
            }
        }

        const roundKeys = sortedUnionRoundKeys(players)
        const maxRound = maxRoundKeyFromPlayers(players)
        const playerStandings = Object.entries(players).map(([, player]) => ({
            name: player.name,
            gender: player.gender || "x",
            score: Object.values(player.scores).reduce((a, b) => a + b, 0),
            roundScores: roundKeys.map((r) => player.scores[r] ?? 0)
        }))

        return {
            players: playerStandings,
            currentRound: maxRound,
            totalRounds: maxRound,
            roundNumbers: roundKeys,
            gameMode: "generic" as const
        }
    }, [gameMode, boerenBridgeGame, schoppenvrouwenGame, players, getBoerenBridgeTotal, getSchoppenvrouwenTotal])

    const handleGenerateUpdate = useCallback(async () => {
        setIsLoading(true)
        setUpdate("")
        setShowUpdate(true)

        try {
            const gameState = buildGameState()
            const { output } = await generateStandUpdate(gameState)

            let fullText = ""
            for await (const delta of readStreamableValue(output)) {
                if (delta) {
                    fullText += delta
                    setUpdate(fullText)
                }
            }
        } catch (error) {
            console.error("Failed to generate update:", error)
            setUpdate("Oeps, kon geen update genereren. Probeer het nog eens!")
        } finally {
            setIsLoading(false)
        }
    }, [buildGameState])

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            audioRef.current = null
        }
        setIsSpeaking(false)
    }, [])

    const handleSpeak = useCallback(async () => {
        if (!update) return

        if (audioRef.current && !audioRef.current.paused) {
            stopAudio()
            return
        }

        stopAudio()
        setIsLoadingAudio(true)

        try {
            const response = await fetch("/api/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: update })
            })

            if (!response.ok) {
                throw new Error("Failed to generate speech")
            }

            const arrayBuffer = await response.arrayBuffer()
            const blob = new Blob([arrayBuffer], { type: "audio/mpeg" })
            const audioUrl = URL.createObjectURL(blob)
            const audio = new Audio()
            audioRef.current = audio

            audio.oncanplaythrough = () => {
                setIsSpeaking(true)
                audio.play().catch(err => {
                    console.error("Play failed:", err)
                    setIsSpeaking(false)
                })
            }
            audio.onended = () => {
                setIsSpeaking(false)
                URL.revokeObjectURL(audioUrl)
            }
            audio.onerror = () => {
                setIsSpeaking(false)
                URL.revokeObjectURL(audioUrl)
            }

            audio.src = audioUrl
            audio.load()
        } catch (error) {
            console.error("Failed to generate speech:", error)
            setIsSpeaking(false)
        } finally {
            setIsLoadingAudio(false)
        }
    }, [update, stopAudio])

    const hasEnoughData = useCallback(() => {
        if (gameMode === "boerenbridge" && boerenBridgeGame) {
            const completedRounds = boerenBridgeGame.rounds.filter(
                (r) =>
                    Object.keys(r.bids).length === boerenBridgeGame.playerOrder.length &&
                    Object.keys(r.tricks).length === boerenBridgeGame.playerOrder.length
            )
            return completedRounds.length >= 1
        }

        if (gameMode === "schoppenvrouwen" && schoppenvrouwenGame) {
            const n = schoppenvrouwenGame.playerOrder.length
            const completedRounds = schoppenvrouwenGame.rounds.filter((r) =>
                isSchoppenvrouwenRoundFullyScored(r, n)
            )
            return completedRounds.length >= 1
        }

        return Object.values(players).some((p) => Object.keys(p.scores).length > 0)
    }, [gameMode, boerenBridgeGame, schoppenvrouwenGame, players])

    if (!hasEnoughData()) {
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
                            onClick={handleSpeak}
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
