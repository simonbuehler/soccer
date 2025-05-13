/**
 * UIManager-Klasse verwaltet die UI-Interaktionen
 */

export class UIManager {
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
