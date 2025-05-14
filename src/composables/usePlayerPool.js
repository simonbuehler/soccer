import { useAppStore } from "@/stores/appStore";
import { markRaw, ref } from "vue";

export function usePlayerPool() {
  const store = useAppStore();
  const draggedPlayer = ref(null);

  function setDraggedPlayer(playerId) {
    draggedPlayer.value = store.players.find(p => p.id === playerId);
  }

  function getDraggedPlayer() {
    return draggedPlayer.value;
  }

  function addPlayer(player) {
    console.log('Adding player:', player); // Debug log
    
    // Duplicate check
    const duplicatePlayer = store.players.find(p =>
      p.number === player.number ||
      (p.firstName === player.firstName &&
        p.lastName === player.lastName &&
        player.lastName !== "")
    );

    if (duplicatePlayer) {
      console.log('Duplicate player found:', duplicatePlayer);
      return false;
    }

    // Name conflict resolution
    const sameFirstNamePlayers = store.players.filter(
      p => p.firstName === player.firstName
    );

    if (sameFirstNamePlayers.length > 0) {
      const sameInitial = player.lastName.charAt(0).toUpperCase();
      const sameInitialPlayers = sameFirstNamePlayers.filter(
        p => p.lastName.charAt(0).toUpperCase() === sameInitial
      );

      const updateDisplayNames = (players, format) => {
        players.forEach(p => {
          p.displayName = format(p);
        });
        return format(player);
      };

      player.displayName = sameInitialPlayers.length > 0
        ? updateDisplayNames(
          sameInitialPlayers,
          p => `${p.number}, ${p.firstName} ${p.lastName}`
        )
        : updateDisplayNames(
          sameFirstNamePlayers,
          p => `${p.number}, ${p.firstName} ${p.lastName.charAt(0).toUpperCase()}.`
        );
    } else {
      player.displayName = `${player.number}, ${player.firstName}`;
    }

    const playerToAdd = markRaw({
      ...player,
      id: player.id || `player-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      location: "bench" // Default to bench
    });

    store.players.push(playerToAdd);
    console.log('Player added successfully:', playerToAdd);
    return true;
  }

  function movePlayer(playerId, options) {
    const player = store.players.find(p => p.id === playerId);
    if (!player) return;

    console.log(`Moving player ${playerId} to:`, options);
    
    if (options.location) {
      player.location = options.location;
    }
    if (options.x !== undefined) {
      player.percentX = options.x;
    }
    if (options.y !== undefined) {
      player.percentY = options.y;
    }
  }

  function handlePlayerPositioning(playerId, targetX, targetY) {
    console.log(`Positioning player ${playerId} at ${targetX},${targetY}`);
    
    const player = store.players.find(p => p.id === playerId);
    if (!player) return;

    const positionMarkers = store.currentTactic?.positions || [];
    const isFreePlacement = positionMarkers.length === 0;

    let canPlace = isFreePlacement;
    let finalX = targetX;
    let finalY = targetY;

    if (!isFreePlacement) {
      const closestMarker = findClosestMarker(targetX, targetY, positionMarkers);
      if (closestMarker) {
        finalX = closestMarker.xPercent;
        finalY = closestMarker.yPercent;
        canPlace = true;
      }
    }

    if (canPlace) {
      const existingPlayer = getPitchPlayers().find(
        p => Math.abs(p.percentX - finalX) < 0.1 &&
          Math.abs(p.percentY - finalY) < 0.1 &&
          p.id !== playerId
      );

      if (existingPlayer) {
        console.log('Position swap detected with player:', existingPlayer.id);
        
        const oldX = player.percentX;
        const oldY = player.percentY;
        const wasOnPitch = player.location === "pitch";

        movePlayer(playerId, { x: finalX, y: finalY, location: "pitch" });

        if (wasOnPitch) {
          movePlayer(existingPlayer.id, { x: oldX, y: oldY, location: "pitch" });
        } else {
          movePlayer(existingPlayer.id, { location: "bench" });
        }
      } else {
        movePlayer(playerId, { x: finalX, y: finalY, location: "pitch" });
      }
    }
  }

  function findClosestMarker(x, y, markers) {
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

    return minDistance < 10 ? closest : null;
  }

  function getBenchPlayers() {
    return store.players.filter(p => p.location === "bench");
  }

  function getPitchPlayers() {
    return store.players.filter(p => p.location === "pitch");
  }

  function redistributePlayers() {
    console.log('Redistributing players');
    // Logic for redistributing players if needed
  }

  return {
    addPlayer,
    movePlayer,
    handlePlayerPositioning,
    getBenchPlayers,
    getPitchPlayers,
    redistributePlayers,
    setDraggedPlayer,
    getDraggedPlayer
  };
}
