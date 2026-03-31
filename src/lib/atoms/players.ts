import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

// Types
export type Scores = { [round: number]: number }
export type Gender = "m" | "v" | "x" // man, vrouw, onbekend
export interface Player {
    name: string
    gender: Gender
    scores: Scores
    /** When false, hidden from games / generic scoring; still in roster. Omitted = active (migration). */
    active?: boolean
}
export type Players = { [id: number]: Player }

export function isPlayerActive(player: Player): boolean {
    return player.active !== false
}

/** Players with a non-empty name who are toggled on (for games + generic score entry). */
export function activeNamedPlayers(players: Players): Players {
    const out: Players = {}
    for (const [idStr, p] of Object.entries(players)) {
        const id = Number(idStr)
        if (p.name.trim() && isPlayerActive(p)) {
            out[id] = p
        }
    }
    return out
}

export function nextPlayerId(players: Players): number {
    const ids = Object.keys(players).map(Number)
    return ids.length === 0 ? 0 : Math.max(...ids) + 1
}

/** Numeric round keys from a player's scores (object keys are stringified in storage). */
export function numericScoreKeysForPlayer(player: Player): number[] {
    return Object.keys(player.scores)
        .map((k) => Number(k))
        .filter((n) => Number.isFinite(n))
}

/** Highest round key across all players (0 if none). */
export function maxRoundKeyFromPlayers(players: Players): number {
    let max = 0
    for (const p of Object.values(players)) {
        for (const n of numericScoreKeysForPlayer(p)) {
            if (n > max) max = n
        }
    }
    return max
}

/** Union of all players' round keys, sorted ascending (timeline for generic / stand update). */
export function sortedUnionRoundKeys(players: Players): number[] {
    const keys = new Set<number>()
    for (const p of Object.values(players)) {
        for (const n of numericScoreKeysForPlayer(p)) {
            keys.add(n)
        }
    }
    return [...keys].sort((a, b) => a - b)
}

// Base atoms
export const playersAtom = atomWithStorage<Players>("players", {})
export const syncWithCodeAtom = atomWithStorage<string | null>("syncWithCode", null)

// Derived atoms
export const getPlayerNameAtom = atom((get) => (id: number) => get(playersAtom)[id]?.name || "")

export const setPlayerNameAtom = atom(null, (get, set, { id, name }: { id: number; name: string }) => {
    const players = get(playersAtom)
    if (name.trim() === "") {
        const { [id]: _, ...rest } = players
        set(playersAtom, rest)
    } else {
        set(playersAtom, {
            ...players,
            [id]: {
                ...players[id],
                name,
                gender: players[id]?.gender || "x",
                scores: players[id]?.scores || {},
                active: players[id]?.active
            }
        })
    }
})

export const setPlayerGenderAtom = atom(null, (get, set, { id, gender }: { id: number; gender: Gender }) => {
    const players = get(playersAtom)
    const player = players[id]
    if (player) {
        set(playersAtom, {
            ...players,
            [id]: {
                ...player,
                gender
            }
        })
    }
})

export const getPlayerScoresAtom = atom((get) => (id: number) => get(playersAtom)[id]?.scores || {})

export const getTotalScoreAtom = atom((get) => (id: number) => {
    const player = get(playersAtom)[id]
    return player ? Object.values(player.scores).reduce((total, score) => total + score, 0) : 0
})

export const addScoreForRoundAtom = atom(
    null,
    (get, set, { id, round, score }: { id: number; round: number; score: number }) => {
        const players = get(playersAtom)
        const player = players[id]
        if (player) {
            set(playersAtom, {
                ...players,
                [id]: {
                    ...player,
                    scores: { ...player.scores, [round]: score }
                }
            })
        }
    }
)

/** Max round number (score map key), not count of entries — supports non-sequential keys. */
export const getNumberOfRoundsAtom = atom((get) =>
    maxRoundKeyFromPlayers(activeNamedPlayers(get(playersAtom)))
)

export const getPlayersSortedByScoreAtom = atom((get) => {
    const players = activeNamedPlayers(get(playersAtom))
    const getTotalScore = get(getTotalScoreAtom)

    return Object.entries(players)
        .map(([id, player]) => ({
            id: Number(id),
            player,
            totalScore: getTotalScore(Number(id))
        }))
        .sort((a, b) => b.totalScore - a.totalScore)
})
