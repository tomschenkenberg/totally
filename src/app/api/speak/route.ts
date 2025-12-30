import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json()

        if (!text) {
            return new Response(JSON.stringify({ error: "No text provided" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            })
        }

        // Direct fetch to OpenAI TTS API
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "tts-1-hd",
                input: text,
                voice: "nova",
                speed: 1.05,
                response_format: "mp3"
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error("OpenAI TTS error:", error)
            return new Response(JSON.stringify({ error: "TTS failed" }), { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            })
        }

        // Stream the audio directly
        const audioData = await response.arrayBuffer()
        console.log("TTS generated:", audioData.byteLength, "bytes")

        return new Response(audioData, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioData.byteLength.toString()
            }
        })
    } catch (error) {
        console.error("TTS error:", error)
        return new Response(JSON.stringify({ error: "Failed to generate speech" }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        })
    }
}

