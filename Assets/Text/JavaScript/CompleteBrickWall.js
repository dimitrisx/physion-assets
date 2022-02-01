/**
 * A complete brick wall script for generating perfect brick walls
 */
class CompleteBrickWall {

	constructor(width, height, brickScale, randomColor, drawBorder, color) {
		this.width = width || 12;
		this.height = height || 8;
    this.brickScale = brickScale || 1;
    this.randomColor = randomColor || true;
    this.drawBorder = drawBorder || true;
    this.color = color || physion.pixiUtils.string2hex("#C56726");
	}
  
	async create(scene, position) {
		for (let j = 0; j < this.height; j += this.brickScale) {
       if (j % 2 !== 0) {
        scene.addChild(this.createBrick(position.x - this.brickScale * 0.5, position.y + j, this.brickScale, this.brickScale));
      }
      if (j % 2 === 0 ^ this.width % 2 === 0) scene.addChild(this.createBrick(position.x + this.width - 1 - this.brickScale * 0.5, position.y + j, this.brickScale, this.brickScale));
      
      let shift = (j % 2 === 0) ? 0 : 1;
			for (let i = 0; i < this.width - 1; i += this.brickScale * 2) {
				var brick = this.createBrick(position.x + i + shift, position.y + j, this.brickScale * 2, this.brickScale);
				scene.addChild(brick);
			}
		}
	}

	createBrick(x, y, w, h) {
		var brick = new physion.RectangleNode(w, h);
		brick.initNode(x, y);
		brick.friction = 0.9;
		brick.lineWidth = this.drawBorder ? 1 : 0;
    if (!this.randomColor) brick.fillColor = this.color;
		return brick;
	}

}
