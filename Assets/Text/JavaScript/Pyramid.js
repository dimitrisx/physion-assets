/**
 * This script will create a pyramid of squares
 * 
 */
class Pyramid {

	constructor(baseWidth) {
		this.baseWidth = baseWidth || 12;
	}

	async create(scene, position) {
		const w = this.baseWidth;
		const d = 0.5;	   // The dimension (width and height) of the rectangles
		let x1 = -w / 2;	// Initial left x
		let x2 = +w / 2;	// Initial right x
		let y = d / 2;    // Initial y

		const getColor = (y) => {
			if (typeof d3 !== "undefined") {
				var t = (2 * y - d) / w;
				var d3Color = d3.color(d3.interpolateTurbo(t));
				return physion.pixiUtils.string2hex(d3Color.hex());	
			} else {
				return physion.utils.randomColor();
			}
		};

		while (x1 <= x2) {
			for (let x = x1; x <= x2; x += d) {
				var r = new physion.RectangleNode(d, d);
				r.initNode(position.x + x, position.y + y, 0);
				r.fillColor = getColor(y);
				scene.addChild(r);
			}

			x1 += d;
			x2 -= d;
			y += d;
		}
	}

}
