"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Spade, Calculator, Crown } from "lucide-react"
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
        // Reset any existing games
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
        // If there's an active game in a DIFFERENT mode, show confirmation
        if (activeGame.active && activeGame.mode !== mode) {
            setPendingSelection(mode)
            setShowConfirmDialog(true)
            return
        }

        // No active game or same mode - proceed directly
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
            <div className="flex flex-col gap-6">
                {/* Card Games Section */}
                <Card
                    className="cursor-pointer border-2 border-slate-600 bg-slate-800 hover:border-emerald-500 hover:bg-slate-700 transition-all"
                    onClick={() => handleSelectGame("boerenbridge")}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                <Spade className="h-6 w-6 text-emerald-400" />
                            </div>
                            <CardTitle className="text-2xl text-gray-100">Boerenbridge</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-gray-400 text-base">
                            10 → 1 → 10 kaarten, bieden op slagen, bonus voor juiste voorspelling
                        </CardDescription>
                        <Button variant="default" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
                            Start Boerenbridge
                        </Button>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer border-2 border-slate-600 bg-slate-800 hover:border-rose-500 hover:bg-slate-700 transition-all"
                    onClick={() => handleSelectGame("schoppenvrouwen")}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-500/20">
                                <Crown className="h-6 w-6 text-rose-400" />
                            </div>
                            <CardTitle className="text-2xl text-gray-100">Schoppenvrouwen</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-gray-400 text-base">
                            Eerste tot 1000 punten wint. 13 kaarten per speler uit 2 decks.
                        </CardDescription>
                        <Button variant="default" className="w-full mt-4 bg-rose-600 hover:bg-rose-700">
                            Start Schoppenvrouwen
                        </Button>
                    </CardContent>
                </Card>

                {/* Separator */}
                <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-slate-600" />
                    <span className="text-sm text-slate-500 uppercase tracking-wider">of gebruik</span>
                    <div className="h-px flex-1 bg-slate-600" />
                </div>

                {/* Generic Scorekeeper - Less prominent */}
                <Card
                    className="cursor-pointer border border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-700/50 transition-all"
                    onClick={() => handleSelectGame("generic")}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-600/50">
                                <Calculator className="h-5 w-5 text-slate-400" />
                            </div>
                            <CardTitle className="text-lg text-gray-300">Vrije Scorekeeper</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-gray-500 text-sm">
                            Algemene scorekeeper voor elk spel - voer handmatig scores in per ronde
                        </CardDescription>
                        <Button
                            variant="outline"
                            className="w-full mt-3 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                            Start Vrije Scorekeeper
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="bg-slate-800 border-slate-600">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white text-xl">
                            Actief spel overschrijven?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300 text-base">
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
                            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
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
