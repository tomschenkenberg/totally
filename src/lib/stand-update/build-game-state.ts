import {
    activeNamedPlayers,
    maxRoundKeyFromPlayers,
    sortedUnionRoundKeys,
    type Player
} from "@/lib/atoms/players"
import {
    BOEREN_BRIDGE_ROUNDS,
    calculateBoerenBridgeScore,
    isSchoppenvrouwenRoundFullyScored,
    SCHOPPENVROUWEN_TARGET_SCORE,
    type BoerenBridgeGame,
    type SchoppenvrouwenGame,
    type GameMode
} from "@/lib/atoms/game"

export type StandUpdateGameState = {
    players: Array<{
        name: string
        gender: "m" | "v" | "x"
        score: number
        roundScores: number[]
    }>
    currentRound: number
    totalRounds?: number
    targetScore?: number
    roundNumbers?: number[]
    gameMode: GameMode
}

export function buildBoerenBridgeStandState(
    game: BoerenBridgeGame,
    players: Record<number, Player>,
    getTotal: (id: number) => number
): StandUpdateGameState {
    const playerStandings = game.playerOrder.map((id) => {
        const player = players[id]
        const roundScores = game.rounds
            .filter((round) => round.bids[id] !== undefined && round.tricks[id] !== undefined)
            .map((round) => calculateBoerenBridgeScore(round.bids[id], round.tricks[id]))

        return {
            name: player?.name || "Onbekend",
            gender: (player?.gender || "x") as "m" | "v" | "x",
            score: getTotal(id),
            roundScores
        }
    })

    return {
        players: playerStandings,
        currentRound: game.currentRoundIndex + 1,
        totalRounds: BOEREN_BRIDGE_ROUNDS.length,
        gameMode: "boerenbridge"
    }
}

export function buildSchoppenvrouwenStandState(
    game: SchoppenvrouwenGame,
    players: Record<number, Player>,
    getTotal: (id: number) => number
): StandUpdateGameState {
    const n = game.playerOrder.length
    const playerStandings = game.playerOrder.map((id) => {
        const player = players[id]
        const roundScores = game.rounds
            .filter((round) => isSchoppenvrouwenRoundFullyScored(round, n))
            .map((round) => round.scores[id] ?? 0)

        return {
            name: player?.name || "Onbekend",
            gender: (player?.gender || "x") as "m" | "v" | "x",
            score: getTotal(id),
            roundScores
        }
    })

    return {
        players: playerStandings,
        currentRound: game.currentRoundIndex + 1,
        targetScore: SCHOPPENVROUWEN_TARGET_SCORE,
        gameMode: "schoppenvrouwen"
    }
}

export function buildGenericStandState(players: Record<number, Player>): StandUpdateGameState {
    const genericPlayers = activeNamedPlayers(players)
    const roundKeys = sortedUnionRoundKeys(genericPlayers)
    const maxRound = maxRoundKeyFromPlayers(genericPlayers)
    const playerStandings = Object.entries(genericPlayers).map(([, player]) => ({
        name: player.name,
        gender: (player.gender || "x") as "m" | "v" | "x",
        score: Object.values(player.scores).reduce((a, b) => a + b, 0),
        roundScores: roundKeys.map((r) => player.scores[r] ?? 0)
    }))

    return {
        players: playerStandings,
        currentRound: maxRound,
        totalRounds: maxRound,
        roundNumbers: roundKeys,
        gameMode: "generic"
    }
}
