// Game.js

import { Player } from "./Player.js";
import { Stage } from "./Stage.js";

export class Game {
  constructor() {
    this.initSocket()
    this.initScene();
    this.initPlayer();
    this.initStage();
    this.initLights();
    this.initControls();

    document.addEventListener("DOMContentLoaded", () => {
      document
        .getElementById("startButton")
        .addEventListener("click", () => {
          document.getElementById("startMenu").style.display = "none";
          this.animate();
        });
    });
  }

  initSocket() {
    this.socket = io("http://localhost:3000");
  
    // Store other players in a dictionary
    this.otherPlayers = {};
  
    // Listen for updates from the server
    this.socket.on('gameStateUpdate', (gameState) => {
      // Update the game state based on the server's data
      this.updateGameState(gameState);
    });
  }

  updateGameState(gameState) {
    // Update the main player
    const mainPlayerData = gameState[this.socket.id];
    if (mainPlayerData) {
      this.player.updateFromGameState(mainPlayerData);
    }
  
    // Loop through other players in the game state
    for (const socketId in gameState) {
      if (socketId === this.socket.id) {
        // Skip the main player
        continue;
      }
  
      let otherPlayer = this.otherPlayers[socketId];
  
      // If the other player doesn't exist, create and add it to the scene
      if (!otherPlayer) {
        otherPlayer = new Player(0, 5, -1.5);
        this.otherPlayers[socketId] = otherPlayer;
        this.scene.add(otherPlayer.group);
      }
  
      // Update other player from game state
      otherPlayer.updateFromGameState(gameState[socketId]);
    }
  
    // Remove disconnected players
    for (const socketId in this.otherPlayers) {
      if (!gameState[socketId]) {
        this.scene.remove(this.otherPlayers[socketId].group);
        delete this.otherPlayers[socketId];
      }
    }
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.y = 4;
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }

  initPlayer() {
    this.player = new Player(0, 5, -1.5);
    this.scene.add(this.player.group);
  }

  initStage() {
    this.stage = new Stage(0, -0.05, -1.5);
    this.scene.add(this.stage.mesh);
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5, 15);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 15);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
  }

  initControls() {
    this.keysPressed = {
      ArrowLeft: false,
      ArrowRight: false,
      Space: false,
      KeyA: false,
      KeyD: false,
      spaceJustPressed: false,
    };

    document.addEventListener("keydown", (event) => {
      this.keysPressed[event.code] = true;
      if (event.code === "Space") {
        this.keysPressed.spaceJustPressed = true;
      }
    });

    document.addEventListener("keyup", (event) => {
      this.keysPressed[event.code] = false;
      if (event.code === "Space") {
        this.keysPressed.spaceJustPressed = false;
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Emit player actions to the server
    this.socket.emit('playerAction', {
      keysPressed: this.keysPressed
    });

    this.player.animate(this.keysPressed, this.stage, this.camera);
  
    this.renderer.render(this.scene, this.camera);
  }
}