<script setup>
import { computed, ref, watch } from "vue";
import { useDragAndDrop } from "@formkit/drag-and-drop/vue";
import { usePlayerService } from "@/composables/usePlayerService";
import { dropOrSwap } from "@formkit/drag-and-drop";

// PlayerService importieren
const playerService = usePlayerService();

// Direkter Zugriff auf die Bankspieler über den PlayerService
const benchPlayers = computed(() => playerService.getBenchPlayers());
const hasPlayers = computed(() => benchPlayers.value.length > 0);
const showPlaceholder = computed(() => !hasPlayers.value);

// Erstelle eine lokale, reaktive Kopie für FormKit als ARRAY
const formkitPlayers = ref([]);

// Aktualisiere die lokale Kopie, wenn sich die Original-Spieler ändern
watch(
  benchPlayers,
  (newPlayers) => {
    // Stellen Sie sicher, dass newPlayers ein Array ist
    if (Array.isArray(newPlayers)) {
      formkitPlayers.value = [...newPlayers];
    } else {
      console.error("[ERROR-BENCH] benchPlayers is not an array:", newPlayers);
      formkitPlayers.value = [];
    }
  },
  { immediate: true }
);

// FormKit Drag & Drop mit der lokalen, reaktiven Kopie
const [benchRef, players] = useDragAndDrop(formkitPlayers, {
  group: "players",
  plugins: [dropOrSwap()],

  handleParentDrop(data, state) {
    // Wir brauchen die ID aus dem currentTargetValue
    const playerId = state.currentTargetValue?.id;

    console.log("[DEBUG-BENCH] Player ID from currentTargetValue:", playerId);

    if (!playerId) {
      console.error("[ERROR-BENCH] Missing player ID");
      return;
    }

    // Finde den entsprechenden Player, da wir jetzt ein Player-Objekt übergeben müssen
    const player = playerService.findPlayer(playerId);

    if (!player) {
      console.error("[ERROR-BENCH] Player not found with ID:", playerId);
      return;
    }

    console.log("[DEBUG-BENCH] Moving player to bench:", player);

    // Übergebe das Player-Objekt an playerService
    const result = playerService.movePlayer(player, { location: "bench" });

    if (result.success) {
      console.log("[DEBUG-BENCH] Player successfully moved to bench");
    } else {
      console.error("[ERROR-BENCH] Failed to move player to bench:", result.error);
    }
  },
});
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-lg p-4 hover:bg-gray-50 transition-colors duration-200 print:shadow-none print:w-4/5 print:mx-auto print:mt-1 print:p-2"
  >
    <h2 class="text-xl font-bold text-gray-800 border-b pb-2 print:text-lg print:pb-1">
      Ersatzbank
    </h2>
    <div
      ref="benchRef"
      class="mt-4 flex flex-wrap gap-2 w-full print:mt-1 print:gap-1 print:justify-start"
      :class="{
        'border-2 border-dashed border-blue-600 rounded-lg p-2 bg-blue-50 min-h-20': hasPlayers,
      }"
    >
      <!-- WICHTIG: Jedes Element mit draggable muss auch data-id haben -->
      <div
        v-for="player in players"
        :key="player.id"
        :data-id="player.id"
        class="player bg-blue-600 text-white mb-2 px-3 py-2 rounded-lg cursor-move"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-bold"
          >
            {{ player.number || "?" }}
          </div>
          <span>{{ player.displayName }}</span>
        </div>
      </div>
    </div>
    <p
      v-if="showPlaceholder"
      class="text-gray-500 text-sm text-center mt-4 lg:mt-8 px-4 print:hidden"
    >
      Hier ist es leer - Spieler hinzufügen über den Button
    </p>
  </div>
</template>

<style scoped>
.player {
  transition: transform 0.2s, box-shadow 0.2s;
}

.player:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
