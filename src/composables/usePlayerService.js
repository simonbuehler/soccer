import { inject, provide } from 'vue';
import { Player } from '../core/models/Player';
import { useAppStore } from '../stores/appStore';

// Symbol für Dependency Injection
export const PlayerServiceSymbol = Symbol('PlayerService');

/**
 * Composable für die Spielerverwaltung
 * @throws {Error} Wenn PlayerService nicht über providePlayerService bereitgestellt wurde
 * @returns {Object} Der PlayerService mit allen Methoden
 */
export function usePlayerService() {
  // Service über Dependency Injection beziehen
  const service = inject(PlayerServiceSymbol);
  
  // Kein Fallback, wenn kein Service injiziert wurde
  if (!service) {
    throw new Error(
      'PlayerService nicht gefunden! Stelle sicher, dass providePlayerService() ' + 
      'in App.vue oder einer übergeordneten Komponente aufgerufen wird.'
    );
  }
  
  return service;
}

/**
 * Stellt den PlayerService für die Anwendung bereit (Dependency Injection)
 * Diese Funktion MUSS in App.vue aufgerufen werden
 * @returns {Object} Die erstellte Service-Instanz
 */
export function providePlayerService() {
  // Store für den Service bereitstellen
  const store = useAppStore();
  
  // Service-Objekt mit allen Methoden
  const playerService = {
    // Spieler-Zugriffsmethoden
    findPlayer(playerId) {
      const player = store.players.find(p => p.id === playerId);
      console.log('[PlayerService] findPlayer:', { playerId, found: !!player });
      return player;
    },
    
    getBenchPlayers() {
      const benchPlayers = store.players.filter(p => p.location === "bench");
      console.log(`[PlayerService] getBenchPlayers: found ${benchPlayers.length} players`);
      return benchPlayers;
    },
    
    getPitchPlayers() {
      const pitchPlayers = store.players.filter(p => p.location === "pitch");
      console.log(`[PlayerService] getPitchPlayers: found ${pitchPlayers.length} players`);
      return pitchPlayers;
    },
    
    // Datenmanipulations-Methoden
    addPlayer(playerData) {
      console.log('[PlayerService] addPlayer called with:', playerData);
      
      // Duplikatprüfung
      if (this.isDuplicate(playerData)) {
        console.warn('[PlayerService] Duplicate player detected:', playerData);
        return false;
      }
      
      // Erstelle neuen Spieler
      const player = new Player(playerData);
      console.log('[PlayerService] Created new Player instance:', player);
      
      // Löse Namenskonflikte
      this.resolveNameConflicts(player);
      
      // Zum Store hinzufügen
      store.players.push(player);
      console.log('[PlayerService] Added player to store, now count:', store.players.length);
      return true;
    },
    
    isDuplicate(playerData) {
      const isDuplicate = store.players.some(p => 
        p.number === playerData.number || 
        (p.firstName === playerData.firstName &&
         p.lastName === playerData.lastName &&
         playerData.lastName !== "")
      );
      
      console.log('[PlayerService] isDuplicate check:', { playerData, result: isDuplicate });
      return isDuplicate;
    },
    
    resolveNameConflicts(player) {
      console.log('[PlayerService] resolveNameConflicts for:', player.firstName);
      
      const sameFirstNamePlayers = store.players.filter(
        p => p.firstName === player.firstName
      );
      
      console.log('[PlayerService] Found players with same first name:', sameFirstNamePlayers.length);
      
      if (sameFirstNamePlayers.length > 0) {
        const sameInitial = player.lastName.charAt(0).toUpperCase();
        const sameInitialPlayers = sameFirstNamePlayers.filter(
          p => p.lastName.charAt(0).toUpperCase() === sameInitial
        );
        
        console.log('[PlayerService] Players with same last name initial:', sameInitialPlayers.length);
        
        if (sameInitialPlayers.length > 0) {
          console.log('[PlayerService] Updating display names with full last names');
          sameInitialPlayers.forEach(p => p.updateDisplayName(true));
          player.updateDisplayName(true);
        } else if (player.lastName) {
          console.log('[PlayerService] Updating display names with last name initials');
          sameFirstNamePlayers.forEach(p => p.updateDisplayName(false, true));
          player.updateDisplayName(false, true);
        }
      }
    },

    /**
     * Optimierte movePlayer Methode
     * @param {Object} player - Spielerobjekt
     * @param {Object} options - Optionen für die Bewegung
     * @returns {Object} - Das aktualisierte Spielerobjekt oder null bei Fehlern
     */
    movePlayer(player, options) {
      if (!player || typeof player !== 'object') {
        console.warn('[PlayerService] movePlayer requires a player object');
        return { success: false, error: 'INVALID_PLAYER' };
      }
      
      // Nur einmal loggen
      console.log('[PlayerService] movePlayer executing for:', { 
        playerId: player.id, 
        options 
      });
      
      // Vor der Änderung
      const originalState = { 
        location: player.location, 
        percentX: player.percentX, 
        percentY: player.percentY 
      };
      
      if (options.location) player.location = options.location;
      if (options.x !== undefined) player.percentX = options.x;
      if (options.y !== undefined) player.percentY = options.y;
      
      // Nach der Änderung
      const newState = { 
        location: player.location, 
        percentX: player.percentX, 
        percentY: player.percentY 
      };
      
      console.log('[PlayerService] Player state updated:', { 
        playerId: player.id,
        before: originalState, 
        after: newState, 
        changes: options
      });
      
      return { success: true, player, changes: options };
    },
    
    /**
     * Optimierte handlePlayerPositioning Methode
     * @param {Object} player - Spielerobjekt
     * @param {number} targetX - X-Koordinate (Prozent)
     * @param {number} targetY - Y-Koordinate (Prozent)
     * @returns {Object} - Ergebnisobjekt mit success, player, coords
     */
    handlePlayerPositioning(player, targetX, targetY) {
      if (!player || typeof player !== 'object') {
        console.warn('[PlayerService] handlePlayerPositioning requires a player object');
        return { success: false, error: 'INVALID_PLAYER' };
      }
      
      // Nur einmalig loggen
      console.log('[PlayerService] handlePlayerPositioning for:', {
        playerId: player.id,
        targetX,
        targetY
      });

      const positionMarkers = store.currentTactic?.positions || [];
      const isFreePlacement = positionMarkers.length === 0;

      let canPlace = isFreePlacement;
      let finalX = targetX;
      let finalY = targetY;

      // Snap-Logik für taktische Positionierung
      if (!isFreePlacement) {
        const closestMarker = this.findClosestMarker(targetX, targetY, positionMarkers);
        if (closestMarker) {
          finalX = closestMarker.xPercent;
          finalY = closestMarker.yPercent;
          canPlace = true;
        }
      }

      if (canPlace) {
        // Prüfen ob ein anderer Spieler bereits an dieser Position ist
        const existingPlayer = this.getPitchPlayers().find(
          p => Math.abs(p.percentX - finalX) < 0.1 &&
            Math.abs(p.percentY - finalY) < 0.1 &&
            p.id !== player.id
        );

        if (existingPlayer) {
          console.log('[PlayerService] Position swap detected with player:', existingPlayer.id);
          
          // Alte Position merken
          const oldX = player.percentX;
          const oldY = player.percentY;
          const wasOnPitch = player.location === "pitch";

          // Neuen Spieler zur neuen Position bewegen und auf Feld setzen
          const moveResult = this.movePlayer(player, { 
            x: finalX, 
            y: finalY, 
            location: "pitch"
          });

          // Existierenden Spieler entweder zur alten Position oder zur Bank bewegen
          if (wasOnPitch) {
            // Existierenden Spieler zur alten Position bewegen
            this.movePlayer(existingPlayer, { 
              x: oldX, 
              y: oldY, 
              location: "pitch" 
            });
          } else {
            // Existierenden Spieler auf die Bank bewegen
            this.movePlayer(existingPlayer, { location: "bench" });
          }
          
          console.log('[PlayerService] Player positioning completed successfully (swap)');
          return { 
            success: true, 
            player: moveResult.player,
            coords: { x: finalX, y: finalY },
            swapped: existingPlayer.id
          };
        } else {
          // Kein Konflikt - Spieler einfach zur Position bewegen und aufs Feld setzen
          const moveResult = this.movePlayer(player, { 
            x: finalX, 
            y: finalY, 
            location: "pitch"
          });
          
          console.log('[PlayerService] Player positioning completed successfully');
          return { 
            success: true, 
            player: moveResult.player, 
            coords: { x: finalX, y: finalY }
          };
        }
      } else {
        console.log('[PlayerService] Cannot place player at requested position - invalid position');
        return { 
          success: false, 
          error: 'INVALID_POSITION',
          player
        };
      }
    },
    
    findClosestMarker(x, y, markers) {
      console.log('[PlayerService] findClosestMarker:', { x, y, markerCount: markers.length });
      
      let closest = null;
      let minDistance = Infinity;

      markers.forEach(marker => {
        const dx = marker.xPercent - x;
        const dy = marker.yPercent - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          closest = marker;
        }
      });

      const result = minDistance < 10 ? closest : null;
      console.log('[PlayerService] Closest marker result:', { 
        found: !!result, 
        distance: minDistance.toFixed(2),
        marker: result
      });
      
      return result;
    },
    
    redistributePlayers() {
      console.log('[PlayerService] redistributePlayers called (not implemented yet)');
    }
  };
  
  // Service über Dependency Injection bereitstellen
  provide(PlayerServiceSymbol, playerService);
  console.log('[PlayerService] Successfully provided PlayerService for dependency injection');
  return playerService;
}
