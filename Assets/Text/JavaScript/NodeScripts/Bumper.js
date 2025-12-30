/**
 * Bumper behavior that applies impulses to colliding objects.
 * Attach this script to body nodes in the scene to convert them into bumpers.
 */
class Bumper {

	constructor(node) {
		this.node = node;
		this.impulses = new Map(); // Store BodyNode -> Impulse Direction
	}

	update(delta) {
		// Use Node's `userData` property to configure the bumper's behavior instead of directly 
		// modifying the values below.		
		const d = this.node.userData;
		const massProportional = d.bumperMassProportional || true;
		const power = d.bumperPower || 5;

		for (let [bodyNode, impulseDir] of this.impulses) {
			const mass = massProportional ? bodyNode.body.GetMass() : 1;
			const impulseMagnitude = mass * power;

			bodyNode.applyLinearImpulse({
				x: impulseDir.x * impulseMagnitude,
				y: impulseDir.y * impulseMagnitude
			});
		}
		this.impulses.clear();
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
