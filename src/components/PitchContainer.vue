<script setup lang="ts">
  /**
   * Interactive Soccer Field Component
   *
   * Provides a visual and interactive representation of a soccer field with:
   * - Tactical position markers based on the selected formation
   * - Draggable player tokens with names and numbers
   * - Smart position snapping for precise player placement
   * - Responsive design that works on various screen sizes
   * - Print mode support for creating physical lineups
   */

  // Core Vue imports - essential framework functionality
  import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
  import { storeToRefs } from "pinia";

  // Third-party library imports - drag and drop functionality
  import { dragAndDrop } from "@formkit/drag-and-drop/vue";
  import { dropOrSwap, state } from "@formkit/drag-and-drop";

  // Project components
  import PositionMarker from "./PositionMarker.vue";
  import PitchPlayer from "./PitchPlayer.vue";

  // Models
  import { Player } from "@/core/models/Player";

  // Services and stores
  import { useTacticManager } from "@/composables/useTacticManager";
  import { usePlayerService } from "@/composables/usePlayerService";
  import { useAppStore } from "@/stores/appStore";

  // Service instances and store access
  const tacticManager = useTacticManager();
  const playerService = usePlayerService();
  const store = useAppStore();
  const { fieldPlayers } = storeToRefs(store);

  // DOM element references for positioning
  const playersContainerRef = ref(null);
  const pitchRef = ref(null);

  // SVG pitch dimensions tracking
  const svgDimensions = ref({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  });

  // Container dimensions cache to avoid repeated getBoundingClientRect calls
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

  // Track highlighted marker index
  const highlightedMarkerIndex = ref(-1);

  /**
   * Determines whether position markers should be displayed and if tactic constraints should be applied
   * Checks if there is a tactic selected that is not "Frei"
   */
  const shouldShowMarkers = computed(() => {
    const currentTactic = tacticManager.getCurrentTactic();
    return currentTactic?.positions && 
           currentTactic.positions.length > 0 && 
           !currentTactic.name.includes("Frei");
  });

  /**
   * Retrieves position markers from the tactic manager
   * These represent the tactical formation setup on the field
   * @returns Array of position markers with x,y coordinates
   */
  const positionMarkers = computed(() => tacticManager.getPositionMarkers());

  /**
   * Setup event listeners and initial dimensions
   * Prepares the field for player positioning
   */
  onMounted(() => {
    // Vue's next tick ensures DOM is fully rendered before measuring
    // This helps prevent zero-sized elements during initial render
    nextTick(() => {
      // Wait a bit to ensure DOM is fully rendered and measured
      setTimeout(() => {
        updateFieldDimensions();
        // Try again if dimensions are still not valid
        if (!containerDimensions.value.width) {
          console.log(
            "[INFO-PITCH] Retrying dimension calculation after delay"
          );
          setTimeout(updateFieldDimensions, 100);
        }
      }, 50);
    });

    // Then add the resize listener
    window.addEventListener("resize", updateFieldDimensions);
  });

  /**
   * Remove event listeners when component is destroyed
   * Prevents memory leaks from lingering references
   */
  onUnmounted(() => {
    window.removeEventListener("resize", updateFieldDimensions);
  });

  /**
   * Updates SVG and container dimensions for accurate positioning
   * Skips in print mode where dimensions are fixed
   */
  function updateFieldDimensions() {
    if (window.matchMedia("print").matches) return;

    // Log debug info to help diagnose dimension issues
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

      // Log the raw rectangle to check if it has valid dimensions
      console.log("[DEBUG-PITCH] Container raw rect:", {
        width: containerRect.width,
        height: containerRect.height,
        isValid: containerRect.width > 0 && containerRect.height > 0,
      });

      // Store basic dimensions
      containerDimensions.value.width = containerRect.width;
      containerDimensions.value.height = containerRect.height;
      containerDimensions.value.left = containerRect.left;
      containerDimensions.value.top = containerRect.top;

      // Pre-calculate commonly used derived values
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
   * Removes all visual highlights from position markers
   * Called when no marker should be highlighted or after drop
   */
  function clearMarkerHighlights(): void {
    highlightedMarkerIndex.value = -1;
  }

  /**
   * Finds and highlights the closest position marker to given coordinates
   * Uses distance calculation to determine closest marker
   * Updates reactive state to trigger UI updates
   *
   * @param xPercent - Horizontal position as percentage (0-100)
   * @param yPercent - Vertical position as percentage (0-100)
   * @returns Object with marker position data if found and within threshold
   */
  function highlightClosestMarker(xPercent: number, yPercent: number) {

    // Exit early if there are no markers to show or dimensions are not initialized
    if (!shouldShowMarkers.value || !containerDimensions.value.width) {
      return null;
    }

    // Exit early if there are no position markers
    if (!positionMarkers.value?.length) {
      return null;
    }

    // Initialize variables to track the closest marker
    let closestIndex = -1;
    let minDistance = Infinity; // We're comparing squared distances

    // Use cached container dimensions - don't recalculate
    const { pixelsPerPercentX, pixelsPerPercentY, thresholdSquared } =
      containerDimensions.value;

    // Iterate through position markers from our reactive positionMarkers computed property
    positionMarkers.value.forEach((marker) => {
      // Get position from the marker object (already normalized in getPositionMarkers)
      const markerX = marker.x;
      const markerY = marker.y;

      // Skip unnecessary sqrt calculation for initial comparisons
      // Use squared distance for performance (avoid sqrt until final comparison)
      const distanceXpx = (xPercent - markerX) * pixelsPerPercentX;
      const distanceYpx = (yPercent - markerY) * pixelsPerPercentY;
      const distanceSquared =
        distanceXpx * distanceXpx + distanceYpx * distanceYpx;

      if (distanceSquared < minDistance) {
        minDistance = distanceSquared;
        closestIndex = marker.index;
      }
    });

    // Check if we're within the threshold distance of a marker (using squared distance)
    if (closestIndex !== -1 && minDistance < thresholdSquared) {
      // Clear any existing highlights first
      clearMarkerHighlights();

      // Update reactive state to highlight the marker
      highlightedMarkerIndex.value = closestIndex;

      // Return position data for snapping
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

      return {
        x: closestMarker.x,
        y: closestMarker.y,
        shouldSnap: true,
      };
    }

    // If we're here, no marker is close enough - clear any existing highlights
    clearMarkerHighlights();
    return null;
  }

  state.on("dragEnded", () => {
    clearMarkerHighlights();
  });

  // FormKit drag-and-drop configuration
  dragAndDrop<Player>({
    parent: playersContainerRef,
    values: fieldPlayers,
    plugins: [
      dropOrSwap({
        // Handle dragging over the pitch to highlight potential positions
        handleParentDragover: (data, state) => {

          // Mouse coordinates
          const clientX = data.e.clientX;
          const clientY = data.e.clientY;

          // Use cached container dimensions instead of triggering reflow
          // WICHTIG: Für die korrekte Berechnung bei Scrolling müssen wir die aktuellen Viewport-Koordinaten
          // des Containers verwenden, nicht die gecachten Werte
          const containerRect =
            playersContainerRef.value.getBoundingClientRect();
          const viewportLeft = containerRect.left;
          const viewportTop = containerRect.top;
          const { width, height } = containerDimensions.value;

          // Convert viewport-relative position to percentage within container
          const xPercent = Number(
            (((clientX - viewportLeft) / width) * 100).toFixed(2)
          );
          const yPercent = Number(
            (((clientY - viewportTop) / height) * 100).toFixed(2)
          );


          // Only highlight markers if within container bounds AND we have position markers to show
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
    dragPlaceholderClass: "opacity-50",

    // Handle dropping a player on the pitch
    handleParentDrop: (data, state) => {
      console.log("[DEBUG-PITCH] handleParentDrop", state.draggedNode.data.value.id);

      // Get player ID from dragged element
      const playerId = state.draggedNode.data.value.id;
      if (!playerId) {
        console.error("[ERROR-PITCH] Could not determine player ID for positioning");
        return;
      }

      // Drop event coordinates und Container-Dimensionen berechnen
      const { clientX, clientY } = data.e;
      const containerRect = playersContainerRef.value.getBoundingClientRect();
      const { left: viewportLeft, top: viewportTop } = containerRect;
      const { width, height } = containerRect;

      // Position in Prozent berechnen
      const xPercent = Number((((clientX - viewportLeft) / width) * 100).toFixed(2));
      const yPercent = Number((((clientY - viewportTop) / height) * 100).toFixed(2));

      // Validate the drop position is within container bounds
      if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) {
        console.warn("[WARNING-PITCH] Drop outside of container boundaries", { x: xPercent, y: yPercent });
        clearMarkerHighlights();
        return;
      }

      // Initialisiere positioningResult
      let positioningSuccess = false;

      // Taktik-basierte Entscheidungslogik: Marker oder freies Platzieren
      if (shouldShowMarkers.value) {
        // TAKTIK-MODUS: Marker-basierte Positionierung mit Snapping
        const closestMarker = highlightClosestMarker(xPercent, yPercent);
        
        if (closestMarker && closestMarker.shouldSnap) {
          // Position zum nächsten Marker snappen
          const { x: targetX, y: targetY } = closestMarker;
          
          // Prüfen ob Position bereits besetzt ist
          const playerAtPosition = fieldPlayers.value.find(p => 
            p.id !== playerId && 
            Math.abs(p.percentX - targetX) < 3 && 
            Math.abs(p.percentY - targetY) < 3
          );
          
          if (playerAtPosition) {
            // Position ist besetzt - Spieler tauschen
            console.log("[INFO-PITCH] Position already occupied, swapping players");
            positioningSuccess = store.swapPlayers(playerId, playerAtPosition.id);
            console.log("[INFO-PITCH] Swap result:", positioningSuccess);
          } else {
            // Position ist frei - Spieler platzieren
            positioningSuccess = playerService.handlePlayerPositioning(playerId, targetX, targetY);
          }
        } else {
          // Kein Marker in Reichweite - Spieler an ursprüngliche Position zurücksetzen
          console.log("[INFO-PITCH] No marker in range for tactical position, returning player");
          
          const currentPlayer = fieldPlayers.value.find(p => p.id === playerId);
          if (currentPlayer) {
            // Bereits auf dem Feld - nicht bewegen
            positioningSuccess = true;
          } else {
            // Von der Bank - zurück zur Bank
            positioningSuccess = store.movePlayerToBench(playerId);
          }
        }
      } else {
        // FREIER MODUS: Direkte Platzierung an Drop-Position
        console.log("[INFO-PITCH] Free placement mode, positioning at", { x: xPercent, y: yPercent });
        positioningSuccess = playerService.handlePlayerPositioning(playerId, xPercent, yPercent);
      }

      // Highlights entfernen
      clearMarkerHighlights();

      // Nur im Fehlerfall loggen
      if (!positioningSuccess) {
        console.error("[ERROR-PITCH] Positioning failed");
      }
    },
    handleNodeBlur(data, state) {
      // Handle blur event for the dragged node
      // This is where you can implement logic to handle when the drag operation ends
      console.log("[DEBUG-PITCH] Node blurred:", data, state);
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
      />
    </div>
  </div>
</template>

<style scoped>
  /**
 * Pulse animation for highlighting position markers
 * The animation maintains the marker's centered position while scaling
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
