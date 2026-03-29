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
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { useSetAtom } from "jotai"
import { playersAtom } from "@/lib/atoms/players"

export function ResetScoresButton() {
    const setPlayers = useSetAtom(playersAtom)

    const handleReset = async () => {
        setPlayers((prevPlayers) => {
            const resetPlayers = Object.fromEntries(
                Object.entries(prevPlayers).map(([id, player]) => [id, { ...player, scores: {} }])
            )
            return resetPlayers
        })
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full h-12 text-lg rounded-xl">
                    Reset Scores
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-zinc-800 max-w-[calc(100vw-2rem)]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Weet je het zeker?</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">Dit kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">Annuleren</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white">Reset</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
