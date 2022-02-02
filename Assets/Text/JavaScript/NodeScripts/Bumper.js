/**
 * Applies vertical impulses to all bodies that gets in contact with 
 */
class Bumper {

	constructor(node) {
		this.node = node;
		this.inContactWith = new Set();
		this.power = 10;
	}

	update(delta) {
		for (let bodyNode of this.inContactWith) {
			bodyNode.applyLinearImpulse({ x: 0, y: this.power * bodyNode.body.GetMass() });
		}
		this.inContactWith.clear();
	}

	onBeginContact(bodyNode, contact) {
		if (contact.IsTouching()) {
			this.inContactWith.add(bodyNode);
		}
	}
}
