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

const borderColor = computed(() =>
  props.isRequired ? 'border-blue-600' : 'border-blue-400'
);
</script>

<template>
  <div
    class="position-marker absolute w-16 h-16 rounded-full border-2 border-dashed pointer-events-none transition-all duration-200"
    :class="borderColor"
    :style="{
      left: `${marker.xPercent}%`,
      top: `${marker.yPercent}%`,
      transform: 'translate(-50%, -50%)'
    }"
    :data-x="marker.xPercent"
    :data-y="marker.yPercent"
    :data-role="marker.role"
  />
</template>
