/**
 * Creates balanced dominos
 */
class BalancedDominos {

	constructor(size) {
		this.size = size || 5;
	}

	async create(scene, position) {

		position = position || { x: 0, y: 0 };

		const s = this.size;
		const dW = 0.25;	// Domino width
		const dH = 1.0;	// Domino height

		let startX = -s * dH;
		let endX = s * dH;

		// Helper function for creating a domino
		const createDomino = (x, y, w, h) => {
			var rectangle = new physion.RectangleNode();
			rectangle.initNode(x, y, 0);
			rectangle.fillColor = physion.utils.randomColor();
			rectangle.width = w;
			rectangle.height = h;
			return rectangle;
		};

		let y = dH / 2;

		// eslint-disable-next-line 
		while (true) {
			for (let x = startX; x <= endX; x += dH) {
				const a = createDomino(position.x + x, position.y + y, dW, dH);
				scene.addChild(a);

				if (x != endX) {
					const b = createDomino(position.x + x + dH / 2.0, position.y + y + (dH + dW) / 2.0, dH, dW);
					scene.addChild(b);
				}
			}

			startX += dH / 2.0;
			endX -= dH / 2.0;
			y += dH + dW;

			if (startX > endX) {
				break;
			}
		}
	}
}
