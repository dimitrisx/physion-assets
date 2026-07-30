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
	static PD_bulletProps = { path: "bulletProps", defaultValue: { ttl: 2000, fillColor: 0xb5a642, bullet: true, fixedRotation: false, angularDamping: 1, gravityScale: 1, friction: 0.05, restitution: 0.05, density: 3, filterGroupIndex: 0, drawLine: false }, description: "Properties applied to each spawned bullet node." };
	static PD_bulletVelocity = { path: "bulletVelocity", defaultValue: 50, min: 10, max: 120, step: 10, description: "Initial speed of spawned bullets, in meters per second." };
	static PD_bulletTrail = { path: "bulletTrail", defaultValue: true, description: "Attaches a particle trail to each bullet." };
	static PD_bulletSprite = { path: "bulletSprite", defaultValue: false, description: "Renders bullets with a bullet image instead of a plain shape." };
	static PD_soundEnabled = { path: "soundEnabled", defaultValue: true };
	static PD_cooldownMs = { path: "cooldownMs", defaultValue: 100, min: 50, max: 500, step: 10 };
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
		this.soundEnabled = TurretController.PD_soundEnabled.defaultValue;
		this.cooldownMs = TurretController.PD_cooldownMs.defaultValue;
		this.recoilEnabled = TurretController.PD_recoilEnabled.defaultValue;
		this.triggerButton = TurretController.PD_triggerButton.defaultValue;

		this.lastShotTime = 0;
		this.lastSoundTime = 0;
		this.shootSound = null;

		const bulletTextureUrl = "https://res.cloudinary.com/jeronimo/image/upload/v1784715799/Testing/bullet.png";
		physion.utils.textureFromUrl(bulletTextureUrl).then((texture) => {
			this.bulletTexture = texture;
		});

		this.graphics = physion.utils.createGraphics();
		this.node.container.addChild(this.graphics);
		this.updateGraphics();

		this.node.on("propertyChanged", this.onNodePropertyChanged);
	}

	destroy() {
		if (!this.node) {
			return;
		}

		this.graphics.clear();
		this.node.container.removeChild(this.graphics);

		this.node.off("propertyChanged", this.onNodePropertyChanged);

		if (this.shootSound) {
			Object.values(this.shootSound).forEach((n) => n.dispose());
		}
	}

	get soundEnabled() { return this._soundEnabled; }
	set soundEnabled(v) {
		this._soundEnabled = v;
		if (v && !this.shootSound) {
			this.initSound();
		}
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

		if (this.soundEnabled) {
			this.playShootSound();
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
		config.color.start = physion.utils.toHexString(bullet.fillColor);
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

	async initSound() {
		try {
			const Tone = await physion.utils.importTone();
			await Tone.start();

			const compressor = new Tone.Compressor().toDestination();
			compressor.threshold.value = -20;
			compressor.ratio.value = 8;
			compressor.attack.value = 0.001;
			compressor.release.value = 0.1;

			const crackFilter = new Tone.Filter(2000, "bandpass", -12).connect(compressor);
			const crackDistortion = new Tone.Distortion(0.8).connect(crackFilter);
			const crackSynth = new Tone.NoiseSynth().connect(crackDistortion);
			crackSynth.noise.type = "pink";
			crackSynth.envelope.attack = 0.0005;
			crackSynth.envelope.decay = 0.05;
			crackSynth.envelope.sustain = 0;
			crackSynth.envelope.release = 0.03;
			crackSynth.volume.value = -6;

			const thumpSynth = new Tone.MembraneSynth().connect(compressor);
			thumpSynth.pitchDecay = 0.025;
			thumpSynth.octaves = 3;
			thumpSynth.envelope.attack = 0.001;
			thumpSynth.envelope.decay = 0.07;
			thumpSynth.envelope.sustain = 0;
			thumpSynth.envelope.release = 0.04;
			thumpSynth.volume.value = -7;

			this.shootSound = { compressor, crackFilter, crackDistortion, crackSynth, thumpSynth };
		} catch (err) {
			console.error("TurretController: failed to initialize shoot sound", err);
		}
	}

	playShootSound() {
		if (!this.shootSound) {
			return;
		}

		const { crackFilter, crackSynth, thumpSynth } = this.shootSound;

		// When no time is passed, Tone schedules at AudioContext.currentTime, which only moves forward
		// when the audio thread ticks. Two shots can read the same value, and retriggering a still
		// sounding source at a time that is not strictly greater than the previous one throws.
		const time = Math.max(crackSynth.now(), this.lastSoundTime + 0.01);
		this.lastSoundTime = time;

		crackFilter.frequency.setValueAtTime(1600 + Math.random() * 900, time);
		crackSynth.volume.setValueAtTime(-6 + (Math.random() - 0.5) * 3, time);
		crackSynth.triggerAttackRelease(0.045, time);

		const thumpNote = 55 + Math.random() * 20;
		thumpSynth.volume.setValueAtTime(-7 + (Math.random() - 0.5) * 2, time);
		thumpSynth.triggerAttackRelease(thumpNote, 0.07, time);
	}
}
