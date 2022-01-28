/**
 * Script to trace and draw the trajectory of a Node
 */
 class Tracer {

	constructor(node) {
		this.node = node;
		this.initialized = false;

		this.trajectory = [];
		this.maxTrajectorySize = 100;

		if (typeof physion !== "undefined") {
			this.graphics = physion?.utils.createGraphics();
			this.lineStyle = physion?.utils.createLineStyle(0);
			this.fillStyle = physion?.utils.createFillStyle(0xff0000);	
		}

		this.tracerRadius = 0.1;
	}

	update(delta) {
		if (!this.initialized) {
			this.initialized = true;
			const scene = this.node.findSceneNode();
			if (scene) {
				scene.layers.foreground.addChild(this.graphics);
			}
		}

		this.#updateTrajectory();
		this.#drawTracer();
	}

	#updateTrajectory() {
		this.trajectory.push(this.node.getPosition());
		while(this.trajectory.length > this.maxTrajectorySize) {
			this.trajectory.shift();
		}
	}

	#drawTracer() {
		if (this.graphics && this.fillStyle) {
			this.graphics.clear();
			this.trajectory.forEach((point, i) => {
				this.fillStyle.alpha = (i + 1) / this.trajectory.length;
				physion.utils.drawStyledCircle(this.graphics, point.x, point.y, this.tracerRadius, this.lineStyle, this.fillStyle);
			});	
		}
	}
}
