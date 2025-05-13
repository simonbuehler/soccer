<script setup>
  import { defineEmits, watch } from "vue";
  import { usePlayerInputHandler } from "@/composables/usePlayerInputHandler";
  import { useAppStore } from "@/stores/appStore";

  const emit = defineEmits(["close"]);
  const appStore = useAppStore();
  const { playerInput, addPlayers } = usePlayerInputHandler();

  // Verify store initialization
  watch(
    () => appStore.playerPool,
    (newVal) => {
      if (!newVal) {
        console.error("PlayerPool not available in store");
      }
    },
    { immediate: true }
  );

  async function handleAddPlayers() {
    try {
      if (!playerInput.value.trim()) {
        console.warn("Empty player input");
        return;
      }

      await addPlayers();
      emit("close");

      // Reset input after successful addition
      playerInput.value = "";
    } catch (error) {
      console.error("Error adding players:", error);
    }
  }
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Spieler hinzufügen</h2>
      <textarea
        v-model="playerInput"
        class="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Nummer Nachname, Vorname (z.B. 10 Müller, Thomas)"
        rows="5"
      ></textarea>
      <div class="flex justify-end space-x-3">
        <button
          @click="emit('close')"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
        >
          Abbrechen
        </button>
        <button
          @click="handleAddPlayers"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          Hinzufügen
        </button>
      </div>
    </div>
  </div>
</template>
