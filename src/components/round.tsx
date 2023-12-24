// scoreboard.tsx
import { Player, usePlayerStore } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import PlayerAvatar from "./avatar";
import React from "react";

const InputPlayerScore = ({
  id,
  player,
  round,
}: {
  id: string;
  player: Player;
  round: number;
}) => {
  const currentScores = usePlayerStore((state) => state.getPlayerScores);
  const setPlayerScore = usePlayerStore((state) => state.addScoreForRound);

  const [inputValue, setInputValue] = React.useState(
    currentScores(parseInt(id))[round]?.toString() || ""
  );

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scoreValue = e.target.value;
    setInputValue(scoreValue); // Set the local state

    // Only update the store if the scoreValue is a valid number
    if (scoreValue !== "") {
      const newScore = parseInt(scoreValue);
      if (!isNaN(newScore)) {
        setPlayerScore(parseInt(id), round, newScore);
      }
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <PlayerAvatar player={player} />
        <span className="text-xl font-bold">{player.name}</span>
      </div>
      <span className="text-2xl font-bold ml-4">
        <Input
          type="number"
          placeholder="Score"
          value={inputValue}
          onChange={handleScoreChange}
        />
      </span>
    </div>
  );
};

const Round = ({ round }: { round: number }) => {
  const players = usePlayerStore((state) => state.players);

  return (
    <>
      <div className="flex flex-col space-y-4 pb-6">
        {Object.entries(players).map(([id, player]) => (
          <InputPlayerScore key={id} id={id} player={player} round={round} />
        ))}
      </div>
      <Link href={`/scores`}>
        <Button variant="default" className="w-full">
          Done
        </Button>
      </Link>
    </>
  );
};

export default Round;
