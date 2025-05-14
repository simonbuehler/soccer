<script setup>
  import { computed } from "vue";

  const props = defineProps({
    player: {
      type: Object,
      required: true,
    },
  });

  const positionStyle = computed(() => ({
    left: `${props.player.percentX}%`,
    top: `${props.player.percentY}%`,
  }));
</script>

<template>
  <div
    class="player-position absolute w-14 h-14 bg-white/90 rounded-full font-bold text-lg shadow-lg cursor-move border-2 border-grey-600 backdrop-blur-sm overflow-hidden"
    :style="positionStyle"
    draggable="true"
    :data-player-id="player.id"
    @dragstart="(e) => $emit('dragstart', e, player.id)"
    @dragend="(e) => $emit('dragend', e, player.id)"
  >
    <div
      class="absolute inset-0 flex items-center justify-center text-4xl font-bold text-green-600/50"
    >
      {{ player.number }}
    </div>
    <div
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-xs font-bold text-center text-grey-800"
    >
      {{ player.displayName }}
    </div>
  </div>
</template>
