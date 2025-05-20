/**
 * Player-Klasse für das Domain-Modell
 */

export interface PlayerData {
  id?: string;
  number: number;
  firstName: string;
  lastName?: string;
  percentX?: number;
  percentY?: number;
  displayName?: string;
}

export class Player {
  id: string;
  number: number;
  firstName: string;
  lastName: string;

  percentX: number;
  percentY: number;
  displayName: string;

  constructor(data: PlayerData) {
    this.id = data.id || `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.number = data.number;
    this.firstName = data.firstName;
    this.lastName = data.lastName || "";
    this.percentX = data.percentX || 0;
    this.percentY = data.percentY || 0;
    this.displayName = data.displayName || this.firstName;
    console.debug(`Player created: ${this.id}, ${this.displayName}`);
  }

  updateDisplayName(showLastName = false, showInitial = false): string {
    // Nur den ersten Vornamen verwenden, falls es mehrere gibt
    const firstNamePart = this.firstName.split(" ")[0];
    let lastNamePart = "";
    
    if (showLastName) {
      lastNamePart = ` ${this.lastName}`;
    } else if (showInitial && this.lastName) {
      lastNamePart = ` ${this.lastName.charAt(0).toUpperCase()}.`;
    }
    
    this.displayName = `${firstNamePart}${lastNamePart}`;
    return this.displayName;
  }
}
