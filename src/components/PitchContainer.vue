<template>
  <div id="outer" class="relative w-full flex ">
    <!-- SVG Container mit fixer Breite und Höhe -->
    <div class="relative w-full lg:w-auto max-w-full">
      <!-- Soccer field SVG background -->
      <object style="pointer-events: none" :data="'/src/assets/pitch.svg'" type="image/svg+xml"
        class="w-full h-auto print:h-[850px] aspect-[2/3] lg:max-h-[calc(100vh-6rem)]" ref="pitchRef"></object>

      <!-- Interactive layer - absolute positioned exactly over the SVG -->
      <div class="absolute inset-0 w-full aspect-[2/3] print:h-[850px]" ref="playersContainerRef">
        <!-- Position markers from selected tactic -->
        <PositionMarker v-for="(marker, index) in positionMarkers" :key="`marker-${index}`" :marker="marker"
          :is-highlighted="index === highlightedMarkerIndex" />

        <!-- Draggable player tokens -->
        <PitchPlayer v-for="player in fieldPlayers" :key="player.id" :player="player"
          :disablePointerEvents="highlightedPlayerIds.includes(player.id)" />

        <!-- Warnung wenn zu viele Spieler -->
        <div v-if="showMaxPlayersWarning"
          class="absolute top-2 left-0 right-0 mx-auto w-max bg-red-500 text-white px-4 py-2 rounded-md text-sm font-bold shadow-lg animate-bounce">
          Maximale Spieleranzahl erreicht ({{ maxAllowedPlayers }})
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Interactive Soccer Field Component
 *
 * Features:
 * - Tactical position markers based on selected formation
 * - Draggable player tokens with smart position snapping
 * - Player swapping when dropping on occupied positions
 * - Responsive design for various screen sizes
 * - Print mode support
 */

// Core Vue imports
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { storeToRefs } from "pinia";

// Drag and drop functionality
import { dragAndDrop } from "@formkit/drag-and-drop/vue";
import {
  dropOrSwap,
  state,
  handleEnd as coreHandleEnd,
} from "@formkit/drag-and-drop";

// Components
import PositionMarker from "./PositionMarker.vue";
import PitchPlayer from "./PitchPlayer.vue";

// Models and services
import { Player } from "@/core/models/Player";
import { useTacticManager } from "@/composables/useTacticManager";
import { usePlayerService } from "@/composables/usePlayerService";
import { useAppStore } from "@/stores/appStore";

// Services
const tacticManager = useTacticManager();
const playerService = usePlayerService();
const store = useAppStore();
const { fieldPlayers } = storeToRefs(store);

// DOM element references
const playersContainerRef = ref(null);
const pitchRef = ref(null);

// Field dimensions tracking
const svgDimensions = ref({
  width: 0,
  height: 0,
  left: 0,
  top: 0,
});

// Container dimensions cache (avoids repeated getBoundingClientRect calls)
const containerDimensions = ref({
  width: 0,
  height: 0,
  left: 0,
  top: 0,
  pixelsPerPercentX: 0,
  pixelsPerPercentY: 0,
  thresholdPx: 0,
  thresholdSquared: 0,
});

// UI state tracking
const highlightedMarkerIndex = ref(-1);
// Umbenennung von playerIdAtHighlightedPosition zu highlightedPlayerIds
const highlightedPlayerIds = ref<string[]>([]);

// Maximale Spieleranzahl und Warnungsanzeige
const maxAllowedPlayers = computed(() => tacticManager.getCurrentGameType());
const showMaxPlayersWarning = ref(false);

// Überwache Änderungen der Spieleranzahl
const isMaxPlayersExceeded = computed(() => {
  return fieldPlayers.value.length >= maxAllowedPlayers.value;
});

// Zeige Warnung, wenn zu viele Spieler auf dem Feld sind
function checkAndShowWarning() {
  if (isMaxPlayersExceeded.value) {
    showMaxPlayersWarning.value = true;
    setTimeout(() => {
      showMaxPlayersWarning.value = false;
    }, 3000); // 3 Sekunden anzeigen
  }
}

/**
 * Determines if position markers should be displayed
 * Returns true for tactics with defined positions (non-free formations)
 */
