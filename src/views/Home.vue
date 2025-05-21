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
  <!-- Container für die gesamte Seite - responsive Layout für alle Breakpoints -->
  <div class="flex flex-col lg:flex-row gap-8 p-4">
    
    <!-- Linke Spalte: Actions und Bench bei lg+ Layout -->
    <div class="w-full lg:w-1/3  lg:max-w-md flex flex-col md:flex-row lg:flex-col gap-4 print:order-2">
      <!-- Actions Panel - bei md nebeneinander, sonst übereinander -->
      <div class="w-full md:w-1/2 lg:w-full ">
        <ActionsPanel
          @open-player-dialog="showPlayerDialog = true"
          @print="handlePrint"
        />
      </div>

      <!-- Bench Container - bei md nebeneinander, sonst übereinander -->
      <div class="w-full md:w-1/2 lg:w-full ">
        <BenchContainer />
      </div>
    </div>

    <!-- Rechte Spalte: Spielfeld bei lg+ Layout -->
    <div class="flex-1 flex mb-4 lg:mb-0 print:order-1 print:justify-center">
      <PitchContainer />
    </div>

    <!-- Modals mit v-model -->
    <PlayerDialog
      v-model="showPlayerDialog"
      @added="(count) => console.log(`${count} Spieler hinzugefügt`)"
    />
    <TacticInfoModal v-if="showTacticInfo" @close="showTacticInfo = false" />
  </div>
</template>
