<script setup>
  const props = defineProps({
    marker: {
      type: Object,
      required: true,
    },
  });

  const positionStyle = {
    left: `${props.marker.xPercent}%`,
    top: `${props.marker.yPercent}%`,
    transform: "translate(-50%, -50%)",
  };
</script>

<template>
  <div
    class="position-marker absolute w-16 h-16 rounded-full border-2 border-dashed border-blue-600 pointer-events-none transition-all duration-200"
    :style="positionStyle"
    :data-x="marker.xPercent"
    :data-y="marker.yPercent"
  />
</template>
