/**
 * Destroys BodyNodes that get in contact with it
 */
 class Destroyer {

	constructor(node) {
		this.node = node;
		this.destroyQueue = new Set();
	}

	update(delta) {
		for (let bodyNode of this.destroyQueue) {
			if (bodyNode.alpha > 0) {
				bodyNode.alpha -= 0.01;
			} else {
				if (bodyNode.parent) {
					bodyNode.parent.removeChild(bodyNode);
					this.destroyQueue.delete(bodyNode);
				}
			}
		}
	}

	onBeginContact(bodyNode, contact) {
		if (contact.IsTouching()) {
			this.destroyQueue.add(bodyNode);
		}
	}
}
