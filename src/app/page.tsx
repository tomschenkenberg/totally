"use client";

import Title from "@/components/title";
import { usePlayerStore } from "@/lib/store";
import dynamic from "next/dynamic";

const Scoreboard = dynamic(() => import("@/components/scoreboard"), {
  ssr: false,
});

export default function ScoreboardPage() {
  return (
    <>
      <Title>Scoreboard</Title>
      <Scoreboard />
    </>
  );
}
