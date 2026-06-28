/**
 * Draws a fading trail of dots behind a node as it moves, tracing its recent path.
 *
 * Parameters:
 * - maxTrajectorySize: How many points are kept in the trail before the oldest ones disappear.
 *   (default: 100)
 * - tracerRadius: The radius of each dot in the trail. (default: 0.1)
 */
class Tracer {

	static PD_maxTrajectorySize = { path: "maxTrajectorySize", defaultValue: 100, min: 1, step: 1 };
	static PD_tracerRadius = { path: "tracerRadius", defaultValue: 0.1, min: 0, step: 0.01 };

	constructor(node) {
		this.node = node;
		this.initialized = false;

		this.trajectory = [];
		this.maxTrajectorySize = Tracer.PD_maxTrajectorySize.defaultValue;

		if (typeof physion !== "undefined") {
			this.graphics = physion.utils.createGraphics();
			this.lineStyle = physion.utils.createLineStyle(0);
			this.fillStyle = physion.utils.createFillStyle(0xff0000);
		}

		this.tracerRadius = Tracer.PD_tracerRadius.defaultValue;
	}

	update(delta) {
		if (!this.initialized) {
			this.initialized = true;
			const scene = this.node.findSceneNode();
			if (scene) {
				scene.layers.foreground.addChild(this.graphics);
			}
		}

		this.updateTrajectory();
		this.drawTracer();
	}

	updateTrajectory() {
		this.trajectory.push(this.node.getPosition());
		while (this.trajectory.length > this.maxTrajectorySize) {
			this.trajectory.shift();
		}
	}

	drawTracer() {
		if (this.graphics && this.fillStyle) {
			this.graphics.clear();
			this.trajectory.forEach((point, i) => {
				this.fillStyle.alpha = (i + 1) / this.trajectory.length;
				physion.utils.drawStyledCircle(this.graphics, point.x, point.y, this.tracerRadius, this.lineStyle, this.fillStyle);
			});
		}
	}
}
