class TurretController {

	static PD_bulletShape = {
		path: "bulletShape",
		defaultValue: "capsule",
		editor: "Select",
		selectOptions: [
			{ value: "circle", label: "Circle" },
			{ value: "capsule", label: "Capsule" },
		],
	};
	static PD_bulletProps = { path: "bulletProps", defaultValue: { ttl: 3000, fillColor: 0xb5a642, bullet: true, fixedRotation: false, angularDamping: 1, gravityScale: 1, friction: 0.05, restitution: 0.05, density: 3, filterGroupIndex: 0, drawLine: false }, description: "Properties applied to each spawned bullet node." };
	static PD_bulletVelocity = { path: "bulletVelocity", defaultValue: 50, min: 10, max: 120, step: 10, description: "Initial speed of spawned bullets, in meters per second." };
	static PD_bulletTrail = { path: "bulletTrail", defaultValue: true, description: "Attaches a particle trail to each bullet." };
	static PD_bulletSprite = { path: "bulletSprite", defaultValue: false, description: "Renders bullets with a bullet image instead of a plain shape." };
	static PD_cooldownMs = { path: "cooldownMs", defaultValue: 200, min: 50, max: 500, step: 10 };
	static PD_recoilEnabled = { path: "recoilEnabled", defaultValue: true };
	static PD_triggerButton = {
		path: "triggerButton",
		defaultValue: "1",
		editor: "Select",
		selectOptions: [
			{ value: "1", label: "Left" },
			{ value: "2", label: "Right" },
		],
	};

	constructor(node) {
		this.node = node instanceof physion.CircleNode ? node : undefined;
		if (!this.node) {
			console.warn("BulletSpawner can only be attached to a CircleNode");
			return;
		}

		this.bulletShape = TurretController.PD_bulletShape.defaultValue;
		this.bulletProps = TurretController.PD_bulletProps.defaultValue;
		this.bulletVelocity = TurretController.PD_bulletVelocity.defaultValue;
		this.bulletTrail = TurretController.PD_bulletTrail.defaultValue;
		this.bulletSprite = TurretController.PD_bulletSprite.defaultValue;
		this.cooldownMs = TurretController.PD_cooldownMs.defaultValue;
		this.recoilEnabled = TurretController.PD_recoilEnabled.defaultValue;
		this.triggerButton = TurretController.PD_triggerButton.defaultValue;

		this.lastShotTime = 0;

		const bulletTextureUrl = "https://res.cloudinary.com/jeronimo/image/upload/v1784715799/Testing/bullet.png";
		physion.utils.textureFromUrl(bulletTextureUrl).then((texture) => {
			console.log("Bullet texture loaded");
			this.bulletTexture = texture;
		});

		this.graphics = physion.utils.createGraphics();
		this.node.container.addChild(this.graphics);
		this.updateGraphics();

		this.node.on("propertyChanged", this.onNodePropertyChanged);
	}

	destroy() {
		this.graphics.clear();
		this.node.container.removeChild(this.graphics);

		this.node.off("propertyChanged", this.onNodePropertyChanged);
	}

	get canonLength() {
		return this.node.radius * 2;
	}

	update(delta) {
		if (!this.node) {
			return;
		}

		const scene = this.node.findSceneNode();
		if (!scene) {
			return;
		}

		const pointerState = physion.utils.getPointerState(scene);
		const angle = physion.utils.calculateAngle(this.node.getScenePosition(), pointerState.localPosition);
		this.node.angle = physion.utils.radToDeg(angle);

		const now = Date.now();
		const triggerButton = Number(this.triggerButton);
		if (pointerState.buttons === triggerButton && now - this.lastShotTime >= this.cooldownMs) {
			this.lastShotTime = now;
			this.shoot();
		}

		if (this.graphics.x < 0) {
			this.graphics.x = Math.min(0, this.graphics.x + this.canonLength * 0.1);
		}
	}

	shoot() {
		const bullet = this.createBullet();
		this.node.parent.addChild(bullet);

		if (this.bulletTrail) {
			const trail = this.createTrail(bullet);
			this.node.parent.addChild(trail);
		}

		if (this.bulletSprite) {
			const sprite = this.createBulletSprite(bullet);
			if (sprite) {
				bullet.container.addChild(sprite);
				bullet.lineWidth = 0;
				bullet.fillAlpha = 0.01;
			}
		}

		if (this.recoilEnabled) {
			this.graphics.x = -this.canonLength * 0.5;
		}
	}

	// ---
	onNodePropertyChanged = (propertyName, propertyValue) => {
		if (propertyName === "radius" || propertyName === "fillColor") {
			this.updateGraphics();
		}
	}

	createBullet() {
		const angleRads = physion.utils.degToRad(this.node.angle);

		const bulletSize = Math.max(0.05, this.node.radius / 2);

		const bullet = this.bulletShape === "circle"
			? new physion.CircleNode(bulletSize)
			: new physion.CapsuleNode(bulletSize * 2, bulletSize);
		bullet.setPosition(this.getSpawnPos());
		bullet.angle = this.node.angle;
		bullet.linearVelocityX = Math.cos(angleRads) * this.bulletVelocity;
		bullet.linearVelocityY = Math.sin(angleRads) * this.bulletVelocity;
		Object.assign(bullet, this.bulletProps);
		return bullet;
	}

	createTrail(bullet) {
		const preset = physion.ParticleEmitterNode.getPreset("Default");
		const config = { ...preset.config };

		config.particleTexture = "circle_05";
		config.alpha = { start: 0.3, end: 0 };
		config.speed = { start: 0, end: 0 };
		config.scale = { start: 0.5, end: 0.1 };
		config.color.start = physion.pixiUtils.hex2string(bullet.fillColor);
		config.color.end = "#000000";
		config.startRotation = { min: 0, max: 0 };
		config.noRotation = true;
		config.rotationSpeed = { min: 0, max: 0 };
		config.blendMode = "screen";
		config.lifetime = { min: 0.1, max: 0.2 };
		config.frequency = 0.002;
		config.maxParticles = 150;
		config.addAtBack = true;

		const bRect = bullet.getBoundingRect();

		const trail = new physion.ParticleEmitterNode(bullet.id);
		trail.setEmitterConfig(config);
		trail.relativePosition = { x: -bRect.width / 2, y: 0 };
		return trail;
	}

	createBulletSprite(bullet) {
		if (!this.bulletTexture) {
			return;
		}

		const bRect = bullet.getBoundingRect();
		const textureWidth = this.bulletTexture.baseTexture.width;
		const textureHeight = this.bulletTexture.baseTexture.height;

		const sprite = physion.utils.createSprite(this.bulletTexture);
		sprite.anchor.set(0.5);
		sprite.scale.set(bRect.width / textureWidth, bRect.height / textureHeight);
		return sprite;
	}

	updateGraphics() {
		const r = this.node.radius; // The radius of the Circle
		const baseHalfWidth = r;
		const topHalfWidth = r / 2;

		this.graphics.clear();

		this.graphics.beginFill(this.node.fillColor, 0.9);
		this.graphics.moveTo(0, -baseHalfWidth);
		this.graphics.lineTo(0, baseHalfWidth);
		this.graphics.lineTo(this.canonLength, topHalfWidth);
		this.graphics.lineTo(this.canonLength, -topHalfWidth);
		this.graphics.closePath();
		this.graphics.endFill();
	}

	getSpawnPos() {
		const localPos = { x: this.canonLength, y: 0 };
		return this.node.toGlobal(localPos);
	}

}