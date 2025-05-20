<script setup>
  import { ref, onMounted } from "vue";
  import { useTacticManager } from "@/composables/useTacticManager";
  import PitchContainer from "@/components/PitchContainer.vue";
  import BenchContainer from "@/components/BenchContainer.vue";
  import ActionsPanel from "@/components/ActionsPanel.vue";
  import PlayerDialog from "@/components/PlayerDialog.vue";
  import TacticInfoModal from "@/components/TacticInfoModal.vue";
  const tacticManager = useTacticManager();
  const showPlayerDialog = ref(false);
  const showTacticInfo = ref(false);

  onMounted(() => {
    tacticManager.initializeGame();
  });

  function handlePrint() {
    window.print();
  }
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-8 p-4">
    <!-- Left column with actions and substitutes -->
    <div class="w-full lg:max-w-96 flex flex-col gap-4 order-1 print-order-2">
      <ActionsPanel
        @open-player-dialog="showPlayerDialog = true"
        @print="handlePrint"
      />
    </div>

    <!-- Football pitch -->
    <div
      class="flex-1 flex order-3 mb-4 lg:mb-0 print-order-1 print:justify-center"
    >
      <PitchContainer />
    </div>
    <BenchContainer class="order-2 lg:order-3" />

    <!-- Modals mit v-model -->
    <PlayerDialog
      v-model="showPlayerDialog"
      @added="(count) => console.log(`${count} Spieler hinzugefügt`)"
    />
    <TacticInfoModal v-if="showTacticInfo" @close="showTacticInfo = false" />
  </div>
</template>
