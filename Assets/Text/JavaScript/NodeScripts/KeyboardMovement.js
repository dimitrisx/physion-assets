/**
 * A movement controller that allows a body to be moved using arrow keys.
 * The body accelerates when keys are pressed and smoothly decelerates when released.
 * 
 * Features:
 * - Applies forces proportional to how long keys are held
 * - Automatic deceleration when no keys are pressed
 * - Normalized diagonal movement (no speed boost when moving diagonally)
 * - Mass-aware forces (stronger forces for heavier objects)
 * - Only works with dynamic bodies
 * 
 * Requirements:
 * - Must be attached to a BodyNode
 * - Body should have gravityScale set to 0 for floating behavior
 * - Body type must be "dynamic" 
 * 
 * Script behavior can be customized via Node's userData:
 * 
 * // Example:
 * bodyNode.userData.KeyboardMovement = {
 *   maxForce: 30,        // Higher = faster acceleration
 *   deceleration: 0.95,  // Lower = slower deceleration (0.9 = very floaty, 0.99 = quick stop)
 *   deadZone: 0.2        // Velocity threshold to fully stop
 * };
 */
class KeyboardMovement {

	constructor(node) {
		this.node = node instanceof physion.BodyNode ? node : undefined; // Check if the node is a BodyNode
		if (!this.node) {
			const message = "KeyboardMovement can only be attached to a BodyNode";
			alert(message);
			return;
		}

		// Customize the following if you want to control the node with other keys (e.g. WASD)
		this.keybind = {
			left: 37,
			up: 38,
			right: 39,
			down: 40,
		};
	}

	update(delta) {
		if (this.node.bodyType !== "dynamic") {
			return;
		}

		const force = this.calculateForce();
		if (force.x !== 0 || force.y !== 0) {
			this.node.applyForce(force);
		} else {
			this.applyDeceleration();
		}
	}

	calculateForce() {
		let maxForce = this.node.userData.KeyboardMovement?.maxForce || 20;
		maxForce *= this.node.mass;

		let forceX = 0;
		let forceY = 0;

		const km = physion.root.keyboardManager;

		if (km.isPressed(this.keybind.left)) forceX -= maxForce;
		if (km.isPressed(this.keybind.right)) forceX += maxForce;
		if (km.isPressed(this.keybind.up)) forceY += maxForce;
		if (km.isPressed(this.keybind.down)) forceY -= maxForce;

		// Normalize diagonal movement
		if (forceX !== 0 && forceY !== 0) {
			const magnitude = Math.sqrt(forceX * forceX + forceY * forceY);
			forceX = (forceX / magnitude) * maxForce;
			forceY = (forceY / magnitude) * maxForce;
		}

		return { x: forceX, y: forceY };
	}

	applyDeceleration() {
		const deadZone = this.node.userData.KeyboardMovement?.deadZone || 0.1;
		const deceleration = this.node.userData.KeyboardMovement?.deceleration || 0.98;

		const velocity = this.node.getLinearVelocity();
		const speed = Math.hypot(velocity.x, velocity.y);

		// Stop completely if below dead zone threshold
		if (speed < deadZone) {
			this.node.linearVelocityX = 0;
			this.node.linearVelocityY = 0;
			return;
		}

		// Apply damping to slow down
		this.node.linearVelocityX = velocity.x * deceleration;
		this.node.linearVelocityY = velocity.y * deceleration;
	}
}