const shouldShowMarkers = computed(() => {
  const currentTactic = tacticManager.getCurrentTactic();
  return (
    currentTactic?.positions &&
    currentTactic.positions.length > 0 &&
    !currentTactic.name.includes("Frei")
  );
});

/**
 * Position markers for the current tactic
 */
const positionMarkers = computed(() => tacticManager.getPositionMarkers());

/**
 * Initialize component and setup event listeners
 */
onMounted(() => {
  nextTick(() => {
    // Try calculating dimensions after initial render
    setTimeout(() => {
      updateFieldDimensions();
      // Retry if dimensions are still invalid
      if (!containerDimensions.value.width) {
        console.log(
          "[INFO-PITCH] Retrying dimension calculation after delay"
        );
        setTimeout(updateFieldDimensions, 100);
      }
    }, 50);
  });

  // Add resize listener
  window.addEventListener("resize", updateFieldDimensions);
});

/**
 * Clean up event listeners
 */
onUnmounted(() => {
  window.removeEventListener("resize", updateFieldDimensions);
});

/**
 * Updates field dimensions for accurate positioning
 * Skips in print mode where dimensions are fixed
 */
function updateFieldDimensions() {
  if (window.matchMedia("print").matches) return;


  // Update SVG dimensions
  const svgRect = pitchRef.value
    ?.querySelector("object")
    ?.getBoundingClientRect();
  if (svgRect) {
    svgDimensions.value = {
      width: svgRect.width,
      height: svgRect.height,
      left: svgRect.left,
      top: svgRect.top,
    };
  }

  // Update container dimensions cache
  if (playersContainerRef.value) {
    const containerRect = playersContainerRef.value.getBoundingClientRect();

    // Store dimensions
    containerDimensions.value.width = containerRect.width;
    containerDimensions.value.height = containerRect.height;
    containerDimensions.value.left = containerRect.left;
    containerDimensions.value.top = containerRect.top;

    // Pre-calculate derived values for performance
    containerDimensions.value.pixelsPerPercentX = containerRect.width / 100;
    containerDimensions.value.pixelsPerPercentY = containerRect.height / 100;
    containerDimensions.value.thresholdPx =
      Math.min(containerRect.width, containerRect.height) * 0.3;
    containerDimensions.value.thresholdSquared =
      containerDimensions.value.thresholdPx *
      containerDimensions.value.thresholdPx;
  }
}

/**
 * Finds a player at the given position coordinates
 * @param x - X coordinate as percentage
 * @param y - Y coordinate as percentage
 * @returns Player ID if found, null otherwise
 */
function findPlayerAtPosition(x: number, y: number): string | null {
  const margin = 3; // 3% Toleranz
  const playerAtPosition = fieldPlayers.value.find(
    (p) => Math.abs(p.percentX - x) < margin && Math.abs(p.percentY - y) < margin
  );
  return playerAtPosition ? playerAtPosition.id : null;
}

/**
 * Findet alle Spieler im Umkreis einer Position und markiert sie
 * @param xPercent - Horizontale Position (0-100%)
 * @param yPercent - Vertikale Position (0-100%)
 * @returns Array mit IDs der gefundenen Spieler
 */
function findPlayersInRadius(xPercent: number, yPercent: number): string[] {
  if (!fieldPlayers.value.length) return [];

  const radius = 10; // 10% Radius
  const radiusSquared = radius * radius;
  const nearbyPlayers: string[] = [];

  // Alle Spieler im Radius finden
  fieldPlayers.value.forEach(player => {
    const dx = xPercent - player.percentX;
    const dy = yPercent - player.percentY;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < radiusSquared) {
      nearbyPlayers.push(player.id);
    }
  });

  // IDs setzen und zurückgeben
  highlightedPlayerIds.value = nearbyPlayers;
  return nearbyPlayers;
}

/**
 * Löscht alle Hervorhebungen von Markern und Spielern
 */
function clearHighlights(): void {
  highlightedMarkerIndex.value = -1;
  highlightedPlayerIds.value = [];
}

/**
 * Findet und hebt den nächsten Positionsmarker hervor
 * @param xPercent - Horizontale Position (0-100%)
 * @param yPercent - Vertikale Position (0-100%)
 * @returns Positionsdaten, wenn ein Marker nahe genug ist, sonst null
 */
