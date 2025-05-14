import { useAppStore } from "@/stores/appStore";
import { TACTICS } from "@/js/tactics/allTactics";

export function useTacticManager() {
  const store = useAppStore();

  function initializeGame() {
    // Initialize tactics
    store.gameType = 7;
    store.currentTactic = TACTICS[7]?.find(t => t.name === "Frei");
  }

  function setGameType(playerCount) {
    if (store.gameType === playerCount) return false;

    store.gameType = playerCount;
    const defaultTactic = TACTICS[playerCount]?.find(t => 
      t.name === "Frei"
    );
    if (defaultTactic) {
      store.currentTactic = defaultTactic;
      return true;
    }
    return false;
  }

  function setTactic(tacticName) {
    if (!tacticName || !store.gameType) return false;
    
    const tactics = TACTICS[store.gameType];
    if (!tactics?.length) return false;

    const newTactic = tactics.find(t => t.name === tacticName);
    if (!newTactic) return false;

    try {
      store.currentTactic = {...newTactic};
      return true;
    } catch (e) {
      console.error('Failed to set tactic:', e);
      return false;
    }
  }

  function getPositionMarkers() {
    if (!store.currentTactic?.positions?.length) return [];
    return store.currentTactic.positions.map(pos => ({
      ...pos,
      isRequired: !store.currentTactic.name.includes("Frei")
    }));
  }

  function redistributePlayers() {
    if (!store.currentTactic?.positions?.length) return;

    const pitchPlayers = store.players.filter(p => p.location === "pitch");
    const benchPlayers = store.players.filter(p => p.location === "bench");
    
    const markers = [...store.currentTactic.positions];
    const markerPositions = markers.map(pos => ({
      x: pos.xPercent,
      y: pos.yPercent,
      assigned: false
    }));
    
    // Step 1: Assign existing pitch players to closest available marker
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
    
    // Step 2: Fill remaining positions with bench players
    const unassignedPositions = markerPositions.filter(pos => !pos.assigned);
    
    if (unassignedPositions.length > 0 && benchPlayers.length > 0) {
      for (let i = 0; i < Math.min(unassignedPositions.length, benchPlayers.length); i++) {
        const playerToMove = benchPlayers[i];
        const targetPosition = unassignedPositions[i];
        
        playerToMove.percentX = targetPosition.x;
        playerToMove.percentY = targetPosition.y;
        playerToMove.location = "pitch";
        markerPositions[markerPositions.indexOf(targetPosition)].assigned = true;
      }
    }
  }

  function getTacticsForCurrentGameType() {
    const tactics = TACTICS[store.gameType] || [];
    // Ensure unique entries by name only
    return tactics.filter((tactic, index, self) =>
      index === self.findIndex(t => t.name === tactic.name)
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
    getCurrentTactic
  };
}
