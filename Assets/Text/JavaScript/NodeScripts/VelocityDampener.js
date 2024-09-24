/**
 * Dampens the velocity components of a BodyNode.
 * 
 * Script written by Aiden Ravenshea.
 */
class VelocityDampener {

    // Script initializer
    constructor(node) {
        this.node = node;
        this.linearForce = 5; // Linear velocity dampening force
        this.angularForce = 5; // Angular velocity dampening force
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
