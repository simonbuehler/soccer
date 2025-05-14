<script setup>
import { computed } from "vue"
import { usePlayerPool } from "@/composables/usePlayerPool"
import BenchPlayer from "./BenchPlayer.vue"
import { VueDraggableNext } from 'vue-draggable-next'

const playerPool = usePlayerPool()
const benchPlayers = computed(() => playerPool.getBenchPlayers())

function onStart({ item }) {
  playerPool.setDraggedPlayer(item.dataset.playerId)
}
</script>

<template>
  <div class="bench-container bg-white p-4 rounded-lg shadow-md">
    <h2 class="text-xl font-bold mb-4">Spielerbank</h2>
    <VueDraggableNext
      :list="benchPlayers"
      item-key="id"
      tag="ul"
      :group="{ name: 'players', pull: 'clone', put: false }"
      @start="onStart"
      class="space-y-2"
    >
      <BenchPlayer 
        v-for="player in benchPlayers"
        :key="player.id"
        :player="player"
        :data-player-id="player.id"
      />
    </VueDraggableNext>
  </div>
</template>

<style>
.bench-container {
  min-height: 300px;
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
}
</style>
