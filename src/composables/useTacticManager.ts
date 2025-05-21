import { useAppStore } from "@/stores/appStore";
import {
  TACTICS,
  type Tactic,
  type TacticPosition,
} from "@/js/tactics/allTactics";
import { ref } from "vue";

interface Position {
  x: number;
  y: number;
  role: string;
  index?: number;
  assigned?: boolean;
  xPercent?: number;
  yPercent?: number;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  percentX: number;
  percentY: number;
  displayName: string;
}

interface AppStore {
  gameType: number;
  currentTactic: Tactic | null;
  fieldPlayers: Player[];
  benchPlayers: Player[];
  movePlayerToBench: (id: string) => void;
  movePlayerToField: (id: string | undefined, x: number, y: number) => boolean;
  updatePlayerPosition: (id: string, x: number, y: number) => void;
  findPlayerById: (id: string) => Player | undefined;
}

export function useTacticManager() {
  const store = useAppStore() as unknown as AppStore;

  function initializeGame(): void {
    store.gameType = 7;
    store.currentTactic =
      TACTICS[7 as keyof typeof TACTICS]?.find(
        (t: Tactic) => t.name === "Frei"
      ) || null;
  }

  function setGameType(playerCount: number): boolean {
    if (store.gameType === playerCount) return false;

    store.gameType = playerCount;
    const defaultTactic = TACTICS[playerCount as keyof typeof TACTICS]?.find(
      (t: Tactic) => t.name === "Frei"
    );
    if (defaultTactic) {
      store.currentTactic = defaultTactic;
      return true;
    }
    return false;
  }

  function setTactic(tacticName: string): boolean {
    if (!tacticName || !store.gameType) return false;

    const tactics = TACTICS[store.gameType as keyof typeof TACTICS];
    if (!tactics?.length) return false;

    const newTactic = tactics.find((t) => t.name === tacticName);
    if (!newTactic) return false;

    try {
      console.log(
        `[TACTIC] Setting tactic '${tacticName}' for game type ${store.gameType}`
      );

      // Log the current field players before tactic change
      console.log(
        `[TACTIC-DEBUG] Current field players before tactic change:`,
        store.fieldPlayers.map(
          (p) =>
            `${p.firstName} (${p.percentX.toFixed(0)}, ${p.percentY.toFixed(
              0
            )})`
        )
      );

      // Log current tactic info
      const oldTactic = store.currentTactic?.name || "none";
      console.log(
        `[TACTIC-DEBUG] Changing tactic from '${oldTactic}' to '${tacticName}'`
      );
      store.currentTactic = { ...newTactic };

      return true;
    } catch (e) {
      console.error("[TACTIC] Failed to set tactic:", e);
      return false;
    }
  }

  function getPositionMarkers(): Position[] {
    if (!store.currentTactic?.positions?.length) return [];

    return store.currentTactic.positions.map(
      (pos: TacticPosition, index: number) => ({
        ...pos,
        index,
        x: pos.xPercent || pos.x || 0,
        y: pos.yPercent || pos.y || 0,
      })
    );
  }
  function redistributePlayers(): boolean {
    try {
      // Check if a valid tactic exists
      if (!store.currentTactic) {
        console.log("[TACTIC] No tactic set, skipping redistribution");
        return false;
      }

      // Gather info about all players
      const fieldPlayers = [...store.fieldPlayers];
      const fieldPlayerIds = fieldPlayers.map((p) => p.id);
      const benchPlayerIds = store.benchPlayers.map((p) => p.id);
      
      // Check if positions are defined
      const hasPositions = !!store.currentTactic.positions?.length;

      // Determine max players allowed
      const maxAllowedPlayers = store.gameType;
      
      console.log(
        `[TACTIC] Redistribution started: ${maxAllowedPlayers} positions needed, ${fieldPlayerIds.length} field players, ${benchPlayerIds.length} bench players`
      );
      
      // Handle excess players for both free tactics and positioned tactics
      if (fieldPlayers.length > maxAllowedPlayers) {
        console.log(
          `[TACTIC] Found ${fieldPlayers.length} players on field but only ${maxAllowedPlayers} allowed`
        );

        // Sort players by priority
        const sortedIds = prioritizePlayers(fieldPlayerIds);

        // Players to move to bench
        const playersToMove = sortedIds.slice(maxAllowedPlayers);

        // Move excess players to bench
        playersToMove.forEach((id) => {
          const player = store.findPlayerById(id);
          console.log(
            `[TACTIC] Moving excess player ${player?.firstName || id} to bench`
          );
          store.movePlayerToBench(id);
        });
      }

      // If using a tactic without positions, we're done after limiting player count
      if (!hasPositions) {
        console.log("[TACTIC] Free tactic processing complete");
        return true;
      }
    
      // Create markers from tactic positions
      const playerAssignmentMap = new Map<string, number>();
      const markers: Position[] = store.currentTactic.positions.map(
        (pos: TacticPosition, index: number) => ({
          x: pos.xPercent || 0,
          y: pos.yPercent || 0,
          role: pos.role,
          assigned: false,
          index,
          xPercent: pos.xPercent,
          yPercent: pos.yPercent,
        })
      );

      // Ggf. fehlende Spieler von der Bank holen
      const neededPlayers = markers.length - store.fieldPlayers.length;
      
      if (neededPlayers > 0) {
        console.log(`[TACTIC] Need ${neededPlayers} players from bench`);
        
        // Temporäre Positionen für neue Spieler vom Mittelfeld aus verteilen
        for (let i = 0; i < neededPlayers; i++) {
          const tempX = 50 + (i % 3) * 10;
          const tempY = 50 + Math.floor(i / 3) * 10;
          
          console.log(`[TACTIC] Moving player from bench to field at temporary position (${tempX}, ${tempY})`);
          // Store-Methode nutzen, um automatisch einen Spieler auszuwählen
          store.movePlayerToField(undefined, tempX, tempY);
        }
      }

      // Spieler optimal auf Positionen verteilen
      assignPlayersToPositions(markers);

      console.log(
        `[TACTIC] Redistribution complete: ${playerAssignmentMap.size}/${markers.length} players assigned`
      );
      return true;
    } catch (error) {
      console.error("[TACTIC] Error during player redistribution:", error);
      return false;
    }
  }

  // Vereinfachte Funktion zur Spielerzuordnung ohne separates Keeper-Handling
  function assignPlayersToPositions(markers: Position[]): void {
    const currentFieldPlayers = [...store.fieldPlayers];
    const playerAssignmentMap = new Map<string, number>();
    
    // Sortiere Spieler nach Nummer (niedrigste zuerst)
    const sortedPlayers = [...currentFieldPlayers].sort((a, b) => a.number - b.number);
    
    // Jedem Spieler die passendste Position zuweisen
    sortedPlayers.forEach((player) => {
      const availableMarkers = markers.filter((m) => !m.assigned);
      if (availableMarkers.length === 0) return;

      // Find the closest marker for this player
      let bestMarker = availableMarkers[0];
      let minDistance = Infinity;

      availableMarkers.forEach((marker) => {
        const distance = Math.sqrt(
          Math.pow(player.percentX - marker.x, 2) +
            Math.pow(player.percentY - marker.y, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          bestMarker = marker;
        }
      });

      // Assign player to this marker
      bestMarker.assigned = true;
      playerAssignmentMap.set(player.id, bestMarker.index!);

      // Update player position
      console.log(
        `[TACTIC] Positioning ${player.firstName} (#${player.number}) at ${
          bestMarker.role
        } (${bestMarker.x.toFixed(1)}, ${bestMarker.y.toFixed(1)})`
      );
      store.updatePlayerPosition(player.id, bestMarker.x, bestMarker.y);
    });
  }

  // Verbesserte Spieler-Priorisierung
  function prioritizePlayers(playerIds: string[]): string[] {
    return [...playerIds].sort((idA, idB) => {
      const playerA = store.findPlayerById(idA);
      const playerB = store.findPlayerById(idB);
      if (!playerA || !playerB) return 0;
      
      // Priorität 1: Torhüter immer zuerst
      if (playerA.number === 1) return -1;
      if (playerB.number === 1) return 1;
      
      // Priorität 2: Sortiere nach Position (von hinten nach vorne)
      // Nutze die Y-Position als Indikator für die Position auf dem Feld
      return playerB.percentY- playerA.percentY ;
    });
  }

  function getTacticsForCurrentGameType(): Tactic[] {
    return TACTICS[store.gameType as keyof typeof TACTICS] || [];
  }

  function getCurrentGameType(): number {
    return store.gameType;
  }

  function getCurrentTactic(): Tactic | null {
    return store.currentTactic;
  }

  function getCurrentFieldPlayerCount(): number {
    return store.fieldPlayers.length;
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
    getCurrentFieldPlayerCount,
  };
}
