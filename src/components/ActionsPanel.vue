<script setup>
  import { ref, computed } from "vue";
  import { useAppStore } from "@/stores/appStore";

  const appStore = useAppStore();
  const showTacticInfo = ref(false);

  const gameTypes = [
    { value: 7, label: "7er" },
    { value: 9, label: "9er" },
    { value: 11, label: "11er" },
  ];

  const currentTactic = computed(() =>
    appStore.tacticManager.getCurrentTactic()
  );
  const tactics = computed(() =>
    appStore.tacticManager.getTacticsForCurrentGameType()
  );

  function setGameType(type) {
    appStore.tacticManager.setGameType(type);
  }

  function setTactic(tacticName) {
    appStore.tacticManager.setTactic(tacticName);
  }
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-lg p-4 hover:bg-gray-50 transition-colors duration-200 print:hidden"
  >
    <h2 class="text-xl font-bold text-gray-800 border-b pb-2">Aktionen</h2>
    <div class="mt-4 flex flex-wrap justify-center gap-3">
      <!-- Spielart Auswahl -->
      <div class="w-full flex gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          v-for="type in gameTypes"
          :key="type.value"
          @click="setGameType(type.value)"
          class="flex-1 py-2 px-3 rounded-md transition-colors"
          :class="{
            'bg-blue-500 text-white':
              appStore.tacticManager.currentGameType === type.value,
          }"
        >
          {{ type.label }}
        </button>
      </div>

      <!-- Taktik Auswahl -->
      <div class="w-full">
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Taktik wählen:</label
        >
        <div class="flex items-center">
          <select
            v-model="currentTactic.name"
            @change="setTactic($event.target.value)"
            class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option
              v-for="tactic in tactics"
              :key="tactic.name"
              :value="tactic.name"
            >
              {{
                tactic.name.replace(
                  `${appStore.tacticManager.currentGameType}er `,
                  ""
                )
              }}
            </option>
          </select>

          <button
            v-if="currentTactic?.extendedDescription"
            @click="showTacticInfo = true"
            class="ml-2 p-2 text-blue-600 hover:text-blue-800 focus:outline-none"
            title="Mehr Informationen zur Taktik"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        <!-- Taktik-Informationen -->
        <div
          v-if="currentTactic?.description"
          class="mt-3 p-3 bg-gray-50 rounded border border-gray-200"
        >
          <p class="text-sm font-semibold text-gray-800">
            {{ currentTactic.description }}
          </p>
          <ul class="list-disc list-inside text-xs text-gray-600 mt-1">
            <li
              v-for="(point, index) in currentTactic.bulletpoints"
              :key="index"
            >
              {{ point }}
            </li>
          </ul>
        </div>
      </div>

      <button
        @click="$emit('openPlayerDialog')"
        class="px-6 lg:w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow transition-all duration-200 hover:shadow-md"
      >
        Spieler hinzufügen
      </button>
      <button
        @click="$emit('print')"
        class="px-6 lg:w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition-all duration-200 hover:shadow-md"
      >
        Drucken
      </button>
    </div>
  </div>
</template>
