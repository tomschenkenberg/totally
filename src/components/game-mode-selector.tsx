"use client"

import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useAtomValue, useSetAtom } from "jotai"
import {
    gameModeAtom,
    hasActiveGameAtom,
    resetBoerenBridgeGameAtom,
    resetSchoppenvrouwenGameAtom,
    GameMode
} from "@/lib/atoms/game"
import { useRouter } from "next/navigation"
import { Spade, Calculator, Crown, ChevronRight } from "lucide-react"
import { useState } from "react"

const GAME_MODE_LABELS: Record<GameMode, string> = {
    boerenbridge: "Boerenbridge",
    schoppenvrouwen: "Schoppenvrouwen",
    generic: "Vrije Scorekeeper"
}

export function GameModeSelector() {
    const setGameMode = useSetAtom(gameModeAtom)
    const activeGame = useAtomValue(hasActiveGameAtom)
    const resetBoerenBridge = useSetAtom(resetBoerenBridgeGameAtom)
    const resetSchoppenvrouwen = useSetAtom(resetSchoppenvrouwenGameAtom)
    const router = useRouter()

    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [pendingSelection, setPendingSelection] = useState<GameMode | null>(null)

    const executeSelection = (mode: GameMode) => {
        resetBoerenBridge()
        resetSchoppenvrouwen()
        setGameMode(mode)
        switch (mode) {
            case "boerenbridge":
                router.push("/boerenbridge/setup")
                break
            case "schoppenvrouwen":
                router.push("/schoppenvrouwen/setup")
                break
            case "generic":
                router.push("/players")
                break
        }
    }

    const handleSelectGame = (mode: GameMode) => {
        if (activeGame.active && activeGame.mode !== mode) {
            setPendingSelection(mode)
            setShowConfirmDialog(true)
            return
        }
        executeSelection(mode)
    }

    const handleConfirmSwitch = () => {
        if (pendingSelection) {
            executeSelection(pendingSelection)
        }
        setShowConfirmDialog(false)
        setPendingSelection(null)
    }

    const handleCancelSwitch = () => {
        setShowConfirmDialog(false)
        setPendingSelection(null)
    }

    return (
        <>
            <div className="flex flex-col gap-3">
                <button
                    onClick={() => handleSelectGame("boerenbridge")}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left transition-all active:scale-[0.98] hover:border-emerald-500/50 hover:bg-zinc-900/80"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent" />
                    <div className="relative flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <Spade className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-lg font-semibold text-white">Boerenbridge</div>
                            <div className="text-sm text-zinc-500 mt-0.5">
                                10 → 1 → 10 kaarten, bieden op slagen
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                    </div>
                </button>

                <button
                    onClick={() => handleSelectGame("schoppenvrouwen")}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left transition-all active:scale-[0.98] hover:border-rose-500/50 hover:bg-zinc-900/80"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-rose-500/5 to-transparent" />
                    <div className="relative flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20">
                            <Crown className="h-6 w-6 text-rose-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-lg font-semibold text-white">Schoppenvrouwen</div>
                            <div className="text-sm text-zinc-500 mt-0.5">
                                Eerste tot 1000 punten wint
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-rose-400 transition-colors shrink-0" />
                    </div>
                </button>

                <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-zinc-800" />
                    <span className="text-xs text-zinc-600 uppercase tracking-widest">of</span>
                    <div className="h-px flex-1 bg-zinc-800" />
                </div>

                <button
                    onClick={() => handleSelectGame("generic")}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 text-left transition-all active:scale-[0.98] hover:border-zinc-700 hover:bg-zinc-900/80"
                >
                    <div className="relative flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-zinc-700">
                            <Calculator className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-base font-medium text-zinc-300">Vrije Scorekeeper</div>
                            <div className="text-sm text-zinc-600 mt-0.5">
                                Handmatig scores per ronde
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
                    </div>
                </button>
            </div>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800 max-w-[calc(100vw-2rem)]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white text-xl">
                            Actief spel overschrijven?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400 text-base">
                            Je hebt nog een actief{" "}
                            <span className="font-bold text-white">
                                {activeGame.mode ? GAME_MODE_LABELS[activeGame.mode] : ""}
                            </span>{" "}
                            spel. Als je doorgaat, gaat alle voortgang verloren.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                            onClick={handleCancelSwitch}
                            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                        >
                            Annuleren
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSwitch}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Ja, nieuw spel starten
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
