<script setup>
import { providePlayerService } from './composables/usePlayerService';

// Provide player service (return value not needed)
providePlayerService();
</script>

<template>
  <div class="app-container">
    <header class="bg-blue-900 text-white p-4 print:hidden">
      <nav class="container mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold">Fußball App</h1>
        <div class="space-x-4">
          <router-link to="/" class="hover:text-gray-300">Home</router-link>
         </div>
      </nav>
    </header>
    
    <main>
      <router-view />
    </main>
    
    <footer class="bg-blue-900 text-white p-4 mt-8 print:hidden">
      <div class="container mx-auto text-center">
        <p>&copy; 2023 Fußball Aufstellung App</p>
      </div>
    </footer>
  </div>
</template>

<style>
</style>
