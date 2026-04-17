"use client"

import { useAtom } from "jotai"
import { Cross1Icon } from "@radix-ui/react-icons"
import { Trash2 } from "lucide-react"
import { useCallback, useMemo } from "react"
import { playersAtom, Gender, Player, isPlayerActive, nextPlayerId } from "@/lib/atoms/players"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
            "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            selected
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 active:bg-zinc-600"
        )}
    >
        {label}
    </button>
)

function RosterRow({ id, player }: { id: number; player: Player }) {
    const [, setPlayers] = useAtom(playersAtom)
    const active = isPlayerActive(player)

    const update = useCallback(
        (patch: Partial<Player>) => {
            setPlayers((prev) => {
                const cur = prev[id]
                if (!cur) return prev
                return { ...prev, [id]: { ...cur, ...patch } }
            })
        },
        [id, setPlayers]
    )

    const handleNameChange = useCallback(
        (name: string) => {
            setPlayers((prev) => {
                if (name.trim() === "") {
                    const { [id]: _, ...rest } = prev
                    return rest
                }
                const cur = prev[id]
                return {
                    ...prev,
                    [id]: {
                        name,
                        gender: cur?.gender || "x",
                        scores: cur?.scores || {},
                        active: cur?.active
                    }
                }
            })
        },
        [id, setPlayers]
    )

    const handleToggleActive = useCallback(
        (checked: boolean) => {
            update({ active: checked })
        },
        [update]
    )

    const handleGenderChange = useCallback(
        (gender: Gender) => {
            update({ gender })
        },
        [update]
    )

    const handleRemove = useCallback(() => {
        setPlayers((prev) => {
            const { [id]: _, ...rest } = prev
            return rest
        })
    }, [id, setPlayers])

    return (
        <div
            className={cn(
                "rounded-xl border p-3 space-y-2 transition-colors",
                active ? "border-zinc-800 bg-zinc-900" : "border-zinc-800/60 bg-zinc-950/80 opacity-80"
            )}
        >
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0 w-14">
                    <Switch
                        checked={active}
                        onCheckedChange={handleToggleActive}
                        className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-zinc-700"
                    />
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">
                        {active ? "Aan" : "Uit"}
                    </span>
                </div>
                <div className="relative flex-1 min-w-0">
                    <Input
                        className={cn(
                            "text-lg font-semibold p-3 h-12 font-mono bg-zinc-900 border-zinc-800 rounded-xl focus:border-zinc-600",
                            player.name ? "pr-10" : "pr-3"
                        )}
                        id={`player-roster-${id}`}
                        placeholder="Naam"
                        value={player.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        autoComplete="off"
                        autoCapitalize="words"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="done"
                    />
                    {player.name ? (
                        <button
                            type="button"
                            onClick={() => handleNameChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 p-1"
                            aria-label="Wis naam"
                        >
                            <Cross1Icon />
                        </button>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={handleRemove}
                    className="shrink-0 p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800"
                    aria-label="Verwijder uit lijst"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>
            {player.name ? (
                <div className="flex items-center gap-2 pl-1 pt-1">
                    <span className="text-xs text-zinc-500">Geslacht:</span>
                    <div className="flex gap-1 flex-wrap">
                        <GenderButton
                            selected={player.gender === "m"}
                            value="m"
                            label="♂ Hij"
                            onClick={handleGenderChange}
                        />
                        <GenderButton
                            selected={player.gender === "v"}
                            value="v"
                            label="♀ Zij"
                            onClick={handleGenderChange}
                        />
                        <GenderButton
                            selected={player.gender === "x"}
                            value="x"
                            label="Neutraal"
                            onClick={handleGenderChange}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export function PlayersRoster() {
    const [players, setPlayers] = useAtom(playersAtom)

    const sortedIds = useMemo(() => {
        return Object.keys(players)
            .map(Number)
            .sort((a, b) => a - b)
    }, [players])

    const handleAdd = useCallback(() => {
        const id = nextPlayerId(players)
        setPlayers((prev) => ({
            ...prev,
            [id]: { name: "", gender: "x", scores: {}, active: true }
        }))
    }, [players, setPlayers])

    return (
        <div className="space-y-4">
            <p className="text-sm text-zinc-500">
                Voeg iedereen uit je vaste groep toe. Zet alleen wie meespeelt op <span className="text-zinc-400">Aan</span>.
            </p>
            <div className="space-y-3">
                {sortedIds.map((id) => {
                    const p = players[id]
                    if (!p) return null
                    return <RosterRow key={id} id={id} player={p} />
                })}
            </div>
            <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={handleAdd}
            >
                Speler toevoegen
            </Button>
        </div>
    )
}
