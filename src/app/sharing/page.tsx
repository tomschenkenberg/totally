import Title from "@/components/title"
import { Card, CardContent } from "@/components/ui/card"
import AppCode from "@/app/sharing/app-code"
import ShareCodeInput from "@/app/sharing/sync-code-input"

export default function SharePage() {
    return (
        <>
            <Title>Sharing</Title>
            <Card>
                <CardContent>
                    <div className="mt-6 space-y-4">
                        <p>This is your unique app code to share:</p>
                        <AppCode />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <div className="mt-6 space-y-4">
                        <p>Enter the app code to sync your app with the other app</p>
                        <ShareCodeInput />
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
