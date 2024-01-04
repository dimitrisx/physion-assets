/**
 * This script can be attached to a JointNode to make it breakable.
 * 
 * The JointNode will break when an excessive force and/or torque is applied to it. When this happens
 * the script will break the joint (i.e. remove it from its parent).
 * 
 * By default, the force on the joint will be visualized. (red color when the joint is about to break
 * and black if no force or torque is applied to the joint)
 */
class BreakableJoint {

	constructor(node) {
		this.node = node instanceof physion.JointNode ? node : undefined;
		if (!this.node) {
			console.warn("BreakableJoint can only be attached to a JointNode");
		}

		this.forceThreshold = 0.2;		// Force threshold. A zero value means that the joint won't break by excessive force.
		this.torqueThreshold = 0.2;	// Torque threshold. A zero value means that the joint won't break by excessive torque.
		this.visualize = "force"; 		// possible values: "force", "torque" or ""
	}

	update(delta) {
		if (this.node && this.node.parent) {
			const inv_dt = 1 / delta;
			const forceVector = this.node.getReactionForce(inv_dt);
			const force = Math.sqrt(forceVector.x * forceVector.x + forceVector.y * forceVector.y);
			const torque = this.node.getReactionTorque(inv_dt);

			// Visualization (optional)
			if (this.visualize) {
				const red = (this.visualize === "force")
					? force / this.forceThreshold
					: torque / this.torqueThreshold;
				const color = physion.pixiUtils.rgb2hex([Math.min(1, red), 0, 0]);
				this.node.fillColor = color;
				this.node.lineColor = color;
			}

			// Check thresholds and remove (break) the joint if necessary.
			const excessiveForce = this.forceThreshold && force > this.forceThreshold;
			const excessiveTorque = this.torqueThreshold && torque > this.torqueThreshold;

			if (excessiveForce || excessiveTorque) {
				this.node.parent.removeChild(this.node);
			}
		}
	}

}
