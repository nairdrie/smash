class GameState {
    constructor() {
      this.players = {};
    }
  
    addPlayer(socketId, initialPosition) {
      this.players[socketId] = {
        position: initialPosition,
        rotation: { y: 0 },
      };
    }
  
    removePlayer(socketId) {
      delete this.players[socketId];
    }
  
    updatePlayer(socketId, action) {
      const player = this.players[socketId];
  
      if (!player) {
        return;
      }
  
      // Update player position and rotation based on the action
      // This should be implemented based on your game logic
      player.position.x += action.keysPressed.ArrowRight ? 0.1 : 0;
      player.rotation.y += action.keysPressed.ArrowRight ? 0.1 : 0;
    }
  
    getState() {
      return this.players;
    }
  }
  
  module.exports = GameState;