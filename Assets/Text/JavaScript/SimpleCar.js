/**
 * This script will create a simple car
 */
class SimpleCar {

	constructor(wheelRadius, bodyLength, motorSpeed) {
		this.wheelRadius = wheelRadius || 1;
		this.bodyLength = bodyLength || 4;
		this.motorSpeed = motorSpeed || 1;
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

		var chassis = this.createChassis(position.x, position.y, l, r / 2);
		var wheelA = this.createWheel(position.x - l / 2, position.y, r, imageAsset.id);
		var wheelB = this.createWheel(position.x + l / 2, position.y, r, imageAsset.id);
		var wheelJointA = this.createRevoluteJoint(chassis, wheelA);
		var wheelJointB = this.createRevoluteJoint(chassis, wheelB);

		chassis.name = "chassis";
		wheelA.name = "wheelA";
		wheelB.name = "wheelB";
		wheelJointA.name = "wheelJointA";
		wheelJointB.name = "wheelJointB";

		scene.addChildren([chassis, wheelA, wheelB, wheelJointA, wheelJointB]);

		wheelA.autoAdjustFillTexture();
		wheelB.autoAdjustFillTexture();
	}

	createChassis(x, y, w, h) {
		var chassis = new physion.RectangleNode(w, h);
		chassis.initNode(x, y);
		chassis.fillColor = physion.utils.randomColor();
		chassis.density = 2;
		return chassis;
	}

	createWheel(x, y, r, fillTexture) {
		var wheel = new physion.CircleNode(r);
		wheel.initNode(x, y);
		wheel.friction = 0.9;
		wheel.lineWidth = 0;
		wheel.fillTexture = fillTexture;
		return wheel;
	}

	createRevoluteJoint(body, wheel) {
		const localAnchorWheel = { x: 0, y: 0 };
		const localAnchorBody = body.getSceneTransform().applyInverse(wheel.getScenePosition());

		var joint = new physion.RevoluteJointNode(wheel.id, body.id, localAnchorWheel, localAnchorBody);
		joint.motorEnabled = true;
		joint.motorSpeed = this.motorSpeed;
		joint.fillColor = 0xcccccc;
		return joint;
	}
}
