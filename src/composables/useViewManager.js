import { ref } from "vue";
import { useAppStore } from "@/stores/appStore";

export function useViewManager() {
  const appStore = useAppStore();
  const substitutesList = ref(null);
  const pitchContainer = ref(null);
  const playersContainer = ref(null);
  const placeholder = ref(null);

  function init(containerRefs) {
    substitutesList.value = containerRefs.substitutes;
    pitchContainer.value = containerRefs.pitch;
    playersContainer.value = containerRefs.players;
    placeholder.value = containerRefs.placeholder;
  }

  function clearViews() {
    if (playersContainer.value) {
      playersContainer.value.innerHTML = "";
    }
  }

  function updatePlaceholder(hasPlayers) {
    if (!placeholder.value || !substitutesList.value) return;

    placeholder.value.classList.toggle("hidden", hasPlayers);
    substitutesList.value.classList.toggle(
      "border-2 border-dashed border-blue-600 rounded-lg p-2 bg-blue-50 min-h-20",
      hasPlayers
    );
  }

  function highlightClosestMarker(x, y) {
    const markers = Array.from(
      playersContainer.value.querySelectorAll(".position-marker")
    );
    let closestMarker = null;
    let minDistance = Infinity;
    const HIGHLIGHT_THRESHOLD = 15;

    markers.forEach((marker) => {
      const markerX = parseFloat(marker.dataset.x);
      const markerY = parseFloat(marker.dataset.y);
      const distance = Math.sqrt(
        Math.pow(x - markerX, 2) + Math.pow(y - markerY, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestMarker = marker;
      }
    });

    markers.forEach((marker) => {
      marker.classList.remove(
        "border-4",
        "bg-blue-100/30",
        "animate-pulse-scale"
      );
    });

    if (closestMarker && minDistance < HIGHLIGHT_THRESHOLD) {
      closestMarker.classList.add(
        "border-4",
        "bg-blue-100/30",
        "animate-pulse-scale"
      );
      return {
        x: parseFloat(closestMarker.dataset.x),
        y: parseFloat(closestMarker.dataset.y),
        shouldSnap: true,
      };
    }
    return null;
  }

  function isPointInPitch(x, y, pitchRect) {
    const svgObject = pitchContainer.value?.querySelector("object");
    if (!svgObject) return false;

    const svgDoc = svgObject.contentDocument;
    if (!svgDoc) return false;

    const svgElement = svgDoc.documentElement;
    const svgWidth = svgElement.width.baseVal.value;
    const svgHeight = svgElement.height.baseVal.value;

    const svgX = (pitchRect.width - svgWidth) / 2;
    const svgY = (pitchRect.height - svgHeight) / 2;

    const svgRelativeX = x - svgX;
    const svgRelativeY = y - svgY;

    return (
      svgRelativeX >= 10 &&
      svgRelativeX <= svgWidth - 10 &&
      svgRelativeY >= 10 &&
      svgRelativeY <= svgHeight - 10
    );
  }

  return {
    init,
    clearViews,
    updatePlaceholder,
    highlightClosestMarker,
    isPointInPitch,
  };
}
