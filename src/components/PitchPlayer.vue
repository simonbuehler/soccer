<script setup>
  import { computed } from "vue";

  const props = defineProps({
    player: {
      type: Object,
      required: true,
    },
    disablePointerEvents: {
      type: Boolean,
      default: false,
    },
  });

  const positionStyle = computed(() => ({
    left: `${props.player.percentX}%`,
    top: `${props.player.percentY}%`,
    pointerEvents: props.disablePointerEvents ? "none" : "auto",
  }));
</script>

<template>
  <div
    class="player-token absolute flex flex-col items-center justify-center cursor-move transition-all duration-200"
    :style="{
      ...positionStyle,
      transform: 'translate(-50%, -50%)',
    }"
    :data-player-id="player.id"
  >
    <!-- Player visual representation -->
    <div
      class="w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg border-2 border-white relative hover:shadow-xl hover:scale-110 transition-all duration-200 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700"
    >
      <!-- Player number in background -->
      <div
        class="absolute inset-0 flex items-center justify-center opacity-30 font-extrabold text-5xl text-white select-none z-0"
      >
        {{ player.number || "#" }}
      </div>

      <!-- Player name in foreground -->
      <span class="text-sm font-bold tracking-tight z-10 relative">
        {{ player.displayName || player.firstName }}
      </span>
    </div>
  </div>
</template>
