/**
 * Player-Klasse für das Domain-Modell
 */
export class Player {
  constructor(data) {
    this.id = data.id || `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.number = data.number;
    this.firstName = data.firstName;
    this.lastName = data.lastName || "";
    this.location = data.location || "bench";
    this.percentX = data.percentX || 0;
    this.percentY = data.percentY || 0;
    this.displayName = data.displayName || `${this.number}, ${this.firstName}`;
  }

  updateDisplayName(showLastName = false, showInitial = false) {
    const firstNamePart = this.firstName.split(" ")[0];
    let lastNamePart = "";
    
    if (showLastName) {
      lastNamePart = ` ${this.lastName}`;
    } else if (showInitial && this.lastName) {
      lastNamePart = ` ${this.lastName.charAt(0).toUpperCase()}.`;
    }
    
    this.displayName = `${this.number}, ${firstNamePart}${lastNamePart}`;
    return this.displayName;
  }
}
