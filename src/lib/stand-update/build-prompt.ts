import { BOEREN_BRIDGE_ROUNDS } from "@/lib/atoms/game"
import type { StandUpdateGameState } from "@/lib/stand-update/build-game-state"

type PlayerState = StandUpdateGameState["players"][number]

export const STAND_UPDATE_SYSTEM = `Je bent de spelleider aan de keukentafel tijdens een kaartavond met vrienden of familie. Na een ronde geef je een korte stand-update die hardop wordt voorgelezen aan de hele tafel.

Toon:
- Ludiek en komisch. Denk aan een sportcommentator met een vette knipoog: lichte overdrijving, een woordgrap, een onverwachte vergelijking. Een beetje gek mag. Zorg voor minstens één zin waar de tafel om grinnikt.
- Warm en aanmoedigend. Na het voorlezen moet iedereen aan tafel zin hebben in de volgende ronde, vooral wie achter staat.
- Plagen mag alleen lief en over de situatie, nooit over de persoon. Geen roasts, geen sarcasme ten koste van iemand, niemand belachelijk maken.
- Wie achter staat is de achtervolger, de underdog of bezig aan een comeback. Nooit afgeschreven.
- Verboden: zeggen of suggereren dat iemand niet meer kan winnen of inhalen, dat de race gelopen of beslist is, of dat iemand kansloos is. Enige uitzondering: in de gegevens staat bij die speler letterlijk WISKUNDIG BESLIST.

Feiten:
- Gebruik alleen namen, cijfers en rondes uit de gegevens. Neem elk getal letterlijk over en reken niet zelf. Verzin geen kaarten, slagen, combinaties, spelbegrippen of gebeurtenissen die er niet staan.
- Een minscore is pech, geen prestatie. Maak er geen heldendaad van, maar ook geen drama.
- Houd je aan de spelregels uit de gegevens. Leg regels alleen uit als dat de spanning of de grap dient.
- Gebruik per speler precies de voornaamwoorden uit de gegevens.

Voorleestekst:
- Spreektaal, korte zinnen. Geen titel, opsomming, emoji, haakjes, aanhalingstekens of afkortingen.
- Getallen in een zin zoals je ze uitspreekt, bijvoorbeeld 350 punten of nog 200 te gaan. Geen rijtjes getallen, geen plus- of mintekens.
- Alleen de tekst zelf, geen inleiding of afsluiting buiten de update.`

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

function pronouns(gender: PlayerState["gender"]): string {
    switch (gender) {
        case "m":
            return "man: hij, hem, zijn"
        case "v":
            return "vrouw: zij, haar, haar"
        case "x":
            return "neutraal: die, hen, diens"
        default: {
            const _exhaustive: never = gender
            return _exhaustive
        }
    }
}

function runningTotals(players: PlayerState[], upToRoundIndex: number) {
    return players
        .map((p) => ({ name: p.name, total: sum(p.roundScores.slice(0, upToRoundIndex + 1)) }))
        .sort((a, b) => b.total - a.total)
}

function leaderTitleText(players: PlayerState[], numRounds: number): string {
    const changes: string[] = []
    let previous = ""
    for (let r = 0; r < numRounds; r++) {
        const top = runningTotals(players, r)[0]
        if (top && top.name !== previous) {
            if (previous) changes.push(`ronde ${r + 1}: ${top.name} neemt de leiding over van ${previous}`)
            previous = top.name
        }
    }
    if (changes.length === 0) return "De leiding is nog niet van eigenaar gewisseld."
    return `De leiding wisselde ${changes.length} keer. Laatste wissel in ${changes[changes.length - 1]}.`
}

function playerLines(sorted: PlayerState[], roundLabel: (idx: number) => number): string {
    const leader = sorted[0]
    return sorted
        .map((p, i) => {
            const last = p.roundScores[p.roundScores.length - 1]
            const recent = p.roundScores.slice(-3)
            const recentAvg = recent.length > 0 ? Math.round(sum(recent) / recent.length) : 0
            let bestIdx = 0
            p.roundScores.forEach((s, idx) => {
                if (s > p.roundScores[bestIdx]!) bestIdx = idx
            })
            const position =
                i === 0
                    ? "aan kop"
                    : p.score === leader.score
                      ? `gedeeld eerste met ${leader.name}`
                      : `plek ${i + 1}, ${leader.score - p.score} achter ${leader.name}`
            return `- ${p.name} (${pronouns(p.gender)}): ${p.score} punten, ${position}. Laatste ronde ${last ?? 0}, gemiddeld ${recentAvg} over de laatste ${recent.length} rondes, beste ronde ${p.roundScores[bestIdx] ?? 0} in ronde ${roundLabel(bestIdx)}.`
        })
        .join("\n")
}

