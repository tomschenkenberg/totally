import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface Player {
  name: string;
  scores: number[];
}

interface PlayerState {
  players: { [id: number]: Player };
  getPlayerName: (id: number) => string;
  setPlayerName: (id: number, name: string) => void;
  getPlayerScores: (id: number) => number[];
  removePlayer: (id: number) => void;
  getTotalScore: (id: number) => number;
  addScoreForRound: (id: number, round: number, score: number) => void;
  getNumberOfRounds: () => number;
  addRandomScoresForAllPlayers: () => void;
  resetScores: () => void;
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
                [id]: {
                  ...state.players[id],
                  name,
                  scores: state.players[id]?.scores || [],
                },
              },
            }));
          }
        },

        getPlayerScores: (id) => get().players[id]?.scores || [],

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

        addScoreForRound: (id, round, score) => {
          set((state) => {
            const player = state.players[id];
            if (player) {
              // Initialize the scores array if necessary and ensure it's the correct length
              const updatedScores =
                player.scores.length > round
                  ? [...player.scores]
                  : Array.from(
                      { length: round + 1 },
                      (_, i) => player.scores[i] || 0
                    );

              updatedScores[round] = score; // Set score for specific round
              return {
                players: {
                  ...state.players,
                  [id]: { ...player, scores: updatedScores },
                },
              };
            }
            return state; // No change if player not found
          });
        },

        getNumberOfRounds: () => {
          const playerScores = Object.values(get().players).map(
            (player) => player.scores?.length
          );
          return Math.max(0, ...playerScores) || 0; // Return the maximum length of scores array
        },

        addRandomScoresForAllPlayers: () => {
          const numberOfRounds = get().getNumberOfRounds();
          const randomScore = () => Math.floor(Math.random() * 10) * 10;

          Object.keys(get().players).forEach((id) => {
            console.log(`Adding random scores for player ${id}`);
            for (
              let round = numberOfRounds;
              round < numberOfRounds + 1;
              round++
            ) {
              get().addScoreForRound(Number(id), round, randomScore());
            }
          });
        },

        resetScores: () => {
          set((state) => ({
            players: Object.fromEntries(
              Object.entries(state.players).map(([id, player]) => [
                id,
                { ...player, scores: [] },
              ])
            ),
          }));
        },
      }),
      {
        name: "player-store",
      }
    )
  )
);
