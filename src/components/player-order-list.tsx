"use client"

import { Player } from "@/lib/atoms/players"
import { Button } from "@/components/ui/button"
import { GripVertical, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface PlayerOrderListProps {
    players: { id: number; player: Player }[]
    playerOrder: number[]
    dealerIndex: number
    onOrderChange: (newOrder: number[]) => void
    onDealerChange: (index: number) => void
}

interface RowProps {
    id: number
    player: Player
    index: number
    total: number
    dealerIndex: number
    onDealerChange: (index: number) => void
    onMoveUp: (index: number) => void
    onMoveDown: (index: number) => void
}

function Row({ id, player, index, total, dealerIndex, onDealerChange, onMoveUp, onMoveDown }: RowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
    const isDealer = dealerIndex === index

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border transition-colors",
                isDealer ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800",
                isDragging && "opacity-60 ring-2 ring-emerald-400/40 z-10 relative shadow-xl"
            )}
        >
            <button
                type="button"
                aria-label={`Sleep ${player.name}`}
                className="shrink-0 touch-none p-1 -m-1 text-zinc-500 hover:text-zinc-200 active:text-white cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-base font-semibold text-white truncate">{player.name}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveUp(index)}
                    disabled={index === 0}
                    className="text-zinc-500 hover:text-white h-8 w-8 p-0 rounded-lg"
                    aria-label={`Verplaats ${player.name} omhoog`}
                >
                    ↑
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveDown(index)}
                    disabled={index === total - 1}
                    className="text-zinc-500 hover:text-white h-8 w-8 p-0 rounded-lg"
                    aria-label={`Verplaats ${player.name} omlaag`}
                >
                    ↓
                </Button>
                <Button
                    variant={isDealer ? "default" : "outline"}
                    size="sm"
                    onClick={() => onDealerChange(index)}
                    className={cn(
                        "h-8 w-8 p-0 rounded-lg",
                        isDealer
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "border-zinc-700 hover:bg-amber-600/20 hover:text-amber-400"
                    )}
                    aria-label={isDealer ? `${player.name} is deler` : `Maak ${player.name} deler`}
                    aria-pressed={isDealer}
                >
                    <Crown className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

/**
 * Reorder `dealerIndex` to follow a move of `from → to`. The dealer is a pointer
 * into the *old* order; after the splice we need the same player to stay dealer
 * if they moved, or the index to shift if a neighbor crossed them.
 */
function reindexDealer(dealerIndex: number, from: number, to: number): number {
    if (from === to) return dealerIndex
    if (from === dealerIndex) return to
    if (from < dealerIndex && to >= dealerIndex) return dealerIndex - 1
    if (from > dealerIndex && to <= dealerIndex) return dealerIndex + 1
    return dealerIndex
}

export function PlayerOrderList({
    players,
    playerOrder,
    dealerIndex,
    onOrderChange,
    onDealerChange
}: PlayerOrderListProps) {
    const sensors = useSensors(
        // 5px distance before pointer drag starts so taps on the Crown button don't
        // accidentally kick off a drag on hybrid (trackpad / mouse) devices.
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        // Touch: require a short press so scrolling the page doesn't start a drag.
        useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const orderedPlayers = playerOrder
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is { id: number; player: Player } => p !== undefined)

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const from = playerOrder.indexOf(Number(active.id))
        const to = playerOrder.indexOf(Number(over.id))
        if (from < 0 || to < 0) return
        onOrderChange(arrayMove(playerOrder, from, to))
        onDealerChange(reindexDealer(dealerIndex, from, to))
    }

    const moveUp = (index: number) => {
        if (index === 0) return
        onOrderChange(arrayMove(playerOrder, index, index - 1))
        onDealerChange(reindexDealer(dealerIndex, index, index - 1))
    }

    const moveDown = (index: number) => {
        if (index === playerOrder.length - 1) return
        onOrderChange(arrayMove(playerOrder, index, index + 1))
        onDealerChange(reindexDealer(dealerIndex, index, index + 1))
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={playerOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {orderedPlayers.map((item, index) => (
                        <Row
                            key={item.id}
                            id={item.id}
                            player={item.player}
                            index={index}
                            total={orderedPlayers.length}
                            dealerIndex={dealerIndex}
                            onDealerChange={onDealerChange}
                            onMoveUp={moveUp}
                            onMoveDown={moveDown}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
