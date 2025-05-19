<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import PositionMarker from "./PositionMarker.vue";
import { useTacticManager } from "@/composables/useTacticManager";
import { usePlayerService } from "@/composables/usePlayerService";
import { useAppStore } from "@/stores/appStore";
import { storeToRefs } from "pinia";
import { Player } from "@/core/models/Player";

import { dragAndDrop } from "@formkit/drag-and-drop/vue";
import {
  dropOrSwap,
  handleParentDragover,
  performTransfer,
} from "@formkit/drag-and-drop";

const tacticManager = useTacticManager();

const playerService = usePlayerService();
const playersContainerRef = ref(null);
const pitchRef = ref(null);
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

// Überarbeitete Funktion mit Tailwind-Klassen für die Origin
function highlightClosestMarker(xPercent, yPercent) {
  if (!playersContainerRef.value) return null;

  const markers = Array.from(
    playersContainerRef.value.querySelectorAll(".position-marker")
  );
  let closestMarker = null;
  let minDistance = Infinity;
  
  // Prozentuale Distanz auf 10% erhöht
  const HIGHLIGHT_THRESHOLD = 10; // 10% des Spielfelds

  markers.forEach((marker) => {
    // Marker-Position aus den Data-Attributen lesen
    const markerX = parseFloat(marker.dataset.x);
    const markerY = parseFloat(marker.dataset.y);

    // Distanzberechnung (jetzt korrekt, da die Marker bereits um 50% verschoben sind)
    const distance = Math.sqrt(
      Math.pow(xPercent - markerX, 2) + Math.pow(yPercent - markerY, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestMarker = marker;
    }
  });

  // Entferne alle Hervorhebungen mit Tailwind-Klassen
  markers.forEach((marker) => {
    marker.classList.remove(
      "animate-pulse-fast",
      "border-4",
      "shadow-lg", 
      "shadow-blue-500/50",
      "scale-[120%]",
      "z-10"
    );
  });

  if (closestMarker && minDistance < HIGHLIGHT_THRESHOLD) {
    // Kombiniere Animation mit origin-center für korrekte Zentrumsskalierung
    closestMarker.classList.add(
      "animate-pulse-fast",
      "scale-[120%]", 
      "border-4",
      "shadow-lg",
      "shadow-blue-500/50",
      "z-10"
    );
    
    return {
      x: parseFloat(closestMarker.dataset.x),
      y: parseFloat(closestMarker.dataset.y),
      shouldSnap: true,
    };
  }
  return null;
}

// Stattdessen prüfen wir einfach, ob der Prozentsatz im erlaubten Bereich liegt
function isInBounds(xPercent, yPercent) {
  // Ein kleiner Rand von 2% auf allen Seiten
  return xPercent >= 2 && xPercent <= 98 && yPercent >= 2 && yPercent <= 98;
}

const { fieldPlayers } = storeToRefs(useAppStore());

handleParentDragover = (data, state) => {
  // Client-Koordinaten des Drag-Events
  const clientX = data.e.clientX;
  const clientY = data.e.clientY;

  // Nur fortfahren, wenn ein Element gezogen wird
  if (!state.draggedNode) return;

  // Container-Position abrufen für relative Berechnung
  const containerRect = playersContainerRef.value.getBoundingClientRect();

  // Berechne prozentuale Position im Container
  const xPercent = Number(
    (((clientX - containerRect.left) / containerRect.width) * 100).toFixed(2)
  );
  const yPercent = Number(
    (((clientY - containerRect.top) / containerRect.height) * 100).toFixed(2)
  );

  // Nur wenn die Position innerhalb des Containers liegt
  if (isInBounds(xPercent, yPercent)) {
    highlightClosestMarker(xPercent, yPercent);
  }
};

dragAndDrop<Player>({
  parent: playersContainerRef,
  values: fieldPlayers,
  plugins: [dropOrSwap()],
  group: "players",
  draggable: (el) => {
    return el.classList.contains("player-token");
  },

  handleParentDragover: (data, state) => {
    // Client-Koordinaten des Drag-Events
    const clientX = data.e.clientX;
    const clientY = data.e.clientY;

    // Nur fortfahren, wenn ein Element gezogen wird
    if (!state.draggedNode) return;



    // Container-Position abrufen für relative Berechnung
    const containerRect = playersContainerRef.value.getBoundingClientRect();

    // Berechne prozentuale Position im Container
    const xPercent = Number(
      (((clientX - containerRect.left) / containerRect.width) * 100).toFixed(2)
    );
    const yPercent = Number(
      (((clientY - containerRect.top) / containerRect.height) * 100).toFixed(2)
    );

    // Nur wenn die Position innerhalb des Containers liegt
    if (xPercent >= 0 && xPercent <= 100 && yPercent >= 0 && yPercent <= 100) {
      // Highlight-Marker-Logik verwenden, um den nächsten Marker aufleuchten zu lassen
      highlightClosestMarker(xPercent, yPercent);
      
    
    }
  },

  handleParentDrop: (data, state) => {
    console.log("[DEBUG-PITCH] handleParentDrop", state.draggedNode.data.value.id);
    // Wir verwenden den bewährten Ansatz von BenchContainer für die ID-Ermittlung
    const playerId = state.draggedNode.data.value.id;

    if (!playerId) {
      console.error("[ERROR-PITCH] Could not determine player ID for positioning");
      return;
    }

    // Den Container der Spieler als Referenz für die Positionsberechnung verwenden
    // Dies ist das gleiche Element, in dem die Spieler-Tokens positioniert werden
    const containerRect = playersContainerRef.value.getBoundingClientRect();

    // Client-Koordinaten des Drop-Events
    const clientX = data.e.clientX;
    const clientY = data.e.clientY;

    // Berechne direkt die prozentuale Position bezogen auf den playersContainer
    // Da die Spieler mit percentX und percentY relativ zu diesem Container positioniert werden,
    // ist die Berechnung nun direkter und genauer
    const xPercent = Number(
      (((clientX - containerRect.left) / containerRect.width) * 100).toFixed(2)
    );
    const yPercent = Number(
      (((clientY - containerRect.top) / containerRect.height) * 100).toFixed(2)
    );

    // Debug-Informationen
    console.log({
      container: {
        left: containerRect.left,
        top: containerRect.top,
        width: containerRect.width,
        height: containerRect.height,
      },
      event: { x: clientX, y: clientY },
      percent: { x: xPercent, y: yPercent },
    });

    // Einfache Prüfung, ob der Punkt im Container liegt
    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) {
      console.warn("[WARNING-PITCH] Drop outside of container boundaries", {
        x: xPercent,
        y: yPercent,
      });
      return;
    }

    // Optional: Highlight-Marker-Logik verwenden
    const closestMarker = highlightClosestMarker(xPercent, yPercent);

    let positioningResult;

    if (closestMarker && closestMarker.shouldSnap) {
      // Snap zur Position des Markers
      positioningResult = playerService.handlePlayerPositioning(
        playerId,
        closestMarker.x,
        closestMarker.y
      );
      
      // NEU: Animation beenden, nachdem der Spieler an die Position "gesnapped" wurde
      // Entferne alle Hervorhebungen mit Tailwind-Klassen
      const markers = Array.from(
        playersContainerRef.value.querySelectorAll(".position-marker")
      );
      markers.forEach((marker) => {
        marker.classList.remove(
          "animate-pulse-fast",
          "border-4",
          "shadow-lg", 
          "shadow-blue-500/50",
          "scale-[120%]",
          "z-10"
        );
      });
    } else {
      // Aktualisiere die prozentuale Position direkt
      positioningResult = playerService.handlePlayerPositioning(
        playerId,
        xPercent,
        yPercent
      );
    }

    if (!positioningResult?.success) {
      console.error("[ERROR-PITCH] Positioning failed:", positioningResult?.error);
    }
  },
});
</script>

