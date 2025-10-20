/** Automatically removes the node from its parent after the specified duration. */
class TimeToLive {

	constructor(node) {
		this.node = node;
		this.ttl = 10 * 1000; // Time-to-live in milliseconds (adjust this as needed)
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