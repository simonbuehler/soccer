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
  import { dropOrSwap, state } from "@formkit/drag-and-drop";

  // Components
  import PositionMarker from "./PositionMarker.vue";
  import PitchPlayer from "./PitchPlayer.vue";

  // Models and services
  import { Player } from "@/core/models/Player";
  import { useTacticManager } from "@/composables/useTacticManager";
  import { usePlayerService } from "@/composables/usePlayerService";
  import { useAppStore } from "@/stores/appStore";

  // Service instances
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
  const playerIdAtHighlightedPosition = ref<string | null>(null);

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

    // Log debug info
    console.log(
      "[DEBUG-PITCH] Updating field dimensions, container ready:",
      !!playersContainerRef.value,
      "SVG ready:",
      !!pitchRef.value?.querySelector("object")
    );

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
      console.log("[DEBUG-PITCH] SVG dimensions:", svgDimensions.value);
    }

    // Update container dimensions cache
    if (playersContainerRef.value) {
      const containerRect = playersContainerRef.value.getBoundingClientRect();

      // Validate dimensions
      console.log("[DEBUG-PITCH] Container raw rect:", {
        width: containerRect.width,
        height: containerRect.height,
        isValid: containerRect.width > 0 && containerRect.height > 0,
      });

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
    // Use a small margin for fuzzy position matching
    const margin = 3; // 3% margin

    const playerAtPosition = fieldPlayers.value.find(
      (p) =>
        Math.abs(p.percentX - x) < margin && Math.abs(p.percentY - y) < margin
    );

    return playerAtPosition ? playerAtPosition.id : null;
  }

  /**
   * Clears all position marker highlights
   */
  function clearMarkerHighlights(): void {
    highlightedMarkerIndex.value = -1;
    playerIdAtHighlightedPosition.value = null;
  }

  /**
   * Finds and highlights the closest position marker to the given coordinates
   * @param xPercent - Horizontal position (0-100%)
   * @param yPercent - Vertical position (0-100%)
   * @returns Position data if a marker is close enough, null otherwise
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

      if (distanceSquared < minDistance) {
        minDistance = distanceSquared;
        closestIndex = marker.index;
      }
    });

    // If a marker is close enough, highlight it
    if (closestIndex !== -1 && minDistance < thresholdSquared) {
      clearMarkerHighlights();
      highlightedMarkerIndex.value = closestIndex;

      const closestMarker = positionMarkers.value.find(
        (m) => m.index === closestIndex
      );

      if (!closestMarker) {
        console.error(
          "[ERROR-PITCH] Could not find marker with index",
          closestIndex
        );
        return null;
      }

      // Check if there's already a player at this position
      playerIdAtHighlightedPosition.value = findPlayerAtPosition(
        closestMarker.x,
        closestMarker.y
      );

      return {
        x: closestMarker.x,
        y: closestMarker.y,
        shouldSnap: true,
      };
    }

    // No marker close enough
    clearMarkerHighlights();
    return null;
  }

  // Clear highlights when drag ends
  state.on("dragEnded", () => {
    clearMarkerHighlights();
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

          // Only highlight markers if within bounds and using a formation tactic
          if (
            xPercent >= 0 &&
            xPercent <= 100 &&
            yPercent >= 0 &&
            yPercent <= 100 &&
            shouldShowMarkers.value
          ) {
            highlightClosestMarker(xPercent, yPercent);
          } else {
            clearMarkerHighlights();
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

    // Handle dropping a player on the pitch - handles both formation-based and free positioning
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
        clearMarkerHighlights();
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
        // Free formation: Place at exact drop position
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
      clearMarkerHighlights();

      // Log errors
      if (!positioningSuccess) {
        console.error("[ERROR-PITCH] Positioning failed");
      }
    },
    handleNodeDrop(data, state) {
      // Placeholder for node drop handling
    },
  });
</script>

<template>
  <div id="outer" class="relative">
    <!-- Soccer field SVG background -->
    <object
      style="pointer-events: none"
      :data="'/src/assets/pitch.svg'"
      type="image/svg+xml"
      class="block w-full lg:w-auto h-auto print:h-[850px] aspect-[2/3] lg:max-h-[calc(100vh-6rem)]"
      ref="pitchRef"
    ></object>

    <!-- Interactive layer for players and markers -->
    <div
      class="absolute w-full aspect-[2/3] inset-0 print:h-[850px]"
      ref="playersContainerRef"
    >
      <!-- Position markers from selected tactic (only shown when tactic has positions) -->
      <PositionMarker
        v-for="(marker, index) in positionMarkers"
        :key="`marker-${index}`"
        :marker="marker"
        :is-highlighted="index === highlightedMarkerIndex"
      />

      <!-- Draggable player tokens -->
      <PitchPlayer
        v-for="player in fieldPlayers"
        :key="player.id"
        :player="player"
        :disablePointerEvents="player.id === playerIdAtHighlightedPosition"
      />
    </div>
  </div>
</template>

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
