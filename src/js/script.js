/**
 * Soccer Lineup Tool (Refactored)
 * Manages players in a central pool with location tracking.
 */

// First load core classes that don't have dependencies
import { Player } from './classes/Player.js';
import { PlayerPool } from './classes/PlayerPool.js';
import { ViewManager } from './classes/ViewManager.js';

// Then load classes that depend on the core classes
import { UIManager } from './classes/UIManager.js';
import { PlayerInputHandler } from './classes/PlayerInputHandler.js';
import { EventHandler } from './classes/EventHandler.js';
import { TacticManager } from './tactics/TacticManager.js';

// DOM element references
const playerInput = document.getElementById("player-input");
const playerDialog = document.getElementById("player-dialog");
// DOM references for tactic info display - assuming these IDs exist in your HTML
const tacticInfoCompact = document.getElementById('tactic-info-compact');
const tacticInfoDescription = document.getElementById('tactic-info-description');
const tacticInfoBulletpoints = document.getElementById('tactic-info-bulletpoints');
const tacticInfoIcon = document.getElementById('tactic-info-icon');
const tacticInfoModal = document.getElementById('tactic-info-modal');
const tacticModalTitle = document.getElementById('tactic-modal-title');
const tacticModalExtendedDescription = document.getElementById('tactic-modal-extended-description');
const tacticModalCloseBtn = document.getElementById('tactic-modal-close-btn');


