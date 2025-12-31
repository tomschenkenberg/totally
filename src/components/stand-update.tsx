"use client"

import { useState, useCallback, useRef } from "react"
import { useAtomValue } from "jotai"
import { readStreamableValue } from "@ai-sdk/rsc"
import { Button } from "@/components/ui/button"
import { playersAtom } from "@/lib/atoms/players"
import {
    boerenBridgeGameAtom,
    getPlayerBoerenBridgeTotalAtom,
    calculateBoerenBridgeScore,
    BOEREN_BRIDGE_ROUNDS,
    schoppenvrouwenGameAtom,
    getSchoppenvrouwenPlayerTotalAtom,
    SCHOPPENVROUWEN_TARGET_SCORE,
    GameMode
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
            const playerStandings = schoppenvrouwenGame.playerOrder.map((id) => {
                const player = players[id]
                const roundScores = schoppenvrouwenGame.rounds
                    .filter((round) => round.scores[id] !== undefined)
                    .map((round) => round.scores[id])

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
                totalRounds: undefined, // No fixed total - game ends at 1000 points
                targetScore: SCHOPPENVROUWEN_TARGET_SCORE,
                gameMode: "schoppenvrouwen" as const
            }
        }

        // Generic game mode
        const playerStandings = Object.entries(players).map(([id, player]) => {
            const scores = Object.values(player.scores)
            return {
                name: player.name,
                gender: player.gender || "x",
                score: scores.reduce((a, b) => a + b, 0),
                roundScores: scores
            }
        })

        const maxRounds = Math.max(...playerStandings.map((p) => p.roundScores.length), 0)

        return {
            players: playerStandings,
            currentRound: maxRounds,
            totalRounds: maxRounds,
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

        // Stop if already playing (check actual audio state, not React state)
        if (audioRef.current && !audioRef.current.paused) {
            stopAudio()
            return
        }

        // Also stop any existing audio before starting new
        stopAudio()
        setIsLoadingAudio(true)

        try {
            // Fetch audio from API route
            const response = await fetch("/api/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: update })
            })

            if (!response.ok) {
                throw new Error("Failed to generate speech")
            }

            // Get raw audio data and create blob with explicit type
            const arrayBuffer = await response.arrayBuffer()
            const blob = new Blob([arrayBuffer], { type: "audio/mpeg" })
            console.log("Audio blob:", blob.size, "bytes, type:", blob.type)
            
            const audioUrl = URL.createObjectURL(blob)
            console.log("Audio URL:", audioUrl)
            
            const audio = new Audio()
            audioRef.current = audio

            // Set up event handlers before setting src
            audio.oncanplaythrough = () => {
                console.log("Audio ready to play")
                setIsSpeaking(true)
                audio.play().catch(err => {
                    console.error("Play failed:", err)
                    setIsSpeaking(false)
                })
            }
            audio.onended = () => {
                console.log("Audio ended")
                setIsSpeaking(false)
                URL.revokeObjectURL(audioUrl)
            }
            audio.onerror = (e) => {
                console.error("Audio error event:", audio.error?.code, audio.error?.message)
                setIsSpeaking(false)
                URL.revokeObjectURL(audioUrl)
            }

            // Set source and load
            audio.src = audioUrl
            audio.load()
        } catch (error) {
            console.error("Failed to generate speech:", error)
            setIsSpeaking(false)
        } finally {
            setIsLoadingAudio(false)
        }
    }, [update, stopAudio])

    // Check if there's enough data for an update
    const hasEnoughData = useCallback(() => {
        if (gameMode === "boerenbridge" && boerenBridgeGame) {
            // Need at least 1 completed round
            const completedRounds = boerenBridgeGame.rounds.filter(
                (r) =>
                    Object.keys(r.bids).length === boerenBridgeGame.playerOrder.length &&
                    Object.keys(r.tricks).length === boerenBridgeGame.playerOrder.length
            )
            return completedRounds.length >= 1
        }

        if (gameMode === "schoppenvrouwen" && schoppenvrouwenGame) {
            // Need at least 1 completed round
            const completedRounds = schoppenvrouwenGame.rounds.filter(
                (r) => Object.keys(r.scores).length === schoppenvrouwenGame.playerOrder.length
            )
            return completedRounds.length >= 1
        }

        // Generic: need at least 1 round of scores
        const maxRounds = Math.max(...Object.values(players).map((p) => Object.keys(p.scores).length), 0)
        return maxRounds >= 1
    }, [gameMode, boerenBridgeGame, schoppenvrouwenGame, players])

    if (!hasEnoughData()) {
        return null
    }

    return (
        <div className="space-y-3">
            <Button
                onClick={handleGenerateUpdate}
                disabled={isLoading}
                variant="outline"
                className={cn(
                    "w-full border-purple-500/50 bg-purple-900/20 hover:bg-purple-900/40 text-purple-200 hover:text-purple-100",
                    "transition-all duration-300"
                )}
            >
                {isLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                    <Sparkles className="h-5 w-5 mr-2" />
                )}
                {isLoading ? "Genereren..." : "AI Stand Update"}
            </Button>

            {showUpdate && (
                <div
                    className={cn(
                        "relative p-4 rounded-lg border border-purple-500/30 bg-purple-900/20",
                        "animate-in fade-in slide-in-from-top-2 duration-300"
                    )}
                >
                    <div className="pr-12">
                        <p className="text-gray-100 leading-relaxed">
                            {update || (
                                <span className="text-gray-400 italic">Aan het nadenken...</span>
                            )}
                        </p>
                    </div>

                    {update && !isLoading && (
                        <Button
                            onClick={handleSpeak}
                            variant="ghost"
                            size="icon"
                            disabled={isLoadingAudio}
                            className="absolute top-3 right-3 text-purple-300 hover:text-purple-100 hover:bg-purple-800/50 disabled:opacity-50"
                            title={isSpeaking ? "Stop" : isLoadingAudio ? "Audio laden..." : "Voorlezen"}
                        >
                            {isLoadingAudio ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : isSpeaking ? (
                                <Square className="h-4 w-4 fill-current" />
                            ) : (
                                <Volume2 className="h-5 w-5" />
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

