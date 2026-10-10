import { generateText } from "ai"
import { buildStandUpdatePrompt, STAND_UPDATE_SYSTEM } from "@/lib/stand-update/build-prompt"
import type { StandUpdateGameState } from "@/lib/stand-update/build-game-state"

const sv = (players: StandUpdateGameState["players"], winnerName?: string): StandUpdateGameState => ({
    players,
    currentRound: players[0]!.roundScores.length + 1,
    targetScore: 1000,
    gameMode: "schoppenvrouwen",
    winnerName
})
const p = (name: string, gender: "m" | "v" | "x", roundScores: number[]) => ({
    name,
    gender,
    roundScores,
    score: roundScores.reduce((a, b) => a + b, 0)
})

const scenarios: Record<string, StandUpdateGameState> = {
    "schoppen na 2 rondes": sv([p("Tom", "m", [180, 230]), p("Lisa", "v", [-40, 60]), p("Joost", "m", [95, -20])]),
    "schoppen bijna finish": sv([
        p("Tom", "m", [180, 230, 120, 210, 160]),
        p("Lisa", "v", [-40, 60, 250, 140, 200]),
        p("Joost", "m", [95, -20, 30, 80, -60])
    ]),
    "schoppen eind tiebreak": sv(
        [
            p("Tom", "m", [180, 230, 120, 210, 160, 150]),
            p("Lisa", "v", [-40, 60, 250, 140, 200, 410]),
            p("Joost", "m", [95, -20, 30, 80, -60, 90])
        ],
        "Lisa"
    ),
    "boerenbridge ronde 5": {
        players: [p("Tom", "m", [15, -2, 13, 12, -1]), p("Lisa", "v", [-3, 14, -1, 5, 9]), p("Sam", "x", [5, 5, -4, -2, 6])],
        currentRound: 6,
        totalRounds: 19,
        gameMode: "boerenbridge"
    }
}

const only = process.argv[2]
for (const [name, state] of Object.entries(scenarios)) {
    if (only && !name.includes(only)) continue
    const built = buildStandUpdatePrompt(state)!
    if (process.env.SHOW_PROMPT) console.log(built.prompt)
    const t0 = Date.now()
    const { text, finishReason, usage, reasoningText } = await generateText({
        model: "anthropic/claude-sonnet-5.5",
        system: STAND_UPDATE_SYSTEM,
        prompt: built.prompt,
        reasoning: (process.env.REASONING ?? "none") as "none" | "low",
        maxOutputTokens: (built.isFinished ? 600 : 450) + (process.env.REASONING === "low" ? 1500 : 0)
    })
    console.log(`\n=== ${name} (${Date.now() - t0}ms) ===\n${text}`)
    if (process.env.DEBUG) console.log(finishReason, JSON.stringify(usage), reasoningText?.slice(0, 300))
}