// Main application instance
export const App = {
  // UI Action Handlers
  actions: {
    addPlayers: () => {
      try {
        App.components.uiManager.playerInputHandler.addPlayers();
      } catch (error) {
        console.error('Error adding players:', error);
      }
    },
    
    printPitch: () => {
      try {
        App.components.uiManager?.printPitch();
      } catch (error) {
        console.error('Error printing pitch:', error);
      }
    },
    
    openPlayerDialog: () => {
      try {
        App.components.uiManager?.openPlayerDialog();
      } catch (error) {
        console.error('Error opening dialog:', error);
      }
    },
    
    closePlayerDialog: () => {
      try {
        App.components.uiManager?.closePlayerDialog();
      } catch (error) {
        console.error('Error closing dialog:', error);
      }
    },
    
    addPlayersAndClose: () => {
      try {
        App.components.uiManager?.addPlayersAndClose();
        // After adding players, also update tactic info if a tactic is selected
        const currentTactic = App.components.tacticManager?.getCurrentTactic();
        if (currentTactic) {
            App.displayTacticInformation(currentTactic);
        }
      } catch (error) {
        console.error('Error adding players:', error);
      }
    },
    showExtendedTacticInfo: () => {
      const currentTactic = App.components.tacticManager?.getCurrentTactic();
      // Nur Modal anzeigen, wenn eine erweiterte Beschreibung vorhanden ist
      if (currentTactic && currentTactic.extendedDescription && tacticInfoModal && tacticModalTitle && tacticModalExtendedDescription) {
        tacticModalTitle.textContent = currentTactic.name;
        tacticModalExtendedDescription.innerHTML = currentTactic.extendedDescription.replace(/\n/g, '<br>'); // Preserve line breaks
        tacticInfoModal.classList.remove('hidden');
      }
    },
    closeExtendedTacticInfoModal: () => {
      if (tacticInfoModal) {
        tacticInfoModal.classList.add('hidden');
      }
    }
  },

  // Component references
  components: {
    playerPool: null,
    viewManager: null, 
    uiManager: null,
    eventHandler: null,
    playerInputHandler: null,
    tacticManager: null
  },

  // State
  state: {
    initialized: false,
    currentGameType: 7, // Default game type
    currentSelectedTactic: null // To store the currently selected tactic object
  },
  
  // Initialize the application
  init() {
    // Set up global reference to avoid circular imports
    window.AppRef = this;

    // Step 1: Create core components
    this.components.playerPool = new PlayerPool();
    this.components.viewManager = new ViewManager(this.components.playerPool);
    
    // Connect components
    this.components.playerPool.init(this.components.viewManager);
    this.components.viewManager.init(this);
    
    // Step 2: Create dependent components
    this.components.tacticManager = new TacticManager();
    this.components.playerInputHandler = new PlayerInputHandler(this.components.playerPool, playerInput);
    this.components.uiManager = new UIManager(playerDialog, playerInput, this.components.playerInputHandler);
    this.components.eventHandler = new EventHandler(this.components.playerPool, this.components.viewManager);
    
    // Also store components directly on App for backward compatibility/easier access
    this.playerPool = this.components.playerPool;
    this.viewManager = this.components.viewManager;
    this.tacticManager = this.components.tacticManager;
    this.playerInputHandler = this.components.playerInputHandler;
    this.uiManager = this.components.uiManager;
    this.eventHandler = this.components.eventHandler;
    
    // Set tactic change callback
    this.components.tacticManager.onTacticChange = () => {
      this.components.playerPool.updateView();
      // Also update displayed tactic info when tactic changes programmatically (e.g. via game type change)
      const newCurrentTactic = this.components.tacticManager.getCurrentTactic();
      if (newCurrentTactic) {
        this.displayTacticInformation(newCurrentTactic);
        this.state.currentSelectedTactic = newCurrentTactic;
      }
    };

    // Initial setup
    this.initializeDefaultSetup();
  },

  initializeDefaultSetup() {
    // Set up tactic options for the default game type (7-a-side)
    const defaultGameType = 7;
    
    // Ensure the corresponding game type button is marked as active
    document.querySelectorAll('.game-type-btn').forEach(btn => {
      const isActive = btn.dataset.type === `${defaultGameType}er`;
      btn.classList.toggle('active', isActive);
    });
    
    // Load tactics for the default game type
    this.updateTacticOptions(defaultGameType);

    // Setup event listeners and initial view state (only once)
    this.setupEventListeners();
    this.viewManager.updatePlaceholder();
    this.viewManager.handleResize();
    
    // Display info for the initially selected tactic
    const initialTactic = this.components.tacticManager.getCurrentTactic();
    if (initialTactic) {
        this.displayTacticInformation(initialTactic);
        this.state.currentSelectedTactic = initialTactic;
    }
  },

  displayTacticInformation(tactic) {
    if (!tacticInfoCompact || !tacticInfoDescription || !tacticInfoBulletpoints) {
        // console.warn("Tactic info display elements not found."); // Optional warning
        return;
    }

    if (tactic && tactic.description && tactic.bulletpoints) {
        tacticInfoDescription.textContent = tactic.description;
        tacticInfoBulletpoints.innerHTML = ''; // Clear previous points
        tactic.bulletpoints.forEach(point => {
            const li = document.createElement('li');
            li.textContent = point;
            tacticInfoBulletpoints.appendChild(li);
        });
        tacticInfoCompact.style.display = 'block';
        // Info-Icon nur anzeigen, wenn eine erweiterte Beschreibung vorhanden ist
        if (tacticInfoIcon) {
            if (tactic.extendedDescription) {
                tacticInfoIcon.style.display = 'inline-block'; 
            } else {
                tacticInfoIcon.style.display = 'none';
            }
        }
    } else {
        tacticInfoCompact.style.display = 'none';
        if (tacticInfoIcon) tacticInfoIcon.style.display = 'none'; // Hide icon if no tactic/info
    }
  },
  
  updateTacticOptions(playerCount) {
    const select = document.getElementById('tactic-select');
    if (!select) return;
    
    // Set the game type in TacticManager first
    const success = this.components.tacticManager.setGameType(playerCount);
    if (!success) {
      return;
    }
    
    // Then update the dropdown options
    select.innerHTML = ''; // Clear existing options
    
    const tactics = this.components.tacticManager.getTacticsForCurrentGameType();
    if (tactics.length === 0) {
      return;
    }

    // Populate tactic select dropdown
    tactics.forEach(tactic => {
      const option = new Option(
        tactic.name.replace(`${playerCount}er `, ''), // Display simplified name
        tactic.name
      );
      select.add(option);
    });
    
    // Remove excess players if any, but don't redistribute automatically here
    this.checkAndRemoveExcessPlayers(playerCount);
    
    // Update the view with the potentially modified player pool
    this.components.playerPool.updateView();
    
    // After updating options, display info for the new default tactic
    const newDefaultTactic = this.components.tacticManager.getCurrentTactic();
    if (newDefaultTactic) {
        this.displayTacticInformation(newDefaultTactic);
        this.state.currentSelectedTactic = newDefaultTactic;

        // Ensure the tactic select dropdown reflects this default tactic
        if(select.options.length > 0) {
            let foundSelected = false;
            for(let i=0; i < select.options.length; i++) {
                if(select.options[i].value === newDefaultTactic.name) {
                    select.selectedIndex = i;
                    foundSelected = true;
                    break;
                }
            }
            if (!foundSelected) select.selectedIndex = 0; // Fallback to first if not found
        }
    } else {
        this.displayTacticInformation(null); // Hide info if no tactic
        this.state.currentSelectedTactic = null;
    }
  },
  
  // Check and remove excess players from the pitch
  checkAndRemoveExcessPlayers(maxPlayers) {
    if (!this.components.playerPool || !this.components.playerPool.players) {
      return;
    }
    
    const pitchPlayers = this.components.playerPool.getPitchPlayers();
    
    if (pitchPlayers.length === 0) {
      return;
    }
    
    // Move excess players to the bench
    if (pitchPlayers.length > maxPlayers) {
      
      // Sort players by their Y position on the pitch (bottom to top)
      const sortedPlayers = [...pitchPlayers].sort((a, b) => b.percentY - a.percentY);
      
      // Move players to bench starting from the ones "lowest" on the pitch visually
      for (let i = maxPlayers; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        player.location = "bench";
      }
    } 
  },

  setupEventListeners() {
    // Game type selection buttons
    document.querySelectorAll('.game-type-btn').forEach(btn => {
      // Clone and replace to remove old listeners, ensuring correct 'this' context
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', (e) => {
        // Update active button styling
        document.querySelectorAll('.game-type-btn').forEach(b => 
          b.classList.toggle('active', b === e.currentTarget)
        );
        
        const gameType = parseInt(e.currentTarget.dataset.type.replace('er', ''));
        // Call updateTacticOptions with the correct 'this' context (App object)
        this.updateTacticOptions.call(window.AppRef, gameType);
      });
    });

    // Tactic selection change
    document.getElementById('tactic-select').addEventListener('change', (e) => {
      const tacticName = e.target.value;
      this.components.tacticManager.setTactic(tacticName, this.components.playerPool);
      // Display info for the newly selected tactic
      const selectedTactic = this.components.tacticManager.getCurrentTactic();
      if (selectedTactic) {
          this.displayTacticInformation(selectedTactic);
          this.state.currentSelectedTactic = selectedTactic;
      }
    });

    // Listener for the tactic info icon
    if (tacticInfoIcon) {
        tacticInfoIcon.addEventListener('click', this.actions.showExtendedTacticInfo);
    }

    // Listener for the modal close button
    if (tacticModalCloseBtn) {
        tacticModalCloseBtn.addEventListener('click', this.actions.closeExtendedTacticInfoModal);
    }

    // Close modal if clicking outside of it (on the overlay)
    if (tacticInfoModal) {
        tacticInfoModal.addEventListener('click', (event) => {
            // Check if the click is directly on the modal overlay (the first child of the modal container)
            if (event.target === tacticInfoModal) {
                this.actions.closeExtendedTacticInfoModal();
            }
        });
    }

    // Bench drop zone events
    this.components.viewManager.substitutesList.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    this.components.viewManager.substitutesList.addEventListener("drop", (e) => {
      e.preventDefault();
      const playerId = e.dataTransfer.getData("text/plain");
      this.components.playerPool.movePlayer(playerId, "bench");
      this.components.viewManager.substitutesList.classList.remove("bg-gray-100"); // Remove highlight
    });

    // Pitch drag and drop events
    this.components.viewManager.pitchContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      
      const svgObject = this.components.viewManager.pitchContainer.querySelector("object");
      if (!svgObject) return;
      const svgRect = svgObject.getBoundingClientRect();
      
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;

      const percentX = (mouseX / svgRect.width) * 100;
      const percentY = (mouseY / svgRect.height) * 100;

      if (!this.components.viewManager.isPointInPitch(mouseX, mouseY, svgRect)) {
        e.dataTransfer.dropEffect = "none"; // Disallow drop outside pitch
        return;
      }

      const positionMarkers = this.components.tacticManager.getPositionMarkers();
      if (positionMarkers.length > 0) { // Tactic is active
        const highlightResult = this.components.viewManager.highlightClosestMarker(percentX, percentY);
        e.dataTransfer.dropEffect = (highlightResult && highlightResult.shouldSnap) ? "move" : "none";
      } else { // Free placement
        e.dataTransfer.dropEffect = "move";
      }
    });

    this.components.viewManager.pitchContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      const playerId = e.dataTransfer.getData("text/plain");
      const player = this.components.playerPool.getPlayerById(playerId);

      const draggedElement = document.querySelector(`[data-player-id="${playerId}"]`);

      if (!player) {
        document.querySelectorAll('[data-player-id].opacity-50').forEach(el => el.classList.remove('opacity-50'));
        return;
      }
      
      const svgObject = this.components.viewManager.pitchContainer.querySelector("object");
      if (!svgObject) {
          draggedElement?.classList.remove("opacity-50");
          return;
      }
      const svgRect = svgObject.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;

      if (!this.components.viewManager.isPointInPitch(mouseX, mouseY, svgRect)) {
        draggedElement?.classList.remove("opacity-50");
        return;
      }

      const percentX = (mouseX / svgRect.width) * 100;
      const percentY = (mouseY / svgRect.height) * 100;

      const positionMarkers = this.components.tacticManager.getPositionMarkers();
      const isFreePlacement = positionMarkers.length === 0;
      const gameType = this.components.tacticManager.getCurrentGameType();
      const maxPlayersOnPitch = gameType || 11; // Default to 11 if gameType is not set
      const currentPitchPlayerCount = this.components.playerPool.getPitchPlayers().length;

      // Prevent adding more than maxPlayers in free placement mode if player comes from bench
      if (isFreePlacement && player.location !== "pitch" && currentPitchPlayerCount >= maxPlayersOnPitch) {
        draggedElement?.classList.remove("opacity-50");
        return;
      }

      if (!isFreePlacement) { // Tactic is active
        const highlightResult = this.components.viewManager.highlightClosestMarker(percentX, percentY);
        
        if (!highlightResult || !highlightResult.shouldSnap) {
          document.querySelectorAll(`[data-player-id="${playerId}"]`).forEach(el => {
            el.classList.remove("opacity-50", "dragging");
          });
          return;
        }
        
        const targetX = highlightResult.x;
        const targetY = highlightResult.y;
        
        const existingPlayerAtTarget = this.components.playerPool.getPitchPlayers().find(p => 
          Math.abs(p.percentX - targetX) < 0.1 && 
          Math.abs(p.percentY - targetY) < 0.1 &&
          p.id !== playerId 
        );

        if (existingPlayerAtTarget) { // Swap players
          const oldX = player.percentX;
          const oldY = player.percentY;
          const wasOnPitch = player.location === "pitch";
          
          player.percentX = targetX;
          player.percentY = targetY;
          player.location = "pitch";
          
          if (wasOnPitch) {
            existingPlayerAtTarget.percentX = oldX;
            existingPlayerAtTarget.percentY = oldY;
          } else {
            existingPlayerAtTarget.location = "bench"; // Move existing player to bench
          }
          this.components.playerPool.updateView();
        } else { // Move to empty tactic position
          player.percentX = targetX;
          player.percentY = targetY;
          this.components.playerPool.movePlayer(playerId, "pitch");
        }
      } else { // Free placement mode
        player.percentX = percentX;
        player.percentY = percentY;
        this.components.playerPool.movePlayer(playerId, "pitch");
      }

      draggedElement?.classList.remove("opacity-50");
      
      // Reset all marker highlights
      this.components.viewManager.playersContainer.querySelectorAll('.position-marker')
        .forEach(marker => {
          marker.classList.remove('border-blue-600', 'border-4', 'bg-blue-100/30', 'highlighted');
          marker.classList.add('border-blue-600', 'border-2');
        });
    });
  }
};

