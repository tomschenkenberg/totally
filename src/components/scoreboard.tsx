// scoreboard.tsx
import { usePlayerStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Scoreboard = () => {
  const players = usePlayerStore((state) => state.players);
  const getTotalScore = usePlayerStore((state) => state.getTotalScore);

  return (
    <div className="flex flex-col space-y-4">
      {Object.entries(players).map(([id, player]) => (
        <div key={id} className="flex justify-between items-center">
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
      ))}
    </div>
  );
};

export default Scoreboard;
