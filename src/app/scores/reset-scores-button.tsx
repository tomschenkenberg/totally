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
            // Create new object with same players but empty scores
            const resetPlayers = Object.fromEntries(
                Object.entries(prevPlayers).map(([id, player]) => [id, { ...player, scores: {} }])
            )
            return resetPlayers
        })
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">Reset Scores</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
