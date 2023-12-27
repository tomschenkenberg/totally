"use client";

import Title from "@/components/title";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";

const AppCode = dynamic(() => import("@/components/app-code"), {
  ssr: false,
});

const ShareCodeInput = dynamic(() => import("@/components/sync-code-input"), {
  ssr: false,
});

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
  );
}
