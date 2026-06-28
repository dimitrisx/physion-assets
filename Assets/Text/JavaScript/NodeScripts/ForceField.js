/**
 * Pulls or pushes every other body in the scene toward or away from this node, depending on the
 * sign of `power`: positive values attract bodies (like a localized gravity well), negative
 * values repel them. The effect is strongest up close and weakens with distance.
 *
 * Parameters:
 * - power: How strong the pull (positive) or push (negative) is. (default: 200)
 */
class ForceField {

	static PD_power = { path: "power", defaultValue: 200, step: 100 };

	constructor(node) {
		this.node = node;
		this.scene = undefined;
		this.power = ForceField.PD_power.defaultValue;
	}

	update(delta) {
		if (this.scene === undefined) {
			this.scene = this.node.findSceneNode();
		}

		if (this.scene) {
			var thisPosition = this.node.getPosition();
			var bodyNodes = this.scene.getFilteredDescendants(physion.BodyNode);
			for (const bodyNode of bodyNodes) {
				if (bodyNode.id === this.node.id) {
					continue;
				}

				var otherPosition = bodyNode.getPosition();
				var dx = thisPosition.x - otherPosition.x;
				var dy = thisPosition.y - otherPosition.y;
				var distanceSquared = Math.max(dx * dx + dy * dy, 0.01); // avoid a force spike when bodies nearly overlap
				var distance = Math.sqrt(distanceSquared);
				var forceMagnitude = this.power / distanceSquared;
				var f = { x: (dx / distance) * forceMagnitude, y: (dy / distance) * forceMagnitude };
				bodyNode.applyForce(f);
			}
		}
	}
}
