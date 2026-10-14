/**
 * Steers a body with the mouse and two keys: the node turns every frame to face the pointer, one
 * key pushes it forwards (toward the pointer) and the other backwards (away from it, still facing
 * it). With neither key held the body coasts smoothly to a stop. Heavier bodies get proportionally
 * stronger forces, and once the body is at top speed the speed cap bends its velocity toward the
 * new heading, so turning while moving only drifts a little.
 *
 * Parameters:
 * - controlScheme: Which keys drive movement, W / S or Up / Down arrows. (default: "W / S")
 * - maxForce: How strongly the body accelerates. Higher values also turn the velocity toward a new
 *   heading faster. (default: 20)
 * - maxSpeed: The top speed while a key is held, in meters per second. 0 = unlimited. (default: 5)
 * - deceleration: How quickly the body slows down when no key is pressed. Lower values stop
 *   faster; values closer to 1 feel floatier. (default: 0.95)
 * - deadZone: The speed below which the body is snapped to a complete stop. (default: 0.1)
 *
 * Requirements: Must be attached to a BodyNode. The node faces the pointer with its local x axis
 * (the side that points right at angle 0), so draw or texture it pointing right. Only dynamic
 * bodies move; other body types just turn. Meant for top-down scenes: set the scene's gravity (or
 * the body's gravityScale) to 0 so the body isn't pulled off course.
 *
 * Tip: for keys other than W / S or Up / Down, edit the `resolveKeybind` method or the `keybind`
 * property directly in code.
 */
class MouseSteering {

	static PD_controlScheme = {
		path: "controlScheme",
		defaultValue: "ws",
		editor: "Select",
		selectOptions: [
			{ value: "ws", label: "W / S" },
			{ value: "arrows", label: "Up / Down" },
		],
	};
	static PD_maxForce = { path: "maxForce", defaultValue: 20, min: 0, step: 1, description: "Acceleration force, scaled by the body's mass." };
	static PD_maxSpeed = { path: "maxSpeed", defaultValue: 5, min: 0, step: 0.5, description: "Top speed while a key is held, in meters per second.\n0 = unlimited." };
	static PD_deceleration = { path: "deceleration", defaultValue: 0.95, min: 0, max: 1, step: 0.01, description: "Fraction of velocity kept each frame while no key is pressed.\nLower = stops faster." };
	static PD_deadZone = { path: "deadZone", defaultValue: 0.1, min: 0, step: 0.01, description: "Speed below which the body snaps to a full stop." };

	// Tuning constants (not exposed as parameters)
	static AIM_DEAD_ZONE = 0.05; // Pointer distance (m) below which the aim is held, so the node doesn't spin when the pointer sits on it

	constructor(node) {
		this.node = node instanceof physion.BodyNode ? node : undefined;
		if (!this.node) {
			const message = "MouseSteering can only be attached to a BodyNode";
			alert(message);
			return;
		}

		this._controlScheme = MouseSteering.PD_controlScheme.defaultValue;
		this.maxForce = MouseSteering.PD_maxForce.defaultValue;
		this.maxSpeed = MouseSteering.PD_maxSpeed.defaultValue;
		this.deceleration = MouseSteering.PD_deceleration.defaultValue;
		this.deadZone = MouseSteering.PD_deadZone.defaultValue;

		this.keybind = this.resolveKeybind(this._controlScheme);
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
		return scheme === "arrows"
			? { forward: 38, backward: 40 } // Up, Down arrows
			: { forward: 87, backward: 83 }; // W, S
	}

	update(delta) {
		if (!this.node) {
			return;
		}

		const scene = this.node.findSceneNode();
		if (!scene) {
			return;
		}

		this.aimAtPointer(scene);

		if (this.node.bodyType !== "dynamic") {
			return;
		}

		const km = physion.root.keyboardManager;
		let throttle = 0;
		if (km.isPressed(this.keybind.forward)) throttle += 1;
		if (km.isPressed(this.keybind.backward)) throttle -= 1;

		if (throttle !== 0) {
			this.push(throttle);
		} else {
			this.applyDeceleration();
		}
	}

	aimAtPointer(scene) {
		const position = this.node.getScenePosition();
		const pointer = physion.utils.getPointerLocalPosition(scene);

		if (physion.utils.calculateDistance(position, pointer) > MouseSteering.AIM_DEAD_ZONE) {
			const angle = physion.utils.calculateAngle(position, pointer);
			this.node.angle = physion.utils.radToDeg(angle);
		}

		// The angle is snapped every frame, so drop any spin picked up from collisions; otherwise
		// the body would rotate away during the next physics step and visibly jitter.
		this.node.angularVelocity = 0;
	}

	// Pushes along the facing direction: throttle is 1 for forwards, -1 for backwards.
	push(throttle) {
		const heading = physion.utils.degToRad(this.node.angle);
		const force = this.maxForce * this.node.mass * throttle;
		this.node.applyForce({ x: Math.cos(heading) * force, y: Math.sin(heading) * force });

		if (this.maxSpeed > 0) {
			this.capSpeed(this.maxSpeed);
		}
	}

	capSpeed(max) {
		const v = this.node.getLinearVelocity();
		const speed = Math.hypot(v.x, v.y);
		if (speed > max) {
			const k = max / speed;
			this.node.setLinearVelocity({ x: v.x * k, y: v.y * k });
		}
	}

	applyDeceleration() {
		const v = this.node.getLinearVelocity();
		const speed = Math.hypot(v.x, v.y);

		// Stop completely if below dead zone threshold
		if (speed < this.deadZone) {
			this.node.setLinearVelocity({ x: 0, y: 0 });
			return;
		}

		// Apply damping to slow down
		this.node.setLinearVelocity({ x: v.x * this.deceleration, y: v.y * this.deceleration });
	}
}
