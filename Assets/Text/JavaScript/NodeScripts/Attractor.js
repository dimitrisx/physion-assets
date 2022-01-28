/**
 * Attracts all body nodes in the scene
 */
class Attractor {

	constructor(node) {
		this.node = node;
		this.scene = undefined;
		this.power = 2;
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
				var fx = (thisPosition.x - otherPosition.x) * this.power;
				var fy = (thisPosition.y - otherPosition.y) * this.power;
				var f = { x: fx, y: fy };
				bodyNode.applyForce(f);
			}
		}
	}
}
