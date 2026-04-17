import { atomWithStorage, createJSONStorage } from "jotai/utils"

/**
 * `atomWithStorage` wrapped with a validator + optional migrator. If the stored value
 * is unparseable, fails validation, or throws during migration, the atom silently
 * falls back to `initial` instead of crashing during render (which is what happens
 * if, say, `Object.keys(round.scores)` runs on an undefined `round.scores`).
 *
 * When migration produces a new shape, it is persisted back to storage so subsequent
 * reads are clean and the cost of migration is paid once.
 */
export function validatedAtomWithStorage<T>(
    key: string,
    initial: T,
    validate: (value: unknown) => value is T,
    migrate?: (value: unknown) => unknown
) {
    const storage = createJSONStorage<T>(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage)
    )

    storage.getItem = (storageKey, initialValue) => {
        if (typeof window === "undefined") return initialValue
        try {
            const raw = window.localStorage.getItem(storageKey)
            if (raw === null) return initialValue
            const parsed = JSON.parse(raw)
            const migrated = migrate ? migrate(parsed) : parsed
            if (!validate(migrated)) {
                if (process.env.NODE_ENV !== "production") {
                    // eslint-disable-next-line no-console
                    console.warn(
                        `[storage] value at "${storageKey}" failed validation; falling back to initial`,
                        parsed
                    )
                }
                return initialValue
            }
            if (migrated !== parsed) {
                try {
                    window.localStorage.setItem(storageKey, JSON.stringify(migrated))
                } catch {
                    // ignore: private-mode / quota
                }
            }
            return migrated as T
        } catch (err) {
            if (process.env.NODE_ENV !== "production") {
                // eslint-disable-next-line no-console
                console.warn(`[storage] failed to read "${storageKey}"; falling back to initial`, err)
            }
            return initialValue
        }
    }

    return atomWithStorage<T>(key, initial, storage, { getOnInit: true })
}
