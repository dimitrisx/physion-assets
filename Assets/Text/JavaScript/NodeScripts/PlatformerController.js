/**
 * Classic 2D platformer movement: the Left/Right arrow keys move the body horizontally with
 * force-based acceleration, and the Up arrow key performs a variable-height jump - tap for a
 * short hop, hold for a full jump, cut short the instant the key is released while still rising.
 * Only ever affects the body's horizontal (X) velocity directly; vertical (Y) motion is left to
 * gravity and the jump impulse.
 *
 * Ground contact is detected from actual collision normals (not just contact counting), so
 * touching a wall or ceiling is never mistaken for standing on the ground.
 *
 * Parameters:
 * - controlScheme: Which keys drive the character, Arrow Keys or WASD. (default: "Arrow Keys")
 * - moveForce: How strongly the body accelerates left/right. Scaled by the body's mass. (default: 25)
 * - maxSpeedX: The hard cap on horizontal speed, enforced every tick. (default: 6)
 * - airControl: Fraction of moveForce applied while airborne (1 = same as grounded). (default: 0.5)
 * - jumpVelocity: The vertical takeoff speed produced by a jump. (default: 6)
 * - lowJumpMultiplier: Fraction of the current upward velocity kept if the jump key is released
 *   while still ascending; lower values make tapping produce a shorter hop. (default: 0.5)
 * - deceleration: How quickly the body coasts to a stop when grounded and no left/right key is
 *   held. Airborne horizontal momentum is never damped this way. (default: 0.85)
 * - deadZone: The horizontal speed below which the body snaps to a complete stop while
 *   decelerating. (default: 0.1)
 *
 * Requirements: Must be attached to a dynamic body node. The node's fixedRotation is switched on
 * automatically so the character doesn't tip over.
 *
 * Tip: for controls other than Arrow Keys/WASD, edit the `resolveKeybind` method or the
 * `keybind` property directly in code.
 */
class PlatformerController {

	static PD_controlScheme = {
		path: "controlScheme",
		defaultValue: "wasd",
		editor: "Select",
		selectOptions: [
			{ value: "arrows", label: "Arrow Keys" },
			{ value: "wasd", label: "WASD" },
		],
	};
	static PD_moveForce = { path: "moveForce", defaultValue: 25, min: 0, step: 1 };
	static PD_maxSpeedX = { path: "maxSpeedX", defaultValue: 6, min: 0, step: 0.5 };
	static PD_airControl = { path: "airControl", defaultValue: 0.5, min: 0, max: 1, step: 0.05 };
	static PD_jumpVelocity = { path: "jumpVelocity", defaultValue: 6, min: 0, step: 0.5 };
	static PD_lowJumpMultiplier = { path: "lowJumpMultiplier", defaultValue: 0.5, min: 0, max: 1, step: 0.05 };
	static PD_deceleration = { path: "deceleration", defaultValue: 0.85, min: 0, max: 1, step: 0.01 };
	static PD_deadZone = { path: "deadZone", defaultValue: 0.1, min: 0, step: 0.01 };

	constructor(node) {
		this.node = node instanceof physion.BodyNode ? node : undefined; // Check if the node is a BodyNode
		if (!this.node) {
			console.warn("PlatformerController can only be attached to a BodyNode");
			return;
		}

		this.node.fixedRotation = true; // Platformer characters shouldn't tip over

		this._controlScheme = PlatformerController.PD_controlScheme.defaultValue;
		this.moveForce = PlatformerController.PD_moveForce.defaultValue;
		this.maxSpeedX = PlatformerController.PD_maxSpeedX.defaultValue;
		this.airControl = PlatformerController.PD_airControl.defaultValue;
		this.jumpVelocity = PlatformerController.PD_jumpVelocity.defaultValue;
		this.lowJumpMultiplier = PlatformerController.PD_lowJumpMultiplier.defaultValue;
		this.deceleration = PlatformerController.PD_deceleration.defaultValue;
		this.deadZone = PlatformerController.PD_deadZone.defaultValue;

		// "jump" is edge-triggered (checked on press/release), not held for continuous thrust.
		this.keybind = this.resolveKeybind(this._controlScheme);

		this.contacts = new Map(); // Other BodyNode -> oriented ground-contact normal {x, y}
		this.wasJumpPressed = false; // Previous tick's jump key state, for edge detection
	}

