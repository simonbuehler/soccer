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
  isRequired?: boolean;
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
  const isRedistributing = ref(false);

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
        isRequired: !store.currentTactic?.name.includes("Frei"),
        x: pos.xPercent || pos.x || 0,
        y: pos.yPercent || pos.y || 0,
      })
    );
  }
  function redistributePlayers(): boolean {
    if (isRedistributing.value) {
      console.log("[TACTIC] Already redistributing, skipping");
      return false;
    }

    isRedistributing.value = true;

    try {
      if (!store.currentTactic?.positions?.length) {
        console.log("[TACTIC] No positions in tactic, skipping redistribution");
        return false;
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

      // Gather info about all players
      const fieldPlayers = [...store.fieldPlayers];
      const fieldPlayerIds = fieldPlayers.map((p) => p.id);
      const benchPlayerIds = store.benchPlayers.map((p) => p.id);

      console.log(
        `[TACTIC] Redistribution started: ${markers.length} positions, ${fieldPlayerIds.length} field players, ${benchPlayerIds.length} bench players`
      );

      // Determine which players we need to keep and add
      const totalPlayersNeeded = Math.min(
        markers.length,
        fieldPlayerIds.length + benchPlayerIds.length
      );

      // IMPROVED APPROACH: Don't just move players around blindly
      // Instead, make intelligent decisions about who stays and who goes
      if (fieldPlayerIds.length > totalPlayersNeeded) {
        // We have too many players on field - need to select who stays

        // Sort field players by priority (goalkeepers first, defenders second, etc)
        const sortedFieldPlayerIds = prioritizePlayers(fieldPlayerIds);

        // Players to keep on field
        const keepIds = sortedFieldPlayerIds.slice(0, totalPlayersNeeded);

        // Players to move to bench
        const moveIds = sortedFieldPlayerIds.slice(totalPlayersNeeded);

        console.log(
          `[TACTIC] Too many field players: keeping ${keepIds.length}, moving ${moveIds.length} to bench`
        );

        // Move excess players to bench
        moveIds.forEach((id) => {
          console.log(`[TACTIC] Moving player ${id} to bench (excess)`);
          store.movePlayerToBench(id);
        });
      } else if (fieldPlayerIds.length < totalPlayersNeeded) {
        // We need MORE players from bench
        const additionalPlayersNeeded = Math.min(
          totalPlayersNeeded - fieldPlayerIds.length,
          benchPlayerIds.length
        );

        if (additionalPlayersNeeded > 0 && benchPlayerIds.length > 0) {
          console.log(
            `[TACTIC] Need ${additionalPlayersNeeded} players from bench`
          );

          // Get players from bench (take the first N available)
          const benchIdsToMove = benchPlayerIds.slice(
            0,
            additionalPlayersNeeded
          );

          // Add them to temporary positions in the middle of the field
          benchIdsToMove.forEach((id, idx) => {
            const tempX = 50 + (idx % 3) * 10;
            const tempY = 50 + Math.floor(idx / 3) * 10;
            console.log(
              `[TACTIC] Moving player ${id} from bench to field at temporary position (${tempX}, ${tempY})`
            );
            store.movePlayerToField(id, tempX, tempY);
          });
        }
      }

      // Now we have the correct number of players on the field
      // Assign them to optimal positions
      console.log(`[TACTIC] Assigning players to positions`);

      // Special handling for goalkeeper (if any position is a goalkeeper position)
      const keeperPositions = markers.filter(
        (m) =>
          m.role?.toLowerCase().includes("keeper") ||
          m.role?.toLowerCase().includes("goalie") ||
          m.role?.toLowerCase().includes("torwart")
      );

      // Find players with goalkeeper role or #1
      const currentFieldPlayers = [...store.fieldPlayers];
      const keeperPlayers = currentFieldPlayers.filter((p) => p.number === 1);

      // If we have both keepers and keeper positions, match them first
      if (keeperPositions.length > 0 && keeperPlayers.length > 0) {
        const keeperMarker = keeperPositions[0];
        const keeper = keeperPlayers[0];

        console.log(
          `[TACTIC] Assigning keeper ${keeper.firstName} to position ${keeperMarker.role}`
        );
        keeperMarker.assigned = true;
        playerAssignmentMap.set(keeper.id, keeperMarker.index!);
        store.updatePlayerPosition(keeper.id, keeperMarker.x, keeperMarker.y);
      }

      // Now assign remaining players to positions
      // For each player, find the closest unassigned position
      const remainingPlayers = currentFieldPlayers.filter(
        (p) => !playerAssignmentMap.has(p.id)
      );

      remainingPlayers.forEach((player) => {
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
          `[TACTIC] Positioning ${player.firstName} at ${
            bestMarker.role
          } (${bestMarker.x.toFixed(1)}, ${bestMarker.y.toFixed(1)})`
        );
        store.updatePlayerPosition(player.id, bestMarker.x, bestMarker.y);
      });

      console.log(
        `[TACTIC] Redistribution complete: ${playerAssignmentMap.size}/${totalPlayersNeeded} players assigned`
      );
      return true;
    } catch (error) {
      console.error("[TACTIC] Error during player redistribution:", error);
      return false;
    } finally {
      isRedistributing.value = false;
    }
  }

  function prioritizePlayers(playerIds: string[]): string[] {
    return [...playerIds].sort((idA, idB) => {
      const playerA = store.findPlayerById(idA);
      const playerB = store.findPlayerById(idB);
      if (!playerA || !playerB) return 0;
      if (playerA.number === 1) return -1;
      if (playerB.number === 1) return 1;
      return playerA.percentY - playerB.percentY;
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
