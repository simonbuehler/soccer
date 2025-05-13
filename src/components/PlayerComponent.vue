<script setup>
  import { usePlayer } from "@/composables/usePlayer";

  const props = defineProps({
    initialData: {
      type: Object,
      default: () => ({}),
    },
  });

  const { number, firstName, lastName, displayName, updateDisplayName } =
    usePlayer(props.initialData);
</script>

<template>
  <div class="player">
    <span>{{ displayName }}</span>
    <input v-model="firstName" placeholder="Vorname" />
    <input v-model="lastName" placeholder="Nachname" />
  </div>
</template>

<style scoped>
  .player {
    padding: 1rem;
    border: 1px solid #ccc;
    margin: 0.5rem;
  }
</style>