function highlightClosestMarker(xPercent: number, yPercent: number) {
  // Exit early if conditions aren't met
  if (!shouldShowMarkers.value || !containerDimensions.value.width) {
    return null;
  }

  if (!positionMarkers.value?.length) {
    return null;
  }

  // Find closest marker
  let closestIndex = -1;
  let minDistance = Infinity;

  const { pixelsPerPercentX, pixelsPerPercentY, thresholdSquared } =
    containerDimensions.value;

  // Calculate distances to all markers
  positionMarkers.value.forEach((marker) => {
    const markerX = marker.x;
    const markerY = marker.y;

    // Use squared distance for performance (avoid sqrt)
    const distanceXpx = (xPercent - markerX) * pixelsPerPercentX;
    const distanceYpx = (yPercent - markerY) * pixelsPerPercentY;
    const distanceSquared =
      distanceXpx * distanceXpx + distanceYpx * distanceYpx;

    if (distanceSquared < minDistance && marker.index !== undefined) {
      minDistance = distanceSquared;
      closestIndex = marker.index;
    }
  });

  // If a marker is close enough, highlight it
  if (closestIndex !== -1 && minDistance < thresholdSquared) {
    clearHighlights();
    highlightedMarkerIndex.value = closestIndex;

    const closestMarker = positionMarkers.value.find(
      (m) => m.index === closestIndex
    );

    if (!closestMarker) {
      console.error("[ERROR-PITCH] Could not find marker with index", closestIndex);
      return null;
    }

    // Prüfe auf Spieler an dieser Position
    const playerId = findPlayerAtPosition(closestMarker.x, closestMarker.y);

    // Wenn ein Spieler gefunden wurde, füge ihn zum Array hinzu
    if (playerId) {
      highlightedPlayerIds.value = [playerId];
    }

    return {
      x: closestMarker.x,
      y: closestMarker.y,
      shouldSnap: true,
    };
  }

  // No marker close enough
  clearHighlights();
  return null;
}

// Clear highlights when drag ends
state.on("dragEnded", () => {
  clearHighlights();
});

