import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { useSharingStore } from "./sharing";

export type Scores = { [round: number]: number };
export interface Player {
  name: string;
  scores: Scores;
}
export type Players = { [id: number]: Player };

async function saveStateToAPI(state: any) {
  const uniqueCode = useSharingStore.getState().getTargetCode();
  try {
    const response = await fetch(`/api/players/${uniqueCode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });
    const data = await response.json();
    console.log("State saved for code:", uniqueCode);
  } catch (error) {
    console.error("Failed to save state:", error);
  }
}

async function fetchStateFromAPI() {
  const uniqueCode = useSharingStore.getState().getTargetCode();
  try {
    const response = await fetch(`/api/players/${uniqueCode}`);
    const data = await response.json();
    console.log("State loaded for code:", uniqueCode);
    return data;
  } catch (error) {
    console.error("Failed to load state:", error);
  }
}

const customStorage = {
  getItem: async (name: any) => {
    // Retrieve from Local Storage
    const localData = localStorage.getItem(name);
    if (localData) return localData;

    // Optional: Fetch from server if not found in Local Storage
    const data = await fetchStateFromAPI();
    return JSON.stringify(data);
  },
  setItem: (name: any, value: any) => {
    // Save to Local Storage
    localStorage.setItem(name, value);

    // Save to Server
    saveStateToAPI(JSON.parse(value));
  },
  removeItem: (name: any) => {
    // Implement removeItem if needed
  },
};

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

  fetchDataFromServer: () => void;
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
          const data = await fetchStateFromAPI();
          set(data);
        },
      }),
      {
        name: "player-store",
        storage: createJSONStorage(() => customStorage),
      }
    )
  )
);
