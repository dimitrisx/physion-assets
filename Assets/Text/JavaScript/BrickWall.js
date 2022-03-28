/**
 * Brick wall script
 */
class BrickWall {

	constructor(width, height) {
		this.width = width || 6;
		this.height = height || 6;

		const m = Math.min(this.width, this.height);
		this._brickWidth = m / 6;
		this._brickHeight = this._brickWidth / 2;
	}

	async create(scene, position) {

		position = position || { x: -this.width / 2, y: -this.height / 2 };

		const W = this.width;
		const H = this.height;
		const brickW = this._brickWidth;
		const brickH = this._brickHeight;

		const yCount = H / brickH;

		for (let j = 0; j < yCount; j++) {
			const y = j * brickH;

			var brick;
			let x = 0;
			while (x < W) {
				if (j % 2 !== 0 && (x === 0 || x + brickW > W)) {
					brick = this.createBrick(position.x + x - brickW / 4, position.y + y, brickW / 2, brickH);
					scene.addChild(brick);
					x += brickW / 2;
					continue;
				}

				brick = this.createBrick(position.x + x, position.y + y, brickW, brickH);
				scene.addChild(brick);
				x += brickW;
			}
		}
	}

	createBrick(x, y, w, h, color) {
		var brick = new physion.RectangleNode(w, h);
		brick.initNode(x, y);
		brick.fillColor = physion.utils.randomColor();
		brick.friction = 0.9;
		brick.restitution = 0.3;
		brick.lineWidth = 0;
		return brick;
	}
}