// FormKit drag-and-drop configuration
dragAndDrop<Player>({
  parent: playersContainerRef,
  values: fieldPlayers,
  plugins: [
    dropOrSwap({
      // Handle dragging over the pitch to highlight position markers and make players non-interactive
      handleParentDragover: (data, state) => {
        // Get mouse coordinates from drag event
        const clientX = data.e.clientX;
        const clientY = data.e.clientY;

        // Get current container position (accounts for scrolling and resizing)
        const containerRect =
          playersContainerRef.value.getBoundingClientRect();
        const viewportLeft = containerRect.left;
        const viewportTop = containerRect.top;
        const { width, height } = containerDimensions.value;

        // Convert to percentage within container
        const xPercent = Number(
          (((clientX - viewportLeft) / width) * 100).toFixed(2)
        );
        const yPercent = Number(
          (((clientY - viewportTop) / height) * 100).toFixed(2)
        );

        // Nur verarbeiten, wenn Koordinaten innerhalb des Feldes sind
        if (xPercent >= 0 && xPercent <= 100 && yPercent >= 0 && yPercent <= 100) {
          if (shouldShowMarkers.value) {
            // Formation tactic: Markiere den nächsten Positionsmarker
            highlightClosestMarker(xPercent, yPercent);
          } else {
            // Free formation: Finde und markiere Spieler im Umkreis
            findPlayersInRadius(xPercent, yPercent);
          }
        } else {
          clearHighlights();
        }
      },
    }),
  ],
  dragImage: (data, draggedNodes) => {
    return draggedNodes[0].el.cloneNode(true);
  },
  group: "players",
  draggable: (el) => {
    return el.classList.contains("player-token");
  },
  dragPlaceholderClass: "opacity-50 pointer-events-none",

  // Handle dropping a player on the pitch
  handleParentDrop: (data, state) => {
    console.log(
      "[DEBUG-PITCH] handleParentDrop",
      state.draggedNode.data.value.id
    );

    // Extract the dragged player ID from the drag state
    const playerId = state.draggedNode.data.value.id;
    if (!playerId) {
      console.error(
        "[ERROR-PITCH] Could not determine player ID for positioning"
      );
      return;
    }

    // Prüfe, ob der Spieler bereits auf dem Feld ist
    const alreadyOnField = store.getPlayerLocation(playerId) === "pitch";

    // Wenn Spieler noch nicht auf dem Feld ist und maximale Spieleranzahl erreicht,
    // dann Positionierung verhindern und Warnung anzeigen
    if (!alreadyOnField && isMaxPlayersExceeded.value) {
      console.warn(`[WARNING-PITCH] Maximum player count (${maxAllowedPlayers.value}) exceeded, preventing drop`);
      checkAndShowWarning();
      return;
    }

    // Calculate drop position in container coordinates
    const { clientX, clientY } = data.e;
    const containerRect = playersContainerRef.value.getBoundingClientRect();
    const { left: viewportLeft, top: viewportTop } = containerRect;
    const { width, height } = containerRect;

    // Convert to percentage coordinates
    const xPercent = Number(
      (((clientX - viewportLeft) / width) * 100).toFixed(2)
    );
    const yPercent = Number(
      (((clientY - viewportTop) / height) * 100).toFixed(2)
    );

    // Validate drop position is within bounds
    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) {
      console.warn("[WARNING-PITCH] Drop outside of container boundaries", {
        x: xPercent,
        y: yPercent,
      });
      clearHighlights();
      return;
    }

    let positioningSuccess = false;

    // Handle positioning based on tactic type
    if (shouldShowMarkers.value) {
      // Formation tactic: Use position markers with snapping
      const closestMarker = highlightClosestMarker(xPercent, yPercent);

      if (closestMarker && closestMarker.shouldSnap) {
        // Snap to nearest marker position
        const { x: targetX, y: targetY } = closestMarker;

        // Check if position is already occupied
        const playerAtPosition = fieldPlayers.value.find(
          (p) =>
            p.id !== playerId &&
            Math.abs(p.percentX - targetX) < 3 &&
            Math.abs(p.percentY - targetY) < 3
        );

        if (playerAtPosition) {
          // Position occupied - swap players
          console.log(
            "[INFO-PITCH] Position already occupied, swapping players"
          );
          positioningSuccess = store.swapPlayers(
            playerId,
            playerAtPosition.id
          );
          console.log("[INFO-PITCH] Swap result:", positioningSuccess);
        } else {
          // Position is free - place player
          positioningSuccess = playerService.handlePlayerPositioning(
            playerId,
            targetX,
            targetY
          );
        }
      } else {
        // No nearby marker - return player to original position
        console.log(
          "[INFO-PITCH] No marker in range for tactical position, returning player"
        );

        const currentPlayer = fieldPlayers.value.find(
          (p) => p.id === playerId
        );
        if (currentPlayer) {
          // Already on field - don't move
          positioningSuccess = true;
        } else {
          // From bench - return to bench
          positioningSuccess = store.movePlayerToBench(playerId);
        }
      }
    } else {

      console.log("[INFO-PITCH] Free placement mode, positioning at", {
        x: xPercent,
        y: yPercent,
      });
      positioningSuccess = playerService.handlePlayerPositioning(
        playerId,
        xPercent,
        yPercent
      );

    }

    // Clean up highlights
    clearHighlights();

    // Log errors
    if (!positioningSuccess) {
      console.error("[ERROR-PITCH] Positioning failed");
    }
  },
  handleNodeDrop(data, state) {

  },
  handleEnd(state) {

    coreHandleEnd(state);
  },
});

// Auch für movePlayerToField eine Begrenzung einfügen
const originalMoveToField = store.movePlayerToField;
store.movePlayerToField = (id, x, y) => {
  // Wenn der Spieler neu aufs Feld kommt und zu viele Spieler dort sind, abbrechen
  const playerLocation = id ? store.getPlayerLocation(id) : "bench";
  if (playerLocation === "bench" && isMaxPlayersExceeded.value) {
    console.warn(`[WARNING-STORE] Maximum player count (${maxAllowedPlayers.value}) exceeded, preventing move`);
    checkAndShowWarning();
    return false;
  }
  return originalMoveToField(id, x, y);
};
</script>

<style scoped>
/**
   * Pulse animation for highlighting position markers
   * Maintains the marker's centered position while scaling
   */
@keyframes pulse-fast {
  0% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1);
  }

  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }

  100% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1);
  }
}

.animate-pulse-fast {
  animation: pulse-fast 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  transform-origin: center;
}
</style>
