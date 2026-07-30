
class Breakable {

	static PD_impactThreshold = { path: "impactThreshold", defaultValue: 5, min: 1, step: 1 };
	static PD_debrisProps = { path: "debrisProps", defaultValue: { ttl: 1000, bullet: true, filterGroupIndex: 0, } };

	constructor(node) {
		this.node = node instanceof physion.BodyNode ? node : undefined;
		if (!this.node) {
			console.warn("Breakable can only be attached to a BodyNode");
			return;
		}

		this.impactThreshold = Breakable.PD_impactThreshold.defaultValue;
		this.debrisProps = Breakable.PD_debrisProps.defaultValue;

		this.pendingBreak = undefined;
	}

	onPostSolve(other, contact, impulse) {
		if (!this.isBulletLike(other)) {
			return;
		}

		const severity = this.calculateSeverity(impulse);
		if (severity < this.impactThreshold) {
			return;
		}

		if (!this.pendingBreak || severity > this.pendingBreak.severity) {
			const manifold = physion.utils.getContactWorldManifold(contact);
			this.pendingBreak = { severity, point: manifold.points[0] };
		}
	}

	update(delta) {
		if (this.pendingBreak) {
			const { point, severity } = this.pendingBreak;
			this.pendingBreak = undefined;
			this.breakAt(point, severity);
		}
	}

	// ---
	// Only bodies with "bullet" characteristics (dynamic and fast-moving) can break this node,
	// so a slow/heavy landing (e.g. settling on the ground) doesn't count, no matter how large
	// the resulting contact impulse is.
	isBulletLike(other) {
		if (other.userData.isDebris) {
			return false;
		}

		if (other.bodyType !== "dynamic") {
			return false;
		}

		const minBulletSpeed = 25; // m/s
		return other.linearVelocity >= minBulletSpeed;
	}

	calculateSeverity(impulse) {
		const { normalImpulses } = physion.utils.getContactImpulse(impulse);
		const severity = normalImpulses.reduce((sum, v) => sum + v, 0);
		return severity;
	}

	breakAt(worldPoint, severity) {
		const utils = physion.utils;

		const maxBiteRadius = 0.5; // meters
		const biteRadiusPerImpulse = 0.1;

		const circleSides = 8;
		const kerf = 0.05;

		const circleShape = (radius) => utils.flattenPolygonFromCircle(worldPoint.x, worldPoint.y, radius, circleSides);

		// Calculate the bite radius
		const excess = severity - this.impactThreshold;
		const biteRadius = Math.min(maxBiteRadius, biteRadiusPerImpulse * excess);
		if (biteRadius <= 0) {
			return;
		}

		const nodeShape = this.node.getTransformedShape();
		const remainderShape = utils.BooleanOperationHelper.getResultShape([nodeShape, circleShape(biteRadius + kerf)], "Difference");
		const fragmentShape = utils.BooleanOperationHelper.getResultShape([nodeShape, circleShape(biteRadius)], "Intersection");

		if (remainderShape && fragmentShape) {
			this.spawnFragment(fragmentShape, worldPoint, excess);
			this.applyRemainder(remainderShape);
		}
	}

	applyRemainder(remainderShape) {
		const utils = physion.utils;
		const islands = remainderShape.splitToIslands();

		if (islands.length === 1 && this.node instanceof physion.PolygonNode) {
			const cleaned = utils.PolygonHelper.processPolygons(
				utils.flattenPolygonToPolygons(islands[0]).map((pts) => pts.map((p) => this.node.toLocal(p))),
				{ round: true, clean: true, translateToOrigin: false }
			).polygons;
			this.node.polygons = cleaned;
			return;
		}

		const created = islands.map(island => physion.utils.BooleanCommon.createResultNode(island, this.node));

		const parent = this.node.parent;
		const insertIndex = parent.childIndex(this.node);
		parent.insertChildren(created, insertIndex); 

		// Re-anchor any joints/springs/tracers pointing at this.node onto whichever new piece they land
		// on. recreateDependents() only builds the remapped clones (appending them to `created`) - we
		// still need to insert those clones and remove the old dependents ourselves.
		const oldDependents = utils.getDependentNodes([this.node]);
		const pieceCount = created.length;
		utils.BooleanOperationHelper.recreateDependents([this.node], created);
		created.slice(pieceCount).forEach((clone) => parent.insertChild(clone, parent.childIndex(created[pieceCount - 1]) + 1));
		oldDependents.forEach((dependent) => {
			if (dependent.parent) {
				dependent.parent.removeChild(dependent);
			}
		});

		parent.removeChild(this.node);		
	}

	spawnFragment(fragmentShape, worldPoint, excess) {
		const utils = physion.utils;
		const fragment = physion.utils.BooleanCommon.createResultNode(fragmentShape, this.node);
		fragment.userData.isDebris = true; // marks it as harmless to any Breakable it later collides with
		fragment.scripts = [];
		fragment.bodyType = "dynamic";
		Object.assign(fragment, this.debrisProps);

		const parent = this.node.parent;
		parent.insertChild(fragment, parent.childIndex(this.node) + 1);

		const center = fragment.getScenePosition();
		const dx = worldPoint.x - center.x;
		const dy = worldPoint.y - center.y;
		const dist = Math.sqrt(dx * dx + dy * dy) || 1;
		const ejectionImpulsePerImpulse = 0.5;
		const magnitude = ejectionImpulsePerImpulse * excess;
		fragment.applyLinearImpulse({ x: (dx / dist) * magnitude, y: (dy / dist) * magnitude });
	}

}