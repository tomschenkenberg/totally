"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
    boerenBridgeGameAtom,
    BoerenBridgeGame,
    isValidBoerenBridgeGame,
    resetBoerenBridgeGameAtom,
    schoppenvrouwenGameAtom,
    SchoppenvrouwenGame,
    isValidSchoppenvrouwenGame,
    resetSchoppenvrouwenGameAtom,
    gameModeAtom
} from "@/lib/atoms/game"
import { useHydrated } from "./use-hydrated"

const SETUP_ROUTES = {
    boerenbridge: "/boerenbridge/setup",
    schoppenvrouwen: "/schoppenvrouwen/setup"
} as const

interface ValidGame<M extends "boerenbridge" | "schoppenvrouwen"> {
    hydrated: boolean
    game: (M extends "boerenbridge" ? BoerenBridgeGame : SchoppenvrouwenGame) | null
}

/**
 * Gate-keeper hook: waits for hydration, reads the game atom, redirects to
 * `<mode>/setup` and wipes storage if the value is missing or fails shape
 * validation. Callers should render a loading state until `hydrated && game`
 * is truthy.
 *
 * This deduplicates the 3-phase "is hydrated? is it there? is it valid?"
 * dance that was copy-pasted across six pages, and it's now the single place
 * that owns the "bad state → hard reset" policy.
 */
export function useValidGame<M extends "boerenbridge" | "schoppenvrouwen">(mode: M): ValidGame<M> {
    const router = useRouter()
    const hydrated = useHydrated()
    const bbGame = useAtomValue(boerenBridgeGameAtom)
    const svGame = useAtomValue(schoppenvrouwenGameAtom)
    const gameMode = useAtomValue(gameModeAtom)
    const resetBB = useSetAtom(resetBoerenBridgeGameAtom)
    const resetSV = useSetAtom(resetSchoppenvrouwenGameAtom)

    const game = mode === "boerenbridge" ? bbGame : svGame
    const isValid =
        mode === "boerenbridge" ? isValidBoerenBridgeGame(game) : isValidSchoppenvrouwenGame(game)
    const reset = mode === "boerenbridge" ? resetBB : resetSV
    const setupRoute = SETUP_ROUTES[mode]

    useEffect(() => {
        if (!hydrated) return
        // If the active mode isn't this page's mode, the user either never
        // picked this mode or just switched/reset out of it — send them to the
        // home chooser instead of forcing them through this mode's setup.
        // This also avoids racing with a concurrent router.push("/") from
        // "Nieuw Spel" / "Spel Wisselen" in the main menu.
        if (gameMode !== mode) {
            router.replace("/")
            return
        }
        if (!game) {
            router.replace(setupRoute)
            return
        }
        if (!isValid) {
            if (process.env.NODE_ENV !== "production") {
                // eslint-disable-next-line no-console
                console.warn(`Invalid ${mode} game shape in memory — resetting`, game)
            }
            reset()
            router.replace(setupRoute)
        }
    }, [hydrated, game, isValid, reset, router, setupRoute, mode, gameMode])

    return {
        hydrated,
        game: (isValid ? game : null) as ValidGame<M>["game"]
    }
}
