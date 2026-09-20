/**
 * Turns a dynamic body into a chaser that hunts a target node by name. While the target is within
 * range and in sight the chaser lights up with a glow and accelerates straight at it, and can be
 * made to freeze for a moment each time it touches the target, giving the target a chance to get
 * away. When it loses sight it heads to the spot where the target was last seen for a while, then
 * gives up. With nothing to chase it either stands still or wanders around. Whisker raycasts steer
 * it around static walls, so it slides along obstacles instead of pinning itself against them.
 * There is no real path planning yet, so a chaser can still be fooled by a dead end.
 *
 * Parameters:
 * - targetName: The name of the node to chase. Leave empty to disable chasing, so only the idle
 *   behavior runs. (default: "")
 * - maxForce: How strongly the chaser accelerates, scaled by its mass. (default: 10)
 * - maxSpeed: The hard cap on the chaser's speed while chasing, in meters per second. (default: 3)
 * - detectionRange: The target is only noticed within this distance, in meters. 0 = unlimited.
 *   (default: 10)
 * - requireLineOfSight: Only chase when no static or kinematic body blocks the view of the target.
 *   Other dynamic bodies (a crowd of chasers, loose crates) don't block the view. (default: true)
 * - memoryMs: After losing sight of the target, keep heading to its last seen position for this
 *   long, in milliseconds. (default: 3000)
 * - stopDistance: Stop pushing when this close to the target, in meters. 0 = push until contact.
 *   (default: 0)
 * - pauseOnHitMs: After touching the target, stand still for this long, in milliseconds, before
 *   chasing again. Still touching the target when the time is up starts another pause. 0 = don't
 *   pause. (default: 0)
 * - avoidObstacles: Cast whisker rays ahead and steer around static geometry. (default: true)
 * - idleBehavior: What to do with no target in sight and nothing remembered, Stand Still or Wander.
 *   (default: "Stand Still")
 * - wanderSpeed: The speed cap while wandering, in meters per second. (default: 1)
 * - faceHeading: Rotate the node to face the direction it is moving in. (default: false)
 * - alertGlow: Add a glow filter in the node's fill color while it chases the target and remove
 *   it again otherwise. The node's other visual filters are left alone. (default: true)
 * - deceleration: Fraction of velocity kept each tick while standing still. Lower values stop
 *   faster. (default: 0.95)
 * - debugDraw: Draws the whiskers, the line of sight and the current goal: yellow while chasing,
 *   magenta while searching, blue while paused after a hit. (default: false)
 *
 * Requirements: Must be attached to a dynamic body node. Meant for top-down scenes: set the scene's
 * gravity (or the body's gravityScale) to 0 so the chaser isn't pulled off course.
 */
class Chaser {

	static PD_targetName = { path: "targetName", defaultValue: "", description: "Name of the node to chase.\nLeave empty to disable chasing." };
	static PD_maxForce = { path: "maxForce", defaultValue: 10, min: 0, step: 1, description: "Acceleration force, scaled by the body's mass." };
	static PD_maxSpeed = { path: "maxSpeed", defaultValue: 3, min: 0, step: 0.5, description: "Speed cap while chasing, in meters per second." };
	static PD_detectionRange = { path: "detectionRange", defaultValue: 10, min: 0, step: 1, description: "The target is only noticed within this distance.\n0 = unlimited." };
	static PD_requireLineOfSight = { path: "requireLineOfSight", defaultValue: true, description: "Only chase when no static body blocks the view of the target." };
	static PD_memoryMs = { path: "memoryMs", defaultValue: 3000, min: 0, step: 500, description: "How long the last seen position is remembered after losing sight, in milliseconds." };
	static PD_stopDistance = { path: "stopDistance", defaultValue: 0, min: 0, step: 0.1, description: "Stop pushing when this close to the target.\n0 = push until contact." };
	static PD_pauseOnHitMs = { path: "pauseOnHitMs", defaultValue: 0, min: 0, step: 100, description: "How long to stand still after touching the target, in milliseconds.\n0 = don't pause." };
	static PD_avoidObstacles = { path: "avoidObstacles", defaultValue: true, description: "Steer around static geometry using whisker raycasts." };
	static PD_idleBehavior = {
		path: "idleBehavior",
		defaultValue: "stand",
		editor: "Select",
		selectOptions: [
			{ value: "stand", label: "Stand Still" },
			{ value: "wander", label: "Wander" },
		],
	};
	static PD_wanderSpeed = { path: "wanderSpeed", defaultValue: 1, min: 0, step: 0.5, description: "Speed cap while wandering, in meters per second." };
	static PD_faceHeading = { path: "faceHeading", defaultValue: false, description: "Rotate the node to face its direction of movement." };
	static PD_alertGlow = { path: "alertGlow", defaultValue: true, description: "Glow in the node's fill color while chasing the target." };
	static PD_deceleration = { path: "deceleration", defaultValue: 0.95, min: 0, max: 1, step: 0.01, description: "Fraction of velocity kept each tick while standing still.\nLower = stops faster." };
	static PD_debugDraw = { path: "debugDraw", defaultValue: false, description: "Draw the whiskers, the line of sight and the current goal." };

