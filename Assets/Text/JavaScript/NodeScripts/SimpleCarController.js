/**
 * A script that can be used to control the two wheel joints of a simple car.
 * This script expects that the scene contains two RevoluteJointNodes named wheelJointA and
 * wheelJointB.
 */
class SimpleCarController {

	constructor(node) {
		this.node = node;
		this.motorSpeed = 0;
		this.initialized = false;
		this.maxSpeed = 10;
		this.acceleration = 0.1;
	}

	update(delta) {

		if (!this.initialized) {
			const scene = this.node.findSceneNode();
			if (scene) {
				this.wheelA = scene.findChildByName("wheelJointA");
				this.wheelB = scene.findChildByName("wheelJointB");
				this.initialized = this.wheelA && this.wheelB;
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
