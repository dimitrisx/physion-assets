/**
 * Circle of circles script
 */
class CircleOfCircles {

	constructor(radius) {
		this.radius = radius || 5;
		this._r = this.radius * 0.1;
		this._TWO_PI = 2 * Math.PI;
	}

	async create(scene, position) {

		position = position || { x: 0, y: 0 };

		await physion.root.scriptLoader.loadD3ScaleChromatic();

		this.scene = scene;

		const R = this.radius;
		const r = this._r;

		for (var i = 2 * r; i <= R; i += 2 * r) {
			var circumference = this._TWO_PI * i;
			var n = circumference / (2 * r);
			this.createRing(position, i, Math.floor(n));
		}
	}

	createRing(position, radius, npoints) {
		const angleInc = this._TWO_PI / npoints;
		for (let a = 0; a < this._TWO_PI; a += angleInc) {
			var x = Math.cos(a) * radius;
			var y = Math.sin(a) * radius;

			const circle = new physion.CircleNode(this._r);
			circle.initNode(position.x + x, position.y + y);
			circle.fillColor = this.getColor(x, y);
			this.scene.addChild(circle);
		}
	}

	getColor(x, y) {
		if (typeof d3 !== "undefined") {
			var d = Math.sqrt(x * x + y * y);
			var t = d / this.radius;
			var d3Color = d3.color(d3.interpolateSpectral(t));
			return physion.pixiUtils.string2hex(d3Color.hex());
		} else {
			return physion.utils.randomColor();
		}
	}

}
