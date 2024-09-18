/**
 * Gives a BodyNode the ability to push itself forward.
 * 
 * By default, a force of 100 * the BodyNode's mass newtons will be applied and particles will appear when the T key is pressed.
 * This is configurable in the script's constructor.
 * 
 * Script written by Aiden Ravenshea.
 */
class Thruster {

    constructor(node) {
        this.node = node instanceof physion.BodyNode ? node : undefined; // Check if the node is a BodyNode
        if (!this.node) {
            const message = "Thruster can only be attached to a BodyNode";
            alert(message);
            console.warn(message);
        } else this.scene = this.node.findSceneNode();
        
        // Main thruster configuration
        this.force = 100; // Thrust force, units = newtons
        this.keybind = 84; // Activation keycode - find correct "keycodes" using https://www.toptal.com/developers/keycode
        
        // Particles configuration
        this.particles = true; // Particle toggling (All other particle settings are useless if this is off)
        this.particleSpawnRadius = 0.75; // Particle spawn radius around center point (Max. distance from thruster's center point to spawn particles), unit = meters
        this.particleSize = 0.25; // Particle size factor
        this.particleFrequency = 1 / 120; // Particle spawn frequency* (NOTE! Higher = less frequent!), unit = seconds
        this.particleLife = 1; // Particle lifetime, unit = seconds
        this.particleSpread = Math.PI / 4; // Particle flame spread, unit = radians (180 degrees = PI radians)
        this.particleLifeSpread = 0.5; // Particle lifetime spread, unit = seconds
        this.particleMovementFactor = 0.1; // Particle movement multiplier (Controls how much the particles move)

        this.particleColor = 0xFFBB00; // Particle color
        // PARTICLE COLOR HELP:
        // 0x000000 <- This is an example of a hex number. It is a number with 16 characters.
        // 0x at the beginning is just to mark that it is a hex number.
        // !! The particle color in this scene is specified with a hex number,
        // which gets converted into RGB values. !!
        // 0xRRGGBB
        // R = red value, G = green value, B = blue value
        // Each digit goes from 0 to F, like this:
        // 0 1 2 3 4 5 6 7 8 9 A B C D E F
        // 00 means minimum value, FF means maximum value.

        // Variables used by script, please don't touch!
        this.counter = 0;
    }

    update(delta) {
        if (this.node) {
            const particles = this.scene.getFilteredDescendants(physion.RectangleNode);

            for (let particle of particles) {
                if (particle.id === this.node.id || particle.life === undefined) continue;
                particle.life -= this.scene.timeStep;
                particle.alpha = particle.life / this.particleLife;
                if (particle.life <= 0) this.node.parent.removeChild(particle);
            }

            const km = physion.root.keyboardManager;

            if (km.isPressed(this.keybind)) { // Key is pressed
                // Apply force
                const direction = this.node.angle * (Math.PI / 180) + Math.PI / 2, force = this.force * this.node.body.GetMass();
                this.node.applyForce({
                    x: Math.cos(direction) * force,
                    y: Math.sin(direction) * force
                });

                // Spawn particles
                if (this.particles) {
                    this.counter += this.scene.timeStep;
                    while (this.counter >= this.particleFrequency) { // Lower timestep means slower spawning
                        const rect = this.node.getBoundingRect(),
                            size = Math.max(rect.width, rect.height) * this.particleSize,
                            particle = new physion.RectangleNode(size, size),
                            radius = Math.sqrt(Math.random()) * this.particleSpawnRadius,
                            theta = Math.random() * 2 * Math.PI,
                            flameDirection = direction + Math.PI + Math.random() * this.particleSpread - this.particleSpread / 2;
                        particle.life = this.particleLife + Math.random() * this.particleLifeSpread - this.particleLifeSpread / 2;
                        particle.x = Math.cos(theta) * radius + this.node.x;
                        particle.y = Math.sin(theta) * radius + this.node.y;
                        particle.angle = Math.random() * 360;
                        particle.linearVelocityX = Math.cos(flameDirection) * force * this.particleMovementFactor + this.node.linearVelocityX;
                        particle.linearVelocityY = Math.sin(flameDirection) * force * this.particleMovementFactor + this.node.linearVelocityY;
                        particle.angularVelocity = Math.random() * force * this.particleMovementFactor - force * this.particleMovementFactor / 2 + this.node.angularVelocity;
                        particle.fillColor = this.particleColor;
                        particle.lineAlpha = 0;
                        particle.filterCategoryBits = 0;
                        particle.filterMaskBits = 0;
                        particle.sensor = true;

                        this.node.parent.addChild(particle);
                        this.counter -= this.particleFrequency;
                    }
                }
            }
        }
    }
}
