import { ref } from "vue";
import { usePlayer } from "./usePlayer";
import { usePlayerPool } from "./usePlayerPool";

export function usePlayerInputHandler() {
  const playerInput = ref("");
  const playerPool = usePlayerPool();

  function parsePlayerInput(line) {
    let numberStr, firstNameStr, lastNameStr;

    const parts = line.split(",");
    if (parts.length >= 2) {
      const numberPartRaw = parts[0].trim();
      firstNameStr = parts[1].trim();
      
      const numberAndLastName = numberPartRaw.split(/\s+/);
      numberStr = numberAndLastName[0].trim();
      lastNameStr = numberAndLastName.length > 1 
        ? numberAndLastName.slice(1).join(" ").trim()
        : "";

      if (parts.length > 2) {
        lastNameStr = parts.slice(1).join(",").trim().split(/\s+/).slice(1).join(" ");
        firstNameStr = parts[1].trim().split(/\s+/)[0].trim();
      }
    } else {
      const spaceParts = line.split(/\s+/);
      if (spaceParts.length >= 2) {
        numberStr = spaceParts[0].trim();
        firstNameStr = spaceParts[1].trim();
        lastNameStr = spaceParts.length > 2 
          ? spaceParts.slice(2).join(" ").trim()
          : "";
      } else {
        throw new Error(`Invalid player format: "${line}"`);
      }
    }
    
    if (!numberStr || !firstNameStr) {
      throw new Error(`Missing number or first name: "${line}"`);
    }
    
    const number = parseInt(numberStr);
    if (isNaN(number)) {
      throw new Error(`Invalid player number: "${numberStr}"`);
    }

    return {
      number,
      firstName: firstNameStr,
      lastName: lastNameStr || "",
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
          // Create simple player object without reactivity
          const simplePlayer = {
            ...playerData,
            id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            displayName: `${playerData.number}, ${playerData.firstName} ${playerData.lastName}`
          };

          try {
            playerPool.addPlayer(simplePlayer);
          } catch (e) {
            if (e.message.includes('duplicate')) {
              console.warn(e.message);
            } else {
              console.error("Error adding player:", e);
            }
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
