<script setup lang="ts">
import { ref } from "vue";
import { useDragAndDrop } from "@formkit/drag-and-drop/vue";

/* Ausgangs­daten der Bank */
const bench = ref([
  { id: 1, name: "Neuer" },
  { id: 2, name: "Kroos" },
  { id: 3, name: "Müller" },
  { id: 4, name: "Kimmich" },
  { id: 5, name: "Gündoğan" },
]);

/* gleiche Gruppe wie Spielfeld → freies Hin- und Herschieben */
const [bankRef, players] = useDragAndDrop(bench, {
  group: "players",
  draggingClass: "bg-red-500",
  handleDragend(data, state) {
    console.log("Drag-and-Drop abgeschlossen:", data, state);
  },
});
</script>

<template>
  <div class="bg-white p-4 rounded shadow space-y-2 select-none">
    <h2 class="text-lg font-bold mb-2">Bank</h2>

    <ul ref="bankRef" class="space-y-2">
      <li v-for="p in players" :key="p.id" class="p-2 bg-gray-100 rounded cursor-move">
        {{ p.name }}
      </li>
    </ul>
  </div>
</template>
