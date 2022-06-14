class QuadTracer {
    constructor(node) {
        this.node = node;

        // tracer variable
        this.initialized = false;
        this.trajectory = [];
        this.lastPosition = undefined;

        this.maxTrajectorySize = 20;
        this.graphics = physion.utils.createGraphics();
        this.lineStyle = physion.utils.createLineStyle(0);
        this.fillStyle = physion.utils.createFillStyle(node.fillColor || 0);
        this.radius = (node.radius || 1.0) * 0.8;
        this.prevAngle = Math.PI / 2;
    }

    update(delta) {
        // tracer monitoring
        if (!this.initialized) {
            this.initialized = true;
            const scene = this.node.findSceneNode();
            if (scene) {
                scene.layers.background.addChild(this.graphics);
            }
        }
        this.updateTrajectory();
        this.drawTracer();
    }

    updateTrajectory() {
        var current = this.node.getPosition();
        if (this.lastPosition)
        {
            const c0 = this.convert(current, this.lastPosition);
            this.trajectory.push([
                c0[0], c0[1]
            ]);
        }
        this.lastPosition = current;
    }

    drawTracer() {
        this.graphics.clear();

        this.trajectory.forEach((point, i) => {
            if (i != this.trajectory.length - 1) {
                this.fillStyle.alpha = (i + 1) / this.trajectory.length;
                const quadVertice = [
                    point[0], point[1], this.trajectory[i + 1][1], this.trajectory[i + 1][0]
                ];
                physion.utils.drawStyledPolygon(this.graphics, quadVertice, this.lineStyle, this.fillStyle);
            }
        });

        if (this.trajectory.length > this.maxTrajectorySize) this.trajectory.shift();
    }

    convert(pos, prevPos) {
        var v = {x: pos.x - prevPos.x, y: pos.y - prevPos.y};
        var n = Math.sqrt(v.x ** 2 + v.y ** 2);
        var nx = v.x / n, ny = v.y / n;
        
        return [{
                x: ny * this.radius + pos.x,
                y: -nx * this.radius + pos.y
            },
            {
                x: -ny * this.radius + pos.x,
                y: nx * this.radius + pos.y
            }
        ];
    }
}
