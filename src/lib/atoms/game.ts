import { atom } from "jotai"
import { validatedAtomWithStorage } from "./storage"

// Game mode types
export type GameMode = "generic" | "boerenbridge" | "schoppenvrouwen"

// Boerenbridge specific types
export interface BoerenBridgeRound {
    cards: number
    bids: { [playerId: number]: number }
    tricks: { [playerId: number]: number }
}

export interface BoerenBridgeGame {
    playerOrder: number[] // Player IDs in seating order
    dealerIndex: number // Index in playerOrder of current dealer
    currentRoundIndex: number // 0-18 (19 rounds total)
    rounds: BoerenBridgeRound[]
}

// Round structure: 10 → 1 → 10 (19 rounds)
export const BOEREN_BRIDGE_ROUNDS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Schoppenvrouwen specific types
export interface SchoppenvrouwenRound {
    scores: { [playerId: number]: number }
    /** Who ended the round in play (uitgelegd / all cards down). Tie-break when multiple players are 1000+. */
    roundClosedByPlayerId?: number | null
    /**
     * Dealer index (into SchoppenvrouwenGame.playerOrder) for this specific round.
     * Added in schema v1 so historical rounds don't have to be reconstructed from
     * game.dealerIndex - game.currentRoundIndex, which is fragile after edits.
     */
    dealerIndex?: number
}

export interface SchoppenvrouwenGame {
    playerOrder: number[] // Player IDs in seating order
    dealerIndex: number // Index in playerOrder of current dealer
    currentRoundIndex: number
    rounds: SchoppenvrouwenRound[]
    /** Set when a round becomes fully scored; used for tie-break (laatste finisher). */
    lastRoundClosedByPlayerId?: number | null
}

// Constants
export const SCHOPPENVROUWEN_TARGET_SCORE = 1000
export const SCHOPPENVROUWEN_CARDS_PER_PLAYER = 13

// --- Validators ---

function isNumericIdMap(v: unknown): v is { [id: number]: number } {
    if (!v || typeof v !== "object" || Array.isArray(v)) return false
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (!/^-?\d+$/.test(k)) return false
        if (typeof val !== "number" || !Number.isFinite(val)) return false
    }
    return true
}

function isValidGameMode(v: unknown): v is GameMode | null {
    return v === null || v === "generic" || v === "boerenbridge" || v === "schoppenvrouwen"
}

/**
 * Defensive shape check for Boerenbridge — rejects out-of-bounds indexes so
 * subsequent array access in render code can't throw.
 */
export function isValidBoerenBridgeGame(value: unknown): value is BoerenBridgeGame {
    if (value === null) return true
    if (!value || typeof value !== "object") return false
    const g = value as Partial<BoerenBridgeGame>
    if (!Array.isArray(g.playerOrder)) return false
    if (!g.playerOrder.every((id) => typeof id === "number" && Number.isFinite(id))) return false
    if (typeof g.dealerIndex !== "number") return false
    if (g.playerOrder.length > 0 && (g.dealerIndex < 0 || g.dealerIndex >= g.playerOrder.length)) return false
    if (typeof g.currentRoundIndex !== "number") return false
    if (g.currentRoundIndex < 0 || g.currentRoundIndex > BOEREN_BRIDGE_ROUNDS.length) return false
    if (!Array.isArray(g.rounds)) return false
    for (const r of g.rounds) {
        if (!r || typeof r !== "object") return false
        if (typeof r.cards !== "number") return false
        if (!isNumericIdMap(r.bids)) return false
        if (!isNumericIdMap(r.tricks)) return false
    }
    return true
}

// Base atoms
export const gameModeAtom = validatedAtomWithStorage<GameMode | null>(
    "gameMode",
    null,
    isValidGameMode
)

export const boerenBridgeGameAtom = validatedAtomWithStorage<BoerenBridgeGame | null>(
    "boerenBridgeGame",
    null,
    isValidBoerenBridgeGame
)

// Forward-declared validator + migrator live below; we bind them here via a
// thin wrapper so declaration order doesn't matter.
export const schoppenvrouwenGameAtom = validatedAtomWithStorage<SchoppenvrouwenGame | null>(
    "schoppenvrouwenGame",
    null,
    (v): v is SchoppenvrouwenGame | null => isValidSchoppenvrouwenGame(v),
    (v) => migrateSchoppenvrouwenGame(v)
)

