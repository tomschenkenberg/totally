"use client"

import { Input } from "@/components/ui/input"
import { Cross1Icon } from "@radix-ui/react-icons"
import { useState } from "react"
import { Button } from "./ui/button"
import { useAtom, useAtomValue } from "jotai"
import { syncWithCodeAtom, uniqueAppCodeAtom, fetchDataFromServerAtom } from "@/lib/atoms/players"

const SyncCodeInput = () => {
    const currentSyncCode = useAtomValue(syncWithCodeAtom)
    const ownAppCode = useAtomValue(uniqueAppCodeAtom)
    const [, setSyncCode] = useAtom(syncWithCodeAtom)
    const [, fetchDataFromServer] = useAtom(fetchDataFromServerAtom)

    const [inputValue, setInputValue] = useState(currentSyncCode || "")

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)
        if (value === ownAppCode) {
            setSyncCode(null)
            return
        }
        if (value.length === 0 || value.length >= 4) {
            setSyncCode(value || null)
        }
    }

    const handleClear = () => {
        setSyncCode(null)
        setInputValue("")
    }

    return (
        <div className="relative space-y-2 text-base">
            <Input
                className="text-xl font-semibold p-3 font-mono"
                id="sync-code"
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e)}
                required
            />
            {currentSyncCode && (
                <button onClick={handleClear} className="absolute right-0 top-1 mt-2 mr-2">
                    <Cross1Icon />
                </button>
            )}
            {inputValue === ownAppCode && (
                <p className="text-white p-1 border-red-500 border-1 border rounded ">
                    Code cannot be the same as your own app code.
                </p>
            )}
            {inputValue.length > 0 && inputValue.length < 4 && (
                <p className="text-white p-1 border-orange-400 border-1 border rounded ">
                    Code must be at least 4 characters.
                </p>
            )}
            {currentSyncCode && inputValue.length >= 4 && (
                <Button variant="default" className="w-full text-xl" onClick={() => fetchDataFromServer()}>
                    Sync
                </Button>
            )}
            {currentSyncCode && inputValue.length >= 4 && (
                <Button variant="default" className="w-full text-xl" onClick={handleClear}>
                    Stop syncing
                </Button>
            )}
        </div>
    )
}

export default SyncCodeInput
