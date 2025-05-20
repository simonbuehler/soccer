import { defineStore } from "pinia";
import { ref, computed, Ref } from "vue";
import { Player } from "../core/models/Player";

/**
 * Hauptstore für die Soccer-App
 * Verwaltet Spieler, Taktiken und Spielkonfigurationen
 */
export const useAppStore = defineStore("app", () => {
  // State: Reaktive Grunddaten
  const fieldPlayers: Ref<Player[]> = ref([]);
  const benchPlayers: Ref<Player[]> = ref([]);
  const currentTactic: Ref<any> = ref(null);
  const gameType: Ref<number> = ref(7);

  // Getters als Computed Properties
  const allPlayers = computed(() => [
    ...fieldPlayers.value,
    ...benchPlayers.value,
  ]);

  // Spielerverwaltungsmethoden
  function findPlayerById(playerId: string): Player | undefined {
    return allPlayers.value.find((p) => p.id === playerId);
  }

  /**
   * Ermittelt die Location eines Spielers basierend auf dem Array, in dem er sich befindet
   * @param playerId ID des Spielers
   * @returns "bench" | "pitch" oder undefined wenn Spieler nicht gefunden
   */
  function getPlayerLocation(playerId: string): "bench" | "pitch" | undefined {
    if (fieldPlayers.value.some((p) => p.id === playerId)) return "pitch";
    if (benchPlayers.value.some((p) => p.id === playerId)) return "bench";
    return undefined;
  }

  /**
   * Bewegt einen Spieler von der Bank auf das Feld
   * @param playerId ID des Spielers oder undefined/leer für automatische Auswahl
   * @param x X-Koordinate in Prozent (0-100)
   * @param y Y-Koordinate in Prozent (0-100)
   * @returns true wenn erfolgreich, false sonst
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

    // Wenn keine ID angegeben ist, nehme den ersten Spieler von der Bank
    let index = -1;

    if (!playerId && benchPlayers.value.length > 0) {
      // Automatisch den ersten Spieler von der Bank nehmen
      index = 0;
      playerId = benchPlayers.value[0].id;
      console.log(
        `[AppStore] Auto-selecting first bench player: ${benchPlayers.value[0].firstName}`
      );
    } else if (playerId) {
      // Spezifischen Spieler suchen
      index = benchPlayers.value.findIndex((p) => p.id === playerId);
    }

    // Überprüfen ob ein Spieler gefunden wurde
    if (index === -1) {
      console.error("[AppStore] No player found to move to field", {
        playerId,
      });
      return false;
    }

    // Extrahiere den Spieler
    const player = benchPlayers.value.splice(index, 1)[0];

    // Aktualisiere Eigenschaften
    player.percentX = Number(x);
    player.percentY = Number(y);

    // Zum Feld hinzufügen
    fieldPlayers.value.push(player);

    console.log(
      `[AppStore] Player ${player.firstName} moved to field at (${x}, ${y})`
    );
    return true;
  }

  /**
   * Bewegt einen Spieler vom Feld auf die Bank
   */
  function movePlayerToBench(playerId: string): boolean {
    // Hier benötigen wir keinen Check für location mehr - wir prüfen direkt das Array
    const index = fieldPlayers.value.findIndex((p) => p.id === playerId);
    if (index === -1) return false;

    // Extrahiere den Spieler
    const player = fieldPlayers.value.splice(index, 1)[0];

    // Zur Bank hinzufügen
    benchPlayers.value.push(player);

    console.log(`[AppStore] Player ${player.firstName} moved to bench`);
    return true;
  }

  /**
   * Aktualisiert die Position eines Spielers auf dem Feld
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

    // Spieler muss auf dem Feld sein - deshalb fieldPlayers direkt durchsuchen
    const player = fieldPlayers.value.find((p) => p.id === playerId);
    if (!player) return false;

    // Koordinaten nur ändern, wenn sie sich wirklich geändert haben
    if (player.percentX === Number(x) && player.percentY === Number(y)) {
      return true; // Keine Änderung nötig
    }

    player.percentX = Number(x);
    player.percentY = Number(y);
    return true;
  }

  /**
   * Tauscht zwei Spieler aus (entweder Positionen oder Standorte)
   */
  function swapPlayers(player1Id: string, player2Id: string): boolean {
    // Spieler finden
    const player1 = findPlayerById(player1Id);
    const player2 = findPlayerById(player2Id);

    if (!player1 || !player2) return false;

    // Prüfen, wo sich die Spieler befinden
    const isPlayer1OnField = fieldPlayers.value.some((p) => p.id === player1Id);
    const isPlayer2OnField = fieldPlayers.value.some((p) => p.id === player2Id);

    // Fall 1: Beide Spieler sind auf dem Feld - einfacher Positionstausch
    if (isPlayer1OnField && isPlayer2OnField) {
      // Positionen speichern und tauschen
      const tempX = player1.percentX;
      const tempY = player1.percentY;

      // Aktualisiere Positionen - verwende dafür die bestehenden Methoden
      updatePlayerPosition(player1Id, player2.percentX, player2.percentY);
      updatePlayerPosition(player2Id, tempX, tempY);

      return true;
    }

    // Fall 2: Spieler 1 ist auf der Bank, Spieler 2 auf dem Feld
    if (!isPlayer1OnField && isPlayer2OnField) {
      // Speichere die Position von Spieler 2
      const posX = player2.percentX;
      const posY = player2.percentY;

      // Bewege Spieler 2 zur Bank
      if (!movePlayerToBench(player2Id)) return false;

      // Bewege Spieler 1 zum Feld an die Position von Spieler 2
      return movePlayerToField(player1Id, posX, posY);
    }

    // Fall 3: Spieler 1 ist auf dem Feld, Spieler 2 auf der Bank
    if (isPlayer1OnField && !isPlayer2OnField) {
      // Speichere die Position von Spieler 1
      const posX = player1.percentX;
      const posY = player1.percentY;

      // Bewege Spieler 1 zur Bank
      if (!movePlayerToBench(player1Id)) return false;

      // Bewege Spieler 2 zum Feld an die Position von Spieler 1
      return movePlayerToField(player2Id, posX, posY);
    }

    // Fall 4: Beide Spieler sind auf der Bank - nichts zu tun
    return false;
  }

  /**
   * Fügt einen neuen Spieler zur Bank hinzu
   */
  function addPlayer(player: Player): string {
    // Hinzufügen zur Bank
    benchPlayers.value.push(player);

    console.log(`[AppStore] Player ${player.firstName} added to bench`);
    return player.id;
  }

  /**
   * Sichere Methode um einen Spieler mit ID zu erhalten
   * Gibt nur die wichtigen, sicheren Informationen zurück
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

  // Exportieren der öffentlichen API
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
