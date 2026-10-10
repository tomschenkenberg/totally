"use server"

import { streamText } from "ai"
import { createStreamableValue } from "@ai-sdk/rsc"

/** Gateway catalog id. Non-reasoning so the first word shows up while people are still looking at the table. */
const STAND_UPDATE_MODEL = "spacexai/grok-4.20-non-reasoning"

const STAND_UPDATE_SYSTEM = `Je bent de scherpe vriend aan tafel die een kaartspel hardop nabespreekt. De tekst wordt voorgelezen, dus schrijf spreektaal: korte zinnen, gewone woorden.

Geen titel, geen aanhalingstekens, geen emoji, geen opsomming, geen haakjes, geen afkortingen.

Je klinkt droog en precies, alsof je meekeek. Geen stadionomroeper, geen chatbot, geen "wat een avond".

Harde regels:
- Alleen de commentaartekst.
- Gebruik per speler de voornaamwoorden uit de lijst. Nooit "hij" voor iemand die als vrouw staat, en nooit "zij" voor iemand die als man staat.
- Verzin niets. Geen score, ronde of wissel die niet in de cijfers staat.
- Hooguit één concreet rondemoment, en alleen als dat het verhaal draagt. Geen rondes afwerken.
- Zet cijfers in een zin: "twaalf punten erbij", "acht in de min". Niet "plus twaalf" en niet een rij getallen.
- Humor is understatement. Eén scherpe zin is genoeg. Geen vergelijkingen met dieren, voertuigen, eten of de kosmos.`

