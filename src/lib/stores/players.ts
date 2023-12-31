import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { useSharingStore } from "./sharing";

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
  getPlayersSortedByScore: () => Array<{
    id: number;
    player: Player;
    totalScore: number;
  }>;
  fetchDataFromServer: () => Promise<void>;
}

async function callAPI(endpoint: string, method = "GET", body = null) {
  const uniqueCode = useSharingStore.getState().getTargetCode();
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  try {
    const response = await fetch(
      `/api/players/${uniqueCode}${endpoint}`,
      options
    );
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("API call error:", error);
    throw error; // Re-throw for handling in calling function
  }
}

const customStorage = {
  getItem: async (name: string) => {
    // Retrieve from Local Storage
    const localData = localStorage.getItem(name);
    if (localData) return localData;

    const data = await callAPI("/");
    return JSON.stringify(data);
  },
  setItem: (name: string, value: string) => {
    // Save to Local Storage
    localStorage.setItem(name, value);

    // Save to Server
    callAPI("/", "POST", JSON.parse(value)); // Async, but not awaited
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

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

        removePlayer: (id) => {
          set((state) => {
            const updatedPlayers = { ...state.players };
            delete updatedPlayers[id];
            return { players: updatedPlayers };
          });
        },

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
        fetchDataFromServer: async () => {
          try {
            const data = await callAPI("/");
            set({ players: data.players });
          } catch (error) {
            console.error("Failed to fetch data:", error);
          }
        },
      }),
      {
        name: "player-store",
        storage: createJSONStorage(() => customStorage),
      }
    )
  )
);