function recentRoundsText(players: PlayerState[], numRounds: number, roundLabel: (idx: number) => number): string {
    const from = Math.max(0, numRounds - 4)
    const lines: string[] = []
    for (let r = from; r < numRounds; r++) {
        const scores = players.map((p) => `${p.name} ${p.roundScores[r] ?? 0}`).join(", ")
        const top = runningTotals(players, r)[0]
        lines.push(`Ronde ${roundLabel(r)}: ${scores}. Leider daarna: ${top?.name} met ${top?.total}.`)
    }
    return lines.join("\n")
}

function momentumText(players: PlayerState[]): string {
    const window = 2
    if (Math.max(...players.map((p) => p.roundScores.length)) < window) return ""
    const recent = players
        .map((p) => ({ name: p.name, total: sum(p.roundScores.slice(-window)) }))
        .sort((a, b) => b.total - a.total)
    const hot = recent[0]
    if (!hot || recent.every((r) => r.total === hot.total)) return ""
    return `Beste vorm over de laatste ${window} rondes: ${hot.name} met ${hot.total} punten samen.`
}

function schoppenvrouwenRules(target: number): string {
    return `Spel: Schoppenvrouwen. Iedereen krijgt 13 kaarten. Een ronde eindigt zodra iemand uitlegt. Daarna schrijft iedereen de punten van die ronde op, en dat kan ook een minscore zijn. Wie als eerste ${target} punten haalt, wint het spel. Halen meerdere spelers in dezelfde ronde ${target}, dan wint wie die ronde uitlegde, ook als een ander meer punten heeft.`
}

function schoppenvrouwenRace(sorted: PlayerState[], target: number, numRounds: number): string {
    const leader = sorted[0]!
    const all = sorted.flatMap((p) => p.roundScores)
    const positives = all.filter((s) => s > 0)
    const typicalGood = positives.length > 0 ? Math.round(sum(positives) / positives.length) : 0
    const biggest = Math.max(...all)
    const toGo = Math.max(0, target - leader.score)
    const leaderAvg = leader.roundScores.length > 0 ? leader.score / leader.roundScores.length : 0
    const leaderRoundsLeft = leaderAvg > 0 ? Math.max(1, Math.ceil(toGo / leaderAvg)) : undefined

    const lines = [
        `Er zijn ${numRounds} ${numRounds === 1 ? "ronde" : "rondes"} gespeeld. Niemand heeft ${target}, dus iedereen kan nog winnen.`,
        `Schaal: een ronde in de plus levert vanavond gemiddeld ${typicalGood} op. De grootste ronde tot nu toe was ${biggest}.`,
        leaderRoundsLeft !== undefined
            ? `${leader.name} heeft nog ${toGo} nodig. In het huidige tempo van ongeveer ${Math.round(leaderAvg)} per ronde duurt dat nog zo'n ${leaderRoundsLeft} ${leaderRoundsLeft === 1 ? "ronde" : "rondes"}, maar een minronde kan dat zo oprekken.`
            : `${leader.name} heeft nog ${toGo} nodig en zit nog niet in een vast tempo.`
    ]
    for (const p of sorted.slice(1)) {
        const gap = leader.score - p.score
        if (gap === 0) continue
        const goodRounds = typicalGood > 0 ? Math.max(1, Math.round(gap / typicalGood)) : 0
        const reach =
            gap <= biggest
                ? "dat is minder dan de grootste ronde van vanavond"
                : goodRounds > 0
                  ? `dat is ongeveer ${goodRounds} goede ${goodRounds === 1 ? "ronde" : "rondes"} werk`
                  : "dat is nog prima te overbruggen"
        lines.push(`${p.name}: ${gap} punten achter op ${leader.name}, ${reach}.`)
    }
    if (leaderRoundsLeft === 1 && sorted.length > 1) {
        lines.push(
            `${leader.name} kan volgende ronde al over de streep. Dat is spanning, geen eindstand: wie er dan zelf ook komt en uitlegt, wint alsnog.`
        )
    }
    return lines.join("\n")
}

function boerenbridgeRules(totalRounds: number): string {
    return `Spel: Boerenbridge. Elke ronde voorspelt iedereen hoeveel slagen die haalt. Precies goed geeft vijf punten plus het aantal slagen. Fout kost een punt per slag verschil. Het spel heeft ${totalRounds} rondes: van tien kaarten af naar één en weer terug naar tien. Hoe meer kaarten, hoe meer punten er te halen zijn.`
}

function boerenbridgeRace(sorted: PlayerState[], numRounds: number, totalRounds: number): string {
    const leader = sorted[0]!
    const remaining = BOEREN_BRIDGE_ROUNDS.slice(numRounds, totalRounds)
    const maxGain = sum(remaining.map((c) => 5 + c))
    const maxSwing = sum(remaining.map((c) => 5 + 2 * c))

    const lines = [
        `Gespeeld: ${numRounds} van ${totalRounds} rondes. Nog ${remaining.length} te gaan.`,
        remaining[0] !== undefined
            ? `De volgende ronde wordt gespeeld met ${remaining[0]} ${remaining[0] === 1 ? "kaart" : "kaarten"} per persoon.`
            : "",
        `Wie de rest van het spel alles precies goed voorspelt, pakt nog ${maxGain} punten.`
    ].filter(Boolean)
    for (const p of sorted.slice(1)) {
        const gap = leader.score - p.score
        if (gap === 0) continue
        lines.push(
            gap > maxSwing
                ? `${p.name}: ${gap} punten achter op ${leader.name}. WISKUNDIG BESLIST voor de eerste plek, maar er valt nog genoeg te winnen in de onderlinge strijd.`
                : `${p.name}: ${gap} punten achter op ${leader.name}, nog volop in te halen.`
        )
    }
    return lines.join("\n")
}