	// Tuning constants (not exposed as parameters)
	static DEAD_ZONE = 0.05; // Speed (m/s) below which braking snaps the body to a full stop
	static LOOKUP_INTERVAL_MS = 500; // How often an unresolved target name is searched for in the scene
	static PERCEPTION_INTERVAL_MS = 100; // How often range and line of sight are re-checked
	static MAX_SEE_THROUGH = 4; // How many dynamic bystanders the line of sight may look past
	static RAY_SKIP = 0.01; // Distance (m) to step past a bystander before re-casting
	static WHISKER_ANGLE = Math.PI * 35 / 180; // Angle of the side whiskers, either side of the heading
	static WHISKER_LENGTH_FACTOR = 3; // Whisker length relative to the body's size
	static WHISKER_MIN_LENGTH = 0.6; // Whisker length (m) for very small bodies
	static HEAD_ON_THRESHOLD = 0.3; // Below this much of the heading left after sliding, the wall counts as head-on
	static WALL_PUSH = 0.5; // How hard a nearby wall pushes the heading away from it
	static BLOCKED_FRACTION = 0.5; // A forward whisker hit closer than this fraction of its length counts as blocked
	static WANDER_MIN_MS = 1500; // Min time between random heading changes while wandering
	static WANDER_MAX_MS = 3000; // Max time between random heading changes while wandering
	static B2_DYNAMIC = 2; // Box2D b2_dynamicBody

	constructor(node) {
		this.node = node instanceof physion.BodyNode ? node : undefined; // Check if the node is a BodyNode
		if (!this.node) {
			console.warn("Chaser can only be attached to a BodyNode");
			return;
		}

		this._targetName = Chaser.PD_targetName.defaultValue;
		this.maxForce = Chaser.PD_maxForce.defaultValue;
		this.maxSpeed = Chaser.PD_maxSpeed.defaultValue;
		this.detectionRange = Chaser.PD_detectionRange.defaultValue;
		this.requireLineOfSight = Chaser.PD_requireLineOfSight.defaultValue;
		this.memoryMs = Chaser.PD_memoryMs.defaultValue;
		this.stopDistance = Chaser.PD_stopDistance.defaultValue;
		this.pauseOnHitMs = Chaser.PD_pauseOnHitMs.defaultValue;
		this.avoidObstacles = Chaser.PD_avoidObstacles.defaultValue;
		this.idleBehavior = Chaser.PD_idleBehavior.defaultValue;
		this.wanderSpeed = Chaser.PD_wanderSpeed.defaultValue;
		this.faceHeading = Chaser.PD_faceHeading.defaultValue;
		this.alertGlow = Chaser.PD_alertGlow.defaultValue;
		this.deceleration = Chaser.PD_deceleration.defaultValue;
		this.debugDraw = Chaser.PD_debugDraw.defaultValue;

		// Simulation time in ms, accumulated from update() rather than read from the clock, so that
		// pausing the scene doesn't age memories or timers.
		this.time = 0;

		this.target = undefined; // The resolved target node, looked up by name
		this.nextLookupTime = 0;
		this.nextPerceptionTime = 0;
		this.visible = false; // Result of the last perception check

		this.state = "idle"; // "idle" | "chase" | "search"; a pause after a hit overrides all three, see paused
		this.lastSeenPosition = undefined; // Scene position where the target was last seen
		this.lastSeenTime = 0;

		this.targetContacts = 0; // Live contacts with the target's body, kept up to date by the contact callbacks
		this.pauseEndTime = 0; // Simulation time at which the current pause after a hit ends

		this.wanderHeading = 0; // Radians
		this.nextWanderTime = 0;
		this.avoidSide = 0; // +1 / -1 while sliding along a head-on wall, 0 otherwise

		this.glowColor = undefined; // Color of the glow currently on the node, undefined while there is none

		this.raycaster = new physion.utils.LaserRaycaster();
		this.debugRays = []; // Rays cast this tick, drawn when debugDraw is on
		this.graphics = undefined;
	}

