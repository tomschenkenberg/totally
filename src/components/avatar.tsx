"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Player } from "@/lib/stores/players"

type AvatarProps = {
    player: Player
}

const PlayerAvatar: React.FC<AvatarProps> = ({ player }) => {
    return (
        <Avatar>
            <AvatarImage
                src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(player.name)}`}
                alt={player.name}
            />
            <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
    )
}

export default PlayerAvatar
