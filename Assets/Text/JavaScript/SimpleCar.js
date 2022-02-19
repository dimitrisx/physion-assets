/**
 * This script will create a simple car
 */
class SimpleCar {

	constructor(wheelRadius, bodyLength, motorSpeed) {
		this.wheelRadius = wheelRadius || 1;
		this.bodyLength = bodyLength || 4;
		this.motorSpeed = motorSpeed || -1;
		this._wheelUrl = "https://raw.githubusercontent.com/dimitrisx/physion-assets/master/Assets/Image/Wheels/BicycleWheel.webp";
	}

	async create(scene, position) {

		position = position || { x: 0, y: 0 };

		await physion.utils.preloadTexture(this._wheelUrl);

		const imageAsset = new physion.ImageAsset(this._wheelUrl);
		imageAsset.name = "Wheel";
		scene.assetsLibrary.addAsset(imageAsset);

		const r = this.wheelRadius;
		const l = this.bodyLength;

		var body = this.createBody(position.x, position.y, l, r / 2);
		var wheelA = this.createWheel(position.x - l / 2, position.y, r, imageAsset.id);
		var wheelB = this.createWheel(position.x + l / 2, position.y, r, imageAsset.id);
		var jointA = this.createRevoluteJoint(body, wheelA);
		var jointB = this.createRevoluteJoint(body, wheelB);

		scene.addChildren([body, wheelA, wheelB, jointA, jointB]);

		wheelA.autoAdjustFillTexture();
		wheelB.autoAdjustFillTexture();
	}

	createBody(x, y, w, h) {
		var body = new physion.RectangleNode(w, h);
		body.initNode(x, y);
		body.density = 2;
		return body;
	}

	createWheel(x, y, r, fillTexture) {
		var wheel = new physion.CircleNode(r);
		wheel.initNode(x, y);
		wheel.friction = 0.8;
		wheel.lineWidth = 0;
		wheel.fillTexture = fillTexture;
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
