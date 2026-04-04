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
    totalRounds?: number
    targetScore?: number
    gameMode: "generic" | "boerenbridge" | "schoppenvrouwen"
    /** Generic mode: round key per roundScores index (sorted union across players). */
    roundNumbers?: number[]
}

export async function generateStandUpdate(gameState: GameState) {
    const stream = createStreamableValue("")

    const { players, currentRound, totalRounds, targetScore, gameMode, roundNumbers } = gameState

    if (players.length === 0) {
        const stream = createStreamableValue("")
        stream.done()
        return { output: stream.value }
    }

    const roundLabel = (idx: number) =>
        roundNumbers !== undefined && roundNumbers[idx] !== undefined ? roundNumbers[idx]! : idx + 1

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
    const numRounds = Math.max(0, ...players.map((p) => p.roundScores.length))
    if (numRounds === 0) {
        const stream = createStreamableValue("")
        stream.done()
        return { output: stream.value }
    }

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

        roundHistory.push(`Ronde ${roundLabel(r)}: ${roundScores} → Leider: ${leaderAfterRound.name} (${leaderAfterRound.total})`)
    }

    /** Keep prompts short so the model doesn't narrate every round. */
    const RECENT_ROUNDS_IN_PROMPT = 5
    const roundHistoryRecent = roundHistory.slice(-RECENT_ROUNDS_IN_PROMPT)
    const roundHistoryOlderCount = Math.max(0, numRounds - RECENT_ROUNDS_IN_PROMPT)

    // Find biggest swing (best single round)
    let bestRound = { name: "", round: 0, score: -Infinity }
    let worstRound = { name: "", round: 0, score: Infinity }
    
    players.forEach((p) => {
        p.roundScores.forEach((score, idx) => {
            if (score > bestRound.score) {
                bestRound = { name: p.name, round: roundLabel(idx), score }
            }
            if (score < worstRound.score) {
                worstRound = { name: p.name, round: roundLabel(idx), score }
            }
        })
    })

    // Count positive/negative rounds per player
    const consistency = players.map((p) => {
        const positive = p.roundScores.filter((s) => s > 0).length
        const negative = p.roundScores.filter((s) => s < 0).length
        return { name: p.name, positive, negative, total: p.roundScores.length }
    })

    // Calculate game phase and progress based on game mode
    let gameProgress: number
    let gamePhase: string
    let roundsRemaining: number | undefined
    
    if (gameMode === "schoppenvrouwen" && targetScore) {
        // For schoppenvrouwen, progress is based on how close the leader is to target
        gameProgress = leader.score / targetScore
        const pointsToWin = targetScore - leader.score
        gamePhase = gameProgress < 0.33 ? "begin" : gameProgress < 0.66 ? "midden" : gameProgress < 0.85 ? "eindfase" : "finale"
        roundsRemaining = undefined // Unknown in target-based games
    } else if (totalRounds) {
        roundsRemaining = totalRounds - currentRound
        gameProgress = currentRound / totalRounds
        gamePhase = gameProgress < 0.33 ? "begin" : gameProgress < 0.66 ? "midden" : gameProgress < 0.9 ? "eindfase" : "finale"
    } else {
        gameProgress = 0.5
        gamePhase = "midden"
    }
    
    let gameContext: string
    if (gameMode === "boerenbridge" && totalRounds) {
        gameContext = `Dit is een spel Boerenbridge (een Nederlands kaartspel waar je moet inschatten hoeveel slagen je haalt). Positieve scores = goed voorspeld, negatieve scores = mis voorspeld.
Dit was ronde ${currentRound} van in totaal ${totalRounds} rondes. Er ${roundsRemaining === 1 ? "moet nog 1 ronde" : `moeten nog ${roundsRemaining} rondes`} gespeeld worden. We zitten in de ${gamePhase} van het spel.`
    } else if (gameMode === "schoppenvrouwen" && targetScore) {
        const pointsToWin = targetScore - leader.score
        gameContext = `Dit is een spel Schoppenvrouwen (ook wel Duizenden genoemd). Dit is een kaartspel waar je punten scoort en de eerste die ${targetScore} punten haalt wint. Als meerdere spelers tegelijk ${targetScore}+ halen, wint degene die als laatste de ronde afsloot.
Dit was ronde ${currentRound}. De leider ${leader.name} heeft nog ${pointsToWin} punten nodig om te winnen. We zitten in de ${gamePhase} van het spel.`
    } else {
        gameContext = "Dit is een scoretelling spel."
    }

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
            const role =
                p.gender === "m" ? "man" : p.gender === "v" ? "vrouw" : "niet gespecificeerd (neutraal: die/diens/hen)"
            return `${p.name}: ${role} → onderwerp: ${g.hij}; meewerkend voorwerp: ${g.hem}; bezittelijk: ${g.zijn}`
        })
        .join("\n")

    const recentFormLine =
        hotPlayer.name === coldPlayer.name || Math.abs(hotPlayer.avg - coldPlayer.avg) < 0.01
            ? "Recente vorm: iedereen zit dicht bij elkaar (geen duidelijke 'hot' of 'cold')."
            : `Recente vorm (laatste ${recentRounds} rondes): ${hotPlayer.name} zit het best in de flow (gem. ${hotPlayer.avg.toFixed(1)}), ${coldPlayer.name} heeft het zwaarder (gem. ${coldPlayer.avg.toFixed(1)}).`

    const isGameFinished = gameMode === "schoppenvrouwen" && targetScore
        ? leader.score >= targetScore
        : totalRounds ? currentRound >= totalRounds : false
    
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
                leadChanges.push(`Ronde ${roundLabel(r)}: ${leaderAfterRound.name} pakt de leiding over van ${previousLeader}`)
            }
            previousLeader = leaderAfterRound.name
        }
    }

    const getGameTypeDescription = () => {
        if (gameMode === "boerenbridge") {
            return "Dit was een spel Boerenbridge (een Nederlands kaartspel waar je moet inschatten hoeveel slagen je haalt). Positieve scores = goed voorspeld, negatieve scores = mis voorspeld."
        } else if (gameMode === "schoppenvrouwen" && targetScore) {
            return `Dit was een spel Schoppenvrouwen (ook wel Duizenden). Het doel was om als eerste ${targetScore} punten te halen.`
        }
        return "Dit is een scoretelling spel."
    }

    const roundsDescription = totalRounds 
        ? `NA ${totalRounds} RONDES` 
        : `NA ${currentRound} RONDES`

    const standDescription = totalRounds
        ? `(na ronde ${currentRound} van ${totalRounds})`
        : targetScore
            ? `(na ronde ${currentRound}, doel: ${targetScore} punten)`
            : `(na ronde ${currentRound})`

    const olderRoundsNote =
        roundHistoryOlderCount > 0
            ? `Let op: ${roundHistoryOlderCount} eerdere rondes zijn weggelaten; baseer je niet op elke ronde afzonderlijk.\n\n`
            : ""

    const FINISHED_HISTORY_TAIL = 10
    const roundHistoryFinishedTail = roundHistory.slice(-FINISHED_HISTORY_TAIL)
    const roundHistoryFinishedOmitted = Math.max(0, numRounds - FINISHED_HISTORY_TAIL)

    const prompt = isGameFinished
        ? `Je bent een scherpe Nederlandse spelcommentator (NOS-sport, maar dan voor kaarten: droog, slim, geen tierlantijnen). Het spel is AFGELOPEN.

${getGameTypeDescription()}

GESLACHT — gebruik consequent de juiste vorm per speler (zie onder; nooit "hij" voor iemand die als vrouw staat, enz.):
${playersGenderText}

EINDSTAND ${roundsDescription}:
${standingsText}

WINNAAR: ${leader.name} met ${leader.score} punten${targetScore ? ` (doel was ${targetScore})` : ""}
${sortedPlayers.length > 1 ? `2: ${sortedPlayers[1].name} (${sortedPlayers[1].score}, ${leader.score - sortedPlayers[1].score} achter)` : ""}
${sortedPlayers.length > 2 ? `Laatste: ${lastPlace.name} (${lastPlace.score})` : ""}

${roundHistoryFinishedOmitted > 0 ? `(${roundHistoryFinishedOmitted} oude rondes niet hieronder; niet alle rondes bespreken.)\n\n` : ""}LAATSTE RONDES (detail):
${roundHistoryFinishedTail.join("\n")}

LEIDINGSWISSELINGEN:
${leadChanges.length > 0 ? leadChanges.join("\n") : "Geen wisseling aan de kop — de winnaar stond vooraan vanaf het eerste moment."}

PEAK & DAL:
- Beste enkele ronde: ${bestRound.name}, ronde ${bestRound.round}, ${bestRound.score > 0 ? "+" : ""}${bestRound.score}
- Zwaarste ronde: ${worstRound.name}, ronde ${worstRound.round}, ${worstRound.score}
- Verschil 1e vs laatste: ${leader.score - lastPlace.score} pt

CONSISTENTIE (goed / mis over het hele spel):
${consistencyText}

STIJL (belangrijk):
- Maximaal 5 zinnen totaal — geen lap tekst.
- Open met de winnaar; daarna kort: spanning, beste moment of leidingsdrama; géén opsomming van elke ronde.
- Humor: understatement, ironie, één goede punchline — géén willekeurige metaforen ("als een trein in een soufflé"), géén dieren/planeten-vergelijkingen tenzij echt passend.
- Geen emoji's. Informeel maar strak.
- ALLEEN de commentaartekst.`
        : `Je bent een scherpe Nederlandse spelcommentator voor vrienden aan tafel: kort, grappig, intelligent — geen uitzending om de haverklap.

${gameContext}

GESLACHT — gebruik consequent de juiste vorm per speler:
${playersGenderText}

STAND ${standDescription}:
${standingsText}

${olderRoundsNote}LAATSTE RONDES:
${roundHistoryRecent.join("\n")}

KERNCIJFERS:
- Topronde tot nu toe: ${bestRound.name} (ronde ${bestRound.round}, ${bestRound.score > 0 ? "+" : ""}${bestRound.score})
- Dieptepunt: ${worstRound.name} (ronde ${worstRound.round}, ${worstRound.score})
- Kloof 1↔laatste: ${leader.score - lastPlace.score} pt
${targetScore ? `- ${leader.name} nog ${targetScore - leader.score} tot ${targetScore}` : ""}

${recentFormLine}

CONSISTENTIE (kort):
${consistencyText}

STIJL (belangrijk):
- Maximaal 3 zinnen. Liever 2 strakke zinnen dan 3 wollige.
- Geen opsomming van alle rondes; max. één concreet rondemoment als het echt iets toevoegt.
- Humor: droog, sportdesk-achtig, woordspel mag — géén geforceerde vergelijkingen of surrealistische beelden.
- Spanningsniveau alleen als het echt dichtbij elkaar zit of de kop nog kan wisselen; geen kunstmatige hype.
${targetScore ? `- Zo nodig één zin over afstand tot ${targetScore} punten.` : totalRounds ? `- Zo nodig één zin over resterende rondes (${roundsRemaining ?? "?"}).` : ""}
- Geen emoji's. ALLEEN de commentaartekst.`

    ;(async () => {
        const { textStream } = streamText({
            model: openai("gpt-4o-mini"),
            prompt,
            maxOutputTokens: isGameFinished ? 320 : 200
        })

        for await (const delta of textStream) {
            stream.update(delta)
        }

        stream.done()
    })()

    return { output: stream.value }
}

