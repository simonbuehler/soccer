import { ref } from "vue";
import { usePlayer } from "./usePlayer";
import { useAppStore } from "@/stores/appStore";

export function usePlayerInputHandler() {
  const appStore = useAppStore();
  const playerInput = ref("");

  function parsePlayerInput(line) {
    const parts = line.split(",");
    let number, firstName, lastName;

    if (parts.length >= 2) {
      // Format: "10 Müller, Thomas"
      const numberPart = parts[0].trim();
      const numberMatch = numberPart.match(/^(\d+)(?:\s+(.*))?$/);
      if (numberMatch) {
        number = parseInt(numberMatch[1]);
        lastName = numberMatch[2]?.trim() || "";
        firstName = parts[1].trim();
      }
    } else {
      // Format: "10 Thomas Müller"
      const spaceParts = line.split(/\s+/);
      if (spaceParts.length >= 2) {
        number = parseInt(spaceParts[0]);
        firstName = spaceParts[1];
        lastName = spaceParts.slice(2).join(" ");
      }
    }

    if (!number || !firstName) {
      throw new Error(`Invalid player format: "${line}"`);
    }

    return {
      number,
      firstName,
      lastName,
      location: "bench",
      x: 0,
      y: 0,
      percentX: 0,
      percentY: 0,
    };
  }

  function addPlayers() {
    const inputText = playerInput.value.trim();
    if (!inputText) return;

    inputText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .forEach((line) => {
        try {
          const playerData = parsePlayerInput(line);
          const player = usePlayer(playerData);

          // Properly access playerPool from Pinia store
          const playerPool = appStore.playerPool;
          if (!playerPool || !playerPool.players) {
            console.error("PlayerPool not initialized");
            return;
          }

          // Duplicate check with proper reactivity
          const isDuplicate = playerPool.players.value.some(
            (p) =>
              p?.number?.value === player.number.value ||
              (p?.firstName?.value === player.firstName.value &&
                p?.lastName?.value === player.lastName.value)
          );

          if (!isDuplicate) {
            try {
              playerPool.addPlayer(player);
            } catch (e) {
              console.error("Error adding player:", e);
            }
          } else {
            console.warn(
              `Duplicate player skipped: ${player.displayName.value}`
            );
          }
        } catch (e) {
          console.warn(e.message);
        }
      });

    playerInput.value = "";
  }

  return {
    playerInput,
    addPlayers,
  };
}
