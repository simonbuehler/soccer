/**
 * PlayerInputHandler class processes input for new players.
 */

import { Player } from './Player.js';

export class PlayerInputHandler {
  constructor(playerPool, playerInput) {
    this.playerPool = playerPool;
    this.playerInput = playerInput;
  }

  addPlayers() {
    const inputText = this.playerInput.value.trim();
    if (!inputText) return;

    const lines = inputText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    lines.forEach((line) => {
      // Attempt to split by comma first, then by space for the number part
      let numberStr, firstNameStr, lastNameStr;

      const parts = line.split(",");
      if (parts.length >= 2) {
        const numberPartRaw = parts[0].trim();
        firstNameStr = parts[1].trim();
        
        // Further split numberPartRaw to separate number and potential last name part
        const numberAndLastName = numberPartRaw.split(/\s+/); // Split by one or more spaces
        numberStr = numberAndLastName[0].trim();
        if (numberAndLastName.length > 1) {
          lastNameStr = numberAndLastName.slice(1).join(" ").trim();
        } else {
          lastNameStr = ""; // Default if no last name part before comma
        }
        
        // If there's a third part after comma, it's definitely the last name
        if (parts.length > 2) {
            lastNameStr = parts.slice(1).join(",").trim().split(/\s+/).slice(1).join(" ");
            firstNameStr = parts[1].trim().split(/\s+/)[0].trim(); // Re-evaluate firstName if last name was also after comma
        }


      } else {
        // Fallback if no comma: try to parse "Number LastName, FirstName" or "Number FirstName LastName"
        const spaceParts = line.split(/\s+/);
        if (spaceParts.length >= 2) {
          numberStr = spaceParts[0].trim();
          firstNameStr = spaceParts[1].trim();
          if (spaceParts.length > 2) {
            lastNameStr = spaceParts.slice(2).join(" ").trim();
          } else {
            lastNameStr = ""; // Default if only number and one name part
          }
        } else {
          // Not enough parts to form a player
          console.warn(`Skipping line due to insufficient parts: "${line}"`);
          return; // Skip this line
        }
      }
      
      // Ensure essential parts are present
      if (!numberStr || !firstNameStr) {
        console.warn(`Skipping line due to missing number or first name: "${line}"`);
        return; // Skip this line
      }
      
      // lastName can be empty, Player class handles default
      lastNameStr = lastNameStr || "";


      const player = new Player(numberStr, firstNameStr, lastNameStr);

      // Duplicate check
      const isDuplicate = this.playerPool.players.some(
        (p) =>
          p.number === player.number ||
          (p.firstName === player.firstName && p.lastName === player.lastName && p.lastName !== "") // Avoid duplicate if lastName is empty for both
      );

      if (!isDuplicate) {
        this.playerPool.addPlayer(player);
      } else {
        console.warn(`Skipping duplicate player: ${player.number} ${player.firstName} ${player.lastName}`);
      }
    });

    this.playerInput.value = ""; // Clear input after processing
  }
}
