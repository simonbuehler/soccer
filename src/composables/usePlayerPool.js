let instance = null;

export function usePlayerPool(dependencies = {}) {
  if (instance) return instance;

  const { appStore } = dependencies;
  const players = ref([]);
  const viewManager = ref(null);

  function init(manager) {
    viewManager.value = manager;
    // Initialize with default players if empty
    if (players.value.length === 0) {
      // Default initialization logic
    }
  }

  function addPlayer(player) {
    // Check for name conflicts
    const sameFirstNamePlayers = players.value.filter(
      (p) =>
        p.firstName.value.split(" ")[0] === player.firstName.value.split(" ")[0]
    );

    if (sameFirstNamePlayers.length > 0) {
      const sameInitialPlayers = sameFirstNamePlayers.filter(
        (p) =>
          p.lastName.value.charAt(0).toUpperCase() ===
          player.lastName.value.charAt(0).toUpperCase()
      );

      if (sameInitialPlayers.length > 0) {
        sameInitialPlayers.forEach((p) =>
          p.updateDisplayName({ showLastName: true })
        );
        player.updateDisplayName({ showLastName: true });
      } else {
        sameFirstNamePlayers.forEach((p) =>
          p.updateDisplayName({ showInitial: true })
        );
        player.updateDisplayName({ showInitial: true });
      }
    }

    players.value.push(player);
    updateView();
  }

  function movePlayer(playerId, newLocation) {
    const player = getPlayerById(playerId);
    if (player) {
      player.location.value = newLocation;
      updateView();
    }
  }

  function updateView() {
    if (!viewManager.value) return;

    viewManager.value.clearViews();
    viewManager.value.updatePlaceholder();

    const appStore = useAppStore();
    const positionMarkers = appStore.getPositionMarkers();
    if (positionMarkers.length > 0) {
      positionMarkers.forEach((marker) => {
        viewManager.value.createPositionMarker(marker);
      });
    }

    players.value.forEach((player) => {
      if (player.location.value === "bench") {
        viewManager.value.createBenchPlayer(player);
      } else if (player.location.value === "pitch") {
        viewManager.value.createPitchPlayer(player);
      }
    });
  }

  function getPlayerById(id) {
    return players.value.find((p) => p.id.value === id);
  }

  function getBenchPlayers() {
    return players.value.filter((p) => p.location.value === "bench");
  }

  function getPitchPlayers() {
    return players.value.filter((p) => p.location.value === "pitch");
  }

  return {
    players,
    init,
    addPlayer,
    movePlayer,
    updateView,
    getPlayerById,
    getBenchPlayers,
    getPitchPlayers,
  };
}
