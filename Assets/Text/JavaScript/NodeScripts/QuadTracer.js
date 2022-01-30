/*
 * Quad-based tracer script
 */

class QuadTracer
{
    constructor (node)
    {
        this.node = node;

        // tracer variable
        this.initialized = false;
		    this.trajectory = [];
		    this.maxTrajectorySize = 50;
		    this.graphics = physion.utils.createGraphics();
		    this.lineStyle = physion.utils.createLineStyle(0);
		    this.fillStyle = physion.utils.createFillStyle(node.color || 0);
		    this.radius = (node.radius || 1.0) * 0.8;
        this.prevAngle = Math.PI / 2;
    }

    update (delta)
    {
        // tracer monitoring
        if (!this.initialized) {
			      this.initialized = true;
			      const scene = this.node.findSceneNode();
			      if (scene) {
			        	scene.layers.background.addChild(this.graphics);
			      }
		    }
        this.#updateTrajectory();
        this.#drawTracer();
    }

    #updateTrajectory() {
	    	this.trajectory.push(
            {
                pos : this.node.getPosition(), 
                vel : { x : this.node.linearVelocityX, y : this.node.linearVelocityY }
            }
        );
	    	while(this.trajectory.length > this.maxTrajectorySize + 1) {
		      	this.trajectory.shift();
	    	}
	  }

    #drawTracer() {
  		  this.graphics.clear();
  	  	this.trajectory.forEach((point, i) => {
            if (i != this.trajectory.length - 1) {
	  	          this.fillStyle.alpha = (i + 1) / this.trajectory.length;
                const c0 = this.#convert(point.pos, point.vel);
                const c1 = this.#convert(this.trajectory[i + 1].pos, this.trajectory[i + 1].vel);
                const quadVertice = [
                    c0[0], c0[1], c1[1], c1[0]
                ];
  			        physion.utils.drawStyledPolygon(this.graphics, quadVertice, this.lineStyle, this.fillStyle);
            }
  		  });
  	}

    #convert(pos, vel) {
        var angle = this.prevAngle;
        if (!(vel.y == 0 && vel.x == 0)) {
            angle = Math.atan2(vel.y, vel.x);
            this.prevAngle = angle;
        }
        return [
            { 
                x : Math.cos(angle + Math.PI / 2) * this.radius + pos.x, 
                y : Math.sin(angle + Math.PI / 2) * this.radius + pos.y
            },
            {
                x : Math.cos(angle - Math.PI / 2) * this.radius + pos.x, 
                y : Math.sin(angle - Math.PI / 2) * this.radius + pos.y
            }
        ];
    }
}
