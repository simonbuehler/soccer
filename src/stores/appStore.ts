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
  console.log('[AppStore] Initializing app store');

  // Spieler-Management-Methoden
  function findPlayerById(playerId: string): Player | undefined {
    // Suche erst auf dem Feld, dann auf der Bank
    const fieldPlayer = fieldPlayers.value.find(p => p.id === playerId);
    if (fieldPlayer) return fieldPlayer;
    
    return benchPlayers.value.find(p => p.id === playerId);
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
      console.error('[AppStore] Invalid coordinates for movePlayerToField', { x, y });
      return false;
    }
    
    // Wenn Spieler auf der Bank ist, verschiebe ihn zum Feld
    if (player.location === "bench") {
      const index = benchPlayers.value.findIndex(p => p.id === playerId);
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
    const index = fieldPlayers.value.findIndex(p => p.id === playerId);
    if (index !== -1) {
      const [removedPlayer] = fieldPlayers.value.splice(index, 1);
      // location wird automatisch durch den Watcher gesetzt
      benchPlayers.value.push(removedPlayer);
      return true;
    }
    
    return false;
  }
  
  function updatePlayerPosition(playerId: string, x: number, y: number): boolean {
    const player = findPlayerById(playerId);
    if (!player || player.location !== "pitch") return false;

    // Koordinaten-Validierung hinzugefügt
    if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
      console.error('[AppStore] Invalid coordinates for updatePlayerPosition', { x, y });
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
      // Verschiebe Spieler 1 zum Standort von Spieler 2
      if (player1.location === "bench") {
        movePlayerToField(player1.id, player2.percentX, player2.percentY);
        movePlayerToBench(player2.id);
      } else {
        movePlayerToField(player2.id, player1.percentX, player1.percentY);
        movePlayerToBench(player1.id);
      }
      return true;
    }
    
    return false;
  }
  
  // NEU: Watcher für die Spielerlisten, um location automatisch anzupassen
  watch(fieldPlayers, (newPlayers) => {
    console.log('[AppStore] Watching field players:', newPlayers);
    newPlayers.forEach(player => {
      console.log(`[AppStore] Checking player ${player.id} location`);
      if (player.location !== "pitch") {
        console.log(`[AppStore] Updating player ${player.id} location to 'pitch'`);
        player.location = "pitch";
      }
    });
  }, );

  watch(benchPlayers, (newPlayers) => {
    console.log('[AppStore] Watching bench players:', newPlayers);
    newPlayers.forEach(player => {
      console.log(`[AppStore] Checking player ${player.id} location`);
      if (player.location !== "bench") {
        console.log(`[AppStore] Updating player ${player.id} location to 'bench'`);
        player.location = "bench";
      }
    });
  }, );
  
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
    swapPlayers
  };
});