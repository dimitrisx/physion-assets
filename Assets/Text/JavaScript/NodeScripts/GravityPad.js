/**
 * Reverses the gravityScale property of objects that collide with it.
 */
class GravityPad {

	constructor(node) {
		this.node = node;
		this.inContactWith = new Set();
	}

	update(delta) {
		for (let bodyNode of this.inContactWith) {
			bodyNode.gravityScale = -bodyNode.gravityScale;
		}
		this.inContactWith.clear();
	}

	onBeginContact(bodyNode, contact) {
		if (contact.IsTouching()) {
			this.inContactWith.add(bodyNode);
		}
	}
}
