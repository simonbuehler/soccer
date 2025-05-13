/**
 * Fußball Aufstellung Tool (Refactored)
 * Verwaltet Spieler in zentralem Pool mit Location-Tracking
 */

const MAX_PLAYERS = 9; // Maximum players allowed on pitch

// DOM-Elementreferenzen
const playerInput = document.getElementById("player-input");
const playerDialog = document.getElementById("player-dialog");

class PlayerPool {
  constructor() {
    this.players = [];
    this.viewManager = new ViewManager(this);
  }

  addPlayer(player) {
    // Check for first name conflicts
    const sameFirstNamePlayers = this.players.filter(
      (p) => p.firstName.split(" ")[0] === player.firstName.split(" ")[0]
    );

    if (sameFirstNamePlayers.length > 0) {
      // Check if last initials are also the same
      const sameInitialPlayers = sameFirstNamePlayers.filter(
        (p) =>
          p.lastName.charAt(0).toUpperCase() ===
          player.lastName.charAt(0).toUpperCase()
      );

      if (sameInitialPlayers.length > 0) {
        // Full last name needed
        sameInitialPlayers.forEach((p) => p.updateDisplayName(true));
        player.updateDisplayName(true);
      } else {
        // Just initial needed
        sameFirstNamePlayers.forEach((p) => p.updateDisplayName(false, true));
        player.updateDisplayName(false, true);
      }
    }

    this.players.push(player);
    this.updateView();
  }

  movePlayer(playerId, newLocation) {
    const player = this.getPlayerById(playerId);
    if (player) {
      player.location = newLocation;
      this.updateView();
    }
  }

  updateView() {
    this.viewManager.clearViews();
    this.viewManager.updatePlaceholder();

    // Rebuild views
    this.players.forEach((player) => {
      if (player.location === "bench") {
        this.viewManager.createBenchPlayer(player);
      } else if (player.location === "pitch") {
        this.viewManager.createPitchPlayer(player);
      }
    });
  }

  getPlayerById(id) {
    return this.players.find((p) => p.id === id);
  }

  getBenchPlayers() {
    return this.players.filter((p) => p.location === "bench");
  }

  getPitchPlayers() {
    return this.players.filter((p) => p.location === "pitch");
  }
}

class Player {
  constructor(number, firstName, lastName = "") {
    this.id = `player-${number}-${firstName}-${lastName}`;
    this.number = number;
    this.firstName = firstName;
    this.lastName = lastName;
    this.location = "bench";
    this.displayName = `${number}, ${firstName.split(" ")[0]}`;
    this.x = 0;
    this.y = 0;
    this.percentX = 0;
    this.percentY = 0;
  }

  updateDisplayName(showLastName = false, showInitial = false) {
    const firstNamePart = this.firstName.split(" ")[0];
    let lastNamePart = "";

    if (showLastName) {
      lastNamePart = ` ${this.lastName}`;
    } else if (showInitial) {
      lastNamePart = ` ${this.lastName.charAt(0).toUpperCase()}.`;
    }

    this.displayName = `${this.number}, ${firstNamePart}${lastNamePart}`;
  }
}

