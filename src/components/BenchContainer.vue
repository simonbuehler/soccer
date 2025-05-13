<script setup>
  import { ref, onMounted } from "vue";
  import BenchPlayer from "./BenchPlayer.vue";
  import { useViewManager } from "@/composables/useViewManager";
  import { useEventHandler } from "@/composables/useEventHandler";

  const viewManager = useViewManager();
  const eventHandler = useEventHandler();
  const substitutesList = ref(null);
  const placeholder = ref(null);

  onMounted(() => {
    viewManager.init({
      substitutes: substitutesList.value,
      placeholder: placeholder.value,
    });
  });

  function handleDragStart(e, playerId) {
    eventHandler.handleDragStart(e, playerId);
  }

  function handleDragEnd(e, playerId) {
    eventHandler.handleDragEnd(e, playerId);
  }

  function handleTouchStart(e, playerId) {
    return eventHandler.handleTouchStart(e, playerId);
  }

  function handleTouchEnd(e, playerId) {
    eventHandler.handleTouchEnd(e, playerId);
  }

  function handleDrop(e) {
    e.preventDefault();
    const playerId = e.dataTransfer.getData("text/plain");
    if (playerId) {
      eventHandler.handleTouchEnd(
        {
          preventDefault: () => {},
          changedTouches: [
            {
              clientX: e.clientX,
              clientY: e.clientY,
              identifier: Date.now(),
            },
          ],
        },
        playerId
      );
    }
  }
</script>

<template>
  <div class="bench-container">
    <div
      id="substitutes-placeholder"
      ref="placeholder"
      class="min-h-20 border-2 border-dashed border-blue-600 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"
    >
      Spieler hinzufügen
    </div>
    <ul
      id="substitutes"
      ref="substitutesList"
      class="space-y-2"
      @dragover.prevent
      @drop="handleDrop"
    >
      <!-- Bench players will be rendered here -->
    </ul>
  </div>
</template>
