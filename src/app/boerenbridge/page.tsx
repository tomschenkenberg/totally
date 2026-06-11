import { Suspense } from "react"
import { BoerenBridgePlayFlow } from "@/components/boerenbridge/play-flow"
import BoerenBridgeLoading from "./loading"

export default function BoerenBridgePage() {
    return (
        <Suspense fallback={<BoerenBridgeLoading />}>
            <BoerenBridgePlayFlow />
        </Suspense>
    )
}
