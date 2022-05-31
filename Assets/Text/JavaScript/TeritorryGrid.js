/*
  Grid generator for Teritorry Wars or Multiply or Release or stuffs.
  Written by Box.
*/
class TeritorryGrid {
	constructor(width, height, boxSize, x, y, drawBorder) {
		this.width = width || 8;
		this.height = height || 8;
		this.boxSize = boxSize || 1;
		this.x = x || 0;
		this.y = y || 0;
		this.drawBorder = drawBorder || true;
	}
	async create(scene, position) {
		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				const posx = (i - this.width / 2) * this.boxSize + this.boxSize / 2 + this.x;
				const posy = (j - this.height / 2) * this.boxSize + this.boxSize / 2 + this.y;
				const box = new physion.RectangleNode(this.boxSize, this.boxSize);
				box.initNode(posx, posy);
				box.bodyType = "static";
				box.friction = 0;
				box.restitution = 1;
				box.lineAlpha = (this.drawBorder ? 1 : 0);
				scene.addChild(box);
			}
		}
	}
}
