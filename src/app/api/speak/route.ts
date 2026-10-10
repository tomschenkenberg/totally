import { getVercelOidcToken } from "@vercel/oidc"
import { NextRequest } from "next/server"

/** Live Gateway catalog id. Grok TTS, not the browser voice. */
const SPEECH_MODEL = "spacexai/grok-tts"

/**
 * Sirius is the quick-witted commentary voice. The original five-voice set
 * always includes rex, so a rejected newer voice falls back to that.
 */
const SPEECH_VOICES = ["sirius", "rex"] as const

const MAX_CHARS = 4000

async function aiGatewayAuthorization(): Promise<string> {
    const apiKey = process.env.AI_GATEWAY_API_KEY
    if (apiKey) return `Bearer ${apiKey}`
    const token = await getVercelOidcToken()
    return `Bearer ${token}`
}

async function synthesize(text: string, voice: string, authorization: string): Promise<Response> {
    return fetch("https://ai-gateway.vercel.sh/v4/ai/speech-model", {
        method: "POST",
        headers: {
            Authorization: authorization,
            "ai-gateway-protocol-version": "0.0.1",
            "ai-speech-model-specification-version": "4",
            "ai-model-id": SPEECH_MODEL,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text,
            voice,
            language: "auto",
            outputFormat: "mp3",
            speed: 1
        })
    })
}

export async function POST(request: NextRequest) {
    try {
        const { text } = (await request.json()) as { text?: unknown }

        if (typeof text !== "string" || text.trim().length === 0) {
            return Response.json({ error: "No text provided" }, { status: 400 })
        }

        if (text.length > MAX_CHARS) {
            return Response.json({ error: "Text is too long to speak" }, { status: 400 })
        }

        const authorization = await aiGatewayAuthorization()
        let response: Response | null = null

        for (const [index, voice] of SPEECH_VOICES.entries()) {
            response = await synthesize(text, voice, authorization)
            const retryWithNextVoice = !response.ok && response.status === 400 && index < SPEECH_VOICES.length - 1
            if (!retryWithNextVoice) break
            await response.body?.cancel()
        }

        if (!response?.ok) {
            const error = await response?.text()
            console.error("Grok TTS error:", response?.status, error)
            return Response.json({ error: "TTS failed" }, { status: 500 })
        }

        const payload = (await response.json()) as { audio?: unknown; warnings?: unknown }
        if (Array.isArray(payload.warnings) && payload.warnings.length > 0) {
            console.warn("Grok TTS warnings:", payload.warnings)
        }
        if (typeof payload.audio !== "string" || payload.audio.length === 0) {
            console.error("Grok TTS returned no audio")
            return Response.json({ error: "TTS failed" }, { status: 500 })
        }

        const audio = Buffer.from(payload.audio, "base64")
        return new Response(audio, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audio.byteLength.toString()
            }
        })
    } catch (error) {
        console.error("TTS error:", error)
        return Response.json({ error: "Failed to generate speech" }, { status: 500 })
    }
}