// Simplified synchronous initialization
function initializeApp() {
  if (window.AppInitialized) return; // Prevent multiple initializations
  
  // Check if required DOM elements exist
  const requiredElements = [
      'player-dialog', 'player-input', 'pitch-container', 'add-players-btn', 
      'print-btn', 'cancel-btn', 'add-close-btn', 'tactic-select',
      // Add IDs for tactic info display
      'tactic-info-compact', 'tactic-info-description', 'tactic-info-bulletpoints',
      'tactic-info-icon', 'tactic-info-modal', 'tactic-modal-title',
      'tactic-modal-extended-description', 'tactic-modal-close-btn'
    ];
  for (const id of requiredElements) {
    if (!document.getElementById(id)) {
      // Allow some to be optional for now, or provide a more graceful fallback.
      // For critical ones, error out.
      const critical = ['player-dialog', 'player-input', 'pitch-container', 'add-players-btn', 'tactic-select'];
      if (critical.includes(id)) {
        console.error(`Initialization Error: Missing critical DOM element with ID: ${id}`);
        return; 
      } else {
        // console.warn(`Optional DOM element with ID: ${id} not found. Some UI features might be limited.`);
      }
    }
  }

  try {
    App.init(); // Initialize the main application
    window.AppInitialized = true;

    // Set up global event listeners for UI controls
    document.getElementById('add-players-btn').addEventListener('click', App.actions.openPlayerDialog);
    document.getElementById('print-btn').addEventListener('click', App.actions.printPitch);
    document.getElementById('cancel-btn').addEventListener('click', App.actions.closePlayerDialog);
    document.getElementById('add-close-btn').addEventListener('click', App.actions.addPlayersAndClose);
  } catch (error) {
    console.error('App initialization failed:', error);
  }
}

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle window resize events to adjust view elements
window.addEventListener("resize", () => {
  if (window.AppRef?.viewManager) {
    window.AppRef.viewManager.handleResize();
  }
});

// Assign actions to window for backward compatibility or global access if needed
window.addPlayers = App.actions.addPlayers;
window.printPitch = App.actions.printPitch;
window.openPlayerDialog = App.actions.openPlayerDialog;
window.closePlayerDialog = App.actions.closePlayerDialog;
window.addPlayersAndClose = App.actions.addPlayersAndClose;
