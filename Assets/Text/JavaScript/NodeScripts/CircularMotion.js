/**
 * Moves a node continuously around a circular path.
 *
 * Parameters:
 * - radius: The radius of the circle. (default: 2)
 * - speed: How fast the node travels around the circle. (default: 0.01)
 *
 * Tip: open the script and uncomment the `fixedRotation` line in the constructor if you want the
 * node to keep a constant orientation while it orbits.
 */
class CircularMotion {

	static PD_radius = { path: "radius", defaultValue: 2, step: 0.1 };
	static PD_speed = { path: "speed", defaultValue: 0.01, step: 0.001 };

	constructor(node) {
		this.node = node;
		//this.node.fixedRotation = true;
		this.radius = CircularMotion.PD_radius.defaultValue;
		this.speed = CircularMotion.PD_speed.defaultValue;
		this.theta = 0;
	}

	update(delta) {
		this.theta += this.speed;
		this.node.linearVelocityX = this.radius * Math.sin(this.theta);
		this.node.linearVelocityY = this.radius * Math.cos(this.theta);
	}
}
