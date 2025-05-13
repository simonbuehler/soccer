/**
 * Player-Klasse repräsentiert einen einzelnen Spieler im System
 */

export class Player {
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
