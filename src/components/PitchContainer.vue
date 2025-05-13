<script setup>
  import { ref, onMounted, onUnmounted } from "vue";
  import PitchPlayer from "./PitchPlayer.vue";
  import PositionMarker from "./PositionMarker.vue";
  import { useAppStore } from "@/stores/appStore";

  const appStore = useAppStore();
  const viewManager = appStore.viewManager;
  const eventHandler = appStore.eventHandler;
  const containerRefs = ref({
    pitch: null,
    players: null,
    substitutes: null,
    placeholder: null,
  });

  onMounted(() => {
    viewManager.init(containerRefs.value);
    window.addEventListener("resize", handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
  });

  function handleResize() {
    if (window.matchMedia("print").matches) return;
    const svgRect = containerRefs.value.pitch
      .querySelector("object")
      ?.getBoundingClientRect();
    if (svgRect) {
      viewManager.updateDimensions({
        width: svgRect.width,
        height: svgRect.height,
        left: svgRect.left,
        top: svgRect.top,
      });
    }
  }

  function handleDragStart(e, playerId) {
    eventHandler.handleDragStart(e, playerId);
  }

  function handleDragEnd(e, playerId) {
    eventHandler.handleDragEnd(e, playerId);
  }

  function handleDrop(e) {
    e.preventDefault();
    const playerId = e.dataTransfer.getData("text/plain");
    if (playerId) {
      const svgRect = containerRefs.value.pitch
        .querySelector("object")
        ?.getBoundingClientRect();
      if (svgRect) {
        const x = e.clientX - svgRect.left;
        const y = e.clientY - svgRect.top;
        eventHandler.handleTouchEnd(
          {
            preventDefault: () => {},
            changedTouches: [{ clientX: e.clientX, clientY: e.clientY }],
          },
          playerId
        );
      }
    }
  }
</script>

<template>
  <div class="pitch-container" ref="containerRefs.pitch">
    <object
      :data="'/src/assets/pitch.svg'"
      type="image/svg+xml"
      class="w-full h-full"
    ></object>
    <div
      class="players-container"
      ref="containerRefs.players"
      @dragover.prevent
      @drop="handleDrop"
    >
      <!-- Players and markers will be rendered here -->
    </div>
  </div>
</template>
