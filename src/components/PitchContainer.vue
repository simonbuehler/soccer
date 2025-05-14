<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import PitchPlayer from "./PitchPlayer.vue";
import PositionMarker from "./PositionMarker.vue";
import { useAppStore } from "@/stores/appStore";
import { usePlayerPool } from "@/composables/usePlayerPool";
import { useTacticManager } from "@/composables/useTacticManager";

const appStore = useAppStore();
const playerPool = usePlayerPool();
const tacticManager = useTacticManager();
const pitchRef = ref(null);
const playersContainerRef = ref(null);

const svgDimensions = ref({
  width: 0,
  height: 0,
  left: 0,
  top: 0
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
      top: svgRect.top
    };
  }
}

function handleResize() {
  updateSvgDimensions();
}

function handleDragStart(e, playerId) {
  e.dataTransfer.setData("text/plain", playerId);
  playerPool.setDraggedPlayer(playerId);
}

function handleDragEnd() {
  playerPool.setDraggedPlayer(null);
}

function handleDrop(e) {
  e.preventDefault();
  const playerId = e.dataTransfer.getData("text/plain");
  if (!playerId) return;

  const { left, top, width, height } = svgDimensions.value;
  if (!width || !height) return;

  const x = e.clientX - left;
  const y = e.clientY - top;
  
  // Convert to percentage coordinates
  const percentX = (x / width) * 100;
  const percentY = (y / height) * 100;

  playerPool.handlePlayerPositioning(playerId, percentX, percentY);
}
</script>

<template>
  <div class="relative" ref="pitchRef">
    <object
      :data="'/src/assets/pitch.svg'"
      type="image/svg+xml"
      class="block w-full lg:w-auto h-auto print:h-[850px] aspect-[2/3] lg:max-h-[calc(100vh-6rem)]"
    ></object>
    <div
      class="absolute w-full print:w-full lg:w-auto aspect-[2/3] lg:max-h-[calc(100vh-6rem)] inset-0 print:h-[850px]"
      ref="playersContainerRef"
      @dragover.prevent
      @drop="handleDrop"
    >
      <PositionMarker
        v-for="(marker, index) in positionMarkers"
        :key="`marker-${index}`"
        :marker="marker"
        :is-required="!tacticManager.getCurrentTactic()?.name.includes('Frei')"
      />
    </div>
  </div>
</template>
