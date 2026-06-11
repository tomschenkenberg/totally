"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/** Prefetch Next.js routes on mount to avoid RSC fetch latency on navigation. */
export function usePrefetchRoutes(routes: string[]) {
    const router = useRouter()

    useEffect(() => {
        for (const route of routes) {
            router.prefetch(route)
        }
    }, [router, routes])
}
