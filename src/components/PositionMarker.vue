<script setup>
  import { computed } from "vue";

  const props = defineProps({
    marker: {
      type: Object,
      validator: (value) => {
        return (
          value &&
          typeof value.xPercent === "number" &&
          typeof value.yPercent === "number" &&
          typeof value.role === "string"
        );
      },
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
  });

  // Vollständige Tailwind-Klassen basierend auf isRequired und isHighlighted
  const markerClasses = computed(() => {
    const highlightClasses = props.isHighlighted
      ? "animate-pulse-fast border-4 scale-[120%] z-10"
      : "";

    return `${highlightClasses}`;
  });
</script>

<template>
  <div
    class="position-marker absolute w-[4.5rem] h-[4.5rem] rounded-full border-2 border-blue-600 border-dashed pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-in-out"
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
