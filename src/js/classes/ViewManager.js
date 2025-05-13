/**
 * ViewManager-Klasse handhabt die Darstellung der Spieler auf der UI
 */

export class ViewManager {
  constructor(playerPool) {
    this.playerPool = playerPool;
    this.substitutesList = document.getElementById("substitutes");
    this.pitchContainer = document.getElementById("pitch-container");
    this.playersContainer = document.getElementById("players-container");
    this.placeholder = document.getElementById("substitutes-placeholder");

    // AppRef für Ereignisbehandlung verwenden, statt direkt auf App zuzugreifen
    this.appRef = null;
  }

  init(appRef) {
    this.appRef = appRef;
  }

  createBenchPlayer(player) {
    const playerItem = document.createElement("li");
    playerItem.textContent = player.displayName;
    playerItem.draggable = true;
    playerItem.classList.add(
      "player",
      "bg-blue-600",
      "text-white",
      "mb-2",
      "px-3",
      "py-2",
      "rounded-lg",
      "cursor-move"
    );
    playerItem.dataset.playerId = player.id;

    playerItem.addEventListener(
      "dragstart",
      this.appRef
        ? this.appRef.eventHandler.handleDragStart.bind(
            this.appRef.eventHandler
          )
        : () => console.warn("EventHandler not initialized")
    );

    // Wichtig: Auch für Bank-Spieler den dragend-Event-Handler hinzufügen
    playerItem.addEventListener(
      "dragend",
      this.appRef
        ? this.appRef.eventHandler.handleDragEnd.bind(this.appRef.eventHandler)
        : () => console.warn("EventHandler not initialized")
    );

    playerItem.addEventListener(
      "touchstart",
      this.appRef
        ? this.appRef.eventHandler.handleTouchStart.bind(
            this.appRef.eventHandler
          )
        : () => console.warn("EventHandler not initialized")
    );
    playerItem.addEventListener(
      "touchend",
      this.appRef
        ? this.appRef.eventHandler.handleTouchEnd.bind(this.appRef.eventHandler)
        : () => console.warn("EventHandler not initialized")
    );
    this.substitutesList.appendChild(playerItem);
  }

  createPitchPlayer(player) {
    const playerDiv = document.createElement("div");
    playerDiv.classList.add(
      "player-position",
      "absolute",
      "w-14",
      "h-14",
      "bg-white/90",
      "rounded-full",
      "font-bold",
      "text-lg",
      "shadow-lg",
      "cursor-move",
      "border-2",
      "border-grey-600",
      "backdrop-blur-sm",
      "overflow-hidden"
    );
    this.playersContainer.appendChild(playerDiv);

    // Number backdrop
    const numberBackdrop = document.createElement("div");
    numberBackdrop.classList.add(
      "absolute",
      "inset-0",
      "flex",
      "items-center",
      "justify-center",
      "text-4xl",
      "font-bold",
      "text-green-600/50"
    );
    numberBackdrop.textContent = player.number;
    playerDiv.appendChild(numberBackdrop);

    // Name text
    const nameText = document.createElement("div");
    nameText.classList.add(
      "absolute",
      "top-1/2",
      "left-1/2",
      "transform",
      "-translate-x-1/2",
      "-translate-y-1/2",
      "z-10",
      "text-xs",
      "font-bold",
      "text-center",
      "text-grey-800"
    );
    nameText.textContent = player.displayName.split(",")[1].trim();
    playerDiv.appendChild(nameText);

    playerDiv.dataset.playerId = player.id;
    playerDiv.draggable = true;
    playerDiv.style.setProperty("--player-x", player.percentX + "%");
    playerDiv.style.setProperty("--player-y", player.percentY + "%");
    playerDiv.style.left = "var(--player-x)";
    playerDiv.style.top = "var(--player-y)";
    playerDiv.addEventListener(
      "dragstart",
      this.appRef
        ? this.appRef.eventHandler.handleDragStart.bind(
            this.appRef.eventHandler
          )
        : () => console.warn("EventHandler not initialized")
    );
    playerDiv.addEventListener(
      "dragend",
      this.appRef
        ? this.appRef.eventHandler.handleDragEnd.bind(this.appRef.eventHandler)
        : () => console.warn("EventHandler not initialized")
    );
  }

  updatePlaceholder() {
    const hasPlayers = this.playerPool.players.length > 0;

    // Reset all styles first
    this.placeholder.classList.remove(
      "min-h-20",
      "border-2",
      "border-dashed",
      "border-blue-600",
      "rounded-lg",
      "bg-blue-50",
      "flex",
      "items-center",
      "justify-center",
      "text-blue-600"
    );
    this.substitutesList.classList.remove(
      "border-2",
      "border-dashed",
      "border-blue-600",
      "rounded-lg",
      "p-2",
      "bg-blue-50",
      "min-h-20"
    );

    if (hasPlayers) {
      // Players exist on bench
      this.placeholder.classList.add("hidden");
      this.substitutesList.classList.add(
        "border-2",
        "border-dashed",
        "print:border-0",
        "border-blue-600",
        "rounded-lg",
        "p-2",
        "bg-blue-50",
        "min-h-20"
      );
    }
  }

