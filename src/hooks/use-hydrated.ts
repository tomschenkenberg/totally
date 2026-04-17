import { useEffect, useState } from "react"

/**
 * Returns `true` after the component has mounted on the client.
 *
 * `atomWithStorage` returns the initial value during the first render on the
 * client so SSR and the first hydration render match. Anything that reads
 * persisted state must wait for this flag before rendering user-specific UI or
 * issuing redirects, otherwise you'll flicker a setup page for a frame.
 */
export function useHydrated(): boolean {
    const [hydrated, setHydrated] = useState(false)
    useEffect(() => {
        setHydrated(true)
    }, [])
    return hydrated
}
