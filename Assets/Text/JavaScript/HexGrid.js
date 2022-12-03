class HexGrid {
	constructor(width, height, hexagonSize, PositionX, PositionY)
	{
		this.width = width || 8;
		this.height = height || 8;
		this.hexagonSize = hexagonSize || 1;
		this.PositionX = PositionX || 0;
		this.PositionY = PositionY || 0;
	}

	async create(scene, position) {
		const a = Math.sqrt(3) / 2.0;

		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				const posx = i * 1.5 * this.hexagonSize + this.PositionX;
				const posy = (j * a * 2 + (i % 2 == 1 ? a : 0)) * this.hexagonSize + this.PositionY;

				const hex = new physion.RegularPolygonNode(this.hexagonSize, 6);
				hex.initNode(posx, posy, 30);
				hex.bodyType = "static";
				hex.friction = 0;
				hex.restitution = 1;
				scene.addChild(hex);
			}
		}
	}
}