function genericRace(numRounds: number): string {
    return `Spel: onbekend spel met een vrije scoretelling. Er zijn ${numRounds} ${numRounds === 1 ? "ronde" : "rondes"} ingevuld en het is onbekend hoeveel er nog komen, dus alles kan nog.`
}

function isFinished(state: StandUpdateGameState, numRounds: number, leader: PlayerState): boolean {
    switch (state.gameMode) {
        case "schoppenvrouwen":
            return leader.score >= (state.targetScore ?? Infinity)
        case "boerenbridge":
            return numRounds >= (state.totalRounds ?? BOEREN_BRIDGE_ROUNDS.length)
        case "generic":
            return false
        default: {
            const _exhaustive: never = state.gameMode
            return _exhaustive
        }
    }
}

function winnerText(state: StandUpdateGameState, sorted: PlayerState[]): string {
    const leader = sorted[0]!
    if (state.gameMode === "schoppenvrouwen") {
        const winner = state.winnerName ?? leader.name
        if (winner !== leader.name) {
            return `${winner} wint. In de laatste ronde gingen meerdere spelers over de ${state.targetScore}, en dan wint wie die ronde uitlegde: dat was ${winner}. ${leader.name} eindigde wel met de meeste punten.`
        }
        return `${winner} wint door als eerste over de ${state.targetScore} te gaan.`
    }
    const tied = sorted.filter((p) => p.score === leader.score)
    if (tied.length > 1) return `Gedeelde winst voor ${tied.map((p) => p.name).join(" en ")} met ${leader.score}.`
    return `${leader.name} wint met ${leader.score} punten.`
}

/** Returns null when there is nothing scored yet. */
export function buildStandUpdatePrompt(state: StandUpdateGameState): { prompt: string; isFinished: boolean } | null {
    const { players, roundNumbers } = state
    if (players.length === 0) return null
    const numRounds = Math.max(0, ...players.map((p) => p.roundScores.length))
    if (numRounds === 0) return null

    const roundLabel = (idx: number) => roundNumbers?.[idx] ?? idx + 1
    const sorted = [...players].sort((a, b) => b.score - a.score)
    const leader = sorted[0]!
    const finished = isFinished(state, numRounds, leader)

    let rules: string
    switch (state.gameMode) {
        case "schoppenvrouwen": {
            const target = state.targetScore ?? 1000
            rules = `${schoppenvrouwenRules(target)}\n\n${finished ? "" : schoppenvrouwenRace(sorted, target, numRounds)}`
            break
        }
        case "boerenbridge": {
            const total = state.totalRounds ?? BOEREN_BRIDGE_ROUNDS.length
            rules = `${boerenbridgeRules(total)}\n\n${finished ? "" : boerenbridgeRace(sorted, numRounds, total)}`
            break
        }
        case "generic":
            rules = genericRace(numRounds)
            break
        default: {
            const _exhaustive: never = state.gameMode
            return _exhaustive
        }
    }

    const brief = `${rules.trim()}

Spelers, van hoog naar laag, met voornaamwoorden:
${playerLines(sorted, roundLabel)}

${leaderTitleText(players, numRounds)}
${momentumText(players)}

Laatste rondes, als bron en niet om op te sommen:
${recentRoundsText(players, numRounds, roundLabel)}`

    const prompt = finished
        ? `Het spel is afgelopen. ${winnerText(state, sorted)}

${brief}

Schrijf de eindbeschouwing in vier tot zes zinnen.
Begin met een feestelijke felicitatie aan de winnaar, met de eindscore.
Pak daarna een leuk hoogtepunt of verloop uit de cijfers, bijvoorbeeld een grote ronde of een wissel aan kop.
Geef de andere spelers ook een eervolle vermelding met een positieve draai, de laatste plek incluis.
Eindig met iets waardoor iedereen zin heeft in een revanche.`
        : `Tussenstand na ronde ${roundLabel(numRounds - 1)}.

${brief}

Schrijf de stand-update in drie tot vijf zinnen.
Begin met de stand: wie leidt en hoe dicht de rest erbij zit, met namen.
Maak één grappige observatie uit de cijfers, bijvoorbeeld een grote ronde, een wissel aan kop of iemand in vorm.
Geef de achtervolgers concreet moed met de feiten over inhalen hierboven.
Eindig met iets dat de spanning opbouwt voor de volgende ronde.`

    return { prompt, isFinished: finished }
}
