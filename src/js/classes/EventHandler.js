/**
 * EventHandler-Klasse behandelt Interaktionsevents wie Drag&Drop
 */

import { App } from "../script.js";

export class EventHandler {
  constructor(playerPool, viewManager) {
    this.playerPool = playerPool;
    this.viewManager = viewManager;
    this.activeTouchId = null;
  }

  handleDragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.playerId);
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("opacity-50", "dragging");
  }

  handleDragEnd(e) {
    const playerId = e.target.dataset.playerId;

    // Wichtig: Alle Elemente mit der Klasse "opacity-50" zurücksetzen
    // Dies stellt sicher, dass kein Spieler halbtransparent bleibt
    document.querySelectorAll(`.opacity-50`).forEach((el) => {
      el.classList.remove("opacity-50", "dragging");
    });

    // Zusätzlich: Auch gezielt alle Elemente des gezogenen Spielers zurücksetzen
    if (playerId) {
      document
        .querySelectorAll(`[data-player-id="${playerId}"]`)
        .forEach((el) => {
          el.classList.remove("opacity-50", "dragging");
        });
    }

    // Reset all marker highlights
    this.viewManager.playersContainer
      .querySelectorAll(".position-marker")
      .forEach((marker) => {
        marker.classList.remove(
          "border-4",
          "bg-blue-100/30",
          "animate-pulse-scale",
          "shadow-lg"
        );
        marker.classList.add("border-2");
      });
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    this.activeTouchId = touch.identifier;
    const playerId = e.target.dataset.playerId;

    // Create a fake drag event for touch
    const event = new Event("dragstart");
    event.dataTransfer = {
      setData: (type, data) => {
        this.touchData = data;
      },
      getData: () => this.touchData,
      effectAllowed: "move",
    };
    event.dataTransfer.setData("text/plain", playerId);
    e.target.dispatchEvent(event);

    e.target.classList.add("opacity-50");
  }

  handleTouchEnd(e) {
    try {
      e.preventDefault();
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === this.activeTouchId
      );
      if (!touch) return;

      const playerId = e.target?.dataset?.playerId;
      if (!playerId) return;

      const player = this.playerPool.getPlayerById(playerId);
      if (!player) return;

      // Get touch position relative to SVG
      const svgRect = this.viewManager.pitchContainer
        .querySelector("object")
        .getBoundingClientRect();
      const touchX = touch.clientX - svgRect.left;
      const touchY = touch.clientY - svgRect.top;

      // Check if touch ended within SVG bounds
      if (
        touchX >= 0 &&
        touchX <= svgRect.width &&
        touchY >= 0 &&
        touchY <= svgRect.height
      ) {
        // Check if position is allowed based on current tactic
        const positionMarkers = App.tacticManager.getPositionMarkers();
        const isFreePlacement = positionMarkers.length === 0;

        // Calculate percentages relative to SVG dimensions
        const percentX = (touchX / svgRect.width) * 100;
        const percentY = (touchY / svgRect.height) * 100;

        // Get max player count
        const gameType = App.tacticManager.getCurrentGameType();
        const maxPlayers = gameType || 11; // Default to 11 if gameType is not set

        // Check if adding a new player would exceed the limit
        if (
          isFreePlacement &&
          player.location !== "pitch" &&
          this.playerPool.getPitchPlayers().length >= maxPlayers
        ) {
          // Player limit reached
          return;
        }

        // Find closest marker if tactic is active
        let targetX, targetY;
        let canPlace = isFreePlacement;

        if (!isFreePlacement) {
          const highlightResult = this.viewManager.highlightClosestMarker(
            percentX,
            percentY
          );
          if (highlightResult && highlightResult.shouldSnap) {
            targetX = highlightResult.x;
            targetY = highlightResult.y;
            canPlace = true;
          }
        } else {
          // Freie Platzierung
          targetX = percentX;
          targetY = percentY;
        }

        if (canPlace) {
          // Check for existing player at target position
          const existingPlayer = this.playerPool.getPitchPlayers().find(
            (p) =>
              Math.abs(p.percentX - targetX) < 0.1 &&
              Math.abs(p.percentY - targetY) < 0.1 &&
              p.id !== playerId // Nicht sich selbst finden
          );

          if (existingPlayer) {
            // Position swap: Spieler tauschen Plätze
            const oldX = player.percentX;
            const oldY = player.percentY;
            const wasOnPitch = player.location === "pitch";

            // Verschiebe aktuellen Spieler zur neuen Position
            player.percentX = targetX;
            player.percentY = targetY;
            player.location = "pitch";

            // Verschiebe existierenden Spieler zur alten Position oder auf die Bank
            if (wasOnPitch) {
              // Existierender Spieler übernimmt Position des gezogenen Spielers
              existingPlayer.percentX = oldX;
              existingPlayer.percentY = oldY;
              // Bleibt auf dem Feld
            } else {
              // Gezogener Spieler kommt von Bank, existierender geht auf Bank
              existingPlayer.location = "bench";
            }

            this.playerPool.updateView();
          } else if (
            player.location === "pitch" ||
            this.viewManager.playersContainer.querySelectorAll(
              ".player-position"
            ).length < App.tacticManager.getCurrentGameType() // Hier getCurrentGameType() statt getPlayerCount()
          ) {
            // Keine Konflikt - Bewege Spieler zur Zielposition
            player.percentX = targetX;
            player.percentY = targetY;
            this.playerPool.movePlayer(playerId, "pitch");
          }
        }
      }
    } catch (error) {
      console.error("Touch error:", error);
    } finally {
      e.target?.classList?.remove("opacity-50");
      this.activeTouchId = null;

      // Reset marker highlights
      App.viewManager.playersContainer
        .querySelectorAll(".position-marker")
        .forEach((marker) => {
          marker.classList.remove(
            "border-blue-600",
            "border-4",
            "bg-blue-100/30",
            "animate-pulse-scale", // Neue Klasse statt animate-pulse
            "shadow-lg"
          );
          marker.classList.add("border-blue-400", "border-2");
        });
    }
  }
}
