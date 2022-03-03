/**
 * Generates clones of the node attached to on regular intervals
 */
class Generator {

	constructor(node) {
		this.node = node;
		this.node.bodyType = "kinematic";
		this.node.active = false;
		this.node.alpha = 0.5;

		this.counter = 0;
		this.frequency = 180;
	}

	update(delta) {
		if (++this.counter % this.frequency === 0) {
			const clone = this.node.clone();
			clone.scripts = [];
			clone.bodyType = "dynamic";
			clone.active = true;
			clone.alpha = 1;
			this.node.parent.addChild(clone);
		}
	}
}
