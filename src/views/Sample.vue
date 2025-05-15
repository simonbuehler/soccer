<script setup>
import BankFormKit from '@/components/BankFormKit.vue'
import PitchFormKit from '@/components/PitchFormKit.vue'
</script>

<template> <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Sample Seite</h1>
    <p>Dies ist eine Beispielseite für die Navigation.</p>
    <router-link to="/" class="text-blue-500 hover:underline mt-4 inline-block">
      Zurück zur Startseite
    </router-link>
  </div>
  <div class="h-screen grid grid-cols-2 gap-4 p-4">
    <BankFormKit />
    <PitchFormKit />
  </div>
</template>