	// Parameters are assigned directly onto the running instance (the constructor doesn't
	// re-run), so controlScheme is a getter/setter to react immediately when it's changed from
	// the Scripts Editor.
	get controlScheme() {
		return this._controlScheme;
	}

	set controlScheme(value) {
		if (this._controlScheme !== value) {
			this._controlScheme = value;
			this.keybind = this.resolveKeybind(value);
		}
	}

	resolveKeybind(scheme) {
		return scheme === "wasd"
			? { left: 65, right: 68, jump: 87 } // A, D, W
			: { left: 37, right: 39, jump: 38 }; // Left, Right, Up
	}

	update(delta) {
		if (this.node?.bodyType !== "dynamic") {
			return;
		}

		const km = physion.root.keyboardManager;
		const grounded = this.isGrounded();

		// --- Horizontal movement (X axis only; never touches Y) ---
		let moveX = 0;
		if (km.isPressed(this.keybind.left)) moveX -= 1;
		if (km.isPressed(this.keybind.right)) moveX += 1;

		if (moveX !== 0) {
			const control = grounded ? 1 : this.airControl;
			const forceX = moveX * this.moveForce * this.node.mass * control;
			this.node.applyForce({ x: forceX, y: 0 });
		} else if (grounded) {
			// Coast to a stop. Airborne horizontal momentum is preserved (no automatic air braking),
			// which is the classic platformer feel: jumps keep the run speed you took off with.
			this.applyDeceleration();
		}

		// Hard horizontal speed cap, enforced every tick regardless of ground state.
		this.node.linearVelocityX = this.capVelocity(this.node.linearVelocityX, this.maxSpeedX);

		// --- Jump (Up arrow) ---
		const jumpPressed = km.isPressed(this.keybind.jump);

		// Edge-triggered takeoff: fires once, only on the up-transition, only while grounded.
		// Holding the key does nothing further - wasJumpPressed blocks re-triggering every tick.
		if (jumpPressed && !this.wasJumpPressed && grounded) {
			this.node.applyLinearImpulse({ x: 0, y: this.node.mass * this.jumpVelocity });
		}

		// Edge-triggered cut-short: releasing the key while still ascending trims the upward
		// velocity once, producing a shorter hop. Releasing after the apex has no effect.
		if (!jumpPressed && this.wasJumpPressed && this.node.linearVelocityY > 0) {
			this.node.linearVelocityY *= this.lowJumpMultiplier;
		}

		this.wasJumpPressed = jumpPressed;
	}

	applyDeceleration() {
		const vx = this.node.linearVelocityX;
		this.node.linearVelocityX = Math.abs(vx) < this.deadZone ? 0 : vx * this.deceleration;
	}

	capVelocity(velocity, max) {
		return Math.sign(velocity) * Math.min(Math.abs(velocity), max);
	}

	isGrounded() {
		for (const normal of this.contacts.values()) {
			// A contact "counts" as ground when its normal points mostly upward relative to this
			// body (i.e. it's underfoot), not sideways (a wall) or downward (a ceiling).
			if (normal.y > 0.5) {
				return true;
			}
		}
		return false;
	}

	onBeginContact(other, contact) {
		if (!contact.IsTouching()) {
			return;
		}

		const worldManifold = physion.utils.getContactWorldManifold(contact);
		const normal = worldManifold.normal;
		let direction = { x: normal.x, y: normal.y };

		// Box2D's contact normal always points from fixture A to fixture B. We want it oriented
		// from the other body TOWARD this.node (pointing "up" out of the ground and into the
		// player when grounded):
		// - this.node is fixture A: the raw normal points this.node -> other (backwards), flip it.
		// - this.node is fixture B: the raw normal already points other -> this.node, keep it.
		if (contact.GetFixtureA().GetBody() === this.node.body) {
			direction.x = -direction.x;
			direction.y = -direction.y;
		}

		this.contacts.set(other, direction);

		contact.SetRestitution(0); // Avoid bouncing
		contact.SetFriction(0);
	}

	onEndContact(other, contact) {
		this.contacts.delete(other);
	}
}
