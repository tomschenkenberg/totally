"use client"

import { Input } from "@/components/ui/input"
import { Cross1Icon } from "@radix-ui/react-icons"
import { useAtom } from "jotai"
import { playersAtom, Gender } from "@/lib/atoms/players"
import { useCallback } from "react"
import { cn } from "@/lib/utils"

interface PlayerInputProps {
    id: number
    placeholder: string
}

const GenderButton = ({
    selected,
    value,
    label,
    onClick
}: {
    selected: boolean
    value: Gender
    label: string
    onClick: (gender: Gender) => void
}) => (
    <button
        type="button"
        onClick={() => onClick(value)}
        className={cn(
            "px-3 py-1 text-sm font-medium rounded-md transition-colors",
            selected
                ? "bg-emerald-600 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
        )}
    >
        {label}
    </button>
)

const PlayerInput = ({ id, placeholder }: PlayerInputProps) => {
    const [players, setPlayers] = useAtom(playersAtom)
    const playerName = players[id]?.name || ""
    const playerGender = players[id]?.gender || "x"

    const handleNameChange = useCallback(
        (name: string) => {
            setPlayers((prev) => {
                if (name.trim() === "") {
                    const { [id]: _, ...rest } = prev
                    return rest
                }
                return {
                    ...prev,
                    [id]: {
                        ...prev[id],
                        name,
                        gender: prev[id]?.gender || "x",
                        scores: prev[id]?.scores || {}
                    }
                }
            })
        },
        [id, setPlayers]
    )

    const handleGenderChange = useCallback(
        (gender: Gender) => {
            if (!players[id]) return
            setPlayers((prev) => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    gender
                }
            }))
        },
        [id, players, setPlayers]
    )

    const handleClear = useCallback(() => {
        handleNameChange("")
    }, [handleNameChange])

    return (
        <div className="space-y-2">
            <div className="relative">
                <Input
                    className="text-xl font-semibold p-3 font-mono pr-10"
                    id={`player-input-${id}`}
                    placeholder={placeholder}
                    value={playerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                />
                {playerName && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                        <Cross1Icon />
                    </button>
                )}
            </div>
            {playerName && (
                <div className="flex items-center gap-2 pl-1">
                    <span className="text-sm text-gray-400">Geslacht:</span>
                    <div className="flex gap-1">
                        <GenderButton
                            selected={playerGender === "m"}
                            value="m"
                            label="♂ Hij"
                            onClick={handleGenderChange}
                        />
                        <GenderButton
                            selected={playerGender === "v"}
                            value="v"
                            label="♀ Zij"
                            onClick={handleGenderChange}
                        />
                        <GenderButton
                            selected={playerGender === "x"}
                            value="x"
                            label="Neutraal"
                            onClick={handleGenderChange}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default PlayerInput
