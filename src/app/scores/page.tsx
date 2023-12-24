"use client";

import Title from "@/components/title";
import { usePlayerStore } from "@/lib/store";
import * as React from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const ScoresTable = dynamic(() => import("@/components/scores-table"), {
  ssr: false,
});

export default function Scores() {
  const reset = usePlayerStore((state) => state.resetScores);
  return (
    <>
      <Title>Scores</Title>
      <ScoresTable />
      <Button onClick={reset}>Reset Scores</Button>
    </>
  );
}