  clearViews() {
    this.substitutesList.innerHTML = "";
    this.playersContainer
      .querySelectorAll(".player-position, .position-marker")
      .forEach((el) => el.remove());
  }

  createPositionMarker(marker) {
    const markerDiv = document.createElement("div");
    markerDiv.classList.add(
      "position-marker",
      "absolute",
      "w-16",
      "h-16",
      "rounded-full",
      "border-2",
      "border-dashed",
      "border-blue-600",
      "pointer-events-none",
      "transition-all",
      "duration-200"
    );
    markerDiv.style.left = `${marker.xPercent}%`;
    markerDiv.style.top = `${marker.yPercent}%`;
    markerDiv.style.transform = "translate(-50%, -50%)";
    markerDiv.dataset.x = marker.xPercent;
    markerDiv.dataset.y = marker.yPercent;
    this.playersContainer.appendChild(markerDiv);
    return markerDiv;
  }

  // Eine konsolidierte Version der highlightClosestMarker Methode
  highlightClosestMarker(x, y) {
    const markers = Array.from(
      this.playersContainer.querySelectorAll(".position-marker")
    );
    let closestMarker = null;
    let minDistance = Infinity;
    const HIGHLIGHT_THRESHOLD = 15; // Schwellenwert für Highlight und Snap

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

    // Reset all markers - verwende mehr Tailwind-Klassen und unsere benutzerdefinierte Animation
    markers.forEach((marker) => {
      marker.classList.remove(
        "border-4",
        "bg-blue-100/30",
        "animate-pulse-scale"
      );
      marker.classList.add("border-2");
    });

    // Highlight closest if within threshold - verwende unsere benutzerdefinierte Wellenanimation
    if (closestMarker && minDistance < HIGHLIGHT_THRESHOLD) {
      closestMarker.classList.remove("border-2");
      closestMarker.classList.add(
        "border-blue-600",
        "border-4",
        "bg-blue-100/30",
        "animate-pulse-scale" // Neue Wellenanimation statt animate-pulse
      );
      return {
        x: parseFloat(closestMarker.dataset.x),
        y: parseFloat(closestMarker.dataset.y),
        shouldSnap: true,
      };
    }
    return null;
  }

  // Check if point is within pitch SVG bounds
  isPointInPitch(x, y, pitchRect) {
    // Get SVG dimensions using the helper method
    const { svgWidth, svgHeight, svgX, svgY } =
      this.getSvgDimensions(pitchRect);

    // Check if we got valid dimensions
    if (svgWidth <= 0 || svgHeight <= 0) {
      console.error("Invalid SVG dimensions");
      return false;
    }

    // Check if point is within the SVG area
    const isInside =
      x >= svgX && x <= svgX + svgWidth && y >= svgY && y <= svgY + svgHeight;

    if (!isInside) {
      // Drop outside SVG bounds
      return false;
    }

    // Convert to SVG coordinates (relative to SVG top-left)
    const svgRelativeX = x - svgX;
    const svgRelativeY = y - svgY;

    // Additional check: is point within the actual pitch area (excluding border)?
    // The pitch has a 10px border in the SVG (from pitch.svg)
    const isOnPitch =
      svgRelativeX >= 10 &&
      svgRelativeX <= svgWidth - 10 &&
      svgRelativeY >= 10 &&
      svgRelativeY <= svgHeight - 10;

    if (!isOnPitch) {
      console.log("Drop rejected: outside pitch area");
      return false;
    }

    return true;
  }

  // Helper method to calculate SVG dimensions
  getSvgDimensions(pitchRect) {
    try {
      // Get the actual SVG dimensions from the object element
      const svgObject = this.pitchContainer.querySelector("object");
      if (!svgObject) {
        console.error("SVG object not found");
        return { svgWidth: 0, svgHeight: 0, svgX: 0, svgY: 0 };
      }

      // Get the SVG document
      const svgDoc = svgObject.contentDocument;
      if (!svgDoc) {
        console.error("SVG document not loaded");
        return { svgWidth: 0, svgHeight: 0, svgX: 0, svgY: 0 };
      }

      // Get the root SVG element
      const svgElement = svgDoc.documentElement;
      const svgWidth = svgElement.width.baseVal.value;
      const svgHeight = svgElement.height.baseVal.value;

      // Calculate position relative to container
      const svgX = (pitchRect.width - svgWidth) / 2;
      const svgY = (pitchRect.height - svgHeight) / 2;

      return { svgWidth, svgHeight, svgX, svgY };
    } catch (error) {
      console.error("Error getting SVG dimensions:", error);
      return { svgWidth: 0, svgHeight: 0, svgX: 0, svgY: 0 };
    }
  }

  handleResize() {
    if (!this.playerPool || window.matchMedia("print").matches) return;

    const svgRect = this.pitchContainer
      .querySelector("object")
      .getBoundingClientRect();

    this.playerPool.players.forEach((player) => {
      if (player.location === "pitch") {
        const playerEl = document.querySelector(
          `[data-player-id="${player.id}"]`
        );
        if (playerEl) {
          playerEl.style.setProperty("--player-x", player.percentX + "%");
          playerEl.style.setProperty("--player-y", player.percentY + "%");
        }
      }
    });
    this.playerPool.updateView();
  }
}
