import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type Scores = { [round: number]: number };
export interface Player {
  name: string;
  scores: Scores;
}
export type Players = { [id: number]: Player };

interface PlayerState {
  players: Players;
  getPlayerName: (id: number) => string;
  setPlayerName: (id: number, name: string) => void;
  getPlayerScores: (id: number) => Scores;
  removePlayer: (id: number) => void;
  getTotalScore: (id: number) => number;
  addScoreForRound: (id: number, round: number, score: number) => void;
  getNumberOfRounds: () => number;
  resetScores: () => void;
  getPlayersSortedByScore: () => {
    id: number;
    player: Player;
    totalScore: number;
  }[];
}

export const usePlayerStore = create<PlayerState>()(
  devtools(
    persist(
      (set, get) => ({
        players: {},

        getPlayersSortedByScore: () => {
          const playersArray = Object.entries(get().players).map(
            ([id, player]) => ({
              id: Number(id),
              player,
              totalScore: get().getTotalScore(Number(id)),
            })
          );

          return playersArray.sort((a, b) => b.totalScore - a.totalScore);
        },

        getPlayerName: (id) => get().players[id]?.name || "",

        setPlayerName: (id, name) => {
          if (name.trim() === "") {
            // If name is empty, remove the player
            get().removePlayer(id);
          } else {
            // Set or update player name
            set((state) => ({
              players: {
                ...state.players,
                [id]: {
                  ...state.players[id],
                  name,
                  scores: state.players[id]?.scores || {},
                },
              },
            }));
          }
        },

        getPlayerScores: (id) => get().players[id]?.scores,

        removePlayer: (id) =>
          set((state) => {
            const updatedPlayers = { ...state.players };
            delete updatedPlayers[id];
            return { players: updatedPlayers };
          }),

        getTotalScore: (id) => {
          const player = get().players[id];
          return player
            ? Object.values(player.scores).reduce(
                (total, score) => total + score,
                0
              )
            : 0;
        },

        addScoreForRound: (id, round, score) => {
          set((state) => {
            const player = state.players[id];
            if (player) {
              const updatedScores = { ...player.scores, [round]: score };
              return {
                players: {
                  ...state.players,
                  [id]: { ...player, scores: updatedScores },
                },
              };
            }
            return state;
          });
        },

        getNumberOfRounds: () => {
          const playerScores = Object.values(get().players).map(
            (player) => Object.values(player.scores)?.length
          );
          return Math.max(0, ...playerScores) || 0; // Return the maximum length of scores array
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
