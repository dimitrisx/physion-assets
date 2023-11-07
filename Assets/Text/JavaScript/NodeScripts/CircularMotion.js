/**
 * Makes a Node move in a circle.
 * You can adjust the radius and speed parameters in the constructor to customize the script.
 * You can optionally uncomment the `fixedRotation` statement in the constructor to make the moving
 * Node have a fixed rotation.
 */
class CircularMotion {

	constructor(node) {
		this.node = node;
		//this.node.fixedRotation = true;
		this.radius = 2;
		this.speed = 0.01;
		this.theta = 0;
	}

	update(delta) {
		this.theta += this.speed;
		this.node.linearVelocityX = this.radius * Math.sin(this.theta);
		this.node.linearVelocityY = this.radius * Math.cos(this.theta);
	}
}
