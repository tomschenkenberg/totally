const CACHE_KEY = "totally-stand-update-cache"

interface StandUpdateCacheEntry {
    hash: string
    text: string
    updatedAt: number
}

function readCache(): StandUpdateCacheEntry | null {
    if (typeof window === "undefined") return null
    try {
        const raw = window.localStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as StandUpdateCacheEntry
        if (typeof parsed.hash !== "string" || typeof parsed.text !== "string") return null
        return parsed
    } catch {
        return null
    }
}

function writeCache(entry: StandUpdateCacheEntry): void {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
    } catch {
        // quota / private mode
    }
}

/** Stable hash for game state JSON (djb2 — fast, no crypto API needed). */
export function hashGameState(state: unknown): string {
    const str = JSON.stringify(state)
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i)
    }
    return (hash >>> 0).toString(36)
}

export function getCachedStandUpdate(hash: string): string | null {
    const entry = readCache()
    if (!entry || entry.hash !== hash) return null
    return entry.text
}

export function setCachedStandUpdate(hash: string, text: string): void {
    writeCache({ hash, text, updatedAt: Date.now() })
}
