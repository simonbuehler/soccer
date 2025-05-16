<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import PositionMarker from "./PositionMarker.vue";
import { useTacticManager } from "@/composables/useTacticManager";
import { usePlayerService } from "@/composables/usePlayerService";

import { useDragAndDrop } from "@formkit/drag-and-drop/vue";
import { dropOrSwap } from "@formkit/drag-and-drop";

const tacticManager = useTacticManager();

const playerService = usePlayerService();
const playersContainerRef = ref(null);

const svgDimensions = ref({
  width: 0,
  height: 0,
  left: 0,
  top: 0,
});

const positionMarkers = computed(() => tacticManager.getPositionMarkers());

onMounted(() => {
  window.addEventListener("resize", handleResize);
  updateSvgDimensions();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

function updateSvgDimensions() {
  if (window.matchMedia("print").matches) return;
  const svgRect = pitchRef.value?.querySelector("object")?.getBoundingClientRect();
  if (svgRect) {
    svgDimensions.value = {
      width: svgRect.width,
      height: svgRect.height,
      left: svgRect.left,
      top: svgRect.top,
    };
  }
}

function handleResize() {
  updateSvgDimensions();
}

// Übernommen aus useViewManager - Hervorhebt den nächsten Positionsmarker
function highlightClosestMarker(x, y) {
  if (!playersContainerRef.value) return null;

  const markers = Array.from(
    playersContainerRef.value.querySelectorAll(".position-marker")
  );
  let closestMarker = null;
  let minDistance = Infinity;
  const HIGHLIGHT_THRESHOLD = 15;

  markers.forEach((marker) => {
    const markerX = parseFloat(marker.dataset.x);
    const markerY = parseFloat(marker.dataset.y);
    const distance = Math.sqrt(Math.pow(x - markerX, 2) + Math.pow(y - markerY, 2));

    if (distance < minDistance) {
      minDistance = distance;
      closestMarker = marker;
    }
  });

  markers.forEach((marker) => {
    marker.classList.remove("border-4", "bg-blue-100/30", "animate-pulse-scale");
  });

  if (closestMarker && minDistance < HIGHLIGHT_THRESHOLD) {
    closestMarker.classList.add("border-4", "bg-blue-100/30", "animate-pulse-scale");
    return {
      x: parseFloat(closestMarker.dataset.x),
      y: parseFloat(closestMarker.dataset.y),
      shouldSnap: true,
    };
  }
  return null;
}

// Übernommen aus useViewManager - Prüft, ob ein Punkt innerhalb des Spielfelds liegt
function isPointInPitch(x, y) {
  const svgObject = pitchRef.value?.querySelector("object");
  if (!svgObject) return false;

  const svgDoc = svgObject.contentDocument;
  if (!svgDoc) return false;

  const svgElement = svgDoc.documentElement;
  const svgWidth = svgElement.width.baseVal.value;
  const svgHeight = svgElement.height.baseVal.value;

  const pitchRect = pitchRef.value.getBoundingClientRect();
  const svgX = (pitchRect.width - svgWidth) / 2;
  const svgY = (pitchRect.height - svgHeight) / 2;

  const svgRelativeX = x - svgX;
  const svgRelativeY = y - svgY;

  return (
    svgRelativeX >= 10 &&
    svgRelativeX <= svgWidth - 10 &&
    svgRelativeY >= 10 &&
    svgRelativeY <= svgHeight - 10
  );
}

// Direkter Zugriff auf die Spieler über den PlayerService
const pitchPlayers = computed(() => playerService.getPitchPlayers());

// Erstelle eine lokale, reaktive Kopie für FormKit als ARRAY
const formkitPlayers = ref([]);

// Aktualisiere die lokale Kopie, wenn sich die Original-Spieler ändern
watch(
  pitchPlayers,
  (newPlayers) => {
    // Stellen Sie sicher, dass newPlayers ein Array ist
    if (Array.isArray(newPlayers)) {
      formkitPlayers.value = [...newPlayers];
    } else {
      console.error("pitchPlayers is not an array:", newPlayers);
      formkitPlayers.value = [];
    }
  },
  { immediate: true }
);

// FormKit Drag & Drop setup mit der lokalen Kopie
const [pitchRef, players] = useDragAndDrop(formkitPlayers, {
  group: "players",
  plugins: [dropOrSwap()],
  draggable: (el) => {
    return el.classList.contains("player-token");
  },

  handleParentDrop(data, state) {
    // Konsistente ID-Ermittlung über currentTargetValue wie im Debug-Log sichtbar
    const playerId = state.currentTargetValue?.id;

    console.log("[DEBUG-PITCH] Player ID from currentTargetValue:", playerId);

    if (!playerId) {
      console.error("[ERROR-PITCH] Could not determine player ID for positioning");
      return;
    }

    // Berechne prozentuale Position
    const rect = pitchRef.value.getBoundingClientRect();
    const dropX = data.e.clientX - rect.left;
    const dropY = data.e.clientY - rect.top;

    const xPercent = Number(((dropX / rect.width) * 100).toFixed(2));
    const yPercent = Number(((dropY / rect.height) * 100).toFixed(2));

    // Überprüfe, ob der Punkt im Spielfeld liegt
    if (!isPointInPitch(dropX, dropY)) {
      console.warn("[WARNING-PITCH] Drop outside of pitch area");
      return;
    }

    // Versuche zuerst, den Spieler in formkitPlayers zu finden
    let droppedPlayer = formkitPlayers.value.find((p) => p.id === playerId);

    // Wenn nicht gefunden, überprüfe, ob es ein von der Bank gezogener Spieler ist
    if (!droppedPlayer) {
      console.log(
        "[DEBUG-PITCH] Player not found in formkitPlayers, checking in benchPlayers"
      );

      // Versuche, den Spieler direkt über den PlayerService zu finden
      droppedPlayer = playerService.findPlayer(playerId);

      if (droppedPlayer) {
        console.log("[DEBUG-PITCH] Player found via playerService:", droppedPlayer);

        // Füge den Spieler zur lokalen FormKit-Liste hinzu, damit er in der UI erscheint
        formkitPlayers.value.push(droppedPlayer);
      } else {
        console.error("[ERROR-PITCH] Player not found anywhere:", playerId);
        return;
      }
    }

    console.log("[DEBUG-PITCH] Found dropped player:", droppedPlayer);

    // Optional: Highlight-Marker-Logik verwenden
    const closestMarker = highlightClosestMarker(xPercent, yPercent);
    console.log("[DEBUG-PITCH] Closest marker result:", closestMarker);

    let positioningResult;
    
    if (closestMarker && closestMarker.shouldSnap) {
      // Snap zur Position des Markers
      console.log("[DEBUG-PITCH] Snapping player to marker position:", {
        x: closestMarker.x,
        y: closestMarker.y,
      });
      
      // Update im PlayerService
      positioningResult = playerService.handlePlayerPositioning(
        droppedPlayer,
        closestMarker.x,
        closestMarker.y
      );
    } else {
      // Aktualisiere die prozentuale Position direkt
      console.log("[DEBUG-PITCH] Setting player to calculated position:", {
        x: xPercent,
        y: yPercent,
      });
      
      // Update im PlayerService
      positioningResult = playerService.handlePlayerPositioning(
        droppedPlayer,
        xPercent,
        yPercent
      );
    }
    
    if (positioningResult && positioningResult.success) {
      console.log("[DEBUG-PITCH] Positioning successful:", positioningResult);
      
      if (positioningResult.swapped) {
        console.log("[DEBUG-PITCH] Player swap performed with:", positioningResult.swapped);
      }
    } else {
      console.error("[ERROR-PITCH] Positioning failed:", positioningResult?.error);
    }
  },
});

</script>

<template>
  <div class="relative" ref="pitchRef">
    <object
      style="pointer-events: none"
      :data="'/src/assets/pitch.svg'"
      type="image/svg+xml"
      class="block w-full lg:w-auto h-auto print:h-[850px] aspect-[2/3] lg:max-h-[calc(100vh-6rem)]"
    ></object>
    <div
      class="absolute w-full print:w-full lg:w-auto aspect-[2/3] lg:max-h-[calc(100vh-6rem)] inset-0 print:h-[850px]"
      ref="playersContainerRef"
    >
      <PositionMarker
        v-for="(marker, index) in positionMarkers"
        :key="`marker-${index}`"
        :marker="marker"
        :is-required="!tacticManager.getCurrentTactic()?.name.includes('Frei')"
      />
      <!-- WICHTIG: Jedes Element mit draggable muss auch data-id haben -->
      <div
        v-for="player in players"
        :key="player.id"
        :data-id="player.id"
        class="player-token absolute flex flex-col items-center justify-center cursor-move"
        :style="{
          left: `${player.percentX}%`,
          top: `${player.percentY}%`,
          transform: 'translate(-50%, -50%)',
        }"
      >
        <div
          class="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow"
        >
          {{ player.number || player.firstName[0] }}
        </div>
        <div class="player-name text-xs mt-1 bg-white px-1 rounded">
          {{ player.displayName }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-token {
  z-index: 10;
}

@keyframes pulse-scale {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

.animate-pulse-scale {
  animation: pulse-scale 1s infinite ease-in-out;
}
</style>
