<script setup>
  const props = defineProps({
    player: {
      type: Object,
      required: true,
    },
  });
</script>

<template>
  <li
    class="player bg-blue-600 text-white mb-2 px-3 py-2 rounded-lg cursor-move"
    :data-player-id="player.id"
    draggable="true"
    @dragstart="(e) => $emit('dragstart', e, player.id)"
    @dragend="(e) => $emit('dragend', e, player.id)"
  >
    {{ player.displayName }}
  </li>
</template>
