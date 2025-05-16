import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStore = defineStore("app", () => {
  // Reactive state only
  const players = ref([]);
  const currentTactic = ref(null);
  const gameType = ref(7); // Numeric value
  
  return {
    players,
    currentTactic,
    gameType
  };
});
