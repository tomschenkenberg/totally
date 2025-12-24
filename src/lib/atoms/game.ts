import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

// Game mode types
export type GameMode = "generic" | "boerenbridge"

// Boeren Bridge specific types
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

// Base atoms
export const gameModeAtom = atomWithStorage<GameMode | null>("gameMode", null)

export const boerenBridgeGameAtom = atomWithStorage<BoerenBridgeGame | null>("boerenBridgeGame", null)

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
    return game.currentRoundIndex >= BOEREN_BRIDGE_ROUNDS.length
})

// Actions

// Initialize a new Boeren Bridge game
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

// Reset Boeren Bridge game
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

