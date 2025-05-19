<script setup>
import { computed } from 'vue';

const props = defineProps({
  marker: {
    type: Object,
    required: true,
    validator: (value) => {
      return value &&
        typeof value.xPercent === 'number' &&
        typeof value.yPercent === 'number' &&
        typeof value.role === 'string';
    }
  },
  isRequired: {
    type: Boolean,
    default: false
  }
});

// Vollständige Tailwind-Klassen basierend auf isRequired
const markerClasses = computed(() => {
  const baseClasses = "position-marker absolute w-16 h-16 rounded-full border-2 border-dashed pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-in-out";
  const colorClass = props.isRequired ? "border-blue-600" : "border-blue-400";
  return `${baseClasses} ${colorClass}`;
});
</script>

<template>
  <div
    :class="markerClasses"
    :style="{
      left: `${marker.xPercent}%`,
      top: `${marker.yPercent}%`,
    }"
    :data-x="marker.xPercent"
    :data-y="marker.yPercent"
    :data-role="marker.role"
  />
</template>