<template>
  <div class="relative">
    <!-- SVG Objekt mit dem Spielfeld -->
    <object
      style="pointer-events: none"
      :data="'/src/assets/pitch.svg'"
      type="image/svg+xml"
      class="block w-full lg:w-auto h-auto print:h-[850px] aspect-[2/3] lg:max-h-[calc(100vh-6rem)]"
      ref="pitchRef"
    ></object>

    <!-- Spieler-Container genau über dem SVG - mit identischen Dimensionen -->
    <div
      class="absolute w-full aspect-[2/3] inset-0 print:h-[850px]"
      ref="playersContainerRef"
    >
      <!-- Position Markers -->
      <PositionMarker
        v-for="(marker, index) in positionMarkers" 
        :key="`marker-${index}`" 
        :marker="marker"
        :is-required="!tacticManager.getCurrentTactic()?.name.includes('Frei')"
      />
      
      <!-- Spieler Tokens - Verbesserte Darstellung mit Tailwind -->
      <div
        v-for="player in fieldPlayers"
        :key="player.id"
        :data-id="player.id"
        class="player-token absolute flex flex-col items-center justify-center cursor-move transition-all duration-200 "
        :style="{
          left: `${player.percentX}%`,
          top: `${player.percentY}%`,
          transform: `translate(-50%, -50%)`,

        }"
      >
        <!-- Spieler-Kreis mit Namen und Nummer im Kreis -->
        <div
          class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-lg border-2 border-white relative hover:shadow-xl hover:scale-110 transition-all duration-200 overflow-hidden"
        >
          <!-- Große Nummer im Hintergrund des Kreises -->
          <div
            class="absolute inset-0 flex items-center justify-center opacity-30 font-extrabold text-5xl text-white select-none z-0"
          >
            {{ player.number || "#" }}
          </div>

          <!-- Spielername im Vordergrund -->
          <span class="text-sm font-bold tracking-tight z-10 relative">
            {{ player.displayName || player.firstName }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Optimierte Animation für korrekte Zentrumsskalierung */
@keyframes pulse-fast {
  0% { 
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1); /* Behalte die ursprüngliche Position */
  }
  50% { 
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2); /* Skaliere vom Zentrum aus */
  }
  100% { 
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1); /* Zurück zur Originalposition */
  }
}

.animate-pulse-fast {
  animation: pulse-fast 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  transform-origin: center; /* Stellt sicher, dass die Skalierung vom Zentrum aus erfolgt */
}

/* ...existing styles... */
</style>
