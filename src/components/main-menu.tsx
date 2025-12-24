"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { useAtomValue, useSetAtom } from "jotai"
import { gameModeAtom, resetBoerenBridgeGameAtom } from "@/lib/atoms/game"

const common =
    "relative inline-flex items-center bg-slate-700 px-3 py-2 text-xl font-semibold text-gray-200 ring-1 ring-inset ring-slate-600 hover:bg-slate-600 focus:z-10 transition-colors"

const NavButton = ({
    label,
    className,
    href,
    matchPaths,
    onClick
}: {
    label: string
    className: string
    href: string
    matchPaths?: string[]
    onClick?: () => void
}) => {
    const pathname = usePathname()
    const isActive =
        pathname === href ||
        (href === "/" && pathname === "/") ||
        matchPaths?.some((p) => pathname.startsWith(p))

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={cn(common, className, isActive && "bg-slate-600 ring-slate-500")}
            >
                {label}
            </button>
        )
    }

    return (
        <Link href={href} prefetch={true}>
            <button
                type="button"
                className={cn(common, className, isActive && "bg-slate-600 ring-slate-500")}
            >
                {label}
            </button>
        </Link>
    )
}

export function MainMenu() {
    const gameMode = useAtomValue(gameModeAtom)
    const resetGame = useSetAtom(resetBoerenBridgeGameAtom)
    const router = useRouter()

    const handleNewGame = () => {
        resetGame()
        router.push("/")
    }

    if (gameMode === "boerenbridge") {
        return (
            <div className="flex justify-center">
                <nav className="isolate inline-flex rounded-md shadow-sm flex-wrap">
                    <NavButton
                        label="Scorebord"
                        className="rounded-l-md"
                        href="/boerenbridge"
                        matchPaths={["/boerenbridge"]}
                    />
                    <NavButton label="Spelers" className="-ml-px" href="/players" />
                    <NavButton 
                        label="Nieuw Spel" 
                        className="-ml-px rounded-r-md" 
                        href="/"
                        onClick={handleNewGame}
                    />
                </nav>
            </div>
        )
    }

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

