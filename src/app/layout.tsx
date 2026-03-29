import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { Providers } from "@/components/providers"
import { MainMenu } from "@/components/main-menu"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    manifest: "/manifest.json",
    title: "Totally",
    description: "Totally Card Scoreboard"
}

export const viewport: Viewport = {
    themeColor: "#09090b",
    initialScale: 1,
    width: "device-width",
    height: "device-height",
    viewportFit: "cover"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <head />
            <body className={`min-h-dvh flex flex-col ${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
                <Providers>
                    <MainMenu />
                    <main className="mx-auto w-full max-w-lg grow px-4 py-5 space-y-5">
                        {children}
                    </main>
                    <div className="h-6 shrink-0" />
                </Providers>
            </body>
        </html>
    )
}