// Check if any game is currently active (has progress)
export const hasActiveGameAtom = atom((get) => {
    const boerenBridgeGame = get(boerenBridgeGameAtom)
    const schoppenvrouwenGame = get(schoppenvrouwenGameAtom)
    const gameMode = get(gameModeAtom)
    
    // Check Boerenbridge - active if game exists and has any bids/tricks recorded
    if (boerenBridgeGame) {
        const hasProgress = boerenBridgeGame.rounds.some(
            round => Object.keys(round.bids).length > 0 || Object.keys(round.tricks).length > 0
        )
        if (hasProgress) return { active: true, mode: "boerenbridge" as GameMode }
    }
    
    // Check Schoppenvrouwen - active if game exists and has any scores recorded
    if (schoppenvrouwenGame && Array.isArray(schoppenvrouwenGame.rounds)) {
        const hasProgress = schoppenvrouwenGame.rounds.some(
            round => round?.scores && Object.keys(round.scores).length > 0
        )
        if (hasProgress) return { active: true, mode: "schoppenvrouwen" as GameMode }
    }
    
    // Check generic mode - active if gameMode is generic (scores stored in players atom)
    if (gameMode === "generic") {
        return { active: true, mode: "generic" as GameMode }
    }
    
    return { active: false, mode: null }
})

// Derived atoms

// Get current round's card count
export const getCurrentRoundCardsAtom = atom((get) => {
    const game = get(boerenBridgeGameAtom)
    if (!game) return 0
    return BOEREN_BRIDGE_ROUNDS[game.currentRoundIndex] || 0
})

// Get current dealer player ID
export const getCurrentDealerIdAtom = atom((get) => {
    const game = get(boerenBridgeGameAtom)
    if (!game || game.playerOrder.length === 0) return null
    return game.playerOrder[game.dealerIndex]
})

// Get bidding order (starts with player after dealer)
export const getBiddingOrderAtom = atom((get) => {
    const game = get(boerenBridgeGameAtom)
    if (!game || game.playerOrder.length === 0) return []

    const order = [...game.playerOrder]
    const startIndex = (game.dealerIndex + 1) % order.length

    // Rotate array so first bidder is at index 0
    return [...order.slice(startIndex), ...order.slice(0, startIndex)]
})

// Get current round data
export const getCurrentRoundAtom = atom((get) => {
    const game = get(boerenBridgeGameAtom)
    if (!game) return null
    return game.rounds[game.currentRoundIndex] || null
})

// Get total bids for current round
export const getTotalBidsAtom = atom((get) => {
    const round = get(getCurrentRoundAtom)
    if (!round) return 0
    return Object.values(round.bids).reduce((sum, bid) => sum + bid, 0)
})

// Get forbidden bid for last bidder (to prevent total = cards)
export const getForbiddenBidAtom = atom((get) => {
    const game = get(boerenBridgeGameAtom)
    const round = get(getCurrentRoundAtom)
    const cards = get(getCurrentRoundCardsAtom)
    const biddingOrder = get(getBiddingOrderAtom)

    if (!game || !round || biddingOrder.length === 0) return null

    // Count how many players have bid
    const bidsCount = Object.keys(round.bids).length
    const isLastBidder = bidsCount === biddingOrder.length - 1

    if (!isLastBidder) return null

    // Calculate what bid would make total = cards
    const currentTotal = Object.values(round.bids).reduce((sum, bid) => sum + bid, 0)
    const forbiddenBid = cards - currentTotal

    // Only forbidden if it's a valid bid (0 to cards)
    if (forbiddenBid >= 0 && forbiddenBid <= cards) {
        return forbiddenBid
    }
    return null
})

// Calculate score for a player in a round
export const calculateBoerenBridgeScore = (bid: number, tricks: number): number => {
    return bid === tricks ? 5 + tricks : -Math.abs(bid - tricks)
}

