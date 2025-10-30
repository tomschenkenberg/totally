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
            <Button variant="default" className="w-full text-xl">
                Add scores for round {nextRound}
            </Button>
        </Link>
    )
}
