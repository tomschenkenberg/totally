"use server"

import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createStreamableValue } from "@ai-sdk/rsc"

type Gender = "m" | "v" | "x"

interface PlayerStanding {
    name: string
    gender: Gender
    score: number
    roundScores: number[] // score per round
}

interface GameState {
    players: PlayerStanding[]
    currentRound: number
    totalRounds: number
    gameMode: "generic" | "boerenbridge"
}

export async function generateStandUpdate(gameState: GameState) {
    const stream = createStreamableValue("")

    const { players, currentRound, totalRounds, gameMode } = gameState

    // Sort players by score descending
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
    const leader = sortedPlayers[0]
    const lastPlace = sortedPlayers[sortedPlayers.length - 1]

    // Calculate recent performance (last 3 rounds)
    const recentRounds = 3
    const recentPerformance = players.map((p) => {
        const recent = p.roundScores.slice(-recentRounds)
        const avg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
        return { name: p.name, recent, avg }
    })

    // Find hot/cold players
    const hotPlayer = recentPerformance.reduce((a, b) => (b.avg > a.avg ? b : a))
    const coldPlayer = recentPerformance.reduce((a, b) => (b.avg < a.avg ? b : a))

    // Build complete round history
    const numRounds = Math.max(...players.map((p) => p.roundScores.length))
    const roundHistory: string[] = []
    
    for (let r = 0; r < numRounds; r++) {
        const roundScores = players
            .map((p) => `${p.name}: ${p.roundScores[r] !== undefined ? (p.roundScores[r] > 0 ? "+" : "") + p.roundScores[r] : "-"}`)
            .join(", ")
        
        // Calculate running totals after this round
        const runningTotals = players.map((p) => ({
            name: p.name,
            total: p.roundScores.slice(0, r + 1).reduce((a, b) => a + b, 0)
        }))
        const leaderAfterRound = runningTotals.sort((a, b) => b.total - a.total)[0]
        
        roundHistory.push(`Ronde ${r + 1}: ${roundScores} → Leider: ${leaderAfterRound.name} (${leaderAfterRound.total})`)
    }

    // Find biggest swing (best single round)
    let bestRound = { name: "", round: 0, score: -Infinity }
    let worstRound = { name: "", round: 0, score: Infinity }
    
    players.forEach((p) => {
        p.roundScores.forEach((score, idx) => {
            if (score > bestRound.score) {
                bestRound = { name: p.name, round: idx + 1, score }
            }
            if (score < worstRound.score) {
                worstRound = { name: p.name, round: idx + 1, score }
            }
        })
    })

    // Count positive/negative rounds per player
    const consistency = players.map((p) => {
        const positive = p.roundScores.filter((s) => s > 0).length
        const negative = p.roundScores.filter((s) => s < 0).length
        return { name: p.name, positive, negative, total: p.roundScores.length }
    })

    const roundsRemaining = totalRounds - currentRound
    const gameProgress = currentRound / totalRounds
    const gamePhase = gameProgress < 0.33 ? "begin" : gameProgress < 0.66 ? "midden" : gameProgress < 0.9 ? "eindfase" : "finale"
    
    const gameContext =
        gameMode === "boerenbridge"
            ? `Dit is een spel Boerenbridge (een Nederlands kaartspel waar je moet inschatten hoeveel slagen je haalt). Positieve scores = goed voorspeld, negatieve scores = mis voorspeld.
Dit was ronde ${currentRound} van in totaal ${totalRounds} rondes. Er ${roundsRemaining === 1 ? "moet nog 1 ronde" : `moeten nog ${roundsRemaining} rondes`} gespeeld worden. We zitten in de ${gamePhase} van het spel.`
            : "Dit is een scoretelling spel."

    const standingsText = sortedPlayers
        .map((p, i) => `${i + 1}. ${p.name}: ${p.score} punten`)
        .join("\n")

    const consistencyText = consistency
        .map((c) => `${c.name}: ${c.positive}x goed, ${c.negative}x mis van ${c.total} rondes`)
        .join("\n")

    // Gender pronouns helper
    const genderInfo = (gender: Gender) => {
        switch (gender) {
            case "m": return { hij: "hij", hem: "hem", zijn: "zijn" }
            case "v": return { hij: "zij", hem: "haar", zijn: "haar" }
            default: return { hij: "die", hem: "die", zijn: "diens" }
        }
    }
    
    const playersGenderText = players
        .map((p) => {
            const g = genderInfo(p.gender)
            return `${p.name}: ${p.gender === "m" ? "man" : p.gender === "v" ? "vrouw" : "onbekend"} → gebruik "${g.hij}/${g.hem}/${g.zijn}"`
        })
        .join("\n")

    const isGameFinished = currentRound >= totalRounds
    
    // Find who led at different points
    const leadChanges: string[] = []
    let previousLeader = ""
    for (let r = 0; r < numRounds; r++) {
        const runningTotals = players.map((p) => ({
            name: p.name,
            total: p.roundScores.slice(0, r + 1).reduce((a, b) => a + b, 0)
        }))
        const leaderAfterRound = runningTotals.sort((a, b) => b.total - a.total)[0]
        if (leaderAfterRound.name !== previousLeader) {
            if (previousLeader) {
                leadChanges.push(`Ronde ${r + 1}: ${leaderAfterRound.name} pakt de leiding over van ${previousLeader}`)
            }
            previousLeader = leaderAfterRound.name
        }
    }

    const prompt = isGameFinished
        ? `Je bent een enthousiaste en grappige Nederlandse spelcommentator. Het spel is AFGELOPEN! Geef een epische samenvatting van het hele spel en roep de winnaar uit.

${gameMode === "boerenbridge" ? "Dit was een spel Boerenbridge (een Nederlands kaartspel waar je moet inschatten hoeveel slagen je haalt). Positieve scores = goed voorspeld, negatieve scores = mis voorspeld." : "Dit is een scoretelling spel."}

GESLACHT SPELERS (gebruik de juiste voornaamwoorden!):
${playersGenderText}

🏆 EINDSTAND NA ${totalRounds} RONDES:
${standingsText}

WINNAAR: ${leader.name} met ${leader.score} punten!
${sortedPlayers.length > 1 ? `Nummer 2: ${sortedPlayers[1].name} met ${sortedPlayers[1].score} punten (${leader.score - sortedPlayers[1].score} punten achterstand)` : ""}
${sortedPlayers.length > 2 ? `Hekkensluiter: ${lastPlace.name} met ${lastPlace.score} punten` : ""}

VOLLEDIGE RONDE HISTORIE:
${roundHistory.join("\n")}

LEIDINGSWISSELINGEN:
${leadChanges.length > 0 ? leadChanges.join("\n") : "Geen leidingswisselingen - de winnaar leidde vanaf het begin!"}

STATISTIEKEN VAN HET HELE SPEL:
- Beste ronde: ${bestRound.name} in ronde ${bestRound.round} met ${bestRound.score > 0 ? "+" : ""}${bestRound.score} punten
- Slechtste ronde: ${worstRound.name} in ronde ${worstRound.round} met ${worstRound.score} punten
- Totaal punten verschil 1e en laatste: ${leader.score - lastPlace.score} punten

CONSISTENTIE OVER ALLE ${totalRounds} RONDES:
${consistencyText}

INSTRUCTIES:
- Maximaal 6-8 zinnen (dit is de grote finale!)
- Begin met het uitroepen van de winnaar op een feestelijke manier
- Geef een korte terugblik op het spel: was het spannend? Waren er comebacks?
- Benoem bijzondere momenten of leidingswisselingen
- Geef de winnaar een compliment en de verliezer(s) een troostende/grappige opmerking
- BELANGRIJK: Gebruik de juiste voornaamwoorden per speler (hij/zij/die, hem/haar, zijn/haar/diens)
- Wees grappig en creatief met woordspelingen
- Gebruik informele, enthousiaste taal
- Geen emojis gebruiken
- ALLEEN de update tekst, geen intro of afsluiting`
        : `Je bent een enthousiaste en grappige Nederlandse spelcommentator. Geef een korte, leuke update over de stand van het spel.

${gameContext}

GESLACHT SPELERS (gebruik de juiste voornaamwoorden!):
${playersGenderText}

HUIDIGE STAND (na ronde ${currentRound} van ${totalRounds}):
${standingsText}

VOLLEDIGE RONDE HISTORIE:
${roundHistory.join("\n")}

STATISTIEKEN:
- Beste ronde ooit: ${bestRound.name} in ronde ${bestRound.round} met ${bestRound.score > 0 ? "+" : ""}${bestRound.score} punten
- Slechtste ronde ooit: ${worstRound.name} in ronde ${worstRound.round} met ${worstRound.score} punten
- Verschil tussen 1 en laatste: ${leader.score - lastPlace.score} punten

CONSISTENTIE (voorspellingen goed/mis):
${consistencyText}

RECENTE VORM (laatste ${recentRounds} rondes):
- Hot: ${hotPlayer.name} (gem. ${hotPlayer.avg.toFixed(1)} per ronde)
- Not: ${coldPlayer.name} (gem. ${coldPlayer.avg.toFixed(1)} per ronde)

INSTRUCTIES:
- Maximaal 4-5 zinnen
- Wees grappig en creatief met woordspelingen of grappige vergelijkingen
- Benoem wie er goed speelt en wie het moeilijk heeft
- Verwijs naar specifieke rondes of momenten als dat interessant is
- Als iemand een comeback maakt of juist wegzakt, benoem dat!
- Als het spannend is, benoem dat!
- Vermeld waar we zijn in het spel (bijv. "halverwege", "nog 3 rondes te gaan", "de finale nadert")
- BELANGRIJK: Gebruik de juiste voornaamwoorden per speler (hij/zij/die, hem/haar, zijn/haar/diens)
- Gebruik informele, enthousiaste taal (alsof je vrienden aan het commentaar geeft)
- Geen emojis gebruiken
- ALLEEN de update tekst, geen intro of afsluiting`

    ;(async () => {
        const { textStream } = streamText({
            model: openai("gpt-4o-mini"),
            prompt
        })

        for await (const delta of textStream) {
            stream.update(delta)
        }

        stream.done()
    })()

    return { output: stream.value }
}

