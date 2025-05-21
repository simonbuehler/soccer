import { useAppStore } from "@/stores/appStore";
import {
  TACTICS,
  type Tactic,
  type TacticPosition,
} from "@/js/tactics/allTactics";
import { ref } from "vue";

/**
 * Represents a position on the soccer pitch
 */
interface Position {
  x: number;
  y: number;
  role: string;
  index?: number;
  assigned?: boolean;
  xPercent?: number;
  yPercent?: number;
}

/**
 * Player data structure for tactic management
 */
interface Player {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  percentX: number;
  percentY: number;
  displayName: string;
}

/**
 * App store interface for tactic management
 */
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

/**
 * Composable for managing soccer tactics and player positioning
 * @returns Object with tactic management methods
 */
export function useTacticManager() {
  const store = useAppStore() as unknown as AppStore;

  /**
   * Initializes game with default settings
   */
  function initializeGame(): void {
    store.gameType = 7;
    store.currentTactic =
      TACTICS[7 as keyof typeof TACTICS]?.find(
        (t: Tactic) => t.name === "Frei"
      ) || null;
  }

  /**
   * Sets the game type (number of players)
   * @param playerCount - Number of players (e.g. 7 for 7v7)
   * @returns true if successful, false otherwise
   */
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

  /**
   * Sets the current tactic
   * @param tacticName - Name of the tactic to set
   * @returns true if successful, false otherwise
   */
  function setTactic(tacticName: string): boolean {
    if (!tacticName || !store.gameType) return false;

    const tactics = TACTICS[store.gameType as keyof typeof TACTICS];
    if (!tactics?.length) return false;

    const newTactic = tactics.find((t) => t.name === tacticName);
    if (!newTactic) return false;

    try {
      console.debug(
        `[TACTIC] Setting tactic '${tacticName}' for game type ${store.gameType}`
      );

      // Debug log current field players before tactic change
      console.debug(
        `[TACTIC] Current field players:`,
        store.fieldPlayers.map(
          (p) =>
            `${p.firstName} (${p.percentX.toFixed(0)}, ${p.percentY.toFixed(0)})`
        )
      );

      // Debug log tactic transition
      const oldTactic = store.currentTactic?.name || "none";
      console.debug(
        `[TACTIC] Changing from '${oldTactic}' to '${tacticName}'`
      );
      store.currentTactic = { ...newTactic };

      return true;
    } catch (e) {
      console.error("[TACTIC] Failed to set tactic:", e);
      return false;
    }
  }

  /**
   * Gets position markers for the current tactic
   * @returns Array of position markers
   */
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
  /**
   * Redistributes players according to current tactic
   * @returns true if successful, false otherwise
   */
  function redistributePlayers(): boolean {
    try {
      // Check if a valid tactic exists
      if (!store.currentTactic) {
        console.debug("[TACTIC] No tactic set - skipping redistribution");
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
      
      console.debug(
        `[TACTIC] Redistributing ${fieldPlayerIds.length} field players and ${benchPlayerIds.length} bench players to ${maxAllowedPlayers} positions`
      );
      
      // Handle excess players for both free tactics and positioned tactics
      if (fieldPlayers.length > maxAllowedPlayers) {
        console.debug(
          `[TACTIC] Moving ${fieldPlayers.length - maxAllowedPlayers} excess players to bench`
        );

        // Sort players by priority
        const sortedIds = prioritizePlayers(fieldPlayerIds);

        // Players to move to bench
        const playersToMove = sortedIds.slice(maxAllowedPlayers);

        // Move excess players to bench
        playersToMove.forEach((id) => {
          const player = store.findPlayerById(id);
          console.debug(
            `[TACTIC] Moving player ${player?.firstName || id} to bench`
          );
          store.movePlayerToBench(id);
        });
      }

      // If using a tactic without positions, we're done after limiting player count
      if (!hasPositions) {
        console.debug("[TACTIC] Free tactic - no position assignments needed");
        return true;
      }
    
      // Create markers from tactic positions
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

      // Get needed players from bench if necessary
      const neededPlayers = markers.length - store.fieldPlayers.length;
      
      if (neededPlayers > 0) {
        console.debug(`[TACTIC] Adding ${neededPlayers} players from bench`);
        
        // Assign temporary midfield positions for new players
        for (let i = 0; i < neededPlayers; i++) {
          const tempX = 50 + (i % 3) * 10;
          const tempY = 50 + Math.floor(i / 3) * 10;
          
          console.debug(`[TACTIC] Moving bench player to temporary position (${tempX}, ${tempY})`);
          // Use store method to auto-select a player
          store.movePlayerToField(undefined, tempX, tempY);
        }
      }

      // Optimally distribute players to positions
      assignPlayersToPositions(markers);

      const assignedCount = markers.filter(m => m.assigned).length;
      console.debug(
        `[TACTIC] Redistribution complete - ${assignedCount} of ${markers.length} positions filled`
      );
      return true;
    } catch (error) {
      console.error("[TACTIC] Error during player redistribution:", error);
      return false;
    }
  }

  // Assigns players to positions based on proximity
  function assignPlayersToPositions(markers: Position[]): void {
    const currentFieldPlayers = [...store.fieldPlayers];
    
    // Sort players by number (lowest first)
    const sortedPlayers = [...currentFieldPlayers].sort((a, b) => a.number - b.number);
    
      // Assign each player to the most suitable position
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

      // Assign player to this marker if not already assigned
      if (!bestMarker.assigned) {
        bestMarker.assigned = true;
        console.debug(
          `[TACTIC] Assigning ${player.firstName} (#${player.number}) to ${bestMarker.role} position`
        );
        store.updatePlayerPosition(player.id, bestMarker.x, bestMarker.y);
      } else {
        console.debug(
          `[TACTIC] Position ${bestMarker.role} already assigned - keeping player at current position`
        );
      }
    });
  }

  // Prioritizes players for position assignment
  function prioritizePlayers(playerIds: string[]): string[] {
    return [...playerIds].sort((idA, idB) => {
      const playerA = store.findPlayerById(idA);
      const playerB = store.findPlayerById(idB);
      if (!playerA || !playerB) return 0;
      
      // Priority 1: Goalkeeper always first
      if (playerA.number === 1) return -1;
      if (playerB.number === 1) return 1;
      
      // Priority 2: Sort by position (back to front)
      // Uses Y-position as indicator for field position
      return playerB.percentY- playerA.percentY ;
    });
  }

  /**
   * Gets available tactics for current game type
   * @returns Array of tactics
   */
  function getTacticsForCurrentGameType(): Tactic[] {
    return TACTICS[store.gameType as keyof typeof TACTICS] || [];
  }

  /**
   * Gets current game type
   * @returns Number of players (e.g. 7 for 7v7)
   */
  function getCurrentGameType(): number {
    return store.gameType;
  }

  /**
   * Gets current tactic
   * @returns Current tactic or null if none set
   */
  function getCurrentTactic(): Tactic | null {
    return store.currentTactic;
  }

  /**
   * Gets count of players currently on field
   * @returns Number of field players
   */
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
