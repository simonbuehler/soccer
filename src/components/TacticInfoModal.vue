<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Tactic } from '@/core/models/allTactics'
import { useTacticManager } from '@/composables/useTacticManager'

const tacticManager = useTacticManager()
const tactics = computed(() => tacticManager.getTacticsForCurrentGameType())
const currentIndex = computed(() => 
  tactics.value.findIndex(t => t.name === props.tactic?.name)
)

function nextTactic() {
  if (currentIndex.value < tactics.value.length - 1) {
    const nextTactic = tactics.value[currentIndex.value + 1]
    tacticManager.setTactic(nextTactic.name)
    tacticManager.redistributePlayers();
  }
}

function prevTactic() {
  if (currentIndex.value > 0) {
    const prevTactic = tactics.value[currentIndex.value - 1]
    tacticManager.setTactic(prevTactic.name)
    tacticManager.redistributePlayers();
  }
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  tactic: {
    type: Object as () => Tactic | null,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

function closeModal() {
  emit('update:modelValue', false)
}

// Close on ESC
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeyDown)
  } else {
    document.removeEventListener('keydown', handleKeyDown)
  }
})

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeModal()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        style="z-index: 10000"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300"
        @click.self="closeModal"
      >
        <div class="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200/50">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex justify-between items-center">
            <h2 class="text-xl font-bold text-white">
              Taktik-Informationen
            </h2>
            <button
              @click="closeModal"
              class="text-white/80 hover:text-white p-1 -mr-2 transition-colors"
              aria-label="Schließen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div v-if="tactic" class="space-y-6">
              <div class="text-center">
                <h3 class="text-2xl font-bold text-blue-600">{{ tactic.name }}</h3>
                <p class="text-gray-500 mt-2">{{ tactic.description }}</p>
              </div>

              <div class="bg-white/50 p-5 rounded-xl border border-gray-200/50 shadow-sm">
                <h4 class="font-semibold text-gray-700 mb-3 text-lg border-b pb-2">Schlüsselmerkmale</h4>
                <ul class="space-y-3">
                  <li v-for="(point, i) in tactic.bulletpoints" :key="`point-${i}`" class="flex items-start">
                    <span class="text-blue-500 mr-2 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    </span>
                    <span class="text-gray-700">{{ point }}</span>
                  </li>
                </ul>
              </div>

              <div class="bg-white/50 p-5 rounded-xl border border-gray-200/50 shadow-sm">
                <h4 class="font-semibold text-gray-700 mb-3 text-lg border-b pb-2">Ausführliche Beschreibung</h4>
                <p class="whitespace-pre-line text-gray-600 leading-relaxed">{{ tactic.extendedDescription }}</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-4 border-t border-gray-200/50 flex justify-between items-center">
            <div class="flex gap-3">
              <button
                @click="prevTactic"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="currentIndex <= 0"
              >
                ← Vorherige
              </button>
              <button
                @click="nextTactic"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="currentIndex >= tactics.length - 1"
              >
                Nächste →
              </button>
            </div>
            <button
              @click="closeModal"
              class="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Verstanden
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
