<script setup>
  import { computed } from "vue";
  import { useAppStore } from "@/stores/appStore";

  const appStore = useAppStore();
  const currentTactic = computed(() =>
    appStore.tacticManager.getCurrentTactic()
  );

  const emit = defineEmits(["close"]);
</script>

<template>
  <div
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center px-4"
  >
    <div
      class="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white"
    >
      <div class="flex justify-between items-center pb-3 border-b">
        <h3 class="text-xl font-bold text-gray-900">
          {{ currentTactic?.name || "Taktik Details" }}
        </h3>
        <button
          @click="emit('close')"
          class="text-gray-400 hover:text-gray-600 focus:outline-none"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="mt-3">
        <p
          v-if="currentTactic?.extendedDescription"
          class="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
          v-html="currentTactic.extendedDescription.replace(/\n/g, '<br>')"
        ></p>
        <p v-else class="text-gray-500 italic">
          Keine erweiterte Beschreibung verfügbar
        </p>
      </div>
    </div>
  </div>
</template>
