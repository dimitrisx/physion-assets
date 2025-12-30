/**
 * This script can be added to a Node to make it behave like a button.
 * 
 * When the button is hovered, its fill opacity (fillAlpha) will change.
 * The default "onClick" behavior is empty (do nothing). 
 * 
 * Important: This script uses the node's container (node.container) to listen for pointer
 * events and this behavior might change in future versions.
 */
class SimpleButton {

	constructor(node) {
		this.node = node;
		this.initialFillAlpha = node.fillAlpha;

		this.onPointerEnterBound = this.onPointerEnter.bind(this);
		this.onPointerLeaveBound = this.onPointerLeave.bind(this);
		this.onPointerTapBound = this.onPointerTap.bind(this);

		const container = node.container;
		container.eventMode = "static";

		container.on("pointerenter", this.onPointerEnterBound);
		container.on("pointerleave", this.onPointerLeaveBound);
		container.on("pointertap", this.onPointerTapBound);
	}

	destroy() {
		const container = this.node.container;
		container.off("pointerenter", this.onPointerEnterBound);
		container.off("pointerleave", this.onPointerLeaveBound);
		container.off("pointertap", this.onPointerTapBound);
	}

	onPointerEnter() {
		this.node.fillAlpha = this.initialFillAlpha * 0.5;
	}

	onPointerLeave() {
		this.node.fillAlpha = this.initialFillAlpha;
	}

	onPointerTap() {
		// Implement your custom "onClick" logic here
	}
}
