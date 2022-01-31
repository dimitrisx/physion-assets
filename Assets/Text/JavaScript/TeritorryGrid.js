/*
  Grid generator for Teritorry Wars or Multiply || Release or stuffs.
  Written by Box.
*/
class TeritorryGrid {
    constructor(width, height, boxSize, x, y, drawBorder, overlapping) {
        this.width = width || 8;
        this.height = height || 8;
        this.boxSize = boxSize || 1;
        this.x = x || 0;
        this.y = y || 0;
        this.drawBorder = drawBorder || true;
        this.overlapping = overlapping || true
    }
    async create() {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                const posx = (i - this.width / 2) * this.boxSize + this.boxSize / 2 + this.x;
                const posy = (j - this.height / 2) * this.boxSize + this.boxSize / 2 + this.y;
                const f = 1 + (this.overlapping ? this.boxSize / 1000.0 : 0);
                const box = new physion.RectangleNode(this.boxSize * f, this.boxSize * f);
                box.initNode(posx, posy);
                box.bodyType = "Static";
                box.friction = 0;
                box.restitution = 1;
                box.lineAlpha = (this.drawBorder ? 1 : 0);
                physion.root.scene.addChild(box);
            }
        }
    }
}
