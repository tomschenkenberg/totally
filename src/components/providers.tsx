"use client"

import { Provider } from "jotai"
import { SerwistProvider } from "@serwist/next/react"

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === "development"}>
            <Provider>{children}</Provider>
        </SerwistProvider>
    )
}
