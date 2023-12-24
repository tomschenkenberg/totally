"use client";

import Title from "@/components/title";
import { usePlayerStore } from "@/lib/store";
import * as React from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ScoresTable = dynamic(() => import("@/components/scores-table"), {
  ssr: false,
});

export default function ScoresPage() {
  const reset = usePlayerStore((state) => state.resetScores);
  return (
    <>
      <Title>Scores</Title>
      <ScoresTable />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive"> Reset Scores</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                reset();
              }}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
