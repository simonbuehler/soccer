<script setup>
import { ref, computed, onMounted } from "vue";
import { useTacticManager } from "@/composables/useTacticManager";
import TacticInfoModal from "@/components/TacticInfoModal.vue";

const tacticManager = useTacticManager();

// Initialize default tactic on mount
onMounted(() => {
  if (!tacticManager.getCurrentTactic()) {
    const tactics = tacticManager.getTacticsForCurrentGameType();
    if (tactics.length > 0) {
      tacticManager.setTactic(tactics[0].name);
    }
  }
});
const showTacticInfo = ref(false);

// Define component emits
const emit = defineEmits(["open-player-dialog"]);

const gameTypes = [
  { value: 7, label: "7er" },
  { value: 9, label: "9er" },
  { value: 11, label: "11er" },
];

const currentTactic = computed(() => tacticManager.getCurrentTactic());
const tactics = computed(() => tacticManager.getTacticsForCurrentGameType());
const currentGameType = computed(() => tacticManager.getCurrentGameType());

function setGameType(type) {
  if (currentGameType.value === type) return;
  tacticManager.setGameType(type);
  tacticManager.redistributePlayers();
}

function setTactic(tacticName) {
  const result = tacticManager.setTactic(tacticName);
  if (result) {
    tacticManager.redistributePlayers();
  }
}

function openPlayerDialog() {
  emit("open-player-dialog");
}

function handlePrint() {
  window.print();
}

function toggleTacticInfo() {
  showTacticInfo.value = !showTacticInfo.value;
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-lg p-4 hover:bg-gray-50 transition-colors duration-200 print:hidden">
    <h2 class="text-xl font-bold text-gray-800 border-b pb-2">Aktionen</h2>
    <div class="mt-4 flex flex-wrap justify-center gap-3">
      <!-- Spielart Auswahl -->
      <div class="w-full mb-3">
        <label class="block text-sm font-medium text-gray-700 mb-2">Spielfeldgröße:</label>
        <div class="flex gap-3 bg-gray-100 p-1.5 rounded-xl">
          <button v-for="type in gameTypes" :key="type.value" @click="setGameType(type.value)"
            class="flex-1 py-2.5 px-3 rounded-lg transition-all duration-200 font-medium text-center" :class="{
              'bg-green-700 text-white shadow-lg transform scale-105':
                currentGameType === type.value,
              'bg-white text-gray-700 hover:bg-gray-50 hover:shadow':
                currentGameType !== type.value,
            }">
            {{ type.label }}
          </button>
        </div>
      </div>

      <!-- Taktik Auswahl -->
      <div class="w-full">
        <label class="block text-sm font-medium text-gray-700 mb-1">Taktik wählen:</label>
        <div class="flex items-center gap-4">

          <select :value="currentTactic?.name || ''" @change="setTactic($event.target.value)"
            class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            <option v-for="tactic in tactics" :key="tactic.name" :value="tactic.name">
              {{ tactic.name }}
            </option>
          </select>

          <!-- Style 1: Textbutton mit Icon -->
          <button v-if="currentTactic?.extendedDescription" @click="toggleTacticInfo"
            class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center gap-1 transition-colors"
            title="Mehr Informationen zur Taktik">
            <span class="text-lg">ℹ️</span>
            <span class="text-sm font-medium">Details</span>
          </button>

        </div>

        <!-- Taktik-Informationen -->
        <div v-if="currentTactic?.description" class="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
          <p class="text-sm font-semibold text-gray-800">
            {{ currentTactic.description }}
          </p>
          <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
            <li v-for="(point, index) in currentTactic.bulletpoints" :key="index">
              {{ point }}
            </li>
          </ul>
        </div>
      </div>

      <button @click="openPlayerDialog"
        class="w-full px-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow transition-all duration-200 hover:shadow-md">
        Spieler hinzufügen
      </button>
      <button @click="handlePrint"
        class="w-full px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition-all duration-200 hover:shadow-md">
        Drucken
      </button>
    </div>

    <TacticInfoModal v-model="showTacticInfo" :tactic="currentTactic" />
  </div>
</template>
