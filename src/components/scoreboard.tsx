// scoreboard.tsx
import { Player, usePlayerStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { CopyIcon } from "@radix-ui/react-icons";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PlayerScore = ({ id, player }: { id: string; player: Player }) => {
  const getTotalScore = usePlayerStore((state) => state.getTotalScore);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage
                src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(
                  player.name
                )}`}
              />
              <AvatarFallback>
                {player.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xl font-bold">{player.name}</span>
          </div>
          <span className="text-2xl font-bold ml-4">
            {getTotalScore(parseInt(id))}
          </span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-6xl">{player.name}</DialogTitle>
          <DialogDescription className="text-9xl font-bold p-4">
            {getTotalScore(parseInt(id))}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

const Scoreboard = () => {
  const players = usePlayerStore((state) => state.players);
  const numberOfRounds = usePlayerStore((state) => state.getNumberOfRounds);

  const addRandomScoresForAllPlayers = usePlayerStore(
    (state) => state.addRandomScoresForAllPlayers
  );

  return (
    <>
      <div className="text-lg text-center">
        After <span className="font-bold">{numberOfRounds()}</span> rounds
      </div>
      <div className="flex flex-col space-y-4">
        {Object.entries(players).map(([id, player]) => (
          <PlayerScore key={id} id={id} player={player} />
        ))}
      </div>
      <Button
        className="w-full"
        onClick={() => {
          addRandomScoresForAllPlayers();
        }}>
        Add scores for round {numberOfRounds() + 1}
      </Button>
    </>
  );
};

export default Scoreboard;
