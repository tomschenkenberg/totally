import { Input } from "@/components/ui/input"
import { Cross1Icon } from "@radix-ui/react-icons"
import { useAtom } from "jotai"
import { playersAtom } from "@/lib/atoms/players"
import { useCallback } from "react"

interface PlayerInputProps {
    id: number
    placeholder: string
}

const PlayerInput = ({ id, placeholder }: PlayerInputProps) => {
    const [players, setPlayers] = useAtom(playersAtom)
    const playerName = players[id]?.name || ""

    const handleNameChange = useCallback(
        async (name: string) => {
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
                        scores: prev[id]?.scores || {}
                    }
                }
            })
        },
        [id, setPlayers]
    )

    const handleClear = useCallback(() => {
        handleNameChange("")
    }, [handleNameChange])

    return (
        <div className="relative space-y-2 text-base">
            <Input
                className="text-xl font-semibold p-3 font-mono"
                id={`player-input-${id}`}
                placeholder={placeholder}
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
            />
            {playerName && (
                <button onClick={handleClear} className="absolute right-0 top-1 mt-2 mr-2">
                    <Cross1Icon />
                </button>
            )}
        </div>
    )
}

export default PlayerInput