/** All players have bid and sum of bids equals card count — invalid Boerenbridge state. */
export function boerenBridgeBidsSumEqualsCards(
    round: BoerenBridgeRound,
    cards: number,
    playerCount: number
): boolean {
    if (Object.keys(round.bids).length !== playerCount) return false
    const sum = Object.values(round.bids).reduce((s, b) => s + b, 0)
    return sum === cards
}

// Get player's total score across all completed rounds
export const getPlayerBoerenBridgeTotalAtom = atom((get) => (playerId: number) => {
    const game = get(boerenBridgeGameAtom)
    if (!game) return 0

    return game.rounds.reduce((total, round) => {
        const bid = round.bids[playerId]
        const tricks = round.tricks[playerId]
        if (bid !== undefined && tricks !== undefined) {
            return total + calculateBoerenBridgeScore(bid, tricks)
        }
        return total
    }, 0)
})

// Check if current round bidding is complete
export const isBiddingCompleteAtom = atom((get) => {
    const game = get(boerenBridgeGameAtom)
    const round = get(getCurrentRoundAtom)
    if (!game || !round) return false
    return Object.keys(round.bids).length === game.playerOrder.length
})

// Check if current round tricks are complete
export const isTricksCompleteAtom = atom((get) => {
    const game = get(boerenBridgeGameAtom)
    const round = get(getCurrentRoundAtom)
    if (!game || !round) return false
    return Object.keys(round.tricks).length === game.playerOrder.length
})

// Check if game is finished
export const isGameFinishedAtom = atom((get) => {
    const game = get(boerenBridgeGameAtom)
    if (!game) return false
    
    // Game is finished if we're past the last round index
    if (game.currentRoundIndex >= BOEREN_BRIDGE_ROUNDS.length) return true
    
    // Game is also finished if we're on the last round AND all tricks are recorded
    const isLastRound = game.currentRoundIndex === BOEREN_BRIDGE_ROUNDS.length - 1
    if (isLastRound) {
        const currentRound = game.rounds[game.currentRoundIndex]
        if (currentRound) {
            const allTricksRecorded = Object.keys(currentRound.tricks).length === game.playerOrder.length
            if (allTricksRecorded) return true
        }
    }
    
    return false
})

// Actions

// Initialize a new Boerenbridge game
export const initBoerenBridgeGameAtom = atom(
    null,
    (get, set, { playerOrder, dealerIndex }: { playerOrder: number[]; dealerIndex: number }) => {
        const initialRound: BoerenBridgeRound = {
            cards: BOEREN_BRIDGE_ROUNDS[0],
            bids: {},
            tricks: {}
        }

        set(boerenBridgeGameAtom, {
            playerOrder,
            dealerIndex,
            currentRoundIndex: 0,
            rounds: [initialRound]
        })
        set(gameModeAtom, "boerenbridge")
    }
)

// Set a player's bid
export const setBidAtom = atom(null, (get, set, { playerId, bid }: { playerId: number; bid: number }) => {
    const game = get(boerenBridgeGameAtom)
    if (!game) return

    const updatedRounds = [...game.rounds]
    const currentRound = { ...updatedRounds[game.currentRoundIndex] }
    currentRound.bids = { ...currentRound.bids, [playerId]: bid }
    updatedRounds[game.currentRoundIndex] = currentRound

    set(boerenBridgeGameAtom, { ...game, rounds: updatedRounds })
})

// Set a player's tricks
export const setTricksAtom = atom(null, (get, set, { playerId, tricks }: { playerId: number; tricks: number }) => {
    const game = get(boerenBridgeGameAtom)
    if (!game) return

    const updatedRounds = [...game.rounds]
    const currentRound = { ...updatedRounds[game.currentRoundIndex] }
    currentRound.tricks = { ...currentRound.tricks, [playerId]: tricks }
    updatedRounds[game.currentRoundIndex] = currentRound

    set(boerenBridgeGameAtom, { ...game, rounds: updatedRounds })
})

// Clear a player's bid (for editing)
export const clearBidAtom = atom(null, (get, set, { playerId }: { playerId: number }) => {
    const game = get(boerenBridgeGameAtom)
    if (!game) return

    const updatedRounds = [...game.rounds]
    const currentRound = { ...updatedRounds[game.currentRoundIndex] }
    const { [playerId]: _, ...remainingBids } = currentRound.bids
    currentRound.bids = remainingBids
    updatedRounds[game.currentRoundIndex] = currentRound

    set(boerenBridgeGameAtom, { ...game, rounds: updatedRounds })
})

