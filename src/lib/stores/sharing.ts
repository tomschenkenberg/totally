import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { generate } from "random-words"

function generateUniqueCode(): string {
    return generate({ minLength: 4 }) as unknown as string
}

interface SharingState {
    uniqueAppCode: string
    syncWithCode: string | null
    getUniqueAppCode: () => string
    resetUniqueAppCode: () => void
    setSyncWithCode: (newCode: string | null) => void
    getSyncWithCode: () => string | null
    getTargetCode: () => string
}

export const useSharingStore = create<SharingState>()(
    devtools(
        persist(
            (set, get) => ({
                uniqueAppCode: generateUniqueCode(),
                syncWithCode: null,

                getUniqueAppCode: () => {
                    if (get().uniqueAppCode === "") {
                        set({ uniqueAppCode: generateUniqueCode() })
                    }
                    return get().uniqueAppCode
                },

                resetUniqueAppCode: () => {
                    set({ uniqueAppCode: generateUniqueCode() })
                },

                setSyncWithCode: (newCode) => {
                    console.log("setSyncWithCode", newCode)
                    set({ syncWithCode: newCode })
                },

                getSyncWithCode: () => {
                    return get().syncWithCode
                },

                getTargetCode: () => {
                    return get().syncWithCode || get().uniqueAppCode
                }
            }),
            { name: "sharing-store" }
        )
    )
)
