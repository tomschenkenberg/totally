"use client"

import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="text-center p-6 text-gray-200">
            <h2>Something went wrong!</h2>
            <Button onClick={() => reset()}>Try again</Button>
        </div>
    )
}
