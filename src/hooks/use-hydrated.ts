import { useSyncExternalStore } from "react"

/**
 * Returns `true` on the client from the first render (no useEffect delay).
 * Server snapshot is `false` so SSR HTML uses initial atom values.
 */
export function useHydrated(): boolean {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    )
}
