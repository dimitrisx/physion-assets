/*
  Grid generator for Teritorry Wars or Multiply || Release or stuffs.
  Written by Box.
*/

class TeritorryGrid
{
  constructor (width, height, boxSize, x, y)
  {
    this.w = width || 8;
    this.h = height || 8;
    this.b = boxSize || 1;
    this.x = x || 0;
    this.y = y || 0;
  }
  
  async create (scene, pos)
  {
    for (let i = 0; i < w; i++) {
	  	for (let j = 0; j < h; j++) {
	  		createBox(i, j);
	  	}
	  }
  }
  
  createBox (i, j)
  {
    const posx = (i - w / 2) * b + b / 2 + x;
		const posy = (j - h / 2) * b + b / 2 + y;
		const f = 1.001;
		const box = new physion.RectangleNode(b * f, b * f);
		box.initNode(posx, posy);
		box.bodyType = "Static";
		box.fillColor = physion.pixiUtils.string2hex("#606060");
		box.friction = 0;
		box.restitution = 1;
		box.lineAlpha = 0;
		physion.root.scene.addChild(box);
  }
}
