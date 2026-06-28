/**
 * Gradually slows down a body's linear and angular velocity over time, like friction or drag.
 *
 * Parameters:
 * - linearForce: How quickly linear (positional) velocity is dampened. Higher values stop the
 *   body faster. (default: 5)
 * - angularForce: How quickly angular (rotational) velocity is dampened. Higher values stop
 *   rotation faster. (default: 5)
 *
 * Script written by Aiden Ravenshea.
 */
class VelocityDampener {

    static PD_linearForce = { path: "linearForce", defaultValue: 5, min: 0, step: 0.1 }; // Linear velocity dampening force
    static PD_angularForce = { path: "angularForce", defaultValue: 5, min: 0, step: 0.1 }; // Angular velocity dampening force

    // Script initializer
    constructor(node) {
        this.node = node;
        this.linearForce = VelocityDampener.PD_linearForce.defaultValue;
        this.angularForce = VelocityDampener.PD_angularForce.defaultValue;
        this.scene = undefined;
    }

    // Update loop
    update(delta) {
        if (this.scene === undefined) this.scene = this.node.findSceneNode(); // Check if we haven't found the scene yet
        if (this.scene) {
            // Get dampening forces and dampen velocity components
            const fv = Math.min(1, this.linearForce * this.scene.timeStep),
                fva = Math.min(1, this.angularForce * this.scene.timeStep);
            this.node.linearVelocityX -= this.node.linearVelocityX * fv;
            this.node.linearVelocityY -= this.node.linearVelocityY * fv;
            this.node.angularVelocity -= this.node.angularVelocity * fva;
        }
    }
}
