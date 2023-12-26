"use client";

import ShareCodeInput from "@/components/share-code-input";
import Title from "@/components/title";
import { Card, CardContent } from "@/components/ui/card";

export default function SharePage() {
  return (
    <>
      <Title>Share</Title>
      <Card>
        <CardContent>
          <div className="mt-6 space-y-4">
            <p>Share this code with your friends to share your scoreboard!</p>
            <ShareCodeInput />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
