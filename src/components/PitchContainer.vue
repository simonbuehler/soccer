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
        <PositionMarker v-for="(marker, index) in tacticPositions" :key="`marker-${index}`" :marker="marker"
          :is-highlighted="index === highlightedPositionIndex" />

        <!-- Draggable player tokens -->
        <PitchPlayer v-for="player in fieldPlayers" :key="player.id" :player="player"
          :disablePointerEvents="interactivePlayerIds.includes(player.id)" />

        <!-- Maximum player warning -->
        <div v-if="showMaxPlayersWarning"
          class="absolute top-2 left-0 right-0 mx-auto w-max bg-red-500 text-white px-4 py-2 rounded-md text-sm font-bold shadow-lg animate-bounce">
          Maximale Spieleranzahl erreicht ({{ maxAllowedPlayers }})
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

// Positioning modes enum
enum PositioningMode {
  GUIDED = 'guided',
  FREE = 'free'
}

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

// Container dimensions cache
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

// UI and positioning state
const highlightedPositionIndex = ref(-1);
const interactivePlayerIds = ref<string[]>([]);

// Determine current positioning mode based on tactic
const positioningMode = computed(() => {
  const currentTactic = tacticManager.getCurrentTactic();
  return currentTactic?.positions?.length 
    ? PositioningMode.GUIDED 
    : PositioningMode.FREE;
});

// Computed property to check if in guided mode
const isGuidedMode = computed(() => {
  return positioningMode.value === PositioningMode.GUIDED;
});

/**
 * Player limit management
 */
const maxAllowedPlayers = computed(() => tacticManager.getCurrentGameType());
const showMaxPlayersWarning = ref(false);
const isPlayerLimitExceeded = computed(() => fieldPlayers.value.length >= maxAllowedPlayers.value);

/**
 * Show warning when player limit is exceeded
 */
function showPlayerLimitWarning() {
  if (isPlayerLimitExceeded.value) {
    showMaxPlayersWarning.value = true;
    setTimeout(() => { showMaxPlayersWarning.value = false; }, 3000);
  }
}

// Tactic position markers
const tacticPositions = computed(() => tacticManager.getPositionMarkers());

/**
 * Initialize component and setup event listeners
 */
onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      updateFieldDimensions();
      if (!containerDimensions.value.width) {
        setTimeout(updateFieldDimensions, 100);
      }
    }, 50);
  });

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
 */
function findPlayerAtPosition(x: number, y: number): string | null {
  const margin = 3; // 3% tolerance
  const playerAtPosition = fieldPlayers.value.find(
    (p) => Math.abs(p.percentX - x) < margin && Math.abs(p.percentY - y) < margin
  );
  return playerAtPosition ? playerAtPosition.id : null;
}

/**
 * Finds all players within radius of a position and marks them as interactive
 */
function findPlayersInRadius(xPercent: number, yPercent: number): string[] {
  if (!fieldPlayers.value.length) return [];

  const radius = 10; // 10% radius
  const radiusSquared = radius * radius;
  const nearbyPlayers: string[] = [];

  fieldPlayers.value.forEach(player => {
    const dx = xPercent - player.percentX;
    const dy = yPercent - player.percentY;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < radiusSquared) {
      nearbyPlayers.push(player.id);
    }
  });

  interactivePlayerIds.value = nearbyPlayers;
  return nearbyPlayers;
}

/**
 * Clears all highlights
 */
function clearHighlights(): void {
  highlightedPositionIndex.value = -1;
  interactivePlayerIds.value = [];
}

/**
 * Finds and highlights the closest position marker in guided mode
 */
