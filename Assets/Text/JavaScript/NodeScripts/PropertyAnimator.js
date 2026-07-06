/**
 * Animates a property of the node attached to between startValue and endValue.
 * Attach this script to any node and set propertyName to the property you want to animate 
 * (e.g. "x", "y", "angle", "alpha").
 */
class PropertyAnimator {

	static PD_propertyName = { path: "propertyName", defaultValue: "x" };
	static PD_startValue = { path: "startValue", defaultValue: -4 };
	static PD_endValue = { path: "endValue", defaultValue: 4 };
	static PD_ease = {
		path: "ease",
		editor: "Select",
		selectOptions: [
			{ value: "linear", label: "Linear" },
			{ value: "inQuad", label: "In Quad" },
			{ value: "outQuad", label: "Out Quad" },
			{ value: "inOutQuad", label: "In Out Quad" },
			{ value: "outInQuad", label: "Out In Quad" },
			{ value: "inCubic", label: "In Cubic" },
			{ value: "outCubic", label: "Out Cubic" },
			{ value: "inOutCubic", label: "In Out Cubic" },
			{ value: "outInCubic", label: "Out In Cubic" },
			{ value: "inQuart", label: "In Quart" },
			{ value: "outQuart", label: "Out Quart" },
			{ value: "inOutQuart", label: "In Out Quart" },
			{ value: "outInQuart", label: "Out In Quart" },
			{ value: "inQuint", label: "In Quint" },
			{ value: "outQuint", label: "Out Quint" },
			{ value: "inOutQuint", label: "In Out Quint" },
			{ value: "outInQuint", label: "Out In Quint" },
			{ value: "inSine", label: "In Sine" },
			{ value: "outSine", label: "Out Sine" },
			{ value: "inOutSine", label: "In Out Sine" },
			{ value: "outInSine", label: "Out In Sine" },
			{ value: "inExpo", label: "In Expo" },
			{ value: "outExpo", label: "Out Expo" },
			{ value: "inOutExpo", label: "In Out Expo" },
			{ value: "outInExpo", label: "Out In Expo" },
			{ value: "inCirc", label: "In Circ" },
			{ value: "outCirc", label: "Out Circ" },
			{ value: "inOutCirc", label: "In Out Circ" },
			{ value: "outInCirc", label: "Out In Circ" },
			{ value: "inBack", label: "In Back" },
			{ value: "outBack", label: "Out Back" },
			{ value: "inOutBack", label: "In Out Back" },
			{ value: "outInBack", label: "Out In Back" },
			{ value: "inElastic", label: "In Elastic" },
			{ value: "outElastic", label: "Out Elastic" },
			{ value: "inOutElastic", label: "In Out Elastic" },
			{ value: "outInElastic", label: "Out In Elastic" },
			{ value: "inBounce", label: "In Bounce" },
			{ value: "outBounce", label: "Out Bounce" },
			{ value: "inOutBounce", label: "In Out Bounce" },
			{ value: "outInBounce", label: "Out In Bounce" },
			{ value: "irregular", label: "Irregular" },
		],
		defaultValue: "inOutQuad",
	};
	static PD_duration = { path: "duration", defaultValue: 3000, step: 1000 }; // 3 seconds
	static PD_loop = { path: "loop", defaultValue: true };
	static PD_loopDelay = { path: "loopDelay", defaultValue: 0, min: 0, step: 100 };
	static PD_alternate = { path: "alternate", defaultValue: true };
	static PD_reversed = { path: "reversed", defaultValue: false };

	constructor(node) {
		this.node = node;

		this._propertyName = PropertyAnimator.PD_propertyName.defaultValue;
		this._startValue = PropertyAnimator.PD_startValue.defaultValue;
		this._endValue = PropertyAnimator.PD_endValue.defaultValue;
		this._ease = PropertyAnimator.PD_ease.defaultValue;
		this._duration = PropertyAnimator.PD_duration.defaultValue;
		this._loop = PropertyAnimator.PD_loop.defaultValue;
		this._loopDelay = PropertyAnimator.PD_loopDelay.defaultValue;
		this._alternate = PropertyAnimator.PD_alternate.defaultValue;
		this._reversed = PropertyAnimator.PD_reversed.defaultValue;

		this._elapsedMs = 0;

		this.anime = null;
		this.animation = null;

		this.initialize();
	}

	async initialize() {
		this.anime = await physion.utils.importAnimeJS();
		this.updateAnimation();
	}

	get propertyName() { return this._propertyName };
	set propertyName(v) {

		const isValidProperty = v in this.node;
		if (!isValidProperty) {
			console.warn(`${v} is not a valid property of the attached Node`);
			return;
		}

		if (this._propertyName !== v) {
			this._propertyName = v;
			this.updateAnimation();
		}
	}

	get startValue() { return this._startValue };
	set startValue(v) {
		if (this._startValue !== v) {
			this._startValue = v;
			this.updateAnimation();
		}
	}

	get endValue() { return this._endValue };
	set endValue(v) {
		if (this._endValue !== v) {
			this._endValue = v;
			this.updateAnimation();
		}
	}

	get ease() { return this._ease };
	set ease(v) {
		if (this._ease !== v) {
			this._ease = v;
			this.updateAnimation();
		}
	}

	get duration() { return this._duration };
	set duration(v) {
		if (this._duration !== v) {
			this._duration = v;
			this.updateAnimation();
		}
	}

	get loop() { return this._loop };
	set loop(v) {
		if (this._loop !== v) {
			this._loop = v;
			this.updateAnimation();
		}
	}

	get loopDelay() { return this._loopDelay };
	set loopDelay(v) {
		if (this._loopDelay !== v) {
			this._loopDelay = v;
			this.updateAnimation();
		}
	}

	get alternate() { return this._alternate };
	set alternate(v) {
		if (this._alternate !== v) {
			this._alternate = v;
			this.updateAnimation();
		}
	}

	get reversed() { return this._reversed };
	set reversed(v) {
		if (this._reversed !== v) {
			this._reversed = v;
			this.updateAnimation();
		}
	}

	update(delta) {
		if (!this.animation) {
			return;
		}

		this._elapsedMs += delta;
		this.animation.seek(this._elapsedMs);
	}

	// Resets the animation to its starting point each time a simulation run begins, so that
	// every run looks the same regardless of how far the animation had progressed previously.
	onSceneStarted() {
		this._elapsedMs = 0;
		this.animation?.seek(0);
	}

	// This should be called each time an animation related property is changed
	updateAnimation() {
		if (!this.anime) {
			return;
		}

		this.animation?.pause();

		this.animation = this.anime.animate(this.node, {
			[this._propertyName]: [this._startValue, this._endValue],
			duration: this._duration,
			ease: this._ease,
			loop: this._loop,
			loopDelay: this._loopDelay,
			alternate: this._alternate,
			reversed: this._reversed,
			autoplay: false,
		});

		this._elapsedMs = 0;
		this.animation.seek(0);
	}

	destroy() {
		this.animation?.pause();
		this.animation = null;
	}
}
