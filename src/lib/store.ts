import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface Player {
  name: string;
  scores: number[];
}

interface PlayerState {
  players: { [id: number]: Player };
  getPlayerName: (id: number) => string;
  setPlayerName: (id: number, name: string) => void;
  getPlayerScores: (id: number) => number[];
  updatePlayerScores: (id: number, scores: number[]) => void;
  removePlayer: (id: number) => void;
  getTotalScore: (id: number) => number;
}

export const usePlayerStore = create<PlayerState>()(
  devtools(
    persist(
      (set, get) => ({
        players: {},

        getPlayerName: (id) => get().players[id]?.name || "",

        setPlayerName: (id, name) => {
          if (name.trim() === "") {
            // If name is empty, remove the player
            const updatedPlayers = { ...get().players };
            delete updatedPlayers[id];
            set({ players: updatedPlayers });
          } else {
            // Set or update player name
            set((state) => ({
              players: {
                ...state.players,
                [id]: { ...state.players[id], name },
              },
            }));
          }
        },

        getPlayerScores: (id) => get().players[id]?.scores || [],

        updatePlayerScores: (id, scores) =>
          set((state) => ({
            players: {
              ...state.players,
              [id]: { ...state.players[id], scores },
            },
          })),

        removePlayer: (id) =>
          set((state) => {
            const updatedPlayers = { ...state.players };
            delete updatedPlayers[id];
            return { players: updatedPlayers };
          }),
        getTotalScore: (id) => {
          const player = get().players[id];
          return player && player.scores
            ? player.scores.reduce((total, score) => total + score, 0)
            : 0;
        },
      }),
      {
        name: "player-store",
      }
    )
  )
);
