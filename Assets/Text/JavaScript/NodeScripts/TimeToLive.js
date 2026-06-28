/**
 * Automatically removes the node from the scene after a set amount of time.
 *
 * Parameters:
 * - ttl: How long the node stays in the scene before being removed, in milliseconds.
 *   (default: 10000)
 */
class TimeToLive {

	static PD_ttl = { path: "ttl", defaultValue: 10 * 1000, min: 100, step: 100 }; // Time-to-live in milliseconds

	constructor(node) {
		this.node = node;
		this.ttl = TimeToLive.PD_ttl.defaultValue;
		this.removed = false;
	}

	update(delta) {
		if (this.removed) {
			return;
		}

		if (this.ttl > 0) {
			this.ttl -= delta;
			return;
		}

		if (this.node.parent) {
			this.node.parent.removeChild(this.node);
			this.removed = true;
		}
	}
}
