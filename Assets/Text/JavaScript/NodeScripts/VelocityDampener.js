/**
 * Dampens the velocity components of a BodyNode.
 * 
 * Script by Aiden Ravenshea.
 */
class VelocityDampener {

    constructor(node) {
        this.node = node;
        this.force = 5; // Dampening force
        this.scene = this.node.findSceneNode();
    }

    update(delta) {
        // Get dampening force and dampen velocity components
        const f = Math.min(1, this.force * this.scene.timeStep);
        this.node.linearVelocityX -= this.node.linearVelocityX * f;
        this.node.linearVelocityY -= this.node.linearVelocityY * f;
        this.node.angularVelocity -= this.node.angularVelocity * f;
    }
}
