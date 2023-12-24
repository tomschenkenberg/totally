import { Input } from "@/components/ui/input";
import { Cross1Icon } from "@radix-ui/react-icons";
import { usePlayerStore } from "@/lib/store";

interface PlayerInputProps {
  id: number;
  placeholder: string;
}

const PlayerInput = ({ id, placeholder }: PlayerInputProps) => {
  const player = usePlayerStore((state) => state.players[id]);
  const setPlayerName = usePlayerStore((state) => state.setPlayerName);

  const handleClear = () => {
    setPlayerName(id, "");
  };

  return (
    <div className="relative space-y-2">
      <Input
        id={`player-input-${id}`}
        placeholder={placeholder}
        value={player?.name || ""}
        onChange={(e) => setPlayerName(id, e.target.value)}
        required
      />
      {player?.name && (
        <button
          onClick={handleClear}
          className="absolute right-0 top-1 mt-2 mr-2">
          <Cross1Icon />
        </button>
      )}
    </div>
  );
};

export default PlayerInput;
