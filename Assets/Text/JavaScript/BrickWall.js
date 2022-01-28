/**
 * Brick wall script
 */
class BrickWall {

	constructor(width, height) {
		this.width = width || 12;
		this.height = height || 8;

		const m = Math.min(this.width, this.height);
		this._brickWidth = m / 6;
		this._brickHeight = this._brickWidth / 2;
	}

	async create(scene, position) {
		const W = this.width;
		const H = this.height;
		const brickW = this._brickWidth;
		const brickH = this._brickHeight;

		const yCount = H / brickH;

		for (let j = 0; j < yCount; j++) {
			const y = j * brickH;

			let x = (j % 2 === 0) ? 0 : brickW / 2;
			while (x < W) {
				var brick = this.createBrick(position.x + x, position.y + y, brickW, brickH);
				scene.addChild(brick);
				x += brickW;
			}
		}
	}

	createBrick(x, y, w, h, color) {
		var brick = new physion.RectangleNode(w, h);
		brick.initNode(x, y);
		brick.friction = 0.9;
		brick.lineWidth = 0;
		return brick;
	}

}
