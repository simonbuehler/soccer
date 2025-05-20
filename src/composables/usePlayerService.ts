import { inject, provide } from "vue";
import { Player, PlayerData } from "../core/models/Player";
import { useAppStore } from "../stores/appStore";

// Symbol für Dependency Injection
export const PlayerServiceSymbol = Symbol("PlayerService");

// Interface für den Service
export interface PlayerService {
  findPlayer(playerId: string): Player | undefined;
  getBenchPlayers(): Player[];
  getPitchPlayers(): Player[];
  addPlayer(playerData: PlayerData): boolean;
  isDuplicate(playerData: PlayerData): boolean;
  resolveNameConflicts(player: Player): void;
  movePlayer(
    playerId: string,
    options: { x?: number; y?: number; location?: "bench" | "pitch" }
  ): boolean;
  handlePlayerPositioning(
    playerId: string,
    targetX: number,
    targetY: number
  ): boolean;
}

/**
 * Composable für die Spielerverwaltung
 * @throws {Error} Wenn PlayerService nicht über providePlayerService bereitgestellt wurde
 * @returns {PlayerService} Der PlayerService mit allen Methoden
 */
export function usePlayerService(): PlayerService {
  const service = inject<PlayerService>(PlayerServiceSymbol);
  if (!service) {
    throw new Error("PlayerService nicht gefunden!");
  }
  return service;
}

/**
 * Stellt den PlayerService für die Anwendung bereit (Dependency Injection)
 * Diese Funktion MUSS in App.vue aufgerufen werden
 * @returns {PlayerService} Die erstellte Service-Instanz
 */
export function providePlayerService(): PlayerService {
  // Store für den Service bereitstellen
  const store = useAppStore();

  // Prüfen, ob der Store richtig initialisiert wurde
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

  // Service-Objekt mit allen Methoden
  const playerService: PlayerService = {
    // Spieler-Zugriffsmethoden
    findPlayer(playerId): Player | undefined {
      return store.findPlayerById(playerId);
    },

    getBenchPlayers(): Player[] {
      return store.benchPlayers;
    },

    getPitchPlayers(): Player[] {
      return store.fieldPlayers;
    },

    // Datenmanipulations-Methoden
    addPlayer(playerData): boolean {
      // Duplikatprüfung
      if (this.isDuplicate(playerData)) {
        return false;
      }

      // Erstelle neuen Spieler
      const player = new Player(playerData);

      // Löse Namenskonflikte
      this.resolveNameConflicts(player);

      // Zum Store hinzufügen (standardmäßig auf die Bank)
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
      // Alle Spieler mit dem gleichen Vornamen finden
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

    movePlayer(playerId, options): boolean {
      const player = this.findPlayer(playerId);
      if (!player) {
        return false;
      }

      let result = false;

      if (options.location && options.location !== player.location) {
        if (options.location === "pitch") {
          // Zur Position auf dem Feld bewegen
          result = store.movePlayerToField(
            playerId,
            options.x !== undefined ? options.x : player.percentX,
            options.y !== undefined ? options.y : player.percentY
          );
        } else if (options.location === "bench") {
          // Zur Bank bewegen
          result = store.movePlayerToBench(playerId);
        }
      } else if (
        player.location === "pitch" &&
        (options.x !== undefined || options.y !== undefined)
      ) {
        // Position auf dem Feld aktualisieren
        result = store.updatePlayerPosition(
          playerId,
          options.x !== undefined ? options.x : player.percentX,
          options.y !== undefined ? options.y : player.percentY
        );
      }

      return result;
    },

    handlePlayerPositioning(playerId, targetX, targetY) {
      console.log("handlePlayerPositioning", playerId, targetX, targetY);
      const player = this.findPlayer(playerId);
      if (!player) {
        return false;
      }

      // Validiere die Eingabeparameter
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

      // Direkte Positionierung ohne Snap-Logik oder Kollisionserkennung
      let result = false;

      // Prüfen, ob der Spieler bereits auf dem Feld ist oder neu hinzugefügt wird
      if (store.getPlayerLocation(playerId) === "bench") {
        // Spieler ist auf der Bank und muss zum Feld bewegt werden
        result = store.movePlayerToField(playerId, targetX, targetY);
        if (!result) {
          console.error("[PlayerService] Failed to move player to field", {
            player,
            coords: { x: targetX, y: targetY },
          });
          return false;
        }
      } else {
        // Spieler ist bereits auf dem Feld, nur Position aktualisieren
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

  // Service über Dependency Injection bereitstellen
  provide(PlayerServiceSymbol, playerService);
  return playerService;
}