class ViewManager {
  constructor(playerPool) {
    this.playerPool = playerPool;
    this.substitutesList = document.getElementById("substitutes");
    this.pitchContainer = document.getElementById("pitch-container");
    this.playersContainer = document.getElementById("players-container");
    this.placeholder = document.getElementById("substitutes-placeholder");
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
      App.eventHandler.handleDragStart.bind(App.eventHandler)
    );
    playerItem.addEventListener(
      "touchstart",
      App.eventHandler.handleTouchStart.bind(App.eventHandler)
    );
    playerItem.addEventListener(
      "touchend",
      App.eventHandler.handleTouchEnd.bind(App.eventHandler)
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
      App.eventHandler.handleDragStart.bind(App.eventHandler)
    );
    playerDiv.addEventListener(
      "dragend",
      App.eventHandler.handleDragEnd.bind(App.eventHandler)
    );
  }

  updatePlaceholder() {
    const hasPlayers = this.playerPool.players.length > 0;

    // Reset all styles first
    this.placeholder.classList.remove(
      "min-h-20",
      "border-2",
      "border-dashed",
      "border-blue-400",
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
      "border-blue-400",
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
        "border-blue-400",
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
      .querySelectorAll(".player-position")
      .forEach((el) => el.remove());
  }
  // Check if point is within pitch SVG bounds
  isPointInPitch(x, y, pitchRect) {
    // Get SVG dimensions using the helper method
    const { svgWidth, svgHeight, svgX, svgY } = this.getSvgDimensions(pitchRect);

    // Check if we got valid dimensions
    if (svgWidth <= 0 || svgHeight <= 0) {
      console.error('Invalid SVG dimensions');
      return false;
    }

    // Check if point is within the SVG area
    const isInside = x >= svgX && x <= svgX + svgWidth && 
                    y >= svgY && y <= svgY + svgHeight;

    if (!isInside) {
      console.log('Drop rejected: outside SVG bounds');
      return false;
    }

    // Convert to SVG coordinates (relative to SVG top-left)
    const svgRelativeX = x - svgX;
    const svgRelativeY = y - svgY;

    // Additional check: is point within the actual pitch area (excluding border)?
    // The pitch has a 10px border in the SVG (from pitch.svg)
    const isOnPitch = svgRelativeX >= 10 && svgRelativeX <= svgWidth - 10 &&
                      svgRelativeY >= 10 && svgRelativeY <= svgHeight - 10;

    if (!isOnPitch) {
      console.log('Drop rejected: outside pitch area');
      return false;
    }

    return true;
  }
  // Helper method to calculate SVG dimensions
  getSvgDimensions(pitchRect) {
    try {
      // Get the actual SVG dimensions from the object element
      const svgObject = this.pitchContainer.querySelector('object');
      if (!svgObject) {
        console.error('SVG object not found');
        return { svgWidth: 0, svgHeight: 0, svgX: 0, svgY: 0 };
      }

      // Get the SVG document
      const svgDoc = svgObject.contentDocument;
      if (!svgDoc) {
        console.error('SVG document not loaded');
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
      console.error('Error getting SVG dimensions:', error);
      return { svgWidth: 0, svgHeight: 0, svgX: 0, svgY: 0 };
    }
  }
}

class EventHandler {
  constructor(playerPool, viewManager) {
    this.playerPool = playerPool;
    this.viewManager = viewManager;
    this.activeTouchId = null;
  }

  handleDragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.playerId);
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("opacity-50");
  }

  handleDragEnd(e) {
    e.target.classList.remove("opacity-50");
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
        // Move to pitch if space available
        if (
          player.location === "pitch" ||
          this.viewManager.playersContainer.querySelectorAll(".player-position")
            .length < MAX_PLAYERS
        ) {
          player.percentX = (touchX / svgRect.width) * 100;
          player.percentY = (touchY / svgRect.height) * 100;

          this.playerPool.movePlayer(playerId, "pitch");
        }
      }
    } catch (error) {
      console.error("Touch error:", error);
    } finally {
      e.target?.classList?.remove("opacity-50");
      this.activeTouchId = null;
    }
  }
}

class PlayerInputHandler {
  constructor(playerPool, playerInput) {
    this.playerPool = playerPool;
    this.playerInput = playerInput;
  }

  addPlayers() {
    const input = this.playerInput.value.trim();
    if (!input) return;

    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    lines.forEach((line) => {
      const [numberPart, firstName] = line.split(", ");
      const [number, ...lastNameParts] = numberPart.split(" ");
      const lastName = lastNameParts.join(" ");

      const player = new Player(number, firstName, lastName);

      // Duplikatprüfung
      const isDuplicate = this.playerPool.players.some(
        (p) =>
          p.number === player.number ||
          (p.firstName === player.firstName && p.lastName === player.lastName)
      );

      if (!isDuplicate) {
        this.playerPool.addPlayer(player);
      }
    });

    this.playerInput.value = "";
  }
}

