import { TACTICS } from './allTactics.js';

export class TacticManager {
  constructor() {
    this.availableTactics = TACTICS;
    // Initialize with a default tactic, e.g., for 7 players, "Frei" (free) formation
    this.currentTactic = this.availableTactics.find(t => t.name === "7er Frei"); 
    this.currentGameType = 7; // Default game type (7, 9, or 11 players)
    this.onTacticChange = null; // Callback for when the tactic changes
  }

  setGameType(playerCount) {
    if (this.currentGameType === playerCount) {
      return true; // No change needed
    }
    
    this.currentGameType = playerCount;
    
    // Find default "Frei" (free) tactic for this player count
    const defaultTactic = this.availableTactics.find(t => 
      t.playerCount === playerCount && t.name.includes("Frei")
    );
    
    if (defaultTactic) {
      const previousTactic = this.currentTactic;
      this.currentTactic = defaultTactic;
      
      // If the tactic changed, trigger the callback
      if (previousTactic !== defaultTactic && typeof this.onTacticChange === 'function') {
        // Use setTimeout to ensure all state changes are processed before notifying
        setTimeout(() => this.onTacticChange(), 0);
      }
      return true;
    }
    
    // console.error('No default tactic found for player count:', playerCount); // Removed debug
    return false;
  }

  getTacticsForCurrentGameType() {
    return this.availableTactics.filter(t => 
      t.playerCount === this.currentGameType
    );
  }

  setTactic(tacticName, playerPool) {
    const newTactic = this.availableTactics.find(t => t.name === tacticName);
    if (newTactic) {
      this.currentTactic = newTactic;
      
      if (playerPool) {
        this.redistributePlayers(playerPool);
      }
      
      if (typeof this.onTacticChange === 'function') {
        this.onTacticChange();
      }
      return true;
    }
    return false;
  }

  getPositionMarkers() {
    if (!this.currentTactic?.positions) return [];
    // Add isRequired flag to markers unless it's a "Frei" (free) formation
    return this.currentTactic.positions.map(pos => ({
      ...pos,
      isRequired: !this.currentTactic.name.includes("Frei")
    }));
  }

  /**
   * Returns the current game type (number of players per team).
   * @returns {number} The number of players (e.g., 7, 9, 11).
   */
  getCurrentGameType() {
    return this.currentGameType || 7; // Default to 7-a-side
  }

  /**
   * Returns the current tactic object.
   * @returns {object} The current tactic.
   */
  getCurrentTactic() {
    return this.currentTactic;
  }

  redistributePlayers(playerPool) {
    if (!this.currentTactic?.positions?.length) return;

    const pitchPlayers = playerPool.getPitchPlayers();
    const benchPlayers = playerPool.getBenchPlayers();
    
    const markers = [...this.currentTactic.positions];
    const markerPositions = markers.map(pos => ({
      x: pos.xPercent,
      y: pos.yPercent,
      assigned: false
    }));
    
    // Step 1: Assign existing pitch players to the closest available marker
    pitchPlayers.forEach(player => {
      let closestPosInfo = null;
      let minDistance = Infinity;
      
      markerPositions.forEach((pos, index) => {
        if (!pos.assigned) {
          const dx = pos.x - player.percentX;
          const dy = pos.y - player.percentY;
          const distance = Math.sqrt(dx*dx + dy*dy);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestPosInfo = { pos, index };
          }
        }
      });

      if (closestPosInfo) {
        player.percentX = closestPosInfo.pos.x;
        player.percentY = closestPosInfo.pos.y;
        markerPositions[closestPosInfo.index].assigned = true;
      }
    });
    
    // Step 2: Fill remaining unassigned positions with players from the bench
    const unassignedPositions = markerPositions.filter(pos => !pos.assigned);
    
    if (unassignedPositions.length > 0 && benchPlayers.length > 0) {
      for (let i = 0; i < Math.min(unassignedPositions.length, benchPlayers.length); i++) {
        const playerToMove = benchPlayers[i];
        const targetPosition = unassignedPositions[i];
        
        playerToMove.percentX = targetPosition.x;
        playerToMove.percentY = targetPosition.y;
        playerToMove.location = "pitch";
        // console.log(`Moving player ${playerToMove.displayName} to position (${targetPosition.x}, ${targetPosition.y})`); // Removed debug
        markerPositions[markerPositions.indexOf(targetPosition)].assigned = true; // Mark as assigned
      }
    }

    playerPool.updateView();
  }
}
