import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAppStore = defineStore("app", () => {
  const playerPool = ref(null);
  const tacticManager = ref(null);
  const viewManager = ref(null);
  const eventHandler = ref(null);
  const currentTactic = ref(null);
  const gameType = ref("7er");

  const positionMarkers = computed(() => {
    return tacticManager.value?.getPositionMarkers() || [];
  });

  function init() {
    // Initialize as singletons with dependency injection
    playerPool.value = usePlayerPool({ appStore: this });
    tacticManager.value = useTacticManager({ appStore: this });
    viewManager.value = useViewManager();
    eventHandler.value = useEventHandler({
      playerPool: playerPool.value,
      viewManager: viewManager.value,
    });
  }

  function setTactic(tactic) {
    currentTactic.value = tactic;
  }

  function setGameType(type) {
    gameType.value = type;
    tacticManager.value?.setGameType(type);
  }

  return {
    playerPool,
    tacticManager,
    viewManager,
    eventHandler,
    currentTactic,
    gameType,
    positionMarkers,
    init,
    setTactic,
    setGameType,
  };
});
