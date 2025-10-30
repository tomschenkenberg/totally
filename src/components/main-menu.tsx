"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const common =
    "relative inline-flex items-center bg-slate-700 px-3 py-2 text-xl font-semibold text-gray-200 ring-1 ring-inset ring-slate-600 hover:bg-slate-600 focus:z-10 transition-colors"

const NavButton = ({ label, className, href }: { label: string; className: string; href: string }) => {
    const pathname = usePathname()
    const isActive = pathname === href || (href === "/" && pathname === "/")

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

