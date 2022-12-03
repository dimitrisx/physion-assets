class SquareGrid {
	constructor(width, height, boxSize, PositionX, PositionY) {
		this.width = width || 8;
		this.height = height || 8;
		this.boxSize = boxSize || 1;
		this.PositionX = PositionX || 0;
		this.PositionY = PositionY || 0;
	}
	async create(scene, position) {
		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				const posx = (i - this.width / 2) * this.boxSize + this.boxSize / 2 + this.PositionX;
				const posy = (j - this.height / 2) * this.boxSize + this.boxSize / 2 + this.PositionY;
				const box = new physion.RectangleNode(this.boxSize, this.boxSize);
				box.initNode(posx, posy);
				box.bodyType = "static";
				box.friction = 0;
				box.restitution = 1;
				scene.addChild(box);
			}
		}
	}
}
