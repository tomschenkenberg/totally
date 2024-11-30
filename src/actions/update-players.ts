// app/actions.ts
"use server"

import { Players } from "@/lib/atoms/players"
import fs from "fs"
import path from "path"

export async function updatePlayersAction(code: string, players: Players) {
    // make sure code is a string with only lowercase letters:
    if (typeof code !== "string" || !/^[a-z]+$/.test(code)) {
        throw new Error("Invalid code")
    }

    const filePath = path.join(process.cwd(), "data", `${code}.json`)
    await fs.promises.writeFile(filePath, JSON.stringify(players))
    return { success: true }
}
