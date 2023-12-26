import { useShareCodeStore } from "./stores/share-code";

export async function saveStateToAPI(state: any) {
  const uniqueCode = useShareCodeStore.getState().getUniqueCode();
  try {
    const response = await fetch(`/api/save/${uniqueCode}`, {
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
