import { defineStore } from "pinia";
import { ref, computed, Ref } from "vue";
import { Player } from "../core/models/Player";

/**
 * Main store for the Soccer App
 * Manages players, tactics and game configurations
 */
export const useAppStore = defineStore("app", () => {
  // State: Reactive base data
  const fieldPlayers: Ref<Player[]> = ref([]);
  const benchPlayers: Ref<Player[]> = ref([]);
  const currentTactic: Ref<any> = ref(null);
  const gameType: Ref<number> = ref(7);

  // Getters as computed properties
  const allPlayers = computed(() => [
    ...fieldPlayers.value,
    ...benchPlayers.value,
  ]);

  // Player management methods
  function findPlayerById(playerId: string): Player | undefined {
    return allPlayers.value.find((p) => p.id === playerId);
  }

  /**
   * Determines a player's location based on which array they're in
   * @param playerId - Player ID to check
   * @returns "bench" | "pitch" or undefined if player not found
   */
  function getPlayerLocation(playerId: string): "bench" | "pitch" | undefined {
    if (fieldPlayers.value.some((p) => p.id === playerId)) return "pitch";
    if (benchPlayers.value.some((p) => p.id === playerId)) return "bench";
    return undefined;
  }

  /**
   * Moves a player from bench to pitch
   * Includes player limit check
   * @param playerId - Player ID (or undefined to auto-select first bench player)
   * @param x - X coordinate in percent (0-100)
   * @param y - Y coordinate in percent (0-100)
   * @returns true if successful, false otherwise
   */
  function movePlayerToField(
    playerId: string | undefined,
    x: number,
    y: number
  ): boolean {
    if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
      console.error("[AppStore] Invalid coordinates", { x, y });
      return false;
    }

    // Check player limit when adding from bench
    const fromBench = playerId ? benchPlayers.value.some((p) => p.id === playerId) : true;
    if (fromBench && fieldPlayers.value.length >= gameType.value) {
      console.warn(
        `[AppStore] Maximum player count (${gameType.value}) exceeded, preventing move`
      );
      return false;
    }

    // If no ID provided, take first bench player
    let index = -1;

    if (!playerId && benchPlayers.value.length > 0) {
      // Auto-select first bench player
      index = 0;
      playerId = benchPlayers.value[0].id;
      console.debug(
        `[AppStore] Auto-selecting bench player: ${benchPlayers.value[0].firstName}`
      );
    } else if (playerId) {
      // Find specific player
      index = benchPlayers.value.findIndex((p) => p.id === playerId);
    }

    // Check if player was found
    if (index === -1) {
      console.error("[AppStore] No player found to move to field", {
        playerId,
      });
      return false;
    }

    // Extract the player
    const player = benchPlayers.value.splice(index, 1)[0];

    // Update properties
    player.percentX = Number(x);
    player.percentY = Number(y);

    // Add to field
    fieldPlayers.value.push(player);

    console.debug(
      `[AppStore] Moved ${player.firstName} to field (${x}, ${y})`
    );
    return true;
  }

  /**
   * Moves a player from pitch to bench
   * @param playerId - ID of player to move
   * @returns true if successful, false otherwise
   */
  function movePlayerToBench(playerId: string): boolean {
    // No location check needed - we check the array directly
    const index = fieldPlayers.value.findIndex((p) => p.id === playerId);
    if (index === -1) return false;

    // Extract the player
    const player = fieldPlayers.value.splice(index, 1)[0];

    // Add to bench
    benchPlayers.value.push(player);

    console.debug(`[AppStore] Moved ${player.firstName} to bench`);
    return true;
  }

  /**
   * Updates a player's position on the pitch
   * @param playerId - ID of player to move
   * @param x - New X coordinate (0-100)
   * @param y - New Y coordinate (0-100)
   * @returns true if successful, false otherwise
   */
  function updatePlayerPosition(
    playerId: string,
    x: number,
    y: number
  ): boolean {
    if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
      console.error("[AppStore] Invalid coordinates", { x, y });
      return false;
    }

    // Player must be on field - search fieldPlayers directly
    const player = fieldPlayers.value.find((p) => p.id === playerId);
    if (!player) return false;

    // Only update coordinates if they actually changed
    if (player.percentX === Number(x) && player.percentY === Number(y)) {
      return true; // No change needed
    }

    player.percentX = Number(x);
    player.percentY = Number(y);
    return true;
  }

  /**
   * Swaps two players (either positions or locations)
   * @param player1Id - First player ID
   * @param player2Id - Second player ID
   * @returns true if successful, false otherwise
   */
  function swapPlayers(player1Id: string, player2Id: string): boolean {
    // Find players
    const player1 = findPlayerById(player1Id);
    const player2 = findPlayerById(player2Id);

    if (!player1 || !player2) return false;

    // Check player locations
    const isPlayer1OnField = fieldPlayers.value.some((p) => p.id === player1Id);
    const isPlayer2OnField = fieldPlayers.value.some((p) => p.id === player2Id);

    // Case 1: Both players on field - simple position swap
    if (isPlayer1OnField && isPlayer2OnField) {
      // Save and swap positions
      const tempX = player1.percentX;
      const tempY = player1.percentY;

      // Update positions using existing methods
      updatePlayerPosition(player1Id, player2.percentX, player2.percentY);
      updatePlayerPosition(player2Id, tempX, tempY);

      return true;
    }

    // Case 2: Player 1 on bench, Player 2 on field
    if (!isPlayer1OnField && isPlayer2OnField) {
      // Save player 2's position
      const posX = player2.percentX;
      const posY = player2.percentY;

      // Move player 2 to bench
      if (!movePlayerToBench(player2Id)) return false;

      // Move player 1 to field at player 2's position
      return movePlayerToField(player1Id, posX, posY);
    }

    // Case 3: Player 1 on field, Player 2 on bench
    if (isPlayer1OnField && !isPlayer2OnField) {
      // Save player 1's position
      const posX = player1.percentX;
      const posY = player1.percentY;

      // Move player 1 to bench
      if (!movePlayerToBench(player1Id)) return false;

      // Move player 2 to field at player 1's position
      return movePlayerToField(player2Id, posX, posY);
    }

    // Case 4: Both players on bench - nothing to do
    return false;
  }

  /**
   * Adds a new player to the bench
   * @param player - Player instance to add
   * @returns The added player's ID
   */
  function addPlayer(player: Player): string {
    // Add to bench
    benchPlayers.value.push(player);

    console.debug(`[AppStore] Added ${player.firstName} to bench`);
    return player.id;
  }

  /**
   * Safe method to get bench player info
   * Returns only essential, safe information
   * @param index - Bench position index
   * @returns Player info object or null if invalid index
   */
  function getBenchPlayerInfo(
    index: number
  ): { id: string; name: string } | null {
    if (index < 0 || index >= benchPlayers.value.length) {
      return null;
    }

    const player = benchPlayers.value[index];
    return {
      id: player.id,
      name: player.firstName,
    };
  }

  // Expose public API
  return {
    // State
    fieldPlayers,
    benchPlayers,
    currentTactic,
    gameType,

    // Getters
    allPlayers,
    getPlayerLocation,
    getBenchPlayerInfo,

    // Actions
    findPlayerById,
    addPlayer,
    movePlayerToField,
    movePlayerToBench,
    updatePlayerPosition,
    swapPlayers,
  };
});
