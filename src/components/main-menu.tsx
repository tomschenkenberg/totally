"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAtomValue, useSetAtom } from "jotai"
import { gameModeAtom, resetBoerenBridgeGameAtom } from "@/lib/atoms/game"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
    SheetTitle,
    SheetHeader,
    SheetDescription
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const NavButton = ({
    label,
    className,
    href,
    matchPaths,
    onClick
}: {
    label: string
    className?: string
    href: string
    matchPaths?: string[]
    onClick?: () => void
}) => {
    const pathname = usePathname()
    const isActive =
        pathname === href ||
        (href === "/" && pathname === "/") ||
        matchPaths?.some((p) => pathname.startsWith(p))

    const variant = isActive ? "secondary" : "ghost"

    const Content = (
        <Button
            variant={variant}
            className={cn("w-full justify-start text-lg font-normal", className)}
            onClick={onClick}
        >
            {label}
        </Button>
    )

    if (onClick) {
        return (
            <SheetClose asChild>
                {Content}
            </SheetClose>
        )
    }

    return (
        <SheetClose asChild>
            <Link href={href} prefetch={true} className="w-full">
                {Content}
            </Link>
        </SheetClose>
    )
}

export function MainMenu() {
    const gameMode = useAtomValue(gameModeAtom)
    const setGameMode = useSetAtom(gameModeAtom)
    const resetGame = useSetAtom(resetBoerenBridgeGameAtom)
    const router = useRouter()

    const handleNewGame = () => {
        resetGame()
        router.push("/")
    }

    const handleSwitchGame = () => {
        resetGame()
        setGameMode(null)
        router.push("/")
    }

    const menuContent = gameMode === "boerenbridge" ? (
        <>
            <NavButton
                label="Scorebord"
                href="/boerenbridge"
                matchPaths={["/boerenbridge"]}
            />
            <NavButton label="Spelers" href="/players" />
            <NavButton 
                label="Nieuw Spel" 
                href="/"
                onClick={handleNewGame}
            />
            <NavButton 
                label="Spel Wisselen" 
                href="/"
                onClick={handleSwitchGame}
            />
        </>
    ) : (
        <>
            <NavButton label="Scoreboard" href="/" />
            <NavButton label="Scores" href="/scores" />
            <NavButton label="Players" href="/players" />
            <NavButton 
                label="Spel Wisselen" 
                href="/"
                onClick={handleSwitchGame}
            />
        </>
    )

    return (
        <div className="flex items-center px-4">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-200 hover:text-white hover:bg-slate-700">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                        <SheetTitle className="text-left">Menu</SheetTitle>
                        <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-2 mt-4">
                        {menuContent}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
