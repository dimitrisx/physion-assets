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

		const tinygradient = (await physion.utils.importTinyGradient()).default;
		this.gradient = tinygradient(["red", "orange"]);

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
		var d = Math.sqrt(x * x + y * y);
		var t = Math.min(d / this.radius, 1);
		var tinyColor = this.gradient.rgbAt(t);
		return physion.utils.fromTinyColor(tinyColor);
	}

}
