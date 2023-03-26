// Player.js

export class Player {

    static RESPAWN_THRESHOLD = -30;


    constructor(x, y, z, socket) {
        this.handTransitionSpeed = 0.1;
        this.moveSpeed = 0.1;
        this.gravity = -0.01;
        this.canJump = false;
        this.jumpCount = 0;
        this.initialPosition = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3();
        this.socket = socket;

        this.group = this.generateBodyGroup();

        this.setPosition(x, y, z);
    }

    generateBodyGroup() {
        const group = new THREE.Group();

        // Create the body (main sphere)
        const bodyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xff69b4
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;

        // Create the left hand (small sphere)
        const handGeometry = new THREE.SphereGeometry(0.15, 32, 32);
        const handMaterial = new THREE.MeshStandardMaterial({
            color: 0xff69b4
        });
        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-0.7, 0.5, 0);

        // Create the right hand (small sphere)
        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(0.7, 0.5, 0);

        group.add(body);
        group.add(leftHand);
        group.add(rightHand);
        
        return group;
    }


    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    getPosition() {
        return this.group.position;
    }

    updateVelocity(keysPressed) {
        if (keysPressed.ArrowLeft || keysPressed.KeyA) {
            this.velocity.x = -this.moveSpeed;
        } else if (keysPressed.ArrowRight || keysPressed.KeyD) {
            this.velocity.x = this.moveSpeed;
        } else {
            this.velocity.x = 0;
        }
        if (keysPressed.Space && keysPressed.spaceJustPressed) {
            if (this.canJump || (this.jumpCount < 2 && !this.canJump)) {
                this.velocity.y = 0.3;
                this.jumpCount++;
                if (this.jumpCount === 2) {
                    this.canJump = false;
                }
            }
            keysPressed.spaceJustPressed = false;
        }
        this.velocity.y += this.gravity;
    }

    updatePosition() {
        this.group.position.x += this.velocity.x;
        this.group.position.y += this.velocity.y;
    }

    updateRotation(camera) {
        // broken
        // Update player rotation based on velocity and camera position
        if (this.velocity.x !== 0) {
            const angleToCamera = Math.atan2(camera.position.z - this.group.position.z, camera.position.x - this.group.position.x);
            const direction = this.velocity.x > 0 ? 1 : -1;
            const rotationFactor = 0.75; // Adjust this value between 0 and 1 to control how much the player should face the camera
            this.group.rotation.y = angleToCamera * rotationFactor + Math.PI / 2 * direction;
        }
    }

    updateHandsPosition() {
        if (this.velocity.x === 0) {
            return;
        }
    
        const leftHand = this.group.children[1];
        const rightHand = this.group.children[2];
        const handOffsetY = 0.5;
        const handOffsetX = 0.7;
        const handOffsetZ = 0.2;
    
        const targetLeftHandPosition = new THREE.Vector3();
        const targetRightHandPosition = new THREE.Vector3();
    
        if (this.velocity.x > 0) {
            targetLeftHandPosition.set(handOffsetX, handOffsetY, -handOffsetZ);
            targetRightHandPosition.set(handOffsetX, handOffsetY, handOffsetZ);
        } else if (this.velocity.x < 0) {
            targetLeftHandPosition.set(-handOffsetX, handOffsetY, -handOffsetZ);
            targetRightHandPosition.set(-handOffsetX, handOffsetY, handOffsetZ);
        }
    
        leftHand.position.lerp(targetLeftHandPosition, this.handTransitionSpeed);
        rightHand.position.lerp(targetRightHandPosition, this.handTransitionSpeed);
    }

    isColliding(box1, box2) {
        const box1Bounds = new THREE.Box3().setFromObject(box1);
        const box2Bounds = new THREE.Box3().setFromObject(box2);

        return box1Bounds.intersectsBox(box2Bounds);
    }

    respawn() {
        this.velocity.set(0, 0, 0);
        this.setPosition(this.initialPosition.x, this.initialPosition.y, this.initialPosition.z);
    }

    getBoundingBox() {
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(this.group);
        return boundingBox;
    }

    handleCollision(stage) {
        const playerBoundingBox = this.getBoundingBox();
        const groundTop =
            stage.mesh.position.y +
            stage.mesh.geometry.parameters.height / 2 +
            (playerBoundingBox.max.y - playerBoundingBox.min.y) / 2;

        // Check if the player is on the ground and moving downward
        if (this.isColliding(this.group, stage.mesh) && this.velocity.y <= 0) {
            // Adjust player's position based on the player's height
            const playerHeight = playerBoundingBox.max.y - playerBoundingBox.min.y;
            this.setPosition(this.group.position.x, groundTop - playerHeight / 2, this.group.position.z);
            this.velocity.y = 0;
            if (this.jumpCount < 2) {
                this.canJump = true;
            }
            this.jumpCount = 0;
        } else {
            this.canJump = false;
        }
    }

    handleRespawn() {
        if (this.getPosition().y < Player.RESPAWN_THRESHOLD) {
            this.respawn();
        }
    }

    moveCamera(camera) {
        const cameraTarget = new THREE.Vector3();
        cameraTarget.x = this.getPosition().x;
        camera.position.x += (cameraTarget.x - camera.position.x) * 0.01;
    }

    updateFromGameState(gameState) {
        // Update player properties based on the server's data
        // This should be implemented based on your game state structure
      
        // Example: Updating player position and rotation
        this.group.position.set(gameState.position.x, gameState.position.y, gameState.position.z);
        this.group.rotation.y = gameState.rotation.y;
    }

    animate(keysPressed, stage, camera) {
        this.updateVelocity(keysPressed);
        this.updatePosition();
        // this.updateRotation(camera);
        this.updateHandsPosition();
        this.handleCollision(stage);
        this.handleRespawn();
        this.moveCamera(camera);
    }
}