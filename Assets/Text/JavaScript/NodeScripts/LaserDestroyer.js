/**
 * Destroys the bodies (and particle groups) that the laser beam hits. By default anything the beam
 * touches is removed; a userData filter narrows it down to specific nodes.
 *
 * Parameters:
 * - userDataFilter: Only destroy nodes whose userData contains all of these key/value pairs, for
 *   example { "enemy": true } destroys only the nodes that have userData.enemy set to true. Values
 *   are compared strictly (===). An empty object destroys everything the beam hits. (default: {})
 *
 * Requirements: Must be attached to a LaserNode. Set userData on the target nodes in their
 * property editor, e.g. { "enemy": true }.
 */
class LaserDestroyer {

	static PD_userDataFilter = { path: "userDataFilter", defaultValue: {}, description: "Only destroy nodes whose userData contains these key/value pairs, e.g. { \"enemy\": true }.\n{} = destroy everything." };

	constructor(node) {
		this.node = node instanceof physion.LaserNode ? node : undefined;
		if (!this.node) {
			console.warn("LaserDestroyer can only be attached to a LaserNode");
			return;
		}

		this.userDataFilter = LaserDestroyer.PD_userDataFilter.defaultValue;
	}

	onLaserHit(node, segment) {
		const filter = this.userDataFilter;
		const matches = Object.keys(filter).every((key) => node.userData[key] === filter[key]);
		if (matches) {
			node.ttl = 0;
		}
	}
}