	destroy() {
		this.removeDebugGraphics();
		if (this.glowColor !== undefined && !this.node.isDestroyed()) {
			this.setGlow(undefined);
		}
	}

	// Parameters are assigned directly onto the running instance (the constructor doesn't re-run),
	// so targetName is a getter/setter that drops the cached target when it's changed from the
	// Scripts Editor.
	get targetName() {
		return this._targetName;
	}

	set targetName(value) {
		if (this._targetName !== value) {
			this._targetName = value;
			this.dropTarget();
			this.nextLookupTime = 0;
			this.pauseEndTime = 0;
			this.forget();
		}
	}

	/** The larger side of the body's bounding rect, used to scale whiskers and arrival checks. */
	get bodySize() {
		const rect = this.node.getBoundingRect();
		return Math.max(rect.width, rect.height);
	}

	get whiskerLength() {
		return Math.max(this.bodySize * Chaser.WHISKER_LENGTH_FACTOR, Chaser.WHISKER_MIN_LENGTH);
	}

	get arriveDistance() {
		return Math.max(this.bodySize, 0.2);
	}

	update(delta) {
		if (this.node?.bodyType !== "dynamic") {
			return;
		}

		const scene = this.node.findSceneNode();
		if (!scene) {
			return;
		}

		this.time += delta;
		this.debugRays.length = 0;

		const target = this.resolveTarget(scene);
		const position = this.node.getScenePosition();

		this.updateState(target, position, scene);
		this.updatePause();
		this.updateGlow();

		if (this.paused) {
			this.brake();
		} else {
			switch (this.state) {
				case "chase":
					this.chase(scene, target, position);
					break;
				case "search":
					this.moveToward(scene, position, this.lastSeenPosition, this.maxSpeed);
					break;
				default:
					this.idle(scene, position);
			}
		}

		if (this.faceHeading) {
			this.faceVelocity();
		}

		this.updateDebugGraphics(position);
	}

	// === Target and perception ===

	resolveTarget(scene) {
		if (!this._targetName) {
			this.dropTarget();
		} else if (!this.target || this.target.findSceneNode() !== scene) {
			// The target is missing or has left the scene. Look it up again, but not every tick:
			// getDescendants() walks the whole scene.
			this.dropTarget();
			if (this.time >= this.nextLookupTime) {
				this.nextLookupTime = this.time + Chaser.LOOKUP_INTERVAL_MS;
				this.target = scene.getDescendants().find((n) => n !== this.node && n.name === this._targetName);
			}
		}
		return this.target;
	}

	updateState(target, position, scene) {
		if (!target) {
			this.visible = false;
		} else if (this.time >= this.nextPerceptionTime) {
			this.nextPerceptionTime = this.time + Chaser.PERCEPTION_INTERVAL_MS;
			this.visible = this.canSee(scene, target, position);
		}

		if (this.visible) {
			this.state = "chase";
			this.lastSeenPosition = target.getScenePosition();
			this.lastSeenTime = this.time;
		} else if (this.lastSeenPosition && this.time - this.lastSeenTime < this.memoryMs) {
			this.state = "search";
			if (physion.utils.calculateDistance(position, this.lastSeenPosition) <= this.arriveDistance) {
				this.forget(); // Reached the last seen position and the target isn't there
			}
		} else {
			this.forget();
		}
	}

	forget() {
		this.lastSeenPosition = undefined;
		this.state = "idle";
	}

	dropTarget() {
		this.target = undefined;
		this.targetContacts = 0; // Any contacts were with the old target
	}

