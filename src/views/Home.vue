<script setup>
import { ref } from "vue";
import PitchContainer from "@/components/PitchContainer.vue";
import BenchContainer from "@/components/BenchContainer.vue";
import ActionsPanel from "@/components/ActionsPanel.vue";
import PlayerDialog from "@/components/PlayerDialog.vue";

const showPlayerDialog = ref(false);
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-8 p-4">
    <div class="w-full lg:w-1/3 lg:max-w-md flex flex-col md:flex-row lg:flex-col gap-4 print:order-2">
      <div class="w-full md:w-1/2 lg:w-full">
        <ActionsPanel
          @open-player-dialog="showPlayerDialog = true"
        />
      </div>

      <div class="w-full md:w-1/2 lg:w-full">
        <BenchContainer />
      </div>
    </div>

    <div class="flex-1 flex mb-4 lg:mb-0 print:order-1 print:justify-center">
      <PitchContainer />
    </div>

    <PlayerDialog
      v-model="showPlayerDialog"
      @added="(count) => console.log(`Added ${count} players`)"
    />
  </div>
</template>
