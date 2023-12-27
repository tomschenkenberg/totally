import { useSharingStore } from "./stores/sharing";

export async function saveStateToAPI(state: any) {
  const uniqueCode = useSharingStore.getState().uniqueAppCode;
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
