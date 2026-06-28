/**
 * Makes a joint snap apart when too much force or torque is applied to it.
 *
 * While intact, the joint can be colored to show how close it is to breaking (black means no
 * strain, red means it's about to break).
 *
 * Parameters:
 * - forceThreshold: Maximum force the joint can withstand before breaking. Set to 0 to disable
 *   breaking by force. (default: 0.2)
 * - torqueThreshold: Maximum torque the joint can withstand before breaking. Set to 0 to disable
 *   breaking by torque. (default: 0.2)
 * - visualize: Which kind of strain to show with color: Force, Torque, or None. (default: Force)
 *
 * Requirements: Must be attached to a joint node.
 */
class BreakableJoint {

	static PD_forceThreshold = { path: "forceThreshold", defaultValue: 0.2, min: 0, step: 0.01 }; // A zero value means that the joint won't break by excessive force.
	static PD_torqueThreshold = { path: "torqueThreshold", defaultValue: 0.2, min: 0, step: 0.01 }; // A zero value means that the joint won't break by excessive torque.
	static PD_visualize = {
		path: "visualize",
		defaultValue: "force",
		editor: "Select",
		selectOptions: [
			{ value: "force", label: "Force" },
			{ value: "torque", label: "Torque" },
			{ value: "", label: "None" },
		],
	};

	constructor(node) {
		this.node = node instanceof physion.JointNode ? node : undefined;
		if (!this.node) {
			console.warn("BreakableJoint can only be attached to a JointNode");
		}

		this.forceThreshold = BreakableJoint.PD_forceThreshold.defaultValue;
		this.torqueThreshold = BreakableJoint.PD_torqueThreshold.defaultValue;
		this.visualize = BreakableJoint.PD_visualize.defaultValue;
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