function getFinishedGameContext(gameMode: GameState["gameMode"], targetScore: number | undefined): string {
    switch (gameMode) {
        case "boerenbridge":
            return "Boerenbridge is afgelopen. Positieve scores betekenen een goede voorspelling, negatieve scores een misrekening."
        case "schoppenvrouwen":
            return targetScore
                ? `Schoppenvrouwen is afgelopen. Wie het eerst ${targetScore} haalde, won. Bij een gelijke finish telt wie de laatste ronde afsloot.`
                : "Schoppenvrouwen is afgelopen."
        case "generic":
            return "De scoretelling is afgelopen."
        default: {
            const _exhaustive: never = gameMode
            return _exhaustive
        }
    }
}

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
    const RECENT_ROUNDS_IN_PROMPT = 4
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
            ? "Over de laatste rondes zit iedereen dicht bij elkaar."
            : `Over de laatste ${recentRounds} rondes scoort ${hotPlayer.name} het best, gemiddeld ${hotPlayer.avg.toFixed(1)} per ronde, en ${coldPlayer.name} het slechtst, gemiddeld ${coldPlayer.avg.toFixed(1)}.`

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

    const runnerUp = sortedPlayers[1]
    const gapToSecond = runnerUp ? leader.score - runnerUp.score : 0
    const lastRoundIndex = numRounds - 1
    const lastRoundBoard = players
        .map((p) => ({ name: p.name, score: p.roundScores[lastRoundIndex] ?? 0 }))
        .sort((a, b) => b.score - a.score)
    const lastRoundBest = lastRoundBoard[0]
    const lastRoundWorst = lastRoundBoard[lastRoundBoard.length - 1]
    if (!lastRoundBest || !lastRoundWorst) {
        stream.done()
        return { output: stream.value }
    }

    const lastRoundLine =
        lastRoundBest.name === lastRoundWorst.name
            ? `Laatste gespeelde ronde: ${lastRoundBest.name} haalde ${lastRoundBest.score}.`
            : `Laatste gespeelde ronde: ${lastRoundBest.name} haalde ${lastRoundBest.score}, ${lastRoundWorst.name} haalde ${lastRoundWorst.score}.`

    const lastLeadChange = leadChanges.length > 0 ? leadChanges[leadChanges.length - 1] : undefined
    const FINISHED_HISTORY_TAIL = 6
    const roundHistoryFinishedTail = roundHistory.slice(-FINISHED_HISTORY_TAIL)
    const roundHistoryFinishedOmitted = Math.max(0, numRounds - FINISHED_HISTORY_TAIL)

    const raceLine = !runnerUp
        ? `${leader.name} staat alleen op ${leader.score}.`
        : gapToSecond === 0
          ? `${leader.name} en ${runnerUp.name} staan gelijk op ${leader.score}.`
          : `${leader.name} heeft ${leader.score}, ${runnerUp.name} heeft ${runnerUp.score}. Het verschil is ${gapToSecond}.`

    const stakesLine = targetScore
        ? `${leader.name} heeft nog ${Math.max(0, targetScore - leader.score)} punten nodig voor ${targetScore}.`
        : roundsRemaining !== undefined
          ? roundsRemaining <= 0
              ? "Er zijn geen rondes meer."
              : roundsRemaining === 1
                ? "Er is nog één ronde."
                : `Er zijn nog ${roundsRemaining} rondes.`
          : ""

    const sharedBrief = `Voornaamwoorden, gebruik ze zo:
${playersGenderText}

Stand:
${standingsText}

${lastRoundLine}
Beste ronde van de avond tot nu toe: ${bestRound.name} in ronde ${bestRound.round} met ${bestRound.score}.
Slechtste ronde: ${worstRound.name} in ronde ${worstRound.round} met ${worstRound.score}.
Kloof tussen eerste en laatste: ${leader.score - lastPlace.score}.
${lastLeadChange ? `Laatste wissel aan de kop: ${lastLeadChange}.` : "De kop is nog niet gewisseld."}
Aantal keer dat de kop wisselde: ${Math.max(0, leadChanges.length)}.

${recentFormLine}

Wie vaak raak of mis zit:
${consistencyText}`

    const prompt = isGameFinished
        ? `Het spel is uit.

${getFinishedGameContext(gameMode, targetScore)}

${sharedBrief}

${roundHistoryFinishedOmitted > 0 ? `${roundHistoryFinishedOmitted} oudere rondes staan hier niet. Niet doen alsof je ze stuk voor stuk gezien hebt.\n\n` : ""}Laatste rondes, alleen als bron, niet om op te noemen:
${roundHistoryFinishedTail.join("\n")}

Schrijf vier of vijf zinnen.
Eerste zin: wie won, met hoeveel, en of dat verdiend of nipt was.
Daarna: hoe de kop liep, of juist niet.
Eén zin over het moment dat de avond kleurde, uit de cijfers hierboven.
Sluit af met degene die laatste werd, droog, niet gemeen.`
        : `${gameContext}

${raceLine}
${stakesLine}

${sharedBrief}

${roundHistoryOlderCount > 0 ? `${roundHistoryOlderCount} oudere rondes staan hier niet. Niet doen alsof je ze stuk voor stuk gezien hebt.\n\n` : ""}Laatste rondes, alleen als bron:
${roundHistoryRecent.join("\n")}

Schrijf drie of vier zinnen.
Eerste zin: hoe de stand nu voelt, met namen en het verschil.
Tweede zin: het patroon of het ene rondemoment dat die stand verklaart.
Laatste zin: ${stakesLine ? "wat er nog te halen valt, alleen als dat echt iets verandert." : "een droge slotzin over degene die de avond kleurt."}
Als het verschil groot is, zeg dat het uit is. Verzin geen spanning.`

    ;(async () => {
        let wrote = false
        try {
            const { textStream } = streamText({
                model: STAND_UPDATE_MODEL,
                system: STAND_UPDATE_SYSTEM,
                prompt,
                temperature: 0.8,
                maxOutputTokens: isGameFinished ? 420 : 280
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
                ? "Vercel AI Gateway heeft nog een betaalmethode nodig voor Grok. Voeg een kaart toe in je Vercel-team, dan werkt deze update."
                : "Oeps, kon geen update genereren. Probeer het nog eens!"
            if (!wrote) {
                stream.update(friendly)
            }
            stream.done()
        }
    })()

    return { output: stream.value }
}

