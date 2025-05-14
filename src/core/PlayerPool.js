import { markRaw } from 'vue';

export class PlayerPool {
  constructor() {
    this.players = [];
  }

  addPlayer(player) {
    // Name conflict resolution (from original JS)
    const sameFirstNamePlayers = this.players.filter(
      p => p.firstName.split(" ")[0] === player.firstName.split(" ")[0]
    );

    if (sameFirstNamePlayers.length > 0) {
      const sameInitialPlayers = sameFirstNamePlayers.filter(
        p => p.lastName.charAt(0).toUpperCase() === 
             player.lastName.charAt(0).toUpperCase()
      );

      if (sameInitialPlayers.length > 0) {
        sameInitialPlayers.forEach(p => 
          p.displayName = `${p.number}, ${p.firstName} ${p.lastName}`
        );
        player.displayName = `${player.number}, ${player.firstName} ${player.lastName}`;
      } else {
        sameFirstNamePlayers.forEach(p =>
          p.displayName = `${p.number}, ${p.firstName} ${p.lastName.charAt(0).toUpperCase()}.`
        );
        player.displayName = `${player.number}, ${player.firstName} ${player.lastName.charAt(0).toUpperCase()}.`;
      }
    }

    this.players.push(markRaw(player));
  }

  movePlayer(playerId, newLocation) {
    const player = this.getPlayerById(playerId);
    if (player) {
      player.location = newLocation;
    }
  }

  getPlayerById(id) {
    return this.players.find(p => p.id === id);
  }

  getBenchPlayers() {
    return this.players.filter(p => p.location === "bench");
  }

  getPitchPlayers() {
    return this.players.filter(p => p.location === "pitch");
  }
}
