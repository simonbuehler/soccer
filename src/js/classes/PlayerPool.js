/**
 * PlayerPool class manages all players in the system.
 */
export class PlayerPool {
  constructor() {
    this.players = [];
    this.viewManager = null; // Will be set later via init
  }
  
  init(viewManager) {
    this.viewManager = viewManager;
  }

  addPlayer(player) {
    // Check for first name conflicts to determine display name format
    const sameFirstNamePlayers = this.players.filter(
      (p) => p.firstName.split(" ")[0] === player.firstName.split(" ")[0]
    );

    if (sameFirstNamePlayers.length > 0) {
      // Check if last initials are also the same
      const sameInitialPlayers = sameFirstNamePlayers.filter(
        (p) =>
          p.lastName.charAt(0).toUpperCase() ===
          player.lastName.charAt(0).toUpperCase()
      );

      if (sameInitialPlayers.length > 0) {
        // Full last name needed for display name
        sameInitialPlayers.forEach((p) => p.updateDisplayName(true));
        player.updateDisplayName(true);
      } else {
        // Last initial needed for display name
        sameFirstNamePlayers.forEach((p) => p.updateDisplayName(false, true));
        player.updateDisplayName(false, true);
      }
    }

    this.players.push(player);
    this.updateView();
  }

  movePlayer(playerId, newLocation, percentX = null, percentY = null) {
    const player = this.getPlayerById(playerId);
    if (player) {
      player.location = newLocation;
      
      // Update percentage positions if provided
      if (percentX !== null && percentY !== null) {
        player.percentX = percentX;
        player.percentY = percentY;
      }
      
      this.updateView();
    }
  }

  updateView() {
    if (!this.viewManager) {
      // console.error("ViewManager not initialized in PlayerPool"); // Removed debug
      return;
    }
    
    this.viewManager.clearViews();
    this.viewManager.updatePlaceholder();

    // Access TacticManager via global AppRef to avoid circular imports
    if (window.AppRef && window.AppRef.tacticManager) {
      const positionMarkers = window.AppRef.tacticManager.getPositionMarkers();
      if (positionMarkers.length > 0) {
        positionMarkers.forEach(marker => {
          this.viewManager.createPositionMarker(marker);
        });
      }
    }

    // Rebuild player views
    this.players.forEach((player) => {
      if (player.location === "bench") {
        this.viewManager.createBenchPlayer(player);
      } else if (player.location === "pitch") {
        this.viewManager.createPitchPlayer(player);
      }
    });
  }

  getPlayerById(id) {
    return this.players.find((p) => p.id === id);
  }

  getBenchPlayers() {
    return this.players.filter((p) => p.location === "bench");
  }

  getPitchPlayers() {
    return this.players.filter((p) => p.location === "pitch");
  }
}
