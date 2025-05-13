<script setup>
  import { ref, onMounted } from "vue";
  import { useAppStore } from "@/stores/appStore";
  import PitchContainer from "@/components/PitchContainer.vue";
  import BenchContainer from "@/components/BenchContainer.vue";
  import ActionsPanel from "@/components/ActionsPanel.vue";
  import PlayerDialog from "@/components/PlayerDialog.vue";
  import TacticInfoModal from "@/components/TacticInfoModal.vue";

  const appStore = useAppStore();
  const showPlayerDialog = ref(false);
  const showTacticInfo = ref(false);

  onMounted(() => {
    appStore.init();
    appStore.setGameType(7); // Initialize with default game type
  });

  function handlePrint() {
    window.print();
  }
</script>

<template>
  <div class="app-container flex flex-col lg:flex-row gap-8 p-4">
    <!-- Left column with actions and substitutes -->
    <div class="w-full lg:w-72 flex flex-col gap-4 print-order-2">
      <ActionsPanel
        @openPlayerDialog="showPlayerDialog = true"
        @print="handlePrint"
      />
      <BenchContainer />
    </div>

    <!-- Football pitch -->
    <div
      class="flex-1 flex lg:order-none mb-4 lg:mb-0 print-order-1 print:justify-center"
    >
      <PitchContainer />
    </div>

    <!-- Modals -->
    <PlayerDialog v-if="showPlayerDialog" @close="showPlayerDialog = false" />
    <TacticInfoModal v-if="showTacticInfo" @close="showTacticInfo = false" />
  </div>
</template>

<style>
  .app-container {
    min-height: 100vh;
  }
</style>