// Set a player's bid for a specific round (for editing historical rounds)
export const setBidForRoundAtom = atom(null, (get, set, { roundIndex, playerId, bid }: { roundIndex: number; playerId: number; bid: number }) => {
    const game = get(boerenBridgeGameAtom)
    if (!game || roundIndex < 0 || roundIndex >= game.rounds.length) return

    const updatedRounds = [...game.rounds]
    const round = { ...updatedRounds[roundIndex] }
    round.bids = { ...round.bids, [playerId]: bid }
    updatedRounds[roundIndex] = round

    set(boerenBridgeGameAtom, { ...game, rounds: updatedRounds })
})

// Set a player's tricks for a specific round (for editing historical rounds)
export const setTricksForRoundAtom = atom(null, (get, set, { roundIndex, playerId, tricks }: { roundIndex: number; playerId: number; tricks: number }) => {
    const game = get(boerenBridgeGameAtom)
    if (!game || roundIndex < 0 || roundIndex >= game.rounds.length) return

    const updatedRounds = [...game.rounds]
    const round = { ...updatedRounds[roundIndex] }
    round.tricks = { ...round.tricks, [playerId]: tricks }
    updatedRounds[roundIndex] = round

    set(boerenBridgeGameAtom, { ...game, rounds: updatedRounds })
})

// Advance to next round
export const advanceToNextRoundAtom = atom(null, (get, set) => {
    const game = get(boerenBridgeGameAtom)
    if (!game) return

    const nextRoundIndex = game.currentRoundIndex + 1
    if (nextRoundIndex >= BOEREN_BRIDGE_ROUNDS.length) return

    // Rotate dealer to next player
    const nextDealerIndex = (game.dealerIndex + 1) % game.playerOrder.length

    // Create new round
    const newRound: BoerenBridgeRound = {
        cards: BOEREN_BRIDGE_ROUNDS[nextRoundIndex],
        bids: {},
        tricks: {}
    }

    set(boerenBridgeGameAtom, {
        ...game,
        dealerIndex: nextDealerIndex,
        currentRoundIndex: nextRoundIndex,
        rounds: [...game.rounds, newRound]
    })
})

// Reset Boerenbridge game
export const resetBoerenBridgeGameAtom = atom(null, (get, set) => {
    set(boerenBridgeGameAtom, null)
    set(gameModeAtom, null)
})

// Update player order
export const setPlayerOrderAtom = atom(null, (get, set, playerOrder: number[]) => {
    const game = get(boerenBridgeGameAtom)
    if (!game) return
    set(boerenBridgeGameAtom, { ...game, playerOrder })
})

// Update dealer index
export const setDealerIndexAtom = atom(null, (get, set, dealerIndex: number) => {
    const game = get(boerenBridgeGameAtom)
    if (!game) return
    set(boerenBridgeGameAtom, { ...game, dealerIndex })
})

// ============================================
// SCHOPPENVROUWEN ATOMS
// ============================================

/**
 * Defensive shape check for values loaded from localStorage — older app versions or
 * corrupted mobile storage may produce something that's technically a JSON object but
 * missing required fields. Used to avoid crashing on `Object.keys(round.scores)` etc.
 *
 * Also bounds-checks `dealerIndex` and `currentRoundIndex` against `playerOrder.length`
 * and `rounds.length`. Accepts `null` (no active game).
 */
export function isValidSchoppenvrouwenGame(value: unknown): value is SchoppenvrouwenGame {
    if (value === null) return true
    if (!value || typeof value !== "object") return false
    const g = value as Partial<SchoppenvrouwenGame>
    if (!Array.isArray(g.playerOrder)) return false
    if (!g.playerOrder.every((id) => typeof id === "number" && Number.isFinite(id))) return false
    if (typeof g.dealerIndex !== "number") return false
    if (g.playerOrder.length > 0 && (g.dealerIndex < 0 || g.dealerIndex >= g.playerOrder.length)) return false
    if (typeof g.currentRoundIndex !== "number" || g.currentRoundIndex < 0) return false
    if (!Array.isArray(g.rounds)) return false
    if (g.currentRoundIndex > g.rounds.length) return false
    for (const r of g.rounds) {
        if (!r || typeof r !== "object") return false
        if (!isNumericIdMap(r.scores)) return false
        if (
            r.dealerIndex !== undefined &&
            (typeof r.dealerIndex !== "number" ||
                (g.playerOrder.length > 0 && (r.dealerIndex < 0 || r.dealerIndex >= g.playerOrder.length)))
        )
            return false
    }
    return true
}

