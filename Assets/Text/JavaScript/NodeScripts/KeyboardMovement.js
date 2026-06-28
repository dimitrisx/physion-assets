/**
 * Lets the player move a body with the arrow keys, accelerating while a key is held and
 * coasting smoothly to a stop when released. Diagonal movement is normalized so it isn't faster
 * than moving straight, and heavier bodies get proportionally stronger forces.
 *
 * Parameters:
 * - maxForce: How strongly the body accelerates. (default: 20)
 * - deceleration: How quickly the body slows down when no key is pressed. Lower values feel
 *   floatier; values closer to 1 stop almost immediately. (default: 0.98)
 * - deadZone: The speed below which the body is snapped to a complete stop. (default: 0.1)
 *
 * Requirements: Must be attached to a dynamic body node. For a floating feel, set the body's
 * gravityScale to 0.
 *
 * Tip: open the script and edit the `keybind` property if you want to remap the controls (e.g.
 * to WASD).
 */
class KeyboardMovement {

	static PD_maxForce = { path: "maxForce", defaultValue: 20, min: 0, step: 1 };
	static PD_deceleration = { path: "deceleration", defaultValue: 0.98, min: 0, max: 1, step: 0.01 };
	static PD_deadZone = { path: "deadZone", defaultValue: 0.1, min: 0, step: 0.01 };

	constructor(node) {
		this.node = node instanceof physion.BodyNode ? node : undefined; // Check if the node is a BodyNode
		if (!this.node) {
			const message = "KeyboardMovement can only be attached to a BodyNode";
			alert(message);
			return;
		}

		this.maxForce = KeyboardMovement.PD_maxForce.defaultValue;
		this.deceleration = KeyboardMovement.PD_deceleration.defaultValue;
		this.deadZone = KeyboardMovement.PD_deadZone.defaultValue;

		// Customize the following if you want to control the node with other keys (e.g. WASD)
		this.keybind = {
			left: 37,
			up: 38,
			right: 39,
			down: 40,
		};
	}

	update(delta) {
		if (this.node?.bodyType !== "dynamic") {
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
		let maxForce = this.maxForce * this.node.mass;

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
		const deadZone = this.deadZone;
		const deceleration = this.deceleration;

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