// Main application instance
const App = {
  playerPool: null,
  viewManager: null,
  uiManager: null,
  eventHandler: null,
  playerInputHandler: null,

  init() {
    this.playerPool = new PlayerPool();
    this.viewManager = new ViewManager(this.playerPool);
    this.eventHandler = new EventHandler(this.playerPool, this.viewManager);
    this.playerInputHandler = new PlayerInputHandler(
      this.playerPool,
      playerInput
    );
    this.uiManager = new UIManager(
      playerDialog,
      playerInput,
      this.playerInputHandler
    );

    this.setupEventListeners();
    this.viewManager.updatePlaceholder();
    handleResize();
  },

  setupEventListeners() {
    // Bench drop event only (without highlighting)
    this.viewManager.substitutesList.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    this.viewManager.substitutesList.addEventListener("drop", (e) => {
      e.preventDefault();
      const playerId = e.dataTransfer.getData("text/plain");
      this.playerPool.movePlayer(playerId, "bench");
      this.viewManager.substitutesList.classList.remove("bg-gray-100");
    });

    // Pitch drag events
    this.viewManager.pitchContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    this.viewManager.pitchContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      const playerId = e.dataTransfer.getData("text/plain");
      const player = this.playerPool.getPlayerById(playerId);

      if (!player) return;

      // Get SVG dimensions (600x900 viewBox)
      const svgRect = this.viewManager.pitchContainer
        .querySelector("object")
        .getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;

      console.log("Testing drop at:", { mouseX, mouseY });

      // Check if drop is within SVG bounds
      if (
        mouseX < 0 ||
        mouseX > svgRect.width ||
        mouseY < 0 ||
        mouseY > svgRect.height
      ) {
        document
          .querySelector(`[data-player-id="${playerId}"]`)
          .classList.remove("opacity-50");
        console.log("Drop rejected: outside SVG bounds");
        return;
      }

      // Calculate percentages relative to SVG dimensions
      const percentX = (mouseX / svgRect.width) * 100;
      const percentY = (mouseY / svgRect.height) * 100;

      player.percentX = percentX;
      player.percentY = percentY;

      const playerEl = document.querySelector(`[data-player-id="${playerId}"]`);
      if (playerEl) {
        console.log("Setting position:", { percentX, percentY });
        playerEl.style.setProperty("--player-x", percentX + "%");
        playerEl.style.setProperty("--player-y", percentY + "%");
        playerEl.style.left = "var(--player-x)";
        playerEl.style.top = "var(--player-y)";
        playerEl.style.transform = "translate(-50%, -50%)";
      }

      if (
        player.location === "pitch" ||
        this.viewManager.playersContainer.querySelectorAll(".player-position")
          .length < MAX_PLAYERS
      ) {
        this.playerPool.movePlayer(playerId, "pitch");
      }

      document
        .querySelector(`[data-player-id="${playerId}"]`)
        .classList.remove("opacity-50");
    });
  },
};

class UIManager {
  constructor(playerDialog, playerInput, playerInputHandler) {
    this.playerDialog = playerDialog;
    this.playerInput = playerInput;
    this.playerInputHandler = playerInputHandler;
  }

  openPlayerDialog() {
    this.playerDialog.classList.remove("hidden");
    this.playerInput.focus();
  }

  closePlayerDialog() {
    this.playerDialog.classList.add("hidden");
    this.playerInput.value = "";
  }

  addPlayersAndClose() {
    this.playerInputHandler.addPlayers();
    this.closePlayerDialog();
  }

  printPitch() {
    window.print();

  }
}

function handleResize() {
  if (!App.playerPool || window.matchMedia("print").matches) return;

  const svgRect = App.viewManager.pitchContainer
    .querySelector("object")
    .getBoundingClientRect();

  App.playerPool.players.forEach((player) => {
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
  App.playerPool.updateView();
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

window.addEventListener("resize", handleResize);

// Globale Funktionen
window.addPlayers = () => App.uiManager.playerInputHandler.addPlayers();
window.printPitch = () => App.uiManager.printPitch();
window.openPlayerDialog = () => App.uiManager.openPlayerDialog();
window.closePlayerDialog = () => App.uiManager.closePlayerDialog();
window.addPlayersAndClose = () => App.uiManager.addPlayersAndClose();
