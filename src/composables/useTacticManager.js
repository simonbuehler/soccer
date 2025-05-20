import { useAppStore } from "@/stores/appStore";
import { TACTICS } from "@/js/tactics/allTactics";
import { ref } from "vue";

/**
 * Composable für die Verwaltung von Taktiken und Spielerpositionierung
 */
export function useTacticManager() {
  const store = useAppStore();
  const isRedistributing = ref(false);

  /**
   * Initialisiert das Spiel mit Standardwerten
   */
  function initializeGame() {
    store.gameType = 7;
    store.currentTactic = TACTICS[7]?.find((t) => t.name === "Frei");
  }

  /**
   * Ändert den Spieltyp (7er, 9er, 11er)
   */
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

  /**
   * Wählt eine Taktik für den aktuellen Spieltyp aus
   */
  function setTactic(tacticName) {
    if (!tacticName || !store.gameType) return false;

    const tactics = TACTICS[store.gameType];
    if (!tactics?.length) return false;

    const newTactic = tactics.find((t) => t.name === tacticName);
    if (!newTactic) return false;

    try {
      console.log(`[TACTIC] Setting tactic '${tacticName}' for game type ${store.gameType}`);
      // Kopie des Taktikobjekts erstellen, um Referenzprobleme zu vermeiden
      store.currentTactic = { ...newTactic };
      return true;
    } catch (e) {
      console.error("[TACTIC] Failed to set tactic:", e);
      return false;
    }
  }

  /**
   * Gibt die Positionsmarkierungen für die aktuelle Taktik zurück
   */
  function getPositionMarkers() {
    if (!store.currentTactic?.positions?.length) return [];

    return store.currentTactic.positions.map((pos, index) => ({
      ...pos,
      index,
      isRequired: !store.currentTactic.name.includes("Frei"),
      x: pos.xPercent || pos.x,
      y: pos.yPercent || pos.y,
    }));
  }

  /**
   * Verteilt die Spieler gemäß der aktuellen Taktik
   */
  function redistributePlayers() {
    // Vermeide Rekursion
    if (isRedistributing.value) {
      console.log("[TACTIC] Already redistributing, skipping");
      return false;
    }
    
    isRedistributing.value = true;
    
    try {
      // Frühe Abbruchbedingung: Taktik hat keine definierten Positionen
      if (!store.currentTactic?.positions?.length) {
        console.log("[TACTIC] No positions in tactic, skipping redistribution");
        return false;
      }

      console.log("[TACTIC] Redistributing players to tactic positions");
      console.log("[TACTIC] Current field players:", 
                  store.fieldPlayers.map(p => `${p.firstName}(${p.percentX?.toFixed(0) || '?'}/${p.percentY?.toFixed(0) || '?'})`).join(", "));

      // Hilfsvariablen initialisieren
      const playerAssignmentMap = new Map();
      
      // WICHTIG: markers enthält die ORIGINALEN Positionsmarker
      const markers = store.currentTactic.positions.map((pos, index) => ({
        x: pos.xPercent || pos.x,
        y: pos.yPercent || pos.y,
        role: pos.role || `Pos ${index + 1}`,
        assigned: false, // Markiert, ob diesem Marker bereits ein Spieler zugewiesen ist
        index,
      }));

      // Logge alle verfügbaren Positionen
      console.log("[TACTIC] Available positions:", 
                  markers.map(m => `${m.role}(${m.x.toFixed(0)}/${m.y.toFixed(0)})`).join(", "));

      // PHASE 1: Überschüssige Spieler auf die Bank verschieben
      const playerIds = [...store.fieldPlayers].map((p) => p.id);
      const excessCount = playerIds.length - markers.length;

      if (excessCount > 0) {
        console.log(`[TACTIC] Moving ${excessCount} excess players to bench`);

        // Spieler nach Priorität sortieren
        const rankedPlayerIds = prioritizePlayers(playerIds);
        const playersToMove = rankedPlayerIds.slice(markers.length);

        // Überschüssige Spieler auf die Bank verschieben
        playersToMove.forEach((id) => {
          store.movePlayerToBench(id);
        });
      }

      // PHASE 2: Spieler auf dem Feld optimal zuordnen
      // Aktuelle Spieler auf dem Feld NACH Phase 1
      const fieldPlayers = [...store.fieldPlayers];
      console.log("[TACTIC] Assigning positions for players:", 
                  fieldPlayers.map(p => p.firstName).join(", "));

      // VERBESSERT: Proximity-Schwellwert erhöhen, damit Spieler besser Positionen zugeordnet werden
      const PROXIMITY_THRESHOLD = 25; // War zu niedrig mit 15%, jetzt 25% des Spielfelds

      // PHASE 2.1: Spieler nahe an Positionen zuordnen
      fieldPlayers.forEach(player => {
        if (playerAssignmentMap.has(player.id)) return; // Bereits zugeordnet
        
        let bestMarker = null;
        let minDistance = PROXIMITY_THRESHOLD;
        
        markers.forEach(marker => {
          if (marker.assigned) return; // Bereits belegt
          
          const distance = calculateDistance(
            player.percentX, player.percentY,
            marker.x, marker.y
          );
          
          // Debug-Ausgabe für jeden Spieler und jede Position
          console.log(`[TACTIC-DEBUG] Distance from ${player.firstName}(${player.percentX.toFixed(0)}/${player.percentY.toFixed(0)}) to position ${marker.role}(${marker.x.toFixed(0)}/${marker.y.toFixed(0)}): ${distance.toFixed(1)}`);
          
          if (distance < minDistance) {
            minDistance = distance;
            bestMarker = marker;
          }
        });
        
        if (bestMarker) {
          bestMarker.assigned = true;
          playerAssignmentMap.set(player.id, bestMarker.index);
          
          // WICHTIG: Immer die Position aktualisieren, auch wenn der Spieler "nahe" ist
          const oldX = player.percentX;
          const oldY = player.percentY;
          
          store.updatePlayerPosition(player.id, bestMarker.x, bestMarker.y);
          
          console.log(
            `[TACTIC] Player ${player.firstName} assigned to position ${bestMarker.role} (${bestMarker.x.toFixed(0)}/${bestMarker.y.toFixed(0)}) from (${oldX.toFixed(0)}/${oldY.toFixed(0)})`
          );
        } else {
          console.log(`[TACTIC] Player ${player.firstName} not near any position`);
        }
      });

      // PHASE 2.2: Restliche Spieler optimal verteilen
      const unassignedPlayers = fieldPlayers.filter(p => !playerAssignmentMap.has(p.id));
      const freeMarkers = markers.filter(m => !m.assigned);
      
      console.log(
        `[TACTIC] Finding optimal positions for ${unassignedPlayers.length} remaining players:`,
        unassignedPlayers.map(p => p.firstName).join(", ")
      );
      console.log(
        `[TACTIC] Free positions:`, 
        freeMarkers.map(m => `${m.role}(${m.x.toFixed(0)}/${m.y.toFixed(0)})`).join(", ")
      );

      // Für jeden noch nicht zugewiesenen Spieler...
      unassignedPlayers.forEach(player => {
        if (freeMarkers.length === 0) {
          console.log(`[TACTIC-WARN] No more free positions for ${player.firstName}`);
          return;
        }
        
        // Besten freien Marker finden
        let bestMarker = null;
        let minDistance = Infinity;
        
        freeMarkers.forEach(marker => {
          const distance = calculateDistance(
            player.percentX, player.percentY,
            marker.x, marker.y
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            bestMarker = marker;
          }
        });
        
        // Position zuweisen
        if (bestMarker) {
          const markerIndex = freeMarkers.indexOf(bestMarker);
          freeMarkers.splice(markerIndex, 1);
          
          playerAssignmentMap.set(player.id, bestMarker.index);
          const oldX = player.percentX;
          const oldY = player.percentY;
          
          store.updatePlayerPosition(player.id, bestMarker.x, bestMarker.y);
          
          console.log(
            `[TACTIC] Player ${player.firstName} optimally moved to position ${bestMarker.role} (${bestMarker.x.toFixed(0)}/${bestMarker.y.toFixed(0)}) from (${oldX.toFixed(0)}/${oldY.toFixed(0)})`
          );
        }
      });

      // PHASE 3: Freie Positionen mit Spielern von der Bank füllen
      if (freeMarkers.length > 0 && store.benchPlayers.length > 0) {
        console.log(`[TACTIC] Filling ${freeMarkers.length} positions from bench`);

        // Stabil: Speichere die IDs der Bench-Spieler, bevor wir sie bewegen
        const benchPlayerIds = store.benchPlayers.map(player => player.id);
        
        // Verwende die kürzere von beiden Listen
        const positionsToFill = Math.min(freeMarkers.length, benchPlayerIds.length);
        
        // Iteriere über die verfügbaren Positionen und IDs
        for (let i = 0; i < positionsToFill; i++) {
          const playerId = store.get
          const marker = freeMarkers[i];
          
          if (!playerId) {
            console.warn(`[TACTIC] No player ID at bench index ${i}`);
            continue;
          }
          
          // LOGGING: Mehr Details für Debugging
          const playerName = store.findPlayerById(playerId)?.firstName || 'Unknown';
          console.log(`[TACTIC] Moving player ${playerName} (${playerId}) to position ${marker.x.toFixed(1)}/${marker.y.toFixed(1)}`);
          
          // KORRIGIERT: Zuerst eine lokale Variable für den Spieler bekommen, und dann die 
          // Store API verwenden, um ihn zu bewegen
          const success = store.movePlayerToField(playerId, marker.x, marker.y);
          
          if (!success) {
            console.error(`[TACTIC] Failed to move player ${playerName} (${playerId}) to field`);
          }
        }
      }

      // PHASE 4: Finale Überprüfung und Zusammenfassung
      console.log("[TACTIC] Final field player positions:",
                  store.fieldPlayers.map(p => `${p.firstName}(${p.percentX.toFixed(0)}/${p.percentY.toFixed(0)})`).join(", "));
      
      return true;
    } catch (error) {
      // Fehlerbehandlung hinzufügen
      console.error("[TACTIC] Error during player redistribution:", error);
      return false;
    } finally {
      // Immer zurücksetzen, um künftige Operationen zu erlauben
      isRedistributing.value = false;
    }
  }

  /**
   * Berechnet die euklidische Distanz zwischen zwei Punkten
   */
  function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Sortiert Spieler-IDs nach Priorität
   * - Torhüter zuerst
   * - Dann nach Y-Position (defensiver = höhere Priorität)
   */
  function prioritizePlayers(playerIds) {
    return [...playerIds].sort((idA, idB) => {
      const playerA = store.findPlayerById(idA);
      const playerB = store.findPlayerById(idB);

      if (!playerA || !playerB) return 0;

      // Torhüter haben höchste Priorität
      const aIsKeeper = playerA.position === "Keeper" || playerA.position === "Torwart";
      const bIsKeeper = playerB.position === "Keeper" || playerB.position === "Torwart";

      if (aIsKeeper && !bIsKeeper) return -1;
      if (bIsKeeper && !aIsKeeper) return 1;

      // Verteidiger vor Stürmern
      return playerA.percentY - playerB.percentY;
    });
  }


  /**
   * Holt die Taktiken für den aktuellen Spieltyp
   */
  function getTacticsForCurrentGameType() {
    const tactics = TACTICS[store.gameType] || [];
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
