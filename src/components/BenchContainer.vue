<script setup lang="ts">
  import { computed, ref } from "vue";
  import { dragAndDrop } from "@formkit/drag-and-drop/vue";
  import { dropOrSwap } from "@formkit/drag-and-drop";
  import { useAppStore } from "@/stores/appStore";
  import { storeToRefs } from "pinia";
  import { Player } from "@/core/models/Player";

  const { benchPlayers, fieldPlayers } = storeToRefs(useAppStore());

  const hasPlayersOnBench = computed(() => benchPlayers.value.length > 0);
  const hasPlayersOnField = computed(() => fieldPlayers.value.length > 0);


  const showEmptyGamePlaceholder = computed(
    () => !hasPlayersOnBench.value && !hasPlayersOnField.value
  );

  const showAllOnFieldPlaceholder = computed(
    () => !hasPlayersOnBench.value && hasPlayersOnField.value
  );

  const benchRef = ref();
  dragAndDrop<Player>({
    parent: benchRef,
    values: benchPlayers,
    plugins: [dropOrSwap()],
    group: "players",
    draggable: (el) => {
      return el.classList.contains("player");
    },
  });
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-lg p-4 hover:bg-gray-50 transition-colors duration-200 print:shadow-none print:w-4/5 print:mx-auto print:mt-1 print:p-2"
  >
    <h2
      class="text-xl font-bold text-gray-800 border-b pb-2 print:text-lg print:pb-1"
    >
      Ersatzbank
    </h2>
    <!-- Immer eine Mindesthöhe anwenden, auch wenn keine Spieler vorhanden sind -->
    <div
      ref="benchRef"
      class="mt-4 flex flex-wrap gap-3 w-full print:mt-1 print:gap-1 print:justify-start min-h-20 border-2 border-dashed border-blue-600 rounded-lg p-3 bg-blue-50"
    >
      <!-- WICHTIG: Jedes Element mit draggable muss auch data-id haben -->
      <div
        v-for="player in benchPlayers"
        :key="player.id"
        class="player bg-gradient-to-br from-blue-500 to-blue-700 text-white px-3 py-2 rounded-lg cursor-move transition-all duration-200 hover:-translate-y-1 hover:shadow-lg shadow-md min-w-32"
      >
        <div class="flex items-center gap-3 relative">
          <!-- Hintergrundnummer entfernt, da sie redundant ist -->

          <!-- Spielernummer im Kreis -->
          <div
            class="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center font-bold text-lg border border-blue-300 shadow-inner"
          >
            {{ player.number || "#" }}
          </div>

          <!-- Spielername -->
          <span class="font-bold truncate">
            {{ player.displayName }}
          </span>
        </div>
      </div>

      <!-- Unterschiedliche Platzhalter-Nachrichten je nach Zustand -->
      <p
        v-if="showEmptyGamePlaceholder"
        class="text-gray-500 text-sm text-center w-full mt-2 px-4 print:hidden"
      >
        Hier ist es leer - Spieler hinzufügen über den Button
      </p>
      <p
        v-else-if="showAllOnFieldPlaceholder"
        class="text-gray-500 text-sm text-center w-full mt-2 px-4 print:hidden"
      >
        Alle Spieler sind auf dem Feld - hierher ziehen für Auswechslung
      </p>
    </div>
  </div>
</template>
