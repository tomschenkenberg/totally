import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    manifest: "/manifest.json",
    title: "Totally",
    description: "Totally Card Scoreboard"
}

export const viewport: Viewport = {
    themeColor: "#1E293B",
    initialScale: 1,
    width: "device-width",
    height: "device-height"
}

function MainMenu() {
    const common =
        "relative inline-flex items-center bg-slate-700 px-3 py-2 text-xl font-semibold text-gray-200 ring-1 ring-inset ring-slate-600 hover:bg-slate-600 focus:z-10"
    const NavButton = ({ label, className, href }: { label: string; className: string; href: string }) => (
        <Link href={href}>
            <button type="button" className={cn(common, className)}>
                {label}
            </button>
        </Link>
    )

    return (
        <div className="flex justify-center">
            <nav className="isolate inline-flex rounded-md shadow-sm flex-wrap">
                <NavButton label="Scoreboard" className="rounded-l-md" href="/" />
                <NavButton label="Scores" className="-ml-px" href="/scores" />
                <NavButton label="Players" className="-ml-px rounded-r-md" href="/players" />
            </nav>
        </div>
    )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <head />
            <body className={`min-h-screen flex flex-col ${inter.className} bg-slate-800 text-gray-200`}>
                <Providers>
                    <header className=" bg-slate-800 py-4">
                        <MainMenu />
                    </header>
                    <main className="mx-auto w-full flex-grow bg-slate-700 p-6 space-y-6 sm:max-w-[350px] lg:max-w-[700px] xl:max-w-[1000px] ">
                        {children}
                    </main>
                    <Footer />
                </Providers>
            </body>
        </html>
    )
}
