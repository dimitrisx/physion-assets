/**
 * Turns the body it's attached to into a bomb. When it goes off, the body is removed from the
 * scene and replaced by Voronoi fragments covering its outline, flying outwards from its center.
 *
 * The bomb can be set off by its fuse, by an impact, or by whichever comes first. The fuse only
 * burns while the simulation runs, and the bomb blinks (plus a click with sound on) faster and
 * faster as it burns down. Fragments inherit the bomb's velocity and look, and don't carry this
 * script. Any joints or springs attached to the bomb are removed when it goes off.
 *
 * With removeFragments on, once Box2D puts a fragment to sleep, it fades out over half a second
 * and is then removed. A fragment that never falls asleep is removed after 10 seconds. The bomb is
 * hidden and taken out of the simulation rather than removed, so that it can keep checking on its
 * fragments, and it removes itself once all of them are gone. With removeFragments off, the bomb
 * is removed right away and the fragments stay in the scene.
 *
 * Parameters:
 * - trigger: What sets the bomb off: its Fuse, an Impact, or Fuse or impact. Any contact counts as
 *   an impact, however gentle, and so does a laser hit. A bomb that's already touching something
 *   when the simulation starts goes off right away. (default: Fuse)
 * - fuseTime: Seconds of running simulation until the bomb goes off. (default: 3)
 * - fragmentCount: Approximate number of fragments. (default: 12)
 * - fragmentSpeed: Outward speed given to every fragment, in m/s. (default: 20)
 * - removeFragments: Fades out and removes fragments once they come to rest. (default: true)
 * - sound: Plays a ticking fuse and a synthesized explosion. (default: true)
 */
class ShatterBomb {

	static PD_trigger = {
		path: "trigger",
		defaultValue: "fuse",
		editor: "Select",
		selectOptions: [
			{ value: "fuse", label: "Fuse" },
			{ value: "impact", label: "Impact" },
			{ value: "either", label: "Fuse or impact" },
		],
		description: "What sets the bomb off.\nAny contact counts as an impact,\nand so does a laser hit.",
	};
	static PD_fuseTime = { path: "fuseTime", defaultValue: 3, min: 0, step: 0.5, description: "Seconds of running simulation until the bomb goes off." };
	static PD_fragmentCount = { path: "fragmentCount", defaultValue: 12, min: 2, step: 1, description: "Approximate number of fragments." };
	static PD_fragmentSpeed = { path: "fragmentSpeed", defaultValue: 20, min: 0, step: 1, description: "Outward speed given to every fragment, in m/s." };
	static PD_removeFragments = { path: "removeFragments", defaultValue: true, description: "Fades out and removes fragments once they come to rest.\nWhen off, fragments stay in the scene." };
	static PD_sound = { path: "sound", defaultValue: true, description: "Plays a ticking fuse and a synthesized explosion." };

	// The synths, shared by every ShatterBomb so that a crowd of bombs doesn't build dozens of them.
	// Built on first use and kept for the rest of the session.
	static sounds = undefined;
	static soundsRequested = false;

	constructor(node) {
		this.node = node instanceof physion.BodyNode ? node : undefined;
		if (!this.node) {
			console.warn("ShatterBomb can only be attached to a BodyNode");
			return;
		}

		this.trigger = ShatterBomb.PD_trigger.defaultValue;
		this.fuseTime = ShatterBomb.PD_fuseTime.defaultValue;
		this.fragmentCount = ShatterBomb.PD_fragmentCount.defaultValue;
		this.fragmentSpeed = ShatterBomb.PD_fragmentSpeed.defaultValue;
		this.removeFragments = ShatterBomb.PD_removeFragments.defaultValue;
		this.sound = ShatterBomb.PD_sound.defaultValue;

		this.elapsed = 0; // ms of fuse burnt so far
		this.struck = false; // set by an impact or a laser hit, acted on in the next update
		this.blinkPhase = 0;
		this.nextClickPhase = 0; // the blink phase at which the fuse clicks next
		this.baseAlpha = this.node.alpha;
		this.detonated = false;
		this.fragments = undefined; // set once the fragments have been added to the scene
		this.fadingFragments = new Set();

		// Load d3-delaunay ahead of time, so the explosion isn't delayed by the download.
		physion.utils.importD3Delaunay();
	}

