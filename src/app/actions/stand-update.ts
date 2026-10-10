"use server"

import { streamText } from "ai"
import { createStreamableValue } from "@ai-sdk/rsc"
import { buildStandUpdatePrompt, STAND_UPDATE_SYSTEM } from "@/lib/stand-update/build-prompt"
import type { StandUpdateGameState } from "@/lib/stand-update/build-game-state"

/** Gateway catalog id. Low reasoning keeps numbers and rules straight without delaying the first words much. */
const STAND_UPDATE_MODEL = "anthropic/claude-sonnet-5.5"
/** Reasoning tokens count toward maxOutputTokens; without headroom the text comes back empty. */
const REASONING_TOKEN_HEADROOM = 1500

export async function generateStandUpdate(gameState: StandUpdateGameState) {
    const stream = createStreamableValue("")
    const built = buildStandUpdatePrompt(gameState)

    if (!built) {
        stream.done()
        return { output: stream.value }
    }

    ;(async () => {
        let wrote = false
        try {
            const { textStream } = streamText({
                model: STAND_UPDATE_MODEL,
                system: STAND_UPDATE_SYSTEM,
                prompt: built.prompt,
                reasoning: "low",
                maxOutputTokens: (built.isFinished ? 600 : 450) + REASONING_TOKEN_HEADROOM
            })

            for await (const delta of textStream) {
                wrote = true
                stream.update(delta)
            }

            stream.done()
        } catch (error) {
            console.error("Stand update failed:", error)
            const message = error instanceof Error ? error.message : ""
            const friendly = message.includes("credit card")
                ? "Vercel AI Gateway heeft nog een betaalmethode nodig. Voeg een kaart toe in je Vercel-team, dan werkt deze update."
                : "Oeps, kon geen update genereren. Probeer het nog eens!"
            if (!wrote) {
                stream.update(friendly)
            }
            stream.done()
        }
    })()

    return { output: stream.value }
}