/**
 * Back-fill `dealerIndex` on each round. Before v1 only the game-level dealerIndex
 * existed and historical dealers had to be reconstructed via (game.dealerIndex -
 * (currentRoundIndex - i)) mod N, which is wrong if rounds have been edited or
 * inserted. We save the derived value once so the rest of the app can read it
 * directly.
 */
function migrateSchoppenvrouwenGame(value: unknown): unknown {
    if (value === null || typeof value !== "object") return value
    const g = value as Partial<SchoppenvrouwenGame> & Record<string, unknown>
    if (!Array.isArray(g.playerOrder) || !Array.isArray(g.rounds)) return value
    const n = g.playerOrder.length
    if (n === 0) return value
    if (typeof g.dealerIndex !== "number" || typeof g.currentRoundIndex !== "number") return value

    const needsDealerBackfill = g.rounds.some(
        (r) => r && typeof r === "object" && (r as SchoppenvrouwenRound).dealerIndex === undefined
    )
    if (!needsDealerBackfill) return value

    const initialDealer = ((g.dealerIndex - g.currentRoundIndex) % n + n) % n
    const rounds = g.rounds.map((r, i) => {
        if (!r || typeof r !== "object") return r
        const round = r as SchoppenvrouwenRound
        if (round.dealerIndex !== undefined) return round
        return { ...round, dealerIndex: (initialDealer + i) % n }
    })
    return { ...g, rounds }
}

export function isSchoppenvrouwenRoundFullyScored(round: SchoppenvrouwenRound, playerCount: number): boolean {
    if (!round || !round.scores) return false
    return Object.keys(round.scores).length === playerCount
}

/**
 * Dealer index for a specific round. Prefers the per-round field written since v1,
 * falls back to back-calculation from current game state (legacy games that haven't
 * been written to since migration).
 */
export function getSchoppenvrouwenRoundDealerIndex(game: SchoppenvrouwenGame, roundIndex: number): number {
    const n = game.playerOrder.length
    if (n === 0) return 0
    const round = game.rounds[roundIndex]
    if (round && typeof round.dealerIndex === "number") return round.dealerIndex
    return ((game.dealerIndex - (game.currentRoundIndex - roundIndex)) % n + n) % n
}

/** Last fully scored round index, or -1 */
export function getSchoppenvrouwenLastFullyScoredRoundIndex(game: SchoppenvrouwenGame): number {
    const n = game.playerOrder.length
    for (let i = game.rounds.length - 1; i >= 0; i--) {
        if (isSchoppenvrouwenRoundFullyScored(game.rounds[i], n)) return i
    }
    return -1
}

/**
 * Who closed the finishing round (last round with all scores). Used when multiple players are 1000+:
 * the closer wins, not the highest total. Legacy games only have game.lastRoundClosedByPlayerId on the last round.
 */
export function getSchoppenvrouwenFinishingRoundCloserId(game: SchoppenvrouwenGame): number | null {
    const lastIdx = getSchoppenvrouwenLastFullyScoredRoundIndex(game)
    if (lastIdx < 0) return null
    const round = game.rounds[lastIdx]
    if (round.roundClosedByPlayerId != null) return round.roundClosedByPlayerId
    if (game.lastRoundClosedByPlayerId != null) return game.lastRoundClosedByPlayerId
    return null
}

// Get current dealer player ID for Schoppenvrouwen
export const getSchoppenvrouwenDealerIdAtom = atom((get) => {
    const game = get(schoppenvrouwenGameAtom)
    if (!game || game.playerOrder.length === 0) return null
    return game.playerOrder[game.dealerIndex]
})

