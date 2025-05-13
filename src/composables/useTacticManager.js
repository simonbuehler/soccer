let instance = null;

export function useTacticManager(dependencies = {}) {
  if (instance) return instance;

  const { appStore } = dependencies;

  const availableTactics = ref(TACTICS);
  const currentTactic = ref(TACTICS.find((t) => t.name === "7er Frei"));
  const currentGameType = ref(7);

  function setGameType(playerCount) {
    if (currentGameType.value === playerCount) return true;

    currentGameType.value = playerCount;

    const defaultTactic = availableTactics.value.find(
      (t) => t.playerCount === playerCount && t.name.includes("Frei")
    );

    if (defaultTactic) {
      currentTactic.value = defaultTactic;
      return true;
    }
    return false;
  }

  function getTacticsForCurrentGameType() {
    return availableTactics.value.filter(
      (t) => t.playerCount === currentGameType.value
    );
  }

  function setTactic(tacticName) {
    const newTactic = availableTactics.value.find((t) => t.name === tacticName);
    if (newTactic) {
      currentTactic.value = newTactic;
      return true;
    }
    return false;
  }

  function getPositionMarkers() {
    if (!currentTactic.value?.positions) return [];
    return currentTactic.value.positions.map((pos) => ({
      ...pos,
      isRequired: !currentTactic.value.name.includes("Frei"),
    }));
  }

  function getCurrentGameType() {
    return currentGameType.value || 7;
  }

  function getCurrentTactic() {
    return currentTactic.value;
  }

  function redistributePlayers() {
    if (!currentTactic.value?.positions?.length) return;

    const playerPool = appStore.playerPool;
    const pitchPlayers = playerPool.getPitchPlayers();
    const benchPlayers = playerPool.getBenchPlayers();

    const markers = [...currentTactic.value.positions];
    const markerPositions = markers.map((pos) => ({
      x: pos.xPercent,
      y: pos.yPercent,
      assigned: false,
    }));

    pitchPlayers.forEach((player) => {
      let closestPosInfo = null;
      let minDistance = Infinity;

      markerPositions.forEach((pos, index) => {
        if (!pos.assigned) {
          const dx = pos.x - player.percentX;
          const dy = pos.y - player.percentY;
          const distance = Math.sqrt(dx * dx + dy * dy);

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

    const unassignedPositions = markerPositions.filter((pos) => !pos.assigned);

    if (unassignedPositions.length > 0 && benchPlayers.length > 0) {
      for (
        let i = 0;
        i < Math.min(unassignedPositions.length, benchPlayers.length);
        i++
      ) {
        const playerToMove = benchPlayers[i];
        const targetPosition = unassignedPositions[i];

        playerToMove.percentX = targetPosition.x;
        playerToMove.percentY = targetPosition.y;
        playerToMove.location = "pitch";
        markerPositions[
          markerPositions.indexOf(targetPosition)
        ].assigned = true;
      }
    }

    playerPool.updateView();
  }

  return {
    availableTactics,
    currentTactic,
    currentGameType,
    setGameType,
    getTacticsForCurrentGameType,
    setTactic,
    getPositionMarkers,
    getCurrentGameType,
    getCurrentTactic,
    redistributePlayers,
  };
}
