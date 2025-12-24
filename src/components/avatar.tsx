"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Player } from "@/lib/atoms/players"

type AvatarProps = {
    player: Player
    className?: string
}

const PlayerAvatar: React.FC<AvatarProps> = ({ player, className }) => {
    return (
        <Avatar className={className}>
            <AvatarImage
                src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(player.name)}`}
                alt={player.name}
            />
            <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
    )
}

export default PlayerAvatar
