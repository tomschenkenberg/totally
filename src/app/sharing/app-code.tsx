"use client"

import { useAtom, useAtomValue } from "jotai"
import { uniqueAppCodeAtom } from "@/lib/atoms/players"
import { generate } from "random-words"

const AppCode = () => {
    const appCode = useAtomValue(uniqueAppCodeAtom)
    const [, setAppCode] = useAtom(uniqueAppCodeAtom)

    if (!appCode || appCode === "") {
        setAppCode(generate({ minLength: 4 }) as string)
    }

    return <div className="text-2xl font-semibold p-3 font-mono text-center">{appCode}</div>
}

export default AppCode