	canSee(scene, target, position) {
		const targetPosition = target.getScenePosition();
		const distance = physion.utils.calculateDistance(position, targetPosition);

		if (this.detectionRange > 0 && distance > this.detectionRange) {
			return false;
		}

		if (!this.requireLineOfSight) {
			return true;
		}

		return this.hasLineOfSight(scene, target, position, targetPosition, distance);
	}

	/**
	 * Casts a ray toward the target. Static and kinematic bodies block the view; dynamic bodies that
	 * aren't the target are looked past by re-casting from just beyond them, a few times at most.
	 */
	hasLineOfSight(scene, target, from, to, distance) {
		const angle = physion.utils.calculateAngle(from, to);
		let origin = from;
		let remaining = distance;

		for (let i = 0; i <= Chaser.MAX_SEE_THROUGH; i++) {
			const hit = this.castRay(scene, origin, angle, remaining);
			if (!hit) {
				return true;
			}

			const body = hit.fixture.GetBody();
			if (body === target.body) {
				return true;
			}
			if (body.GetType() !== Chaser.B2_DYNAMIC) {
				return false;
			}

			// A dynamic bystander: step past its near surface and keep looking. A ray that starts
			// inside a shape isn't reported by Box2D, so the next hit is whatever lies beyond it.
			remaining -= physion.utils.calculateDistance(origin, hit.point) + Chaser.RAY_SKIP;
			if (remaining <= 0) {
				return true; // The bystander overlaps the target itself
			}
			origin = {
				x: hit.point.x + Math.cos(angle) * Chaser.RAY_SKIP,
				y: hit.point.y + Math.sin(angle) * Chaser.RAY_SKIP,
			};
		}

		return false;
	}

	/**
	 * Casts a single ray from origin and returns the nearest hit (point, normal, fraction, fixture),
	 * or undefined when nothing was hit. Sensors and this node's own body are ignored.
	 */
	castRay(scene, origin, angle, maxDistance) {
		if (maxDistance <= 0) {
			return undefined;
		}

		const options = { maxDistance, maxBounces: 0, ignoreBody: this.node.body };
		const segment = this.raycaster.castLaser(scene.physicsWorld, origin, angle, options)[0];
		const hit = segment?.result.hit ? segment.result : undefined;

		if (this.debugDraw && segment) {
			this.debugRays.push({ p1: segment.p1, p2: segment.p2, hit: !!hit });
		}

		return hit;
	}

	// === Pause after a hit ===

	get paused() {
		return this.pauseOnHitMs > 0 && this.time < this.pauseEndTime;
	}

	/**
	 * Touching the target while not paused starts a pause, whether the contact is fresh or has been
	 * going on since the previous pause ran out. A target that stays put therefore keeps the chaser
	 * parked next to it, while one that gets away is chased again as soon as the time is up.
	 * Perception keeps running during a pause, so the last seen position is fresh when it ends.
	 */
	updatePause() {
		if (this.pauseOnHitMs > 0 && !this.paused && this.targetContacts > 0) {
			this.pauseEndTime = this.time + this.pauseOnHitMs;
		}
	}

	// The callbacks fire once per Box2D contact (a pair of fixtures), so a target with several
	// fixtures can touch through more than one at a time. Counting them, rather than keeping a flag,
	// means the chaser only counts as no longer touching when the last one ends.
	onBeginContact(other, contact) {
		if (other === this.target && contact.IsTouching()) {
			this.targetContacts++;
		}
	}

	onEndContact(other, contact) {
		if (other === this.target && this.targetContacts > 0) {
			this.targetContacts--;
		}
	}

	// === Alert glow ===

	/**
	 * Keeps the node's glow filter in step with the state: on, in the node's fill color, while
	 * chasing (a pause after a hit included, the target is still in sight) and off otherwise. Only
	 * applied when something changed, since setting visualFilters rebuilds the node's filters.
	 */
	updateGlow() {
		const wanted = this.alertGlow && this.state === "chase" ? this.node.fillColor : undefined;
		if (wanted !== this.glowColor) {
			this.glowColor = wanted;
			this.setGlow(wanted);
		}
	}

