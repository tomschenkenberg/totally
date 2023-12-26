import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { generate } from "random-words";

function generateUniqueCode(): string {
  const randomWord = generate({
    minLength: 4,
  }) as unknown as string;
  console.log("Generated unique code:", randomWord);
  return randomWord;
}

interface ShareCodeState {
  uniqueCode: string;
  getUniqueCode: () => string;
  setUniqueCode: (newCode: string) => void;
}

export const useShareCodeStore = create<ShareCodeState>()(
  devtools(
    persist(
      (set, get) => ({
        uniqueCode: "",

        getUniqueCode: () => {
          const code = get().uniqueCode;
          if (!code) {
            set({ uniqueCode: generateUniqueCode() });
          }
          return get().uniqueCode;
        },

        setUniqueCode: (newCode) => {
          set({ uniqueCode: newCode });
        },
      }),
      { name: "share-code-store" }
    )
  )
);
