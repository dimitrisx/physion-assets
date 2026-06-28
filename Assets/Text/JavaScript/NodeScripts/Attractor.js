/**
 * Pulls every other body in the scene toward this node, like a localized gravity well. The pull
 * is strongest up close and weakens the farther away a body is.
 *
 * Parameters:
 * - power: How strong the pull is. (default: 2)
 */
class Attractor {

	static PD_power = { path: "power", defaultValue: 2, min: 0, step: 0.1 };

	constructor(node) {
		this.node = node;
		this.scene = undefined;
		this.power = Attractor.PD_power.defaultValue;
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
