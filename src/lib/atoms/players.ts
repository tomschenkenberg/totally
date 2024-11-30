import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { generate } from "random-words"

// Types
export type Scores = { [round: number]: number }
export interface Player {
    name: string
    scores: Scores
}
export type Players = { [id: number]: Player }

// Base atoms
export const playersAtom = atomWithStorage<Players>("players", {})
export const uniqueAppCodeAtom = atomWithStorage("uniqueAppCode", generate({ minLength: 4 }) as string)
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
                scores: players[id]?.scores || {}
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

export const getNumberOfRoundsAtom = atom((get) => {
    const players = get(playersAtom)
    const playerScores = Object.values(players).map((player) => Object.values(player.scores)?.length)
    return Math.max(0, ...playerScores) || 0
})

export const getPlayersSortedByScoreAtom = atom((get) => {
    const players = get(playersAtom)
    const getTotalScore = get(getTotalScoreAtom)

    return Object.entries(players)
        .map(([id, player]) => ({
            id: Number(id),
            player,
            totalScore: getTotalScore(Number(id))
        }))
        .sort((a, b) => b.totalScore - a.totalScore)
})

// Sharing atoms
export const targetCodeAtom = atom((get) => get(syncWithCodeAtom) || get(uniqueAppCodeAtom))

export const resetUniqueAppCodeAtom = atom(null, (_, set) => {
    set(uniqueAppCodeAtom, generate({ minLength: 4 }) as string)
})

// API integration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callAPI(endpoint: string, method = "GET", body: any = null) {
    const options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" }
    }
    if (body) {
        options.body = JSON.stringify(body)
    }
    try {
        const response = await fetch(`/api/players/${endpoint}`, options)
        if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`)
        }
        return response.json()
    } catch (error) {
        console.error("API call error:", error)
    }
}

// Storage sync atom
export const syncStorageAtom = atom(null, async (get) => {
    const targetCode = get(targetCodeAtom)
    const players = get(playersAtom)

    // Save to server
    await callAPI(`/${targetCode}`, "POST", { players })
})

export const fetchDataFromServerAtom = atom(null, async (get, set) => {
    const targetCode = get(targetCodeAtom)
    try {
        const data = await callAPI(`/${targetCode}`)
        if (data?.players) {
            set(playersAtom, data.players)
        }
    } catch (error) {
        console.error("Failed to fetch data:", error)
    }
})
