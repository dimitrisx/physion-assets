/**
 * Creates a spider web using circles and joints
 */
class SpiderWeb {

	constructor(layerCount, circlesPerLayer, circleRadius) {
		this.layerCount = layerCount || 8;
		this.circlesPerLayer = circlesPerLayer || 16;
		this.circleRadius = circleRadius || 0.2;
	}

	async create(scene, position) {

		const tinygradient = (await physion.utils.importTinyGradient()).default;
		this.gradient = tinygradient(["red", "orange"]);

		const layerCount = this.layerCount;
		const circlesPerLayer = this.circlesPerLayer;
		const circleRadius = this.circleRadius;
		const xOffset = position ? position.x : 0;
		const yOffset = position ? position.y : 0;

		// Create and store circles in an array
		const circles = new Array(layerCount);
		for (let layer = 0; layer < layerCount; layer++) {
			circles[layer] = new Array(circlesPerLayer);

			const R = (layer + 1) * 2.0;

			for (let i = 0; i < circlesPerLayer; i++) {
				const x = xOffset + R * Math.cos(i * 2 * Math.PI / circlesPerLayer);
				const y = yOffset + R * Math.sin(i * 2 * Math.PI / circlesPerLayer);

				const circle = new physion.CircleNode(circleRadius);
				circle.initNode(x, y, 0);
				circle.fixedRotation = true;
				circle.drawLine = false;
				circle.lineWidth = 0;
				circle.fillColor = this.getColor(layer);
				scene.addChild(circle);

				circles[layer][i] = circle;

				if (layer == (layerCount - 1)) {
					const joint = new physion.RevoluteJointNode(circle.id, "", undefined, circle.getPosition());
					joint.fillColor = 0;
					scene.addChild(joint);
				}
			}
		}

		// Create distance joints between circles
		for (let layer = 0; layer < layerCount; layer++) {
			for (let i = 0; i < circlesPerLayer; i++) {
				let a = i;
				let b = i + 1;

				if (b == circlesPerLayer) b = 0;

				const c1 = circles[layer][a];
				const c2 = circles[layer][b]
				const distance = physion.utils.calculateDistance(c1.getPosition(), c2.getPosition());

				const joint = new physion.DistanceJointNode(c1.id, c2.id, undefined, undefined, distance);
				joint.lineColor = this.getColor(layer);
				scene.addChild(joint);
			}
		}

		for (let i = 0; i < circlesPerLayer; i++) {
			for (let layer = 0; layer < layerCount - 1; layer++) {
				let a = layer;
				let b = layer + 1;

				const c1 = circles[a][i];
				const c2 = circles[b][i];
				const distance = physion.utils.calculateDistance(c1.getPosition(), c2.getPosition());

				const joint = new physion.DistanceJointNode(c1.id, c2.id, undefined, undefined, distance);
				joint.lineColor = this.getColor(layer);
				scene.addChild(joint);
			}
		}
	}


	getColor(layer) {
		var t = Math.min((layer + 1) / this.layerCount, 1);
		var tinyColor = this.gradient.rgbAt(t);
		return physion.utils.fromTinyColor(tinyColor);
	}
}
