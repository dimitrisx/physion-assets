/**
 * Dampens the velocity components of a BodyNode.
 * 
 * Script by Aiden Ravenshea.
 */
class VelocityDampener {

    constructor(node) {
        this.node = node;
        this.linearForce = 5; // Linear velocity dampening force
        this.angularForce = 5; // Angular velocity dampening force
        this.scene = this.node.findSceneNode();
    }

    update(delta) {
        // Get dampening forces and dampen velocity components
        const fv = Math.min(1, this.linearForce * this.scene.timeStep);
        this.node.linearVelocityX -= this.node.linearVelocityX * fv;
        this.node.linearVelocityY -= this.node.linearVelocityY * fv;
        this.node.angularVelocity -= this.node.angularVelocity * Math.min(1, this.angularForce * this.scene.timeStep);
    }
}
