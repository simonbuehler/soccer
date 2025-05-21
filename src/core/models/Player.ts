/**
 * Data structure for player information
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

/**
 * Represents a soccer player with position and display properties
 */
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
    console.debug(`Created player: ${this.displayName} (ID: ${this.id})`);
  }

  /**
   * Updates and returns the display name based on formatting options
   * @param showLastName - Whether to include full last name
   * @param showInitial - Whether to show last name initial
   * @returns Formatted display name string
   */
  updateDisplayName(showLastName = false, showInitial = false): string {
    // Use only first part if firstName contains multiple names
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
