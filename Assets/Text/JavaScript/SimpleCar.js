/**
 * This script will create a simple car
 */
class SimpleCar {

	constructor(wheelRadius, bodyLength, motorSpeed) {
		this.wheelRadius = wheelRadius || 1;
		this.bodyLength = bodyLength || 4;
		this.motorSpeed = motorSpeed || -1;
		this._fillTextureUrl = "https://raw.githubusercontent.com/dimitrisx/physion-assets/master/Assets/Image/Wheels/BicycleWheel.webp";
	}

	async create(scene, position) {
		await physion.utils.preloadTexture(this._fillTextureUrl);

		const r = this.wheelRadius;
		const l = this.bodyLength;

		var body = this.createBody(position.x, position.y, l, r / 2);
		var wheelA = this.createWheel(position.x - l / 2, position.y, r);
		var wheelB = this.createWheel(position.x + l / 2, position.y, r);
		var jointA = this.createRevoluteJoint(body, wheelA);
		var jointB = this.createRevoluteJoint(body, wheelB);

		scene.addChildren([body, wheelA, wheelB, jointA, jointB]);
	}

	createBody(x, y, w, h) {
		var body = new physion.RectangleNode(w, h);
		body.initNode(x, y);
		body.density = 2;
		return body;
	}

	createWheel(x, y, r) {
		var wheel = new physion.CircleNode(r);
		wheel.initNode(x, y);
		wheel.friction = 0.8;
		wheel.lineWidth = 0;
		wheel.fillTextureUrl = this._fillTextureUrl;
		wheel.autoAdjustFillTexture();
		return wheel;
	}

	createRevoluteJoint(body, wheel) {
		var joint = new physion.RevoluteJointNode(body.id, wheel.id, wheel.getPosition());
		joint.motorEnabled = true;
		joint.motorSpeed = this.motorSpeed;
		joint.fillColor = 0xcccccc;
		return joint;
	}
}
