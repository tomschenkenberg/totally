export function LoadingPlaceholder({ label = "Laden..." }: { label?: string }) {
    return (
        <div className="flex items-center justify-center py-16">
            <div className="text-zinc-500">{label}</div>
        </div>
    )
}
