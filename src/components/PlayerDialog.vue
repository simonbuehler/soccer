<script setup lang="ts">
  import { ref, onMounted, nextTick, watch } from "vue";
  import { usePlayerService } from "@/composables/usePlayerService";
  import { PlayerData } from "@/core/models/Player";

  // Define isOpen prop
  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(["update:modelValue", "added"]);
  const playerInput = ref<string>("");
  const inputRef = ref<HTMLTextAreaElement | null>(null);
  const playerService = usePlayerService();
  const errors = ref<string[]>([]);

  // Focus textarea when dialog opens
  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (isOpen) {
        await nextTick();
        inputRef.value?.focus();
      }
    }
  );

  // Handle dialog close
  function closeDialog() {
    errors.value = [];
    emit("update:modelValue", false);
  }

  function parsePlayerInput(line: string): PlayerData {
    let numberStr, firstNameStr, lastNameStr;

    const parts = line.split(",");
    if (parts.length >= 2) {
      const numberPartRaw = parts[0].trim();
      // Extrahiere nur den ersten Vornamen, falls mehrere angegeben sind
      firstNameStr = parts[1].trim().split(/\s+/)[0].trim();

      const numberAndLastName = numberPartRaw.split(/\s+/);
      numberStr = numberAndLastName[0].trim();
      lastNameStr =
        numberAndLastName.length > 1
          ? numberAndLastName.slice(1).join(" ").trim()
          : "";

      if (parts.length > 2) {
        lastNameStr = parts
          .slice(1)
          .join(",")
          .trim()
          .split(/\s+/)
          .slice(1)
          .join(" ");
        // Bei komplexeren Eingaben ebenfalls nur den ersten Vornamen nehmen
        firstNameStr = parts[1].trim().split(/\s+/)[0].trim();
      }
    } else {
      const spaceParts = line.split(/\s+/);
      if (spaceParts.length >= 2) {
        numberStr = spaceParts[0].trim();
        // Nur den ersten Vornamen nehmen
        firstNameStr = spaceParts[1].trim();
        lastNameStr =
          spaceParts.length > 2 ? spaceParts.slice(2).join(" ").trim() : "";
      } else {
        throw new Error(`Invalid player format: "${line}"`);
      }
    }

    if (!numberStr || !firstNameStr) {
      throw new Error(`Missing number or first name: "${line}"`);
    }

    const number = parseInt(numberStr);
    if (isNaN(number)) {
      throw new Error(`Invalid player number: "${numberStr}"`);
    }

    return {
      number,
      firstName: firstNameStr,
      lastName: lastNameStr || "",
      percentX: 0,
      percentY: 0,
    };
  }

  function addPlayers() {
    const inputText = playerInput.value.trim();
    if (!inputText) return;

    errors.value = [];
    let addedCount = 0;

    inputText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .forEach((line) => {
        try {
          const playerData = parsePlayerInput(line);

          // Nutze playerService.addPlayer statt playerPool.addPlayer
          if (playerService.addPlayer(playerData)) {
            addedCount++;
          } else {
            // Spieler existiert bereits
            errors.value.push(`${line}: Player already exists`);
          }
        } catch (e) {
          // Fehler beim Parsen der Eingabe
          errors.value.push(`${line}: ${(e as Error).message}`);
        }
      });

    if (addedCount > 0) {
      playerInput.value = "";
      emit("added", addedCount);

      // Wenn alle Spieler erfolgreich hinzugefügt wurden (keine Fehler), Dialog schließen
      if (errors.value.length === 0) {
        closeDialog();
      }
    }
  }

  function closeErrorsOnly() {
    errors.value = [];
  }
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      style="z-index: 10000"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      role="dialog"
      aria-labelledby="dialog-title"
      @keydown.esc="closeDialog"
    >
      <div
        class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4"
        @click.stop
      >
        <h2 id="dialog-title" class="text-2xl font-bold text-gray-800 mb-4">
          Spieler hinzufügen
        </h2>

        <Transition name="slide-fade">
          <div
            v-if="errors.length > 0"
            class="mb-4 bg-red-50 border border-red-300 rounded-lg overflow-hidden"
          >
            <div class="sticky top-0 bg-red-100 px-3 py-2 flex justify-between items-center border-b border-red-300">
              <h3 class="text-red-700 font-medium text-sm">Fehler beim Hinzufügen</h3>
              <button
                @click="closeErrorsOnly"
                class="text-red-500 hover:text-red-700 p-1 -mr-1"
                type="button"
                aria-label="Fehler ausblenden"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div class="max-h-32 overflow-y-auto p-2">
              <ul class="text-xs text-red-600 space-y-1">
                <li v-for="(error, index) in errors" :key="index" class="px-2 py-1 rounded hover:bg-red-100">
                  {{ error }}
                </li>
              </ul>
            </div>
          </div>
        </Transition>

        <textarea
          ref="inputRef"
          v-model="playerInput"
          class="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Unterstützte Formate (ein Spieler pro Zeile):&#10;1. Nummer Nachname, Vorname (z.B. 10 Müller, Thomas)&#10;2. Nummer Nachname Vorname (z.B. 10 Müller Thomas)&#10;3. Nummer, Vorname, Nachname (z.B. 10, Thomas, Müller)&#10;&#10;Hinweis: Bei mehreren Vornamen wird nur der erste verwendet"
          rows="7"
        ></textarea>
        <div class="flex justify-end space-x-3">
          <button
            @click="closeDialog"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            @click="addPlayers"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
  /* Füge ein spezifisches Styling für die Fehleranzeige hinzu */
  .error-notification {
    z-index: 100;
    position: relative;
  }

  /* Animation for error panel */
  .slide-fade-enter-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateY(-20px);
    opacity: 0;
  }

  /* Custom scrollbar for error list */
  .max-h-32::-webkit-scrollbar {
    width: 6px;
  }

  .max-h-32::-webkit-scrollbar-track {
    background: rgba(254, 226, 226, 0.5);
  }

  .max-h-32::-webkit-scrollbar-thumb {
    background-color: rgba(248, 113, 113, 0.5);
    border-radius: 3px;
  }
</style>
