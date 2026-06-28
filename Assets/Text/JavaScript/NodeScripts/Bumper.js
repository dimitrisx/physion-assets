/**
 * Turns a body into a bumper that bounces other bodies away on contact, like in pinball.
 *
 * Parameters:
 * - power: How strong the bounce is. (default: 5)
 * - massProportional: Whether heavier bodies get bounced away with more force. (default: true)
 * - dimOnContact: When enabled, the bumper's alpha drops to 0.5 on contact, then gradually
 *   fades back to full opacity while no contacts are pending. (default: false)
 */
class Bumper {

	static PD_power = { path: "power", defaultValue: 5, min: 0, step: 1 };
	static PD_massProportional = { path: "massProportional", defaultValue: true };
	static PD_dimOnContact = { path: "dimOnContact", defaultValue: false };

	constructor(node) {
		this.node = node;
		this.power = Bumper.PD_power.defaultValue;
		this.massProportional = Bumper.PD_massProportional.defaultValue;
		this.dimOnContact = Bumper.PD_dimOnContact.defaultValue;
		this.impulses = new Map(); // Store BodyNode -> Impulse Direction
	}

	update(delta) {
		const hasContact = this.impulses.size > 0;

		for (let [bodyNode, impulseDir] of this.impulses) {
			const mass = this.massProportional ? bodyNode.body.GetMass() : 1;
			const impulseMagnitude = mass * this.power;

			bodyNode.applyLinearImpulse({
				x: impulseDir.x * impulseMagnitude,
				y: impulseDir.y * impulseMagnitude
			});
		}
		this.impulses.clear();

		if (this.dimOnContact) {
			if (hasContact) {
				this.node.alpha = 0.5;
			} else if (this.node.alpha < 1) {
				this.node.alpha = Math.min(1, this.node.alpha + 0.05);
			}
		}
	}

	onBeginContact(bodyNode, contact) {
		if (contact.IsTouching()) {
			const worldManifold = physion.utils.getContactWorldManifold(contact);
			const worldNormal = worldManifold.normal;

			let direction = { x: worldNormal.x, y: worldNormal.y };

			if (contact.GetFixtureB().GetBody() === this.node.body) {
				// Bumper is fixture B, reverse the normal
				direction.x = -direction.x;
				direction.y = -direction.y;
			}

			this.impulses.set(bodyNode, direction);
		}
	}
}