// Get current round data for Schoppenvrouwen
export const getSchoppenvrouwenCurrentRoundAtom = atom((get) => {
    const game = get(schoppenvrouwenGameAtom)
    if (!game) return null
    return game.rounds[game.currentRoundIndex] || null
})

// Get player's total score in Schoppenvrouwen (only fully scored rounds — avoids premature win mid-entry)
export const getSchoppenvrouwenPlayerTotalAtom = atom((get) => (playerId: number) => {
    const game = get(schoppenvrouwenGameAtom)
    if (!game) return 0

    const n = game.playerOrder.length
    return game.rounds.reduce((total, round) => {
        if (!isSchoppenvrouwenRoundFullyScored(round, n)) return total
        const score = round.scores[playerId]
        return score !== undefined ? total + score : total
    }, 0)
})

// Check if current round scores are complete
export const isSchoppenvrouwenRoundCompleteAtom = atom((get) => {
    const game = get(schoppenvrouwenGameAtom)
    const round = get(getSchoppenvrouwenCurrentRoundAtom)
    if (!game || !round) return false
    return Object.keys(round.scores).length === game.playerOrder.length
})

// Check if Schoppenvrouwen game is finished (someone reached 1000+)
export const isSchoppenvrouwenFinishedAtom = atom((get) => {
    const game = get(schoppenvrouwenGameAtom)
    if (!game) return false

    const getTotal = get(getSchoppenvrouwenPlayerTotalAtom)
    
    // Check if any player has reached the target score
    return game.playerOrder.some((id) => getTotal(id) >= SCHOPPENVROUWEN_TARGET_SCORE)
})

// Get Schoppenvrouwen winner — multiple players 1000+: who closed the last round wins, not highest score
export const getSchoppenvrouwenWinnerAtom = atom((get) => {
    const game = get(schoppenvrouwenGameAtom)
    const isFinished = get(isSchoppenvrouwenFinishedAtom)
    if (!game || !isFinished) return null

    const getTotal = get(getSchoppenvrouwenPlayerTotalAtom)

    const winners = game.playerOrder.filter((id) => getTotal(id) >= SCHOPPENVROUWEN_TARGET_SCORE)

    if (winners.length === 0) return null
    if (winners.length === 1) return winners[0]

    const closer = getSchoppenvrouwenFinishingRoundCloserId(game)
    if (closer !== null && winners.includes(closer)) {
        return closer
    }

    return winners[0]
})

// Initialize a new Schoppenvrouwen game
export const initSchoppenvrouwenGameAtom = atom(
    null,
    (get, set, { playerOrder, dealerIndex }: { playerOrder: number[]; dealerIndex: number }) => {
        const initialRound: SchoppenvrouwenRound = {
            scores: {},
            dealerIndex
        }

        set(schoppenvrouwenGameAtom, {
            playerOrder,
            dealerIndex,
            currentRoundIndex: 0,
            rounds: [initialRound],
            lastRoundClosedByPlayerId: null
        })
        set(gameModeAtom, "schoppenvrouwen")
    }
)

// Set a player's score for current round in Schoppenvrouwen
export const setSchoppenvrouwenScoreAtom = atom(
    null,
    (get, set, { playerId, score }: { playerId: number; score: number }) => {
        const game = get(schoppenvrouwenGameAtom)
        if (!game) return

        const updatedRounds = [...game.rounds]
        const currentRound = { ...updatedRounds[game.currentRoundIndex] }
        const prevComplete = isSchoppenvrouwenRoundFullyScored(currentRound, game.playerOrder.length)
        currentRound.scores = { ...currentRound.scores, [playerId]: score }
        const nextComplete = isSchoppenvrouwenRoundFullyScored(currentRound, game.playerOrder.length)
        if (nextComplete && !prevComplete) {
            currentRound.roundClosedByPlayerId = playerId
        }
        updatedRounds[game.currentRoundIndex] = currentRound

        let lastRoundClosedByPlayerId = game.lastRoundClosedByPlayerId ?? null
        if (nextComplete && !prevComplete) {
            lastRoundClosedByPlayerId = playerId
        }

        set(schoppenvrouwenGameAtom, { ...game, rounds: updatedRounds, lastRoundClosedByPlayerId })
    }
)

