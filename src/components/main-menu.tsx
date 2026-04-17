"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAtomValue, useSetAtom } from "jotai"
import {
    gameModeAtom,
    resetBoerenBridgeGameAtom,
    resetSchoppenvrouwenGameAtom,
    hasActiveGameAtom,
    GameMode
} from "@/lib/atoms/game"
import { Menu, Spade, Crown, Calculator } from "lucide-react"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useHydrated } from "@/hooks/use-hydrated"

const GAME_MODE_LABELS: Record<GameMode, string> = {
    boerenbridge: "Boerenbridge",
    schoppenvrouwen: "Schoppenvrouwen",
    generic: "Vrije Scorekeeper"
}

const GAME_MODE_ICONS: Record<GameMode, React.ReactNode> = {
    boerenbridge: <Spade className="h-4 w-4 text-emerald-400" />,
    schoppenvrouwen: <Crown className="h-4 w-4 text-rose-400" />,
    generic: <Calculator className="h-4 w-4 text-zinc-400" />
}

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

    const Content = (
        <Button
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start text-base font-normal h-12 rounded-xl",
                isActive && "bg-zinc-800 text-white font-medium",
                className
            )}
            onClick={onClick}
        >
            {label}
        </Button>
    )

    if (onClick) {
        return <SheetClose asChild>{Content}</SheetClose>
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
    const hydrated = useHydrated()
    const storedGameMode = useAtomValue(gameModeAtom)
    // Treat gameMode as null until hydration completes so SSR and the first
    // client render agree. Otherwise localStorage-backed state produces a
    // hydration mismatch in the header badge + menu contents.
    const gameMode = hydrated ? storedGameMode : null
    const activeGame = useAtomValue(hasActiveGameAtom)
    const setGameMode = useSetAtom(gameModeAtom)
    const resetBoerenBridge = useSetAtom(resetBoerenBridgeGameAtom)
    const resetSchoppenvrouwen = useSetAtom(resetSchoppenvrouwenGameAtom)
    const router = useRouter()

    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [pendingAction, setPendingAction] = useState<"new" | "switch" | null>(null)

    const executeReset = () => {
        resetBoerenBridge()
        resetSchoppenvrouwen()
        setGameMode(null)
        router.push("/")
    }

    const handleNewGame = () => {
        if (activeGame.active) {
            setPendingAction("new")
            setShowConfirmDialog(true)
            return
        }
        executeReset()
    }

    const handleSwitchGame = () => {
        if (activeGame.active) {
            setPendingAction("switch")
            setShowConfirmDialog(true)
            return
        }
        executeReset()
    }

    const handleConfirm = () => {
        executeReset()
        setShowConfirmDialog(false)
        setPendingAction(null)
    }

    const handleCancel = () => {
        setShowConfirmDialog(false)
        setPendingAction(null)
    }

    const boerenBridgeMenu = (
        <>
            <NavButton
                label="Scorebord"
                href="/boerenbridge"
                matchPaths={["/boerenbridge"]}
            />
            <NavButton label="Spelers" href="/players" />
            <div className="h-px bg-zinc-800 my-1" />
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
    )

    const schoppenvrouwenMenu = (
        <>
            <NavButton
                label="Scorebord"
                href="/schoppenvrouwen"
                matchPaths={["/schoppenvrouwen"]}
            />
            <NavButton label="Spelers" href="/players" />
            <div className="h-px bg-zinc-800 my-1" />
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
    )

    const genericMenu = (
        <>
            <NavButton label="Scoreboard" href="/" />
            <NavButton label="Scores" href="/scores" />
            <NavButton label="Players" href="/players" />
            <div className="h-px bg-zinc-800 my-1" />
            <NavButton
                label="Spel Wisselen"
                href="/"
                onClick={handleSwitchGame}
            />
        </>
    )

    const menuContent =
        gameMode === "boerenbridge"
            ? boerenBridgeMenu
            : gameMode === "schoppenvrouwen"
              ? schoppenvrouwenMenu
              : genericMenu

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
                <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] bg-zinc-950 border-zinc-800">
                            <SheetHeader>
                                <SheetTitle className="text-left text-lg font-bold text-white">Totally</SheetTitle>
                                <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
                            </SheetHeader>
                            <div className="flex flex-col gap-1 mt-6 px-1">
                                {menuContent}
                            </div>
                        </SheetContent>
                    </Sheet>

                    <span className="text-lg font-bold tracking-tight text-white">
                        Totally
                    </span>

                    {gameMode ? (
                        <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 border border-zinc-800">
                            {GAME_MODE_ICONS[gameMode]}
                            <span className="text-xs font-medium text-zinc-400">
                                {GAME_MODE_LABELS[gameMode].slice(0, 6)}
                            </span>
                        </div>
                    ) : (
                        <div className="w-10" />
                    )}
                </div>
            </header>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800 max-w-[calc(100vw-2rem)]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white text-xl">
                            {pendingAction === "new" ? "Nieuw spel starten?" : "Spel wisselen?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400 text-base">
                            Je hebt nog een actief{" "}
                            <span className="font-bold text-white">
                                {activeGame.mode ? GAME_MODE_LABELS[activeGame.mode] : ""}
                            </span>{" "}
                            spel. Als je doorgaat, gaat alle voortgang verloren.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                            onClick={handleCancel}
                            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                        >
                            Annuleren
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {pendingAction === "new" ? "Ja, nieuw spel" : "Ja, wisselen"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
