import { defineStore } from "pinia";
import { ref, watch, Ref } from "vue";
import { Player } from "../core/models/Player";

export const useAppStore = defineStore("app", () => {
  // Reactive state only
  const fieldPlayers: Ref<Player[]> = ref([]);
  const benchPlayers: Ref<Player[]> = ref([]);
  const currentTactic: Ref<any> = ref(null); // Tactic-Typ sollte ebenfalls definiert werden
  const gameType: Ref<number> = ref(7);

  // Debug-Log zur Prüfung der Initialisierung
  console.log("[AppStore] Initializing app store");

  // Spieler-Management-Methoden
  function findPlayerById(playerId: string): Player | undefined {
    // Suche erst auf dem Feld, dann auf der Bank
    const fieldPlayer = fieldPlayers.value.find((p) => p.id === playerId);
    if (fieldPlayer) return fieldPlayer;

    return benchPlayers.value.find((p) => p.id === playerId);
  }

  function addPlayer(player: Player): string {
    // Standardmäßig kommen neue Spieler auf die Bank
    benchPlayers.value.push(player);
    return player.id;
  }

  function movePlayerToField(playerId: string, x: number, y: number): boolean {
    const player = findPlayerById(playerId);
    if (!player) return false;

    // Koordinaten-Validierung hinzugefügt
    if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
      console.error("[AppStore] Invalid coordinates for movePlayerToField", {
        x,
        y,
      });
      return false;
    }

    // Wenn Spieler auf der Bank ist, verschiebe ihn zum Feld
    if (player.location === "bench") {
      const index = benchPlayers.value.findIndex((p) => p.id === playerId);
      if (index !== -1) {
        const [removedPlayer] = benchPlayers.value.splice(index, 1);
        // Sicherstellen, dass gültige Koordinaten gesetzt werden
        removedPlayer.percentX = Number(x);
        removedPlayer.percentY = Number(y);
        fieldPlayers.value.push(removedPlayer);
        return true;
      }
    } else {
      // Spieler ist bereits auf dem Feld, aktualisiere nur die Position
      // Sicherstellen, dass gültige Koordinaten gesetzt werden
      player.percentX = Number(x);
      player.percentY = Number(y);
      return true;
    }

    return false;
  }

  function movePlayerToBench(playerId: string): boolean {
    const player = findPlayerById(playerId);
    if (!player || player.location === "bench") return false;

    // Spieler vom Feld auf die Bank verschieben
    const index = fieldPlayers.value.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      const [removedPlayer] = fieldPlayers.value.splice(index, 1);
      // location wird automatisch durch den Watcher gesetzt
      benchPlayers.value.push(removedPlayer);
      return true;
    }

    return false;
  }

  function updatePlayerPosition(
    playerId: string,
    x: number,
    y: number
  ): boolean {
    const player = findPlayerById(playerId);
    if (!player || player.location !== "pitch") return false;

    // Koordinaten-Validierung hinzugefügt
    if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
      console.error("[AppStore] Invalid coordinates for updatePlayerPosition", {
        x,
        y,
      });
      return false;
    }

    // Sicherstellen, dass gültige Koordinaten gesetzt werden
    player.percentX = Number(x);
    player.percentY = Number(y);
    return true;
  }

  function swapPlayers(player1Id: string, player2Id: string): boolean {
    const player1 = findPlayerById(player1Id);
    const player2 = findPlayerById(player2Id);

    if (!player1 || !player2) return false;

    // Positionen tauschen
    const tempX = player1.percentX;
    const tempY = player1.percentY;
    const tempLocation = player1.location;

    // Wenn beide auf dem Feld sind, tausche nur die Position
    if (player1.location === "pitch" && player2.location === "pitch") {
      player1.percentX = player2.percentX;
      player1.percentY = player2.percentY;
      player2.percentX = tempX;
      player2.percentY = tempY;
      return true;
    }

    // Wenn einer auf der Bank und einer auf dem Feld ist, tausche die Standorte
    if (player1.location !== player2.location) {
      // Implement swap directly instead of calling movePlayerToField/movePlayerToBench
      // This avoids triggering multiple array operations and reduces reactivity churn

      if (player1.location === "bench") {
        // Find indices
        const p1BenchIndex = benchPlayers.value.findIndex(
          (p) => p.id === player1Id
        );
        const p2FieldIndex = fieldPlayers.value.findIndex(
          (p) => p.id === player2Id
        );

        if (p1BenchIndex !== -1 && p2FieldIndex !== -1) {
          // Remove players from their arrays
          const [removedFromBench] = benchPlayers.value.splice(p1BenchIndex, 1);
          const [removedFromField] = fieldPlayers.value.splice(p2FieldIndex, 1);

          // Set coordinates
          removedFromBench.percentX = Number(removedFromField.percentX);
          removedFromBench.percentY = Number(removedFromField.percentY);

          // Add to new arrays
          fieldPlayers.value.push(removedFromBench);
          benchPlayers.value.push(removedFromField);

          return true;
        }
      } else {
        // Player1 is on field, player2 is on bench
        const p1FieldIndex = fieldPlayers.value.findIndex(
          (p) => p.id === player1Id
        );
        const p2BenchIndex = benchPlayers.value.findIndex(
          (p) => p.id === player2Id
        );

        if (p1FieldIndex !== -1 && p2BenchIndex !== -1) {
          // Remove players from their arrays
          const [removedFromField] = fieldPlayers.value.splice(p1FieldIndex, 1);
          const [removedFromBench] = benchPlayers.value.splice(p2BenchIndex, 1);

          // Set coordinates
          removedFromBench.percentX = Number(removedFromField.percentX);
          removedFromBench.percentY = Number(removedFromField.percentY);

          // Add to new arrays
          fieldPlayers.value.push(removedFromBench);
          benchPlayers.value.push(removedFromField);

          return true;
        }
      }
    }

    return false;
  }

  // Add watcher for tactic changes to redistribute players
  // Function to redistribute players when tactic changes
  function redistributePlayers() {
    if (!currentTactic.value?.positions?.length) {
      console.log("[AppStore] No positions in new tactic (likely free tactic)");
      // For free tactics, we don't need to move players, just leave them where they are
      return;
    }

    console.log("[AppStore] Redistributing players to new tactic positions");
    
    // Get players on the field
    const players = [...fieldPlayers.value];
    
    // Get markers from the current tactic
    const markers = currentTactic.value.positions.map((pos) => ({
      x: pos.xPercent || pos.x,
      y: pos.yPercent || pos.y,
      assigned: false,
    }));
    
    // Check if we have too many players on the field for the new tactic
    if (players.length > markers.length) {
      console.log(`[AppStore] Too many players (${players.length}) for tactic positions (${markers.length})`);
      
      // Sort players by position (goalkeepers first, then by Y position)
      const sortedPlayers = [...players].sort((a, b) => {
        // Keeper first - check if property exists to avoid type errors
        const aIsKeeper = "position" in a && a.position === "Keeper";
        const bIsKeeper = "position" in b && b.position === "Keeper";
        
        if (aIsKeeper && !bIsKeeper) return -1;
        if (bIsKeeper && !aIsKeeper) return 1;
        
        // Then sort by Y position (defense first)
        return a.percentY - b.percentY;
      });
      
      // Keep the most important players on the field
      const playersToKeep = sortedPlayers.slice(0, markers.length);
      const playersToMove = sortedPlayers.slice(markers.length);
      
      // Move excess players to bench
      playersToMove.forEach(player => {
        movePlayerToBench(player.id);
      });
      
      // Continue with the players to keep
      players.length = 0;
      players.push(...playersToKeep);
    }
    
    // Assign players to closest positions
    players.forEach(player => {
      let closestMarkerIndex = -1;
      let minDistance = Infinity;
      
      // Find closest unassigned marker
      markers.forEach((marker, index) => {
        if (!marker.assigned) {
          const dx = player.percentX - marker.x;
          const dy = player.percentY - marker.y;
          const distance = dx * dx + dy * dy;
          
          if (distance < minDistance) {
            minDistance = distance;
            closestMarkerIndex = index;
          }
        }
      });
      
      // If we found a marker, assign the player to it
      if (closestMarkerIndex !== -1) {
        const marker = markers[closestMarkerIndex];
        marker.assigned = true;
        
        // Update player position to match marker
        updatePlayerPosition(player.id, marker.x, marker.y);
      }
    });
    
    console.log("[AppStore] Player redistribution completed");
  }

  watch(currentTactic, (newTactic, oldTactic) => {
    console.log("[AppStore] Tactic changed:", newTactic?.name);
    
    // Always redistribute players when tactic changes, even if it's the first set
    // Remove the oldTactic requirement to handle the initial tactic assignment
    if (newTactic && newTactic !== oldTactic) {
      console.log("[AppStore] Tactic changed - redistributing players");
      // Slight delay to ensure markers are updated first
      setTimeout(() => {
        redistributePlayers();
      }, 0);
    }
  }, { immediate: true }); // Also run immediately on component creation

  // Watcher für die Spielerlisten, um location automatisch anzupassen
  // Use shallow watchers to prevent recursive updates (only trigger on array changes, not properties)
  watch(fieldPlayers, (newPlayers) => {
    console.log("[AppStore] Watching field players:", newPlayers);
    // Update locations in a non-reactive way to avoid triggering the watcher again
    newPlayers.forEach((player) => {
      if (player.location !== "pitch") {
        console.log(
          `[AppStore] Updating player ${player.id} location to 'pitch'`
        );
        // Set the property directly without triggering reactivity
        Object.assign(player, { location: "pitch" });
      }
    });
  });

  watch(benchPlayers, (newPlayers) => {
    console.log("[AppStore] Watching bench players:", newPlayers);
    newPlayers.forEach((player) => {
      if (player.location !== "bench") {
        console.log(
          `[AppStore] Updating player ${player.id} location to 'bench'`
        );
        // Set the property directly without triggering reactivity
        Object.assign(player, { location: "bench" });
      }
    });
  });

  return {
    fieldPlayers,
    benchPlayers,
    currentTactic,
    gameType,
    findPlayerById,
    addPlayer,
    movePlayerToField,
    movePlayerToBench,
    updatePlayerPosition,
    swapPlayers,
    redistributePlayers,  // Export this function so it can be called directly
  };
});
