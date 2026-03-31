import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/** Tailwind text color for a numeric score: green if ≥0, red if negative. */
export function scoreTextClass(value: number): string {
    return value < 0 ? "text-red-400" : "text-emerald-400"
}
