import { ref, computed } from "vue";

export function usePlayer(initial = {}) {
  // Reactive state
  const id = ref(initial.id || `player-${Date.now()}`);
  const number = ref(initial.number || 0);
  const firstName = ref(initial.firstName || "");
  const lastName = ref(initial.lastName || "");
  const location = ref(initial.location || "bench");
  const x = ref(initial.x || 0);
  const y = ref(initial.y || 0);
  const percentX = ref(initial.percentX || 0);
  const percentY = ref(initial.percentY || 0);

  // Computed display name (basic format)
  const displayName = computed(() => {
    return `${number.value}, ${firstName.value.split(" ")[0]}`;
  });

  // Method to update display name format
  function updateDisplayName(options = {}) {
    const firstNamePart = firstName.value.split(" ")[0];
    let lastNamePart = "";

    if (options.showLastName) {
      lastNamePart = ` ${lastName.value}`;
    } else if (options.showInitial) {
      lastNamePart = ` ${lastName.value.charAt(0).toUpperCase()}.`;
    }

    return `${number.value}, ${firstNamePart}${lastNamePart}`;
  }

  return {
    id,
    number,
    firstName,
    lastName,
    location,
    x,
    y,
    percentX,
    percentY,
    displayName,
    updateDisplayName,
  };
}
