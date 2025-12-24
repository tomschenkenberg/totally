"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSetAtom } from "jotai"
import { gameModeAtom } from "@/lib/atoms/game"
import { useRouter } from "next/navigation"
import { Spade, Calculator } from "lucide-react"

export function GameModeSelector() {
    const setGameMode = useSetAtom(gameModeAtom)
    const router = useRouter()

    const selectGeneric = () => {
        setGameMode("generic")
        router.push("/players")
    }

    const selectBoerenBridge = () => {
        setGameMode("boerenbridge")
        router.push("/boerenbridge/setup")
    }

    return (
        <div className="flex flex-col gap-6">
            <Card
                className="cursor-pointer border-2 border-slate-600 bg-slate-800 hover:border-emerald-500 hover:bg-slate-700 transition-all"
                onClick={selectBoerenBridge}
            >
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Spade className="h-6 w-6 text-emerald-400" />
                        </div>
                        <CardTitle className="text-2xl text-gray-100">Boeren Bridge</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <CardDescription className="text-gray-400 text-base">
                        10 → 1 → 10 kaarten, bieden op slagen, bonus voor juiste voorspelling
                    </CardDescription>
                    <Button variant="default" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
                        Start Boeren Bridge
                    </Button>
                </CardContent>
            </Card>

            <Card
                className="cursor-pointer border-2 border-slate-600 bg-slate-800 hover:border-blue-500 hover:bg-slate-700 transition-all"
                onClick={selectGeneric}
            >
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Calculator className="h-6 w-6 text-blue-400" />
                        </div>
                        <CardTitle className="text-2xl text-gray-100">Vrije Scorekeeper</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <CardDescription className="text-gray-400 text-base">
                        Algemene scorekeeper voor elk spel - voer handmatig scores in per ronde
                    </CardDescription>
                    <Button variant="default" className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                        Start Vrije Scorekeeper
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

