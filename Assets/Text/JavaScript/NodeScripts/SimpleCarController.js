/**
 * Drives a simple two-wheeled car using the left/right arrow keys to accelerate and the down
 * arrow key to brake.
 *
 * Parameters:
 * - maxSpeed: The car's top speed. (default: 10)
 * - acceleration: How quickly the car speeds up, slows down, and brakes. (default: 0.1)
 *
 * Requirements: The scene must contain two revolute joint nodes named "wheelJointA" and
 * "wheelJointB".
 */
class SimpleCarController {

	static PD_maxSpeed = { path: "maxSpeed", defaultValue: 10, min: 0, step: 1 };
	static PD_acceleration = { path: "acceleration", defaultValue: 0.1, min: 0, step: 0.01 };

	constructor(node) {
		this.node = node;
		this.motorSpeed = 0;
		this.initialized = false;
		this.maxSpeed = SimpleCarController.PD_maxSpeed.defaultValue;
		this.acceleration = SimpleCarController.PD_acceleration.defaultValue;
	}

	update(delta) {

		if (!this.initialized) {
			const scene = this.node.findSceneNode();
			if (scene) {
				this.wheelA = scene.findChildByName("wheelJointA");
				this.wheelB = scene.findChildByName("wheelJointB");
				this.initialized = this.wheelA && this.wheelB;

				if (this.wheelA) this.wheelA.motorEnabled = true;
				if (this.wheelB) this.wheelA.motorEnabled = true;
			}
		}

		if (this.initialized) {
			const KEYCODE_DOWN = 40;
			const KEYCODE_LEFT = 37;
			const KEYCODE_RIGHT = 39;

			const km = physion.root.keyboardManager;

			if (km.isPressed(KEYCODE_DOWN)) { // BREAK
				this.motorSpeed = 0;
			} else if (km.isPressed(KEYCODE_LEFT)) {
				this.motorSpeed -= this.acceleration;
			} else if (km.isPressed(KEYCODE_RIGHT)) {
				this.motorSpeed += this.acceleration;
			} else {
				if (this.motorSpeed > 0) this.motorSpeed -= this.acceleration;
				if (this.motorSpeed < 0) this.motorSpeed += this.acceleration;

				if (Math.abs(this.motorSpeed) <= this.acceleration) this.motorSpeed = 0;
			}

			if (this.motorSpeed > +this.maxSpeed) this.motorSpeed = +this.maxSpeed;
			if (this.motorSpeed < -this.maxSpeed) this.motorSpeed = -this.maxSpeed;

			this.wheelA.motorSpeed = this.motorSpeed;
			this.wheelB.motorSpeed = this.motorSpeed;
		}
	}
}
