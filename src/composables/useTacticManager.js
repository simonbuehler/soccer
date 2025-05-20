import { useAppStore } from "@/stores/appStore";
import { TACTICS } from "@/js/tactics/allTactics";

export function useTacticManager() {
  const store = useAppStore();

  function initializeGame() {
    // Initialize tactics
    store.gameType = 7;
    store.currentTactic = TACTICS[7]?.find((t) => t.name === "Frei");
  }

  function setGameType(playerCount) {
    if (store.gameType === playerCount) return false;

    store.gameType = playerCount;
    const defaultTactic = TACTICS[playerCount]?.find((t) => t.name === "Frei");
    if (defaultTactic) {
      store.currentTactic = defaultTactic;
      return true;
    }
    return false;
  }

  function setTactic(tacticName) {
    if (!tacticName || !store.gameType) return false;

    const tactics = TACTICS[store.gameType];
    if (!tactics?.length) return false;

    const newTactic = tactics.find((t) => t.name === tacticName);
    if (!newTactic) return false;

    try {
      store.currentTactic = { ...newTactic };
      return true;
    } catch (e) {
      console.error("Failed to set tactic:", e);
      return false;
    }
  }

  function getPositionMarkers() {
    if (!store.currentTactic?.positions?.length) return [];

    // Return enhanced position markers with additional properties
    // that can be used by the highlighting system
    return store.currentTactic.positions.map((pos, index) => ({
      ...pos,
      index: index, // Add explicit index for easy reference
      isRequired: !store.currentTactic.name.includes("Frei"),
      x: pos.xPercent || pos.x, // Ensure x is available
      y: pos.yPercent || pos.y, // Ensure y is available
    }));
  }

  function redistributePlayers() {
    if (!store.currentTactic?.positions?.length) return;

    // Verwenden der neuen Store-Struktur mit separaten Arrays
    const pitchPlayers = [...store.fieldPlayers];
    const benchPlayers = [...store.benchPlayers];

    const markers = [...store.currentTactic.positions];
    const markerPositions = markers.map((pos) => ({
      x: pos.xPercent,
      y: pos.yPercent,
      assigned: false,
    }));

    // Check if we have too many players on the field for the new tactic
    const excessPlayerCount = pitchPlayers.length - markerPositions.length;

    if (excessPlayerCount > 0) {
      // We need to move some players to the bench (e.g., when switching from 11er to 7er)
      console.log(
        `[TACTIC] Moving ${excessPlayerCount} excess players to bench`
      );

      // Sort players by position (goalkeepers first, then by Y position - defense to offense)
      const sortedPlayers = [...pitchPlayers].sort((a, b) => {
        // Keeper first
        if (a.position === "Keeper" && b.position !== "Keeper") return -1;
        if (b.position === "Keeper" && a.position !== "Keeper") return 1;
        // Then sort by Y position (defense first)
        return a.percentY - b.percentY;
      });

      // Keep the most important players (keepers, defenders) on the field
      const playersToKeep = sortedPlayers.slice(0, markerPositions.length);
      const playersToMove = sortedPlayers.slice(markerPositions.length);

      // Move excess players to bench
      playersToMove.forEach((player) => {
        store.movePlayerToBench(player.id);
        console.log(`[TACTIC] Moved player ${player.firstName} to bench`);
      });

      // Continue with the players to keep
      const remainingPlayers = playersToKeep;

      // Reset the pitchPlayers array to only include players we're keeping
      pitchPlayers.length = 0;
      pitchPlayers.push(...remainingPlayers);
    }

    // Step 1: Assign existing pitch players to closest available marker
    pitchPlayers.forEach((player) => {
      let closestPosInfo = null;
      let minDistance = Infinity;

      markerPositions.forEach((pos, index) => {
        if (!pos.assigned) {
          const dx = pos.x - player.percentX;
          const dy = pos.y - player.percentY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < minDistance) {
            minDistance = distance;
            closestPosInfo = { pos, index };
          }
        }
      });

      if (closestPosInfo) {
        // Benutze die store-Funktion zur Positionsänderung
        store.updatePlayerPosition(
          player.id,
          closestPosInfo.pos.x,
          closestPosInfo.pos.y
        );
        markerPositions[closestPosInfo.index].assigned = true;
      }
    });

    // Step 2: Fill remaining positions with bench players
    const unassignedPositions = markerPositions.filter((pos) => !pos.assigned);

    if (unassignedPositions.length > 0 && benchPlayers.length > 0) {
      console.log(
        `[TACTIC] Filling ${unassignedPositions.length} open positions from bench`
      );

      for (
        let i = 0;
        i < Math.min(unassignedPositions.length, benchPlayers.length);
        i++
      ) {
        const playerToMove = benchPlayers[i];
        const targetPosition = unassignedPositions[i];

        // Benutze die store-Funktion zum Verschieben vom Spieler auf das Feld
        store.movePlayerToField(
          playerToMove.id,
          targetPosition.x,
          targetPosition.y
        );
        console.log(
          `[TACTIC] Moved ${playerToMove.firstName} from bench to field`
        );

        markerPositions[
          markerPositions.indexOf(targetPosition)
        ].assigned = true;
      }
    }
  }

  function getTacticsForCurrentGameType() {
    const tactics = TACTICS[store.gameType] || [];
    // Ensure unique entries by name only
    return tactics.filter(
      (tactic, index, self) =>
        index === self.findIndex((t) => t.name === tactic.name)
    );
  }

  function getCurrentGameType() {
    return store.gameType;
  }

  function getCurrentTactic() {
    return store.currentTactic;
  }

  return {
    initializeGame,
    setGameType,
    setTactic,
    getPositionMarkers,
    redistributePlayers,
    getTacticsForCurrentGameType,
    getCurrentGameType,
    getCurrentTactic,
  };
}
