// scoreboard.tsx
import { Player, usePlayerStore } from "@/lib/stores/players";
import { Button } from "./ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import PlayerAvatar from "./avatar";

const PlayerScore = ({ id, player }: { id: number; player: Player }) => {
  const getTotalScore = usePlayerStore((state) => state.getTotalScore);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <PlayerAvatar player={player} />
            <span className="text-xl font-bold">{player.name}</span>
          </div>
          <span className="text-2xl font-bold ml-4 font-mono">
            {getTotalScore(id)}
          </span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-6xl">{player.name}</DialogTitle>
          <DialogDescription className="text-9xl font-bold p-4">
            {getTotalScore(id)}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

const Scoreboard = () => {
  const sortedPlayers = usePlayerStore((state) =>
    state.getPlayersSortedByScore()
  );
  const numberOfRounds = usePlayerStore((state) => state.getNumberOfRounds);
  const nextRound = numberOfRounds() + 1;

  return (
    <>
      <div className="text-lg text-center">
        After <span className="font-bold">{numberOfRounds()}</span> rounds
      </div>
      <div className="flex flex-col space-y-4 pb-6">
        {sortedPlayers.map(({ id, player }) => (
          <PlayerScore key={id} id={id} player={player} />
        ))}
      </div>
      <Link href={`/round/${nextRound}`}>
        <Button variant="default" className="w-full text-xl">
          Add scores for round {nextRound}
        </Button>
      </Link>
    </>
  );
};

export default Scoreboard;
