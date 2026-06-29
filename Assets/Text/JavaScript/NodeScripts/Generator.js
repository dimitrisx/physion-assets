/**
 * Periodically spawns copies of the node it's attached to, turning that node into a repeating
 * generator/template.
 *
 * The node this script is attached to becomes inactive and semi-transparent to mark it as the
 * template; spawned copies are fully active and visible, and don't carry this script themselves.
 *
 * Parameters:
 * - frequency: How many frames to wait between each spawn. (default: 180)
 */
class Generator {

	static PD_frequency = { path: "frequency", defaultValue: 180, min: 10, step: 10 };

	constructor(node) {
		this.node = node;
		this.node.bodyType = "kinematic";
		this.node.active = false;
		this.node.alpha = 0.5;

		this.counter = 0;
		this.frequency = Generator.PD_frequency.defaultValue;
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