	/**
	 * Replaces the "glow" entry of the node's visualFilters, or removes it when color is undefined.
	 * The other entries are kept as they are, so a blur or tint authored on the node survives.
	 */
	setGlow(color) {
		const filters = { ...this.node.visualFilters };
		delete filters.glow;
		if (color !== undefined) {
			filters.glow = { enabled: true, options: { color } };
		}
		this.node.visualFilters = filters;
	}

	// === Behaviors ===

	chase(scene, target, position) {
		const targetPosition = target.getScenePosition();

		if (this.stopDistance > 0 && physion.utils.calculateDistance(position, targetPosition) <= this.stopDistance) {
			this.brake();
			return;
		}

		this.moveToward(scene, position, targetPosition, this.maxSpeed);
	}

	idle(scene, position) {
		if (this.idleBehavior === "wander") {
			this.wander(scene, position);
		} else {
			this.brake();
		}
	}

	wander(scene, position) {
		if (this.time >= this.nextWanderTime) {
			this.pickWanderHeading(this.wanderHeading + physion.utils.randomNumber(-Math.PI, Math.PI));
		}

		let direction = { x: Math.cos(this.wanderHeading), y: Math.sin(this.wanderHeading) };

		if (this.avoidObstacles) {
			const steered = this.steer(scene, position, direction);
			direction = steered.direction;

			// Walking into a wall: turn to face away from it (plus some randomness) instead of sliding
			// along it forever.
			const blocked = steered.forwardHit && steered.forwardHit.fraction < Chaser.BLOCKED_FRACTION;
			if (blocked) {
				const away = Math.atan2(steered.forwardHit.normal.y, steered.forwardHit.normal.x);
				this.pickWanderHeading(away + physion.utils.randomNumber(-Math.PI / 3, Math.PI / 3));
			}
		}

		this.push(direction, this.wanderSpeed);
	}

	pickWanderHeading(heading) {
		this.wanderHeading = heading;
		this.nextWanderTime = this.time + physion.utils.randomNumber(Chaser.WANDER_MIN_MS, Chaser.WANDER_MAX_MS);
	}

	// === Steering and movement ===

	moveToward(scene, position, goal, speedCap) {
		const direction = physion.utils.getDirectionVector(position, goal);
		if (!direction) {
			this.brake(); // Already there
			return;
		}

		const steered = this.avoidObstacles ? this.steer(scene, position, direction).direction : direction;
		this.push(steered, speedCap);
	}

	/**
	 * Bends the desired direction around nearby static geometry using three whiskers (ahead and to
	 * either side). A wall ahead has the part of the direction that heads into it stripped, so the
	 * chaser slides along the wall. A wall hit head-on leaves nothing to slide with, so a side is
	 * picked (the clearer one) and the chaser follows the wall's tangent that way until the way
	 * ahead is clear again. Committing to the side matters: as the chaser moves along the wall the
	 * direction to the goal swings, and re-deciding every tick would make it oscillate in front of
	 * the wall. Every nearby wall also pushes the heading away in proportion to how close it is.
	 */
	steer(scene, position, direction) {
		const length = this.whiskerLength;
		const heading = Math.atan2(direction.y, direction.x);

		const forward = this.castWhisker(scene, position, heading, length);
		const left = this.castWhisker(scene, position, heading + Chaser.WHISKER_ANGLE, length);
		const right = this.castWhisker(scene, position, heading - Chaser.WHISKER_ANGLE, length);

		let x = direction.x;
		let y = direction.y;

		if (forward) {
			const n = forward.normal;

			// Slide: strip the part of the desired direction that heads into the wall
			const into = x * n.x + y * n.y;
			if (into < 0) {
				x -= into * n.x;
				y -= into * n.y;
			}

			if (this.avoidSide !== 0 || Math.hypot(x, y) < Chaser.HEAD_ON_THRESHOLD) {
				if (this.avoidSide === 0) {
					const leftClearance = left ? left.fraction : 1;
					const rightClearance = right ? right.fraction : 1;
					this.avoidSide = leftClearance >= rightClearance ? 1 : -1;
				}

				const tangent = this.wallTangent(n, direction, this.avoidSide);

				// A wall on that side as well (a corner): switch sides
				const side = this.castWhisker(scene, position, Math.atan2(tangent.y, tangent.x), length);
				if (side && side.fraction < Chaser.BLOCKED_FRACTION) {
					this.avoidSide = -this.avoidSide;
					tangent.x = -tangent.x;
					tangent.y = -tangent.y;
				}

				x = tangent.x;
				y = tangent.y;
			}
		} else {
			this.avoidSide = 0;
		}

		// Ease off nearby walls in proportion to how close they are
		for (const hit of [forward, left, right]) {
			if (hit) {
				const push = (1 - hit.fraction) * Chaser.WALL_PUSH;
				x += hit.normal.x * push;
				y += hit.normal.y * push;
			}
		}

		const m = Math.hypot(x, y);
		const steered = m > 0 ? { x: x / m, y: y / m } : direction;
		return { direction: steered, forwardHit: forward };
	}