// Set a player's score for a specific round in Schoppenvrouwen (for editing)
export const setSchoppenvrouwenScoreForRoundAtom = atom(
    null,
    (get, set, { roundIndex, playerId, score }: { roundIndex: number; playerId: number; score: number }) => {
        const game = get(schoppenvrouwenGameAtom)
        if (!game || roundIndex < 0 || roundIndex >= game.rounds.length) return

        const updatedRounds = [...game.rounds]
        const round = { ...updatedRounds[roundIndex] }
        const prevComplete = isSchoppenvrouwenRoundFullyScored(round, game.playerOrder.length)
        round.scores = { ...round.scores, [playerId]: score }
        const nextComplete = isSchoppenvrouwenRoundFullyScored(round, game.playerOrder.length)
        if (nextComplete && !prevComplete) {
            round.roundClosedByPlayerId = playerId
        }
        updatedRounds[roundIndex] = round

        let lastRoundClosedByPlayerId = game.lastRoundClosedByPlayerId ?? null
        if (nextComplete && !prevComplete) {
            lastRoundClosedByPlayerId = playerId
        }

        set(schoppenvrouwenGameAtom, { ...game, rounds: updatedRounds, lastRoundClosedByPlayerId })
    }
)

// Who ended the round in play (uitgelegd) — correct if it was not the last person to enter scores
export const setSchoppenvrouwenRoundClosedByForRoundAtom = atom(
    null,
    (get, set, { roundIndex, playerId }: { roundIndex: number; playerId: number }) => {
        const game = get(schoppenvrouwenGameAtom)
        if (!game || roundIndex < 0 || roundIndex >= game.rounds.length) return

        const updatedRounds = [...game.rounds]
        const round = { ...updatedRounds[roundIndex] }
        if (!isSchoppenvrouwenRoundFullyScored(round, game.playerOrder.length)) return

        round.roundClosedByPlayerId = playerId
        updatedRounds[roundIndex] = round

        const lastIdx = getSchoppenvrouwenLastFullyScoredRoundIndex({ ...game, rounds: updatedRounds })
        let lastRoundClosedByPlayerId = game.lastRoundClosedByPlayerId ?? null
        if (roundIndex === lastIdx) {
            lastRoundClosedByPlayerId = playerId
        }

        set(schoppenvrouwenGameAtom, { ...game, rounds: updatedRounds, lastRoundClosedByPlayerId })
    }
)

// Advance to next round in Schoppenvrouwen
export const advanceSchoppenvrouwenRoundAtom = atom(null, (get, set) => {
    const game = get(schoppenvrouwenGameAtom)
    if (!game) return

    // Don't advance if game is finished
    const isFinished = get(isSchoppenvrouwenFinishedAtom)
    if (isFinished) return

    const nextRoundIndex = game.currentRoundIndex + 1

    // Rotate dealer to next player
    const nextDealerIndex = (game.dealerIndex + 1) % game.playerOrder.length

    // Create new round
    const newRound: SchoppenvrouwenRound = {
        scores: {},
        dealerIndex: nextDealerIndex
    }

    set(schoppenvrouwenGameAtom, {
        ...game,
        dealerIndex: nextDealerIndex,
        currentRoundIndex: nextRoundIndex,
        rounds: [...game.rounds, newRound]
    })
})

// Reset Schoppenvrouwen game
export const resetSchoppenvrouwenGameAtom = atom(null, (get, set) => {
    set(schoppenvrouwenGameAtom, null)
    set(gameModeAtom, null)
})

// Update player order for Schoppenvrouwen
export const setSchoppenvrouwenPlayerOrderAtom = atom(null, (get, set, playerOrder: number[]) => {
    const game = get(schoppenvrouwenGameAtom)
    if (!game) return
    set(schoppenvrouwenGameAtom, { ...game, playerOrder })
})

// Update dealer index for Schoppenvrouwen
export const setSchoppenvrouwenDealerIndexAtom = atom(null, (get, set, dealerIndex: number) => {
    const game = get(schoppenvrouwenGameAtom)
    if (!game) return
    set(schoppenvrouwenGameAtom, { ...game, dealerIndex })
})

