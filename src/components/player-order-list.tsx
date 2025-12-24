"use client"

import { useState } from "react"
import { Player } from "@/lib/atoms/players"
import PlayerAvatar from "@/components/avatar"
import { Button } from "@/components/ui/button"
import { GripVertical, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlayerOrderListProps {
    players: { id: number; player: Player }[]
    playerOrder: number[]
    dealerIndex: number
    onOrderChange: (newOrder: number[]) => void
    onDealerChange: (index: number) => void
}

export function PlayerOrderList({
    players,
    playerOrder,
    dealerIndex,
    onOrderChange,
    onDealerChange
}: PlayerOrderListProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

    const orderedPlayers = playerOrder
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is { id: number; player: Player } => p !== undefined)

    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index)
        }
    }

    const handleDragLeave = () => {
        setDragOverIndex(null)
    }

    const handleDrop = (dropIndex: number) => {
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null)
            setDragOverIndex(null)
            return
        }

        const newOrder = [...playerOrder]
        const [removed] = newOrder.splice(draggedIndex, 1)
        newOrder.splice(dropIndex, 0, removed)

        // Adjust dealer index if needed
        let newDealerIndex = dealerIndex
        if (draggedIndex === dealerIndex) {
            newDealerIndex = dropIndex
        } else if (draggedIndex < dealerIndex && dropIndex >= dealerIndex) {
            newDealerIndex = dealerIndex - 1
        } else if (draggedIndex > dealerIndex && dropIndex <= dealerIndex) {
            newDealerIndex = dealerIndex + 1
        }

        onOrderChange(newOrder)
        onDealerChange(newDealerIndex)
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    const moveUp = (index: number) => {
        if (index === 0) return
        const newOrder = [...playerOrder]
        ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]

        let newDealerIndex = dealerIndex
        if (index === dealerIndex) newDealerIndex = index - 1
        else if (index - 1 === dealerIndex) newDealerIndex = index

        onOrderChange(newOrder)
        onDealerChange(newDealerIndex)
    }

    const moveDown = (index: number) => {
        if (index === playerOrder.length - 1) return
        const newOrder = [...playerOrder]
        ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]

        let newDealerIndex = dealerIndex
        if (index === dealerIndex) newDealerIndex = index + 1
        else if (index + 1 === dealerIndex) newDealerIndex = index

        onOrderChange(newOrder)
        onDealerChange(newDealerIndex)
    }

    return (
        <div className="space-y-2">
            {orderedPlayers.map((item, index) => (
                <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                        "flex items-center gap-3 p-3 rounded-lg bg-slate-800 border-2 transition-all cursor-grab active:cursor-grabbing",
                        dealerIndex === index ? "border-amber-500 bg-slate-700" : "border-slate-600",
                        draggedIndex === index && "opacity-50",
                        dragOverIndex === index && "border-emerald-400 border-dashed"
                    )}
                >
                    <GripVertical className="h-5 w-5 text-slate-500" />

                    <div className="flex items-center gap-2 flex-1">
                        <PlayerAvatar player={item.player} />
                        <span className="text-lg font-semibold text-gray-200">{item.player.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-200"
                        >
                            ↑
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveDown(index)}
                            disabled={index === playerOrder.length - 1}
                            className="text-gray-400 hover:text-gray-200"
                        >
                            ↓
                        </Button>
                        <Button
                            variant={dealerIndex === index ? "default" : "outline"}
                            size="sm"
                            onClick={() => onDealerChange(index)}
                            className={cn(
                                dealerIndex === index
                                    ? "bg-amber-600 hover:bg-amber-700"
                                    : "hover:bg-amber-600/20 hover:text-amber-400"
                            )}
                        >
                            <Crown className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}

