"use client"

import { useCallback, useRef, useState } from "react"

export function useStandUpdateSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

    const stop = useCallback(() => {
        if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
            window.speechSynthesis.cancel()
            utteranceRef.current = null
        }
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            audioRef.current = null
        }
        setIsSpeaking(false)
    }, [])

    const speak = useCallback(
        async (text: string) => {
            if (!text) return

            if (
                isSpeaking ||
                (typeof window !== "undefined" && window.speechSynthesis?.speaking) ||
                (audioRef.current && !audioRef.current.paused)
            ) {
                stop()
                return
            }

            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                const utterance = new SpeechSynthesisUtterance(text)
                utterance.lang = "nl-NL"
                utterance.onend = () => {
                    setIsSpeaking(false)
                    utteranceRef.current = null
                }
                utterance.onerror = () => {
                    setIsSpeaking(false)
                    utteranceRef.current = null
                }
                utteranceRef.current = utterance
                setIsSpeaking(true)
                window.speechSynthesis.speak(utterance)
                return
            }

            const audio = new Audio()
            audioRef.current = audio
            audio.load()

            setIsLoadingAudio(true)
            let audioUrl: string | null = null

            try {
                const response = await fetch("/api/speak", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text })
                })

                if (!response.ok) {
                    throw new Error("Failed to generate speech")
                }

                if (audioRef.current !== audio) {
                    return
                }

                const arrayBuffer = await response.arrayBuffer()
                const blob = new Blob([arrayBuffer], { type: "audio/mpeg" })
                audioUrl = URL.createObjectURL(blob)
                const currentUrl = audioUrl

                audio.onended = () => {
                    setIsSpeaking(false)
                    URL.revokeObjectURL(currentUrl)
                }
                audio.onerror = () => {
                    setIsSpeaking(false)
                    URL.revokeObjectURL(currentUrl)
                }

                audio.src = currentUrl
                setIsSpeaking(true)
                await audio.play()
            } catch (error) {
                console.error("Failed to generate speech:", error)
                setIsSpeaking(false)
                if (audioUrl) URL.revokeObjectURL(audioUrl)
            } finally {
                setIsLoadingAudio(false)
            }
        },
        [isSpeaking, stop]
    )

    return { isSpeaking, isLoadingAudio, speak, stop }
}
