/*
  Grid generator (filled with hexagons instead of rects) for Teritorry Wars or Multiply or Release or stuffs.
  Written by Box.
*/
class TeritorryGrid
{
	constructor(width, height, hexSize, x, y, drawBorder) //, isFlatTop) 
    	{
		this.width = width || 8;
		this.height = height || 8;
		this.hexSize = hexSize || 1;
		this.x = x || 0;
		this.y = y || 0;
		this.drawBorder = drawBorder || true;
        	// this.isFlatTop = isFlatTop || true;
	}

	async create(scene, position) 
	{
        	const a = Math.sqrt(3) / 2.0;

		for (let i = 0; i < this.width; i++) 
      	  	{
			for (let j = 0; j < this.height; j++) 
            		{
				const posx = i * 1.5 * this.hexSize + this.x;
				const posy = (j * a * 2 + (i % 2 == 1 ? a : 0)) * this.hexSize + this.y;

				const hex = new physion.PolygonNode();
                		hex.initNode(posx, posy);

                		var array = [[]];
                		for (var z = 0; z < 6; z++)
                		{
                		    	array[0].push({
                		        	x: Math.cos(z * Math.PI / 3.0),
                 		       		y: Math.sin(z * Math.PI / 3.0)
                    			})
                		}
                		hex.polygons = array;
				hex.bodyType = "static";
				hex.friction = 0;
				hex.restitution = 1;
				hex.lineAlpha = (this.drawBorder ? 1 : 0);
				scene.addChild(hex);
			}
		}
	}
}