	update(delta) {
		if (!this.node) {
			return;
		}

		if (this.fragments) {
			this.fadeSleepingFragments(delta);
			return;
		}

		// Still waiting for the Voronoi cells to be computed
		if (this.detonated) {
			return;
		}

		if (this.sound) {
			ShatterBomb.loadSounds();
		}

		const fuseLit = this.trigger !== "impact";
		if (fuseLit) {
			this.elapsed += delta;
		}

		if (this.struck || (fuseLit && this.elapsed >= this.fuseTime * 1000)) {
			this.detonated = true;
			this.node.alpha = this.baseAlpha;
			this.detonate();
		} else if (fuseLit) {
			this.blink(delta);
		}
	}

	onBeginContact(other, contact) {
		if (this.trigger !== "fuse" && contact.IsTouching()) {
			this.struck = true;
		}
	}

	onHitByLaser(laserNode, segment) {
		if (this.trigger !== "fuse") {
			this.struck = true;
		}
	}

	onSceneStopped(sceneNode) {
		// Don't leave the bomb dimmed while the simulation is paused, or saved that way.
		if (this.node && !this.detonated) {
			this.node.alpha = this.baseAlpha;
		}
	}

	// ---
	// The blink frequency ramps up from 1 Hz to 10 Hz as the fuse burns down. With sound on, the
	// fuse clicks each time the bomb is back at full brightness.
	blink(delta) {
		const minFrequency = 1; // Hz
		const maxFrequency = 10; // Hz

		const fuseTime = this.fuseTime * 1000;
		const progress = fuseTime > 0 ? this.elapsed / fuseTime : 1;
		const frequency = minFrequency + (maxFrequency - minFrequency) * progress;
		this.blinkPhase += 2 * Math.PI * frequency * (delta / 1000);
		this.node.alpha = this.baseAlpha * (0.65 + 0.35 * Math.cos(this.blinkPhase));

		if (this.blinkPhase >= this.nextClickPhase) {
			this.nextClickPhase = 2 * Math.PI * (Math.floor(this.blinkPhase / (2 * Math.PI)) + 1);
			if (this.sound) {
				ShatterBomb.playSound("tick", 0.03, (sounds, time) => {
					sounds.tick.triggerAttackRelease(2400, 0.02, time);
				});
			}
		}
	}

	async detonate() {
		const utils = physion.utils;
		const node = this.node;

		const fragmentTtl = 10000; // ms, a fallback for fragments that never fall asleep

		// The jittered grid gives cells of roughly gridStep x gridStep, so derive the step from the
		// area each fragment should cover.
		const area = Math.abs(node.getTransformedShape().area());
		const gridStep = Math.sqrt(area / Math.max(1, this.fragmentCount));

		const fragments = area > 0 ? await new utils.DelaunayHelper([node], gridStep).createVoronoiCells() : [];

		// The simulation may have been stopped, or the bomb removed, while the cells were computed.
		const parent = node.parent;
		if (!parent) {
			return;
		}

		const center = node.getScenePosition();
		const velocity = node.getLinearVelocity();
		const insertIndex = parent.childIndex(node) + 1;

		fragments.forEach((fragment) => {
			fragment.scripts = [];
			fragment.userData.isDebris = true; // marks it as harmless to any Breakable it later collides with
			fragment.bodyType = "dynamic";
			fragment.alpha = this.baseAlpha;
			fragment.ttl = this.removeFragments ? fragmentTtl : -1;
		});
		parent.insertChildren(fragments, insertIndex);

		fragments.forEach((fragment) => {
			const position = fragment.getScenePosition();
			const dx = position.x - center.x;
			const dy = position.y - center.y;
			const dist = Math.sqrt(dx * dx + dy * dy) || 1;
			fragment.setLinearVelocity({
				x: velocity.x + (dx / dist) * this.fragmentSpeed,
				y: velocity.y + (dy / dist) * this.fragmentSpeed,
			});
		});

		utils.getDependentNodes([node]).forEach((dependent) => {
			if (dependent.parent) {
				dependent.parent.removeChild(dependent);
			}
		});

		if (this.removeFragments) {
			node.alpha = 0;
			node.active = false;
			this.fragments = fragments;
		} else {
			parent.removeChild(node);
		}

		if (this.sound) {
			ShatterBomb.playSound("boom", 0.05, (sounds, time) => {
				const cutoff = sounds.rumbleFilter.frequency;
				cutoff.cancelScheduledValues(time);
				cutoff.setValueAtTime(1800, time);
				cutoff.exponentialRampToValueAtTime(100, time + 1.2);
				sounds.rumble.triggerAttackRelease(1.2, time);
				sounds.thump.triggerAttackRelease(40 + Math.random() * 15, 0.6, time);
				sounds.crack.triggerAttackRelease(0.15, time);
			});
		}
	}

