import { inject, provide } from "vue";
import { Player, PlayerData } from "../core/models/Player";
import { useAppStore } from "../stores/appStore";

/**
 * Injection symbol for PlayerService dependency injection
 */
export const PlayerServiceSymbol = Symbol("PlayerService");

/**
 * Service interface for player management operations
 */
export interface PlayerService {
  findPlayer(playerId: string): Player | undefined;
  getBenchPlayers(): Player[];
  getPitchPlayers(): Player[];
  addPlayer(playerData: PlayerData): boolean;
  isDuplicate(playerData: PlayerData): boolean;
  resolveNameConflicts(player: Player): void;

  handlePlayerPositioning(
    playerId: string,
    targetX: number,
    targetY: number
  ): boolean;
}

/**
 * Vue composable for accessing the PlayerService
 * @throws {Error} When PlayerService was not provided via providePlayerService
 * @returns {PlayerService} The PlayerService instance with all methods
 */
export function usePlayerService(): PlayerService {
  const service = inject<PlayerService>(PlayerServiceSymbol);
  if (!service) {
    throw new Error("PlayerService not found!");
  }
  return service;
}

/**
 * Provides PlayerService for the application (Dependency Injection)
 * This function MUST be called in App.vue
 * @returns {PlayerService} The created service instance
 */
export function providePlayerService(): PlayerService {
  // Get app store instance
  const store = useAppStore();

  // Verify store is properly initialized
  if (
    !store ||
    !store.fieldPlayers ||
    !store.benchPlayers ||
    !store.findPlayerById
  ) {
    console.error("[PlayerService] App store not correctly initialized!");
    throw new Error(
      "App store is not correctly initialized. Make sure Pinia is set up properly."
    );
  }

  // Create service object with all methods
  const playerService: PlayerService = {
    // Player access methods
    findPlayer(playerId): Player | undefined {
      return store.findPlayerById(playerId);
    },

    getBenchPlayers(): Player[] {
      return store.benchPlayers;
    },

    getPitchPlayers(): Player[] {
      return store.fieldPlayers;
    },

    // Data manipulation methods
    addPlayer(playerData): boolean {
      // Check for duplicate player (same number or full name)
      if (this.isDuplicate(playerData)) {
        return false;
      }

      // Create and initialize new player instance
      const player = new Player(playerData);

      // Resolve naming conflicts (same first names)
      this.resolveNameConflicts(player);

      // Add player to store (defaults to bench position)
      store.addPlayer(player);
      return true;
    },

    isDuplicate(playerData) {
      const allPlayers = [...store.fieldPlayers, ...store.benchPlayers];

      const isDuplicate = allPlayers.some(
        (p) =>
          p.number === playerData.number ||
          (p.firstName === playerData.firstName &&
            p.lastName === playerData.lastName &&
            playerData.lastName !== "")
      );

      return isDuplicate;
    },

    resolveNameConflicts(player): void {
      // Find players with matching first names
      const allPlayers = [...store.fieldPlayers, ...store.benchPlayers];
      const sameFirstNamePlayers = allPlayers.filter(
        (p) => p.firstName === player.firstName
      );

      if (sameFirstNamePlayers.length > 0) {
        const sameInitial = player.lastName.charAt(0).toUpperCase();
        const sameInitialPlayers = sameFirstNamePlayers.filter(
          (p) => p.lastName.charAt(0).toUpperCase() === sameInitial
        );

        if (sameInitialPlayers.length > 0) {
          sameInitialPlayers.forEach((p) => p.updateDisplayName(true));
          player.updateDisplayName(true);
        } else if (player.lastName) {
          sameFirstNamePlayers.forEach((p) => p.updateDisplayName(false, true));
          player.updateDisplayName(false, true);
        }
      }
    },

    handlePlayerPositioning(playerId, targetX, targetY) {
      console.log("handlePlayerPositioning", playerId, targetX, targetY);
      const player = this.findPlayer(playerId);
      if (!player) {
        return false;
      }

      // Validate coordinate parameters
      if (
        targetX === undefined ||
        targetY === undefined ||
        isNaN(targetX) ||
        isNaN(targetY)
      ) {
        console.error("[PlayerService] Invalid coordinates", {
          targetX,
          targetY,
        });
        return false;
      }

      // Direct positioning without snap logic or collision detection
      let result = false;

      // Handle bench-to-field transition
      if (store.getPlayerLocation(playerId) === "bench") {
        // Move from bench to field with coordinates
        result = store.movePlayerToField(playerId, targetX, targetY);
        if (!result) {
          console.error("[PlayerService] Failed to move player to field", {
            player,
            coords: { x: targetX, y: targetY },
          });
          return false;
        }
      } else {
        // Update existing field position
        result = store.updatePlayerPosition(playerId, targetX, targetY);
        if (!result) {
          console.error("[PlayerService] Failed to update player position", {
            player,
            coords: { x: targetX, y: targetY },
          });
          return false;
        }
      }

      return true;
    },
  };

  // Provide service via Dependency Injection
  provide(PlayerServiceSymbol, playerService);
  return playerService;
}
