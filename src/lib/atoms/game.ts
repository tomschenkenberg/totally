import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

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

// Base atoms
export const gameModeAtom = atomWithStorage<GameMode | null>("gameMode", null)

export const boerenBridgeGameAtom = atomWithStorage<BoerenBridgeGame | null>("boerenBridgeGame", null)

export const schoppenvrouwenGameAtom = atomWithStorage<SchoppenvrouwenGame | null>("schoppenvrouwenGame", null)

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
    if (schoppenvrouwenGame) {
        const hasProgress = schoppenvrouwenGame.rounds.some(
            round => Object.keys(round.scores).length > 0
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

export function isSchoppenvrouwenRoundFullyScored(round: SchoppenvrouwenRound, playerCount: number): boolean {
    return Object.keys(round.scores).length === playerCount
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
            scores: {}
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
        scores: {}
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

