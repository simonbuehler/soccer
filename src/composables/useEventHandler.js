import { ref } from "vue";
import { useAppStore } from "@/stores/appStore";
import { useViewManager } from "@/composables/useViewManager";

export function useEventHandler() {
  const appStore = useAppStore();
  const playerPool = appStore.playerPool;
  const viewManager = useViewManager();

  if (!playerPool) {
    console.error("PlayerPool not available from store");
  }
  const activeTouchId = ref(null);

  function handleDragStart(e, playerId) {
    e.dataTransfer.setData("text/plain", playerId);
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("opacity-50", "dragging");
  }

  function handleDragEnd(e, playerId) {
    document.querySelectorAll(`.opacity-50`).forEach((el) => {
      el.classList.remove("opacity-50", "dragging");
    });

    if (playerId) {
      document
        .querySelectorAll(`[data-player-id="${playerId}"]`)
        .forEach((el) => {
          el.classList.remove("opacity-50", "dragging");
        });
    }

    resetMarkerHighlights();
  }

  function handleTouchStart(e, playerId) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    activeTouchId.value = touch.identifier;

    e.target.classList.add("opacity-50");
    return playerId;
  }

  function handleTouchEnd(e, playerId) {
    try {
      e.preventDefault();
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === activeTouchId.value
      );
      if (!touch || !playerId) return;

      const player = playerPool.getPlayerById(playerId);
      if (!player) return;

      const svgRect = viewManager.pitchContainer.value
        ?.querySelector("object")
        ?.getBoundingClientRect();
      if (!svgRect) return;

      const touchX = touch.clientX - svgRect.left;
      const touchY = touch.clientY - svgRect.top;

      if (
        touchX >= 0 &&
        touchX <= svgRect.width &&
        touchY >= 0 &&
        touchY <= svgRect.height
      ) {
        handlePlayerMove(player, touchX, touchY, svgRect);
      }
    } catch (error) {
      console.error("Touch error:", error);
    } finally {
      e.target?.classList?.remove("opacity-50");
      activeTouchId.value = null;
      resetMarkerHighlights();
    }
  }

  function handlePlayerMove(player, touchX, touchY, svgRect) {
    const percentX = (touchX / svgRect.width) * 100;
    const percentY = (touchY / svgRect.height) * 100;

    const highlightResult = viewManager.highlightClosestMarker(
      percentX,
      percentY
    );
    const shouldSnap = highlightResult?.shouldSnap;
    const targetX = shouldSnap ? highlightResult.x : percentX;
    const targetY = shouldSnap ? highlightResult.y : percentY;

    const existingPlayer = playerPool
      .getPitchPlayers()
      .find(
        (p) =>
          Math.abs(p.percentX - targetX) < 0.1 &&
          Math.abs(p.percentY - targetY) < 0.1 &&
          p.id !== player.id
      );

    if (existingPlayer) {
      handlePlayerSwap(player, existingPlayer, targetX, targetY);
    } else {
      handlePlayerPositionUpdate(player, targetX, targetY);
    }
  }

  function handlePlayerSwap(player, existingPlayer, targetX, targetY) {
    const oldX = player.percentX;
    const oldY = player.percentY;
    const wasOnPitch = player.location === "pitch";

    player.percentX = targetX;
    player.percentY = targetY;
    player.location = "pitch";

    if (wasOnPitch) {
      existingPlayer.percentX = oldX;
      existingPlayer.percentY = oldY;
    } else {
      existingPlayer.location = "bench";
    }

    playerPool.updateView();
  }

  function handlePlayerPositionUpdate(player, targetX, targetY) {
    player.percentX = targetX;
    player.percentY = targetY;
    playerPool.movePlayer(player.id, "pitch");
  }

  function resetMarkerHighlights() {
    viewManager.playersContainer.value
      ?.querySelectorAll(".position-marker")
      ?.forEach((marker) => {
        marker.classList.remove(
          "border-4",
          "bg-blue-100/30",
          "animate-pulse-scale",
          "shadow-lg"
        );
        marker.classList.add("border-2");
      });
  }

  return {
    handleDragStart,
    handleDragEnd,
    handleTouchStart,
    handleTouchEnd,
  };
}