	// Box2D has no sleep callback, so poll each fragment. A fragment starts fading once it falls
	// asleep, and keeps fading even if something wakes it up again. Fragments already gone (e.g.
	// their ttl expired) are just forgotten.
	fadeSleepingFragments(delta) {
		const fadeTime = 500; // ms
		const fadeStep = this.baseAlpha * delta / fadeTime;

		this.fragments = this.fragments.filter((fragment) => {
			if (!fragment.parent) {
				this.fadingFragments.delete(fragment);
				return false;
			}

			if (!this.fadingFragments.has(fragment)) {
				if (!fragment.body || fragment.body.IsAwake()) {
					return true;
				}
				this.fadingFragments.add(fragment);
			}

			fragment.alpha = Math.max(0, fragment.alpha - fadeStep);
			if (fragment.alpha === 0) {
				this.fadingFragments.delete(fragment);
				fragment.parent.removeChild(fragment);
				return false;
			}
			return true;
		});

		if (this.fragments.length === 0 && this.node.parent) {
			this.node.parent.removeChild(this.node);
		}
	}

	// ---
	static loadSounds() {
		if (ShatterBomb.soundsRequested) {
			return;
		}
		ShatterBomb.soundsRequested = true;

		ShatterBomb.createSounds()
			.then((sounds) => {
				ShatterBomb.sounds = sounds;
			})
			.catch((err) => console.error("ShatterBomb: failed to create the sounds", err));
	}

	// The same synths as ShockwaveBomb's, plus the crack of the body shattering.
	// Every synth is configured through property assignments, never an options object: scripts run
	// in their own realm, where Tone doesn't recognize an object literal as an options object.
	static async createSounds() {
		const Tone = await physion.utils.importTone();
		await Tone.start();

		const limiter = new Tone.Limiter(-3).toDestination();

		// The roar: brown noise behind a low-pass filter that closes as it dies down
		const rumbleFilter = new Tone.Filter(1800, "lowpass", -24).connect(limiter);
		const rumble = new Tone.NoiseSynth().connect(rumbleFilter);
		rumble.noise.type = "brown";
		rumble.envelope.attack = 0.005;
		rumble.envelope.decay = 1.2;
		rumble.envelope.sustain = 0;
		rumble.envelope.release = 0.3;
		rumble.volume.value = 2;

		// The thud: a deep drum hit whose pitch drops fast
		const thump = new Tone.MembraneSynth().connect(limiter);
		thump.pitchDecay = 0.08;
		thump.octaves = 4;
		thump.envelope.attack = 0.001;
		thump.envelope.decay = 0.6;
		thump.envelope.sustain = 0;
		thump.envelope.release = 0.2;
		thump.volume.value = -2;

		// The crack: a short burst of white noise with its low end cut away
		const crackFilter = new Tone.Filter(2000, "highpass", -12).connect(limiter);
		const crack = new Tone.NoiseSynth().connect(crackFilter);
		crack.noise.type = "white";
		crack.envelope.attack = 0.001;
		crack.envelope.decay = 0.15;
		crack.envelope.sustain = 0;
		crack.envelope.release = 0.05;
		crack.volume.value = -12;

		// The fuse's click
		const tick = new Tone.Synth().connect(limiter);
		tick.oscillator.type = "square";
		tick.envelope.attack = 0.001;
		tick.envelope.decay = 0.02;
		tick.envelope.sustain = 0;
		tick.envelope.release = 0.01;
		tick.volume.value = -24;

		return { rumbleFilter, rumble, thump, crack, tick, lastPlayed: {} };
	}

	// Plays a sound at most once every `minGap` seconds. Tone throws when a synth is retriggered at
	// a time that isn't strictly after the previous one, and a crowd of bombs clicking or going off
	// together sounds the same as one anyway.
	static playSound(name, minGap, play) {
		const sounds = ShatterBomb.sounds;
		if (!sounds) {
			return;
		}

		const now = sounds.tick.now();
		const last = sounds.lastPlayed[name];
		if (last !== undefined && now < last + minGap) {
			return;
		}
		sounds.lastPlayed[name] = now;
		play(sounds, now);
	}

}
