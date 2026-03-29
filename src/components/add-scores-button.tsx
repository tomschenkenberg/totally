"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAtomValue } from "jotai"
import { getNumberOfRoundsAtom } from "@/lib/atoms/players"

export const AddNewScoresButton = () => {
    const numberOfRounds = useAtomValue(getNumberOfRoundsAtom)
    const nextRound = numberOfRounds + 1

    return (
        <Link href={`/round/${nextRound}`} prefetch={true}>
            <Button variant="default" className="w-full text-lg h-12 rounded-xl">
                Scores voor ronde {nextRound}
            </Button>
        </Link>
    )
}