function highlightClosestPosition(xPercent: number, yPercent: number) {
  if (!isGuidedMode.value || !containerDimensions.value.width || !tacticPositions.value?.length) {
    return null;
  }

  // Find closest marker
  let closestIndex = -1;
  let minDistance = Infinity;

  const { pixelsPerPercentX, pixelsPerPercentY, thresholdSquared } =
    containerDimensions.value;

  tacticPositions.value.forEach((marker) => {
    const markerX = marker.x;
    const markerY = marker.y;

    // Use squared distance for performance
    const distanceXpx = (xPercent - markerX) * pixelsPerPercentX;
    const distanceYpx = (yPercent - markerY) * pixelsPerPercentY;
    const distanceSquared = distanceXpx * distanceXpx + distanceYpx * distanceYpx;

    if (distanceSquared < minDistance && marker.index !== undefined) {
      minDistance = distanceSquared;
      closestIndex = marker.index;
    }
  });

  // If a marker is close enough, highlight it
  if (closestIndex !== -1 && minDistance < thresholdSquared) {
    clearHighlights();
    highlightedPositionIndex.value = closestIndex;

    const closestMarker = tacticPositions.value.find(
      (m) => m.index === closestIndex
    );

    if (!closestMarker) return null;

    // Check for player at this position
    const playerId = findPlayerAtPosition(closestMarker.x, closestMarker.y);
    if (playerId) {
      interactivePlayerIds.value = [playerId];
    }

    return {
      x: closestMarker.x,
      y: closestMarker.y,
      shouldSnap: true,
    };
  }

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
      handleParentDragover: (data, state) => {
        // Get mouse coordinates from drag event
        const clientX = data.e.clientX;
        const clientY = data.e.clientY;
        const containerRect = playersContainerRef.value.getBoundingClientRect();
        const viewportLeft = containerRect.left;
        const viewportTop = containerRect.top;
        const { width, height } = containerDimensions.value;

        // Convert to percentage within container
        const xPercent = Number((((clientX - viewportLeft) / width) * 100).toFixed(2));
        const yPercent = Number((((clientY - viewportTop) / height) * 100).toFixed(2));

        // Only process if coordinates are within field bounds
        if (xPercent >= 0 && xPercent <= 100 && yPercent >= 0 && yPercent <= 100) {
          if (isGuidedMode.value) {
            highlightClosestPosition(xPercent, yPercent);
          } else {
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
    // Extract the dragged player ID
    const playerId = state.draggedNode.data.value.id;
    if (!playerId) return;

    // Calculate drop position
    const { clientX, clientY } = data.e;
    const containerRect = playersContainerRef.value.getBoundingClientRect();
    const { left: viewportLeft, top: viewportTop } = containerRect;
    const { width, height } = containerRect;

    const xPercent = Number((((clientX - viewportLeft) / width) * 100).toFixed(2));
    const yPercent = Number((((clientY - viewportTop) / height) * 100).toFixed(2));

    // Validate drop position is within bounds
    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) {
      clearHighlights();
      return;
    }

    let positioningSuccess = false;

    // Check if player is already on field
    const alreadyOnField = store.getPlayerLocation(playerId) === "pitch";
    
    // Position based on current mode
    if (isGuidedMode.value) {
      // Guided mode with position markers
      const closestMarker = highlightClosestPosition(xPercent, yPercent);

      if (closestMarker?.shouldSnap) {
        // Snap to marker position
        const { x: targetX, y: targetY } = closestMarker;

        // Check if position is already occupied
        const playerAtPosition = fieldPlayers.value.find(
          (p) => p.id !== playerId && 
                Math.abs(p.percentX - targetX) < 3 && 
                Math.abs(p.percentY - targetY) < 3
        );

        if (playerAtPosition) {
          // Swap with existing player
          positioningSuccess = store.swapPlayers(playerId, playerAtPosition.id);
        } else {
          // Position at marker
          positioningSuccess = playerService.handlePlayerPositioning(
            playerId, targetX, targetY
          );
        }
      } else {
        // No marker nearby - return player if from bench
        const currentPlayer = fieldPlayers.value.find(p => p.id === playerId);
        positioningSuccess = currentPlayer ? true : store.movePlayerToBench(playerId);
      }
    } else {
      // Free mode - no swapping allowed, just position player
      // Only check limit if adding new player
      if (!alreadyOnField && isPlayerLimitExceeded.value) {
        showPlayerLimitWarning();
      } else {
        positioningSuccess = playerService.handlePlayerPositioning(
          playerId, xPercent, yPercent
        );
      }
    }

    // Clean up highlights
    clearHighlights();
    
    if (!positioningSuccess) {
      console.error("[ERROR-PITCH] Positioning failed");
    }
  },
  handleNodeDrop() {},
  handleEnd(state) {
    coreHandleEnd(state);
  },
});

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
