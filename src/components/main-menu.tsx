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

const GAME_MODE_LABELS: Record<GameMode, string> = {
    boerenbridge: "Boerenbridge",
    schoppenvrouwen: "Schoppenvrouwen",
    generic: "Vrije Scorekeeper"
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
        // Check if there's an active game with progress
        if (activeGame.active) {
            setPendingAction("new")
            setShowConfirmDialog(true)
            return
        }
        executeReset()
    }

    const handleSwitchGame = () => {
        // Check if there's an active game with progress
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
            <NavButton label="Scores" href="/scores" />
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
    )

    const genericMenu = (
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

    const menuContent =
        gameMode === "boerenbridge"
            ? boerenBridgeMenu
            : gameMode === "schoppenvrouwen"
              ? schoppenvrouwenMenu
              : genericMenu

    return (
        <>
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

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="bg-slate-800 border-slate-600">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white text-xl">
                            {pendingAction === "new" ? "Nieuw spel starten?" : "Spel wisselen?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300 text-base">
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
                            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
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