	/**
	 * Returns the wall's tangent (perpendicular to its normal) that points to the given side of the
	 * heading: +1 for the left, -1 for the right.
	 */
	wallTangent(normal, direction, side) {
		const tangent = { x: -normal.y, y: normal.x };
		const leftOfHeading = -direction.y * tangent.x + direction.x * tangent.y; // tangent . leftPerp(direction)
		const sign = (leftOfHeading >= 0 ? 1 : -1) * side;
		return { x: tangent.x * sign, y: tangent.y * sign };
	}

	/** Casts a whisker that only "sees" static and kinematic bodies; dynamic ones are ignored. */
	castWhisker(scene, origin, angle, length) {
		const hit = this.castRay(scene, origin, angle, length);
		return hit && hit.fixture.GetBody().GetType() !== Chaser.B2_DYNAMIC ? hit : undefined;
	}

	push(direction, speedCap) {
		const force = this.maxForce * this.node.mass;
		this.node.applyForce({ x: direction.x * force, y: direction.y * force });
		this.capSpeed(speedCap);
	}

	capSpeed(max) {
		const v = this.node.getLinearVelocity();
		const speed = Math.hypot(v.x, v.y);
		if (speed > max) {
			const k = max / speed;
			this.node.setLinearVelocity({ x: v.x * k, y: v.y * k });
		}
	}

	brake() {
		const v = this.node.getLinearVelocity();
		const speed = Math.hypot(v.x, v.y);
		if (speed < Chaser.DEAD_ZONE) {
			this.node.setLinearVelocity({ x: 0, y: 0 });
		} else {
			this.node.setLinearVelocity({ x: v.x * this.deceleration, y: v.y * this.deceleration });
		}
	}

	faceVelocity() {
		const v = this.node.getLinearVelocity();
		if (Math.hypot(v.x, v.y) > Chaser.DEAD_ZONE) {
			this.node.angle = physion.utils.radToDeg(Math.atan2(v.y, v.x));
		}
	}

	// === Debug drawing ===

	updateDebugGraphics(position) {
		if (!this.debugDraw) {
			this.removeDebugGraphics();
			return;
		}

		if (!this.graphics) {
			this.graphics = physion.utils.createGraphics();
			this.node.container.addChild(this.graphics);
		}

		const g = this.graphics;
		const lineWidth = Math.max(this.bodySize * 0.05, 0.01);
		g.clear();

		for (const ray of this.debugRays) {
			const p1 = this.node.toLocal(ray.p1);
			const p2 = this.node.toLocal(ray.p2);
			g.lineStyle(lineWidth, ray.hit ? 0xff4040 : 0x40ff40, 0.9);
			g.moveTo(p1.x, p1.y);
			g.lineTo(p2.x, p2.y);
		}

		const goal = this.state === "chase" && this.target
			? this.target.getScenePosition()
			: this.state === "search" ? this.lastSeenPosition : undefined;

		if (goal) {
			const p = this.node.toLocal(goal);
			const radius = Math.max(this.bodySize * 0.25, 0.05);
			g.lineStyle(lineWidth, this.paused ? 0x40c0ff : this.state === "chase" ? 0xffff40 : 0xff40ff, 0.9);
			g.drawCircle(p.x, p.y, radius);
			const origin = this.node.toLocal(position);
			g.moveTo(origin.x, origin.y);
			g.lineTo(p.x, p.y);
		}
	}

	removeDebugGraphics() {
		if (this.graphics) {
			this.graphics.clear();
			this.node.container.removeChild(this.graphics);
			this.graphics = undefined;
		}
	}
}
